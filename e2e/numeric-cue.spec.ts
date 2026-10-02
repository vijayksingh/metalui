import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

test.beforeEach(async ({ page }) => { await page.goto('/components/numeric-cue'); await page.getByRole('spinbutton', { name: 'Sleep', exact: true }).waitFor(); });
const sleep = (page: import('@playwright/test').Page) => page.getByRole('spinbutton', { name: 'Sleep', exact: true });
const face = (page: import('@playwright/test').Page) => page.locator('[data-testid="numeric-document"] .mu-numeric-cue-face');
async function drag(page: import('@playwright/test').Page, x: number, y: number) {
  const box = await face(page).boundingBox(); if (!box) throw new Error('missing cue');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + x, box.y + box.height / 2 + y, { steps: 4 });
}

test('vertical scrub writes one source transaction, scale exists only while held, undo restores', async ({ page }) => {
  await expect(page.locator('.mu-numeric-cue-scale')).toHaveCount(0);
  await drag(page, 0, -12);
  await expect(page.locator('.mu-numeric-cue-scale')).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Source document' })).not.toHaveValue('slept 6h');
  await page.mouse.up();
  await expect(page.locator('.mu-numeric-cue-scale')).toHaveCount(0);
  await expect(page.getByTestId('numeric-events')).toContainText('begin 1 · commit 1');
  await page.getByRole('button', { name: 'Undo source' }).click();
  await expect(page.getByRole('textbox', { name: 'Source document' })).toHaveValue('slept 6h');
  await expect(page.getByRole('button', { name: 'Undo source' })).toBeDisabled();
  await page.getByRole('button', { name: 'Redo source' }).click();
  await expect(page.getByRole('textbox', { name: 'Source document' })).not.toHaveValue('slept 6h');
});

test('horizontal scrub converts unit without changing canonical quantity or footprint', async ({ page }) => {
  const before = await sleep(page).boundingBox();
  await drag(page, 30, 0); await page.mouse.up();
  await expect(page.getByTestId('numeric-events')).toContainText('quantity 360 · unit min');
  await expect(page.getByRole('textbox', { name: 'Source document' })).toHaveValue('slept 360min');
  expect((await sleep(page).boundingBox())!.width).toBe(before!.width);
  await sleep(page).focus(); await sleep(page).press('Alt+ArrowLeft');
  await expect(page.getByTestId('numeric-events')).toContainText('quantity 360 · unit h');
});

test('Shift and Alt use host steps, plain Left and Right remain typing caret', async ({ page }) => {
  await sleep(page).focus();
  await sleep(page).press('Shift+ArrowUp');
  await expect(page.getByTestId('numeric-events')).toContainText('quantity 420');
  await sleep(page).press('Alt+ArrowDown');
  await expect(page.getByTestId('numeric-events')).toContainText('quantity 419');
  await sleep(page).fill('12'); await sleep(page).press('ArrowLeft');
  expect(await sleep(page).evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(1);
  await sleep(page).press('ArrowRight');
  expect(await sleep(page).evaluate((element: HTMLInputElement) => element.selectionStart)).toBe(2);
  await sleep(page).press('Enter');
  await expect(page.getByRole('textbox', { name: 'Source document' })).toHaveValue('slept 12h');
});

test('Escape restores value, source, unit and captured selection without a later commit', async ({ page }) => {
  const source = page.getByRole('textbox', { name: 'Source document' });
  await source.focus(); await source.evaluate((element: HTMLTextAreaElement) => { element.setSelectionRange(2, 2); element.dispatchEvent(new Event('select', { bubbles: true })); });
  await drag(page, 0, -16);
  await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(source).toHaveValue('slept 6h');
  await expect(page.getByTestId('numeric-events')).toContainText('commit 0 · cancel 1 · quantity 360');
  await expect(page.getByRole('button', { name: 'Undo source' })).toBeDisabled();
});

test('external source invalidates held capture and Escape cannot overwrite it', async ({ page }) => {
  await sleep(page).focus(); await sleep(page).fill('8');
  await page.getByRole('button', { name: 'External source' }).dispatchEvent('click');
  await sleep(page).press('Escape');
  await expect(page.getByRole('textbox', { name: 'Source document' })).toHaveValue('slept 2h');
  await expect(page.getByTestId('numeric-events')).toContainText('quantity 120');
});

test('read only and disabled fields are silent and retain value', async ({ page }) => {
  const readOnly = page.getByRole('spinbutton', { name: 'Read only amount', exact: true });
  await readOnly.focus(); await readOnly.press('ArrowUp'); await readOnly.press('Alt+ArrowRight');
  await expect(readOnly).toHaveValue('120');
  await expect(page.getByRole('spinbutton', { name: 'Disabled amount', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  await drag(page, 0, -20); await page.mouse.up();
  await expect(page.getByTestId('numeric-events')).toContainText('begin 0 · commit 0 · cancel 0 · quantity 360');
});

test('money factor, duration five-minute and time quarter-hour stops', async ({ page }) => {
  const budget = page.getByRole('spinbutton', { name: 'Budget', exact: true });
  await budget.focus(); await budget.press('Alt+ArrowRight');
  await expect(budget).toHaveAttribute('aria-valuetext', '€44.44, euros, example host factor');
  const duration = page.getByRole('spinbutton', { name: 'Duration', exact: true }); await duration.focus(); await duration.press('ArrowUp');
  await expect(duration).toHaveAttribute('aria-valuetext', '1h35, hours');
  const time = page.getByRole('spinbutton', { name: 'Time', exact: true }); await time.focus(); await time.press('ArrowUp');
  await expect(time).toHaveAttribute('aria-valuetext', '4:15pm, time of day');
});

for (const colourway of ['bone', 'graphite'] as const) test(`${colourway} keeps source footprint, semantic glyph and reduced motion`, async ({ page }) => {
  await page.evaluate(colourway => { document.documentElement.dataset.muColorway = colourway; document.documentElement.setAttribute('data-mu-motion', 'reduce'); }, colourway);
  const width = (await sleep(page).boundingBox())!.width;
  await drag(page, 20, 0); await page.mouse.up();
  expect((await sleep(page).boundingBox())!.width).toBe(width);
  await expect(page.locator('[data-testid="numeric-document"] .mu-numeric-cue')).toHaveAttribute('data-reduced', 'true');
  await expect(page.locator('[data-testid="numeric-document"] .mu-mark-meaning svg')).toHaveCount(1);
  await fs.mkdir('docs/captures/web', { recursive: true });
  await page.getByTestId('numeric-document').screenshot({ path: `docs/captures/web/numeric-cue-${colourway}.png` });
});

for (const caret of [2, 17]) test(`UTF16 source caret ${caret} survives a numeric gesture after emoji`, async ({ page }) => {
  const source = page.getByRole('textbox', { name: 'Source document' });
  await source.fill('🧠 slept 6h. after');
  await source.evaluate((element: HTMLTextAreaElement, caret) => element.setSelectionRange(caret + 1, caret + 1), caret);
  await source.press('ArrowLeft');
  await drag(page, 30, 0); await page.mouse.up();
  await expect(source).toHaveValue('🧠 slept 360min. after');
  const expected = caret > 11 ? caret + 4 : caret;
  expect(await source.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(expected);
  await page.getByRole('button', { name: 'Undo source' }).click();
  await expect(source).toHaveValue('🧠 slept 6h. after');
  expect(await source.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe(caret);
});

test('non-typing time retains words, mutable ARIA and numeric keyboard detents', async ({ page }) => {
  const time = page.getByRole('spinbutton', { name: 'Time', exact: true });
  await time.focus();
  await expect(time).not.toHaveAttribute('readonly');
  await expect(time).toHaveAttribute('aria-describedby', 'time-numeric-hint');
  await expect(time.locator('..')).not.toHaveAttribute('data-typing');
  await time.press('9'); await time.press('ArrowUp');
  await expect(time).toHaveAttribute('aria-valuetext', '4:15pm, time of day');
  await expect(time.locator('..')).not.toHaveAttribute('data-typing');
});
