import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Plug Part on Parts › Plug: plain and accent plugs with their stubs, detail by size, and a plug
// seated in a jack that runs the seat mechanism when pressed.
for (const colorway of COLORWAYS) {
  test(`plugs in ${colorway}`, async ({ page }) => {
    await open(page, '/components/plug', colorway);
    const plugs = page.getByTestId('plug-states').locator('svg[role="img"]');
    await expect(plugs).toHaveCount(4);
    expect(await plugs.evaluateAll((els) => els.map((e) => e.getAttribute('data-accent')))).toEqual([null, 'true', null, 'true']);
    expect(await plugs.evaluateAll((els) => els.map((e) => e.querySelector('[data-stub]')?.getAttribute('data-stub') ?? 'none'))).toEqual(['none', 'up', 'left', 'right']);
    // Six knurls on every plug, and its shadow is a layer of its own.
    expect(await plugs.first().locator('[data-part="plug"] path[stroke^="rgba"]').count()).toBe(6);
    await expect(plugs.first().locator('[data-part="plug.shadow"]')).toHaveCount(1);
    await page.getByTestId('plug-states').screenshot({ path: capture(`plug-${colorway}`) });
  });
}

test('detail follows size, and the flat tier has no filters', async ({ page }) => {
  await open(page, '/components/plug', 'bone');
  const tiers = page.getByTestId('plug-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
});

test('pressing a seated plug lifts it, brings it home, and lights the socket', async ({ page }) => {
  await open(page, '/components/plug', 'graphite');
  const seat = page.getByTestId('plug-seat');
  await expect(seat.locator('[data-lit]')).toHaveCount(0);
  const travel = await seat.evaluate(async (b) => {
    const g = b.querySelector('[data-part="plug"]')!, rest = g.getBoundingClientRect().y;
    let lift = 0;
    (b as HTMLElement).click();
    const t0 = performance.now();
    await new Promise<void>((done) => { const f = () => { lift = Math.max(lift, rest - g.getBoundingClientRect().y); if (performance.now() - t0 < 1200) requestAnimationFrame(f); else done(); }; f(); });
    return { lift, home: Math.abs(g.getBoundingClientRect().y - rest), connected: g.isConnected };
  });
  expect(travel.connected).toBe(true);
  expect(travel.lift).toBeGreaterThan(4);
  expect(travel.home).toBeLessThan(0.5);
  await expect(seat.locator('[data-lit="live"]')).toHaveCount(1);
});
