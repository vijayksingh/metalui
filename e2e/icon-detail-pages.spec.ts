import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { ICON_NAMES } from '../packages/metalui/src/icons/catalog.generated';
import { LIFE_ICON_NAMES } from '../packages/metalui/src/icons/life/catalog.generated';

const captures = 'docs/captures/review/icon-pages';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

test('every glyph has a detail link; search and breadcrumbs preserve browsing context', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/icons');
  await expect(page.locator('.icon-entry')).toHaveCount(ICON_NAMES.length + LIFE_ICON_NAMES.length);
  const paths = await page.locator('.icon-entry').evaluateAll(nodes => nodes.map(node => new URL((node as HTMLAnchorElement).href).pathname));
  expect(paths.sort()).toEqual([...ICON_NAMES.map(name => `/icons/${name}`), ...LIFE_ICON_NAMES.map(name => `/icons/life/${name}`)].sort());
  await page.getByRole('button', { name: 'Product icons', exact: true }).click();
  await expect(page.locator('.icon-entry')).toHaveCount(ICON_NAMES.length);
  await page.getByRole('button', { name: 'All icons', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search icons' }).fill('not-a-real-glyph');
  await expect(page.getByRole('heading', { name: 'No icons found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.locator('.icon-entry')).toHaveCount(ICON_NAMES.length + LIFE_ICON_NAMES.length);
  await page.getByRole('textbox', { name: 'Search icons' }).fill('brekkie');
  await expect(page.locator('.icon-entry')).toHaveCount(1);
  await page.locator('.icon-entry').click();
  await expect(page.getByRole('heading', { name: 'Breakfast', exact: true, level: 1 })).toBeVisible();
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.locator('li')).toHaveText(['MetalUI', 'Icons', 'Life icons', 'Breakfast']);
  await expect(page.getByRole('complementary', { name: 'Documentation' }).getByRole('link', { name: 'Icons', exact: true })).toHaveAttribute('aria-current', 'location');
  await page.getByRole('button', { name: 'Copy name', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('breakfast');
  await page.getByRole('button', { name: 'Copy SVG', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<svg');
  for (const download of await page.getByRole('link', { name: /^Download/ }).all()) {
    const response = await page.request.get((await download.getAttribute('href'))!);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('<svg');
  }
  await crumbs.getByRole('link', { name: 'Icons', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search icons' })).toHaveValue('brekkie');
  await page.goto('/icons/check');
  await expect(page.getByRole('heading', { name: 'Check', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]')).toHaveText('Check');
  await expect(page.getByRole('link', { name: 'Animated SVG', exact: true })).toHaveAttribute('href', '/icons/svg-animated/check.svg');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Check', exact: true, level: 1 })).toBeVisible();
  await page.goto('/icons/not-a-real-icon');
  await expect(page.getByRole('heading', { name: 'Empty pocket.', exact: true })).toBeVisible();
  await expect(page.locator('main svg')).toHaveCount(0);
  await page.goto('/icons/life/not-a-real-icon');
  await expect(page.getByRole('heading', { name: 'Empty pocket.', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('detail motion, mobile layout, and both colorways work with reduced motion', async ({ page }) => {
  await page.goto('/icons/life/breakfast');
  const specimen = page.getByRole('img', { name: 'Breakfast motion preview', exact: true });
  await specimen.focus();
  await expect(specimen.locator('.w')).not.toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/icons', '/icons/check', '/icons/life/breakfast']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const colorway of ['Bone', 'Graphite']) {
      await page.getByRole('radio', { name: colorway, exact: true }).click();
      await page.screenshot({ path: `${captures}/${path.split('/').at(-1)}-${colorway.toLowerCase()}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${captures}/${path.split('/').at(-1)}-mobile.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  await page.getByRole('img', { name: 'Breakfast motion preview', exact: true }).hover();
  expect(await page.locator('.icon-detail-specimen').evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.goto('/icons/life');
  await page.getByRole('textbox', { name: 'Search icons' }).fill('brekkie');
  await expect(page.locator('.icon-entry')).toHaveCount(1);
  await page.locator('.icon-entry').click();
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Life icons', exact: true }).click();
  await expect(page).toHaveURL(/\/icons\/life\?q=brekkie$/);
});
