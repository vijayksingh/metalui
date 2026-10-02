import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
const input = (page: import('@playwright/test').Page) => page.getByRole('spinbutton', { name: 'Meeting day', exact: true });
const source = (page: import('@playwright/test').Page) => page.getByRole('textbox', { name: 'Date source document' });
async function press(page: import('@playwright/test').Page, y = 0) {
  const box = await page.locator('[data-testid="date-document"] .mu-numeric-cue-face').boundingBox(); if (!box) throw new Error('No date face');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  if (y) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + y, { steps: 3 });
}
test.beforeEach(async ({ page }) => { await page.goto('/components/date-cue'); await input(page).waitFor(); });
test('civil day and week detents retain relative words, meaningful ARIA and one source undo', async ({ page }) => {
  await input(page).focus(); await input(page).press('9');
  await expect(input(page)).not.toHaveAttribute('readonly');
  await input(page).press('ArrowUp');
  await expect(source(page)).toHaveValue('meet next Monday after lunch');
  await expect(input(page)).toHaveAttribute('aria-valuetext', /Monday, 9 March 2026/);
  await input(page).press('Shift+ArrowUp');
  await expect(page.getByTestId('date-events')).toContainText('day 2026-03-16');
  await expect(source(page)).toHaveValue('meet 2026-03-16 after lunch');
  await page.getByRole('button', { name: 'Undo date' }).click();
  await expect(source(page)).toHaveValue('meet next Monday after lunch');
});
test('moving cancels hold before scrub; live resolved chip, one undo, fixed footprint', async ({ page }) => {
  const width = (await input(page).boundingBox())!.width;
  await press(page, -12);
  await expect(page.locator('[data-testid="date-document"] .mu-cue[data-kind="date"]')).toHaveAttribute('data-reveal', 'true');
  await expect(page.getByTestId('date-events')).not.toContainText('day 2026-03-08');
  await page.mouse.up();
  await expect(page.getByTestId('date-events')).toContainText('begin 1 · commit 1');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await input(page).boundingBox())!.width).toBe(width);
  await page.getByRole('button', { name: 'Undo date' }).click();
  await expect(source(page)).toHaveValue('meet tomorrow after lunch');
  await expect(page.getByRole('button', { name: 'Undo date' })).toBeDisabled();
});
test('hold opens Calendar without transaction, acceptance closes and focuses actual input', async ({ page }) => {
  await press(page); await expect(page.getByRole('dialog')).toBeVisible(); await page.mouse.up();
  await expect(page.getByTestId('date-events')).toContainText('begin 0 · commit 0');
  await expect(page.getByRole('button', { name: 'Undo date' })).toBeDisabled();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Monday, 9 March 2026/ }).click();
  await expect(source(page)).toHaveValue('meet next Monday after lunch');
  await expect(page.getByTestId('date-events')).toContainText('begin 1 · commit 1');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(input(page)).toBeFocused();
});
test('regular press never opens Calendar, keyboard opens and Escape restores focus without history', async ({ page }) => {
  await press(page); await page.mouse.up(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await input(page).focus(); await input(page).press('Alt+ArrowDown');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Sunday, 8 March 2026', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(input(page)).toBeFocused();
  await expect(page.getByTestId('date-events')).toContainText('begin 0 · commit 0');
  await input(page).press('Enter'); await expect(page.getByRole('dialog')).toBeVisible();
});
test('Escape cancels source and date, stale controlled date cannot be restored', async ({ page }) => {
  await press(page, -12); await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(source(page)).toHaveValue('meet tomorrow after lunch');
  await expect(page.getByTestId('date-events')).toContainText('commit 0 · cancel 1 · day 2026-03-08');
  await press(page, -12); await page.getByRole('button', { name: 'External date' }).dispatchEvent('click');
  await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(source(page)).toHaveValue('meet today after lunch');
  await expect(page.getByTestId('date-events')).toContainText('day 2026-03-07');
});
test('inactive and stopped dates never write or open', async ({ page }) => {
  const readonly = page.getByRole('spinbutton', { name: 'Read only date', exact: true });
  await readonly.focus(); await readonly.press('ArrowUp'); await readonly.press('Alt+ArrowDown');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('spinbutton', { name: 'Disabled date', exact: true })).toBeDisabled();
  const bounded = page.getByRole('spinbutton', { name: 'Bounded date', exact: true });
  await bounded.focus(); await bounded.press('ArrowUp');
  await expect(bounded).toHaveAttribute('aria-valuetext', /Sunday, 8 March 2026/);
  await page.getByRole('button', { name: 'Toggle date disabled' }).click();
  await expect(input(page)).toBeDisabled(); await expect(page.getByTestId('date-events')).toContainText('begin 0 · commit 0');
});
test('UTF16 caret after emoji follows one date edit and restores on undo', async ({ page }) => {
  await source(page).fill('🧠 meet tomorrow after lunch');
  await source(page).evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(26, 26)); await source(page).press('ArrowLeft');
  await press(page, -4); await page.mouse.up();
  const changed = await source(page).inputValue();
  expect(await source(page).evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(25 + changed.length - '🧠 meet tomorrow after lunch'.length);
  await page.getByRole('button', { name: 'Undo date' }).click();
  await expect(source(page)).toHaveValue('🧠 meet tomorrow after lunch');
  expect(await source(page).evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(25);
});
for (const colourway of ['bone', 'graphite'] as const) test(`${colourway} popup inherits live scope and reduced motion, input anchor remains aligned`, async ({ page }) => {
  await page.getByRole('radio', { name: colourway === 'bone' ? 'Bone' : 'Graphite', exact: true }).click();
  await page.getByTestId('date-document').evaluate((element, colourway) => { element.setAttribute('data-mu-colorway', colourway); element.setAttribute('data-mu-motion', 'reduce'); }, colourway);
  await input(page).focus(); await input(page).press('Alt+ArrowDown');
  const dialog = page.getByRole('dialog'); await expect(dialog.locator('..')).toHaveAttribute('data-mu-colorway', colourway);
  await expect(dialog.locator('..')).toHaveAttribute('data-mu-motion', 'reduce');
  await expect(dialog).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-testid="date-document"] .mu-date-cue')).toHaveAttribute('data-reduced', 'true');
  expect(Math.abs((await dialog.boundingBox())!.x - (await input(page).boundingBox())!.x)).toBeLessThan(2);
  await fs.mkdir('docs/captures/web', { recursive: true }); await page.screenshot({ path: `docs/captures/web/date-cue-${colourway}.png` });
  await page.getByTestId('date-document').evaluate(element => element.setAttribute('data-mu-colorway', 'bone')); await expect(dialog.locator('..')).toHaveAttribute('data-mu-colorway', 'bone');
});
test('America/New_York DST boundary is a civil day, not a shifted instant', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'America/New_York' }); const page = await context.newPage();
  await page.goto('/components/date-cue'); await input(page).focus(); await input(page).press('ArrowDown');
  await expect(page.getByTestId('date-events')).toContainText('day 2026-03-07');
  await input(page).press('ArrowUp'); await expect(page.getByTestId('date-events')).toContainText('day 2026-03-08');
  await input(page).press('ArrowUp'); await expect(page.getByTestId('date-events')).toContainText('day 2026-03-09'); await context.close();
});
