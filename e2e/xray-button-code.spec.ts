import { expect, test, type Locator, type Page } from '@playwright/test';
import { transformSync } from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { COLORWAYS, capture } from './helpers';

// The button x-ray is a tweak surface: under its card, the code for exactly the config you have
// handled, which you can copy, and which renders as the specimen does. At defaults it is the agent
// guide's example and nothing more.

/** Opens the button's x-ray from the table, the way a person does, and waits for the flight to land. */
async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="button"]');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-float="button"] .mu-button').click({ force: true });
  await page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
  return page.locator('.xr-overlay .xr');
}
/** Opens the x-ray on the Button page, where the workbench drives it and the site's banner stays reachable. */
async function openPage(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/button');
  await page.evaluate(() => document.fonts.ready);
  const workbench = page.locator('.button-workbench');
  await workbench.getByRole('button', { name: 'X-ray', exact: true }).click();
  return workbench.locator('.button-xray');
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
/** The snippet's own names: its component, and its stylesheet when it has one. */
const named = (react: string) => ({ component: /export function (\w+)/.exec(react)![1], sheet: /import '\.\/([\w-]+\.css)'/.exec(react)?.[1] });
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
  await xray.locator('.ed-specimen').first().evaluate(async (well, { js, css, name }) => {
    const zoomed = well.firstElementChild as HTMLElement;
    const mount = document.createElement('div');
    mount.id = 'snippet';
    mount.style.zoom = zoomed.style.zoom;
    // clear of the specimen's own drop shadow, which would fall on the copy's top edge
    mount.style.marginTop = '32px';
    zoomed.after(mount);
    const lab = await import('/src/ui/xray/snippet-lab.ts');
    lab.runSnippet(js, css, mount, name, { onClick: () => {} });
  }, { js, css: snippet.CSS ?? '', name: named(snippet.React).component });
  return xray.locator('#snippet .mu-button');
}

/** Type-checks the snippet as a file in an ordinary strict module, with the library's real types. */
function typeErrors(snippet: { React: string; CSS?: string }) {
  const dir = path.resolve('test-results/snippet-check-button');
  fs.mkdirSync(dir, { recursive: true });
  const { component, sheet } = named(snippet.React);
  const file = path.join(dir, `${component}.tsx`);
  fs.writeFileSync(file, snippet.React);
  if (snippet.CSS && sheet) fs.writeFileSync(path.join(dir, sheet), snippet.CSS);
  const program = ts.createProgram([file], {
    strict: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], skipLibCheck: true, types: ['vite/client'],
    baseUrl: path.resolve('apps/docs'), paths: { '@unlocalhosted/metalui': ['../../packages/metalui/src/index.ts'], '@unlocalhosted/metalui/icons': ['../../packages/metalui/src/icons/index.tsx'] },
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

test('at defaults the code is the guide\'s example: the label and the cap, no overrides', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const react = await text(xray);
  expect(react).toContain(`<Button cap="primary" onClick={onClick}>Get started</Button>`);
  expect(react).toContain(`import { Button } from '@unlocalhosted/metalui';`);
  expect(react).not.toMatch(/size=|style=|className=|--mu-|\.css|icons/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalButton("Get started", cap: .primary, action: action)');
  expect(swift).not.toMatch(/size:|recipe|disabled/);
});

test('every tweak reaches the code: props as props, tunables as the library\'s variables, type and corners by style', async ({ page }) => {
  // the strict type-check compiles the library's source alongside the snippet: seconds, more under a loaded machine
  test.slow();
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // the padding is one value in every colorway: the recipe's variable, on the button itself
  await part(xray, 'Shape');
  await drag(page, card.getByRole('slider', { name: 'Padding' }), 12, 0);
  await expect(code(xray)).toContainText(`'--mu-r-button-self-pad': '`);
  await expect(code(xray)).toContainText('as CSSProperties');
  await expect(code(xray)).toContainText(`import type { CSSProperties } from 'react';`);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
  // the corners have no recipe variable: the button's own style, and the code says so
  await card.locator('.ed-box').hover();
  await drag(page, card.getByRole('slider', { name: 'Corner roundness' }), -40, -40);
  await expect(code(xray)).toContainText('borderRadius: 0');
  // the type leaves the ui type role: the button's own style, and the code says so
  await part(xray, 'Type');
  await drag(page, card.getByRole('slider', { name: 'Label size and spacing' }), 0, -24);
  await expect(code(xray)).toContainText('fontSize: ');
  await expect(code(xray)).toContainText('leaves the ui type role');
  // how far it sinks is the travel variable
  await part(xray, 'Press');
  await card.locator('.ed-readout').filter({ hasText: 'sinks' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(code(xray)).toContainText(`'--mu-r-button-self-travel': '1.25px'`);
  // the height above the page is the shadow stack: colours, so a stylesheet with one set per colorway, derived from the recipe and said so
  await part(xray, 'Shadow');
  await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -14);
  await expect(code(xray)).toContainText(`import './get-started.css';`);
  await expect(code(xray)).toContainText('className="get-started"');
  expect(await text(xray)).not.toContain('--mu-r-button-primary-shadow');
  let sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('derived from its recipe for height');
  expect(sheet).toContain('.get-started, [data-mu-colorway="bone"] .get-started {');
  expect(sheet).toContain('[data-mu-colorway="graphite"] .get-started {');
  expect(sheet.match(/--mu-r-button-primary-shadow:/g)).toHaveLength(2);
  // the fill is still the recipe's, so it is not set
  expect(sheet).not.toContain('--mu-r-button-primary-background');
  // a layer off is in the stack
  await part(xray, 'Layers');
  await card.getByRole('switch', { name: 'Drop' }).click();
  sheet = (await files(xray)).CSS!;
  expect(sheet).toContain('drop off');
  // the light turns the fill too
  await part(xray, 'Light');
  await drag(page, card.getByRole('slider', { name: 'Light direction and strength' }), 40, 10);
  sheet = (await files(xray)).CSS!;
  expect(sheet.match(/--mu-r-button-primary-background:/g)).toHaveLength(2);
  expect(sheet).toContain('light');
  // and the whole thing type-checks as a strict module
  expect(typeErrors(await files(xray) as { React: string; CSS?: string })).toEqual([]);
  // SwiftUI: the props, and one line about what the recipe keeps
  await xray.getByRole('tab', { name: 'SwiftUI' }).click();
  const swift = await text(xray);
  expect(swift).toContain('MetalButton("Get started", cap: .primary, action: action)');
  expect(swift).toContain('not per-instance props in SwiftUI');
  // reset: back to the guide's example
  await xray.getByRole('button', { name: 'Reset' }).click();
  await xray.getByRole('tab', { name: 'React' }).click();
  await expect(code(xray)).toContainText(`<Button cap="primary" onClick={onClick}>Get started</Button>`);
  expect(await text(xray)).not.toMatch(/style=|className=|--mu-|\.css/);
  await expect(xray.getByRole('tab', { name: 'CSS' })).toHaveCount(0);
});

test('copy puts the code on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const xray = await openXray(page, 'graphite');
  await part(xray, 'Shape');
  await drag(page, xray.locator('.xr-card').getByRole('slider', { name: 'Padding' }), 12, 0);
  const shown = await text(xray);
  await xray.locator('.xr-code').getByRole('button', { name: 'Copy' }).click();
  await expect(xray.locator('.xr-code')).toContainText('Copied');
  // the file ends in a newline the <pre> does not draw
  expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(shown.trimEnd());
});

for (const start of COLORWAYS) {
  test(`the snippet copied in ${start} renders as the specimen does, in every colorway`, async ({ page }) => {
    test.slow();
    const xray = await openPage(page, start);
    const card = xray.locator('.xr-card');
    await part(xray, 'Shape');
    await drag(page, card.getByRole('slider', { name: 'Padding' }), 12, 0);
    await card.locator('.ed-box').hover();
    await drag(page, card.getByRole('slider', { name: 'Corner roundness' }), -16, -16);
    await part(xray, 'Shadow');
    await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -14);
    await part(xray, 'Light');
    await drag(page, card.getByRole('slider', { name: 'Light direction and strength' }), 30, 4);
    await part(xray, 'Layers');
    const snippet = await files(xray) as { React: string; CSS?: string };
    expect(typeErrors(snippet)).toEqual([]);
    const rendered = await render(page, xray, snippet);
    // the specimen's own button: the snippet is mounted beside it, in the same well
    const specimen = card.locator('.ed-specimen > :not(#snippet) .mu-button');
    await expect(rendered).toHaveText('New Canvas');
    // the same boxes, then the same pixels: in the colorway it was copied in, and in the other one
    for (const colorway of [start, ...COLORWAYS.filter((c) => c !== start)]) {
      if (colorway !== start) await colorway_(page, colorway);
      const [a, b] = await Promise.all([specimen.boundingBox(), rendered.boundingBox()]);
      expect(Math.abs(a!.width - b!.width)).toBeLessThan(0.5);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(0.5);
      await page.mouse.move(0, 0);
      const d = await compare(page, await specimen.screenshot(), await rendered.screenshot());
      console.log(`snippet from ${start} vs specimen in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255 (${d.size})`);
      await page.screenshot({ path: capture(`xray-code-button-${start}-in-${colorway}`), clip: (await card.boundingBox())! });
      expect(d.off).toBeLessThan(0.01);
      expect(d.mean).toBeLessThan(1.5);
    }
  });
}

test('the Button page\'s workbench drives the same config, and the code follows it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'bone'));
  await page.goto('/components/button');
  await page.evaluate(() => document.fonts.ready);
  const workbench = page.locator('.button-workbench');
  await workbench.getByRole('button', { name: 'X-ray', exact: true }).click();
  const xray = workbench.locator('.button-xray');
  await expect(code(xray)).toContainText(`<Button cap="primary" onClick={onClick}>New Canvas</Button>`);
  // the workbench's own handles reach the code the same way
  await workbench.getByRole('slider', { name: 'Button height' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(code(xray)).toContainText(`'--mu-r-button-self-height': '34px'`);
  await expect(xray.locator('.xr-segface.is-top .mu-button')).toHaveAttribute('style', /--mu-r-button-self-height:\s*34px/);
  await workbench.getByRole('textbox', { name: 'Button label' }).fill('Create');
  await expect(code(xray)).toContainText('export function Create(');
  await expect(xray.locator('.xr-segface.is-top .mu-button')).toHaveText('Create');
});

test('the code panel fits a phone and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // the table's objects overlap at this width, so the button takes the click itself
  await page.locator('[data-float="button"] .mu-button').dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-code pre code')).toContainText('Get started');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
