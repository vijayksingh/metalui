import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The folder x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the agent
// guide's example (a name, a count, its blocks) and nothing more. There is no MetalFolder in the
// Swift package yet, and the SwiftUI tab says so instead of inventing one.

const DEFAULT = '<Folder name="poster refs" count={3} peeks={PEEKS} />';

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/folder');
  await page.evaluate(() => document.fonts.ready);
  // the Unfold section's DialKit timeline is a fixed panel across the bottom of the page: out of the stills' way
  await page.addStyleTag({ content: '.dialkit-timeline { display: none !important; }' });
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (xray: Locator, name: string) => xray.locator('.xr-card .ed-readout').filter({ has: xray.page().locator('b', { hasText: new RegExp(`^${name}$`) }) });
/** Steps a readout with the arrow keys, as a keyboard user does. */
async function step(xray: Locator, name: string, key: string, times: number) {
  const r = readout(xray, name);
  await r.scrollIntoViewIfNeeded();
  await r.focus();
  for (let i = 0; i < times; i++) await xray.page().keyboard.press(key);
}
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

/** Runs the React snippet in the page, next to the specimen, at the specimen's zoom and on its well. */
async function render(xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  const js = transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css }) => {
    const zoomed = well.firstElementChild as HTMLElement;
    const mount = document.createElement('div');
    mount.id = 'snippet';
    mount.style.zoom = zoomed.style.zoom;
    zoomed.after(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, 'PosterRefs');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-folder');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  // a folder of its own per check, so checks running side by side never write over each other
  const dir = fs.mkdtempSync(path.join(path.resolve('test-results'), 'snippet-check-folder-'));
  const file = path.join(dir, 'PosterRefs.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'poster-refs.css'), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'] },
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

/** Two stills, pixel for pixel: the share of pixels that differ clearly, and the mean difference. */
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

/** One folder with its shadows, alone in the well: the other is taken out of the layout, so each frame is the same patch of the same well. */
async function alone(page: Page, folder: Locator, other: Locator) {
  await other.evaluate((el) => { const host = (el.closest('#snippet') ?? el.closest('.ed-specimen > div')!) as HTMLElement; host.style.display = 'none'; });
  await folder.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(150);
  const box = (await folder.boundingBox())!;
  const pad = 50;
  const shot = await page.screenshot({ clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
  await other.evaluate((el) => { const host = (el.closest('#snippet') ?? el.closest('.ed-specimen > div')!) as HTMLElement; host.style.display = ''; });
  return shot;
}

/** Tunes every part of the folder: its paper, the flap, the fan, the glass, two layers, and one more block. */
async function tuneAll(xray: Locator) {
  const card = xray.locator('.xr-card');
  await part(xray, 'Paper');
  await step(xray, 'Colour', 'ArrowUp', 4);
  await part(xray, 'Flap');
  await step(xray, 'Tilt', 'ArrowUp', 6);
  await part(xray, 'Fan');
  await step(xray, 'Rise', 'ArrowUp', 5);
  await step(xray, 'Lean', 'ArrowDown', 4);
  await part(xray, 'Glass');
  await step(xray, 'Frost', 'ArrowUp', 4);
  await step(xray, 'See through', 'ArrowUp', 3);
  await part(xray, 'Drop in');
  await step(xray, 'Blocks', 'ArrowUp', 1);
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Edge' }).click();
  await card.getByRole('switch', { name: 'Count chip' }).click();
}

test('at defaults the code is the bare component: its name, count and blocks, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`import { Folder, type FolderPeek } from '@unlocalhosted/metalui';`);
  expect(react).toContain(`{ id: 'type', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },`);
  expect(react).toContain(DEFAULT);
  expect(react).not.toMatch(/style=|className=|hue=|--mu-|\.css|CSSProperties/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalFolder is not in the Swift package yet');
  expect(swift).toContain('name "poster refs", count 3, 3 peeks');
  expect(swift).not.toMatch(/struct|MetalFolder\(|recipe values/);
});

test('every tweak reaches the code: props as props, the recipe through variables on the folder', async ({ page }) => {
  // a dozen handled tweaks, two tab reads and a type-check
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the paper is a prop
  await part(xray, 'Paper');
  await step(xray, 'Colour', 'ArrowUp', 1);
  await expect(code(xray)).toContainText('hue="red"');
  expect(await text(xray)).not.toMatch(/style=|--mu-/);
  // the flap's tilt is a recipe variable: one value in every colorway, inline on the folder, and nothing else
  await part(xray, 'Flap');
  await step(xray, 'Tilt', 'ArrowUp', 6);
  await expect(code(xray)).toContainText(`'--mu-r-folder-flap-rest': '-21deg'`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import type { CSSProperties } from 'react';`);
  expect(await text(xray)).not.toContain('className=');
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the fan
  await part(xray, 'Fan');
  await step(xray, 'Rise', 'ArrowUp', 5);
  await step(xray, 'Lean', 'ArrowDown', 4);
  await expect(code(xray)).toContainText(`'--mu-r-folder-fan-rest-y-front': '-15px'`);
  await expect(code(xray)).toContainText(`'--mu-r-folder-fan-rest-r-front': '-9deg'`);
  // the glass: the frost keeps the recipe's saturation, the tint its opacity
  await part(xray, 'Glass');
  await step(xray, 'Frost', 'ArrowUp', 4);
  await expect(code(xray)).toContainText(`'--mu-r-folder-flap-frost': 'blur(8px) saturate(1.2)'`);
  await step(xray, 'See through', 'ArrowUp', 3);
  await expect(code(xray)).toContainText(`'--mu-r-folder-flap-fill-opacity': '`);
  // a layer off is the recipe value that leaves it out
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Shadow' }).click();
  await expect(code(xray)).toContainText(`'--mu-r-folder-shade-ink': 'transparent'`);
  await card.getByRole('switch', { name: 'Frost' }).click();
  await expect(code(xray)).toContainText(`'--mu-r-folder-flap-frost': 'none'`);
  expect(await text(xray)).not.toContain('blur(8px)');
  await card.getByRole('switch', { name: 'Count chip' }).click();
  await expect(code(xray)).toContainText(`'--mu-r-folder-count-background': 'transparent'`);
  await expect(code(xray)).toContainText(`'--mu-r-folder-count-shadow': 'none'`);
  // one more block in: the count and the peeks follow
  await part(xray, 'Drop in');
  await step(xray, 'Blocks', 'ArrowUp', 1);
  await expect(code(xray)).toContainText('count={4}');
  await expect(code(xray)).toContainText(`{ id: 'more-0', thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' },`);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: still no MetalFolder, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click({ force: true });
  const swift = await text(xray);
  expect(swift).toContain('count 4, 4 peeks, hue .red');
  expect(swift).toContain('recipe values, not per-instance props in SwiftUI');
  // reset: back to the bare component, the paper and the blocks kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText('count={4}');
  await expect(code(xray)).toContainText('hue="red"');
  expect(await text(xray)).not.toMatch(/style=|--mu-r-|CSSProperties/);
});

test('an empty folder has no blocks to write', async ({ page }) => {
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Drop in');
  await step(xray, 'Blocks', 'ArrowDown', 3);
  const react = await text(xray);
  expect(react).toContain(`import { Folder } from '@unlocalhosted/metalui';`);
  expect(react).toContain('<Folder name="poster refs" count={0} />');
  expect(react).not.toMatch(/PEEKS|FolderPeek/);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Flap');
  await step(xray, 'Tilt', 'ArrowUp', 4);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    // it compiles, renders and compares twice: slow alone, slower in parallel
    test.slow();
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await tuneAll(xray);
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    // the Layers card holds the folder alone, with no handles over it
    const rendered = await render(xray, snippet);
    const specimen = card.locator('.ed-specimen > div:not(#snippet) .mu-folder');
    await expect(rendered).toHaveAttribute('data-hue', (await specimen.getAttribute('data-hue'))!);
    await expect(rendered.locator('.mu-folder-count')).toHaveText((await specimen.locator('.mu-folder-count').textContent())!);
    // the same boxes, then the same pixels (shadows included): in the colorway it was copied in, and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      await page.mouse.move(0, 0);
      const d = await compare(page, await alone(page, specimen, rendered), await alone(page, rendered, specimen));
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-folder-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
      expect(d.off).toBeLessThan(0.01);
      expect(d.mean).toBeLessThan(1.5);
    }
  });
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // the table's objects overlap at this width, so the folder takes the click itself
  await page.locator('[data-float="folder"] .mu-folder').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText(DEFAULT);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
