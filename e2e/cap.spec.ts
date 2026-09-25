import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Cap Part on Parts › Cap: faders and knobs, detail by size, and a cap that sinks when pressed
// and comes back when let go, by pointer or keyboard, on the release spring or at once.
const sink = (cap: Locator) => cap.locator('[data-part="cap.face"]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);

for (const colorway of COLORWAYS) {
  test(`caps in ${colorway}`, async ({ page }) => {
    await open(page, '/components/cap', colorway);
    const looks = page.getByTestId('cap-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(6);
    expect(await looks.evaluateAll((els) => els.map((e) => e.querySelector('[data-shape]')!.getAttribute('data-shape')))).toEqual(['fader', 'fader', 'fader', 'fader', 'knob', 'knob']);
    // Three ribs (a groove and its lit edge each) on a fader, five when asked; a pointer on a knob.
    expect(await looks.first().evaluate((e) => e.querySelector('[data-part="cap.face"] path[stroke]')!.getAttribute('d')!.match(/M/g)!.length)).toBe(3);
    expect(await looks.nth(3).evaluate((e) => e.querySelector('[data-part="cap.face"] path[stroke]')!.getAttribute('d')!.match(/M/g)!.length)).toBe(5);
    await expect(looks.nth(4).locator('[data-part="cap.face"] path[stroke]')).toHaveCount(2);
    await expect(looks.first().locator('[data-part="cap.shadow"]')).toHaveCount(1);
    await page.getByTestId('cap-looks').screenshot({ path: capture(`cap-${colorway}`) });
  });
}

test('the flat tier has no filters and no ribs', async ({ page }) => {
  await open(page, '/components/cap', 'bone');
  const tiers = page.getByTestId('cap-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  await expect(tiers.nth(3).locator('[data-part="cap.face"] path[stroke]')).toHaveCount(0);
});

test('held down it sinks; let go it comes back', async ({ page }) => {
  await open(page, '/components/cap', 'graphite');
  const cap = page.getByTestId('cap-press');
  await cap.scrollIntoViewIfNeeded();
  const box = (await cap.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(cap).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => sink(cap)).toBeGreaterThan(8);          // 2.5 units at 200 units wide, in canvas units
  await page.mouse.up();
  await expect(cap).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => sink(cap)).toBeCloseTo(0, 1);
  // The keyboard holds it too.
  await cap.focus();
  await page.keyboard.down(' ');
  await expect(cap).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.up(' ');
  await expect(cap).toHaveAttribute('aria-pressed', 'false');
});

test('with reduced motion it sinks at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/cap', 'bone');
  const cap = page.getByTestId('cap-press');
  await cap.focus();
  await page.keyboard.down(' ');
  expect(await sink(cap)).toBeGreaterThan(8);
  await page.keyboard.up(' ');
});
