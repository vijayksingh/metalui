import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The x-ray flight: click an object on the floating table and it lifts off, flies onto its
// model in the x-ray card and tilts to the x-ray's angle on the way; close the card and it
// lifts out, turns flat and flies home. Either way it can be turned around mid-air.

async function openLanding(page: Page, path: string, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto(path);
  await page.waitForSelector('[data-float="button"]');
  await page.evaluate(() => document.fonts.ready);
}

const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
/** The flying copy's centre on screen and its current transform. */
const flyer = (page: Page) => page.locator('.xr-flyer').evaluate((f) => {
  const r = f.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, transform: getComputedStyle(f).transform };
});
const centre = async (page: Page, selector: string) => {
  const r = (await page.locator(selector).first().boundingBox())!;
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};
const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

for (const colorway of COLORWAYS) {
  for (const [path, id, part, title] of [
    ['/', 'button', 'button', 'Button, x-ray'],
    ['/overview', 'swatch', '> *', 'Swatch, x-ray'],
  ] as const) {
    test(`${title.split(',')[0].toLowerCase()} flies onto its x-ray model and back on ${path} in ${colorway}`, async ({ page }) => {
      await openLanding(page, path, colorway);
      const object = page.locator(`[data-float="${id}"]`);

      await object.locator(part).first().click({ force: true });
      const sheet = page.getByRole('dialog', { name: title });
      await expect(sheet).toBeVisible();
      // in the air: a copy of the object travels while the object itself is away
      await expect(page.locator('.xr-flyer')).toHaveCount(1);
      await expect(object).toHaveCSS('visibility', 'hidden');
      await settled(page);
      // landed: the model has taken over, face to face with where the copy came down
      await expect(page.locator('.xr-overlay .xr-scene')).toHaveCSS('opacity', '1');
      await expect(object).toHaveCSS('visibility', 'hidden');
      await page.screenshot({ path: capture(`xray-flight-${id}-${colorway}`) });

      await page.keyboard.press('Escape');
      await expect(page.locator('.xr-flyer')).toHaveCount(1);
      await settled(page);
      await expect(sheet).toHaveCount(0);
      await expect(object).toHaveCSS('visibility', 'visible');
    });
  }
}

test('an opening flight turns around mid-air and goes home', async ({ page }) => {
  await openLanding(page, '/', 'bone');
  const home = await centre(page, '[data-float="swatch"]');
  await page.locator('[data-float="swatch"] > *').first().click({ force: true });
  await page.waitForTimeout(500);
  const out = await flyer(page);
  expect(gap(out, home)).toBeGreaterThan(40);
  // tilting toward the x-ray's angle on the way (a 3D matrix, not a flat one)
  expect(out.transform).toContain('matrix3d');

  await page.keyboard.press('Escape');
  // it comes back toward home from where it was, instead of finishing the trip first
  await expect.poll(async () => (await page.locator('.xr-flyer').count()) ? gap(await flyer(page), home) : 0).toBeLessThan(gap(out, home) - 20);
  expect(await page.evaluate(() => document.documentElement.dataset.flight ?? 'landed')).not.toBe('open');
  await settled(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-float="swatch"]')).toHaveCSS('visibility', 'visible');
});

test('a closing flight turns around when you click the object in the air', async ({ page }) => {
  await openLanding(page, '/', 'bone');
  await page.locator('[data-float="swatch"] > *').first().click({ force: true });
  await settled(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  const out = await flyer(page);
  await page.mouse.click(out.x, out.y);
  await settled(page);
  await expect(page.getByRole('dialog', { name: 'Swatch, x-ray' })).toBeVisible();
  await expect(page.locator('[data-float="swatch"]')).toHaveCSS('visibility', 'hidden');
});

test('with reduced motion the x-ray opens and closes in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLanding(page, '/', 'bone');
  await page.locator('[data-float="button"] button').click({ force: true });
  const sheet = page.getByRole('dialog', { name: 'Button, x-ray' });
  await expect(sheet).toBeVisible();
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-float="button"]')).toHaveCSS('visibility', 'visible');
});
