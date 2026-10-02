import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Lamp gestures (tokens status.gestures) on the LED, as Parts › LED shows them: each gesture runs
// for its token length, breathing loops, a replay starts it again, and reduced motion holds steady.
const cell = (page: import('@playwright/test').Page, kind: string, gesture: string) =>
  page.locator(`[data-cell="${kind}-${gesture}"] [data-gesture]`);
const timing = (loc: import('@playwright/test').Locator) =>
  loc.evaluate((el) => el.getAnimations({ subtree: true }).map((a) => {
    const t = (a.effect as KeyframeEffect).getTiming();
    return { duration: t.duration, iterations: t.iterations, name: (a as CSSAnimation).animationName };
  }));

test('each gesture plays for its token length', async ({ page }) => {
  await open(page, '/components/led', 'bone');
  expect(await timing(cell(page, 'live', 'steady'))).toEqual([]);
  expect(await timing(cell(page, 'live', 'flicker'))).toEqual([{ duration: 800, iterations: 1, name: 'mu-led-flicker' }]);
  expect(await timing(cell(page, 'waiting', 'breathe'))).toEqual([{ duration: 2400, iterations: Infinity, name: 'mu-led-breathe' }]);
  expect(await timing(cell(page, 'failed', 'blink2'))).toEqual([{ duration: 460, iterations: 1, name: 'mu-led-blink2' }]);
  expect(await timing(cell(page, 'live', 'rise'))).toEqual([{ duration: 1200, iterations: 1, name: 'mu-led-rise' }]);
  // A gesture dims the glow; it never fades the lamp.
  const opacity = await cell(page, 'failed', 'blink2').evaluate((el) => getComputedStyle(el).opacity);
  expect(opacity).toBe('1');
});

test('Play runs a finished gesture again', async ({ page }) => {
  await open(page, '/components/led', 'graphite');
  const flicker = cell(page, 'live', 'flicker');
  await page.waitForTimeout(900);
  expect(await flicker.evaluate((el) => el.getAnimations({ subtree: true })[0]?.playState)).toBe('finished');
  await page.getByTestId('led-play').click();
  expect(await cell(page, 'live', 'flicker').evaluate((el) => el.getAnimations({ subtree: true })[0]?.playState)).toBe('running');
});

test('reduced motion holds every lamp steady and keeps its kind', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/led', 'bone');
  for (const g of ['flicker', 'breathe', 'blink2', 'rise']) expect(await timing(cell(page, 'failed', g)), g).toEqual([]);
  await expect(cell(page, 'failed', 'blink2')).toHaveAttribute('data-kind', 'failed');
});

for (const colorway of COLORWAYS) {
  test(`LED page in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/led', colorway);
    await page.getByTestId('led-gestures').screenshot({ path: capture(`led-gestures-${colorway}`) });
  });
}

test('socket stays opaque while only the lens dims, including scoped reduction', async ({ page }) => {
  await open(page, '/components/led', 'bone');
  const lamp = cell(page, 'waiting', 'breathe');
  const layers = await lamp.evaluate(el => ({
    width: el.getBoundingClientRect().width,
    socket: (() => { const c = document.createElement('canvas').getContext('2d')!; c.fillStyle = getComputedStyle(el).backgroundColor; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data]; })(),
    lens: el.querySelector('[data-lamp]')!.getBoundingClientRect().width,
    filter: getComputedStyle(el.querySelector('[data-lamp]')!).filter,
  }));
  expect(layers).toEqual({ width: 10, socket: [36, 36, 39, 255], lens: 8, filter: 'none' });
  await page.getByTestId('led-gestures').evaluate(el => el.setAttribute('data-mu-motion', 'reduce'));
  await expect.poll(() => timing(lamp)).toEqual([]);
  await expect(lamp.locator('[data-lamp]')).toHaveCSS('opacity', '1');
  await expect(cell(page, 'off', 'steady').locator('[data-lamp]')).toHaveCSS('box-shadow', 'none');
});
