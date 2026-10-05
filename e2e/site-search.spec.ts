import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const captures = 'docs/captures/review/site-search';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));
const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

test('the masthead search finds pages and glyphs and goes to them', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/foundations/color');
  await page.getByRole('button', { name: /Search the system/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Empty: the sections to jump to.
  await expect(dialog.getByRole('option', { name: 'Icons' })).toBeVisible();
  await dialog.getByRole('combobox').fill('toggle');
  await expect(dialog.getByRole('option').first()).toContainText('Toggle');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/components/toggle');
  await expect(dialog).toBeHidden();

  // ⌘K anywhere; a glyph is found by its synonym.
  await page.keyboard.press(`${mod}+k`);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox').fill('brekkie');
  await expect(dialog.getByRole('option', { name: /Breakfast/ })).toBeVisible();
  for (const colorway of ['Graphite', 'Bone']) {
    await page.keyboard.press('Escape');
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.keyboard.press(`${mod}+k`);
    await dialog.getByRole('combobox').fill('brekkie');
    await expect(dialog.getByRole('option', { name: /Breakfast/ })).toBeVisible();
    await page.screenshot({ path: `${captures}/brekkie-${colorway.toLowerCase()}.png` });
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/icons/life/breakfast');

  await page.keyboard.press(`${mod}+k`);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL('/icons/life/breakfast');
  expect(errors).toEqual([]);
});

test('the Command Palette page keeps ⌘K for its own demo', async ({ page }) => {
  await page.goto('/components/command-palette');
  await expect(page.getByRole('heading', { name: 'Command palette', level: 1 })).toBeVisible();
  await page.keyboard.press(`${mod}+k`);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('dialog')).not.toContainText('PAGES');
  await expect(page.getByRole('dialog')).toContainText('open tasks');
});
