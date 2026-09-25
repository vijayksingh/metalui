import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The needle gauge, an inset gadget drawn from its spec: the needle in the glass, the beeper on the
// frame, the value swinging the needle (overshoot, pegs), and the value deciding when it is over.
const angle = (el: import('@playwright/test').Locator) => el.evaluate((svg) => Number(svg.querySelector('[data-part="needle"]')!.getAttribute('transform')!.match(/rotate\(([-\d.]+)/)![1]));

for (const colorway of COLORWAYS) {
  test(`the needle gauge in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/needle-gauge', colorway);
    const levels = page.getByTestId('gauge-levels').locator('svg[data-gadget="needle-gauge"]');
    await expect(levels).toHaveCount(4);
    // 8, 24, 34, 40 of 40 on a 120° scale: −36°, 12°, 42°, 60°; past 0.75 (30 min) it is over.
    const angles = await Promise.all([0, 1, 2, 3].map((i) => angle(levels.nth(i))));
    expect(angles).toEqual([-36, 12, 42, 60]);
    expect(await levels.evaluateAll((els) => els.map((e) => e.getAttribute('data-state')))).toEqual(['rest', 'rest', 'over', 'over']);
    expect(await levels.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lamp"]')!.getAttribute('data-lamp')))).toEqual(['off', 'off', 'waiting', 'waiting']);
    // The needle is in the glass; the beeper sits on the frame, over it.
    const one = levels.nth(1);
    await expect(one.locator('[data-part="bezel.light"] [data-part="needle"]')).toHaveCount(1);
    await expect(one.locator('[data-layer="top"] [data-part="beeper"]')).toHaveCount(1);
    await expect(one.locator('desc')).toHaveText('Today: 24 of 40 min');
    await page.getByTestId('gauge-levels').screenshot({ path: capture(`gadget-needle-gauge-${colorway}`) });
  });
}

test('pointing swings the needle; it overshoots, settles, and bounces off the peg; past the zone it is over', async ({ page }) => {
  await open(page, '/gadgets/needle-gauge', 'bone');
  const gauge = page.getByTestId('gauge'), point = page.getByTestId('gauge-point');
  await point.scrollIntoViewIfNeeded();
  // From 24 (12°) to 28 (24°): it overshoots past 24° and comes back.
  await point.focus();
  const trace = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="gauge"]')!, out: number[] = [];
    (document.querySelector('[data-testid="gauge-point"]') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    for (let i = 0; i < 3; i++) (document.querySelector('[data-testid="gauge-point"]') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    const t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push(Number(svg.querySelector('[data-part="needle"]')!.getAttribute('transform')!.match(/rotate\(([-\d.]+)/)![1])); if (performance.now() - t0 > 900) { clearInterval(id); done(); } }, 8); });
    return out;
  });
  expect(Math.max(...trace)).toBeGreaterThan(24.5);
  expect(trace[trace.length - 1]).toBeCloseTo(24, 0);
  await expect(gauge).toHaveAttribute('data-state', 'rest');
  // All the way: the peg holds it at 60°, never past; the lamp goes amber.
  await page.keyboard.press('End');
  const peg = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="gauge"]')!, out: number[] = [], t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push(Number(svg.querySelector('[data-part="needle"]')!.getAttribute('transform')!.match(/rotate\(([-\d.]+)/)![1])); if (performance.now() - t0 > 700) { clearInterval(id); done(); } }, 8); });
    return out;
  });
  expect(Math.max(...peg)).toBeLessThanOrEqual(60.001);
  await expect(gauge).toHaveAttribute('data-state', 'over');
  await expect(gauge.locator('[data-part="lamp"]')).toHaveAttribute('data-lamp', 'waiting');
});

test('with reduced motion the needle goes straight to the value', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/needle-gauge', 'graphite');
  await page.getByTestId('gauge-point').focus();
  await page.keyboard.press('Home');
  expect(await angle(page.getByTestId('gauge'))).toBe(-60);
});

test('the flat tier has no filters, and the server string is over at 34', async ({ page }) => {
  await open(page, '/gadgets/needle-gauge', 'bone');
  const tiers = page.getByTestId('gauge-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  const still = page.getByTestId('gauge-static').locator('svg');
  await expect(still).toHaveAttribute('data-state', 'over');
  expect(await angle(still)).toBe(42);
});
