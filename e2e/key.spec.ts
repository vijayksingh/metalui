import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Key Part on Parts › Key: keys with engraved glyphs, detail by size, and a key whose face drops
// into its skirt when held and comes back when let go, the skirt never moving.
const faceDrop = (k: Locator) => k.locator('[data-part="key.face"]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);

for (const colorway of COLORWAYS) {
  test(`keys in ${colorway}`, async ({ page }) => {
    await open(page, '/components/key', colorway);
    const keys = page.getByTestId('key-looks').locator('svg[role="img"]');
    await expect(keys).toHaveCount(4);
    expect(await keys.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="key"]')!.getAttribute('data-glyph')))).toEqual(['⌘', 'K', '⇧', '↩']);
    // The glyph is engraved: a lit edge under a dark cut.
    await expect(keys.first().locator('[data-part="key.face"] text')).toHaveCount(2);
    await expect(keys.first().locator('[data-part="key.shadow"]')).toHaveCount(1);
    await page.getByTestId('key-looks').screenshot({ path: capture(`key-${colorway}`) });
  });
}

test('the flat tier has no filters and one plain glyph', async ({ page }) => {
  await open(page, '/components/key', 'bone');
  const tiers = page.getByTestId('key-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  await expect(tiers.nth(3).locator('text')).toHaveCount(1);
});

test('held, the face drops into the skirt; let go, it comes back; the skirt stays', async ({ page }) => {
  await open(page, '/components/key', 'graphite');
  const key = page.getByTestId('key-press');
  await key.scrollIntoViewIfNeeded();
  const skirt = await key.locator('[data-part="key.skirt"]').boundingBox();
  const box = (await key.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(key).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => faceDrop(key)).toBeGreaterThan(10);        // 6 units at 220 wide, in canvas units
  expect(await key.locator('[data-part="key.skirt"]').boundingBox()).toEqual(skirt);
  await page.mouse.up();
  await expect.poll(() => faceDrop(key)).toBeCloseTo(0, 1);
  await key.focus();
  await page.keyboard.down(' ');
  await expect(key).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up(' ');
  await expect(key).toHaveAttribute('aria-pressed', 'false');
});

test('with reduced motion it still dips, at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/key', 'bone');
  const key = page.getByTestId('key-press');
  await key.focus();
  await page.keyboard.down(' ');
  expect(await faceDrop(key)).toBeGreaterThan(10);
  await page.keyboard.up(' ');
});
