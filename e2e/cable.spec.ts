import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Cable Part on Parts › Cable: a cord's droop follows its length, its belly swings after a moved
// end, and a loose plug on its cord can be patched into a jack by pointer or keyboard.
for (const colorway of COLORWAYS) {
  test(`a cord hangs by its length in ${colorway}`, async ({ page }) => {
    await open(page, '/components/cable', colorway);
    const droops = page.getByTestId('cable-droops').locator('[data-part="cable"]');
    // One 280-unit cord: taut at 280 apart, hanging at 220, a U at 100.
    const sags = (await droops.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-sag')))));
    expect(sags[0]).toBe(0);
    expect(sags[1]).toBeGreaterThan(50);
    expect(sags[2]).toBeGreaterThan(sags[1]);
    await page.getByTestId('cable-droops').screenshot({ path: capture(`cable-${colorway}`) });
  });
}

test('the flat tier has no filters', async ({ page }) => {
  await open(page, '/components/cable', 'bone');
  const tiers = page.getByTestId('cable-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
});

test('a moved end goes at once and the belly swings after it', async ({ page }) => {
  await open(page, '/components/cable', 'bone');
  const box = page.getByTestId('cable-swing');
  const read = () => box.locator('[data-part="cable"] path').first().getAttribute('d');
  const before = await read();
  await page.getByRole('switch', { name: 'Pull apart' }).click();
  // Sample the belly's handle every frame: it overshoots its goal and settles on it.
  const path = await box.evaluate(async (el) => {
    const p = el.querySelector('[data-part="cable"] path')!, ys: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => { const f = () => { ys.push(Number(p.getAttribute('d')!.split(' ')[1].split(',')[1])); if (performance.now() - t0 < 1400) requestAnimationFrame(f); else done(); }; f(); });
    return { ys, end: p.getAttribute('d')! };
  });
  expect(path.end).not.toBe(before);
  expect(path.end.endsWith('340,170')).toBe(true);          // the end is where it was put
  const goal = path.ys[path.ys.length - 1];
  expect(Math.min(...path.ys)).toBeLessThan(goal - 0.5);      // the belly overshoots, rising past its goal
});

test('patching: pull the loose plug over the free jack and it seats', async ({ page }) => {
  await open(page, '/components/cable', 'graphite');
  const patch = page.getByTestId('cable-patch'), plug = page.getByTestId('cable-loose');
  await expect(patch).not.toHaveAttribute('data-seated', /.+/);
  await patch.scrollIntoViewIfNeeded();
  const jack = await patch.locator('[data-part="jack"]').nth(1).boundingBox(), p = await plug.boundingBox();
  await page.mouse.move(p!.x + p!.width / 2, p!.y + p!.height / 2);
  await page.mouse.down();
  await page.mouse.move(jack!.x + jack!.width / 2, jack!.y + jack!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(patch).toHaveAttribute('data-seated', 'true');
  await expect(patch).toHaveAttribute('data-at', '280,150');
  await expect(patch.locator('[data-lit="link"]')).toHaveCount(2);
});

test('the cord is only so long, and the keyboard can patch too', async ({ page }) => {
  await open(page, '/components/cable', 'bone');
  const patch = page.getByTestId('cable-patch'), plug = page.getByTestId('cable-loose');
  await plug.focus();
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowRight');   // pull far past the cord's length
  const [x, y] = (await patch.getAttribute('data-at'))!.split(',').map(Number);
  expect(Math.hypot(x - 120, y - 150)).toBeLessThanOrEqual(280.5);
  await page.keyboard.press('Enter');
  await expect(patch).not.toHaveAttribute('data-seated', /.+/);          // dropped, not seated
});

test('with reduced motion the cord goes straight to its new shape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/cable', 'bone');
  const box = page.getByTestId('cable-swing');
  await page.getByRole('switch', { name: 'Pull apart' }).click();
  const ys = await box.evaluate(async (el) => {
    const p = el.querySelector('[data-part="cable"] path')!, out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => { const f = () => { out.push(Number(p.getAttribute('d')!.split(' ')[1].split(',')[1])); if (performance.now() - t0 < 400) requestAnimationFrame(f); else done(); }; f(); });
    return out;
  });
  expect(new Set(ys).size).toBe(1);
});
