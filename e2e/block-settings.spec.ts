import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Settings block: edits in any section raise a save bar that counts them; a bad email is refused on
// blur and on save (focus goes to it); Save waits in its key, says Saved and the bar leaves; Discard
// restores; digests off holds the frequency; the colorway switch paints the block; ⌘S saves; reduced
// motion changes everything at once; at 375 px the nav is a Select and nothing scrolls sideways.
const block = (page: Page) => page.getByRole('region', { name: 'Settings', exact: true }).first();
const bar = (page: Page) => block(page).getByRole('region', { name: 'Unsaved changes' });
const section = async (page: Page, name: string) => {
  const nav = block(page).getByRole('tablist', { name: 'Settings sections' });
  if (await nav.isVisible()) await nav.getByRole('tab', { name }).click();
  else {
    await block(page).getByRole('combobox', { name: 'Settings section' }).click();
    await page.getByRole('option', { name }).click();
  }
};

for (const colorway of COLORWAYS) {
  test(`edits across sections are counted, saved, and the bar leaves, in ${colorway}`, async ({ page }) => {
    await open(page, '/blocks/settings', colorway);
    const b = block(page);
    await expect(b).toHaveAttribute('data-mu-colorway', colorway);
    await expect(bar(page)).toHaveCount(0);

    // One edit: the bar rises and counts it.
    const name = b.getByRole('textbox', { name: 'Name' });
    await name.fill('Marta S. Silva');
    await expect(bar(page)).toBeVisible();
    await expect(bar(page)).toContainText('1 change');

    // A bio edit shows its count; then Notifications, and the edits persist across sections.
    const bio = b.getByRole('textbox', { name: 'Bio' });
    await bio.fill('Designs the booking flow.');
    await expect(b).toContainText('25/160');
    await section(page, 'Notifications');
    await b.getByRole('switch', { name: 'Weekly summary' }).click();
    await expect(bar(page)).toContainText('3 changes');
    await section(page, 'Profile');
    await expect(b.getByRole('textbox', { name: 'Name' })).toHaveValue('Marta S. Silva');
    // Each section holding edits says so; one without doesn't.
    const nav = b.getByRole('tablist', { name: 'Settings sections' });
    await expect(nav.getByRole('tab', { name: 'Notifications' })).toHaveAccessibleDescription('Has unsaved changes');
    await expect(nav.getByRole('tab', { name: 'Appearance' })).not.toHaveAccessibleDescription('Has unsaved changes');

    // Undoing an edit by hand counts down.
    await b.getByRole('textbox', { name: 'Name' }).fill('Marta Silva');
    await expect(bar(page)).toContainText('2 changes');
    await b.getByRole('textbox', { name: 'Name' }).fill('Marta S. Silva');

    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.waitForTimeout(700);
    await b.screenshot({ path: capture(`block-settings-${colorway}`) });

    // Save: the key waits, then says Saved; the bar leaves and focus goes to the section's title.
    await bar(page).getByRole('button', { name: 'Save' }).click();
    await expect(bar(page).getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true');
    await expect(bar(page).getByRole('button', { name: 'Saved' })).toBeVisible();
    await expect(b.getByRole('status').filter({ hasText: 'Saved 3 changes' })).toHaveText('Saved 3 changes');
    await expect(bar(page)).toHaveCount(0, { timeout: 4000 });
    await expect(b.getByRole('heading', { name: 'Profile' })).toBeFocused();
    await expect(b.getByRole('textbox', { name: 'Name' })).toHaveValue('Marta S. Silva');
  });
}

test('a bad email is refused on blur and on save, with focus on it', async ({ page }) => {
  await open(page, '/blocks/settings', 'bone');
  const b = block(page);
  const email = b.getByRole('textbox', { name: 'Email' });
  await email.fill('marta@');
  await expect(b).not.toContainText('Enter an email address');
  await email.blur();
  await expect(b).toContainText('Enter an email address, like marta@example.com.');
  await expect(email).toHaveAttribute('aria-invalid', 'true');

  // An empty name, then Save from another section: Profile comes back, focus on the first field not accepted.
  await b.getByRole('textbox', { name: 'Name' }).fill('');
  await section(page, 'Appearance');
  await bar(page).getByRole('button', { name: 'Save' }).click();
  await expect(b.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(b.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await expect(b).toContainText('Enter your name.');
  await expect(b.getByRole('status').filter({ hasText: 'Not saved. Enter your name.' })).toHaveText('Not saved. Enter your name.');
  await page.waitForTimeout(500);
  await b.screenshot({ path: capture('block-settings-invalid-bone') });

  // Fixing both lets it save.
  await b.getByRole('textbox', { name: 'Name' }).fill('Marta Silva');
  await expect(b.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-invalid', 'true');
  await email.fill('marta@lisbonstudio.pt');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await expect(b).not.toContainText('Enter an email address');
  await bar(page).getByRole('button', { name: 'Save' }).click();
  await expect(b.getByRole('status').filter({ hasText: 'Saved 1 change' })).toHaveText('Saved 1 change');
});

test('discard restores every value and the bar leaves', async ({ page }) => {
  await open(page, '/blocks/settings', 'bone');
  const b = block(page);
  await b.getByRole('textbox', { name: 'Email' }).fill('someone');
  await b.getByRole('textbox', { name: 'Email' }).blur();
  await section(page, 'Notifications');
  await b.getByRole('switch', { name: 'Mentions' }).click();
  await expect(bar(page)).toContainText('2 changes');
  await bar(page).getByRole('button', { name: 'Discard' }).click();
  await expect(bar(page)).toHaveCount(0, { timeout: 4000 });
  await expect(b.getByRole('status').filter({ hasText: 'Discarded 2 changes' })).toHaveText('Discarded 2 changes');
  await expect(b.getByRole('switch', { name: 'Mentions' })).toBeChecked();
  await section(page, 'Profile');
  await expect(b.getByRole('textbox', { name: 'Email' })).toHaveValue('marta@lisbonstudio.com');
  await expect(b).not.toContainText('Enter an email address');
});

test('digests off holds the frequency; photos change', async ({ page }) => {
  await open(page, '/blocks/settings', 'bone');
  const b = block(page);
  await b.getByLabel('Profile photo').setInputFiles({ name: 'marta.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
  await expect(bar(page)).toContainText('1 change');
  await expect(b.getByRole('img', { name: /Marta Silva/ })).toHaveCount(1);

  await section(page, 'Notifications');
  const frequency = b.getByRole('radiogroup', { name: 'Digest frequency' });
  await expect(frequency.getByRole('radio', { name: 'Once a day' })).toBeChecked();
  await expect(frequency.getByRole('radio', { name: 'Twice a week' })).toBeEnabled();
  // The row's words toggle it too.
  await b.getByText('Email digests', { exact: true }).click();
  await expect(b.getByRole('switch', { name: 'Email digests' })).not.toBeChecked();
  await expect(frequency.getByRole('radio', { name: 'Twice a week' })).toBeDisabled();
  await expect(b).toContainText('Turn on email digests to choose.');
  await page.waitForTimeout(500);
  await b.screenshot({ path: capture('block-settings-notifications-bone') });
  await b.getByRole('switch', { name: 'Email digests' }).click();
  await frequency.getByRole('radio', { name: 'Twice a week' }).click();
  await expect(frequency.getByRole('radio', { name: 'Twice a week' })).toBeChecked();
  await expect(bar(page)).toContainText('2 changes');
});

test('the colorway, density and motion switches change the block itself', async ({ page }) => {
  await open(page, '/blocks/settings', 'bone');
  const b = block(page);
  const surface = () => b.evaluate((el) => getComputedStyle(el).getPropertyValue('--mu-s').trim());
  const bone = await surface();
  await section(page, 'Appearance');
  await b.getByRole('radio', { name: 'Graphite' }).click();
  await expect(b).toHaveAttribute('data-mu-colorway', 'graphite');
  expect(await surface()).not.toBe(bone);
  // Only the block: the page keeps its own colorway.
  expect(await page.evaluate(() => document.documentElement.dataset.muColorway)).toBe('bone');

  const row = async () => (await b.getByRole('radio', { name: 'Comfortable' }).boundingBox())!.y;
  await b.getByRole('radio', { name: 'Compact' }).click();
  await expect(b).toHaveAttribute('data-density', 'compact');
  await b.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect(b).toHaveAttribute('data-mu-motion', 'reduce');
  await expect(bar(page)).toContainText('3 changes');
  await page.waitForTimeout(900);
  await b.screenshot({ path: capture('block-settings-appearance-graphite') });
  expect(await row()).toBeGreaterThan(0);

  // With the block's own reduce motion on, a new section comes in with no animation.
  await section(page, 'Profile');
  expect(await b.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.constructor.name === 'Animation').length)).toBe(0);
});

test('the keyboard reaches everything and ⌘S saves', async ({ page }) => {
  await open(page, '/blocks/settings', 'bone');
  const b = block(page);
  const nav = b.getByRole('tablist', { name: 'Settings sections' });
  await nav.getByRole('tab', { name: 'Profile' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(nav.getByRole('tab', { name: 'Notifications' })).toBeFocused();
  await expect(b.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(nav.getByRole('tab', { name: 'Appearance' })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Tab');
  await expect(b.getByRole('tabpanel')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(b.getByRole('switch', { name: 'Email digests' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(b.getByRole('switch', { name: 'Email digests' })).not.toBeChecked();
  await expect(bar(page)).toContainText('1 change');

  // Tab from the last switch reaches the held frequency (it stays findable, marked disabled), then the bar's keys.
  await b.getByRole('switch', { name: 'Weekly summary' }).focus();
  await page.keyboard.press('Tab');
  await expect(b.getByRole('radio', { name: 'Once a day' })).toBeFocused();
  await expect(b.getByRole('radio', { name: 'Once a day' })).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(bar(page).getByRole('button', { name: 'Discard' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(bar(page).getByRole('button', { name: 'Save' })).toBeFocused();

  await b.getByRole('switch', { name: 'Mentions' }).focus();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(b.getByRole('status').filter({ hasText: 'Saved 1 change' })).toHaveText('Saved 1 change');
  await expect(bar(page)).toHaveCount(0, { timeout: 4000 });
});

test('the bar rises on a spring; with reduced motion, at once', async ({ page }) => {
  await open(page, '/blocks/settings', 'bone');
  const b = block(page);
  await b.getByRole('textbox', { name: 'Name' }).fill('Marta S.');
  expect(await bar(page).evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
  await b.getByRole('textbox', { name: 'Name' }).fill('Marta Silva');
  await expect(bar(page)).toHaveCount(0, { timeout: 4000 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await b.getByRole('textbox', { name: 'Name' }).fill('Marta S.');
  expect(await bar(page).evaluate((el) => el.getAnimations().length)).toBe(0);
  await b.getByRole('textbox', { name: 'Name' }).fill('Marta Silva');
  await expect(bar(page)).toHaveCount(0);
});

for (const colorway of COLORWAYS) {
  test(`at 375 px the nav is a Select and nothing scrolls sideways, in ${colorway}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 1100 });
    await open(page, '/blocks/settings', colorway);
    const b = block(page);
    await expect(b.getByRole('tablist', { name: 'Settings sections' })).toBeHidden();
    await section(page, 'Notifications');
    await b.getByRole('switch', { name: 'Mentions' }).click();
    await section(page, 'Profile');
    await b.getByRole('textbox', { name: 'Bio' }).fill('Designs the booking flow. Mostly on Lisbon time.');
    await expect(bar(page)).toContainText('2 changes');
    const box = (await bar(page).boundingBox())!;
    const edge = (await b.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(edge.x + edge.width);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.waitForTimeout(900);
    await b.scrollIntoViewIfNeeded();
    await b.screenshot({ path: capture(`block-settings-375-${colorway}`) });
  });
}
