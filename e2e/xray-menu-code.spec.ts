import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The menu x-ray is a tweak surface: under its card, the code for exactly the config you have handled,
// which you can copy, and which opens a real menu that looks as the specimen does. At defaults it is the
// way the agent guide builds a menu (a trigger, a heading, rows with glyphs and keys, a line, a red row)
// and nothing more. The plate's x-ray still is the library's own; the code is the library's real Menu.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/menu');
  await page.evaluate(() => document.fonts.ready);
  const xray = page.locator('#x-ray .xr');
  await xray.scrollIntoViewIfNeeded();
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const code = (xray: Locator) => xray.locator('.xr-code pre code');
/** The code as written, without the line numbers drawn beside it. */
const text = (xray: Locator) => code(xray).evaluate((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll('.ln').forEach((n) => n.remove()); return c.textContent ?? ''; });

/** The panel's tabs, as files: the React, the stylesheet when there is one, the SwiftUI. */
async function files(xray: Locator) {
  const out: Record<string, string> = {};
  for (const name of ['React', 'CSS', 'SwiftUI']) {
    const tab = xray.getByRole('tab', { name });
    if (!(await tab.count())) continue;
    await tab.click();
    out[name] = await text(xray);
  }
  await xray.getByRole('tab', { name: 'React' }).click();
  return out;
}

/** Runs the React snippet (and its stylesheet) in the page, next to the specimen: its trigger lands in the well. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  const js = transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css }) => {
    const zoomed = well.firstElementChild as HTMLElement;
    const mount = document.createElement('div');
    mount.id = 'snippet';
    zoomed.after(mount);
    const lab = await import('/src/ui/xray/menu-lab.ts');
    lab.runSnippet(js, css, mount);
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet button');
}

/** Opens the snippet's real menu, lights its first row as a pointer would, and pins the popup in view at the specimen's zoom. */
async function openSnippetMenu(page: Page, trigger: Locator, zoom: string) {
  await trigger.click();
  const plate = page.locator('.mu-menu-positioner .mu-menu');
  await expect(plate).toBeVisible();
  await plate.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  // the popup is portalled and placed by the library, which keeps writing its place inline as the page moves: for the
  // comparison a stylesheet holds it still, mid-viewport, magnified as the specimen is
  await plate.evaluate((el, zoom) => {
    el.style.zoom = zoom;
    const r = el.getBoundingClientRect();
    const pin = document.getElementById('pin-menu') ?? Object.assign(document.head.appendChild(document.createElement('style')), { id: 'pin-menu' });
    pin.textContent = `.mu-menu-positioner { position: fixed !important; top: ${Math.max(0, (innerHeight - r.height) / 2)}px !important; left: ${Math.max(0, (innerWidth - r.width) / 2)}px !important; transform: none !important; }`;
  }, zoom);
  // the pointer comes to rest on the first row, as a hand would
  const first = plate.locator('.mu-menu-row').first();
  const r = (await first.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2 - 2);
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await expect(first).toHaveAttribute('data-highlighted', '');
  await expect(plate.locator('.mu-indicator')).toHaveCSS('visibility', 'visible');
  await plate.locator('.mu-indicator').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  return plate;
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'NoteActions.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'note-actions.css'), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'], '@unlocalhosted/metalui/icons': ['../../packages/metalui/src/icons.ts'] },
  });
  // the snippet's own errors: the library's source is compiled alongside it only to give it its real types
  return ts.getPreEmitDiagnostics(program).filter((d) => !d.file || path.resolve(d.file.fileName) === file).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

/** Switches the page's colorway through the site's own switch. */
async function colorway_(page: Page, to: string) {
  await page.getByRole('banner').getByRole('radiogroup', { name: 'Colorway' }).getByRole('radio', { name: to[0].toUpperCase() + to.slice(1), exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mu-colorway', to);
  await page.waitForTimeout(250);
}

/** Two plates, pixel for pixel over the box they share: the share of pixels that differ clearly, and the mean difference. */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    // a plate's edge sits on a fraction of a pixel, and the two clips round it out differently: the shared box is compared
    const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    if (Math.abs(ia.width - ib.width) > 2 || Math.abs(ia.height - ib.height) > 2) return { off: 1, mean: 255, size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
    const px = (im: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!; g.drawImage(im, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const pa = px(ia), pb = px(ib);
    let off = 0, sum = 0; const n = w * h;
    for (let i = 0; i < n * 4; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      sum += d; if (d > 40) off++;
    }
    return { off: off / n, mean: sum / n, size: `${w}x${h}` };
  }, [a.toString('base64'), b.toString('base64')]);
}

const readout = (card: Locator, label: string) => card.locator('.ed-readout').filter({ hasText: label });
const step = async (page: Page, card: Locator, label: string, key: string, times: number) => {
  await readout(card, label).focus();
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
};

test('at defaults the code is the guide\'s menu: a trigger, a heading, rows, a line, a red row, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`import { Button, Menu, MenuItem, MenuSeparator } from '@unlocalhosted/metalui';`);
  expect(react).toContain(`import { Icon } from '@unlocalhosted/metalui/icons';`);
  expect(react).toContain('<Menu trigger={<Button>Actions</Button>} heading="NOTE · 3 LINES">');
  expect(react).toContain('<MenuItem onSelect={onTask} icon={<Icon name="task" size={14} />} shortcut="⌘T">Make a task</MenuItem>');
  expect(react).toContain('<MenuSeparator />');
  expect(react).toContain('<MenuItem onSelect={onDelete} icon={<Icon name="trash" size={14} />} shortcut="⌫" danger>Delete</MenuItem>');
  expect(react).not.toMatch(/style=|className=|--mu-|\.css|CSSProperties|portal/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalButton("Actions") { open = true }');
  expect(swift).toContain('.metalMenu(isPresented: $open, heading: "NOTE · 3 LINES", items: [');
  expect(swift).toContain('MetalMenuItem("Make a task", icon: .task, shortcut: "⌘T", action: onTask),');
  expect(swift).toContain('.separator,');
  expect(swift).toContain('MetalMenuItem("Delete", icon: .trash, shortcut: "⌫", danger: true, action: onDelete),');
  expect(swift).not.toMatch(/recipe|per-instance/);
});

test('every tweak reaches the code: the heading and the line as what is there, tunables through the menu\'s own class, colours per colorway', async ({ page }) => {
  // a dozen handled tweaks, each read back from the code: about 11 s alone
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the heading and the line are real parts: off, they are not in the code
  await part(xray, 'Heading');
  await card.getByRole('switch', { name: 'Heading' }).click();
  await expect(code(xray)).toContainText('<Menu trigger={<Button>Actions</Button>}>');
  await part(xray, 'Line');
  await card.getByRole('switch', { name: 'Line' }).click();
  expect(await text(xray)).not.toContain('MenuSeparator');
  // a tunable is a stylesheet on the class the menu takes, so only this menu changes
  await part(xray, 'Shape');
  await step(page, card, 'Space around the rows', 'ArrowUp', 2);
  await expect(code(xray)).toContainText(`import './note-actions.css';`);
  await expect(code(xray)).toContainText('className="note-actions"');
  expect(await text(xray)).not.toMatch(/style=|--mu-/);
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('.note-actions {\n  --mu-r-menu-self-pad: 7px;\n  --mu-r-menu-self-radius: 17px;\n}');
  expect(sheet).not.toContain('.mu-menu');
  await step(page, card, 'Row corners', 'ArrowUp', 2);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('--mu-r-menu-row-radius: 11px;');
  expect(sheet).toContain('--mu-r-menu-self-radius: 18px;');
  // the gap to the button is the menu's offset prop, not a stylesheet
  await part(xray, 'Glass');
  await step(page, card, 'Gap to the button', 'ArrowUp', 2);
  await expect(code(xray)).toContainText('offset={8}');
  sheet = (await files(xray)).CSS!;
  expect(sheet).not.toContain('--mu-menu-offset');
  // a layer off is the plate's colours: one set per colorway, derived from the recipe and said so
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Rim' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for rim off');
  expect(sheet).toContain('.note-actions, [data-mu-colorway="bone"] .note-actions {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .note-actions {');
  expect(sheet.match(/--mu-r-menu-self-shadow:/g)).toHaveLength(2);
  expect(sheet).not.toContain('--mu-r-menu-self-background');
  await card.getByRole('switch', { name: 'Frost' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet.match(/--mu-r-menu-self-background: transparent;/g)).toHaveLength(2);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: what is there, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('.metalMenu(isPresented: $open, items: [');
  expect(swift).not.toContain('.separator');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the plain plate, the heading and the line as you had them
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  expect(await text(xray)).not.toMatch(/\.css|--mu-|portal|heading=|MenuSeparator/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await step(page, xray.locator('.xr-card'), 'Space around the rows', 'ArrowUp', 3);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} opens a real menu that looks as the specimen does, in every colorway`, async ({ page }) => {
    // two compiles, a handful of tweaks, a real menu opened twice and four screenshots: about 14 s alone
    test.slow();
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Shape');
    await step(page, card, 'Space around the rows', 'ArrowUp', 4);
    await step(page, card, 'Row corners', 'ArrowUp', 4);
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Contact' }).click();
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const trigger = await render(page, xray, snippet);
    const specimen = card.locator('.ed-specimen > div:not(#snippet) .mu-menu');
    const zoom = await card.locator('.ed-specimen > div:not(#snippet)').first().evaluate((el) => (el as HTMLElement).style.zoom);
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      await page.mouse.move(0, 0);
      await specimen.scrollIntoViewIfNeeded();
      const shot = await specimen.screenshot();
      const rendered = await openSnippetMenu(page, trigger, zoom);
      await expect(rendered.locator('.mu-menu-row')).toHaveCount(3);
      await expect(rendered.locator('.mu-menu-heading')).toHaveText('NOTE · 3 LINES');
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      // the stacks themselves, not just how they look: the same computed fill, shadow, space and corners in this colorway
      for (const prop of ['background-color', 'box-shadow', 'padding-top', 'border-top-left-radius']) expect(await rendered.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop)).toBe(await specimen.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop));
      expect(await rendered.locator('.mu-menu-row').first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe(await specimen.locator('.mu-menu-row').first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius));
      const d = await compare(page, shot, await rendered.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-menu-${start}-in-${colorway}`), clip: (await rendered.boundingBox())! });
      expect(d.off).toBeLessThan(0.01);
      // the plate is frosted: it shows a little of what is under it, which is not the same at the two places it sits
      expect(d.mean).toBeLessThan(3);
      // closed again, nothing runs, and the trigger has the focus back (the library's own behaviour)
      await page.keyboard.press('Escape');
      await expect(page.locator('.mu-menu-positioner')).toHaveCount(0);
    }
  });
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  await page.locator('[data-float="menu"] .mu-menu-heading').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('heading="NOTE · 3 LINES"');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
