import { expect, test } from '@playwright/test';
import { open } from './helpers';

// Text inputs never make iOS zoom (docs/CSS_HABITS.md). Safari zooms the page into any text entry smaller
// than 16px when it takes focus, and leaves the page zoomed. On a touch phone every entry the docs render
// must compute at least 16px; on a desktop the designed size stays. A form's hidden mirror (tabindex -1) never
// takes focus, and DialKit's tuning panel is the docs' own tool.
const pages = ['/components/field', '/components/combobox', '/components/number-field', '/components/textarea', '/components/calendar', '/components/numeric-cue', '/components/link-cue', '/components/rename-editor', '/components/drop-zone', '/components/command-palette'];
const ENTRY = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]):not([type=hidden]):not([type=button]):not([type=submit]), textarea, [contenteditable=""], [contenteditable=true], [contenteditable=plaintext-only]';

test.describe('on a touch phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  for (const path of pages) {
    test(`every text entry on ${path} is at least 16px`, async ({ page }) => {
      await open(page, path, 'bone');
      const small = await page.locator('main').locator(ENTRY).evaluateAll((els) => els
        .filter((el) => (el as HTMLElement).offsetParent !== null && !el.closest('[class*="styles-module"]') && el.getAttribute('tabindex') !== '-1')
        .map((el) => ({ size: parseFloat(getComputedStyle(el).fontSize), what: `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(' ')[0]} ${el.getAttribute('aria-label') ?? ''}` }))
        .filter((e) => e.size < 16));
      expect(small).toEqual([]);
    });
  }
});

test('with a mouse, a field keeps its designed size', async ({ page }) => {
  await open(page, '/components/field', 'bone');
  const size = await page.locator('main .mu-field-input').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeLessThan(16);
});
