import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// One chevron, four directions (docs/MORPH.md, Icons rule I11): `turn` points the one glyph down,
// left, up or right, act and all; when the direction is a control's state, MorphIcon morphs to the
// turned glyph, a quarter turn as a rigid carriage and a half turn turning over on its axis.

/** The drawn ink's box, in screen pixels (what a person sees, whatever the transform). */
const ink = (glyph: Locator) =>
  glyph.evaluate((svg) => {
    const boxes = [...svg.querySelectorAll('path')].filter((p) => getComputedStyle(p).opacity !== '0').map((p) => p.getBoundingClientRect());
    const x0 = Math.min(...boxes.map((b) => b.left)), x1 = Math.max(...boxes.map((b) => b.right));
    const y0 = Math.min(...boxes.map((b) => b.top)), y1 = Math.max(...boxes.map((b) => b.bottom));
    return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  });

for (const colorway of COLORWAYS) {
  test(`a chevron points four ways and plays its act the way it points in ${colorway}`, async ({ page }) => {
    await open(page, '/icons/guide', colorway);
    const turns = page.getByTestId('chevron-turns');
    await turns.scrollIntoViewIfNeeded();
    const glyphs = turns.locator('svg.mu-icon');
    await expect(glyphs).toHaveCount(4);
    const [down, left, up, right] = await Promise.all([0, 1, 2, 3].map((i) => ink(glyphs.nth(i))));
    // down and up are wide and short; left and right are tall and narrow
    for (const g of [down, up]) expect(g.w).toBeGreaterThan(g.h * 1.5);
    for (const g of [left, right]) expect(g.h).toBeGreaterThan(g.w * 1.5);

    // The act thrusts toward the point: the left-pointing chevron moves left, not down.
    const leftKey = turns.locator('.mu-icon-trigger').nth(1);
    const svg = glyphs.nth(1);
    const rest = await ink(svg);
    await leftKey.hover();
    await expect(svg).toHaveAttribute('data-playing', '');
    await svg.evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = 300; }));
    const thrust = await ink(svg);
    expect(rest.cx - thrust.cx).toBeGreaterThan(1); // travelled left
    expect(Math.abs(thrust.cy - rest.cy)).toBeLessThan(0.5);
    await svg.evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => a.finish()));
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await page.locator('#turn').screenshot({ path: capture(`icon-turn-${colorway}`) });
  });
}

test('a disclosure chevron morphs to its turn: a half turn turns over, a quarter turn carries', async ({ page }) => {
  await open(page, '/icons/guide', 'bone');
  const disclose = page.getByTestId('chevron-disclose');
  await disclose.scrollIntoViewIfNeeded();
  const glyph = disclose.locator('svg');
  const closed = await ink(glyph);
  // Sample its height every frame through the change: mid-way it is edge-on, flatter than either end.
  await disclose.evaluate((btn) => {
    const svg = btn.querySelector('svg')!;
    const seen: number[] = ((window as unknown as { heights: number[] }).heights = []);
    const t0 = performance.now();
    const tick = () => {
      const b = [...svg.querySelectorAll('path')].map((p) => p.getBoundingClientRect());
      seen.push(Math.max(...b.map((r) => r.bottom)) - Math.min(...b.map((r) => r.top)));
      if (performance.now() - t0 < 700) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await disclose.click();
  await expect(disclose).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(800);
  const heights = await page.evaluate(() => (window as unknown as { heights: number[] }).heights);
  expect(Math.min(...heights)).toBeLessThan(closed.h * 0.6);
  const open_ = await ink(glyph);
  expect(Math.abs(open_.h - closed.h)).toBeLessThan(0.5);
  expect(Math.abs(open_.w - closed.w)).toBeLessThan(0.5);

  const expand = page.getByTestId('chevron-expand');
  const collapsed = await ink(expand.locator('svg'));
  expect(collapsed.h).toBeGreaterThan(collapsed.w * 1.5); // pointing right
  await expand.click();
  await page.waitForTimeout(600);
  const expanded = await ink(expand.locator('svg'));
  expect(expanded.w).toBeGreaterThan(expanded.h * 1.5); // pointing down
});

test('under reduced motion a turned chevron changes in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons/guide', 'bone');
  const expand = page.getByTestId('chevron-expand');
  await expand.scrollIntoViewIfNeeded();
  // Sample the glyph's aspect every frame through the change: never an in-between turn.
  await expand.evaluate((btn) => {
    const svg = btn.querySelector('svg')!;
    const seen: number[] = ((window as unknown as { aspects: number[] }).aspects = []);
    const t0 = performance.now();
    const tick = () => {
      const b = [...svg.querySelectorAll('path')].map((p) => p.getBoundingClientRect());
      const w = Math.max(...b.map((r) => r.right)) - Math.min(...b.map((r) => r.left));
      const h = Math.max(...b.map((r) => r.bottom)) - Math.min(...b.map((r) => r.top));
      seen.push(w / h);
      if (performance.now() - t0 < 700) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await expand.click();
  await page.waitForTimeout(800);
  const aspects = await page.evaluate(() => (window as unknown as { aspects: number[] }).aspects);
  expect(aspects.length).toBeGreaterThan(5);
  for (const a of aspects) expect(a > 1.5 || a < 1 / 1.5, `in-between aspect ${a}`).toBe(true);
  expect(aspects[aspects.length - 1]).toBeGreaterThan(1.5); // pointing down
});
