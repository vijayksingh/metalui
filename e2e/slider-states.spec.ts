import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, capture, emulateMedia, open } from './helpers';

// Slider states: rest, hover (the knob lifts), pressed and dragging (the knob presses; the fill
// follows the pointer 1:1 with no spring), keyboard focus (the ring), disabled (40 %, no input),
// and a key pushing past an end is refused with a small nudge (none under Reduce Motion).

const section = (page: Page, id: string) => page.locator(`section:has(#${id}), section#${id}`).first();
const tuner = (page: Page) => page.getByTestId('slider-tuner');

/** Waits until nothing in `el` is animating, then reads a computed property of the knob's face. */
async function face(slider: Locator, prop: string) {
  return slider.evaluate(async (el, p) => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
    return getComputedStyle(el.querySelector('.mu-slider-knob-face')!).getPropertyValue(p);
  }, prop);
}

/** The recipe's own number for a state, as the page resolves it. */
const recipe = (page: Page, name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('hover lifts the knob; pressing and dragging press it; the fill follows the pointer 1:1', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const slider = tuner(page).locator('.mu-slider');
  await slider.scrollIntoViewIfNeeded();
  const restShadow = await face(slider, 'box-shadow');
  expect(await face(slider, 'scale')).toBe('none');

  const groove = (await slider.locator('.mu-slider-track').boundingBox())!;
  const knob = (await slider.locator('.mu-slider-knob').boundingBox())!;
  const y = knob.y + knob.height / 2;
  await page.mouse.move(groove.x + groove.width * 0.8, y);
  expect(await face(slider, 'scale')).toBe(await recipe(page, '--mu-r-slider-knob-lift'));
  expect(await face(slider, 'box-shadow')).not.toBe(restShadow);

  await page.mouse.move(knob.x + knob.width / 2, y);
  await page.mouse.down();
  expect(await face(slider, 'scale')).toBe(await recipe(page, '--mu-r-slider-knob-press'));
  // dragging: no spring on the knob or the fill; each move lands under the pointer at once
  for (const f of [0.3, 0.6, 0.45]) {
    const x = groove.x + groove.width * f;
    await page.mouse.move(x, y, { steps: 4 });
    const now = await slider.evaluate((el) => {
      const k = el.querySelector('.mu-slider-knob')!.getBoundingClientRect();
      return { dragging: el.hasAttribute('data-dragging'), centre: k.left + k.width / 2, fillEnd: el.querySelector('.mu-slider-fill')!.getBoundingClientRect().right };
    });
    expect(now.dragging).toBe(true);
    expect(Math.abs(now.centre - x)).toBeLessThanOrEqual(3); // within a step of 1 in 100
    expect(Math.abs(now.centre - now.fillEnd)).toBeLessThanOrEqual(1);
  }
  expect(await face(slider, 'scale')).toBe(await recipe(page, '--mu-r-slider-knob-press'));
  await page.mouse.up();
  await page.mouse.move(0, 0);
  expect(await face(slider, 'scale')).toBe('none');
});

test('lifted at an end, the knob still stays inside the groove', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const slider = section(page, 'states').locator('.mu-slider').first();
  await slider.scrollIntoViewIfNeeded();
  const groove = (await slider.locator('.mu-slider-track').boundingBox())!;
  await page.mouse.move(groove.x + groove.width * 0.5, groove.y + groove.height / 2);
  expect(await face(slider, 'scale')).toBe(await recipe(page, '--mu-r-slider-knob-lift'));
  const lifted = (await slider.locator('.mu-slider-knob-face').boundingBox())!;
  expect(lifted.x + lifted.width).toBeLessThanOrEqual(groove.x + groove.width + 0.5);
});

test('keyboard focus rings the knob; a pointer press does not', async ({ page }) => {
  await open(page, '/components/slider', 'graphite');
  const slider = tuner(page).locator('.mu-slider');
  await slider.scrollIntoViewIfNeeded();
  const knob = slider.locator('.mu-slider-knob');
  await slider.locator('.mu-slider-track').click({ position: { x: 20, y: 5 } });
  expect(await knob.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
  // Tab away and back: keyboard focus
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(tuner(page).getByRole('slider')).toBeFocused();
  expect(await knob.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await tuner(page).screenshot({ path: capture('slider-focus-graphite') });
});

test('disabled: dimmed to the recipe, no hover, no drag, no keys', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const slider = section(page, 'states').locator('.mu-slider').last();
  const input = section(page, 'states').getByRole('slider', { name: 'Volume, disabled' });
  await slider.scrollIntoViewIfNeeded();
  await expect(slider).toHaveAttribute('data-disabled', '');
  expect(await slider.evaluate((el) => getComputedStyle(el).opacity)).toBe(await recipe(page, '--mu-r-slider-self-disabled'));
  await expect(input).toBeDisabled();
  const groove = (await slider.locator('.mu-slider-track').boundingBox())!;
  await page.mouse.move(groove.x + groove.width * 0.8, groove.y + groove.height / 2);
  expect(await face(slider, 'scale')).toBe('none');
  await page.mouse.down();
  await page.mouse.move(groove.x + groove.width * 0.9, groove.y + groove.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect(input).toHaveAttribute('aria-valuenow', '35');
});

/** Pushes a key at the slider and reports whether its groove started the refusal. */
async function push(slider: Locator, key: string) {
  return slider.evaluate(async (el, k) => {
    const control = el.querySelector('.mu-slider-control')!;
    control.getAnimations().forEach((a) => a.cancel()); // a fresh start: only this key's nudge counts
    el.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    await new Promise((r) => requestAnimationFrame(r));
    return control.getAnimations().filter((a) => (a as Animation & { id: string }).id === 'mu-refusal').length > 0;
  }, key);
}

for (const colorway of COLORWAYS) {
  test(`a key pushing past an end is refused with a small nudge in ${colorway}`, async ({ page }) => {
    await open(page, '/components/slider', colorway);
    const slider = section(page, 'states').locator('.mu-slider').first();
    const input = section(page, 'states').getByRole('slider', { name: 'Volume, at the end' });
    await input.focus();
    await expect(input).toHaveAttribute('aria-valuenow', '100');
    expect(await push(slider, 'ArrowRight')).toBe(true);
    await expect(input).toHaveAttribute('aria-valuenow', '100');
    // the knob stays inside the groove through the nudge: the groove moves with it
    const inside = await slider.evaluate(async (el) => {
      let worst = -Infinity;
      const t0 = performance.now();
      while (performance.now() - t0 < 400) {
        const g = el.querySelector('.mu-slider-track')!.getBoundingClientRect();
        const k = el.querySelector('.mu-slider-knob')!.getBoundingClientRect();
        worst = Math.max(worst, k.right - g.right);
        await new Promise((r) => requestAnimationFrame(r));
      }
      return worst;
    });
    expect(inside).toBeLessThanOrEqual(0.5);
    // not refused where the key can still move it; refused again at the other end
    await page.keyboard.press('ArrowLeft');
    expect(await push(slider, 'ArrowLeft')).toBe(false);
    await page.keyboard.press('Home');
    expect(await push(slider, 'ArrowLeft')).toBe(true);
    expect(await push(slider, 'Home')).toBe(true);
    await face(slider, 'scale'); // at rest before the capture
    await section(page, 'states').screenshot({ path: capture(`slider-states-${colorway}`) });
  });
}

test('Reduce Motion: the refusal does not move', async ({ page }) => {
  await emulateMedia(page, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await open(page, '/components/slider', 'graphite');
  const slider = section(page, 'states').locator('.mu-slider').first();
  await section(page, 'states').getByRole('slider', { name: 'Volume, at the end' }).focus();
  expect(await push(slider, 'ArrowRight')).toBe(false);
});
