import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The slider x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the slider
// as it ships, with its marks and ticks, and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/slider');
  await page.evaluate(() => document.fonts.ready);
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const code = (xray: Locator) => xray.locator('.xr-code pre code');
/** The code as written, without the line numbers drawn beside it. */
const text = (xray: Locator) => code(xray).evaluate((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll('.ln').forEach((n) => n.remove()); return c.textContent ?? ''; });
async function drag(page: Page, target: Locator, dx: number, dy: number, along = 0.5) {
  await target.scrollIntoViewIfNeeded();
  const b = (await target.boundingBox())!;
  const x = b.x + b.width * along, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}
/** Steps the specimen's own knob with the keyboard: the value is a prop. */
async function nudge(page: Page, card: Locator, steps: number) {
  await card.locator('.ed-specimen input[type="range"]').focus();
  for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowRight');
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
    lab.runSnippet(js, css, mount, 'AmountSlider');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-slider');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'AmountSlider.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'amount-slider.css'), snippet.CSS);
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

/** Two controls, pixel for pixel: the share of pixels that differ clearly, and the mean difference. */
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

test('at defaults the code is the slider as it ships: props, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`<Slider aria-label="Amount" width={200} value={amount} min={0} max={100} onValueChange={setAmount} marks={MARKS} ticks={TICKS} />`);
  expect(react).toContain(`const MARKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];`);
  expect(react).toContain(`const TICKS = [0, 25, 50, 75, 100].map((value) => ({ value, label: value }));`);
  expect(react).toContain(`useState(62)`);
  expect(react).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalSlider(value: $amount, in: 0...100, step: 1, largeStep: 10, marks: marks, ticks: ticks, label: "Amount", valueText: { "\\(Int($0))" })');
  expect(swift).toContain('.frame(width: 200)');
  expect(swift).toContain('@State private var amount: Double = 62');
  expect(swift).not.toMatch(/recipe/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables', async ({ page }) => {
  // the strict type-check compiles the library alongside the snippet, which takes its time
  test.setTimeout(180_000);
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the value is a prop
  await nudge(page, card, 3);
  await expect(code(xray)).toContainText(`useState(65)`);
  // the marks and the ticks are props: off, they are gone from the code
  await part(xray, 'Marks');
  await card.getByRole('switch', { name: 'Ticks and labels' }).click();
  expect(await text(xray)).not.toMatch(/ticks=|TICKS/);
  await expect(code(xray)).toContainText('marks={MARKS}');
  await card.getByRole('switch', { name: 'Ticks and labels' }).click();
  await expect(code(xray)).toContainText('ticks={TICKS}');
  // the knob's shine is its metal, a colour: a stylesheet with one block per colorway, derived from the recipe and said so
  await part(xray, 'Knob');
  await drag(page, card.getByRole('slider', { name: 'Shine' }), 30, 0);
  await expect(code(xray)).toContainText(`import './amount-slider.css';`);
  await expect(code(xray)).toContainText('className="amount-slider"');
  expect(await text(xray)).not.toContain('--mu-r-slider-knob-background');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for shine');
  expect(sheet).toContain('.amount-slider, [data-mu-colorway="bone"] .amount-slider {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .amount-slider {');
  expect(sheet.match(/--mu-r-slider-knob-background:/g)).toHaveLength(2);
  // the groove is still the recipe's, so it is not set
  expect(sheet).not.toContain('--mu-r-well-self-track-shadow');
  // the groove's depth is the track well's shadow stack
  await part(xray, 'Track');
  await drag(page, card.getByRole('slider', { name: 'Depth' }), 0, 14, 0.15);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('groove depth');
  expect(sheet.match(/--mu-r-well-self-track-shadow:/g)).toHaveLength(2);
  expect(sheet).not.toContain('--mu-r-well-self-track-background');
  // a layer off is in the knob's stack
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Shadow', exact: true }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('shadow off');
  expect(sheet.match(/--mu-r-slider-knob-shadow:/g)).toHaveLength(2);
  // the spring is the slider's own transition variable, in the recipe's form (its duration times the travel switch,
  // so reduced motion still lands at once), inline: the same in every colorway
  await part(xray, 'Move');
  await drag(page, card.getByRole('slider', { name: 'Stiffness' }), 24, 0);
  await expect(code(xray)).toContainText(`'--mu-r-slider-self-transition': 'transform calc(`);
  await expect(code(xray)).toContainText(`ms * var(--mu-travel-part)) linear(`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import { useState, type CSSProperties } from 'react';`);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the props, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('@State private var amount: Double = 65');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the slider as it ships, the value kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`useState(65)`);
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Knob');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Shine' }), 30, 0);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    test.setTimeout(180_000);
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await nudge(page, card, 3);
    await part(xray, 'Knob');
    await drag(page, card.getByRole('slider', { name: 'Shine' }), 30, 0);
    await part(xray, 'Track');
    await drag(page, card.getByRole('slider', { name: 'Depth' }), 0, 14, 0.15);
    await part(xray, 'Light');
    await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
    await part(xray, 'Layers');
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(page, xray, snippet);
    const specimen = card.locator('.ed-slider .mu-slider');
    await expect(rendered.locator('input[type="range"]')).toHaveValue('65');
    // a slider is mostly clear, so the well's gradient would show through at two heights: the stills are of the slider, on a flat well
    await xray.locator('.ed-specimen').first().evaluate((well) => { well.style.background = 'var(--well-top)'; });
    // the same boxes, then the same pixels: in the colorway it was copied in, and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      await page.mouse.move(0, 0);
      const d = await compare(page, await specimen.screenshot(), await rendered.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-slider-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
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
  // the table's objects overlap at this width, so the groove takes the click itself
  await page.locator('[data-float="slider"] .mu-slider-control').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText(`useState(62)`);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
