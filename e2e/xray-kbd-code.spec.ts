import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The keycap x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the agent
// guide's example and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/kbd');
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
/** Moves the keycap along its surfaces by keyboard: the page, a dark strip, sunk. */
async function surface(xray: Locator, page: Page, steps: number) {
  await part(xray, 'Surface');
  await xray.locator('.xr-card').getByRole('slider', { name: 'Surface' }).focus();
  for (let i = 0; i < Math.abs(steps); i++) await page.keyboard.press(steps > 0 ? 'ArrowRight' : 'ArrowLeft');
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
    // inside the specimen's own zoomed box, a flex box like the keycap's own, so the two can swap places
    const zoomed = well.firstElementChild as HTMLElement;
    const mount = document.createElement('div');
    mount.id = 'snippet';
    mount.style.display = 'flex';
    zoomed.append(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, 'SearchKey');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-kbd');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check-kbd');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'SearchKey.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'search-key.css'), snippet.CSS);
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

test('at defaults the code is the guide\'s example: props, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain('<Kbd>⌘K</Kbd>');
  expect(react).toContain('export function SearchKey() {');
  expect(react).not.toMatch(/size=|surface=|style=|className=|--mu-|\.css|CSSProperties/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalKbd("⌘K")');
  expect(swift).not.toMatch(/size:|surface:|recipe/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the surface and the size are props
  await surface(xray, page, 1);
  await expect(code(xray)).toContainText('<Kbd surface="strip">⌘K</Kbd>');
  await surface(xray, page, -1);
  await expect(code(xray)).toContainText('<Kbd>⌘K</Kbd>');
  await part(xray, 'Shape');
  await card.getByRole('slider', { name: 'Size' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(code(xray)).toContainText('<Kbd size="small">⌘K</Kbd>');
  // space beside the glyph and the corners are one value in every colorway: recipe variables inline on a wrapper, for the size it is
  await drag(page, card.getByRole('slider', { name: 'Space beside the glyph' }), 14, 0);
  await expect(code(xray)).toContainText(`'--mu-r-kbd-small-pad': '`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import type { CSSProperties } from 'react';`);
  await drag(page, card.getByRole('slider', { name: 'Corners' }), -12, -12);
  await expect(code(xray)).toContainText(`'--mu-r-kbd-small-radius': '`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the glyph's size and spacing are the type variables
  await part(xray, 'Type');
  await drag(page, card.getByRole('slider', { name: 'Glyph size and letter spacing' }), 0, -12);
  await expect(code(xray)).toContainText(`'--mu-r-kbd-self-font': '500 `);
  await expect(code(xray)).toContainText(`px/1 var(--mu-mono)'`);
  await drag(page, card.getByRole('slider', { name: 'Glyph size and letter spacing' }), 24, 0);
  await expect(code(xray)).toContainText(`'--mu-r-kbd-self-tracking': '`);
  // the light is the fill and the shadow stack: colours, so a stylesheet with one set per colorway, derived from the recipe and said so
  await part(xray, 'Light');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
  await expect(code(xray)).toContainText(`import './search-key.css';`);
  await expect(code(xray)).toContainText('className="search-key"');
  expect(await text(xray)).not.toContain('--mu-r-kbd-self-shadow');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toMatch(/derived from its recipe for light \d+° right/);
  expect(sheet).toContain('.search-key, [data-mu-colorway="bone"] .search-key {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .search-key {');
  expect(sheet.match(/--mu-r-kbd-self-shadow:/g)).toHaveLength(2);
  expect(sheet.match(/--mu-r-kbd-self-background:/g)).toHaveLength(2);
  // the height above the page is in the shadow stack
  await part(xray, 'Shadow');
  await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -24);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toMatch(/height [\d.]+/);
  // a layer off is in the stack
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Drop' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('drop off');
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the props, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalKbd("⌘K", size: .small)');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the guide's example
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText('<Kbd>⌘K</Kbd>');
  expect(await text(xray)).not.toMatch(/size=|surface=|style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('a strip or sunk keycap keeps one set of colours, and a sunk one is a pill whatever its corners', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  await drag(page, card.getByRole('slider', { name: 'Corners' }), 14, 14);
  await expect(code(xray)).toContainText(`'--mu-r-kbd-self-radius': '`);
  await surface(xray, page, 2);
  await expect(code(xray)).toContainText('<Kbd surface="sunk">⌘K</Kbd>');
  // the pill has no corners to set
  expect(await text(xray)).not.toContain('radius');
  await part(xray, 'Light');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
  const sheet = (await files(xray)).CSS!;
  // the sunk key's colours are the same in every colorway: one block, not two
  expect(sheet).toContain('.search-key {');
  expect(sheet).not.toContain('data-mu-colorway');
  expect(sheet).toContain('--mu-r-kbd-sunk-background:');
  expect(sheet).toContain('--mu-r-kbd-sunk-shadow:');
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  expect(await text(xray)).toContain('MetalKbd("⌘K", surface: .sunk)');
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Space beside the glyph' }), 12, 0);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  for (const set of ['the page', 'a strip', 'sunk'] as const) {
    test(`the snippet copied in ${start} on ${set} renders as the specimen does, in every colorway`, async ({ page }) => {
      test.slow();
      const xray = await openXray(page, start);
      const card = xray.locator('.xr-card');
      if (set !== 'the page') await surface(xray, page, set === 'a strip' ? 1 : 2);
      await part(xray, 'Shape');
      await card.getByRole('slider', { name: 'Size' }).focus();
      await page.keyboard.press('ArrowDown');
      await drag(page, card.getByRole('slider', { name: 'Space beside the glyph' }), 12, 0);
      if (set !== 'sunk') await drag(page, card.getByRole('slider', { name: 'Corners' }), 10, 10);
      await part(xray, 'Type');
      await drag(page, card.getByRole('slider', { name: 'Glyph size and letter spacing' }), 0, -9);
      await part(xray, 'Light');
      await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
      if (set === 'the page') {
        await part(xray, 'Shadow');
        await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -14);
      }
      await part(xray, 'Layers');
      const snippet = await files(xray) as { React: string; CSS?: string };
      expect(typeErrors(snippet)).toEqual([]);
      const rendered = await render(page, xray, snippet);
      const specimen = card.locator('.ed-specimen > :first-child > .xr-kbd-box .mu-kbd');
      await expect(rendered).toHaveCount(1);
      // the same boxes, then the same pixels: in the colorway it was copied in, and in the other one
      for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
        if (colorway !== start) await colorway_(page, colorway);
        const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
        expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
        expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
        await page.mouse.move(0, 0);
        // both stills are the same place on the same pixels, one at a time, so only the keycap itself can differ
        const swap = (snippet: boolean) => page.evaluate((snippet) => {
          const mount = document.querySelector<HTMLElement>('#snippet')!;
          mount.style.display = snippet ? 'flex' : 'none';
          (mount.parentElement!.firstElementChild as HTMLElement).style.display = snippet ? 'none' : '';
        }, snippet);
        await swap(false);
        await specimen.scrollIntoViewIfNeeded();
        const box = (await specimen.boundingBox())!;
        const clip = { x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8 };
        const first = await page.screenshot({ clip });
        await swap(true);
        const second = await page.screenshot({ clip });
        await page.evaluate(() => { const mount = document.querySelector<HTMLElement>('#snippet')!; mount.style.display = 'flex'; (mount.parentElement!.firstElementChild as HTMLElement).style.display = ''; });
        const d = await compare(page, first, second);
        console.log(`snippet from ${start} on ${set} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
        await card.screenshot({ path: capture(`xray-code-kbd-${set.replace(' ', '-')}-${start}-in-${colorway}`) });
        expect(d.off).toBeLessThan(0.01);
        expect(d.mean).toBeLessThan(1.5);
      }
    });
  }
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // the table's objects overlap at this width, so the keycap takes the click itself
  await page.locator('[data-float="key"] .mu-kbd').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('<Kbd>⌘K</Kbd>');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
