import { expect, test } from '@playwright/test';
import { COLORWAYS } from './helpers';

const pages = ['menu', 'status', 'command-palette', 'toolbar', 'snap-guides', 'lasso'] as const;

test.use({ viewport: { width: 375, height: 812 } });

for (const colorway of COLORWAYS) {
  for (const name of pages) {
    test(`${name} fits a phone in ${colorway}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('metalui:colorway', value), colorway);
      await page.goto(`/components/${name}`);
      await page.locator('main h1').waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})));
      });
      if (['menu', 'status', 'command-palette', 'toolbar'].includes(name)) {
        const captures = page.locator('main img[alt^="SwiftUI"]');
        expect(await captures.count(), `${name} has a native specimen`).toBeGreaterThan(0);
        for (const image of await captures.all()) {
          const bounds = await image.boundingBox();
          expect(bounds, await image.getAttribute('alt') ?? name).not.toBeNull();
          expect(bounds!.width).toBeGreaterThan(0);
          expect(bounds!.height).toBeGreaterThan(0);
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
          const nativeWidth = await image.evaluate(element => (element as HTMLImageElement).naturalWidth);
          expect(bounds!.width, 'native capture never exceeds its point size').toBeLessThanOrEqual(nativeWidth / 2 + 1);
        }
      }

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(innerWidth).toBe(375);
      expect(scrollWidth, `${name} in ${colorway} scrolls sideways`).toBeLessThanOrEqual(innerWidth);
    });
  }
}
