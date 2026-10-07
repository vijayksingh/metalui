import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The swatch x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the bare
// component and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/swatch');
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

/** Runs the React snippet (and its stylesheet) in the page, next to the specimen, at the specimen's zoom and on its well. */
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
    const lab = await import('/src/ui/xray/swatch-lab.ts');
    lab.runSnippet(js, css, mount);
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-swatch');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'BrandSwatch.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'brand-swatch.css'), snippet.CSS);
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

/** One chip with its shadows, alone in the well: the other is taken out of the layout, so each frame is the same patch of the same well. */
async function alone(page: Page, chip: Locator, other: Locator) {
  await other.evaluate((el) => { (el.closest('#snippet') ?? el.closest('.ed-specimen > div')! as HTMLElement).setAttribute('style', `${(el.closest('#snippet') ?? el.closest('.ed-specimen > div')!).getAttribute('style') ?? ''};display:none`); });
  const box = (await chip.boundingBox())!;
  const pad = 40;
  const shot = await page.screenshot({ clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
  await other.evaluate((el) => { const host = (el.closest('#snippet') ?? el.closest('.ed-specimen > div')!) as HTMLElement; host.style.display = ''; });
  return shot;
}

test('at defaults the code is the bare component: props, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`<Swatch hex="#FF6B3D" label="Colour" />`);
  expect(react).not.toMatch(/size=|style=|className=|--mu-|\.css|CSSProperties/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalSwatch(hex: "#FF6B3D", label: "Colour")');
  expect(swift).not.toMatch(/recipe/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the colour is a prop
  await part(xray, 'Type');
  await drag(page, card.getByRole('slider', { name: 'Colour' }), 40, 0);
  const hex = (await card.locator('.mu-swatch').getAttribute('aria-label'))!.replace('Colour ', '');
  expect(hex).not.toBe('#FF6B3D');
  await expect(code(xray)).toContainText(`hex="${hex}"`);
  // what is engraved is a prop: the colour code is the label left out
  await card.getByRole('switch', { name: 'Engrave the colour code' }).click();
  expect(await text(xray)).not.toContain('label=');
  await card.getByRole('switch', { name: 'Engrave the colour code' }).click();
  await expect(code(xray)).toContainText('label="Colour"');
  // the size and corners are one value in every colorway: a recipe variable inline, on the swatch
  await part(xray, 'Shape');
  await drag(page, card.getByRole('slider', { name: 'Size' }), 0, -20);
  await drag(page, card.getByRole('slider', { name: 'Corners' }), -20, -20);
  await expect(code(xray)).toContainText(`'--mu-r-swatch-self-size': '`);
  await expect(code(xray)).toContainText(`'--mu-r-swatch-self-radius': '`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import type { CSSProperties } from 'react';`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the dimple
  await part(xray, 'Dimple');
  await drag(page, card.getByRole('slider', { name: 'Dimple' }), 25, 0);
  await expect(code(xray)).toContainText(`'--mu-r-swatch-led-size': '`);
  // the light turns the fill and the shadow stacks: colours, so a stylesheet, derived from the recipe and said so
  await part(xray, 'Light');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 0);
  await expect(code(xray)).toContainText(`import './brand-swatch.css';`);
  await expect(code(xray)).toContainText('className="brand-swatch"');
  expect(await text(xray)).not.toContain('--mu-r-swatch-self-shadow');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for light');
  expect(sheet).toContain('.brand-swatch[data-mu-self] {');
  expect(sheet.match(/--mu-r-swatch-self-background:/g)).toHaveLength(1);
  expect(sheet.match(/--mu-r-swatch-self-shadow:/g)).toHaveLength(1);
  // the stacks are written in the chip's own colour, never a baked hex
  expect(sheet).toContain('var(--mu-self)');
  expect(sheet).not.toContain(hex);
  // the coloured shadow's blur, and a layer off
  await part(xray, 'Shadow');
  await drag(page, card.getByRole('slider', { name: 'Shadow blur' }), 0, -28);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('shadow blur');
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Contact' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('contact off');
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the props, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain(`MetalSwatch(hex: "${hex}", label: "Colour")`);
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the bare component, the colour kept
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`hex="${hex}"`);
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Dimple');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Dimple' }), 25, 0);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Type');
    await drag(page, card.getByRole('slider', { name: 'Colour' }), 40, 0);
    await part(xray, 'Shape');
    await drag(page, card.getByRole('slider', { name: 'Corners' }), -20, -20);
    await drag(page, card.getByRole('slider', { name: 'Size' }), 0, -20);
    await part(xray, 'Dimple');
    await drag(page, card.getByRole('slider', { name: 'Dimple' }), 25, 0);
    await part(xray, 'Light');
    await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
    await part(xray, 'Shadow');
    await drag(page, card.getByRole('slider', { name: 'Shadow blur' }), 0, -28);
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Inner glow' }).click();
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(xray, snippet);
    const specimen = card.locator('.ed-specimen > div:not(#snippet) .mu-swatch');
    await expect(rendered).toHaveAttribute('aria-label', (await specimen.getAttribute('aria-label'))!);
    // the same boxes, then the same pixels (shadows included): in the colorway it was copied in, and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      await page.mouse.move(0, 0);
      const d = await compare(page, await alone(page, specimen, rendered), await alone(page, rendered, specimen));
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-swatch-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
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
  // the table's objects overlap at this width, so the chip takes the click itself
  await page.locator('[data-float="swatch"] .mu-swatch').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText(`<Swatch hex="#FF6B3D" label="Colour" />`);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
