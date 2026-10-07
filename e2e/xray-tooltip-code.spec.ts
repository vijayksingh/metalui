import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The tooltip x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the agent
// guide's shape (a provider, a tooltip, its trigger) and nothing more. The chip lives in a portal, so
// what you tune reaches it through the one hook the library gives a host: a class on the popup, and a
// stylesheet that sets the recipe's variables on it.

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/tooltip');
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
  // a handle in the popup moves with its tool once the page has scrolled, so the box is read after the scroll has settled
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
    // the snippet's popup is portalled like any tooltip's, so the specimen's zoom is given to it the same way the specimen gets its own
    const sheet = document.createElement('style');
    sheet.textContent = `.mu-tooltip-positioner .mu-tooltip:not(.ed-tip) { zoom: ${zoomed.style.zoom}; }`;
    mount.before(sheet);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, 'SelectTool');
  }, { js, css: snippet.CSS ?? '' });
  return xray.locator('#snippet .mu-icon-button');
}
/** Points at the rendered tool and waits for its real tooltip to be fully shown. */
async function shown(page: Page, tool: Locator) {
  await page.mouse.move(0, 0);
  await tool.hover();
  const popup = page.locator('.mu-tooltip-positioner .mu-tooltip:not(.ed-tip)');
  await expect(popup).toBeVisible();
  await expect(popup).toHaveCSS('opacity', '1');
  return popup;
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'SelectTool.tsx');
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS) fs.writeFileSync(path.join(dir, 'select-tip.css'), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'], '@unlocalhosted/metalui/icons': ['../../packages/metalui/src/icons.ts'] },
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

/** Two chips, pixel for pixel: the share of pixels that differ clearly, and the mean difference. */
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

test('at defaults the code is the guide\'s shape: a provider, the tooltip and its trigger, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`import { IconButton, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';`);
  expect(react).toContain('<TooltipProvider>');
  expect(react).toContain(`<Tooltip label="Select" shortcut="V">`);
  expect(react).toContain(`<IconButton variant="tool" label="Select" icon={<Icon name="select" size={16} />} />`);
  expect(react).not.toMatch(/side=|offset=|delay=|wrap|className=|style=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('.metalTooltip("Select", shortcut: "V")');
  expect(swift).toContain('.accessibilityLabel("Select")');
  expect(swift).not.toMatch(/edge:|recipe|not per-instance/);
});

test('every tweak reaches the code: props as props, the chip\'s recipe through its class and a stylesheet', async ({ page }) => {
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the side is a prop
  await part(xray, 'Place');
  await step(page, page.getByRole('slider', { name: 'Side' }), 'ArrowRight');
  await expect(code(xray)).toContainText(`side="right"`);
  // the gap is the offset prop
  await step(page, readout(card, 'Gap'), 'ArrowUp', 4);
  await expect(code(xray)).toContainText('offset={14}');
  // the wait is the delay prop
  await part(xray, 'Timing');
  await step(page, readout(card, 'Wait'), 'ArrowUp', 3);
  await expect(code(xray)).toContainText('delay={150}');
  // the key off: no shortcut
  await part(xray, 'Type');
  await card.getByRole('switch', { name: 'Show the key' }).click();
  expect(await text(xray)).not.toContain('shortcut=');
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the space on the sides is a recipe variable: the chip is in a portal, so a class on it and a stylesheet carry it
  await part(xray, 'Shape');
  await drag(page, page.getByRole('slider', { name: 'Space on the sides' }), 12, 0);
  await expect(code(xray)).toContainText(`import './select-tip.css';`);
  await expect(code(xray)).toContainText('className="select-tip"');
  expect(await text(xray)).not.toMatch(/style=|--mu-/);
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('.select-tip {');
  expect(sheet.match(/--mu-r-tooltip-self-pad-x:/g)).toHaveLength(1);
  expect(sheet).not.toContain('--mu-r-tooltip-self-shadow');
  // the corner too, one value in every colorway
  await drag(page, page.getByRole('slider', { name: 'Corners' }), -8, -8);
  sheet = (await files(xray)).CSS!;
  expect(sheet.match(/--mu-r-tooltip-self-radius:/g)).toHaveLength(1);
  // the long note: a wrapped label with its detail in Tooltip.Dim
  await card.getByRole('switch', { name: 'Long note' }).click();
  await expect(code(xray)).toContainText('<Tooltip.Dim>');
  await expect(code(xray)).toContainText(' wrap');
  await card.getByRole('switch', { name: 'Long note' }).click();
  // the height above the page is the shadow stack: colours, so one set per colorway, derived from the recipe and said so
  await part(xray, 'Shadow');
  await drag(page, page.getByRole('slider', { name: 'Height above the page' }), 0, -30);
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for height');
  expect(sheet).toContain('.select-tip, [data-mu-colorway="bone"] .select-tip {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .select-tip {');
  expect(sheet.match(/--mu-r-tooltip-self-shadow:/g)).toHaveLength(2);
  expect(sheet).not.toContain('--mu-r-tooltip-self-background');
  // a layer off is in the stack; the glass off is the fill
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Dark glass' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('dark glass off');
  expect(sheet.match(/--mu-r-tooltip-self-background:/g)).toHaveLength(2);
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the label, no key, and one line about what its API does not take
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('.metalTooltip("Select")');
  expect(swift).not.toContain('shortcut:');
  expect(swift).toContain('not per-instance in SwiftUI');
  // reset: back to the guide's shape
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`<Tooltip label="Select" shortcut="V">`);
  expect(await text(xray)).not.toMatch(/side=|offset=|delay=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('a side below is the edge in SwiftUI; a side beside has none there', async ({ page }) => {
  const xray = await openXray(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Place');
  await step(page, page.getByRole('slider', { name: 'Side' }), 'ArrowDown');
  await expect(code(xray)).toContainText(`side="bottom"`);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  await expect(code(xray)).toContainText('edge: .bottom');
  await xray.getByRole('tab', { name: 'React' }).click();
  await step(page, page.getByRole('slider', { name: 'Side' }), 'ArrowLeft');
  await expect(code(xray)).toContainText(`side="left"`);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).not.toContain('edge:');
  expect(swift).toContain('above or below');
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await drag(page, page.getByRole('slider', { name: 'Space on the sides' }), 12, 0);
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
    await part(xray, 'Place');
    await step(page, page.getByRole('slider', { name: 'Side' }), 'ArrowRight');
    await part(xray, 'Shape');
    await drag(page, page.getByRole('slider', { name: 'Space on the sides' }), 12, 0);
    await drag(page, page.getByRole('slider', { name: 'Corners' }), -8, -8);
    await part(xray, 'Shadow');
    await drag(page, page.getByRole('slider', { name: 'Height above the page' }), 0, -30);
    await part(xray, 'Layers');
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const tool = await render(page, xray, snippet);
    const specimen = page.locator('.ed-tip.mu-tooltip');
    // the real tooltip, pointed at: the same side, the same boxes, then the same pixels, in the colorway it was
    // copied in and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const popup = await shown(page, tool);
      await expect(popup.locator('xpath=..')).toHaveAttribute('data-side', 'right');
      const [a, b] = await Promise.all([specimen.boundingBox(), popup.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      const d = await compare(page, await specimen.screenshot(), await popup.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-tooltip-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
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
  await page.locator('[data-float="tooltip"] .mu-tooltip').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText(`<Tooltip label="Select" shortcut="V">`);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
