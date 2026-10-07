import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The slider x-ray's editing layer: every card holds the real slider (a specimen) to change by
// handling it: its knob, its rims, the groove's bottom edge, a sun, switches. No control panel.
// The only slider in a card is the specimen itself, the component the x-ray is about.

const PARTS = ['Knob', 'Track', 'Move', 'Marks', 'Light', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');
const style = (el: Locator, prop: string) => el.evaluate((e, p) => (e as HTMLElement).style.getPropertyValue(p), prop);
const computed = (el: Locator, prop: string) => el.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);

async function drag(page: Page, target: Locator, dx: number, dy: number, along = 0.5) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width * along, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/slider');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

// on the bench: the groove is the real slider's track on the floor copy, the knob's wall the last raised
// part, and the knob's face the real knob on the top copy
const benchGroove = (xray: Locator) => xray.locator('.xr-scene .xr-segface.is-well .mu-slider-track');
const benchKnob = (xray: Locator) => xray.locator('.xr-thumb').last();
const benchKnobFace = (xray: Locator) => xray.locator('.xr-scene .xr-segface.is-top .mu-slider-knob-face');

for (const colorway of COLORWAYS) {
  test(`every slider card holds one real specimen and no control panel, in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of PARTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-slider')).toHaveCount(1);
      await expect(card.locator('.mu-slider')).toHaveCount(1);
      await expect(card.locator('.xr-dial, .xr-dials, .mu-switcher')).toHaveCount(0);
    }
  });
}

test('knob: dragging the knob sideways turns its shine on the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Knob');
  const start = await value(card, 'Shine').textContent();
  const bench = await computed(benchKnobFace(xray), 'background-image');
  const knob = card.locator('.mu-slider-knob-face');
  const metal = await computed(knob, 'background-image');
  await drag(page, card.getByRole('slider', { name: 'Shine' }), 30, 0);
  await expect(value(card, 'Shine')).not.toHaveText(start!);
  expect(await computed(benchKnobFace(xray), 'background-image')).not.toBe(bench);
  expect(await computed(knob, 'background-image')).not.toBe(metal);
});

test('track: dragging the bottom edge down deepens the groove on the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Track');
  const start = Number(await value(card, 'Depth').textContent());
  const bench = await computed(benchGroove(xray), 'box-shadow');
  const groove = card.locator('.mu-slider-track');
  const shadow = await computed(groove, 'box-shadow');
  await drag(page, card.getByRole('slider', { name: 'Depth' }), 0, 16, 0.15);
  expect(Number(await value(card, 'Depth').textContent())).toBeGreaterThan(start);
  expect(await computed(benchGroove(xray), 'box-shadow')).not.toBe(bench);
  expect(await computed(groove, 'box-shadow')).not.toBe(shadow);
});

test('move: the rims tune the spring the knob rides on the specimen and the bench; the knob still moves the value', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Move');
  const knob = card.locator('.mu-slider-knob');
  // Inspect the moving knob: placement and fill share the authored spring.
  const springs = knob;
  const benchMove = await style(benchKnob(xray), 'transition');
  const knobMove = await computed(springs, 'transition');
  const k0 = Number(await value(card, 'Stiffness').textContent());
  await drag(page, card.getByRole('slider', { name: 'Stiffness' }), 24, 0);
  expect(Number(await value(card, 'Stiffness').textContent())).toBeGreaterThan(k0);
  expect(await style(benchKnob(xray), 'transition')).not.toBe(benchMove);
  expect(await computed(springs, 'transition')).not.toBe(knobMove);
  const c0 = Number(await value(card, 'Damping').textContent());
  const benchMove2 = await style(benchKnob(xray), 'transition');
  await drag(page, card.getByRole('slider', { name: 'Damping' }), 0, 16);
  expect(Number(await value(card, 'Damping').textContent())).toBeGreaterThan(c0);
  expect(await style(benchKnob(xray), 'transition')).not.toBe(benchMove2);
  // the knob itself is still the slider: dragging its middle moves the value, and the bench knob with it
  const v0 = await value(card, 'Value').textContent();
  const at = await style(benchKnob(xray), 'transform');
  await drag(page, knob, -60, 0);
  await expect(value(card, 'Value')).not.toHaveText(v0!);
  expect(await style(benchKnob(xray), 'transform')).not.toBe(at);
});

test('marks: switches take the marks and the ticks off the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Marks');
  // the bench's slider is the real one, so its marks and ticks are the slider's own
  await expect(xray.locator('.xr-scene .xr-segface.is-well .mu-slider-mark')).toHaveCount(9); // a notch at every tenth
  await expect(card.locator('.mu-slider-marks')).toHaveCount(1);
  await card.getByRole('switch', { name: 'Marks in the track' }).click();
  await expect(card.locator('.mu-slider-marks')).toHaveCount(0);
  await expect(xray.locator('.xr-scene .mu-slider-mark')).toHaveCount(0);
  await expect(xray.locator('.xr-scene .xr-segface.is-well .mu-slider-tick')).toHaveCount(5);
  await card.locator('.ed-layer').filter({ hasText: 'Ticks and labels' }).locator('.mu-row-text').click();
  await expect(card.getByRole('switch', { name: 'Ticks and labels' })).toHaveAttribute('aria-checked', 'false');
  await expect(card.locator('.mu-slider-ticks')).toHaveCount(0);
  await expect(xray.locator('.xr-scene .mu-slider-tick')).toHaveCount(0);
});

test('light: dragging the sun moves the light on the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Light');
  const bench = await computed(benchGroove(xray), 'background-image');
  const knob = card.locator('.mu-slider-knob-face');
  const shadow = await computed(knob, 'box-shadow');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 4);
  await expect(value(card, 'From')).not.toHaveText('top');
  expect(await computed(benchGroove(xray), 'background-image')).not.toBe(bench);
  expect(await computed(knob, 'box-shadow')).not.toBe(shadow);
});

test('layers: a switch takes its layer off the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const knob = card.locator('.mu-slider-knob-face');
  expect(await computed(knob, 'background-image')).toContain('conic-gradient');
  await card.getByRole('switch', { name: 'Metal' }).click();
  await expect(card.getByRole('switch', { name: 'Metal' })).toHaveAttribute('aria-checked', 'false');
  expect(await computed(knob, 'background-image')).toBe('none');
  // the bench is exploded into its layers here: the switched-off slice is marked off
  await expect(xray.locator('.xr-face.is-layer.is-off')).toHaveCount(1);
  await expect(xray.locator('.xr-face.is-layer.is-off')).toContainText('Metal');
  // hovering a row points at its slice on the bench
  await card.locator('.ed-layer').filter({ hasText: 'Inner ring' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus')).toContainText('Inner ring');
  await card.getByRole('switch', { name: 'Green fill' }).click();
  expect(await computed(card.locator('.mu-slider-fill'), 'background-image')).toBe('none');
});

test('readouts scrub by drag and by arrows; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Move');
  const k0 = Number(await value(card, 'Stiffness').textContent());
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'Stiffness' }), 0, -24);
  await expect(value(card, 'Stiffness')).toHaveText(String(k0 + 30));
  const c0 = Number(await value(card, 'Damping').textContent());
  await card.locator('.ed-readout').filter({ hasText: 'Damping' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Damping')).toHaveText(String(c0 + 1));
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Damping')).toHaveText(String(c0));
  await card.getByRole('slider', { name: 'Stiffness' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Stiffness');
  await part(xray, 'Knob');
  // clicking a readout hands its handle the keyboard, with the hint showing
  await card.locator('.ed-readout').filter({ hasText: 'Shine' }).click();
  await expect(card.getByRole('slider', { name: 'Shine' })).toBeFocused();
  await expect(page.locator('.ed-tag')).toContainText('Shine');
  await page.keyboard.press('ArrowRight');
  await expect(value(card, 'Shine')).not.toHaveText('200');
});

test('at 375 px wide in graphite, every card fits with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of PARTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-slider')).toHaveCount(1);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
  }
  await part(xray, 'Track');
  const start = Number(await value(card, 'Depth').textContent());
  await drag(page, card.getByRole('slider', { name: 'Depth' }), 0, 16, 0.15);
  expect(Number(await value(card, 'Depth').textContent())).toBeGreaterThan(start);
});
