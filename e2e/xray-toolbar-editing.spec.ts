import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The toolbar x-ray's editing layer: each card holds the real graphite toolbar, changed by
// handling it. Its handles, readouts and switches change the same model the bench draws.

const SPOTS = ['Strip', 'Tools', 'Groove', 'Shape', 'Shadow', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');
const num = async (l: Locator) => Number(await l.textContent());
// the bench's body is the real toolbar: its strip plane, and the groove on it
const benchStrip = (xray: Locator) => xray.locator('.xr-iso .xr-segface.is-tbstrip .mu-toolbar');
const benchGroove = (xray: Locator) => xray.locator('.xr-iso .xr-segface.is-tbstrip .mu-toolbar-sep');
const style = (l: Locator, prop: string) => l.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const left = (l: Locator) => l.evaluate((el) => el.getBoundingClientRect().left);

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/toolbar');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`toolbar cards hold one real toolbar, never a slider, in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of SPOTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-toolbar')).toHaveCount(1);
      await expect(card.locator('.ed-specimen .mu-tool')).toHaveCount(4);
      await expect(card.locator('.mu-slider, .xr-dial, .mu-switcher')).toHaveCount(0);
    }
  });
}

test('tools: the pressed tool leans, then snaps onto a real tool, on the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Tools');
  const handle = card.getByRole('slider', { name: 'Tool', exact: true });
  const tools = ['Select', 'Note', 'Draw', 'Tidy'];
  const start = (await handle.getAttribute('aria-valuetext'))!;
  expect(tools).toContain(start);
  const i = tools.indexOf(start);
  // a small nudge only leans: nothing is picked, and the target lights up
  await handle.scrollIntoViewIfNeeded();
  const b = (await handle.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 5, b.y + b.height / 2, { steps: 4 });
  await expect(card.locator('.ed-tb-lean')).toHaveCount(1);
  await expect(handle).toHaveAttribute('aria-valuetext', start);
  await page.mouse.up();
  await expect(card.locator('.ed-tb-lean')).toHaveCount(0);
  // far enough, it clicks over to the next real tool, never between
  await drag(page, handle, 24, 0);
  const next = (await handle.getAttribute('aria-valuetext'))!;
  expect(tools).toContain(next);
  expect(tools.indexOf(next)).toBeGreaterThan(i);
  await expect(card.locator('.mu-tool[aria-pressed="true"]')).toHaveCount(1);
  await expect(card.locator('.mu-tool[aria-pressed="true"]')).toHaveAttribute('aria-label', next);
  await expect(xray.locator('.xr-tool[data-down]')).toHaveAttribute('data-tool', next.toLowerCase());
  // clicking another real cap still picks it
  await card.locator('.mu-tool[aria-label="Select"]').click();
  await expect(xray.locator('.xr-tool[data-down]')).toHaveAttribute('data-tool', 'select');
  await expect(handle).toHaveAttribute('aria-valuetext', 'Select');
});

test('strip, gap, groove, corners and lift handles change the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  const strip = card.locator('.ed-specimen .mu-toolbar');
  const width = () => strip.evaluate((el) => el.getBoundingClientRect().width);

  await part(xray, 'Strip');
  const pad0 = await num(value(card, 'Space around the tools'));
  const bench0 = await style(benchStrip(xray), 'width');
  const w0 = await width();
  await card.locator('.ed-tb').hover();
  await drag(page, card.getByRole('slider', { name: 'Space around the tools' }), 5, 0);
  await expect(value(card, 'Space around the tools')).not.toHaveText(String(pad0));
  expect(await width()).toBeGreaterThan(w0);
  expect(await style(benchStrip(xray), 'width')).not.toBe(bench0);

  await part(xray, 'Tools');
  const gap0 = await num(value(card, 'Space between tools'));
  const w1 = await width();
  const tidy = await xray.locator('.xr-tool[data-tool="tidy"] .xr-thumb').evaluate((el) => (el as HTMLElement).style.transform);
  await card.locator('.ed-tb').hover();
  await drag(page, card.getByRole('slider', { name: 'Space between tools' }), 14, 0);
  await expect(value(card, 'Space between tools')).not.toHaveText(String(gap0));
  expect(await width()).toBeGreaterThan(w1);
  expect(await xray.locator('.xr-tool[data-tool="tidy"] .xr-thumb').evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(tidy);

  await part(xray, 'Groove');
  const m0 = await num(value(card, 'Space beside the groove'));
  const groove0 = await left(benchGroove(xray));
  const w2 = await width();
  await card.locator('.ed-tb').hover();
  await drag(page, card.getByRole('slider', { name: 'Space beside the groove' }), 14, 0);
  await expect(value(card, 'Space beside the groove')).not.toHaveText(String(m0));
  expect(await width()).toBeGreaterThan(w2);
  expect(await left(benchGroove(xray))).not.toBe(groove0);
  await card.getByRole('switch', { name: 'Groove' }).click();
  await expect(card.locator('.mu-toolbar-sep')).toHaveCount(0);
  await expect(benchGroove(xray)).toHaveCount(0);
  await card.getByRole('switch', { name: 'Groove' }).click();
  await expect(card.locator('.mu-toolbar-sep')).toHaveCount(1);

  await part(xray, 'Shape');
  const r0 = await num(value(card, 'Outer corners'));
  const benchR = await style(benchStrip(xray), 'border-radius');
  await card.locator('.ed-tb').hover();
  await drag(page, card.getByRole('slider', { name: 'Outer corners' }), -30, -30);
  await expect(value(card, 'Outer corners')).not.toHaveText(String(r0));
  await expect(card.getByRole('switch', { name: 'Corners follow the caps' })).toHaveAttribute('aria-checked', 'false');
  const r1 = await num(value(card, 'Outer corners'));
  await expect(strip).toHaveCSS('border-radius', `${r1}px`);
  expect(await style(benchStrip(xray), 'border-radius')).not.toBe(benchR);
  await card.getByRole('switch', { name: 'Corners follow the caps' }).click();
  await expect(value(card, 'Outer corners')).not.toHaveText(String(r1));

  await part(xray, 'Shadow');
  const lift0 = await value(card, 'Height above the page').textContent();
  const shadow0 = await strip.evaluate((el) => getComputedStyle(el).boxShadow);
  const far0 = await style(xray.locator('.xr-shadow').first(), 'transform');
  await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -16);
  await expect(value(card, 'Height above the page')).not.toHaveText(lift0!);
  expect(await strip.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(shadow0);
  expect(await style(xray.locator('.xr-shadow').first(), 'transform')).not.toBe(far0);
});

test('tunables catch on their token: the LED lights there and goes dark off it', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Tools');
  const readout = card.locator('.ed-readout').filter({ hasText: 'Space between tools' });
  await expect(readout.locator('.mu-led')).toHaveAttribute('data-kind', 'live');
  await readout.focus();
  await page.keyboard.press('ArrowUp');
  await expect(readout.locator('.mu-led')).not.toHaveAttribute('data-kind', 'live');
  await page.keyboard.press('ArrowDown');
  await expect(readout.locator('.mu-led')).toHaveAttribute('data-kind', 'live');
});

test('layer switches remove the same layer from specimen and bench; hover lights it', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const strip = card.locator('.ed-specimen .mu-toolbar');
  const shadow = await strip.evaluate((el) => getComputedStyle(el).boxShadow);
  await card.locator('.ed-layer').filter({ hasText: 'Far shadow' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus')).toHaveCount(1);
  await card.getByRole('switch', { name: 'Far shadow' }).click();
  await expect(card.getByRole('switch', { name: 'Far shadow' })).toHaveAttribute('aria-checked', 'false');
  await expect(xray.locator('.xr-face.is-layer.is-off')).toHaveCount(1);
  expect(await strip.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(shadow);
});

test('readouts scrub by drag and by arrows; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Strip');
  const pad0 = await num(value(card, 'Space around the tools'));
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'Space around the tools' }), 0, -24);
  const pad1 = await num(value(card, 'Space around the tools'));
  expect(pad1).toBeGreaterThan(pad0);
  await card.locator('.ed-readout').filter({ hasText: 'Space around the tools' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Space around the tools')).toHaveText(String(pad1 - 1));
  // the tool steps through the real tools only
  await part(xray, 'Tools');
  const tool = card.locator('.ed-readout').filter({ hasText: 'Tool' }).first();
  const t0 = await value(card, 'Tool').first().textContent();
  await tool.focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Tool').first()).not.toHaveText(t0!);
  expect(['Select', 'Note', 'Draw', 'Tidy']).toContain(await value(card, 'Tool').first().textContent());
  await card.getByRole('slider', { name: 'Space between tools' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Space between tools');
});

test('graphite at 375 px: the floating table opens the toolbar x-ray, and its cards never scroll sideways', async ({ page }) => {
  // the toolbar's own docs page has a wide playground; the overview's x-ray overlay is the x-ray alone
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  await page.waitForSelector('[data-float="toolbar"]');
  // the strip (not a tool cap) opens the toolbar's x-ray
  await page.locator('[data-float="toolbar"] .mu-toolbar').click({ force: true, position: { x: 3, y: 3 } });
  await page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
  const xray = page.locator('.xr-overlay');
  const card = xray.locator('.xr-card');
  for (const name of SPOTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-toolbar')).toHaveCount(1);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
  }
  // the widest the strip gets still fits the card
  await part(xray, 'Tools');
  const readout = card.locator('.ed-readout').filter({ hasText: 'Space between tools' });
  await readout.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowUp');
  const [s, w] = await Promise.all([card.locator('.ed-specimen .mu-toolbar').boundingBox(), card.locator('.ed-specimen').boundingBox()]);
  expect(s!.x + s!.width).toBeLessThanOrEqual(w!.x + w!.width);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
  await page.screenshot({ path: 'test-results/xray-toolbar-375-graphite.png' });
});
