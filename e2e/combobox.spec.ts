import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Combobox: typing filters the rows (by contains) at once while the plate's height settles to the new count;
// arrows and Enter choose; the clear mark takes a choice away; nothing found shows one quiet row.
const CITIES = ['Amsterdam', 'Athens', 'Barcelona', 'Berlin', 'Bologna', 'Bordeaux', 'Bruges', 'Budapest', 'Copenhagen', 'Dublin', 'Edinburgh', 'Florence', 'Geneva', 'Lisbon', 'Ljubljana', 'London', 'Lyon', 'Madrid', 'Marseille', 'Milan', 'Munich', 'Naples', 'Oslo', 'Paris', 'Porto', 'Prague', 'Rome', 'Seville', 'Stockholm', 'Valencia', 'Vienna', 'Zurich'];
const matching = (q: string) => CITIES.filter((c) => c.toLowerCase().includes(q)).length;
const field = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: 'City', exact: true });
const plateHeight = (page: import('@playwright/test').Page) => page.evaluate(() => document.querySelector('.mu-combobox-fit')?.getBoundingClientRect().height ?? -1);

for (const colorway of COLORWAYS) {
  test(`filters, chooses by keys, and clears in ${colorway}`, async ({ page }) => {
    await open(page, '/components/combobox', colorway);
    const input = field(page);
    await input.click();
    await input.pressSequentially('b');
    const list = page.getByRole('listbox');
    await expect(list.getByRole('option')).toHaveCount(matching('b'));
    await input.pressSequentially('o');
    await expect(list.getByRole('option')).toHaveCount(matching('bo')); // Bologna, Bordeaux, Lisbon
    await page.waitForTimeout(500);
    await page.screenshot({ path: capture(`combobox-${colorway}`), clip: { ...(await input.boundingBox())!, y: (await input.boundingBox())!.y - 16, x: (await input.boundingBox())!.x - 16, width: 252, height: 160 } });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Bordeaux');
    await expect(page.getByText('trip to Bordeaux')).toBeVisible();

    const clear = page.getByRole('button', { name: 'Clear' }).first();
    await expect(clear.locator('svg')).toHaveClass(/mu-ic-close/);
    await input.press('Escape');
    await page.screenshot({ path: capture(`combobox-clear-${colorway}`), clip: { ...(await input.boundingBox())!, y: (await input.boundingBox())!.y - 16, x: (await input.boundingBox())!.x - 16, width: 252, height: 80 } });

    // A chosen value can be taken away with the clear mark.
    await page.getByRole('button', { name: 'Clear' }).first().click();
    await expect(input).toHaveValue('');
    await expect(page.getByText('32 cities')).toBeVisible();

    await input.pressSequentially('xq');
    await expect(page.locator('.mu-combobox-empty')).toHaveText('No matches');
  });
}

test('the plate settles to the new count instead of snapping', async ({ page }) => {
  await open(page, '/components/combobox', 'bone');
  const input = field(page);
  await input.click();
  await input.pressSequentially('b');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(matching('b'));
  await page.waitForTimeout(600);
  const tall = await plateHeight(page);
  const heights = await page.evaluate(async () => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label=City]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, 'bo');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => { out.push(document.querySelector('.mu-combobox-fit')!.getBoundingClientRect().height); if (performance.now() - t0 < 600) requestAnimationFrame(frame); else done(); };
      requestAnimationFrame(frame);
    });
    return out;
  });
  const short = heights.at(-1)!;
  expect(short).toBeLessThan(tall - 30);
  expect(heights.some((h) => h < tall - 2 && h > short + 2)).toBe(true);
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(short - 0.5);
});

test('the form field\'s sizes and states', async ({ page }) => {
  await open(page, '/components/combobox', 'bone');
  const well = (name: string) => page.getByRole('combobox', { name, exact: true }).locator('xpath=ancestor::*[contains(@class,"mu-combobox")][1]');
  expect((await well('City').boundingBox())!.height).toBe(32);
  expect((await well('Compact city').boundingBox())!.height).toBe(28);
  await expect(page.getByRole('combobox', { name: 'Invalid city' })).toHaveAttribute('aria-invalid', 'true');
  expect(await well('Invalid city').evaluate((el) => getComputedStyle(el, '::before').boxShadow)).toContain('inset');
  await expect(page.getByRole('combobox', { name: 'Disabled city' })).toBeDisabled();
});

test('the shared clear key remains usable and static with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/combobox', 'graphite');
  const input = field(page);
  await input.fill('Paris');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('Paris');
  const clear = page.getByRole('button', { name: 'Clear' }).first();
  await expect(clear.locator('svg')).toHaveClass(/mu-ic-close/);
  await clear.hover();
  const rest = await clear.locator('svg').innerHTML();
  await page.waitForTimeout(160);
  expect(await clear.locator('svg').innerHTML()).toBe(rest);
  await page.screenshot({ path: capture('combobox-clear-reduced'), clip: { ...(await input.boundingBox())!, y: (await input.boundingBox())!.y - 16, x: (await input.boundingBox())!.x - 16, width: 252, height: 80 } });
  await clear.focus();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('');
});
