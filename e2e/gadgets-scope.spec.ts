import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The scope, an inset gadget drawn from its spec: an ice-glass face sunk in a stone bezel, a beam that
// sweeps while searching (looping), blips lit as the beam crosses them, and its states.
const sample = () => `(() => {
  const s = document.querySelector('[data-testid="scope"]'), beam = s.querySelector('[data-id="beam"]');
  const m = (beam.getAttribute('transform') || '').match(/rotate\\(([-\\d.]+)\\)/);
  return [m ? +m[1] : 0, ...['b1', 'b2', 'b3'].map((b) => +getComputedStyle(s.querySelector('[data-id="' + b + '"]')).opacity)];
})()`;

for (const colorway of COLORWAYS) {
  test(`the scope in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/scope', colorway);
    const states = page.getByTestId('scope-states').locator('svg[data-gadget="scope"]');
    await expect(states).toHaveCount(4);
    const found = states.nth(2);
    // Layers: the glass, the light in it (clipped to it), then its surface, the wall shade and the frame.
    expect(await found.evaluate((e) => [...e.querySelectorAll('[data-layer]')].map((l) => l.getAttribute('data-layer')))).toEqual(['body', 'parts', 'top', 'lamp']);
    await expect(found.locator('[data-layer="body"] [data-part="glass"]')).toHaveCount(1);
    await expect(found.locator('[data-part="bezel.light"]')).toHaveAttribute('clip-path', /url\(#/);
    await expect(found.locator('[data-layer="top"] [data-part="bezel"]')).toHaveCount(1);
    await expect(found.locator('[data-layer="top"] [data-part="bezel.shade"]')).toHaveCount(1);
    // Found lights its blips; rest leaves them dark.
    expect(await found.evaluate((e) => ['b1', 'b2', 'b3'].map((b) => (e.querySelector(`[data-id="${b}"]`) as SVGElement).style.opacity))).toEqual(['1', '1', '1']);
    expect(await states.nth(0).evaluate((e) => (e.querySelector('[data-id="b1"]') as SVGElement).style.opacity)).toBe('0');
    await expect(states.nth(1).locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'breathe');
    await page.getByTestId('scope-states').screenshot({ path: capture(`gadget-scope-${colorway}`) });
  });
}

test('searching sweeps the beam round and round, and each blip lights as the beam reaches it', async ({ page }) => {
  await open(page, '/gadgets/scope', 'bone');
  await page.getByTestId('scope').scrollIntoViewIfNeeded();
  const trace = await page.evaluate(async (read) => {
    const out: number[][] = [], t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push([performance.now() - t0, ...eval(read)]); if (performance.now() - t0 > 3200) { clearInterval(id); done(); } }, 20); });
    return out;
  }, sample());
  const angles = trace.map((r) => r[1]);
  expect(Math.max(...angles)).toBeGreaterThan(300);                           // it goes all the way round
  // It loops: after reaching the end of a turn it starts again from the top.
  expect(angles.some((a, i) => i > 0 && angles[i - 1] > 300 && a < 60)).toBe(true);
  // Each blip is lit while the beam is just past it, and never before its angle in that turn.
  for (const [k, deg] of [[2, 315], [3, 115], [4, 197]] as const) {     // b1 up-left, b2 right-down, b3 down-left
    const lit = trace.filter((r) => r[k] > 0.6);
    expect(lit.length).toBeGreaterThan(0);
    for (const r of lit) expect(((r[1] - deg + 360) % 360)).toBeLessThan(160);   // the beam is within the fade behind it
  }
});

test('found stops the beam where it is and lights the blips; nothing leaves them dark', async ({ page }) => {
  await open(page, '/gadgets/scope', 'graphite');
  const scope = page.getByTestId('scope'), state = page.getByRole('radiogroup', { name: 'State', exact: true });
  await state.getByRole('radio', { name: 'found' }).click();
  await expect(scope).toHaveAttribute('data-state', 'found');
  await expect.poll(async () => (await page.evaluate(sample())).slice(1)).toEqual([1, 1, 1]);
  const a0 = (await page.evaluate(sample()))[0];
  await page.waitForTimeout(400);
  expect((await page.evaluate(sample()))[0]).toBe(a0);                       // stopped
  await state.getByRole('radio', { name: 'nothing' }).click();
  await expect.poll(async () => (await page.evaluate(sample())).slice(1)).toEqual([0, 0, 0]);
  await expect(scope.locator('desc')).toHaveText('Search: nothing');
});

test('the flat tier has no filters, and the server string draws the lit blips', async ({ page }) => {
  await open(page, '/gadgets/scope', 'bone');
  const tiers = page.getByTestId('scope-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  expect(await page.getByTestId('scope-static').locator('[data-id="b1"]').evaluate((e) => (e as SVGElement).style.opacity)).toBe('1');
});
