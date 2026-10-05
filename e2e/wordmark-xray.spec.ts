import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));

for (const colorway of COLORWAYS) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`home wordmark opens its own x-ray in ${colorway}, ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const object = page.locator('[data-float="wordmark"]');
      const trigger = object.getByRole('button', { name: 'MetalUI: open the x-ray' });
      // Hover pauses the drifting object before a normal, hit-tested click.
      const box = (await trigger.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await trigger.click();
      const sheet = page.getByRole('dialog', { name: 'MetalUI wordmark, x-ray' });
      await expect(sheet).toBeVisible();
      await expect(object).toHaveCSS('visibility', 'hidden');
      if (reducedMotion === 'reduce') await expect(page.locator('.xr-flyer')).toHaveCount(0);
      await settled(page);
      await expect(sheet.locator('.mu-slider, .xr-dial')).toHaveCount(0);
      const marks = [sheet.locator('.xr-scene [data-wordmark]'), sheet.locator('.ed-specimen [data-wordmark]')];
      for (const [name, selector, property] of [
        ['Enamel', ':scope > span:first-child', 'background-image'],
        ['Chrome lettering', ':scope > span:first-child > span', 'background-image'],
        ['Rim and shadows', ':scope', 'box-shadow'],
      ]) {
        await sheet.getByRole('switch', { name, exact: true }).click();
        for (const mark of marks) await expect(selector === ':scope' ? mark : mark.locator(selector)).toHaveCSS(property, 'none');
      }
      await sheet.getByRole('switch', { name: 'Top highlight', exact: true }).click();
      for (const mark of marks) await expect(mark.locator(':scope > span')).toHaveCount(2);
      await sheet.getByRole('button', { name: 'Reset', exact: true }).click();
      for (const mark of marks) {
        await expect(mark.locator(':scope > span:first-child')).not.toHaveCSS('background-image', 'none');
        await expect(mark.locator(':scope > span:first-child > span')).not.toHaveCSS('background-image', 'none');
        await expect(mark.locator(':scope > span:first-child > span')).toHaveCSS('background-clip', 'text');
        await expect(mark).not.toHaveCSS('box-shadow', 'none');
        await expect(mark.locator(':scope > span')).toHaveCount(3);
      }
      if (reducedMotion === 'no-preference') await page.screenshot({ path: capture(`wordmark-xray-${colorway}`) });
      await page.keyboard.press('Escape');
      await settled(page);
      await expect(sheet).toHaveCount(0);
      await expect(object).toHaveCSS('visibility', 'visible');
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(sheet).toBeVisible();
      await settled(page);
      await page.keyboard.press('Escape');
      await settled(page);
      await expect(sheet).toHaveCount(0);
    });
  }
}

for (const path of ['/', '/overview']) {
  test(`wordmark x-ray on ${path} fits a phone and opens with Space`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await page.getByRole('button', { name: 'MetalUI: open the x-ray' }).focus();
    await page.keyboard.press('Space');
    const sheet = page.getByRole('dialog', { name: 'MetalUI wordmark, x-ray' });
    await expect(sheet).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
    const box = (await sheet.locator('.xr-sheet').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
  });
}
