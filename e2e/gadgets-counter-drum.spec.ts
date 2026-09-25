import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The counter drum, drawn from its spec and turned by the roll: odometer order, forward through 9,
// its count in its description.
const digits = (page: Page) => page.getByTestId('counter').evaluate((svg) => ['d2', 'd1', 'd0'].map((id) => {
  const strip = svg.querySelector(`[data-id="${id}"] [data-moves]`)!;
  return (Math.round(-Number((strip.getAttribute('transform') ?? '').match(/translate\(0 ([-\d.]+)\)/)![1]) / 36) % 10) + 0;   // + 0: no −0
}));

for (const colorway of COLORWAYS) {
  test(`the counter drum in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/counter-drum', colorway);
    const states = page.getByTestId('counter-states').locator('svg[data-gadget="counter-drum"]');
    await expect(states).toHaveCount(3);
    const one = states.nth(1);
    await expect(one.locator('[data-cut="tray"]')).toHaveCount(1);
    await expect(one.locator('[data-part="drum"]')).toHaveCount(3);
    await expect(one.locator('[data-accent="true"]')).toHaveAttribute('data-id', 'd0');
    expect(await one.locator('[data-part="drum"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-value')))).toEqual(['0', '1', '2']);
    await expect(one.locator('desc')).toHaveText('Streak: 12 days');
    await page.getByTestId('counter-states').screenshot({ path: capture(`gadget-counter-drum-${colorway}`) });
  });
}

test('a day at 19 carries: the units run on into 0 first, then the tens turn', async ({ page }) => {
  await open(page, '/gadgets/counter-drum', 'bone');
  const counter = page.getByTestId('counter');
  await counter.scrollIntoViewIfNeeded();
  for (let i = 0; i < 7; i++) await page.getByTestId('count-up').click();          // 12 → 19
  await expect.poll(() => digits(page)).toEqual([0, 1, 9]);
  // Watch the carry: the units strip keeps moving the same way (forward), and moves before the tens.
  const trace = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="counter"]')!;
    const y = (id: string) => Number((svg.querySelector(`[data-id="${id}"] [data-moves]`)!.getAttribute('transform') ?? '').match(/translate\(0 ([-\d.]+)\)/)![1]);
    const out: number[][] = [];
    (document.querySelector('[data-testid="count-up"]') as HTMLButtonElement).click();
    const t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push([performance.now() - t0, y('d0'), y('d1')]); if (performance.now() - t0 > 700) { clearInterval(id); done(); } }, 8); });
    return out;
  });
  const units = trace.map((r) => -r[1] / 36), tens = trace.map((r) => -r[2] / 36);
  // Forward: from 9 the units pass 9.5 (never back through 8.5) and land on 0.
  // (The strip shows the digit mod 10, so past 9 it reads just over 0: never back near 8.)
  expect(units.every((u) => u > 8.6 || u < 0.6)).toBe(true);
  expect(units.some((u) => u > 9.3)).toBe(true);
  const firstMove = (xs: number[], from: number) => trace.find((_, i) => Math.abs(xs[i] - from) > 0.05)?.[0] ?? Infinity;
  expect(firstMove(units, 9)).toBeLessThan(firstMove(tens, 1));
  await expect.poll(() => digits(page)).toEqual([0, 2, 0]);
  await expect(counter.locator('desc')).toHaveText('Streak: 20 days');
});

test('taking one back turns back; a far jump lands every drum; reduced motion goes at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/counter-drum', 'graphite');
  await page.getByRole('button', { name: 'Take one back' }).click();
  expect(await digits(page)).toEqual([0, 1, 1]);
  await page.getByRole('button', { name: '99' }).click();
  expect(await digits(page)).toEqual([0, 9, 9]);
  await page.getByRole('button', { name: 'Start again' }).click();
  expect(await digits(page)).toEqual([0, 0, 0]);
});

test('the flat tier has no filters, and the server string shows the count', async ({ page }) => {
  await open(page, '/gadgets/counter-drum', 'bone');
  const tiers = page.getByTestId('counter-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  const still = page.getByTestId('counter-static').locator('svg');
  expect(await still.locator('[data-part="drum"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-value')))).toEqual(['0', '1', '2']);
  await expect(still.locator('desc')).toHaveText('Streak: 12 days');
});
