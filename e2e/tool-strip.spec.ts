import { test, expect } from '@playwright/test';
import { open, COLORWAYS, capture } from './helpers';

for (const colorway of COLORWAYS) for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`selection verbs adapt, remain ordered and follow canvas bounds in ${colorway}, ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page, '/components/tool-strip', colorway);
    await page.getByRole('button', { name: 'A studio note', exact: true }).click();
    let strip = page.getByRole('toolbar', { name: 'Tools for 1 blocks' });
    await expect(strip.getByRole('button', { name: 'Tasks', exact: true })).toBeVisible();
    await expect(strip.getByRole('button', { name: 'Summarise', exact: true })).toBeVisible();
    await strip.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Markdown', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Selection result' })).toHaveText('Exported Markdown · 1 selected');
    await strip.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Selection result' })).toHaveText('Renamed · 1 selected');
    await page.getByRole('button', { name: 'An image', exact: true }).click({ modifiers: ['Shift'] });
    strip = page.getByRole('toolbar', { name: 'Tools for 2 blocks' });
    await expect(strip.getByRole('button')).toHaveCount(3);
    await expect(strip.getByRole('button', { name: 'Gather', exact: true })).toBeVisible();
    await expect(strip.getByRole('button', { name: 'Tasks', exact: true })).toHaveCount(0);
    await expect(strip.getByRole('button', { name: 'Rename', exact: true })).toHaveCount(0);
    await strip.getByRole('button', { name: 'Export', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Markdown', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Selection result' })).toHaveText('Exported Markdown · 2 selected');
    await page.getByRole('button', { name: 'A link', exact: true }).click();
    strip = page.getByRole('toolbar', { name: 'Tools for 1 blocks' });
    await expect(strip.getByRole('button', { name: 'Open', exact: true })).toBeVisible();
    await expect(strip.getByRole('button', { name: 'Copy link', exact: true })).toBeVisible();
    const before = await strip.boundingBox();
    await page.getByRole('radio', { name: 'Left', exact: true }).click();
    await expect.poll(async () => (await strip.boundingBox())!.x).toBeLessThan(before!.x);
    await page.getByRole('button', { name: 'Zoom', exact: true }).click();
    const box = await strip.boundingBox(), canvas = await page.getByRole('group', { name: 'Selection canvas', exact: true }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(canvas!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(canvas!.x + canvas!.width);
    const names = await strip.getByRole('button').evaluateAll((keys) => keys.map((key) => key.getAttribute('aria-label')));
    expect(names.at(-1)).toBe('Send away');
    await page.locator('section', { has: page.getByRole('heading', { name: 'Over a selection', exact: true }) }).screenshot({ path: capture(`tool-strip-${colorway}-${reducedMotion}`) });
  });
}

test('disabled keys explain their reason, waiting keys cannot repeat and irreversible actions require a hold', async ({ page }) => {
  await open(page, '/components/tool-strip', 'graphite');
  await page.getByRole('button', { name: 'An image', exact: true }).click();
  const strip = page.getByRole('toolbar', { name: 'Tools for 1 blocks' });
  const crop = strip.getByRole('button', { name: 'Crop', exact: true });
  await expect(crop).toHaveAttribute('aria-disabled', 'true');
  await crop.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await crop.hover();
  await expect(page.locator('.mu-tooltip')).toHaveText('Crop · This image is locked');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status', { name: 'Selection result' })).not.toHaveText(/Cropped/);
  await page.getByRole('button', { name: 'A studio note', exact: true }).click();
  await strip.getByRole('button', { name: 'Summarise', exact: true }).click();
  await expect(strip.getByRole('button', { name: 'Summarise', exact: true })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('status', { name: 'Selection result' })).toHaveText('Summary ready');
  const send = strip.getByRole('button', { name: 'Send away', exact: true });
  await send.click();
  await expect(strip).toBeVisible();
  await send.focus();
  await page.keyboard.down('Space');
  await expect(page.getByRole('status', { name: 'Selection result' })).toHaveText('Sent away 1 blocks');
  await page.keyboard.up('Space');
  await expect(strip).toHaveCount(0);
});

test('narrow canvas moves overflow to More and keeps the destructive action in view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/components/tool-strip', 'bone');
  await page.getByRole('button', { name: 'A studio note', exact: true }).click();
  const strip = page.getByRole('toolbar');
  const box = await strip.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(strip.getByRole('button', { name: 'More', exact: true })).toBeVisible();
  await expect(strip.getByRole('button', { name: 'Send away', exact: true })).toBeVisible();
});
