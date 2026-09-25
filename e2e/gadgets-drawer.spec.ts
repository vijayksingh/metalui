import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The drawer, a slab gadget drawn from its spec: a tray under the top's front edge with a pull on its
// front, its cards standing to the fill, run out and home by slide-out, held out when open, and stuck
// out when too full to close.
const trayY = (svg: import('@playwright/test').Locator) => svg.evaluate((e) => {
  const t = e.querySelector('[data-id="tray"] [data-moves]')!.getAttribute('transform') ?? '';
  const m = t.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
  return m ? Math.round(Number(m[2]) - (t.includes('rotate') ? 206 : 0)) : 0;
});
const cards = (svg: import('@playwright/test').Locator) => svg.evaluate((e) => Number(e.querySelector('[data-part="tray"]')!.getAttribute('data-fill')));

for (const colorway of COLORWAYS) {
  test(`the drawer in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/drawer', colorway);
    const states = page.getByTestId('drawer-states').locator('svg[data-gadget="drawer"]');
    await expect(states).toHaveCount(3);
    expect(await states.evaluateAll((els) => els.map((e) => e.getAttribute('data-state')))).toEqual(['rest', 'open', 'full']);
    expect(await Promise.all([0, 1, 2].map((i) => trayY(states.nth(i))))).toEqual([0, 60, 22]);
    expect(await Promise.all([0, 1, 2].map((i) => cards(states.nth(i))))).toEqual([4, 4, 10]);
    expect(await states.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lamp"]')!.getAttribute('data-lamp')))).toEqual(['off', 'live', 'waiting']);
    // Only what is out past the top's front edge shows: the tray is clipped to it.
    await expect(states.nth(0).locator('[clip-path] > [data-id="tray"]')).toHaveCount(1);
    await expect(states.nth(2).locator('desc')).toHaveText('Storage: 100% full, too full to close');
    await page.getByTestId('drawer-states').screenshot({ path: capture(`gadget-drawer-${colorway}`) });
  });
}

test('filing a card runs the drawer out on its runners and home; filled, it stays out', async ({ page }) => {
  await open(page, '/gadgets/drawer', 'bone');
  const drawer = page.getByTestId('drawer');
  await drawer.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'File a card' }).click();
  const trace = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="drawer"]')!, out: number[] = [], t0 = performance.now();
    await new Promise<void>((done) => {
      const id = setInterval(() => {
        const t = svg.querySelector('[data-id="tray"] [data-moves]')!.getAttribute('transform') ?? '';
        out.push(Number(t.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/)?.[2] ?? 0) - (t.includes('rotate') ? 206 : 0));
        if (performance.now() - t0 > 1400) { clearInterval(id); done(); }
      }, 8);
    });
    return out;
  });
  // Out to its runners (60), never past them, and home again.
  expect(Math.max(...trace)).toBeGreaterThan(58);
  expect(Math.max(...trace)).toBeLessThanOrEqual(60.5);
  expect(Math.abs(trace[trace.length - 1])).toBeLessThan(1);
  expect(await cards(drawer)).toBe(5);
  // Filled to nine of ten, it cannot close: it rests out 22, amber.
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'File a card' }).click();
  await expect(drawer).toHaveAttribute('data-state', 'full');
  await expect.poll(() => trayY(drawer), { timeout: 3000 }).toBe(22);
  await expect(drawer.locator('[data-part="lamp"]')).toHaveAttribute('data-lamp', 'waiting');
  // Cleared out, it closes.
  await page.getByRole('button', { name: 'Clear it out' }).click();
  await expect(drawer).toHaveAttribute('data-state', 'rest');
  await expect.poll(() => trayY(drawer), { timeout: 3000 }).toBe(0);
  expect(await cards(drawer)).toBe(0);
});

test('with reduced motion it goes straight to held open; the flat tier has no filters; the server string is full', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/drawer', 'graphite');
  await page.getByRole('switch', { name: 'Held open' }).click();
  expect(await trayY(page.getByTestId('drawer'))).toBe(60);
  const tiers = page.getByTestId('drawer-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  const still = page.getByTestId('drawer-static').locator('svg');
  await expect(still).toHaveAttribute('data-state', 'full');
  expect(await trayY(still)).toBe(22);
});
