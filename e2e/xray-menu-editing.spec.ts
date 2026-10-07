import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const CALLOUTS = ['Rows', 'Heading', 'Line', 'Glass', 'Shape', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const style = (el: Locator, prop: string) => el.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);
const inline = (el: Locator, prop: string) => el.evaluate((e, p) => (e as HTMLElement).style.getPropertyValue(p), prop);

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
  await page.goto('/components/menu');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`menu cards hold one real plate and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of CALLOUTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-menu')).toHaveCount(1);
      await expect(card.locator('.ed-specimen .mu-menu-row')).toHaveCount(3);
      await expect(card.locator('.mu-slider, .xr-dial, .mu-switcher')).toHaveCount(0);
    }
  });
}

test('the lit row leans toward the next row, then snaps there; specimen and bench agree', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Rows');
  const labels = await card.locator('.ed-specimen .mu-menu-label').allTextContents();
  const lit = card.getByRole('slider', { name: 'Lit row' });
  const start = (await lit.getAttribute('aria-valuetext'))!;
  expect(labels).toContain(start);
  const next = labels[labels.indexOf(start) + 1];

  // held part way: the next row is outlined, nothing has moved yet
  await lit.scrollIntoViewIfNeeded();
  const box = (await lit.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 7, { steps: 4 });
  await expect(card.locator('.ed-menu-lean')).toHaveCount(1);
  await expect(page.locator('.ed-tag')).toContainText(`→ ${next}`);
  await expect(lit).toHaveAttribute('aria-valuetext', start);
  await page.mouse.up();
  await expect(lit).toHaveAttribute('aria-valuetext', start);
  await expect(card.locator('.ed-menu-lean')).toHaveCount(0);

  // far enough, it snaps onto the next row: always one of the rows, never between
  await drag(page, lit, 0, 20);
  await expect(lit).toHaveAttribute('aria-valuetext', next);
  await expect(card.locator('.ed-specimen .mu-menu-row[data-highlighted] .mu-menu-label')).toHaveText(next);
  await expect(xray.locator('.xr-segface.is-top .mu-menu-row[data-highlighted]')).toContainText(next);

  // the arrow keys move the same light; the readout says which row
  await lit.focus();
  await page.keyboard.press('ArrowUp');
  await expect(lit).toHaveAttribute('aria-valuetext', start);
  await expect(value(card, 'Lit row')).toHaveText(start);
});

test('glass and shape handles change the specimen and the bench, and catch on their tokens', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  const plateOnBench = xray.locator('.xr-segface.is-top');

  await part(xray, 'Glass');
  const gap0 = await value(card, 'Gap to the button').textContent();
  const where0 = await inline(plateOnBench, 'transform');
  const margin0 = await inline(card.locator('.ed-box.ed-menu'), 'margin-top');
  await drag(page, card.getByRole('slider', { name: 'Gap to the button' }), 0, 24);
  await expect(value(card, 'Gap to the button')).not.toHaveText(gap0!);
  expect(await inline(card.locator('.ed-box.ed-menu'), 'margin-top')).not.toBe(margin0);
  expect(await inline(plateOnBench, 'transform')).not.toBe(where0);
  // dragging back to where it started lands on the token: the LED lights
  await drag(page, card.getByRole('slider', { name: 'Gap to the button' }), 0, -24);
  await expect(value(card, 'Gap to the button')).toHaveText(gap0!);
  await expect(readout(card, 'Gap to the button')).toHaveAttribute('aria-label', /menu token/);

  await part(xray, 'Shape');
  const pad0 = await value(card, 'Space around the rows').textContent();
  const benchPad0 = await style(xray.locator('.xr-segface.is-top .mu-menu'), 'padding-top');
  const specimenPad0 = await style(card.locator('.ed-specimen .mu-menu'), 'padding-top');
  await drag(page, card.getByRole('slider', { name: 'Space around the rows' }), 12, 0);
  await expect(value(card, 'Space around the rows')).not.toHaveText(pad0!);
  expect(await style(card.locator('.ed-specimen .mu-menu'), 'padding-top')).not.toBe(specimenPad0);
  expect(await style(xray.locator('.xr-segface.is-top .mu-menu'), 'padding-top')).not.toBe(benchPad0);

  const r0 = await value(card, 'Row corners').textContent();
  const benchR0 = await style(xray.locator('.xr-segface.is-top .mu-menu-row').first(), 'border-top-left-radius');
  const specimenR0 = await style(card.locator('.ed-specimen .mu-menu-row').first(), 'border-top-left-radius');
  await drag(page, card.getByRole('slider', { name: 'Row corners' }), 5, 5);
  await expect(value(card, 'Row corners')).not.toHaveText(r0!);
  expect(await style(card.locator('.ed-specimen .mu-menu-row').first(), 'border-top-left-radius')).not.toBe(specimenR0);
  expect(await style(xray.locator('.xr-segface.is-top .mu-menu-row').first(), 'border-top-left-radius')).not.toBe(benchR0);

  // the plate's corners follow the rows; switched off they go back to the plate's own
  const plateR = await value(card, 'Plate corners').textContent();
  await card.getByRole('switch', { name: 'Plate corners follow the rows' }).click();
  await expect(value(card, 'Plate corners')).not.toHaveText(plateR!);
});

test('heading, line and layer switches change the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Heading');
  await expect(xray.locator('.xr-segface.is-top .mu-menu-heading')).toHaveCount(1);
  await card.getByRole('switch', { name: 'Heading' }).click();
  await expect(card.locator('.ed-specimen .mu-menu-heading')).toHaveCount(0);
  await expect(xray.locator('.xr-segface.is-top .mu-menu-heading')).toHaveCount(0);

  await part(xray, 'Line');
  await expect(xray.locator('.xr-segface.is-top .mu-menu-sep')).toHaveCount(1);
  await card.getByRole('switch', { name: 'Line' }).click();
  await expect(card.locator('.ed-specimen .mu-menu-sep')).toHaveCount(0);
  await expect(xray.locator('.xr-segface.is-top .mu-menu-sep')).toHaveCount(0);

  await part(xray, 'Layers');
  const shadow = await style(card.locator('.ed-specimen .mu-menu'), 'box-shadow');
  const rim = card.locator('.ed-layer').filter({ hasText: 'Rim' });
  await rim.hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus')).toContainText('Rim');
  await card.getByRole('switch', { name: 'Rim' }).click();
  await expect(card.getByRole('switch', { name: 'Rim' })).toHaveAttribute('aria-checked', 'false');
  await expect(xray.locator('.xr-face.is-layer.is-off')).toContainText('Rim');
  expect(await style(card.locator('.ed-specimen .mu-menu'), 'box-shadow')).not.toBe(shadow);
});

test('readouts scrub by drag and by arrow keys; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const pad0 = Number(await value(card, 'Space around the rows').textContent());
  await drag(page, readout(card, 'Space around the rows'), 0, -24);
  await expect(value(card, 'Space around the rows')).toHaveText(`${pad0 + 1.5}`);
  await readout(card, 'Space around the rows').focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Space around the rows')).toHaveText(`${pad0 + 1}`);

  await part(xray, 'Rows');
  const lit0 = await value(card, 'Lit row').textContent();
  await readout(card, 'Lit row').focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Lit row')).not.toHaveText(lit0!);
  await expect(xray.locator('.xr-segface.is-top .mu-menu-row[data-highlighted]')).not.toContainText(lit0!);

  // reached by the keyboard (from its readout, back one stop), the handle shows its tag
  await readout(card, 'Lit row').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(card.getByRole('slider', { name: 'Lit row' })).toBeFocused();
  await expect(page.locator('.ed-tag')).toContainText('Lit row');
  await part(xray, 'Glass');
  await readout(card, 'Gap to the button').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(card.getByRole('slider', { name: 'Gap to the button' })).toBeFocused();
  await expect(page.locator('.ed-tag')).toContainText('Gap to the button');
});

for (const colorway of COLORWAYS) {
  test(`at 375 px wide in ${colorway}, no menu card scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const xray = await openDocs(page, colorway);
    for (const name of CALLOUTS) {
      await part(xray, name);
      const card = xray.locator('.xr-card');
      await expect(card.locator('.ed-specimen .mu-menu')).toHaveCount(1);
      // the page around it has its own wide pieces (the SwiftUI capture, code blocks); the card must add none
      expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      for (const piece of [card, card.locator('.ed-specimen'), card.locator('.ed-specimen .mu-menu')]) {
        const box = (await piece.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(375);
      }
    }
  });
}
