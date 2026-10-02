import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Avatar: named by the person (and presence); a broken photo leaves the initials; a group counts the
// rest and spreads apart when hovered.
const play = (page: import('@playwright/test').Page) => page.locator('section', { hasText: 'Playground' }).first();

for (const colorway of COLORWAYS) {
  test(`names people, keeps initials, counts the rest, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/avatar', colorway);
    await expect(play(page).getByRole('img', { name: 'Ana Rocha, here' }).first()).toBeVisible();
    await expect(play(page).getByRole('img', { name: 'Chen Wei, away' }).first()).toContainText('CW');
    const dara = play(page).getByRole('img', { name: 'Dara Lin', exact: true }).first();
    await expect(dara).toContainText('DL');
    await expect(dara.locator('img')).toHaveCount(0);
    const group = play(page).getByRole('group', { name: 'Shared with' });
    await expect(group.getByRole('img', { name: '3 more' })).toHaveText('+3');
    await page.waitForTimeout(500);
    await play(page).screenshot({ path: capture(`avatar-${colorway}`) });
  });

  test(`accessible identity is independent from initials in ${colorway}`, async ({ page }) => {
    await open(page, '/components/avatar', colorway);
    const identity = page.locator('#identity');
    const host = identity.getByRole('img', { name: 'Ana Rocha, host, here', exact: true });
    await expect(host).toContainText('AR');
    await expect(identity.getByRole('img', { name: 'A Rocha, here', exact: true })).toHaveCount(0);

    const group = identity.getByRole('group', { name: 'Meeting hosts' });
    const groupHost = group.getByRole('img', { name: 'Ana Rocha, host', exact: true });
    await expect(groupHost).toContainText('AR');
    await expect(groupHost.locator('img')).toHaveCount(0);
    await expect(group.getByRole('img', { name: 'Ben Okafor, co-host', exact: true })).toContainText('BO');

    const decorative = identity.getByTestId('avatar-decorative-example');
    await expect(decorative.getByText('Ben Okafor', { exact: true })).toBeVisible();
    await expect(decorative.getByRole('img')).toHaveCount(0);
    await expect(decorative.locator('[aria-hidden="true"]').first()).toContainText('BO');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(host).toHaveAccessibleName('Ana Rocha, host, here');
    await expect(groupHost).toHaveAccessibleName('Ana Rocha, host');
  });
}

test('the group spreads on hover and settles back', async ({ page }) => {
  await open(page, '/components/avatar', 'bone');
  const group = play(page).getByRole('group', { name: 'Shared with' });
  const last = group.locator(':scope > span').last();
  const rest = (await last.boundingBox())!.x;
  await group.hover();
  await expect.poll(async () => (await last.boundingBox())!.x - rest).toBeGreaterThan(15);
  await page.mouse.move(0, 0);
  await expect.poll(async () => Math.abs((await last.boundingBox())!.x - rest)).toBeLessThan(0.5);
});
