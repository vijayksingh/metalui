import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The keycap chord, drawn from its spec: two keys in a tray sunk into a ceramic slab, and its act, a
// chord: the keys drop one after another (60 ms apart) and come back exactly.
const drops = () => `(() => {
  const s = document.querySelector('[data-testid="chord"]'), faces = [...s.querySelectorAll('[data-moves]')];
  return faces.map((f) => { const m = (f.getAttribute('transform') || '').match(/translate\\(([-\\d.]+) ([-\\d.]+)\\)/); return m ? +m[2] : null; });
})()`;

for (const colorway of COLORWAYS) {
  test(`the keycap chord in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/keycap-chord', colorway);
    const states = page.getByTestId('chord-states').locator('svg[data-gadget="keycap-chord"]');
    await expect(states).toHaveCount(3);
    const one = states.nth(1);
    await expect(one.locator('[data-cut="tray"]')).toHaveCount(1);
    expect(await one.locator('[data-part="key"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-glyph')))).toEqual(['⌘', 'K']);
    await expect(one.locator('[data-accent="true"]')).toHaveAttribute('data-id', 'k');
    expect(await states.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lamp"]')!.getAttribute('data-lamp')))).toEqual(['off', 'live', 'live']);
    await page.getByTestId('chord-states').screenshot({ path: capture(`gadget-keycap-chord-${colorway}`) });
  });
}

test('the chord: ⌘ drops first, K after, both come back exactly', async ({ page }) => {
  await open(page, '/gadgets/keycap-chord', 'bone');
  await page.getByTestId('chord').scrollIntoViewIfNeeded();
  const trace = await page.evaluate(async (read) => {
    const out: (number | null)[][] = [];
    (document.querySelector('[data-testid="chord-act"]') as HTMLButtonElement).click();
    const t0 = performance.now();
    await new Promise<void>((done) => { const id = setInterval(() => { out.push([performance.now() - t0, ...eval(read)]); if (performance.now() - t0 > 700) { clearInterval(id); done(); } }, 8); });
    return out;
  }, drops());
  const rest = trace[0][1]!, deep = (i: number) => trace.find((r) => (r[i] as number) > rest + 5)?.[0] as number;
  expect(deep(1)).toBeLessThan(deep(2));                                 // ⌘ bottoms out before K
  expect(deep(2) - deep(1)).toBeGreaterThan(30);                         // about 60 ms apart
  const last = trace[trace.length - 1];
  expect(last[1]).toBeCloseTo(rest, 1); expect(last[2]).toBeCloseTo(rest, 1);   // both home exactly
  await expect(page.getByTestId('chord').locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'flicker');
});

test('entering chord plays it; with reduced motion the keys still dip', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/keycap-chord', 'graphite');
  const chord = page.getByTestId('chord');
  await page.getByRole('radiogroup', { name: 'State', exact: true }).getByRole('radio', { name: 'chord' }).click();
  await expect(chord).toHaveAttribute('data-state', 'chord');
  await expect.poll(async () => Math.max(...((await page.evaluate(drops())) as number[]))).toBeGreaterThan(218);
});

test('the flat tier has no filters, and the server string draws both keys', async ({ page }) => {
  await open(page, '/gadgets/keycap-chord', 'bone');
  const tiers = page.getByTestId('chord-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  await expect(page.getByTestId('chord-static').locator('[data-part="key"]')).toHaveCount(2);
});
