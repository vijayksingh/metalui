import { expect, test } from '@playwright/test';

// Layers stay on the bench: when an x-ray explodes a part into its layers, the stack rises off the floor,
// so the scene fits that rise and drops to centre it (useFit). Every part opened from the front door,
// with its Layers card chosen, keeps every layer and tag inside the bench.
const IDS = ['swatch', 'chip', 'key', 'slider', 'field', 'status', 'tooltip', 'toast', 'menu', 'dialog', 'palette', 'toolbar'];

for (const id of IDS) {
  test(`${id}: its exploded layers stay inside the bench`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // objects hold still in space, so they can be clicked
    await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'bone'));
    await page.goto('/');
    const item = page.locator(`[data-float="${id}"]`);
    await item.waitFor();
    // each object opens its x-ray from its body; a few take the centre for their own control, so try a corner too
    const overlay = page.locator('.xr-overlay');
    for (const position of [undefined, { x: 6, y: 6 }]) {
      if (await overlay.isVisible()) break;
      await item.locator(':scope > *').first().click({ force: true, position });
      await overlay.waitFor({ timeout: 2500 }).catch(() => {});
    }
    await expect(overlay).toBeVisible();
    const layers = overlay.getByRole('button', { name: /^Layers/ });
    test.skip(await layers.count() === 0, 'no layers card');
    await layers.first().click();
    await page.waitForTimeout(400);
    const fit = await overlay.locator('.xr-bench').evaluate((bench) => {
      const b = bench.getBoundingClientRect();
      const rs = [...bench.querySelectorAll('.xr-face.is-layer, .xr-face.is-layer .xr-tag')].map((f) => f.getBoundingClientRect()).filter((r) => r.width > 0);
      return { count: rs.length, over: b.top - Math.min(...rs.map((r) => r.top)), under: Math.max(...rs.map((r) => r.bottom)) - b.bottom };
    });
    expect(fit.count).toBeGreaterThan(0);
    expect(fit.over).toBeLessThanOrEqual(0);
    expect(fit.under).toBeLessThanOrEqual(0);
  });
}
