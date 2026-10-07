import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');

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
  await page.goto('/components/switcher');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`switcher cards hold one real specimen in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of ['Shape', 'Well', 'Thumb', 'Slide', 'Light', 'Layers']) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-switcher')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial')).toHaveCount(0);
      await expect(card.locator('.ed-specimen .mu-switcher-option')).toHaveCount(3);
    }
  });
}

test('thumb leans toward an option and snaps there; clicking another option still picks it', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  const thumb = card.getByRole('slider', { name: 'Option' });
  // it starts on Week; a small nudge only leans, it never picks
  await expect(thumb).toHaveAttribute('aria-valuetext', 'Week');
  await drag(page, thumb, 7, 0);
  await expect(thumb).toHaveAttribute('aria-valuetext', 'Week');
  // far enough, it snaps to the next option, never between
  await drag(page, thumb, 35, 0);
  await expect(thumb).toHaveAttribute('aria-valuetext', 'Month');
  await expect(card.locator('.mu-switcher-option[aria-checked="true"]')).toHaveText('Month');
  await expect(xray.locator('.xr-segface.is-top [aria-checked="true"]')).toHaveText('Month');
  // the model's words are the real control's: pick one there and the specimen follows
  await xray.locator('.xr-segface.is-top .mu-switcher-option').first().click();
  await expect(card.locator('.mu-switcher-option[aria-checked="true"]')).toHaveText('Day');
});

test('shape, well, thumb, spring and light handles change specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  // the bench's tray is the real control: it grows with the space around the thumb
  const tray = xray.locator('.xr-segface.is-well .mu-switcher');
  const width = await tray.evaluate((el) => (el as HTMLElement).offsetWidth);
  await drag(page, card.getByRole('slider', { name: 'Space around the thumb' }), 12, 0);
  await expect(value(card, 'Space around the thumb')).not.toHaveText('3');
  await expect.poll(() => tray.evaluate((el) => (el as HTMLElement).offsetWidth)).toBeGreaterThan(width);
  const specimenWidth = await card.locator('.mu-switcher').evaluate((el) => el.getBoundingClientRect().width);
  await drag(page, card.getByRole('slider', { name: 'Space beside each word' }), 12, 0);
  await expect(value(card, 'Space beside each word')).not.toHaveText('10');
  expect(await card.locator('.mu-switcher').evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(specimenWidth);
  await drag(page, card.getByRole('slider', { name: 'Size' }), 0, 17);
  await expect(card.locator('.mu-switcher')).toHaveAttribute('data-size', 'compact');
  await expect(value(card, 'Size')).toHaveText('24');
  await part(xray, 'Well');
  const z = await xray.locator('.xr-ring').last().evaluate((el) => (el as HTMLElement).style.transform);
  await drag(page, card.getByRole('slider', { name: 'Well depth' }), 0, 14);
  expect(await xray.locator('.xr-ring').last().evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(z);
  await part(xray, 'Thumb');
  const benchThumb = xray.locator('.xr-segface.is-top .mu-switcher-thumb');
  const shadow = await benchThumb.evaluate((el) => getComputedStyle(el).boxShadow);
  await drag(page, card.getByRole('slider', { name: 'Thumb lift' }), 0, -14);
  expect(await benchThumb.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(shadow);
  await part(xray, 'Slide');
  const transition = await xray.locator('.xr-thumb').evaluate((el) => (el as HTMLElement).style.transition);
  await drag(page, card.getByRole('slider', { name: 'Stiffness' }), 24, 0);
  await expect(value(card, 'Stiffness')).not.toHaveText('170');
  expect(await xray.locator('.xr-thumb').evaluate((el) => (el as HTMLElement).style.transition)).not.toBe(transition);
  await drag(page, card.getByRole('slider', { name: 'Damping' }), 0, 16);
  await expect(value(card, 'Damping')).not.toHaveText('16');
  await card.getByRole('switch', { name: 'No animation' }).click();
  await expect(card.locator('.ed-switcher[data-instant]')).toHaveCount(1);
  await part(xray, 'Light');
  const fill = await tray.evaluate((el) => getComputedStyle(el).backgroundImage);
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
  expect(await tray.evaluate((el) => getComputedStyle(el).backgroundImage)).not.toBe(fill);
});

test('layer switches remove the same layer from specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const shadow = await card.locator('.mu-switcher-thumb').evaluate((el) => getComputedStyle(el).boxShadow);
  await card.getByRole('switch', { name: 'Drop' }).click();
  await expect(card.getByRole('switch', { name: 'Drop' })).toHaveAttribute('aria-checked', 'false');
  await expect(xray.locator('.xr-shadow.is-drop')).toHaveCount(0);
  expect(await card.locator('.mu-switcher-thumb').evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(shadow);
});

test('readouts scrub and arrow keys step; focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'Space beside each word' }), 0, -24);
  await expect(value(card, 'Space beside each word')).not.toHaveText('10');
  await card.locator('.ed-readout').filter({ hasText: 'Space beside each word' }).focus();
  await page.keyboard.press('ArrowDown');
  await card.getByRole('slider', { name: 'Size' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Size');
});

test('floating table opens switcher x-ray; narrow graphite card has no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  // at 375 px the table's objects overlap and drift, so a point click can land on a neighbour: the option takes the click itself
  await page.locator('[data-float="seg"] .mu-switcher-option').first().dispatchEvent('click');
  await expect(page.locator('.xr-overlay .xr-card .ed-specimen .mu-switcher')).toHaveCount(1);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
