import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The palette x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which opens as the specimen looks. At defaults it is how a page
// really builds the palette (its rows, a button and ⌘K to open it, the query it opens with) and
// nothing more. What you tune is a stylesheet on the class the palette takes, setting the variables it
// reads, so only that palette changes.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/command-palette');
  await page.evaluate(() => document.fonts.ready);
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const code = (xray: Locator) => xray.locator('.xr-code pre code');
/** The code as written, without the line numbers drawn beside it. */
const text = (xray: Locator) => code(xray).evaluate((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll('.ln').forEach((n) => n.remove()); return c.textContent ?? ''; });
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name });
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}
async function step(page: Page, target: Locator, key: string, times = 1) {
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await target.focus();
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

/** Runs the React snippet (and its stylesheet) in the page, beside the specimen: a button that opens the real palette. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  // the lab puts React, useState, the library and the icons in scope; the ⌘K listener needs useEffect too
  const js = 'const { useEffect } = React;\n' + transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css }) => {
    const mount = document.createElement('div');
    mount.id = 'snippet';
    well.after(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, 'CanvasPalette');
  }, { js, css: snippet.CSS ?? '' });
  return page.locator('#snippet .mu-button');
}
/** The real palette the snippet opened (the specimen is a still of it, marked apart). */
const real = (page: Page) => page.locator('.mu-palette:not(.xr-palobj)');
/** Opens the snippet's palette and waits for it to be fully up. */
async function opened(page: Page, button: Locator) {
  await button.click();
  await expect(real(page)).toBeVisible();
  await expect(real(page)).toHaveCSS('opacity', '1');
  await expect(real(page)).toHaveCSS('transform', 'none');
  return real(page);
}
async function closed(page: Page) {
  await page.keyboard.press('Escape');
  await expect(real(page)).toHaveCount(0);
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'CanvasPalette.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'canvas-palette.css'), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'], '@unlocalhosted/metalui/icons': ['../../packages/metalui/src/icons.ts'] },
  });
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

test('at defaults the code is how a page builds the palette: its rows, a button and ⌘K, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`import { Button, CommandPalette, Kbd, type CommandPaletteItem } from '@unlocalhosted/metalui';`);
  expect(react).toContain(`useState('tidy')`);
  expect(react).toContain(`e.key === 'k' && (e.metaKey || e.ctrlKey)`);
  expect(react).toContain(`label: 'Tidy the canvas', icon: <Icon name="tidy" size={14} />, hint: <Kbd size="small">⌘T</Kbd>`);
  expect(react).toContain(`<CommandPalette open={open} onOpenChange={setOpen} items={items} query={query} onQueryChange={setQuery}`);
  expect(react).not.toMatch(/status=|pinnable=|className=|style=|--mu-|\.css|chose in the x-ray/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('.metalCommandPalette(isPresented: $open, query: $query, items: items)');
  expect(swift).toContain('MetalCommandPaletteItem(id: "tidy", label: "Tidy the canvas", section: "ACTIONS", icon: .tidy, hint: .key("⌘T"))');
  expect(swift).toContain('.keyboardShortcut("k", modifiers: .command)');
  expect(swift).not.toMatch(/status:|pinnable|MetalPaletteMetrics|not per-instance/);
});

test('every tweak reaches the code: props as props, the plate\'s recipe through a stylesheet on its class', async ({ page }) => {
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the footer: pinning off and where answers come from are props
  await part(xray, 'Keys');
  await card.getByRole('switch', { name: 'Pin with ⇧↩' }).click();
  await expect(code(xray)).toContainText('pinnable={false}');
  await card.getByRole('switch', { name: 'Where answers come from' }).click();
  await expect(code(xray)).toContainText('status="SYNC OFFLINE"');
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the query is the state the palette opens with
  await part(xray, 'Field');
  await card.getByRole('textbox', { name: 'Palette query' }).fill('new');
  await expect(code(xray)).toContainText(`useState('new')`);
  // the chosen row is the palette's own state, and the code says so
  await part(xray, 'Rows');
  await step(page, page.getByRole('slider', { name: 'Chosen row' }), 'ArrowDown');
  await expect(code(xray)).toContainText('chose in the x-ray');
  // the field's height is a palette variable: a stylesheet on the class the palette takes carries it, for this palette only
  await part(xray, 'Field');
  await drag(page, page.getByRole('slider', { name: 'Field height' }), 0, -20);
  await expect(code(xray)).toContainText(`import './canvas-palette.css';`);
  await expect(code(xray)).toContainText('className="canvas-palette"');
  expect(await text(xray)).not.toMatch(/style=|--mu-/);
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('.canvas-palette {');
  expect(sheet).not.toContain('.mu-palette');
  expect(sheet.match(/--mu-palette-field-height:/g)).toHaveLength(1);
  expect(sheet).not.toMatch(/--mu-raise|--mu-frost-strong/);
  // the plate's corners are the theme's card radius, one value in every colorway
  await part(xray, 'Plate');
  await drag(page, page.getByRole('slider', { name: 'Plate corners' }), -8, -8);
  sheet = (await files(xray)).CSS!;
  expect(sheet.match(/--radius-card:/g)).toHaveLength(1);
  // a shadow layer off is the raise stack: colours, so one set per colorway, derived from the tokens and said so
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Rim' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its tokens for rim off');
  expect(sheet).toContain('.canvas-palette, [data-mu-colorway="bone"] .canvas-palette {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .canvas-palette {');
  expect(sheet.match(/--mu-raise:/g)).toHaveLength(2);
  expect(sheet).not.toContain('--mu-frost-strong');
  // the frost off is the fill
  await card.getByRole('switch', { name: 'Frost' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('frost, rim off');
  expect(sheet.match(/--mu-frost-strong:/g)).toHaveLength(2);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the status, pinning off, and one line each about what its API does not take
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('status: "SYNC OFFLINE"');
  expect(swift).toContain('var query = "new"');
  expect(swift).toContain('pinnable: false');
  expect(swift).toContain('MetalPaletteMetrics');
  // reset: back to the page's shape
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`useState('tidy')`);
  expect(await text(xray)).not.toMatch(/status=|pinnable=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Field');
  await drag(page, page.getByRole('slider', { name: 'Field height' }), 0, -20);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} opens as the specimen looks, in every colorway`, async ({ page }) => {
    test.slow();
    const xray = await openXray(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Keys');
    await card.getByRole('switch', { name: 'Where answers come from' }).click();
    await part(xray, 'Field');
    await drag(page, page.getByRole('slider', { name: 'Field height' }), 0, -20);
    await drag(page, page.getByRole('slider', { name: 'Field corners' }), -8, -8);
    await part(xray, 'Plate');
    await drag(page, page.getByRole('slider', { name: 'Plate corners' }), -8, -8);
    await part(xray, 'Layers');
    await card.getByRole('switch', { name: 'Rim' }).click();
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const button = await render(page, xray, snippet);
    const specimen = card.locator('.ed-specimen .mu-palette');
    // the real palette, opened from the snippet: the same paint, the same boxes, then the same pixels
    // over the same ground (it is frost, so it is laid exactly over the specimen's place, with the
    // specimen and the scrim out of the way), in the colorway it was copied in and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      // the colorway's colours cross-fade: the still is taken once they have settled
      if (colorway !== start) { await colorway_(page, colorway); await page.waitForTimeout(700); }
      await specimen.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const place = await specimen.evaluate((el) => {
        const r = el.getBoundingClientRect();
        let zoomed: HTMLElement | null = el.parentElement as HTMLElement;
        while (zoomed && !zoomed.style.zoom) zoomed = zoomed.parentElement;
        const zoom = Number(zoomed?.style.zoom || 1);
        const paint = (n: Element) => { const s = getComputedStyle(n); return { background: s.backgroundColor, shadow: s.boxShadow, radius: s.borderTopLeftRadius }; };
        const box = (sel: string) => { const b = el.querySelector(sel)!.getBoundingClientRect(); return [b.width, b.height]; };
        return { x: r.left, y: r.top, w: r.width, h: r.height, zoom, scrollY: window.scrollY, width: (el as HTMLElement).style.width, paint: paint(el), field: paint(el.querySelector('.mu-palette-field')!), boxes: [box('.mu-palette-field'), box('.mu-palette-row'), box('.mu-palette-foot')] };
      });
      const clip = { x: place.x - 2, y: place.y - 2, width: place.w + 4, height: place.h + 4 };
      const before = await page.screenshot({ clip });
      const popup = await opened(page, button);
      const got = await popup.evaluate((el, { place }) => {
        const paint = (n: Element) => { const s = getComputedStyle(n); return { background: s.backgroundColor, shadow: s.boxShadow, radius: s.borderTopLeftRadius }; };
        const box = (sel: string) => { const b = el.querySelector(sel)!.getBoundingClientRect(); return [b.width, b.height]; };
        // the real one laid over the specimen's place, at its width and zoom
        const sheet = document.createElement('style');
        sheet.id = 'lay-over';
        const lay = (x: number, y: number) => { sheet.textContent = `.mu-palette:not(.xr-palobj) { position: fixed; left: ${x}px; top: ${y}px; translate: none; width: ${place.width}; zoom: ${place.zoom}; } .mu-palette-scrim { visibility: hidden; }`; };
        lay(place.x / place.zoom, place.y / place.zoom);
        document.head.appendChild(sheet);
        // opening can move the page under the dialog: the same ground is behind both stills
        window.scrollTo(0, place.scrollY);
        // a fixed offset under zoom does not land exactly where it says: measure the miss and take it out
        const r = el.getBoundingClientRect();
        lay((place.x - (r.left - place.x)) / place.zoom, (place.y - (r.top - place.y)) / place.zoom);
        return { paint: paint(el), field: paint(el.querySelector('.mu-palette-field')!), boxes: [box('.mu-palette-field'), box('.mu-palette-row'), box('.mu-palette-foot')], rows: el.querySelectorAll('.mu-palette-row').length, status: el.querySelector('.mu-palette-status')?.textContent };
      }, { place });
      expect(got.paint).toEqual(place.paint);
      expect(got.field).toEqual(place.field);
      expect(got.rows).toBe(2);
      expect(got.status).toBe('SYNC OFFLINE');
      for (const [i, [w, h]] of got.boxes.entries()) {
        expect(Math.abs(w - place.boxes[i][0])).toBeLessThan(0.5);
        expect(Math.abs(h - place.boxes[i][1])).toBeLessThan(0.5);
      }
      await specimen.evaluate((el, y) => { (el as HTMLElement).style.visibility = 'hidden'; window.scrollTo(0, y); }, place.scrollY);
      await page.waitForTimeout(100);
      expect(await page.evaluate(() => window.scrollY)).toBe(place.scrollY);
      const after = await page.screenshot({ clip });
      await page.screenshot({ path: capture(`xray-code-palette-${start}-in-${colorway}`), clip: { x: clip.x - 24, y: clip.y - 24, width: clip.width + 48, height: clip.height + 48 } });
      const d = await compare(page, before, after);
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      expect(d.off).toBeLessThan(0.01);
      expect(d.mean).toBeLessThan(1.5);
      await specimen.evaluate((el) => { (el as HTMLElement).style.visibility = ''; document.getElementById('lay-over')?.remove(); });
      await closed(page);
    }
  });
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // the table's objects overlap at this width, so the palette takes the click itself
  await page.locator('[data-float="palette"] .mu-palette').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('<CommandPalette open={open}');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
