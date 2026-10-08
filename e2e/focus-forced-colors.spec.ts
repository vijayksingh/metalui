import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

// Focus is an outline (docs/CSS_HABITS.md). A key that shows focus as a fill still carries a ring: transparent
// in the colorway, so the designed fill is all you see, and painted by forced colors, which drops fills and
// shadows. Without it, a keyboard user in Windows High Contrast loses track of focus on these controls.
const ring = (el: Locator) => el.evaluate((node) => {
  const s = getComputedStyle(node);
  return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), color: s.outlineColor };
});

const strip = async (page: import('@playwright/test').Page) => {
  const key = page.getByRole('button', { name: 'Summarise' });
  await key.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(key).toBeFocused();
  return key;
};

const panelLink = async (page: import('@playwright/test').Page) => {
  const trigger = page.locator('.mu-navigation-key').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const link = page.locator('.mu-navigation-link').first();
  await expect(link).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  return link;
};

const slices = [
  { name: 'a strip key', path: '/components/button', focus: strip },
  { name: 'a navigation panel link', path: '/components/navigation-menu', focus: panelLink },
];

for (const colorway of COLORWAYS) for (const slice of slices) {
  test(`${slice.name} keeps its ring unseen in ${colorway}`, async ({ page }) => {
    await open(page, slice.path, colorway);
    const el = await slice.focus(page);
    const r = await ring(el);
    expect(r.style).toBe('solid');
    expect(r.width).toBeGreaterThan(0);
    expect(r.color).toBe('rgba(0, 0, 0, 0)');
  });

  test(`${slice.name} paints its ring under forced colors in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, slice.path, colorway);
    const el = await slice.focus(page);
    const r = await ring(el);
    expect(r.style).toBe('solid');
    expect(r.width).toBeGreaterThan(0);
    expect(r.color).not.toBe('rgba(0, 0, 0, 0)');
  });
}
