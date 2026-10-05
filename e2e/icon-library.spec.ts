import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { ICON_NAMES } from '../packages/metalui/src/icons/catalog.generated';
import { LIFE_ICON_NAMES } from '../packages/metalui/src/icons/life/catalog.generated';

const captures = 'docs/captures/review/icon-library';
const total = ICON_NAMES.length + LIFE_ICON_NAMES.length;
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

const tile = (page: Page, path: string) => page.locator(`.icon-entry[href="${path}"]`);
const running = (page: Page, path: string) => tile(page, path).evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
const raised = (page: Page, path: string) => tile(page, path).evaluate(node => getComputedStyle(node, '::before').opacity);

test('a glyph plays its act under the pointer and on keyboard focus, and its key rises', async ({ page }) => {
  await page.goto('/icons/life');
  await expect(page.locator('.icon-entry')).toHaveCount(LIFE_ICON_NAMES.length);
  await expect.poll(() => raised(page, '/icons/life/breakfast')).toBe('0');
  await tile(page, '/icons/life/breakfast').hover();
  await expect.poll(() => running(page, '/icons/life/breakfast')).toBeGreaterThan(0);
  await expect.poll(() => raised(page, '/icons/life/breakfast')).toBe('1');
  await page.mouse.move(0, 0);
  await page.getByRole('textbox', { name: 'Search icons' }).focus();
  // Tab from search through the toolbar into the first tray: focus-visible raises it and plays it.
  for (let i = 0; i < 20 && !(await tile(page, '/icons/life/breakfast').evaluate(node => node === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(tile(page, '/icons/life/breakfast')).toBeFocused();
  await expect.poll(() => raised(page, '/icons/life/breakfast')).toBe('1');
  await expect.poll(() => running(page, '/icons/life/breakfast')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Breakfast', level: 1 })).toBeVisible();
});

test('preview size, set and search live in the address and survive a reload', async ({ page }) => {
  await page.goto('/icons');
  await expect(page.getByRole('status')).toHaveText(`${total} icons`);
  const glyph = tile(page, '/icons/check').locator('.icon-entry-specimen > svg');
  await expect(glyph).toHaveAttribute('width', '32');
  await page.getByRole('group', { name: 'Preview size' }).getByRole('button', { name: '48' }).click();
  await expect(page).toHaveURL(/size=48/);
  await expect(glyph).toHaveAttribute('width', '48');
  await page.reload();
  await expect(tile(page, '/icons/check').locator('.icon-entry-specimen > svg')).toHaveAttribute('width', '48');
  await expect(page.getByRole('group', { name: 'Preview size' }).getByRole('button', { name: '48' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('group', { name: 'Preview size' }).getByRole('button', { name: '32' }).click();
  await expect(page).not.toHaveURL(/size=/);
  await page.getByRole('group', { name: 'Icon sets' }).getByRole('button', { name: 'Product icons' }).click();
  await page.getByRole('textbox', { name: 'Search icons' }).fill('brekkie');
  await expect(page.getByRole('status')).toHaveText(`0 of ${total} icons`);
  await expect(page.getByRole('heading', { name: 'No icons found' })).toBeVisible();
  await page.getByRole('button', { name: 'Search all icons' }).click();
  await expect(page.getByRole('status')).toHaveText(`1 of ${total} icons`);
  await expect(page.locator('.icon-entry')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Icon categories' })).toHaveCount(0);
});

test('the category index jumps under the toolbar and lights the tray in view', async ({ page }) => {
  await page.goto('/icons');
  const index = page.getByRole('navigation', { name: 'Icon categories' });
  await expect(index.getByRole('button')).toHaveCount(15);
  await expect(index.locator('[aria-current="true"]')).toHaveText(/^Tools/);
  for (const name of ['Status', 'Weather', 'Feelings & mind', 'Actions']) {
    await index.getByRole('button', { name: new RegExp(`^${name}`) }).click();
    const heading = page.getByRole('heading', { name: new RegExp(`^${name}`), level: 2 });
    await expect(heading).toBeFocused();
    // The heading settles just under the sticky toolbar, whose index now names it.
    await expect.poll(async () => {
      const [top, bottom] = await Promise.all([heading.evaluate(node => node.getBoundingClientRect().top), page.locator('.icon-toolbar').evaluate(node => node.getBoundingClientRect().bottom)]);
      return name === 'Weather' ? top > bottom : top - bottom >= 0 && top - bottom <= 32;
    }, name).toBe(true);
    await expect(index.locator('[aria-current="true"]')).toHaveText(new RegExp(`^${name}`));
    await expect(index.locator('[aria-current="true"]')).toBeInViewport();
  }
  // Scrolling by hand hands the index back to what is in view.
  await page.mouse.move(640, 600);
  await page.mouse.wheel(0, -100_000);
  await expect(index.locator('[aria-current="true"]')).toHaveText(/^Tools/);
});

test('reduced motion, both colorways and a phone keep the grid still and in bounds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/icons');
  await tile(page, '/icons/life/breakfast').hover();
  await expect.poll(() => raised(page, '/icons/life/breakfast')).toBe('1');
  expect(await running(page, '/icons/life/breakfast')).toBe(0);
  await page.mouse.move(0, 0);
  for (const colorway of ['Bone', 'Graphite']) {
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${captures}/top-${colorway.toLowerCase()}.png` });
    await page.getByRole('navigation', { name: 'Icon categories' }).getByRole('button', { name: /^Meals/ }).click();
    await tile(page, '/icons/life/breakfast').hover();
    await page.screenshot({ path: `${captures}/scrolled-${colorway.toLowerCase()}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${captures}/mobile.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('.icon-toolbar')).toHaveCSS('position', 'static');
});
