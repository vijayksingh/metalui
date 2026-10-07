import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

// Hover only where a fine pointer can hover (docs/CSS_HABITS.md). On a touch screen a tap leaves :hover
// stuck on the key it touched, so the hover look must not apply there at all. Each control is rested on
// by the pointer twice: on a desktop with a mouse, and on a touch phone, where it must stay at rest.
const slices: { name: string; path: string; find: (page: Page) => Locator; read: (el: Element) => string }[] = [
  {
    name: 'a compact key brightens its ink',
    path: '/components/button',
    find: (page) => page.getByRole('button', { name: 'seed a sample day' }),
    read: (el) => getComputedStyle(el).color,
  },
  {
    name: 'a select trigger lights its veil',
    path: '/components/select',
    find: (page) => page.locator('.mu-select-trigger').first(),
    read: (el) => getComputedStyle(el, '::after').opacity,
  },
];

const rested = async (page: Page, slice: (typeof slices)[number]) => {
  const control = slice.find(page);
  const look = () => control.evaluate(slice.read);
  await page.mouse.move(0, 0);
  const rest = await look();
  await control.hover();
  return { rest, look };
};

for (const colorway of COLORWAYS) {
  for (const slice of slices) {
    test(`${slice.name} under a mouse in ${colorway}`, async ({ page }) => {
      await open(page, slice.path, colorway);
      expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(true);
      const { rest, look } = await rested(page, slice);
      await expect.poll(look).not.toBe(rest);
    });
  }
}

test.describe('on a touch phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  for (const colorway of COLORWAYS) {
    for (const slice of slices) {
      test(`${slice.name.replace(/ (brightens|lights)/, ' never $1')} in ${colorway}`, async ({ page }) => {
        await open(page, slice.path, colorway);
        expect(await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches)).toBe(true);
        const { rest, look } = await rested(page, slice);
        await page.waitForTimeout(400); // longer than any settle, so a late hover would show
        expect(await look()).toBe(rest);
      });
    }
  }
});
