import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The x-ray flight: click an object on the floating table and it lifts off and opens into
// its x-ray sheet; close the sheet and it folds back into the object, which lands where it was.

async function openLanding(page: Page, path: string, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto(path);
  await page.waitForSelector('[data-float="button"]');
  await page.evaluate(() => document.fonts.ready);
}

/** Records the view-transition animations of each flight the page starts. */
async function watchFlights(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { flights: string[][] };
    w.flights = [];
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((cb: () => void) => {
      const t = start(cb);
      t.ready.then(() => w.flights.push(document.getAnimations().map((a) => (a.effect as KeyframeEffect).pseudoElement ?? '').filter(Boolean)));
      return t;
    }) as typeof document.startViewTransition;
  });
}

const flights = (page: Page) => page.evaluate(() => (window as unknown as { flights: string[][] }).flights);
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight);

for (const colorway of COLORWAYS) {
  for (const [path, id, part, title] of [
    ['/', 'button', 'button', 'Button, x-ray'],
    ['/overview', 'swatch', '> *', 'Swatch, x-ray'],
  ] as const) {
    test(`${title.split(',')[0].toLowerCase()} flies into its x-ray and back on ${path} in ${colorway}`, async ({ page }) => {
      await openLanding(page, path, colorway);
      await watchFlights(page);
      const object = page.locator(`[data-float="${id}"]`);

      await object.locator(part).first().click({ force: true });
      const sheet = page.getByRole('dialog', { name: title });
      await expect(sheet).toBeVisible();
      await settled(page);
      // one thing travelled: the object, now carried by the sheet; the object itself is away
      expect((await flights(page))[0]).toContain(`::view-transition-group(float-${id})`);
      expect((await flights(page))[0].filter((p) => p.startsWith('::view-transition-group(float-'))).toHaveLength(1);
      await expect(page.locator('.xr-sheet')).toHaveCSS('view-transition-name', `float-${id}`);
      await expect(object).toHaveCSS('visibility', 'hidden');
      await page.screenshot({ path: capture(`xray-flight-${id}-${colorway}`) });

      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await settled(page);
      expect((await flights(page))[1]).toContain(`::view-transition-group(float-${id})`);
      await expect(object).toHaveCSS('visibility', 'visible');
      await expect(object).toHaveCSS('view-transition-name', `float-${id}`);
    });
  }
}

test('with reduced motion the x-ray opens and closes in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page, '/', 'bone');
  await page.locator('[data-float="button"] button').click({ force: true });
  const sheet = page.getByRole('dialog', { name: 'Button, x-ray' });
  await expect(sheet).toBeVisible();
  await settled(page);
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => (a.effect as KeyframeEffect).pseudoElement?.startsWith('::view-transition')).length);
  expect(moving).toBe(0);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
});
