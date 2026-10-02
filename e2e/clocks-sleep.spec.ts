import { expect, test } from '@playwright/test';
import { open } from './helpers';

// A clock nobody can see does not run: the Weather sky steps its frames while it is on screen and
// goes quiet once scrolled away, and picks up again when it returns.
const repaints = (page: import('@playwright/test').Page, ms: number) =>
  page.evaluate((span) => new Promise<number>((resolve) => {
    const svg = document.querySelector('[data-kind] svg')!;
    let n = 0;
    const watch = new MutationObserver((m) => { n += m.length; });
    watch.observe(svg, { subtree: true, attributes: true, attributeFilter: ['d'] });
    setTimeout(() => { watch.disconnect(); resolve(n); }, span);
  }), ms);

const top = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.querySelector('[data-kind]')!.getBoundingClientRect().top);

test('the Weather sky only steps while it is on screen', async ({ page }) => {
  await open(page, '/components/weather', 'bone');
  await page.locator('[data-kind]').first().scrollIntoViewIfNeeded();
  expect(await repaints(page, 1500)).toBeGreaterThan(0);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  expect(await top(page)).toBeLessThan(-100); // really off screen
  expect(await repaints(page, 1500)).toBe(0);

  await page.evaluate(() => document.querySelector('[data-kind]')!.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  expect(await top(page)).toBeGreaterThan(0);
  expect(await repaints(page, 1500)).toBeGreaterThan(0);
});

test('the Day clock only counts while it is on screen', async ({ page }) => {
  await open(page, '/components/day', 'bone');
  const ticks = (ms: number) => page.evaluate((span) => new Promise<number>((resolve) => {
    const seconds = document.querySelector('[data-part="seconds"]')!;
    let n = 0;
    const watch = new MutationObserver((m) => { n += m.length; });
    watch.observe(seconds, { attributes: true, attributeFilter: ['d'] });
    setTimeout(() => { watch.disconnect(); resolve(n); }, span);
  }), ms);
  const rect = () => page.evaluate(() => document.querySelector('[data-part="seconds"]')!.getBoundingClientRect().top);

  await page.evaluate(() => document.querySelector('[data-part="seconds"]')!.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  expect(await ticks(2500)).toBeGreaterThan(0);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  expect(await rect()).toBeLessThan(-100);
  expect(await ticks(2500)).toBe(0);

  await page.evaluate(() => document.querySelector('[data-part="seconds"]')!.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  expect(await ticks(2500)).toBeGreaterThan(0);
});

test('a breathing LED holds still while it is scrolled away', async ({ page }) => {
  await open(page, '/components/led', 'bone');
  const lamp = page.locator('[data-cell="waiting-breathe"] [data-gesture]');
  const state = () => lamp.evaluate((el) => el.getAnimations({ subtree: true }).map((a) => a.playState));
  await lamp.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  expect(await state()).toEqual(['running']);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  expect(await lamp.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(-100);
  expect(await state()).toEqual(['paused']);

  await lamp.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  expect(await state()).toEqual(['running']);
});
