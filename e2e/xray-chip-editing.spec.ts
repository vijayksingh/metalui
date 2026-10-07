import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The suggestion chip x-ray's editing layer: every card holds the real SuggestionChip to handle,
// never a slider. Its handles, readouts and switches change the same model the bench draws.

const QUESTIONS = ['Track as mood?', 'Task?', 'Date friday?', 'Move to Done?'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');
const style = (target: Locator, prop: string) => target.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
/** The model's face is the real chip: its top plane. */
const model = (xray: Locator) => xray.locator('.xr-segface.is-top .mu-suggestion');

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
  await page.goto('/components/suggestion-chip');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`every suggestion chip card holds the real chip and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of ['Type', 'States', 'Answer', 'Surface', 'Shape', 'Layers']) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-suggestion')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial')).toHaveCount(0);
    }
    // the chip is always a pill in one size: no corner handle, no size step
    await part(xray, 'Shape');
    await expect(card.locator('.ed-corner')).toHaveCount(0);
    await expect(card.getByRole('slider', { name: 'Height' })).not.toHaveAttribute('aria-valuetext', /.+/);
  });
}

test('type: the question steps between real questions; how sure moves freely; both show on the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const question = card.getByRole('slider', { name: 'Question' });
  const start = (await question.getAttribute('aria-valuetext'))!;
  expect(QUESTIONS).toContain(start);
  // a small nudge only leans; it never changes the question
  await drag(page, question, 4, 0);
  await expect(question).toHaveAttribute('aria-valuetext', start);
  // far enough, it snaps to another real question, never something in between
  await drag(page, question, 40, 0);
  const next = (await question.getAttribute('aria-valuetext'))!;
  expect(QUESTIONS).toContain(next);
  expect(next).not.toBe(start);
  await expect(card.locator('.ed-specimen .mu-chip-text')).toHaveText(next);
  await expect(model(xray).locator('.mu-chip-text')).toHaveText(next);
  // how sure: the engraved number is its own handle
  const sure = card.getByRole('slider', { name: 'How sure' });
  const conf0 = (await sure.getAttribute('aria-valuenow'))!;
  await drag(page, sure, -30, 0);
  await expect(sure).not.toHaveAttribute('aria-valuenow', conf0);
  const shown = await card.locator('.ed-specimen .mu-suggestion-conf').textContent();
  expect(shown).not.toBe(Number(conf0).toFixed(2));
  await expect(model(xray).locator('.mu-suggestion-conf')).toHaveText(shown!);
});

test('states: pointing at the line clears the chip on the specimen and the bench; the switch holds it', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'States');
  const chip = card.locator('.ed-specimen .mu-suggestion');
  await expect(model(xray)).not.toHaveAttribute('data-host-hover', '');
  const rest = Number(await style(chip, 'opacity'));
  expect(rest).toBeLessThan(1);
  await card.locator('.ed-chip-host').scrollIntoViewIfNeeded();
  await card.locator('.ed-chip-host').hover();
  await expect(model(xray)).toHaveAttribute('data-host-hover', '');
  await expect.poll(() => style(chip, 'opacity')).toBe('1');
  await page.mouse.move(0, 0);
  await expect(model(xray)).not.toHaveAttribute('data-host-hover', '');
  await card.getByRole('switch', { name: 'Point at the line' }).click();
  await expect(model(xray)).toHaveAttribute('data-host-hover', '');
  await expect.poll(() => style(chip, 'opacity')).toBe('1');
});

test('answer: pressing ✓ on the specimen answers on the bench too', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Answer');
  await card.locator('.ed-specimen').getByRole('button', { name: 'Accept' }).click();
  await expect(card.locator('.ed-specimen')).toContainText('accepted');
  await expect(xray.locator('.xr-chiptop.is-gone')).toHaveCount(1);
  // it comes back, and × says no
  await expect(card.locator('.ed-specimen .mu-suggestion')).toHaveCount(1);
  await expect(xray.locator('.xr-chiptop.is-gone')).toHaveCount(0);
  await card.locator('.ed-specimen').getByRole('button', { name: 'Dismiss' }).click();
  await expect(xray.locator('.xr-chiptop.is-gone')).toHaveCount(1);
});

test('surface: the chip is the frost handle and catches on its token; the green line is a switch', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Surface');
  const chip = card.locator('.ed-specimen .mu-suggestion');
  const face = model(xray);
  const frost0 = await value(card, 'Frost').textContent();
  const bg0 = await style(chip, 'background-color');
  const bench0 = await style(face, 'background-color');
  await drag(page, card.getByRole('slider', { name: 'Frost' }), 0, 12);
  await expect(value(card, 'Frost')).not.toHaveText(frost0!);
  expect(await style(chip, 'background-color')).not.toBe(bg0);
  expect(await style(face, 'background-color')).not.toBe(bench0);
  const ring0 = await style(chip, 'box-shadow');
  await card.getByRole('switch', { name: 'Green line' }).click();
  expect(await style(chip, 'box-shadow')).not.toBe(ring0);
  expect(await style(chip, 'box-shadow')).not.toContain('63, 185, 122');
});

test('shape: the top edge sets the height and the left end the space on the left, on both', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const chip = card.locator('.ed-specimen .mu-suggestion');
  const face = model(xray);
  const h0 = await value(card, 'Height').textContent();
  const benchH = await style(face, 'height');
  const specH = await chip.evaluate((el) => (el as HTMLElement).offsetHeight);
  await card.locator('.ed-box').hover();
  await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -14);
  await expect(value(card, 'Height')).not.toHaveText(h0!);
  expect(await chip.evaluate((el) => (el as HTMLElement).offsetHeight)).toBeGreaterThan(specH);
  expect(await style(face, 'height')).not.toBe(benchH);
  const p0 = await value(card, 'Space on the left').textContent();
  const benchW = await style(face, 'width');
  const specW = await chip.evaluate((el) => (el as HTMLElement).offsetWidth);
  await card.locator('.ed-box').hover();
  await drag(page, card.getByRole('slider', { name: 'Space on the left' }), -12, 0);
  await expect(value(card, 'Space on the left')).not.toHaveText(p0!);
  expect(await chip.evaluate((el) => (el as HTMLElement).offsetWidth)).toBeGreaterThan(specW);
  expect(await style(face, 'width')).not.toBe(benchW);
});

test('layers are switches: turning one off takes it off the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const chip = card.locator('.ed-specimen .mu-suggestion');
  const drop = xray.locator('.xr-face.is-layer').filter({ hasText: 'Drop' });
  await expect(drop).not.toHaveClass(/is-off/);
  const shadow = await style(chip, 'box-shadow');
  await card.getByRole('switch', { name: 'Drop' }).click();
  await expect(card.getByRole('switch', { name: 'Drop' })).toHaveAttribute('aria-checked', 'false');
  await expect(drop).toHaveClass(/is-off/);
  expect(await style(chip, 'box-shadow')).not.toBe(shadow);
});

test('readouts scrub by drag and by arrows; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const h0 = Number(await value(card, 'Height').textContent());
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'Height' }), 0, -24);
  await expect(value(card, 'Height')).not.toHaveText(`${h0}`);
  const h1 = Number(await value(card, 'Height').textContent());
  expect(h1).toBeGreaterThan(h0);
  await card.locator('.ed-readout').filter({ hasText: 'Height' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Height')).toHaveText(`${h1 - 1}`);
  // the question readout steps between real questions too
  await part(xray, 'Type');
  const q0 = (await value(card, 'Question').textContent())!;
  await card.locator('.ed-readout').filter({ hasText: 'Question' }).focus();
  await page.keyboard.press(q0 === QUESTIONS.at(-1) ? 'ArrowDown' : 'ArrowUp');
  const q1 = (await value(card, 'Question').textContent())!;
  expect(q1).not.toBe(q0);
  expect(QUESTIONS).toContain(q1);
  // keyboard focus on a handle shows its tag above the chip
  await part(xray, 'Surface');
  // reach the handle by keyboard (Shift+Tab back from its readout), as a keyboard user would
  await card.locator('.ed-readout').filter({ hasText: 'Frost' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(card.getByRole('slider', { name: 'Frost' })).toBeFocused();
  await expect(page.locator('.ed-tag')).toContainText('Frost');
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Frost')).not.toHaveText('70');
});

test('narrow graphite: every card fits 375 px with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of ['Type', 'States', 'Answer', 'Surface', 'Shape', 'Layers']) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-suggestion')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
