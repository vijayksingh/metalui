import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Task inbox block: search filters and the count follows; ticking a task settles it into Done;
// selecting raises the tool strip with a count; bulk actions say so with an Undo that really undoes;
// delete asks first; the keyboard does everything; empty views say why; reduced motion changes at
// once; at 375 px nothing scrolls sideways.
const block = (page: Page) => page.getByRole('region', { name: 'Inbox' }).first();
const grid = (page: Page) => block(page).getByRole('grid', { name: 'Tasks' });
const rows = (page: Page) => grid(page).getByRole('row');
const row = (page: Page, title: string) => rows(page).filter({ hasText: title });
const strip = (page: Page) => block(page).getByRole('toolbar');
const toast = (page: Page) => page.locator('.mu-toast').first();

for (const colorway of COLORWAYS) {
  test(`search filters, the count follows, and a ticked task settles into Done, in ${colorway}`, async ({ page }) => {
    await open(page, '/blocks/task-inbox', colorway);
    const b = block(page);
    await expect(rows(page)).toHaveCount(8);
    await expect(b.locator('header')).toContainText('8');
    await expect(row(page, 'Review the onboarding copy')).toContainText('2 days late');
    await expect(row(page, 'Fix the cropped invoice PDF')).toContainText('Today');
    await expect(row(page, 'Draft the Q4 roadmap notes')).toContainText('Tomorrow');
    await expect(row(page, 'Swap the hero photo on pricing')).toContainText('Fri');
    await expect(row(page, 'Plan the team offsite')).toContainText('Oct 14');
    await page.setViewportSize({ width: 1280, height: 1400 });
    await b.screenshot({ path: capture(`block-task-inbox-${colorway}`) });

    // Typing filters as you go; the count follows and is said once typing pauses.
    const search = b.getByRole('searchbox', { name: 'Search tasks' });
    await search.fill('docs');
    await expect(rows(page)).toHaveCount(2);
    await expect(b.locator('header')).toContainText('2');
    await expect(b.getByRole('status').last()).toHaveText('2 tasks matching “docs”');
    await search.fill('');
    await expect(rows(page)).toHaveCount(8);

    // Tick a task: its box is checked at once, it stays a beat, then settles out of All into Done.
    const fix = row(page, 'Fix the cropped invoice PDF');
    await fix.getByRole('button', { name: 'Complete Fix the cropped invoice PDF' }).click();
    await expect(fix.getByRole('button', { name: /^Complete/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(toast(page)).toContainText('Completed');
    await page.waitForTimeout(300);
    await expect(fix).toHaveCount(1);
    await b.screenshot({ path: capture(`block-task-inbox-ticked-${colorway}`) });
    await expect(fix).toHaveCount(0, { timeout: 3000 });
    await expect(rows(page)).toHaveCount(7);
    await b.getByRole('radio', { name: 'Done' }).click();
    await expect(row(page, 'Fix the cropped invoice PDF')).toHaveCount(1);
    await expect(rows(page)).toHaveCount(3);
  });

  test(`selecting raises the strip; bulk complete and Undo put everything back, in ${colorway}`, async ({ page }) => {
    await open(page, '/blocks/task-inbox', colorway);
    const b = block(page);
    await expect(strip(page)).toHaveCount(0);
    await row(page, 'Review the onboarding copy').getByRole('checkbox', { name: /^Select/ }).click();
    await expect(strip(page)).toBeVisible();
    await expect(strip(page)).toContainText('1 selected');
    // ⌘-click adds a row; ⇧-click picks the range down to it.
    await row(page, 'Draft the Q4 roadmap notes').getByText('Draft the Q4 roadmap notes').click({ modifiers: ['ControlOrMeta'] });
    await row(page, 'Swap the hero photo on pricing').getByText('Swap the hero photo on pricing').click({ modifiers: ['Shift'] });
    await expect(strip(page)).toContainText('3 selected');
    await expect(rows(page).and(page.locator('[aria-selected="true"]'))).toHaveCount(3);
    await expect(b.getByRole('status').last()).toHaveText('3 tasks selected');
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.waitForTimeout(1000);
    await b.screenshot({ path: capture(`block-task-inbox-selected-${colorway}`) });

    await strip(page).getByRole('button', { name: 'Complete' }).click();
    await expect(toast(page)).toContainText('Completed 3 tasks');
    await expect(strip(page)).toHaveCount(0, { timeout: 3000 });
    await expect(rows(page)).toHaveCount(5, { timeout: 3000 });

    await toast(page).getByRole('button', { name: /Undo/ }).click();
    await expect(rows(page)).toHaveCount(8);
    for (const t of ['Review the onboarding copy', 'Draft the Q4 roadmap notes', 'Swap the hero photo on pricing']) {
      await expect(row(page, t).getByRole('button', { name: /^Complete/ })).toHaveAttribute('aria-pressed', 'false');
    }
  });
}

test('assign and snooze act on every selected task; Snooze moves them out of Due soon', async ({ page }) => {
  await open(page, '/blocks/task-inbox', 'bone');
  const b = block(page);
  await b.getByRole('radio', { name: 'Due soon' }).click();
  await expect(rows(page)).toHaveCount(5);
  await row(page, 'Fix the cropped invoice PDF').getByRole('checkbox', { name: /^Select/ }).click();
  await row(page, 'Swap the hero photo on pricing').getByRole('checkbox', { name: /^Select/ }).click();

  await strip(page).getByRole('button', { name: 'Assign' }).click();
  await page.getByRole('menuitem', { name: 'Lena Fischer' }).click();
  await expect(toast(page)).toContainText('Assigned 2 tasks');
  await expect(row(page, 'Fix the cropped invoice PDF').getByRole('img', { name: 'Lena Fischer' })).toBeVisible();
  await expect(strip(page)).toContainText('2 selected');

  await strip(page).getByRole('button', { name: 'Snooze' }).click();
  await page.getByRole('menuitem', { name: 'Next week' }).click();
  await expect(toast(page)).toContainText('Snoozed 2 tasks');
  await expect(rows(page)).toHaveCount(3, { timeout: 3000 });
  await b.getByRole('radio', { name: 'All' }).click();
  await expect(row(page, 'Fix the cropped invoice PDF')).toContainText('Mon');
});

test('delete asks first; Cancel keeps the tasks, Delete removes them, Undo brings them back', async ({ page }) => {
  await open(page, '/blocks/task-inbox', 'bone');
  await row(page, 'Plan the team offsite').getByRole('checkbox', { name: /^Select/ }).click();
  await row(page, 'Audit colour contrast in graphite').getByRole('checkbox', { name: /^Select/ }).click();
  await strip(page).getByRole('button', { name: 'Delete' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Delete 2 tasks?');
  await page.waitForTimeout(600);
  await page.screenshot({ path: capture('block-task-inbox-delete-bone') });
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(rows(page)).toHaveCount(8);

  await strip(page).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(rows(page)).toHaveCount(6);
  await expect(row(page, 'Plan the team offsite')).toHaveCount(0);
  await expect(toast(page)).toContainText('Deleted 2 tasks');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(rows(page)).toHaveCount(8);
  await expect(row(page, 'Plan the team offsite')).toHaveCount(1);
});

test('the keyboard moves, selects, completes, opens and clears', async ({ page }) => {
  await open(page, '/blocks/task-inbox', 'bone');
  const b = block(page);
  const search = b.getByRole('searchbox', { name: 'Search tasks' });
  await search.focus();
  await page.keyboard.press('ArrowDown');
  const task = (title: string) => row(page, title).getByRole('gridcell').nth(2);
  await expect(task('Review the onboarding copy')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(task('Reply to the Lisbon venue')).toBeFocused();

  // x selects; ⇧↓ extends; ⎋ clears.
  await page.keyboard.press('x');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(strip(page)).toContainText('2 selected');
  await page.keyboard.press('Escape');
  await expect(strip(page)).toHaveCount(0, { timeout: 3000 });
  await expect(task('Fix the cropped invoice PDF')).toBeFocused();

  // ↩ opens (a rail marks the row); e completes and focus moves on when the row leaves.
  await page.keyboard.press('Enter');
  await expect(row(page, 'Fix the cropped invoice PDF')).toHaveAttribute('data-opened', '');
  await page.keyboard.press('e');
  await expect(row(page, 'Fix the cropped invoice PDF')).toHaveCount(0, { timeout: 3000 });
  await expect(task('Draft the Q4 roadmap notes')).toBeFocused();

  // ← reaches the row's boxes; Space on the selection box selects.
  await page.keyboard.press('ArrowLeft');
  await expect(row(page, 'Draft the Q4 roadmap notes').getByRole('button', { name: /^Complete/ })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(strip(page)).toContainText('1 selected');

  // Tab leaves the list in one step (one stop per list), and / goes to the search.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  await expect(strip(page).getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('/');
  await expect(search).toBeFocused();
});

test('empty views say why; finishing everything is Inbox zero', async ({ page }) => {
  await open(page, '/blocks/task-inbox', 'bone');
  const b = block(page);
  await b.getByRole('searchbox', { name: 'Search tasks' }).fill('zebra');
  await expect(b).toContainText('No tasks match “zebra”');
  await b.getByRole('button', { name: 'Clear search' }).last().click();
  await expect(rows(page)).toHaveCount(8);

  // Select every task and complete them: the view empties into Inbox zero.
  await rows(page).first().getByRole('gridcell').nth(2).focus();
  await page.keyboard.press('ControlOrMeta+a');
  await expect(strip(page)).toContainText('8 selected');
  await page.keyboard.press('e');
  await expect(b.getByText('Inbox zero')).toBeVisible({ timeout: 4000 });
  await page.waitForTimeout(700);
  await b.screenshot({ path: capture('block-task-inbox-zero-bone') });
  await b.getByRole('radio', { name: 'Due soon' }).click();
  await expect(b).toContainText('Nothing due soon');
});

test('with reduced motion, rows go and the strip comes at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/blocks/task-inbox', 'bone');
  await row(page, 'Plan the team offsite').getByRole('checkbox', { name: /^Select/ }).click();
  expect(await strip(page).evaluate((el) => el.parentElement!.getAnimations().length)).toBe(0);
  await strip(page).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(row(page, 'Plan the team offsite')).toHaveCount(0);
  expect(await grid(page).evaluate((el) => [...el.querySelectorAll('[role=row]')].flatMap((r) => r.getAnimations()).length)).toBe(0);
  await expect(strip(page)).toHaveCount(0);
});

for (const colorway of COLORWAYS) {
  test(`at 375 px nothing scrolls sideways, in ${colorway}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 1400 });
    await open(page, '/blocks/task-inbox', colorway);
    const b = block(page);
    await row(page, 'Review the onboarding copy').getByRole('checkbox', { name: /^Select/ }).click();
    await row(page, 'Reply to the Lisbon venue').getByRole('checkbox', { name: /^Select/ }).click();
    await expect(strip(page)).toContainText('2 selected');
    await page.waitForTimeout(1000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const box = (await strip(page).boundingBox())!;
    const inside = (await b.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(inside.x);
    expect(box.x + box.width).toBeLessThanOrEqual(inside.x + inside.width);
    await b.scrollIntoViewIfNeeded();
    await b.screenshot({ path: capture(`block-task-inbox-375-${colorway}`) });
  });
}
