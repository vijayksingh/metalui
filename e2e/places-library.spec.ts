import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const captures = 'docs/captures/review/places';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

test('compare all eight places visually, then open a specimen and return to the filtered index', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/places');
  await expect(page.locator('.place-card')).toHaveCount(8);
  await expect(page.locator('.place-preview[inert][aria-hidden="true"]')).toHaveCount(8);
  await expect(page.locator('.place-preview').filter({ hasText: 'No notes yet' })).toHaveCount(1);
  await expect(page.locator('.place-preview').filter({ hasText: 'Lisbon tram map' })).toHaveCount(1);
  await expect(page.locator('.place-preview').filter({ hasText: 'Back to Now' })).toHaveCount(1);
  expect((await page.locator('.place-card-copy p').allTextContents()).every(caption => caption.trim().length > 0)).toBe(true);
  await page.getByRole('textbox', { name: 'Search places' }).fill('divider');
  await expect(page.locator('.place-card')).toHaveCount(1);
  await expect(page.locator('.place-card h2')).toHaveText('Split pane');
  await page.locator('.place-card-copy').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/components\/split-pane$/);
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Split pane');
  await crumbs.getByRole('link', { name: 'Places', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search places' })).toHaveValue('divider');
  await page.getByRole('textbox', { name: 'Search places' }).fill('');
  await expect(page.locator('.place-card')).toHaveCount(8);
  // The preview surface itself opens the guide; its dormant controls never steal the click.
  await page.locator('[data-place="region"]').click({ position: { x: 100, y: 100 } });
  await expect(page).toHaveURL(/\/components\/region$/);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Places', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('all specimens stay still and fit on desktop and mobile in both colorways', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/places');
  await expect(page.locator('.place-card')).toHaveCount(8);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorway of ['Bone', 'Graphite']) {
      await page.getByRole('radio', { name: colorway, exact: true }).click();
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `${captures}/${width}-${colorway.toLowerCase()}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.locator('.place-preview').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running')).length)).toBe(0);
    }
  }
});
