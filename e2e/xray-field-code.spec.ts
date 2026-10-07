import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The field x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the field
// as the docs write it and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/field');
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

/** Runs the React snippet (and its stylesheet) in the page, next to the specimen, at the specimen's zoom and width. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  const js = transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css }) => {
    const zoomed = well.firstElementChild as HTMLElement;
    const mount = document.createElement('div');
    mount.id = 'snippet';
    mount.style.zoom = zoomed.style.zoom;
    // the specimen's field is as wide as its card lets it; the snippet's fills what it is given
    mount.style.width = (zoomed.querySelector('.xr-field-vars') as HTMLElement).style.width;
    zoomed.after(mount);
    const lab = await import('/src/ui/xray/field-snippet-lab.ts');
    lab.runSnippet(js, css, mount);
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-field');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  // a folder of its own per check, so checks running side by side never write over each other
  fs.mkdirSync(path.resolve('test-results'), { recursive: true });
  const dir = fs.mkdtempSync(path.resolve('test-results/snippet-check-'));
  const file = path.join(dir, 'LensField.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'lens-field.css'), snippet.CSS);
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
    let off = 0, sum = 0; const n = ia.width * ia.height;
    for (let i = 0; i < n * 4; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      sum += d; if (d > 40) off++;
    }
    return { off: off / n, mean: sum / n, size: `${ia.width}x${ia.height}` };
  }, [a.toString('base64'), b.toString('base64')]);
}

test('at defaults the code is the field as the docs write it: props, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain('<Field.Input placeholder="Lens or action" aria-label="Lens or action" value={query} onChange={(e) => setQuery(e.target.value)} />');
  expect(react).toContain('<Field.Trail><Kbd>⌘K</Kbd></Field.Trail>');
  expect(react).toContain(`useState('')`);
  expect(react).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  // SwiftUI has no MetalField: the field is its parts, sized by the recipe, and the code says so
  expect(swift).toContain('MetalWell(.field, radius: field.points("field.radius"))');
  expect(swift).toContain('MetalKbd("⌘K")');
  expect(swift).toContain('MetalUI has no MetalField for SwiftUI yet');
  expect(swift).not.toMatch(/not per-instance/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables', async ({ page }) => {
  test.setTimeout(90_000);
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // what is typed is a prop
  await part(xray, 'Type');
  await card.getByRole('textbox', { name: 'Lens or action' }).fill('Inbox');
  await expect(code(xray)).toContainText(`useState('Inbox')`);
  // the caret is one value in every colorway: clear, inline
  await card.getByRole('switch', { name: 'Caret' }).click();
  await expect(code(xray)).toContainText(`'--mu-r-field-field-caret': 'transparent'`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import { useState, type CSSProperties } from 'react';`);
  // the shape is the field recipe's own variables, inline on a wrapper
  await part(xray, 'Shape');
  await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -12);
  await expect(code(xray)).toContainText(`'--mu-r-field-field-height': '`);
  await drag(page, card.getByRole('slider', { name: 'Corners' }), -24, -24);
  await expect(code(xray)).toContainText(`'--mu-r-field-field-radius': '`);
  await drag(page, card.getByRole('slider', { name: 'Space on the left' }), 16, 0);
  await expect(code(xray)).toContainText(`'--mu-r-field-field-pad-left': '`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the well's depth is the tray's shadow stack: colours, so a stylesheet with one set per colorway, derived from the recipe and said so
  await part(xray, 'Well');
  await drag(page, card.getByRole('slider', { name: 'Well depth' }), 0, 14);
  await expect(code(xray)).toContainText(`import './lens-field.css';`);
  await expect(code(xray)).toContainText('className="lens-field"');
  expect(await text(xray)).not.toContain('--mu-r-well-self-field-shadow');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for well depth');
  expect(sheet).toContain('.lens-field, [data-mu-colorway="bone"] .lens-field {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .lens-field {');
  expect(sheet.match(/--mu-r-well-self-field-shadow:/g)).toHaveLength(2);
  // the tray's fill is still the recipe's, so it is not set
  expect(sheet).not.toContain('--mu-r-well-self-field-background');
  // a key layer off is in the key's stack
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Drop' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('drop off');
  expect(sheet.match(/--mu-r-kbd-self-shadow:/g)).toHaveLength(2);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the sizes as plain values, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('@State private var query = "Inbox"');
  expect(swift).toMatch(/MetalWell\(\.field, radius: [\d.]+\)/);
  expect(swift).toMatch(/\.padding\(\.leading, [\d.]+\)/);
  expect(swift).toMatch(/\.frame\(height: [\d.]+\)/);
  expect(swift).toContain('the depth, layers, caret you tuned come from the recipe: they are not per-instance props in SwiftUI');
  // the key off: no key in the field, and none of its variables
  await xray.getByRole('tab', { name: 'React' }).click();
  await part(xray, 'Key');
  await card.getByRole('switch', { name: 'Key' }).click();
  expect(await text(xray)).not.toMatch(/Kbd|Trail/);
  sheet = (await files(xray)).CSS!;
  expect(sheet).not.toContain('kbd');
  expect(sheet).not.toContain('drop off');
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  expect(await text(xray)).not.toContain('MetalKbd');
  // reset: back to the guide's example, the text kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`useState('Inbox')`);
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Space on the left' }), 12, 0);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    test.setTimeout(90_000);
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Type');
    await card.getByRole('textbox', { name: 'Lens or action' }).fill('Inbox');
    await part(xray, 'Shape');
    await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -12);
    await drag(page, card.getByRole('slider', { name: 'Corners' }), -24, -24);
    await drag(page, card.getByRole('slider', { name: 'Space on the left' }), 12, 0);
    await part(xray, 'Well');
    await drag(page, card.getByRole('slider', { name: 'Well depth' }), 0, 14);
    await part(xray, 'Light');
    await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Drop' }).click();
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(page, xray, snippet);
    const specimen = card.locator('.ed-specimen .mu-field').first();
    await expect(rendered.locator('input')).toHaveValue('Inbox');
    // the same boxes, then the same pixels: in the colorway it was copied in, and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      await page.mouse.move(0, 0);
      const d = await compare(page, await specimen.screenshot(), await rendered.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-field-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
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
  await page.waitForSelector('[data-float="field"] input');
  // the table's objects overlap at this width, so the field takes the click itself
  const input = page.locator('[data-float="field"] input');
  await input.fill('Inbox');
  await input.dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText(`useState('Inbox')`);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
