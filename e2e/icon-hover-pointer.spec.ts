import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

// Icon motion starts on hover only where a fine pointer can hover (docs/CSS_HABITS.md); keyboard focus
// starts it on every device. On a touch screen a tap leaves :hover stuck on, so a tapped glyph must stay at
// rest. Morning is a life glyph whose sun holds a turn while its host is hovered (CSS is its only player);
// the standalone bell SVG is a product act played by its own CSS, with no script to step in.
const MORNING = '/icons/life/morning';
const sun = (page: Page) => page.locator('.icon-detail-specimen .mu-il-morning .sg');
const turn = (part: Locator) => part.evaluate((el) => getComputedStyle(el).transform);
const tile = (page: Page) => page.locator(`.icon-entry[href="${MORNING}"]`);
const playing = (page: Page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);

/** Gives the Morning cell keyboard focus: a real Tab from whatever is focusable just before it. */
async function tabToMorning(page: Page) {
  await tile(page).evaluate((el) => {
    const all = [...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex="0"]')];
    all[all.indexOf(el as HTMLElement) - 1].focus();
  });
  await page.keyboard.press('Tab');
  await expect(tile(page)).toBeFocused();
  expect(await tile(page).evaluate((el) => el.matches(':focus-visible'))).toBe(true);
}

for (const colorway of COLORWAYS) {
  test(`a glyph turns under a mouse and rests when it leaves in ${colorway}`, async ({ page }) => {
    await open(page, MORNING, colorway);
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(true);
    await page.mouse.move(0, 0);
    await expect.poll(() => turn(sun(page))).toBe('none');
    await page.locator('.icon-detail-specimen').hover();
    await expect.poll(() => turn(sun(page))).not.toBe('none');
    await page.mouse.move(0, 0);
    await expect.poll(() => turn(sun(page))).toBe('none');
  });

  test(`a glyph turns on keyboard focus in ${colorway}`, async ({ page }) => {
    await open(page, '/icons/life', colorway);
    await page.mouse.move(0, 0);
    await tabToMorning(page);
    await expect.poll(() => turn(tile(page).locator('.sg'))).not.toBe('none');
  });

  test(`a glyph stays still under a mouse with reduced motion in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, MORNING, colorway);
    await page.locator('.icon-detail-specimen').hover();
    await page.waitForTimeout(700); // longer than the pose spring, so a late turn would show
    expect(await turn(sun(page))).toBe('none');
  });
}

test('a standalone product act plays under a mouse', async ({ page }) => {
  await page.mouse.move(600, 600); // the 24px glyph sits at the document's origin, where the pointer starts
  await page.goto('/icons/svg-animated/bell.svg');
  expect(await playing(page)).toBe(0);
  await page.locator('svg').hover();
  await expect.poll(() => playing(page)).toBeGreaterThan(0);
});

test.describe('on a touch phone', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  for (const colorway of COLORWAYS) {
    test(`a tapped glyph stays at rest in ${colorway}`, async ({ page }) => {
      await open(page, MORNING, colorway);
      expect(await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches)).toBe(true);
      const box = (await page.locator('.icon-detail-specimen').boundingBox())!;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      expect(await page.locator('.icon-detail-specimen').evaluate((el) => el.matches(':hover'))).toBe(true); // the tap's hover sticks
      await page.waitForTimeout(700);
      expect(await turn(sun(page))).toBe('none');
    });

    test(`a glyph still turns on keyboard focus in ${colorway}`, async ({ page }) => {
      await open(page, '/icons/life', colorway);
      await tabToMorning(page);
      await expect.poll(() => turn(tile(page).locator('.sg'))).not.toBe('none');
    });
  }

  test('a tapped standalone product act stays still', async ({ page }) => {
    await page.goto('/icons/svg-animated/bell.svg');
    await page.touchscreen.tap(12, 12);
    expect(await page.locator('svg').evaluate((el) => el.matches(':hover'))).toBe(true);
    await page.waitForTimeout(400);
    expect(await playing(page)).toBe(0);
  });
});
