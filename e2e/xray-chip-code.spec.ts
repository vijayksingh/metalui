import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The suggestion chip x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the agent
// guide's example and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/suggestion-chip');
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
    const lab = await import('/src/ui/xray/chip-lab.ts');
    lab.runSnippet(js, css, mount);
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-suggestion');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'BlockSuggestion.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'block-suggestion.css'), snippet.CSS);
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

const rest = (l: Locator) => l.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));

test('at defaults the code is the guide\'s example: props, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain('<SuggestionChip label="Track as mood?" confidence={0.8} onAccept={onAccept} onDismiss={onDismiss} />');
  expect(react).not.toMatch(/style=|className=|--mu-|\.css|CSSProperties|hostHovered/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalSuggestionChip(label: "Track as mood?", confidence: 0.8, onAccept: onAccept, onDismiss: onDismiss)');
  expect(swift).not.toMatch(/recipe|per-instance|hostHovered/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables, colours per colorway', async ({ page }) => {
  // a dozen handled tweaks, each read back from the code: about 11 s alone
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the question and how sure are props
  await part(xray, 'Type');
  await step(page, card, 'Question', 'ArrowUp', 1);
  await expect(code(xray)).toContainText('label="Task?"');
  await step(page, card, 'How sure', 'ArrowDown', 8);
  await expect(code(xray)).toContainText('confidence={0.72}');
  // pointing at the line is the prop that forces full opacity
  await part(xray, 'States');
  await card.getByRole('switch', { name: 'Point at the line' }).click();
  await expect(code(xray)).toContainText('hostHovered');
  // the shape is one value in every colorway: recipe variables on the chip's own style
  await part(xray, 'Shape');
  await step(page, card, 'Height', 'ArrowUp', 2);
  await expect(code(xray)).toContainText(`'--mu-r-chip-suggestion-height': '22px'`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import type { CSSProperties } from 'react';`);
  await step(page, card, 'Space on the left', 'ArrowUp', 3);
  await expect(code(xray)).toContainText(`'--mu-r-chip-suggestion-pad-left': '12px'`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the frost and a layer off are the plate's colours: a stylesheet with one set per colorway, derived from the recipe and said so
  await part(xray, 'Surface');
  await step(page, card, 'Frost', 'ArrowDown', 2);
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Drop' }).click();
  await expect(code(xray)).toContainText(`import './block-suggestion.css';`);
  await expect(code(xray)).toContainText('className="block-suggestion"');
  expect(await text(xray)).not.toMatch(/--mu-r-chip-suggestion-(background|shadow)/);
  const sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for frost at 60%, drop off');
  expect(sheet).toContain('.block-suggestion, [data-mu-colorway="bone"] .block-suggestion {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .block-suggestion {');
  expect(sheet.match(/--mu-r-chip-suggestion-background:/g)).toHaveLength(2);
  expect(sheet.match(/--mu-r-chip-suggestion-shadow:/g)).toHaveLength(2);
  expect(sheet).toContain('rgba(252,251,249, 0.6)');
  expect(sheet).toContain('rgba(44,44,47, 0.6)');
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the props, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalSuggestionChip(label: "Task?", confidence: 0.72, hostHovered: true, onAccept: onAccept, onDismiss: onDismiss)');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the plain chip, the question, confidence and line kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css|CSSProperties/);
  await expect(code(xray)).toContainText('label="Task?"');
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await step(page, xray.locator('.xr-card'), 'Height', 'ArrowUp', 3);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    // two compiles, a dozen tweaks and four screenshots: about 12 s alone, longer when the machine is shared
    test.slow();
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Shape');
    await step(page, card, 'Height', 'ArrowUp', 2);
    await step(page, card, 'Space on the left', 'ArrowUp', 3);
    await part(xray, 'Surface');
    await step(page, card, 'Frost', 'ArrowDown', 3);
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Drop' }).click();
    await card.getByRole('switch', { name: 'Contact' }).click();
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(page, xray, snippet);
    const specimen = card.locator('.ed-specimen > div:not(#snippet) .mu-suggestion');
    await expect(rendered).toContainText('Track as mood?');
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      await page.mouse.move(0, 0);
      await rest(specimen); await rest(rendered);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      // the colour stacks themselves, not just how they look: the same computed fill and shadow in this colorway
      for (const prop of ['background-color', 'box-shadow']) expect(await rendered.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop)).toBe(await specimen.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop));
      const d = await compare(page, await specimen.screenshot(), await rendered.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-chip-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
      expect(d.off).toBeLessThan(0.01);
      // the chip is see-through: it shows the well's own shading, which is not the same at the two places it sits
      expect(d.mean).toBeLessThan(2.5);
    }
  });
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  await page.locator('[data-float="chip"] .mu-chip-text').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('label="Track as mood?"');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
