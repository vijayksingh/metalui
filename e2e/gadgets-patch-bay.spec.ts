import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The gadget renderer, proven by the patch bay: a spec in, a working gadget out. Every state, the act,
// detail by size, the server string, and composing a new gadget by editing its spec.
const plugAt = (g: Locator) => g.locator('[data-id="plugA"] [data-part="plug"]').evaluate((el) => {
  const m = (el.getAttribute('transform') ?? '').match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)/);
  return m ? m.slice(1).map(Number) : [128, 180, 0];
});

for (const colorway of COLORWAYS) {
  test(`every state of the patch bay in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/patch-bay', colorway);
    const states = page.getByTestId('bay-states').locator('svg[data-gadget="patch-bay"]');
    await expect(states).toHaveCount(5);
    expect(await states.evaluateAll((els) => els.map((e) => e.getAttribute('data-state')))).toEqual(['rest', 'connected', 'syncing', 'done', 'failed']);
    expect(await states.evaluateAll((els) => els.map((e) => { const l = e.querySelector('[data-part="lamp"]')!; return `${l.getAttribute('data-lamp')}/${l.getAttribute('data-gesture')}`; })))
      .toEqual(['off/steady', 'live/steady', 'waiting/breathe', 'live/steady', 'failed/blink2']);
    // Every Part the spec names is drawn: a slab, two jacks with their sockets cut, two plugs, the cord, the beeper.
    const one = states.nth(1);
    await expect(one.locator('[data-cut="hole"]')).toHaveCount(3);
    await expect(one.locator('[data-part="jack"]')).toHaveCount(2);
    await expect(one.locator('[data-part="plug"]')).toHaveCount(2);
    await expect(one.locator('[data-accent="true"] [data-part="plug"]')).toHaveCount(1);
    await expect(one.locator('[data-part="cable"]')).toHaveCount(1);
    await expect(one.locator('[data-part="beeper"]')).toHaveCount(1);
    // It speaks its state, and failed carries its hint.
    await expect(states.nth(4).locator('desc')).toHaveText('Sync: failed, check your connection');
    await page.getByTestId('bay-states').screenshot({ path: capture(`gadget-patch-bay-${colorway}`) });
  });
}

test('failed pulls the plug out; done brings it home and lands with a flicker', async ({ page }) => {
  await open(page, '/gadgets/patch-bay', 'bone');
  const bay = page.getByTestId('bay'), state = page.getByRole('radiogroup', { name: 'State', exact: true });
  await state.getByRole('radio', { name: 'failed' }).click();
  await expect(bay).toHaveAttribute('data-state', 'failed');
  await expect.poll(() => plugAt(bay)).toEqual([106, 134, -14]);           // lying aside: x −22, y −46, r −14
  await expect(bay.locator('[data-part="lamp"]')).toHaveAttribute('data-lamp', 'failed');
  // The cord's end went with it.
  expect(await bay.locator('[data-id="cable"] [data-part="cable"] path').first().getAttribute('d')).toMatch(/^M106,134 /);
  await state.getByRole('radio', { name: 'done' }).click();
  await expect(bay.locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'flicker');
  await expect.poll(() => plugAt(bay)).toEqual([128, 180, 0]);
  await expect(bay.locator('desc')).toHaveText('Sync: done');
});

test('an act lifts the plug and seats it again, its cord following', async ({ page }) => {
  await open(page, '/gadgets/patch-bay', 'graphite');
  const bay = page.getByTestId('bay');
  await bay.scrollIntoViewIfNeeded();
  const trace = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="bay"]')!, plug = svg.querySelector('[data-id="plugA"] [data-part="plug"]')!;
    const cord = svg.querySelector('[data-id="cable"] path')!, out: { y: number; cordY: number }[] = [];
    (document.querySelector('[data-testid="bay-act"]') as HTMLButtonElement).click();
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const id = setInterval(() => {
        const m = (plug.getAttribute('transform') ?? '').match(/translate\([-\d.]+ ([-\d.]+)\)/);
        out.push({ y: m ? Number(m[1]) : 180, cordY: Number(cord.getAttribute('d')!.split(' ')[0].split(',')[1]) });
        if (performance.now() - t0 > 1100) { clearInterval(id); done(); }
      }, 10);
    });
    return out;
  });
  expect(Math.min(...trace.map((t) => t.y))).toBeLessThan(170);           // it lifted
  expect(trace[trace.length - 1].y).toBeCloseTo(180, 0);                   // and seated
  expect(trace.every((t) => Math.abs(t.cordY - t.y) < 0.5)).toBe(true);    // the cord's end rode with it
});

test('with reduced motion the state poses snap, and done still lands', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/patch-bay', 'bone');
  const bay = page.getByTestId('bay'), state = page.getByRole('radiogroup', { name: 'State', exact: true });
  await state.getByRole('radio', { name: 'failed' }).click();
  expect(await plugAt(bay)).toEqual([106, 134, -14]);
  await state.getByRole('radio', { name: 'done' }).click();
  expect(await plugAt(bay)).toEqual([128, 180, 0]);
  await expect(bay.locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'flicker');
});

test('detail follows size, the flat tier has no filters, and the server string matches', async ({ page }) => {
  await open(page, '/gadgets/patch-bay', 'bone');
  const tiers = page.getByTestId('bay-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  const still = page.getByTestId('bay-static').locator('svg');
  await expect(still).toHaveAttribute('data-state', 'failed');
  await expect(still).toHaveAttribute('data-tier', 'full');
  await expect(still.locator('[data-part="plug"]')).toHaveCount(2);
  await expect(still.locator('desc')).toHaveText('Sync: failed, check your connection');
});

test('composing: a remix redraws, a broken spec explains itself, a fix draws again', async ({ page }) => {
  await open(page, '/gadgets/patch-bay', 'bone');
  const compose = page.getByTestId('compose'), gadget = page.getByTestId('compose-gadget');
  await compose.getByRole('button', { name: 'Move the lamp' }).click();
  await expect(gadget.locator('[data-part="lamp"]')).toHaveAttribute('cx', '87');
  await expect(gadget.locator('[data-slots]')).toHaveAttribute('data-slots', '3');
  await compose.getByRole('button', { name: 'Touch the other plug' }).click();
  await expect(gadget.locator('[data-accent="true"]')).toHaveAttribute('data-id', 'plugB');
  await compose.screenshot({ path: capture('gadget-compose-bone') });
  // Invent a Part: the validator names it and the fix.
  const box = compose.getByRole('textbox', { name: 'Gadget spec' });
  const text = await box.inputValue();
  await box.fill(text.replace('"part": "beeper"', '"part": "spring"'));
  await expect(compose.locator('[data-result="problems"] li').first()).toBeVisible();
  await expect(gadget).toHaveCount(0);
  await box.fill(text);
  await expect(gadget).toBeVisible();
});
