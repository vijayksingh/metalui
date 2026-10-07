import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const CALLOUTS = ['Field', 'Rows', 'Labels', 'Keys', 'Plate', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');
const now = async (handle: Locator) => Number(await handle.getAttribute('aria-valuenow'));
/** The model's planes: the palette itself, laid out at the object's zoom (the plate alone, the body, the chosen row). */
const platePlane = (xray: Locator) => xray.locator('.xr-segface.is-pplate');
const bodyPlane = (xray: Locator) => xray.locator('.xr-segface.is-pbody');
const capPlane = (xray: Locator) => xray.locator('.xr-segface.is-pcap');
const computed = (target: Locator, prop: string) => target.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/command-palette');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`every palette callout holds a real still and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of CALLOUTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-palette .mu-palette-field')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .xr-switch, .xr-pinput')).toHaveCount(0);
    }
  });
}

test('field: typing refilters specimen and bench; its handles change both', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Field');
  const input = card.getByRole('textbox', { name: 'Palette query' });
  await input.fill('delete');
  await expect(card.locator('.mu-palette-row')).toHaveCount(2);
  await expect(bodyPlane(xray).locator('.mu-palette-row')).toHaveCount(2);
  await expect(bodyPlane(xray).locator('.mu-palette-input')).toHaveValue('delete');

  const field = card.locator('.mu-palette-field');
  const benchField = bodyPlane(xray).locator('.mu-palette-field');
  const height = card.getByRole('slider', { name: 'Field height' });
  const h0 = await now(height), fh0 = await computed(field, 'height'), bh0 = await computed(benchField, 'height');
  await drag(page, height, 0, -30);
  expect(await now(height)).toBeGreaterThan(h0);
  expect(await computed(field, 'height')).not.toBe(fh0);
  expect(await computed(benchField, 'height')).not.toBe(bh0);

  const corners = card.getByRole('slider', { name: 'Field corners' });
  const r0 = await computed(field, 'border-top-left-radius');
  await drag(page, corners, -20, -20);
  expect(await computed(field, 'border-top-left-radius')).not.toBe(r0);

  const left = card.getByRole('slider', { name: 'Space on the left' });
  const l0 = await computed(field, 'padding-left'), bl0 = await computed(benchField, 'padding-left');
  await drag(page, left, 24, 0);
  expect(await computed(field, 'padding-left')).not.toBe(l0);
  expect(await computed(benchField, 'padding-left')).not.toBe(bl0);
});

test('rows: the chosen row leans, then snaps to a real row; height and corners change both', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Rows');
  await card.getByRole('textbox', { name: 'Palette query' }).fill('');
  const rows = card.locator('.mu-palette-row');
  const count = await rows.count();
  expect(count).toBeGreaterThan(2);
  const cap = card.getByRole('slider', { name: 'Chosen row' });
  const start = await now(cap);
  const labels = await rows.allTextContents();
  const isOption = async () => { const i = await now(cap); expect(Number.isInteger(i) && i >= 1 && i <= count).toBe(true); return i; };
  // a small nudge only leans: nothing is chosen yet
  await drag(page, cap, 0, 4);
  expect(await isOption()).toBe(start);
  // far enough, it snaps onto the next row, never between
  await drag(page, cap, 0, 24);
  const next = await isOption();
  expect(next).toBeGreaterThan(start);
  await expect(card.locator('.mu-palette-row[data-highlighted]')).toHaveCount(1);
  await expect(card.locator('.mu-palette-row[data-highlighted]')).toHaveText(labels[next - 1]);
  await expect(capPlane(xray).locator('.mu-palette-row[data-highlighted]')).toHaveText(labels[next - 1]);

  const height = card.getByRole('slider', { name: 'Row height' });
  const row = card.locator('.mu-palette-row').first();
  const rh0 = await computed(row, 'height'), bh0 = await computed(bodyPlane(xray).locator('.mu-palette-row').first(), 'height');
  await drag(page, height, 0, 24);
  expect(await computed(row, 'height')).not.toBe(rh0);
  expect(await computed(bodyPlane(xray).locator('.mu-palette-row').first(), 'height')).not.toBe(bh0);

  const corners = card.getByRole('slider', { name: 'Row corners' });
  const on = card.locator('.mu-palette-row[data-highlighted]');
  const benchOn = capPlane(xray).locator('.mu-palette-row[data-highlighted]');
  const r0 = await computed(on, 'border-top-left-radius'), br0 = await computed(benchOn, 'border-top-left-radius');
  await drag(page, corners, -16, -16);
  expect(await computed(on, 'border-top-left-radius')).not.toBe(r0);
  expect(await computed(benchOn, 'border-top-left-radius')).not.toBe(br0);
});

test('labels: section room and the underline change specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Labels');
  const sec = card.locator('.mu-palette-sec').first();
  const above = card.getByRole('slider', { name: 'Space above a section' });
  const benchSec = bodyPlane(xray).locator('.mu-palette-sec').first();
  const s0 = await computed(sec, 'padding-top'), bs0 = await computed(benchSec, 'padding-top');
  await drag(page, above, 0, 20);
  expect(await computed(sec, 'padding-top')).not.toBe(s0);
  expect(await computed(benchSec, 'padding-top')).not.toBe(bs0);

  const under = card.getByRole('slider', { name: 'Underline' });
  const mark = card.locator('.mu-palette-mark').first();
  const benchMark = bodyPlane(xray).locator('.mu-palette-mark').first();
  const u0 = await computed(mark, 'text-underline-offset'), bu0 = await computed(benchMark, 'text-underline-offset');
  await drag(page, under, 0, 12);
  expect(await computed(mark, 'text-underline-offset')).not.toBe(u0);
  expect(await computed(benchMark, 'text-underline-offset')).not.toBe(bu0);
});

test('keys: gap and room change both; pinning and status switch in both', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Keys');
  const foot = card.locator('.mu-palette-foot');
  const benchFoot = bodyPlane(xray).locator('.mu-palette-foot');
  const gap = card.getByRole('slider', { name: 'Space between keys' });
  const g0 = await computed(foot, 'column-gap'), bg0 = await computed(benchFoot, 'column-gap');
  await drag(page, gap, 20, 0);
  expect(await computed(foot, 'column-gap')).not.toBe(g0);
  expect(await computed(benchFoot, 'column-gap')).not.toBe(bg0);
  const top = card.getByRole('slider', { name: 'Space above the keys' });
  const t0 = await computed(foot, 'padding-top'), bt0 = await computed(benchFoot, 'padding-top');
  await drag(page, top, 0, 16);
  expect(await computed(foot, 'padding-top')).not.toBe(t0);
  expect(await computed(benchFoot, 'padding-top')).not.toBe(bt0);

  await expect(foot).toContainText('PIN');
  await card.getByRole('switch', { name: 'Pin with ⇧↩' }).click();
  await expect(foot).not.toContainText('PIN');
  await expect(benchFoot).not.toContainText('PIN');
  await card.getByRole('switch', { name: 'Where answers come from' }).click();
  await expect(foot).toContainText('SYNC OFFLINE');
  await expect(benchFoot).toContainText('SYNC OFFLINE');
});

test('plate: padding and corners change specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Plate');
  const plate = card.locator('.mu-palette');
  const pad = card.getByRole('slider', { name: 'Padding' });
  const benchPlate = platePlane(xray).locator('.mu-palette');
  const p0 = await computed(plate, 'padding-left'), bp0 = await computed(benchPlate, 'padding-left');
  await drag(page, pad, -16, 0);
  expect(await computed(plate, 'padding-left')).not.toBe(p0);
  expect(await computed(benchPlate, 'padding-left')).not.toBe(bp0);
  const corners = card.getByRole('slider', { name: 'Plate corners' });
  const r0 = await computed(plate, 'border-top-left-radius'), br0 = await computed(benchPlate, 'border-top-left-radius');
  await drag(page, corners, 20, 20);
  expect(await computed(plate, 'border-top-left-radius')).not.toBe(r0);
  expect(await computed(benchPlate, 'border-top-left-radius')).not.toBe(br0);
});

test('layers: a switch removes the layer from the still and the bench; hover lights the slice', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const plate = card.locator('.mu-palette');
  const shadow0 = await computed(plate, 'box-shadow');
  const rim = card.getByRole('switch', { name: 'Rim' });
  await rim.click();
  await expect(rim).toHaveAttribute('aria-checked', 'false');
  expect(await computed(plate, 'box-shadow')).not.toBe(shadow0);
  await expect(xray.locator('.xr-face.is-layer.is-off').filter({ hasText: 'Rim' })).toHaveCount(1);
  await card.locator('.ed-layer').filter({ hasText: 'Frost' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus').filter({ hasText: 'Frost' })).toHaveCount(1);
});

test('readouts scrub by drag and arrow keys; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Field');
  const height = card.getByRole('slider', { name: 'Field height' });
  const h0 = await now(height);
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'Field height' }), 0, -32);
  expect(await now(height)).toBeGreaterThan(h0);
  const before = await value(card, 'Space on the left').textContent();
  await card.locator('.ed-readout').filter({ hasText: 'Space on the left' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Space on the left')).not.toHaveText(before!);
  await card.getByRole('slider', { name: 'Field corners' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.ed-tag')).toContainText('Field corners');
  // the chosen row steps by readout too, and only ever onto a row
  await part(xray, 'Rows');
  const cap = card.getByRole('slider', { name: 'Chosen row' });
  const c0 = await now(cap);
  await card.locator('.ed-readout').filter({ hasText: 'Chosen row' }).focus();
  await page.keyboard.press('ArrowDown');
  expect(await now(cap)).toBe(c0 + 1);
});

test('375 px graphite: every card fits the x-ray without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of CALLOUTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-palette')).toHaveCount(1);
    // the card and its specimen stay inside the phone's width
    expect(await card.evaluate((el) => el.getBoundingClientRect().right)).toBeLessThanOrEqual(375);
    expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    const well = card.locator('.ed-specimen');
    expect(await well.evaluate((el) => (el.querySelector('.mu-palette') as HTMLElement).getBoundingClientRect().right <= el.getBoundingClientRect().right + 0.5)).toBe(true);
  }
});
