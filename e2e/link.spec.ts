import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) for (const motion of ['no-preference', 'reduce'] as const) {
  test(`Link destinations expose state and physical feedback in ${colorway}/${motion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await open(page, '/components/link', colorway);
    const paragraph = page.getByLabel('Example paragraph');
    const guide = paragraph.getByRole('link', { name: 'the export guide' });
    const line = guide.locator('.mu-link-line');
    await expect(line).toHaveCSS('text-decoration-line', 'underline');
    await guide.scrollIntoViewIfNeeded();
    const box = (await guide.boundingBox())!;
    await page.mouse.move(box.x + box.width + 5, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2);
    await expect(guide).toHaveCSS('--mu-link-origin', 'right');
    await expect.poll(() => line.evaluate(el => getComputedStyle(el, '::after').transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(await line.evaluate(el => getComputedStyle(el, '::after').height)).toBe('2px');
    if (motion === 'reduce') expect(await line.evaluate(el => getComputedStyle(el, '::after').transitionProperty)).toBe('opacity');
    await expect.poll(() => line.evaluate(el => getComputedStyle(el, '::before').opacity)).toBe('1');
    await page.mouse.down();
    await expect(guide).toHaveCSS('opacity', '0.64');
    if (motion === 'no-preference') await expect(line).toHaveCSS('translate', '0px 1px');
    await page.mouse.up();
    const external = paragraph.getByRole('link', { name: /links stay visible/ });
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(external.locator('svg')).toHaveCount(1);
    await guide.focus(); await page.keyboard.press('Tab');
    await expect(external).toHaveCSS('outline-style', 'solid');

    const states = page.getByLabel('Link states');
    const currentLink = states.locator('a[aria-current="page"]');
    await expect(currentLink.locator('.mu-link-line')).toHaveCSS('text-decoration-line', 'none');
    const unavailable = states.getByRole('link', { name: /The field guide.*being revised/ });
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    await expect(unavailable).not.toHaveAttribute('href');
    await expect(unavailable.locator('.mu-link-line')).toHaveCSS('text-decoration-line', 'none');
    const before = page.url();
    await unavailable.focus(); await page.keyboard.press('Enter');
    expect(page.url()).toBe(before);
    await unavailable.hover();
    await expect(page.locator('.mu-tooltip')).toContainText('being revised');
    await unavailable.click({ force: true }); expect(page.url()).toBe(before);
    await expect(states.locator('a[data-kind="quiet"] .mu-link-line')).toHaveCSS('text-decoration-line', 'underline');
    await expect(states.locator('a[data-kind="standalone"] svg')).toHaveCount(1);
    await expect(states.locator('a[data-visited]')).toHaveCount(1);

    const route = states.getByRole('link', { name: 'Open the region' });
    await route.click();
    await expect(route).toHaveAttribute('aria-busy', 'true');
    const progress = route.locator('.link-loading');
    await expect(progress).not.toHaveAttribute('data-paused');
    if (motion === 'reduce') expect(await progress.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
    else expect(await progress.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('mu-progress-sweep');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(progress).toHaveAttribute('data-paused', '');
    await states.getByRole('button', { name: 'Route arrived' }).click();
    await expect(route).not.toHaveAttribute('aria-busy');
    await expect(progress).toHaveCount(0);
    await states.screenshot({ path: `docs/captures/web/link-states-${colorway}-${motion}.png` });
  });
}

test('Link downloads a named file and handled underline changes on keyboard and drag', async ({ page }) => {
  await open(page, '/components/link', 'bone');
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Tram map.pdf · 2.4 MB' }).click();
  expect((await download).suggestedFilename()).toBe('Tram map.txt');
  const handle = page.getByRole('slider', { name: 'Underline offset' });
  await handle.focus(); await page.keyboard.press('ArrowUp');
  await expect(handle).toHaveAttribute('aria-valuenow', '4');
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 5); await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '7');
  await page.getByRole('switch', { name: 'External destination' }).click();
  await expect(page.locator('#x-ray .mu-link')).toHaveAttribute('target', '_blank');
});

test('Link live scoped reduced motion stops route travel', async ({ page }) => {
  await open(page, '/components/link', 'graphite');
  const states = page.getByLabel('Link states');
  const route = states.getByRole('link', { name: 'Open the region' });
  await route.click();
  await states.evaluate(el => el.setAttribute('data-mu-motion', 'reduce'));
  await expect(route.locator('.link-loading')).toHaveAttribute('data-reduced', '');
  expect(await route.locator('.link-loading').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
  await states.evaluate(el => el.removeAttribute('data-mu-motion'));
  await expect(route.locator('.link-loading')).not.toHaveAttribute('data-reduced');
});
