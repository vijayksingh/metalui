import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The fader bank, a held gadget drawn from its spec: three caps in slots cut from their travel, the
// mix moving the bank together until caps meet their walls, and its states.
const placesOf = (g: Locator) => g.locator('[data-drive]').evaluateAll((els) =>
  els.map((e) => Number((e.getAttribute('transform') ?? '').match(/translate\(0 ([-\d.]+)\)/)?.[1] ?? 0)));

for (const colorway of COLORWAYS) {
  test(`the fader bank in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/fader-bank', colorway);
    const states = page.getByTestId('bank-states').locator('svg[data-gadget="fader-bank"]');
    await expect(states).toHaveCount(3);
    const one = states.nth(1);
    // Three slots cut into the body (one per cap, as long as its travel) and the lamp's hole.
    await expect(one.locator('[data-cut="slot"]')).toHaveCount(3);
    await expect(one.locator('[data-cut="hole"]')).toHaveCount(1);
    await expect(one.locator('[data-part="cap"]')).toHaveCount(3);
    await expect(one.locator('[data-accent="true"]')).toHaveAttribute('data-id', 'cap2');
    // Each cap at its own rest place: 0.3, 0.72 and 0.5 along the slot (92 down to −92).
    const at = await placesOf(one);
    expect(at[0]).toBeCloseTo(36.8, 1); expect(at[1]).toBeCloseTo(-40.48, 1); expect(at[2]).toBeCloseTo(0, 1);
    expect(await states.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lamp"]')!.getAttribute('data-lamp')))).toEqual(['off', 'live', 'live']);
    await page.getByTestId('bank-states').screenshot({ path: capture(`gadget-fader-bank-${colorway}`) });
  });
}

test('the mix moves the bank together until the caps meet the tops', async ({ page }) => {
  await open(page, '/gadgets/fader-bank', 'bone');
  const bank = page.getByTestId('bank');
  await page.getByRole('button', { name: 'All the way up' }).click();
  await expect.poll(async () => (await placesOf(bank)).map((y) => Math.round(y))).toEqual([-55, -92, -92]);
  await page.getByRole('button', { name: 'All the way down' }).click();
  await expect.poll(async () => (await placesOf(bank)).map((y) => Math.round(y))).toEqual([92, 52, 92]);            // cap 2 keeps its lead: 0.72 − 0.5
  await page.getByRole('button', { name: 'Back to rest' }).click();
  await expect.poll(async () => (await placesOf(bank)).map((y) => Math.round(y))).toEqual([37, -40, 0]);
  // The slider is the same value.
  await page.getByRole('slider', { name: 'Mix' }).focus();
  await page.keyboard.press('End');
  await expect.poll(async () => (await placesOf(bank)).map((y) => Math.round(y))).toEqual([-55, -92, -92]);
});

test('changed flickers the lamp and says so', async ({ page }) => {
  await open(page, '/gadgets/fader-bank', 'graphite');
  const bank = page.getByTestId('bank');
  await page.getByRole('radiogroup', { name: 'State', exact: true }).getByRole('radio', { name: 'changed' }).click();
  await expect(bank.locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'flicker');
  await expect(bank.locator('desc')).toHaveText('Settings: changed');
});

test('with reduced motion the caps go straight to their places', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/fader-bank', 'bone');
  const bank = page.getByTestId('bank');
  await page.getByRole('button', { name: 'All the way up' }).click();
  expect((await placesOf(bank)).map((y) => Math.round(y))).toEqual([-55, -92, -92]);
});

test('the server string draws the caps at their rest places, and the flat tier has no filters', async ({ page }) => {
  await open(page, '/gadgets/fader-bank', 'bone');
  expect((await placesOf(page.getByTestId('bank-static').locator('svg'))).map((y) => Math.round(y))).toEqual([37, -40, 0]);
  const tiers = page.getByTestId('bank-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
});
