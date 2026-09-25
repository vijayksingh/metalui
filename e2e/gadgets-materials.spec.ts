import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Gadget materials (tokens.gadgets): seven materials at three weights on Foundations › Materials,
// lit by one filter per material, with the host changing the world around them, and a strike
// that always shows (the body gives) and delights only where motion is welcome (the glint).
const sheet = (page: import('@playwright/test').Page) => page.getByTestId('gadget-materials');

for (const colorway of COLORWAYS) {
  test(`gadget materials in ${colorway}`, async ({ page }) => {
    await open(page, '/foundations/materials', colorway);
    await expect(sheet(page)).toHaveAttribute('data-host', colorway);
    await expect(sheet(page).locator('[data-gadget-material]')).toHaveCount(21);
    // One filter per material, shared by its three weights; full detail at this size.
    const filters = page.locator('filter[data-material]');
    await expect(filters).toHaveCount(7);
    await expect(page.locator('filter[data-material="clay"]')).toHaveAttribute('data-tier', 'full');
    // A dark host deepens the cast shadow (gadgets.host.graphite.shadow).
    const castAlpha = await page.locator('filter[data-material="clay"] feFlood').first().getAttribute('flood-opacity');
    expect(Number(castAlpha)).toBeCloseTo(colorway === 'graphite' ? 0.24 * 1.35 : 0.24, 3);
    // Only matte materials fleck; glass and metal never do.
    await expect(page.locator('filter[data-material="stone"] feFuncA')).toHaveCount(1);
    await expect(page.locator('filter[data-material="glass"] feFuncA')).toHaveCount(0);
    await sheet(page).screenshot({ path: capture(`gadget-materials-${colorway}`) });
  });
}

test('a strike gives, and a glossy body glints', async ({ page }) => {
  await open(page, '/foundations/materials', 'bone');
  const glass = sheet(page).locator('[data-gadget-material="glass"][data-weight="0.5"]');
  await glass.dispatchEvent('pointerdown', { buttons: 1 });
  const running = await glass.evaluate((el) => ({
    body: el.querySelector('[data-part="body"]')!.getAnimations().length,
    glint: el.querySelector('[data-part="glint"]')!.getAnimations().length,
  }));
  expect(running.body).toBeGreaterThan(0);
  expect(running.glint).toBeGreaterThan(0);

  // Matte stone gives but never glints.
  const stone = sheet(page).locator('[data-gadget-material="stone"][data-weight="0.5"]');
  await stone.dispatchEvent('pointerdown', { buttons: 1 });
  expect(await stone.evaluate((el) => el.querySelector('[data-part="glint"]')!.getAnimations().length)).toBe(0);
});

test('with reduced motion the body still gives, but nothing glints', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/foundations/materials', 'graphite');
  const metal = sheet(page).locator('[data-gadget-material="metal"][data-weight="0.1"]');
  await metal.dispatchEvent('pointerdown', { buttons: 1 });
  const running = await metal.evaluate((el) => ({
    body: el.querySelector('[data-part="body"]')!.getAnimations().length,
    glint: el.querySelector('[data-part="glint"]')!.getAnimations().length,
  }));
  expect(running.body).toBeGreaterThan(0);
  expect(running.glint).toBe(0);
});
