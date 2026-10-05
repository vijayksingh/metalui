import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const captures = 'docs/captures/review/navigation';
const documentedPaths = [...readFileSync('apps/docs/src/app/routes.tsx', 'utf8').matchAll(/path: '([^']+)'/g)]
  .map(match => match[1]).filter(path => path !== '/' && path !== '*').map(path => `/${path}`).sort();
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

test('every documentation route remains reachable through visible links and the component gallery', async ({ page }) => {
  await page.goto('/foundations');
  const nav = page.getByRole('complementary', { name: 'Documentation', exact: true });
  await expect(nav.getByRole('link', { name: 'Materials', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Sound', exact: true })).toBeVisible();
  await expect(nav.locator('details')).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Components', exact: true })).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Button', exact: true })).toHaveCount(0);
  const links = nav.locator('.grp a');
  const reachablePaths = await links.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLAnchorElement).href).pathname));
  await expect(nav.getByRole('link', { name: 'Cue family', exact: true })).toBeVisible();
  await nav.getByRole('link', { name: 'Materials', exact: true }).click();
  await expect(page).toHaveURL(/\/foundations\/materials$/);
  await expect(nav.getByRole('link', { name: 'Materials', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Principles', exact: true })).not.toHaveAttribute('aria-current');
  await nav.getByRole('link', { name: 'Components', exact: true }).click();
  await expect(page).toHaveURL(/\/components$/);
  await expect(page.locator('.library-card h3 a')).toHaveCount(51);
  const galleryPaths = await page.locator('.library-card h3 a').evaluateAll(nodes => nodes.map(node => new URL((node as HTMLAnchorElement).href).pathname));
  expect([...new Set([...reachablePaths, ...galleryPaths])].sort()).toEqual(documentedPaths);
  await expect(nav.getByRole('link', { name: 'Sound', exact: true })).toBeVisible();
  await nav.getByRole('link', { name: 'Sound', exact: true }).click();
  await expect(page).toHaveURL(/\/foundations\/sound$/);
});

test('Components opens the gallery with the keyboard and stays consistent on mobile in both colorways', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/foundations/materials');
  const nav = page.getByRole('complementary', { name: 'Documentation', exact: true });
  const components = nav.getByRole('link', { name: 'Components', exact: true });
  await components.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/components$/);
  await expect(components).toHaveAttribute('aria-current', 'page');
  const buttonGuide = page.locator('[data-component="button"] h3 a');
  await buttonGuide.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/components\/button$/);
  await expect(components).toHaveAttribute('aria-current', 'location');
  await expect(nav.getByRole('link', { name: 'Button', exact: true })).toHaveCount(0);
  for (const colorway of ['Bone', 'Graphite']) {
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.screenshot({ path: `${captures}/desktop-${colorway.toLowerCase()}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  for (const colorway of ['Bone', 'Graphite']) {
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.screenshot({ path: `${captures}/mobile-${colorway.toLowerCase()}.png` });
  }
  await components.click();
  await expect(page).toHaveURL(/\/components$/);
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await nav.getByRole('link', { name: 'Sound', exact: true }).click();
  await expect(page).toHaveURL(/\/foundations\/sound$/);
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
