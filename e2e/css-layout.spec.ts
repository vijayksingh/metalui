import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// One foundation slice: real docs content keeps its reading and keyboard order as the
// containing panel narrows, independently of the viewport, colorway, or motion setting.
const boxes = (container: Locator) => container.evaluate((element) =>
  Array.from(element.children, (child) => {
    const { x, y, width, height } = child.getBoundingClientRect();
    return { x, y, width, height };
  }),
);
const rowCount = async (container: Locator) => new Set((await boxes(container)).map(({ y }) => Math.round(y))).size;
const overflow = (container: Locator) => container.evaluate((element) => element.scrollWidth - element.clientWidth);
const panelWidth = (container: Locator, width: number) => container.evaluate((element, value) => {
  (element as HTMLElement).style.width = `${value}px`;
}, width);

for (const colorway of COLORWAYS) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`layout recipes adapt to their panel and preserve reading order: ${colorway}, ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.emulateMedia({ reducedMotion });
      await open(page, '/foundations/spacing', colorway);

      // The docs use their published editorial roles, rather than a second type scale.
      const header = page.locator('.page-head');
      await expect(header.getByRole('heading', { level: 1 })).toHaveCSS('font-size', '30px');
      await expect(header.getByRole('heading', { level: 1 })).toHaveCSS('line-height', '36px');
      await expect(header.locator(':scope > p').first()).toHaveCSS('font-size', '16px');
      await expect(header.locator(':scope > p').first()).toHaveCSS('line-height', '25px');

      const stack = page.getByTestId('layout-stack');
      await expect(stack).toBeVisible();
      const stackChildren = await boxes(stack);
      expect(stackChildren.length).toBeGreaterThanOrEqual(2);
      for (let index = 1; index < stackChildren.length; index++) {
        expect(stackChildren[index].y - stackChildren[index - 1].y - stackChildren[index - 1].height).toBeCloseTo(12, 0);
        expect(stackChildren[index].x).toBeCloseTo(stackChildren[0].x, 0);
      }

      // Cluster keeps natural item widths, then wraps whole controls onto more rows.
      const cluster = page.getByTestId('layout-cluster');
      await panelWidth(cluster, 700);
      const wideRows = await rowCount(cluster);
      const wideItemWidths = (await boxes(cluster)).map(({ width }) => width);
      await panelWidth(cluster, 240);
      await expect.poll(() => rowCount(cluster)).toBeGreaterThan(wideRows);
      expect(await overflow(cluster)).toBeLessThanOrEqual(1);
      const narrowItemWidths = (await boxes(cluster)).map(({ width }) => width);
      narrowItemWidths.forEach((width, index) => expect(width).toBeCloseTo(wideItemWidths[index], 0));

      const host = page.getByTestId('layout-grid-host');
      const grid = page.getByTestId('layout-grid');
      await expect(grid.locator(':scope > *')).toHaveCount(3);
      // Viewport stays wide. Columns change only because the panel's available space changes.
      for (const [width, rows] of [[760, 1], [560, 2], [280, 3]] as const) {
        await panelWidth(host, width);
        await expect.poll(() => rowCount(grid)).toBe(rows);
        expect(await overflow(host)).toBeLessThanOrEqual(1);
        const cards = await boxes(grid);
        cards.forEach((card) => expect(card.width).toBeGreaterThanOrEqual(239));
      }

      // A panel narrower than the preferred minimum remains usable without page overflow.
      await panelWidth(host, 180);
      await expect.poll(() => rowCount(grid)).toBe(3);
      await expect.poll(async () => Math.max(...(await boxes(grid)).map(({ width }) => width))).toBeLessThanOrEqual(181);
      expect(await overflow(host)).toBeLessThanOrEqual(1);

      const links = grid.getByRole('link');
      await expect(links).toHaveCount(3);
      await links.nth(0).focus();
      await expect(links.nth(0)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(links.nth(1)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(links.nth(2)).toBeFocused();

      await panelWidth(host, 760);
      await expect.poll(() => rowCount(grid)).toBe(1);
      await grid.screenshot({ path: capture(`css-layout-desktop-${colorway}-${reducedMotion}`) });

      // Restore authored widths before checking the actual phone delivery lane.
      await host.evaluate((element) => (element as HTMLElement).style.removeProperty('width'));
      await cluster.evaluate((element) => (element as HTMLElement).style.removeProperty('width'));
      await page.setViewportSize({ width: 375, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(await overflow(grid)).toBeLessThanOrEqual(1);
      await grid.screenshot({ path: capture(`css-layout-${colorway}-${reducedMotion}`) });
    });
  }
}
