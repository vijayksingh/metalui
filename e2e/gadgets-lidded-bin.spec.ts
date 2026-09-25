import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The lidded bin, a slab gadget drawn from its spec: a rubber lid on its mouth that the state holds
// (closed, ajar when armed, showing the red under it), and that emptying swings open and slams shut.
const openOf = (svg: import('@playwright/test').Locator) => svg.evaluate((e) => Number(e.querySelector('[data-part="lid"]')!.getAttribute('data-open')));

for (const colorway of COLORWAYS) {
  test(`the lidded bin in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/lidded-bin', colorway);
    const states = page.getByTestId('bin-states').locator('svg[data-gadget="lidded-bin"]');
    await expect(states).toHaveCount(3);
    expect(await states.evaluateAll((els) => els.map((e) => e.getAttribute('data-state')))).toEqual(['rest', 'armed', 'emptied']);
    expect(await Promise.all([0, 1, 2].map((i) => openOf(states.nth(i))))).toEqual([0, 18, 0]);
    expect(await states.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lamp"]')!.getAttribute('data-lamp')))).toEqual(['off', 'failed', 'live']);
    // The body is near-black rubber; the red is under the lid (and in the lamp), never the body.
    await expect(states.nth(1).locator('[data-part="lid.under"]')).toHaveAttribute('opacity', '1');
    await expect(states.nth(1).locator('desc')).toHaveText('Trash: armed, ready to empty');
    await page.getByTestId('bin-states').screenshot({ path: capture(`gadget-lidded-bin-${colorway}`) });
  });
}

test('arming lifts the lid ajar on the hinge; emptying swings it open and slams it shut', async ({ page }) => {
  await open(page, '/gadgets/lidded-bin', 'bone');
  const bin = page.getByTestId('bin');
  await bin.scrollIntoViewIfNeeded();
  await page.getByRole('switch', { name: 'Armed' }).click();
  await expect(bin).toHaveAttribute('data-state', 'armed');
  // The hinge spring carries it past 18° a little and back.
  const rise = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="bin"]')!, out: number[] = [], t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push(Number(svg.querySelector('[data-part="lid"]')!.getAttribute('data-open'))); if (performance.now() - t0 > 900) { clearInterval(id); done(); } }, 8); });
    return out;
  });
  expect(Math.max(...rise)).toBeGreaterThan(18);
  expect(rise[rise.length - 1]).toBeCloseTo(18, 0);
  // Emptied: all the way up (near 70°), then shut against the rim, never below it.
  await page.getByRole('button', { name: 'Empty' }).click();
  const swing = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="bin"]')!, out: number[] = [], t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push(Number(svg.querySelector('[data-part="lid"]')!.getAttribute('data-open'))); if (performance.now() - t0 > 1500) { clearInterval(id); done(); } }, 8); });
    return out;
  });
  expect(Math.max(...swing)).toBeGreaterThan(60);
  expect(Math.min(...swing)).toBeGreaterThanOrEqual(0);
  expect(swing[swing.length - 1]).toBeCloseTo(0, 0);
  await expect(bin).toHaveAttribute('data-state', 'emptied');
  await expect(bin.locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'blink2');
  await expect(bin).toHaveAttribute('data-state', 'rest', { timeout: 3000 });
});

test('with reduced motion the lid goes straight to ajar; the flat tier has no filters; the server string is armed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/lidded-bin', 'graphite');
  await page.getByRole('switch', { name: 'Armed' }).click();
  expect(await openOf(page.getByTestId('bin'))).toBe(18);
  const tiers = page.getByTestId('bin-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  const still = page.getByTestId('bin-static').locator('svg');
  await expect(still).toHaveAttribute('data-state', 'armed');
  expect(await openOf(still)).toBe(18);
});
