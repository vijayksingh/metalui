import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The status badge x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the agent
// guide's example and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/status');
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
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
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

/** Runs the React snippet (and its stylesheet) in the page, next to the specimen, at the specimen's zoom and on its well. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
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
    lab.runSnippet(js, css, mount, 'SyncStatus');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-badge');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'SyncStatus.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'sync-status.css'), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'] },
  });
  // the snippet's own errors: the library's source is compiled alongside it only to give it its real types
  return ts.getPreEmitDiagnostics(program, program.getSourceFile(file)).filter((d) => !d.file || path.resolve(d.file.fileName) === file).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

/** Switches the page's colorway through the site's own switch. */
async function colorway_(page: Page, to: string) {
  // the site's switch in the banner
  await page.getByRole('banner').getByRole('radiogroup', { name: 'Colorway' }).getByRole('radio', { name: to[0].toUpperCase() + to.slice(1), exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mu-colorway', to);
  await page.waitForTimeout(250);
}

/** Two controls, pixel for pixel: the share of pixels that differ clearly, and the mean difference. */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const px = (im: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d')!; g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const pa = px(ia), pb = px(ib);
    if (ia.width !== ib.width || ia.height !== ib.height) return { off: 1, mean: 255, size: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
    // a badge sits on a fractional pixel row, and the two clips round it out differently: the last four rows are that rounding, not the badge
    let off = 0, sum = 0; const n = ia.width * (ia.height - 4);
    for (let i = 0; i < n * 4; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      sum += d; if (d > 40) off++;
    }
    return { off: off / n, mean: sum / n, size: `${ia.width}x${ia.height}` };
  }, [a.toString('base64'), b.toString('base64')]);
}

const readout = (card: Locator, label: string) => card.locator('.ed-readout').filter({ hasText: label });
const step = async (page: Page, card: Locator, label: string, key: string, times: number) => {
  await readout(card, label).focus();
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
};

test('at defaults the code is the guide\'s one-liner: props, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain('<StatusBadge led="live">Sync live</StatusBadge>');
  expect(react).not.toMatch(/style=|className=|--mu-|\.css|CSSProperties/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalStatusBadge("Sync live", led: .live)');
  expect(swift).not.toMatch(/recipe|per-instance/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables, the lamp not at all', async ({ page }) => {
  // a dozen handled tweaks, each read back from the code: about 11 s alone
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the state is a prop, and its words come with it
  await card.getByRole('slider', { name: 'State' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(code(xray)).toContainText('led="waiting"');
  await expect(code(xray)).toContainText('Sync waiting');
  await page.keyboard.press('ArrowLeft');
  // the shape and the type are one value in every colorway: recipe variables on the badge's own style
  await part(xray, 'Shape');
  await step(page, card, 'Space on the ends', 'ArrowUp', 3);
  await expect(code(xray)).toContainText(`'--mu-r-status-badge-pad': '14px'`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import type { CSSProperties } from 'react';`);
  await step(page, card, 'Height', 'ArrowUp', 2);
  await expect(code(xray)).toContainText(`'--mu-r-status-badge-height': '28px'`);
  await step(page, card, 'Lamp size', 'ArrowUp', 2);
  await expect(code(xray)).toContainText(`'--mu-r-status-lamp-size': '9px'`);
  await part(xray, 'Type');
  await step(page, card, 'Letter spacing', 'ArrowUp', 2);
  await expect(code(xray)).toContainText(`'--mu-r-status-badge-tracking': '0.03em'`);
  await step(page, card, 'Letter size', 'ArrowUp', 2);
  await expect(code(xray)).toContainText(`'--mu-r-status-badge-font': '500 13px/16px var(--mu-sans)'`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // a layer off is in the plate's stack: colours, so a stylesheet with one set per colorway, derived from the recipe and said so
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Drop' }).click();
  await expect(code(xray)).toContainText(`import './sync-status.css';`);
  await expect(code(xray)).toContainText('className="sync-status"');
  expect(await text(xray)).not.toContain('--mu-r-status-badge-shadow');
  const sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for drop off');
  expect(sheet).toContain('.sync-status, [data-mu-colorway="bone"] .sync-status {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .sync-status {');
  expect(sheet.match(/--mu-r-status-badge-shadow:/g)).toHaveLength(2);
  expect(sheet).not.toContain('--mu-r-status-badge-background');
  // the lamp has no honest code form: nothing about it in the snippet but the line that says so
  expect(await text(xray)).not.toMatch(/--ed-|data-lamp|status-lamp-background|status-lamp-shadow/);
  await part(xray, 'Glow');
  await card.getByRole('switch', { name: 'Glow' }).click();
  await expect(code(xray)).toContainText('tuned in the x-ray only');
  expect(await text(xray)).not.toMatch(/--ed-|data-lamp|status-lamp-background|status-lamp-shadow/);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the state and the words, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalStatusBadge("Sync live", led: .live)');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the one-liner, the state kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css|tuned/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await step(page, xray.locator('.xr-card'), 'Space on the ends', 'ArrowUp', 3);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Shape');
    await step(page, card, 'Space on the ends', 'ArrowUp', 3);
    await step(page, card, 'Height', 'ArrowUp', 2);
    await step(page, card, 'Lamp size', 'ArrowUp', 2);
    await part(xray, 'Type');
    await step(page, card, 'Letter spacing', 'ArrowUp', 2);
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Drop' }).click();
    await card.getByRole('switch', { name: 'Contact' }).click();
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(page, xray, snippet);
    const specimen = card.locator('.ed-specimen .ed-status-badge');
    await expect(rendered).toContainText('Sync live');
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      await page.mouse.move(0, 0);
      const d = await compare(page, await specimen.screenshot(), await rendered.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-status-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
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
  await page.locator('[data-float="status"] .mu-badge').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('led="live"');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
