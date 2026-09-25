import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The x-ray flight: click an object on the floating table and it lifts off, flies onto its
// model in the x-ray card and tilts to the x-ray's angle on the way; close the card and the
// model lifts out, turns flat and flies home to where the object was.

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
      // after the page's own handler has keyed the flight
      t.ready.then(() => setTimeout(() => w.flights.push(document.getAnimations().flatMap((a) => {
        const e = a.effect as KeyframeEffect;
        return e.pseudoElement ? [e.pseudoElement + ' ' + e.getKeyframes().map((k) => k.transform ?? '').join('|')] : [];
      }))));
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
      // one thing travelled: the object, now carried by the model in the card; the object itself is away
      const open = (await flights(page))[0];
      expect(open.filter((p) => p.startsWith('::view-transition-group(float-'))).toHaveLength(1);
      expect(open.some((p) => p.startsWith(`::view-transition-group(float-${id})`))).toBe(true);
      // on the way it tilts to the x-ray's angle
      expect(open.some((p) => p.startsWith(`::view-transition-old(float-${id})`) && p.endsWith('rotateX(58deg) rotateZ(-38deg)'))).toBe(true);
      await expect(page.locator('.xr-scene')).toHaveCSS('view-transition-name', `float-${id}`);
      await expect(object).toHaveCSS('visibility', 'hidden');
      await page.screenshot({ path: capture(`xray-flight-${id}-${colorway}`) });

      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await settled(page);
      const close = (await flights(page))[1];
      expect(close.some((p) => p.startsWith(`::view-transition-group(float-${id})`))).toBe(true);
      expect(close.some((p) => p.startsWith(`::view-transition-new(float-${id})`) && p.includes('rotateX(0deg) rotateZ(0deg)'))).toBe(true);
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
