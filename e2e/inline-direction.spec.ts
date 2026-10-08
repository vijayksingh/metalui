import { expect, test } from '@playwright/test';
import { open } from './helpers';

// Inline sides are logical (docs/CSS_HABITS.md): on a right-to-left page a control mirrors. A field keeps its
// wider padding on the side its text starts from, so in Arabic or Hebrew that side moves to the right.
const pads = (page: import('@playwright/test').Page) => page.locator('.mu-field').first().evaluate((el) => {
  const s = getComputedStyle(el);
  return { left: parseFloat(s.paddingLeft), right: parseFloat(s.paddingRight) };
});

test('a field mirrors its padding on a right-to-left page', async ({ page }) => {
  await open(page, '/components/field', 'bone');
  const ltr = await pads(page);
  expect(ltr.left).toBeGreaterThan(ltr.right);

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  const rtl = await pads(page);
  expect(rtl).toEqual({ left: ltr.right, right: ltr.left });
});
