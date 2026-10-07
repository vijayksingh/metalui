import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The toast x-ray is handled, not slid: each card holds the toast standing still (the live card part
// for part), and every handle changes both the specimen and the model on the bench, whose pill and
// cap are that same still, twice.

const PARTS = ['Timing', 'Type', 'Undo', 'Shape', 'Shadow', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: new RegExp(`^${name}`, 'i') });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const now = async (handle: Locator) => Number(await handle.getAttribute('aria-valuenow'));
const css = (el: Locator, prop: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);
const inline = (el: Locator, prop: string) => el.evaluate((node, p) => (node as HTMLElement).style.getPropertyValue(p), prop);
/** How much the specimen is magnified, so a drag can be sized in the toast's own points. */
const zoomOf = (card: Locator) => card.locator('.ed-specimen > div').evaluate((el) => Number((el as HTMLElement).style.zoom) || 1);

async function grab(page: Page, target: Locator) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return { x, y };
}
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  const { x, y } = await grab(page, target);
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/toast');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`toast cards hold one real specimen and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of PARTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-toast')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .xr-dials')).toHaveCount(0);
    }
  });
}

test('timing: pull the toast down to where it rises from, and let go to see it arrive', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Timing');
  const grip = card.getByRole('slider', { name: 'Rises from' });
  const start = await now(grip);
  const zoom = await zoomOf(card);
  const { x, y } = await grab(page, grip);
  await page.mouse.move(x, y + 10 * zoom, { steps: 8 });
  // while held, the specimen and the bench both sit at the pose it rises from
  const held = await now(grip);
  expect(held).toBeGreaterThan(start);
  await expect(value(card, 'rises from')).toHaveText(String(held));
  expect(await inline(grip, 'translate')).toContain(`${held}px`);
  expect(await inline(xray.locator('.xr-toastwrap'), 'transform')).toContain('translate3d');
  await page.mouse.up();
  // let go, and both play the arrival from there
  await expect(card.locator('.ed-toast-in')).toHaveCount(1);
  await expect(xray.locator('.xr-toastwrap.ed-toast-benchin')).toHaveCount(1);
  expect(await inline(xray.locator('.xr-toastwrap'), '--rise')).not.toBe(`${start * 2.4}px`);
  // how long it stays follows Undo
  await expect(value(card, 'stays')).toHaveText('5');
});

test('type: the space before the detail is dragged in the gap; the detail switches off on both', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const gap = card.getByRole('slider', { name: 'Space before the detail' });
  const start = await now(gap);
  const bench = xray.locator('.xr-segface.is-well .mu-toast');
  const benchGap = await css(bench.locator('.mu-toast-text'), 'column-gap');
  const specimenGap = await css(card.locator('.ed-specimen .mu-toast-text'), 'column-gap');
  await drag(page, gap, 6 * (await zoomOf(card)), 0);
  expect(await now(gap)).toBeGreaterThan(start);
  expect(await css(card.locator('.ed-specimen .mu-toast-text'), 'column-gap')).not.toBe(specimenGap);
  expect(await css(bench.locator('.mu-toast-text'), 'column-gap')).not.toBe(benchGap);
  const detail = card.getByRole('switch', { name: 'Detail' });
  await detail.click();
  await expect(detail).toHaveAttribute('aria-checked', 'false');
  await expect(card.locator('.ed-specimen .mu-toast-sub')).toHaveCount(0);
  await expect(bench.locator('.mu-toast-sub')).toHaveCount(0);
  // the kind steps on the glyph: one of its kinds before and after, never between
  const kind = card.getByRole('slider', { name: 'Kind' });
  await expect(kind).toHaveAttribute('aria-valuetext', 'plain');
  await drag(page, kind, 0, 12);
  await expect(kind).toHaveAttribute('aria-valuetext', 'success');
  await expect(value(card, 'kind')).toHaveText('success');
  await expect(card.locator('.ed-specimen .mu-toast')).toHaveAttribute('data-type', 'success');
  await expect(bench).toHaveAttribute('data-type', 'success');
});

test('undo: pressing the cap sinks it on the specimen and the bench; Undo switches off on both', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Undo');
  const cap = card.getByRole('button', { name: 'Undo' });
  // the cap on the bench is the raised copy of the still: it sinks with the press
  const benchCap = xray.locator('.xr-segface.is-raised');
  const up = await inline(benchCap, 'transform');
  await grab(page, cap);
  await expect(cap).toHaveAttribute('aria-pressed', 'true');
  expect(await inline(cap, 'translate')).toBe('0px 1px');
  expect(await inline(benchCap, 'transform')).not.toBe(up);
  await page.mouse.up();
  await expect(cap).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => inline(benchCap, 'transform')).toBe(up);
  const toggle = card.getByRole('switch', { name: 'Undo' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(card.locator('.ed-specimen .mu-toast-undo')).toHaveCount(0);
  await expect(benchCap.locator('.mu-toast-undo')).toHaveCount(0);
  await part(xray, 'Timing');
  await expect(value(card, 'stays')).toHaveText('2.6');
});

test('shape: the left end sets the space before the words, the right end the glass around the cap', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const zoom = await zoomOf(card);
  // the pill's wall on the bench is as wide as the still
  const pill = xray.locator('.xr-toastwrap .xr-slice').first();
  const left = card.getByRole('slider', { name: 'Space on the left' });
  const start = await now(left);
  const width = await inline(pill, 'width');
  const pad = await css(card.locator('.ed-specimen .mu-toast'), 'padding-left');
  await drag(page, left, -5 * zoom, 0);
  expect(await now(left)).toBeGreaterThan(start);
  expect(await css(card.locator('.ed-specimen .mu-toast'), 'padding-left')).not.toBe(pad);
  expect(await inline(pill, 'width')).not.toBe(width);
  const right = card.getByRole('slider', { name: 'Space around the cap' });
  const r0 = await now(right);
  const width2 = await inline(pill, 'width');
  await drag(page, right, 4 * zoom, 0);
  expect(await now(right)).toBeGreaterThan(r0);
  expect(await inline(pill, 'width')).not.toBe(width2);
});

test('a tunable catches on its token: a small drag off it lands back, a long one leaves it', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const zoom = await zoomOf(card);
  const left = card.getByRole('slider', { name: 'Space on the left' });
  const token = await now(left);
  await expect(readout(card, 'space on the left')).toHaveAttribute('aria-label', /toast recipe token/);
  await drag(page, left, 0.8 * zoom, 0);
  expect(await now(left)).toBe(token);
  await drag(page, left, -4 * zoom, 0);
  expect(await now(left)).toBeGreaterThan(token + 2);
  await expect(readout(card, 'space on the left')).toHaveAttribute('aria-label', /tuned/);
});

test('shadow: lifting the toast grows its shadow on the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shadow');
  const lift = card.getByRole('slider', { name: 'Height above the page' });
  const start = await now(lift);
  const shadow = await css(card.locator('.ed-specimen .mu-toast'), 'box-shadow');
  const blur = await inline(xray.locator('.xr-toastwrap .xr-shadow'), 'filter');
  await drag(page, lift, 0, -40);
  expect(await now(lift)).toBeGreaterThan(start);
  expect(await css(card.locator('.ed-specimen .mu-toast'), 'box-shadow')).not.toBe(shadow);
  expect(await inline(xray.locator('.xr-toastwrap .xr-shadow'), 'filter')).not.toBe(blur);
});

test('layer switches remove the same layer from specimen and bench; a row points at its slice', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const toast = card.locator('.ed-specimen .mu-toast');
  const shadow = await css(toast, 'box-shadow');
  const far = card.getByRole('switch', { name: 'Far shadow' });
  await far.click();
  await expect(far).toHaveAttribute('aria-checked', 'false');
  expect(await css(toast, 'box-shadow')).not.toBe(shadow);
  await expect(xray.locator('.xr-face.is-layer.is-off').filter({ hasText: 'Far shadow' })).toHaveCount(1);
  const capFill = card.getByRole('switch', { name: 'Cap fill' });
  const capBg = await css(card.locator('.ed-specimen .mu-toast-undo'), 'background-image');
  await capFill.click();
  expect(await css(card.locator('.ed-specimen .mu-toast-undo'), 'background-image')).not.toBe(capBg);
  await expect(xray.locator('.xr-face.is-layer.is-off').filter({ hasText: 'Cap fill' })).toHaveCount(1);
  await card.locator('.ed-layer').filter({ hasText: 'Cap rim' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus')).toHaveCount(1);
  await expect(xray.locator('.xr-face.is-layer.is-focus')).toContainText('Cap rim');
});

test('readouts scrub by drag and by arrow keys; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const left = card.getByRole('slider', { name: 'Space on the left' });
  const start = await now(left);
  await drag(page, readout(card, 'space on the left'), 0, -24);
  const scrubbed = await now(left);
  expect(scrubbed).toBeGreaterThan(start);
  await expect(value(card, 'space on the left')).toHaveText(String(scrubbed));
  await readout(card, 'space on the left').focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'space on the left')).toHaveText(String(scrubbed - 1));
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'space on the left')).toHaveText(String(scrubbed));
  await part(xray, 'Timing');
  const rises = await now(card.getByRole('slider', { name: 'Rises from' }));
  await readout(card, 'rises from').focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'rises from')).toHaveText(String(rises + 1));
  await card.getByRole('slider', { name: 'Rises from' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Rises from');
  // clicking a readout hands its handle the keyboard, with the hint showing
  await part(xray, 'Type');
  await readout(card, 'space before the detail').click();
  await expect(card.getByRole('slider', { name: 'Space before the detail' })).toBeFocused();
  await expect(page.locator('.ed-tag')).toContainText('Space before the detail');
});

test('375 px graphite card fits without sideways scroll, with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of PARTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-toast')).toHaveCount(1);
    const [well, toast] = await Promise.all([
      card.locator('.ed-specimen').boundingBox(),
      card.locator('.ed-specimen .mu-toast').boundingBox(),
    ]);
    expect(toast!.x).toBeGreaterThanOrEqual(well!.x);
    expect(toast!.x + toast!.width).toBeLessThanOrEqual(well!.x + well!.width);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
  }
});
