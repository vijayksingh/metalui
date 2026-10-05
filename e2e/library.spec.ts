import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const captures = 'docs/captures/review/library';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

test('discover by purpose, recover from empty results, and return from a guide', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/components');
  await expect(page.getByRole('heading', { name: 'Component library', exact: true })).toBeVisible();
  await expect(page.locator('.library-card')).toHaveCount(51);
  await expect(page.locator('.library-card-copy p').first()).not.toHaveText('');
  await page.getByRole('button', { name: 'Input & selection', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Actions', exact: false })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search components' }).fill('choose');
  await expect(page.locator('.library-card')).not.toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search components' }).fill('no-such-control');
  await expect(page.getByRole('heading', { name: 'No components found' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('textbox', { name: 'Search components' }).fill('button');
  const sidebarLabels = await page.locator('.side .grp a').allTextContents();
  await page.locator('[data-component="button"] h3 a').click();
  await expect(page).toHaveURL(/\/components\/button$/);
  expect(await page.locator('.side .grp a').allTextContents()).toEqual(sidebarLabels);
  await expect(page.locator('.side .grp a').first()).toHaveAttribute('aria-current', 'location');
  await page.screenshot({ path: `${captures}/guide-bone.png` });
  await page.getByRole('link', { name: 'Back to component library', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search components' })).toHaveValue('button');
  await expect(page.locator('[data-component="button"]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'matching' })).toContainText('button');
  await page.goto('/components/button');
  await page.getByRole('link', { name: 'Back to component library', exact: true }).click();
  await expect(page).toHaveURL(/\/components$/);
  expect(errors).toEqual([]);
});

test('operate a specimen independently of its documentation and close overlays', async ({ page }) => {
  await page.goto('/components');
  const button = page.locator('[data-component="button"]');
  await expect(button.getByRole('button', { name: 'Save changes' })).toHaveCount(0);
  await button.getByRole('button', { name: 'Try Button', exact: true }).click();
  await button.getByRole('button', { name: 'Save changes' }).click();
  await expect(button.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/components$/);
  const menu = page.locator('[data-component="menu"]');
  await menu.getByRole('button', { name: 'Try Menu', exact: true }).click();
  await expect(button.getByRole('button', { name: 'Try Button', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await menu.getByRole('button', { name: 'Actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();
  await expect(menu.getByRole('status')).toHaveText('Sample duplicated');
  await page.getByRole('textbox', { name: 'Search components' }).fill('dialog');
  const dialog = page.locator('[data-component="dialog"]');
  await dialog.getByRole('button', { name: 'Try Dialog', exact: true }).click();
  await dialog.getByRole('button', { name: 'Open dialog', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'A little more space' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search components' }).fill('checkbox');
  const checkbox = page.locator('[data-component="checkbox"]');
  await checkbox.getByRole('button', { name: 'Try Checkbox', exact: true }).click();
  await expect(checkbox.getByRole('checkbox', { name: 'Keep a local copy' })).toBeChecked();
  await checkbox.getByText('Keep a local copy', { exact: true }).click();
  await expect(checkbox.getByRole('checkbox', { name: 'Keep a local copy' })).not.toBeChecked();
});

test('browse both colorways on desktop and mobile with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/components');
  await page.getByRole('radio', { name: 'Bone', exact: true }).click();
  await expect(page.locator('.library-grid').first()).toHaveCSS('grid-template-columns', /\d+.*\d+.*\d+/);
  await page.screenshot({ path: `${captures}/desktop-bone.png` });
  await page.getByRole('radio', { name: 'Graphite', exact: true }).click();
  await page.screenshot({ path: `${captures}/desktop-graphite.png` });
  expect(await page.locator('.library-specimen').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running')) .length)).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${captures}/mobile-graphite.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('radio', { name: 'Bone', exact: true }).click();
  await page.screenshot({ path: `${captures}/mobile-bone.png` });
  await page.getByRole('button', { name: 'Overlays', exact: false }).click();
  await expect(page.locator('[data-component="dialog"]')).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.locator('.side summary').filter({ hasText: 'Foundations' }).click();
  await expect(page.getByRole('link', { name: 'Materials', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const group of ['Input & selection', 'Canvas controls', 'Inline editing']) {
    await page.getByRole('button', { name: group, exact: false }).click();
    await expect(page.getByRole('button', { name: group, exact: false })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.library-filters [aria-pressed="true"]')).toHaveCount(1);
    await page.mouse.move(10, 10);
    await page.screenshot({ path: `${captures}/${group.split(' ')[0].toLowerCase()}-bone.png`, fullPage: true });
  }
});
