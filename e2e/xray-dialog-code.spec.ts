import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The dialog x-ray is a tweak surface: under its card, the code that opens exactly the dialog you have
// handled (a trigger, the Dialog, its title, field and actions), which you can copy, and which opens a
// real dialog whose plate is the specimen's. At defaults it is the dialog as the agent guide composes it.

/** Opens the dialog's x-ray from the table, the way a person does, and waits for the flight to land. */
async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="dialog"]');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-float="dialog"] .mu-dialog').click({ force: true });
  await page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
  return page.locator('.xr-overlay .xr');
}
/** Opens the x-ray on the Dialog page, where a real dialog can open over the page and the site's banner stays reachable. */
async function openPage(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/dialog');
  await page.evaluate(() => document.fonts.ready);
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const num = async (card: Locator, name: string) => Number(await value(card, name).textContent());
/** The snippet's own names: its component, and its stylesheet when it has one. */
const named = (react: string) => ({ component: /export function (\w+)/.exec(react)![1], sheet: /import '\.\/([\w-]+\.css)'/.exec(react)?.[1] });
const code = (xray: Locator) => xray.locator('.xr-code pre code');
/** The code as written, without the line numbers drawn beside it. */
const text = (xray: Locator) => code(xray).evaluate((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll('.ln').forEach((n) => n.remove()); return c.textContent ?? ''; });
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}
async function step(page: Page, card: Locator, name: string, key: string, times = 1) {
  await readout(card, name).focus();
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
}

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

/** Runs the React snippet (and its stylesheet) in the page, beside the specimen: its trigger, which opens the real dialog. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  const js = transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css, name }) => {
    const zoomed = well.firstElementChild as HTMLElement;
    const mount = document.createElement('div');
    mount.id = 'snippet';
    mount.style.marginTop = '16px';
    zoomed.after(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, name);
  }, { js, css: snippet.CSS ?? '', name: named(snippet.React).component });
  return xray.locator('#snippet .mu-button');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check-dialog');
  fs.mkdirSync(dir, { recursive: true });
  const { component, sheet } = named(snippet.React);
  const file = path.join(dir, `${component}.tsx`);
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS && sheet) fs.writeFileSync(path.join(dir, sheet), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'], '@unlocalhosted/metalui/icons': ['../../packages/metalui/src/icons/index.tsx'] },
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

/** Two plates, pixel for pixel: the share of pixels that differ clearly, and the mean difference. */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const px = (im: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d')!; g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const pa = px(ia), pb = px(ib);
    if (ia.width !== ib.width || ia.height !== ib.height) return { off: 1, mean: 255, size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
    let off = 0, sum = 0; const n = ia.width * ia.height;
    for (let i = 0; i < n * 4; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      sum += d; if (d > 40) off++;
    }
    return { off: off / n, mean: sum / n, size: `${ia.width}x${ia.height}` };
  }, [a.toString('base64'), b.toString('base64')]);
}

test('at defaults the code is the dialog as the guide composes it: a trigger, the popup, its title, field and actions', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`import { useState } from 'react';`);
  expect(react).toContain(`import { Button, Dialog, Field } from '@unlocalhosted/metalui';`);
  expect(react).toContain(`<Button onClick={() => setOpen(true)}>Rename canvas…</Button>`);
  expect(react).toContain(`<Dialog open={open} onOpenChange={setOpen}>`);
  expect(react).toContain(`<Dialog.Popup aria-label="Rename canvas">`);
  expect(react).toContain(`<Dialog.Title>Rename canvas</Dialog.Title>`);
  expect(react).toContain(`<Field size="regular"><Field.Input defaultValue="Trip notes" aria-label="Name" /></Field>`);
  expect(react).toContain(`<Button cap="primary" onClick={() => setOpen(false)}>Rename</Button>`);
  expect(react).not.toMatch(/style=|className=|--mu-|\.css|CSSProperties/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalDialog(isPresented: $open, title: "Rename canvas") {');
  expect(swift).toContain('MetalButton("Rename", cap: .primary) { open = false }');
  expect(swift).not.toMatch(/not per-instance/);
});

test('every tweak reaches the code: its place and drop on the popup, its plate per colorway, the sheet page-wide and said so', async ({ page }) => {
  // the strict type-check compiles the library's source alongside the snippet: seconds, more under a loaded machine
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // where it sits is one value in every colorway: the popup's own variable, on its style
  await part(xray, 'Place');
  await step(page, card, 'From the top', 'ArrowUp');
  await expect(code(xray)).toContainText(`'--mu-r-dialog-self-top': '17vh'`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import { useState, type CSSProperties } from 'react';`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // how far it drops in is the enter variable, in points
  await part(xray, 'Opening');
  await step(page, card, 'Drops', 'ArrowUp');
  await expect(code(xray)).toContainText(`'--mu-r-dialog-self-enter-y': '-7px'`);
  // the sheet is the scrim's colour, which the library portals to the body: a stylesheet on the root, and the code says it is page-wide
  await part(xray, 'Sheet');
  await step(page, card, 'Dim', 'ArrowUp');
  await expect(code(xray)).toContainText(`import './rename-canvas.css';`);
  expect(await text(xray)).not.toContain('className=');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('page-wide');
  expect(sheet).toContain(':root, [data-mu-colorway="bone"] {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] {');
  expect(sheet.match(/--mu-r-dialog-scrim-color:/g)).toHaveLength(2);
  expect(sheet).not.toContain('.rename-canvas');
  // its height is the plate's shadow stack: colours, so a block per colorway on the popup's class, derived from the recipe and said so
  await part(xray, 'Shadow');
  await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -14);
  await expect(code(xray)).toContainText('className="rename-canvas"');
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from the surface recipe for height');
  expect(sheet).toContain('.rename-canvas, [data-mu-colorway="bone"] .rename-canvas {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .rename-canvas {');
  expect(sheet.match(/--mu-r-surface-self-plate-shadow:/g)).toHaveLength(2);
  expect(sheet).not.toContain('--mu-r-surface-self-plate-background');
  // a layer off is in the stack; the plate off is its fill
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Far shadow' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('far shadow off');
  await card.getByRole('switch', { name: 'Plate' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet.match(/--mu-r-surface-self-plate-background:/g)).toHaveLength(2);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the words, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalDialog(isPresented: $open, title: "Rename canvas") {');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the guide's dialog
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`<Dialog.Popup aria-label="Rename canvas">`);
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Place');
  await step(page, xray.locator('.xr-card'), 'From the top', 'ArrowUp', 2);
  const shown = await text(xray);
  expect(shown).toContain('18vh');
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} opens a real dialog whose plate is the specimen's, in every colorway`, async ({ page }) => {
    test.slow();
    const xray = await openPage(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Place');
    await step(page, card, 'From the top', 'ArrowUp', 2);
    await part(xray, 'Shadow');
    await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -14);
    await part(xray, 'Sheet');
    await step(page, card, 'Dim', 'ArrowUp');
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Far shadow' }).click();
    // the config, as its readouts say it
    await part(xray, 'Place'); const top = await num(card, 'From the top');
    await part(xray, 'Shadow'); const lift = await num(card, 'Height');
    await part(xray, 'Sheet'); const dim = (await num(card, 'Dim')) / 100;
    const seed = { top, lift, dim, on: [true, true, true, true, true, true, true, true, false] };
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const trigger = await render(page, xray, snippet);
    await expect(trigger).toHaveText('Rename canvas…');
    const popup = page.locator('[role="dialog"].mu-dialog');
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      // the snippet's trigger opens the real dialog: it sits where the code puts it, and settles
      await trigger.click();
      await expect(popup).toBeVisible();
      await expect(popup).toHaveCSS('opacity', '1');
      await popup.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
      // the real dialog moves focus into its field; the plates are compared at rest, so the ring goes
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await expect(popup).toHaveAttribute('style', new RegExp(`--mu-r-dialog-self-top:\\s*${top}vh`));
      const at = (await popup.boundingBox())!;
      expect(Math.abs(at.y - (900 * top) / 100)).toBeLessThan(1);
      // the scrim dims the page as the sheet does, page-wide
      const scrim = await page.locator('.mu-dialog-scrim').evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(scrim).toMatch(new RegExp(`, ${dim}\\)$`));
      // the same plate, mounted over the same backdrop: the specimen's face at full size, in the popup's place
      await page.evaluate(async ({ seed, at }) => {
        const host = document.createElement('div');
        host.id = 'lab';
        host.style.cssText = `position: fixed; left: ${at.x}px; top: ${at.y}px; z-index: 90;`;
        document.body.append(host);
        const lab = await import('/src/ui/xray/dialog-lab.ts');
        lab.mountFace(seed, host);
      }, { seed, at });
      const face = page.locator('#lab .mu-dialog');
      await expect(face).toBeVisible();
      await page.mouse.move(0, 0);
      await page.screenshot({ path: capture(`xray-code-dialog-${start}-in-${colorway}`), clip: { x: at.x - 40, y: at.y - 40, width: at.width + 80, height: at.height + 80 } });
      const [a, b] = await Promise.all([popup.boundingBox(), face.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      // one at a time over the same backdrop: the real plate, then the face
      await face.evaluate((el) => { el.closest<HTMLElement>('#lab')!.style.visibility = 'hidden'; });
      const real = await popup.screenshot();
      await popup.evaluate((el) => { el.style.visibility = 'hidden'; });
      await face.evaluate((el) => { el.closest<HTMLElement>('#lab')!.style.visibility = ''; });
      const shot = await face.screenshot();
      const d = await compare(page, real, shot);
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      expect(d.off).toBeLessThan(0.01);
      expect(d.mean).toBeLessThan(1.5);
      await popup.evaluate((el) => { el.style.visibility = ''; });
      await page.evaluate(() => document.getElementById('lab')?.remove());
      await page.keyboard.press('Escape');
      await expect(popup).toHaveCount(0);
    }
  });
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // the table's objects overlap at this width, so the dialog takes the click itself
  await page.locator('[data-float="dialog"] .mu-dialog').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('Rename canvas');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
