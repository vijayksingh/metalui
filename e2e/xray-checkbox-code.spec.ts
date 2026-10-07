import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The checkbox x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the checkbox
// with its name and its state, nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/checkbox');
  await page.evaluate(() => document.fonts.ready);
  const xray = page.locator('#x-ray .xr');
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
/** Steps the checkbox through its states by keyboard: rest, hover, done, mixed, doing, suggested. */
async function state(xray: Locator, page: Page, steps: number) {
  await part(xray, 'States');
  await xray.locator('.xr-card').getByRole('slider', { name: 'State' }).focus();
  for (let i = 0; i < Math.abs(steps); i++) await page.keyboard.press(steps > 0 ? 'ArrowDown' : 'ArrowUp');
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

/** Runs the React snippet (and its stylesheet) in the page, on the specimen's own line, at its zoom. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  const js = transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css }) => {
    // on the specimen's zoomed line, in the specimen's own place, so the two boxes share a zoom, a background and a spot
    const line = well.firstElementChild as HTMLElement;
    const mount = document.createElement('span');
    mount.id = 'snippet';
    mount.style.display = 'none';
    (line.firstElementChild as HTMLElement).after(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, 'TaskCheck');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-dimple');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check-checkbox');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'TaskCheck.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'task-check.css'), snippet.CSS);
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

const PLAIN = '<Checkbox aria-label="Call the printer" checked={done} onCheckedChange={setDone} />';

test('at defaults the code is the checkbox with its name and its state, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(PLAIN);
  expect(react).toContain('useState(false)');
  expect(react).toContain('export function TaskCheck() {');
  expect(react).not.toMatch(/size=|doing|ghost|mixed|style=|className=|--mu-|\.css|CSSProperties/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalDimple(isOn: $done, label: "Call the printer")');
  expect(swift).toContain('@State private var done = false');
  expect(swift).not.toMatch(/size:|doing:|ghost:|mixed:|recipe/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the state is the state, or a prop: done, mixed, doing, suggested; hover is the pointer's, so it is rest
  await state(xray, page, 1);
  await expect(code(xray)).toContainText('useState(false)');
  await state(xray, page, 1);
  await expect(code(xray)).toContainText('useState(true)');
  await state(xray, page, 1);
  await expect(code(xray)).toContainText('<Checkbox aria-label="Call the printer" mixed checked={done} onCheckedChange={setDone} />');
  await state(xray, page, 1);
  await expect(code(xray)).toContainText('<Checkbox aria-label="Call the printer" doing />');
  expect(await text(xray)).not.toContain('useState');
  await state(xray, page, 1);
  await expect(code(xray)).toContainText('<Checkbox aria-label="Call the printer" ghost />');
  await state(xray, page, -5);
  await expect(code(xray)).toContainText(PLAIN);
  // the size is a prop; its corners are one value in every colorway: the size's recipe variable, inline
  await part(xray, 'Shape');
  await card.getByRole('slider', { name: 'Size' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(code(xray)).toContainText('size="row"');
  await drag(page, card.getByRole('slider', { name: 'Corners' }), -12, -12);
  await expect(code(xray)).toContainText(`'--mu-r-checkbox-row-radius': '`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import { useState, type CSSProperties } from 'react';`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the tick's angle is the tick variable
  await part(xray, 'Tick');
  await drag(page, card.getByRole('slider', { name: 'Tick angle' }), 18, 0);
  await expect(code(xray)).toContainText(`'--mu-r-checkbox-tick-rotate': '`);
  // the well's depth is its shadow stack: colours, so a stylesheet with one set per colorway, derived from the recipe and said so
  await part(xray, 'Well');
  await drag(page, card.getByRole('slider', { name: 'Well depth' }), 0, 18);
  await expect(code(xray)).toContainText(`import './task-check.css';`);
  await expect(code(xray)).toContainText('className="task-check"');
  expect(await text(xray)).not.toContain('--mu-r-checkbox-self-shadow');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for well depth');
  expect(sheet).toContain('.task-check, [data-mu-colorway="bone"] .task-check {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .task-check {');
  expect(sheet.match(/--mu-r-checkbox-self-shadow:/g)).toHaveLength(2);
  // the well's fill is still the recipe's, so it is not set
  expect(sheet).not.toContain('--mu-r-checkbox-self-background');
  // the light turns the fills and every stack the checkbox can show: the well's and the key's it turns into
  await part(xray, 'Light');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 28, 3);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toMatch(/derived from its recipe for light \d+° right/);
  expect(sheet.match(/--mu-r-checkbox-self-background:/g)).toHaveLength(2);
  expect(sheet).toContain('--mu-r-checkbox-self-on-shadow:');
  // a layer off is in the stack
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Edge line' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('edge line off');
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the props, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalDimple(isOn: $done, size: .row, label: "Call the printer")');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the plain checkbox, its state kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(PLAIN);
  expect(await text(xray)).not.toMatch(/size=|style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Corners' }), -10, -10);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    test.slow();
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Shape');
    await drag(page, card.getByRole('slider', { name: 'Corners' }), -8, -8);
    await part(xray, 'Tick');
    await drag(page, card.getByRole('slider', { name: 'Tick angle' }), 12, 0);
    await part(xray, 'Light');
    await drag(page, card.getByRole('slider', { name: 'Light' }), 28, 3);
    await part(xray, 'Layers');
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(snippet.React).toContain('useState(true)');
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(page, xray, snippet);
    const specimen = card.locator('.ed-specimen .xr-checkbox-box .mu-dimple').first();
    await expect(rendered).toHaveAttribute('data-checked', '');
    // the same boxes, then the same pixels: in the colorway it was copied in, and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      await page.mouse.move(0, 0);
      // both stills are the same place on the same pixels, one at a time, so only the checkbox itself can differ
      const swap = async (snippet: boolean) => {
        await page.evaluate((snippet) => {
          const mount = document.querySelector<HTMLElement>('#snippet')!;
          mount.style.display = snippet ? 'inline-flex' : 'none';
          document.querySelector<HTMLElement>('.ed-specimen .ed-checkbox-line > .xr-checkbox-box')!.style.display = snippet ? 'none' : '';
        }, snippet);
        await expect(snippet ? rendered : specimen).toBeVisible();
        await expect(snippet ? specimen : rendered).toBeHidden();
      };
      await swap(false);
      await specimen.scrollIntoViewIfNeeded();
      const box = (await specimen.boundingBox())!;
      const clip = { x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8 };
      const first = await page.screenshot({ clip });
      await swap(true);
      const second = await page.screenshot({ clip });
      const d = await compare(page, first, second);
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await card.screenshot({ path: capture(`xray-code-checkbox-${start}-in-${colorway}`) });
      await swap(false);
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
  // the table's objects overlap at this width, so the checkbox takes the click itself: it ticks, and opens
  await page.locator('[data-float="lines"] [data-float-part="open"] .mu-dimple').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('useState(true)');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
