import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const captures = 'docs/captures/review/navigation';
const documentedPaths = [...readFileSync('apps/docs/src/app/routes.tsx', 'utf8').matchAll(/path: '([^']+)'/g)]
  .map(match => match[1]).filter(path => path !== '/' && path !== '*' && !path.includes(':')).map(path => `/${path}`).sort();
const sections = ['Foundations', 'Components', 'Blocks', 'Objects', 'Instruments', 'Places', 'Parts', 'Icons'];
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

test('section links open indexes and every guide stays discoverable', async ({ page }) => {
  await page.goto('/components');
  const nav = page.getByRole('complementary', { name: 'Documentation', exact: true });
  await expect(nav.getByRole('link', { name: 'Components', exact: true })).toBeVisible();
  const reachablePaths = await nav.locator('.grp a').evaluateAll(nodes => nodes.map(node => new URL((node as HTMLAnchorElement).href).pathname));
  await expect(nav.locator('details')).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Switch', exact: true })).toHaveCount(0);
  for (const section of sections) {
    await nav.getByRole('link', { name: section, exact: true }).click();
    await expect(page.getByRole('heading', { name: section === 'Components' ? 'Component library' : section, exact: true, level: 1 })).toBeVisible();
    await expect(nav.getByRole('link', { name: section, exact: true })).toHaveAttribute('aria-current', 'page');
    const links = section === 'Icons' ? page.locator('.library-related a') : page.locator('.section-entry, .library-card h3 a, .place-card-copy');
    await expect(links.first()).toBeVisible();
    reachablePaths.push(...await links.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLAnchorElement).href).pathname)));
    if (section === 'Icons') {
      // The set switcher is the way to Life icons; it moves the address to /icons/life.
      await page.getByRole('radiogroup', { name: 'Icon set' }).getByRole('radio', { name: /^Life/ }).click();
      await expect(page.getByRole('heading', { name: 'Life icons', exact: true, level: 1 })).toBeVisible();
      reachablePaths.push(new URL(page.url()).pathname);
    }
  }
  expect([...new Set(reachablePaths)].sort()).toEqual(documentedPaths);
  await nav.getByRole('link', { name: 'Objects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Objects', exact: true, level: 1 })).toBeVisible();
  await page.screenshot({ path: `${captures}/objects-bone.png` });
  await page.getByRole('textbox', { name: 'Search objects' }).fill('folder');
  await expect(page.locator('.place-card-copy')).toHaveCount(1);
  await page.locator('.place-card-copy').click();
  await expect(page).toHaveURL(/\/components\/folder$/);
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs).toContainText('Objects');
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Folder');
  await crumbs.getByRole('link', { name: 'Objects', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search objects' })).toHaveValue('folder');
});

test('keyboard and mobile navigation share the section hierarchy in both colorways', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blocks');
  const nav = page.getByRole('complementary', { name: 'Documentation', exact: true });
  await nav.getByRole('link', { name: 'Components', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-component="switch"] h3 a')).toBeVisible();
  await page.locator('[data-component="switch"] h3 a').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/components\/switch$/);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]')).toHaveText('Switch');
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
  await nav.getByRole('link', { name: 'Foundations', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.section-entry').filter({ hasText: 'Materials' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
