import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Share panel block: files upload with progress (a failed one tries again), people are invited with a
// permission and removed, the link is copied, the keyboard reaches everything, ⎋ closes, and the
// layout follows the block's own width.
const block = (page: Page) => page.getByRole('region', { name: 'Share “Lisbon trip”' });
const LINK = 'https://metalui.dev/s/lisbon-trip-4k7q';
const file = (name: string, kb: number, mimeType = 'application/pdf') => ({ name, mimeType, buffer: Buffer.alloc(kb * 1000) });

for (const colorway of COLORWAYS) {
  test(`files upload and people are invited, in ${colorway}`, async ({ page }) => {
    await open(page, '/blocks/share-panel', colorway);
    const b = block(page);
    await expect(b).toContainText('3 people');

    // Two files land and upload: each shows a progress bar, then its size.
    await b.getByLabel('Drop files here').setInputFiles([file('Receipt.png', 420, 'image/png'), file('Tram map.pdf', 1800)]);
    const receipt = b.getByRole('group', { name: 'Receipt.png' });
    await expect(receipt.getByRole('progressbar')).toBeVisible();
    await expect(receipt).toContainText('Uploading');
    await expect(receipt).toContainText('420 KB', { timeout: 8000 });
    await expect(receipt.getByRole('progressbar')).toHaveCount(0);
    await expect(b.getByRole('group', { name: 'Tram map.pdf' })).toContainText('1.8 MB', { timeout: 8000 });
    await expect(b).toContainText('4 files');
    await expect(b.getByRole('status').filter({ hasText: /^Uploaded / })).toHaveText(/^Uploaded /);

    // The failed upload says why, and Try again takes it to done.
    const hotel = b.getByRole('group', { name: 'Hotel booking.pdf' });
    await expect(hotel).toContainText('Connection lost');
    await hotel.getByRole('button', { name: 'Try again' }).click();
    await expect(hotel.getByRole('progressbar')).toBeVisible();
    await expect(hotel).toContainText('3.1 MB', { timeout: 8000 });

    // A file over 25 MB is refused, in words.
    await b.getByLabel('Drop files here').setInputFiles([file('Drone footage.mov', 26_000, 'video/quicktime')]);
    await expect(b).toContainText('Drone footage.mov is over 25 MB');
    await expect(b.getByRole('group', { name: 'Drone footage.mov' })).toHaveCount(0);

    // Invite someone who can edit: a row with their name, email and chosen permission.
    await b.getByRole('textbox', { name: 'Email to invite' }).fill('lena.fischer@example.com');
    await b.getByRole('combobox', { name: 'Permission for the invite' }).click();
    await page.getByRole('option', { name: 'Can edit' }).click();
    await b.getByRole('button', { name: 'Invite' }).click();
    const people = b.getByRole('list', { name: 'People with access to Lisbon trip' });
    const lena = people.getByRole('listitem').filter({ hasText: 'Lena Fischer' });
    await expect(lena).toContainText('lena.fischer@example.com');
    await expect(lena.getByRole('combobox', { name: 'Permission for Lena Fischer' })).toHaveText(/Can edit/);
    await expect(b.getByRole('status').filter({ hasText: 'Invited lena.fischer@example.com, can edit' })).toHaveText('Invited lena.fischer@example.com, can edit');
    await expect(b).toContainText('4 people');
    await expect(b.getByRole('textbox', { name: 'Email to invite' })).toHaveValue('');

    // The owner can't be removed; someone else's permission changes and is said.
    await expect(people.getByRole('listitem').filter({ hasText: 'Marta Silva' }).getByRole('button')).toHaveCount(0);
    await people.getByRole('combobox', { name: 'Permission for Ana Rocha' }).click();
    await page.getByRole('option', { name: 'Can edit' }).click();
    await expect(b.getByRole('status').filter({ hasText: 'Ana Rocha can edit now' })).toHaveText('Ana Rocha can edit now');

    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.waitForTimeout(600);
    await b.screenshot({ path: capture(`block-share-panel-${colorway}`) });
  });
}

test('an invite that is not an email, or already in, is refused in words', async ({ page }) => {
  await open(page, '/blocks/share-panel', 'bone');
  const b = block(page);
  const email = b.getByRole('textbox', { name: 'Email to invite' });
  await email.fill('lena');
  await email.press('Enter');
  await expect(b).toContainText('Enter an email address');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(b.getByRole('list', { name: /People with access/ }).getByRole('listitem')).toHaveCount(3);
  await email.fill('ana@example.com');
  await email.press('Enter');
  await expect(b).toContainText('ana@example.com already has access');
  await email.fill('ana@');
  await expect(b).not.toContainText('already has access');
});

test('copy link says Copied, the clipboard holds the link, and it turns back', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '/blocks/share-panel', 'bone');
  const b = block(page);
  const anyone = b.getByRole('switch', { name: 'Anyone with the link' });
  await expect(anyone).not.toBeChecked();
  await expect(b).toContainText('Only people invited can open it');
  await b.getByText('Anyone with the link', { exact: true }).click();
  await expect(anyone).toBeChecked();
  await expect(b).toContainText('Anyone who has it can view');

  await b.getByRole('button', { name: 'Copy link' }).click();
  await expect(b.getByRole('button', { name: 'Copied' })).toBeVisible();
  await expect(b.getByRole('status').filter({ hasText: 'Link copied' })).toHaveText('Link copied');
  await page.waitForTimeout(500);
  await b.getByRole('region', { name: 'Link' }).screenshot({ path: capture('block-share-panel-copied-bone') });
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LINK);
  await expect(b.getByRole('button', { name: 'Copy link' })).toBeVisible({ timeout: 4000 });
});

test('the keyboard invites, removes, closes and reopens', async ({ page }) => {
  await open(page, '/blocks/share-panel', 'bone');
  const b = block(page);
  const email = b.getByRole('textbox', { name: 'Email to invite' });
  await email.focus();
  await page.keyboard.type('lena@example.com');
  await page.keyboard.press('Enter');
  await expect(b.getByRole('status').filter({ hasText: 'Invited lena@example.com, can view' })).toHaveText('Invited lena@example.com, can view');
  await expect(email).toBeFocused();

  // Tab from the email reaches the permission and Invite; the Select opens and chooses from the keyboard.
  await page.keyboard.press('Tab');
  await expect(b.getByRole('combobox', { name: 'Permission for the invite' })).toBeFocused();
  // ⎋ in the Select's open list closes the list, not the panel.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(b).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(b.getByRole('button', { name: 'Invite' })).toBeFocused();

  // Removing Ana moves focus to the next ×, never to the page.
  const people = b.getByRole('list', { name: /People with access/ });
  await b.getByRole('button', { name: 'Remove Ana Rocha' }).focus();
  await page.keyboard.press('Enter');
  await expect(people.getByRole('listitem').filter({ hasText: 'Ana Rocha' })).toHaveCount(0);
  await expect(b.getByRole('button', { name: 'Remove Lena' })).toBeFocused();
  await expect(b.getByRole('status').filter({ hasText: 'Removed Ana Rocha' })).toHaveText('Removed Ana Rocha');

  // ⎋ closes; focus returns to the key that opens it; it reopens with focus on its title.
  await page.keyboard.press('Escape');
  await expect(b).toHaveCount(0);
  const share = page.getByRole('button', { name: 'Share Lisbon trip' }).first();
  await expect(share).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(block(page).getByRole('heading', { name: 'Share “Lisbon trip”' })).toBeFocused();
});

test('a removed person leaves on a spring; with reduced motion, at once', async ({ page }) => {
  await open(page, '/blocks/share-panel', 'bone');
  const b = block(page);
  const people = b.getByRole('list', { name: /People with access/ });
  await b.getByRole('button', { name: 'Remove João Pereira' }).click();
  const joao = people.getByRole('listitem').filter({ hasText: 'João Pereira' });
  expect(await joao.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
  await expect(joao).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await b.getByRole('button', { name: 'Remove Ana Rocha' }).click();
  expect(await people.getByRole('listitem').count()).toBe(1);
  await b.getByRole('textbox', { name: 'Email to invite' }).fill('lena@example.com');
  await b.getByRole('button', { name: 'Invite' }).click();
  const lena = people.getByRole('listitem').filter({ hasText: 'Lena' });
  expect(await lena.evaluate((el) => el.getAnimations().length)).toBe(0);
});

for (const colorway of COLORWAYS) {
  test(`at 375 px the invite row wraps, in ${colorway}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 1600 });
    await open(page, '/blocks/share-panel', colorway);
    const b = block(page);
    const top = async (name: string, role: 'textbox' | 'combobox') => (await b.getByRole(role, { name }).boundingBox())!.y;
    expect(await top('Permission for the invite', 'combobox')).toBeGreaterThan(await top('Email to invite', 'textbox') + 20);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // A large file uploading, for the capture.
    await b.getByLabel('Drop files here').setInputFiles([file('Photos, day one.zip', 21_000, 'application/zip')]);
    await expect(b.getByRole('group', { name: 'Photos, day one.zip' }).getByRole('progressbar')).toBeVisible();
    await page.waitForTimeout(900);
    await b.scrollIntoViewIfNeeded();
    await b.screenshot({ path: capture(`block-share-panel-375-${colorway}`) });
  });
}
