import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The toast x-ray is a tweak surface: under its card, the code that raises exactly the toast you
// have handled (the provider and the call, with its real options), which you can copy, and which
// raises a live toast that is the specimen to the pixel. At defaults it is the agent guide's
// example and nothing more.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/toast');
  await page.evaluate(() => document.fonts.ready);
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const code = (xray: Locator) => xray.locator('.xr-code pre code');
/** The code as written, without the line numbers drawn beside it. */
const text = (xray: Locator) => code(xray).evaluate((el) => { const c = el.cloneNode(true) as HTMLElement; c.querySelectorAll('.ln').forEach((n) => n.remove()); return c.textContent ?? ''; });
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: new RegExp(`^${name}`, 'i') });
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

/** Runs the React snippet (and its stylesheet) in the page, next to the specimen: its button, which raises the live toast. */
async function render(page: Page, xray: Locator, snippet: { React: string; CSS?: string }) {
  // the snippet as a browser runs it: types and JSX compiled away, its imports supplied by the page
  const js = transformSync(snippet.React, { loader: 'tsx', jsx: 'transform', jsxFactory: 'React.createElement' }).code
    .replace(/^import .*$/gm, '').replace(/^export /gm, '');
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css }) => {
    const mount = document.createElement('div');
    mount.id = 'snippet';
    well.after(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, 'UndoToast');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet').getByRole('button', { name: 'Move 3 blocks' });
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check-toast');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'UndoToast.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'undo-toast.css'), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'] },
  });
  return ts.getPreEmitDiagnostics(program).filter((d) => !d.file || path.resolve(d.file.fileName) === file).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

/** Two toasts, pixel for pixel: the share of pixels that differ clearly, and the mean difference. The live card's
 *  title is a drum (a composited layer), so its glyphs are rasterised a fraction of a device pixel from the still's:
 *  a pixel counts as the same when it matches its counterpart within one device pixel, which lets that sub-pixel
 *  edge through and nothing larger (a glyph, a key or a point of padding moved still shows). */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const px = (im: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d')!; g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const pa = px(ia), pb = px(ib);
    const W = ia.width, H = ia.height;
    if (W !== ib.width || H !== ib.height) return { off: 1, mean: 255, size: `${W}x${H} vs ${ib.width}x${ib.height}` };
    const at = (p: Uint8ClampedArray, x: number, y: number, c: number) => p[(y * W + x) * 4 + c];
    const diff = (x: number, y: number, u: number, v: number) => Math.max(Math.abs(at(pa, x, y, 0) - at(pb, u, v, 0)), Math.abs(at(pa, x, y, 1) - at(pb, u, v, 1)), Math.abs(at(pa, x, y, 2) - at(pb, u, v, 2)));
    let off = 0, sum = 0; const n = W * H;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const exact = diff(x, y, x, y);
      sum += exact;
      if (exact <= 40) continue;
      let near = exact;
      for (let v = Math.max(0, y - 1); v <= Math.min(H - 1, y + 1); v++) for (let u = Math.max(0, x - 1); u <= Math.min(W - 1, x + 1); u++) near = Math.min(near, diff(x, y, u, v));
      if (near > 40) off++;
    }
    return { off: off / n, mean: sum / n, size: `${W}x${H}` };
  }, [a.toString('base64'), b.toString('base64')]);
}

test('at defaults the code is the guide\'s example: the provider and the call, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`import { Button, ToastProvider, useToast } from '@unlocalhosted/metalui';`);
  expect(react).toContain('const toast = useToast();');
  expect(react).toContain(`title: 'Moved 3 blocks',`);
  expect(react).toContain(`sub: 'undo it any time',`);
  expect(react).toContain('undo: () => {');
  expect(react).toContain('<ToastProvider>');
  expect(react).not.toMatch(/tone:|timeout:|undoShortcut|--mu-|\.css|style=|className=/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('@State private var deck = MetalToastDeck()');
  expect(swift).toContain('deck.show(.init(');
  expect(swift).toContain('"Moved 3 blocks",');
  expect(swift).toContain('.metalToastDeck(deck)');
  expect(swift).not.toMatch(/tone:|timeout:|undoShortcut|recipe/);
});

test('every tweak reaches the code: the call\'s options as options, tunables as the library\'s variables at the root', async ({ page }) => {
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the kind and the detail are options of the call
  await part(xray, 'Type');
  await readout(card, 'kind').focus();
  await page.keyboard.press('ArrowUp');
  await expect(code(xray)).toContainText(`tone: 'success'`);
  await card.getByRole('switch', { name: 'Detail' }).click();
  expect(await text(xray)).not.toContain('sub:');
  // Undo and its key: the key off is undoShortcut: false; Undo off takes the key with it
  await part(xray, 'Undo');
  await card.getByRole('switch', { name: '⌘Z key' }).click();
  await expect(code(xray)).toContainText('undoShortcut: false');
  await card.getByRole('switch', { name: 'Undo' }).click();
  expect(await text(xray)).not.toMatch(/undo:|undoShortcut/);
  // how long it stays: the kind's own says nothing; a tenth off it is a timeout in ms
  await part(xray, 'Timing');
  expect(await text(xray)).not.toContain('timeout:');
  await readout(card, 'stays').focus();
  await page.keyboard.press('ArrowDown');
  await expect(code(xray)).toContainText('timeout: 2500');
  await page.keyboard.press('ArrowUp');
  expect(await text(xray)).not.toContain('timeout:');
  // the space on the left is one value in every colorway, but the deck is drawn at the root: a stylesheet, at :root
  await part(xray, 'Shape');
  await drag(page, card.getByRole('slider', { name: 'Space on the left' }), -12, 0);
  await expect(code(xray)).toContainText(`import './undo-toast.css';`);
  expect(await text(xray)).not.toMatch(/--mu-|style=|className=/);
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain(':root {');
  expect(sheet).toContain('--mu-r-toast-self-pad-left:');
  expect(sheet).not.toContain('--mu-r-toast-self-shadow');
  // the lift is the pill's shadow stack: colours, so one set per colorway, derived from the recipe and said so
  await part(xray, 'Shadow');
  await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -30);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for lift');
  expect(sheet).toContain(':root, [data-mu-colorway="bone"] {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] {');
  expect(sheet.match(/--mu-r-toast-self-shadow:/g)).toHaveLength(2);
  // the glass is still the recipe's, so it is not set
  expect(sheet).not.toContain('--mu-r-toast-self-background');
  // a layer off is in its own stack
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Rim' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('rim off');
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the same call, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('tone: .success');
  expect(swift).not.toMatch(/sub:|undo:/);
  expect(swift).toContain('not per-instance values in SwiftUI');
  // reset: back to the guide's example
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`sub: 'undo it any time',`);
  expect(await text(xray)).not.toMatch(/tone:|\.css|--mu-/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Space around the cap' }), 8, 0);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

/** The handling every live-toast slice gives the toast: more room on the left, lifted higher. */
async function handle(page: Page, xray: Locator) {
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  await drag(page, card.getByRole('slider', { name: 'Space on the left' }), -12, 0);
  await part(xray, 'Shadow');
  await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -30);
  await part(xray, 'Layers');
}

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} raises a live toast that is the specimen to the pixel, in every colorway`, async ({ page }) => {
    test.slow();
    const xray = await openXray(page, start);
    await handle(page, xray);
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    // the same snippet, run on a fresh page in each colorway beside a specimen handled the same way
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) { await openXray(page, colorway); await handle(page, xray); }
      const card = xray.locator('.xr-card');
      const button = await render(page, xray, snippet);
      const specimen = card.locator('.ed-specimen .mu-toast');
      const live = page.locator('.mu-toast-viewport .mu-toast');
      // the live toast is drawn at the bottom of the page, life size, over whatever is there; for the comparison the
      // specimen is shown life size too, and both sit on the page colour
      // The sticky header stays put, so it never covers the specimen wherever the page is scrolled to.
      await page.addStyleTag({ content: 'body > #root header { position: static !important; } #x-ray .ed-specimen { background: var(--page) !important; box-shadow: none !important; } #x-ray .ed-specimen > div { zoom: 1 !important; }' });
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await expect(live).toHaveCount(1);
      // arrived: out of its starting pose, fully in, and every transition of its arrival done
      await expect(live).not.toHaveAttribute('data-starting-style', '');
      await expect(live).toHaveCSS('opacity', '1');
      await live.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
      // both on the pixel grid, by layout: the deck centres its card at a fraction, and the card's layout can leave the
      // specimen at one; glyphs are placed at sub-pixel offsets, so a fraction's difference shows at their edges
      await live.evaluate((el) => Object.assign((el as HTMLElement).style, { insetInline: '100px auto', marginInline: '0' }));
      await specimen.evaluate((el) => { const st = (el as HTMLElement).style; st.marginLeft = st.marginTop = ''; const r = el.getBoundingClientRect(); st.marginLeft = `${Math.round(r.x) - r.x}px`; st.marginTop = `${Math.round(r.y) - r.y}px`; });
      // the pointer on its words, where it now is, holds its timer while it is measured (a deck of one fans out to
      // the same place); nothing moves the pointer again before the shots, or the toast would go on its own time
      await live.locator('.mu-toast-text').hover();
      await expect(live).toHaveAttribute('data-expanded', '');
      // the ground under the live toast: in its own deck, so it is under the card and over whatever the page has there,
      // and wide enough that the glass's blur samples nothing else
      const b0 = (await live.boundingBox())!;
      await live.evaluate((el, b) => {
        const ground = Object.assign(document.createElement('div'), { id: 'ground' });
        Object.assign(ground.style, { position: 'fixed', zIndex: '0', background: 'var(--page)', pointerEvents: 'none', left: `${b.x - 80}px`, top: `${b.y - 80}px`, width: `${b.width + 160}px`, height: `${b.height + 160}px` });
        el.parentElement!.prepend(ground);
      }, b0);
      // The specimen in the middle of the window, scrolled there last of all (a click scrolls too, to bring its
      // button into view): clear of the deck and the ground at the bottom. At once, since the page scrolls smoothly
      // and a shot mid-scroll would catch it elsewhere; and then checked, so a shot never compares a covered specimen.
      await specimen.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await expect.poll(async () => (await specimen.boundingBox())!.y).toBeGreaterThan(150);
      // two frames, so the ground and the moves above are painted before the shots
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      const [a, b] = await Promise.all([specimen.boundingBox(), live.boundingBox()]);
      expect(a!.y).toBeGreaterThan(150);
      expect(a!.y + a!.height).toBeLessThan(b!.y - 100);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      // the same box of pixels: each is clipped by its rounded box
      const shot = async (el: Locator) => { const r = (await el.boundingBox())!; return page.screenshot({ clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } }); };
      // the page settles on its own time (a loaded machine paints the ground, the scroll and the glass late), so the
      // shots are taken until they agree, a few times at most; a toast that really differs never agrees
      let d = { off: 1, mean: 255, size: '' };
      for (let tries = 0; tries < 6 && !(d.off < 0.01 && d.mean < 4); tries++) {
        if (tries) await page.waitForTimeout(400);
        d = await compare(page, await shot(specimen), await shot(live));
      }
      console.log(`live toast from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-toast-${start}-in-${colorway}`), clip: { x: b!.x - 24, y: b!.y - 24, width: b!.width + 48, height: b!.height + 48 } });
      expect(d.off).toBeLessThan(0.01);
      expect(d.mean).toBeLessThan(4);
    }
  });
}

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // the table's objects overlap at this width, so the toast takes the click itself
  await page.locator('[data-float="toast"] .mu-toast').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText(`title: 'Moved 3 blocks'`);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
