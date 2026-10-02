import { expect, test, type Locator } from '@playwright/test';
import { capture, open } from './helpers';

async function settle(root: Locator) {
  await root.evaluate(async el => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(el.getAnimations({ subtree: true }).filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => undefined)));
  });
}

test('range knobs keep independent bounds, keyboard increments and disabled stops', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const lower = page.getByRole('slider', { name: 'Exposure, lower', exact: true });
  const upper = page.getByRole('slider', { name: 'Exposure, upper', exact: true });
  await lower.focus();
  await page.keyboard.press('End');
  await expect(lower).toHaveAttribute('aria-valuenow', '65');
  await page.keyboard.press('ArrowRight');
  await expect(lower).toHaveAttribute('aria-valuenow', '65');
  await upper.focus();
  await page.keyboard.press('Home');
  await expect(upper).toHaveAttribute('aria-valuenow', '75');
  await page.keyboard.press('PageUp');
  await expect(upper).toHaveAttribute('aria-valuenow', '100');
  await lower.focus();
  await page.keyboard.press('PageDown');
  await expect(lower).toHaveAttribute('aria-valuenow', '40');
  await expect(upper).toHaveAttribute('aria-valuenow', '100');
  const fixed = page.getByRole('slider', { name: 'Fixed lower', exact: true });
  await expect(fixed).toBeDisabled();
  const movable = page.getByRole('slider', { name: 'Movable upper', exact: true });
  await movable.focus();
  await page.keyboard.press('Home');
  await expect(movable).toHaveAttribute('aria-valuenow', '35');
  await expect(fixed).toHaveAttribute('aria-valuenow', '30');
  const free = page.getByRole('slider', { name: 'Uncontrolled range, lower', exact: true });
  await free.focus(); await page.keyboard.press('ArrowRight');
  await expect(free).toHaveAttribute('aria-valuenow', '21');
  await page.getByRole('slider', { name: 'Balance', exact: true }).focus();
  await expect(free).toHaveAttribute('aria-valuenow', '21');
});

for (const colorway of ['bone', 'graphite'] as const) {
  test(`range, centred fill, neutral plate and transient bubble fit in ${colorway}`, async ({ page }) => {
    if (colorway === 'graphite') await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/slider', colorway);
    const balance = page.getByRole('slider', { name: 'Balance', exact: true });
    const root = balance.locator('xpath=ancestor::div[contains(@class,"mu-slider ")]').first();
    await balance.focus(); await settle(root);
    expect(await root.locator('.mu-slider-fill').evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(.5);
    await page.keyboard.press('End'); await settle(root);
    await expect.poll(() => root.evaluate(el => {
      const fill = el.querySelector('.mu-slider-fill')!.getBoundingClientRect();
      const track = el.querySelector('.mu-slider-track')!.getBoundingClientRect();
      return Math.abs(fill.left - (track.left + track.width / 2));
    })).toBeLessThan(.5);
    const right = await root.locator('.mu-slider-fill').boundingBox();
    const track = (await root.locator('.mu-slider-track').boundingBox())!;
    expect(Math.abs(right!.x - (track.x + track.width / 2))).toBeLessThan(.5);
    await expect(root.locator('.mu-slider-bubble')).toHaveCSS('opacity', '1');
    await expect(balance).toHaveAttribute('aria-valuetext', '100 R');
    await page.keyboard.press('Home'); await settle(root);
    const left = (await root.locator('.mu-slider-fill').boundingBox())!;
    expect(Math.abs(left.x + left.width - (track.x + track.width / 2))).toBeLessThan(.5);
    await expect(balance).toHaveAttribute('aria-valuetext', '100 L');
    await balance.blur(); await settle(root);
    await expect(root.locator('.mu-slider-bubble')).toHaveCSS('opacity', '0');
    await page.getByTestId('slider-kinds').screenshot({ path: capture(`slider-kinds-${colorway}`) });
  });
}

test('vertical dragging stays 1:1, refuses on its physical axis and settles inside the groove', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const input = page.getByRole('slider', { name: 'Vertical level', exact: true });
  const root = input.locator('xpath=ancestor::div[contains(@class,"mu-slider ")]').first();
  await root.scrollIntoViewIfNeeded();
  const track = (await root.locator('.mu-slider-track').boundingBox())!;
  const knob = (await root.locator('.mu-slider-knob').boundingBox())!;
  await page.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2); await page.mouse.down();
  const target = track.y + track.height * .25;
  await page.mouse.move(track.x + track.width / 2, target, { steps: 8 });
  const moved = (await root.locator('.mu-slider-knob').boundingBox())!;
  expect(Math.abs(moved.y + moved.height / 2 - target)).toBeLessThan((track.height - knob.height) / 200 + .5);
  await expect(root.locator('.mu-slider-bubble')).toHaveCSS('opacity', '1');
  await page.mouse.move(track.x + track.width / 2, track.y - 30);
  await expect(input).toHaveAttribute('aria-valuenow', '100');
  const refusal = await root.locator('.mu-slider-control').evaluate(el => el.getAnimations().filter(a => a.id === 'mu-refusal').flatMap(a => (a.effect as KeyframeEffect).getKeyframes()).map(f => f.transform));
  expect(refusal[0]).toMatch(/translateY\(-/);
  await page.mouse.up(); await settle(root);
  const end = (await root.locator('.mu-slider-knob').boundingBox())!;
  const settledTrack = (await root.locator('.mu-slider-track').boundingBox())!;
  expect(Math.abs(end.y - settledTrack.y)).toBeLessThan(.5);
  await input.focus(); await page.keyboard.press('Home'); await settle(root);
  const start = (await root.locator('.mu-slider-knob').boundingBox())!;
  expect(Math.abs(start.y + start.height - (settledTrack.y + settledTrack.height))).toBeLessThan(.5);
});

test('RTL arrows and refusals follow physical direction; scoped reduction removes travel', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const input = page.getByRole('slider', { name: 'RTL amount', exact: true });
  const root = input.locator('xpath=ancestor::div[contains(@class,"mu-slider ")]').first();
  await input.focus(); await page.keyboard.press('ArrowRight');
  await expect(input).toHaveAttribute('aria-valuenow', '49');
  await page.keyboard.press('End'); await settle(root);
  const track = (await root.locator('.mu-slider-track').boundingBox())!;
  const knob = (await root.locator('.mu-slider-knob').boundingBox())!;
  await page.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2);
  await settle(root);
  const face = (await root.locator('.mu-slider-knob-face').boundingBox())!;
  expect(face.x).toBeGreaterThanOrEqual(track.x - .5);
  await page.keyboard.press('ArrowLeft');
  const frames = await root.locator('.mu-slider-control').evaluate(el => el.getAnimations().filter(a => a.id === 'mu-refusal').flatMap(a => (a.effect as KeyframeEffect).getKeyframes()).map(f => f.transform));
  expect(frames[0]).toMatch(/translateX\(-/);
  await settle(root);
  await root.evaluate(el => el.setAttribute('data-mu-motion', 'reduce'));
  await expect(root).toHaveAttribute('data-reduced', '');
  await page.keyboard.press('ArrowLeft');
  expect(await root.locator('.mu-slider-control').evaluate(el => el.getAnimations().filter(a => a.id === 'mu-refusal').length)).toBe(0);
  await page.keyboard.press('Home');
  await expect(input).toHaveAttribute('aria-valuenow', '0');
});

test.describe('detent host', () => {
  test.use({ hasTouch: true, isMobile: true });
  test('one accepted step catches once; disabled controls do not catch, and reduction preserves haptics', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: unknown[] = [];
      (window as unknown as { __sliderVibrations: unknown[] }).__sliderVibrations = calls;
      Object.defineProperty(Navigator.prototype, 'vibrate', { configurable: true, value: (pattern: unknown) => { calls.push(pattern); return true; } });
    });
    await open(page, '/components/slider', 'bone');
    const quality = page.getByRole('slider', { name: 'Export quality', exact: true });
    await quality.focus(); await page.keyboard.press('ArrowRight');
    await expect(quality).toHaveAttribute('aria-valuenow', '4');
    await expect.poll(() => page.evaluate(() => (window as unknown as { __sliderVibrations: unknown[] }).__sliderVibrations)).toEqual([12]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('ArrowRight');
    await expect(quality).toHaveAttribute('aria-valuenow', '5');
    await expect.poll(() => page.evaluate(() => (window as unknown as { __sliderVibrations: unknown[] }).__sliderVibrations)).toEqual([12, 12]);
    await page.keyboard.press('ArrowRight');
    await expect(quality).toHaveAttribute('aria-valuenow', '5');
    await expect.poll(() => page.evaluate(() => (window as unknown as { __sliderVibrations: unknown[] }).__sliderVibrations)).toEqual([12, 12, [10, 60, 10]]);
    await expect(page.getByRole('slider', { name: 'Volume, disabled', exact: true })).toBeDisabled();
    const fixed = page.getByRole('slider', { name: 'Fixed lower', exact: true });
    const fixedRoot = fixed.locator('xpath=ancestor::div[contains(@class,"mu-slider ")]').first();
    await fixedRoot.scrollIntoViewIfNeeded();
    const knob = (await fixedRoot.locator('.mu-slider-knob').first().boundingBox())!;
    const control = (await fixedRoot.locator('.mu-slider-control').boundingBox())!;
    await page.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2);
    await page.mouse.down();
    await page.mouse.move(control.x + control.width + 30, knob.y + knob.height / 2);
    await page.mouse.up();
    await expect(fixed).toHaveAttribute('aria-valuenow', '30');
    await expect(page.getByRole('slider', { name: 'Movable upper', exact: true })).toHaveAttribute('aria-valuenow', '70');
    expect(await page.evaluate(() => (window as unknown as { __sliderVibrations: unknown[] }).__sliderVibrations)).toEqual([12, 12, [10, 60, 10]]);
  });
});
