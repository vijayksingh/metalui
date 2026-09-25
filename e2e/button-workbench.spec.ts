import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`button workbench shares graphical controls and X-ray in ${colorway}`, async ({ page }) => {
    await open(page, '/components/button', colorway);
    const workbench = page.locator('.button-workbench');
    const preview = workbench.locator('.xr-solid .mu-button');
    await expect(preview).toHaveText('New Canvas');
    await workbench.getByRole('textbox', { name: 'Button label' }).fill('Create');
    await expect(preview).toHaveText('Create');
    await workbench.getByRole('slider', { name: 'Button height' }).focus();
    await page.keyboard.press('ArrowUp');
    await expect(workbench.locator('.bw-meter').filter({ hasText: 'Height' })).toContainText('34px');
    expect(await preview.evaluate((el) => parseFloat(getComputedStyle(el).height))).toBeCloseTo(34, 1);
    await workbench.getByRole('slider', { name: 'Side padding' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(workbench.locator('.bw-meter').filter({ hasText: 'Padding' })).toContainText('17px');
    await expect(workbench.getByText('Automatic padding follows height')).toBeVisible();
    await workbench.getByRole('button', { name: 'X-ray', exact: true }).click();
    await expect(workbench.locator('.button-xray')).toHaveAttribute('data-xray', 'true');
    await expect(workbench.locator('.xr-label')).toHaveText('Create');
    await expect(workbench.locator('.xr-card')).toContainText('34 pt');
    await workbench.getByText('Precise values and presets').click();
    await expect(workbench.locator('.dialkit-root')).toBeVisible();
    await workbench.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(workbench.locator('.bw-meter').filter({ hasText: 'Height' })).toContainText('32px');
    await workbench.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(preview).toHaveText('New Canvas');
  });
}

test('button object handles tune geometry and light by dragging', async ({ page }) => {
  await open(page, '/components/button', 'bone');
  const workbench = page.locator('.button-workbench');
  const height = workbench.getByRole('slider', { name: 'Button height' });
  await height.scrollIntoViewIfNeeded();
  const box = (await height.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 16, { steps: 4 });
  await page.mouse.up();
  await expect(workbench.locator('.bw-meter').filter({ hasText: 'Height' })).toContainText('40px');

  const light = workbench.getByRole('slider', { name: 'Light direction and strength' });
  await light.scrollIntoViewIfNeeded();
  const orbit = (await light.boundingBox())!;
  await page.mouse.move(orbit.x + orbit.width / 2, orbit.y + orbit.height / 2 - 68);
  await page.mouse.down();
  await page.mouse.move(orbit.x + orbit.width / 2 + 50, orbit.y + orbit.height / 2 - 50, { steps: 4 });
  await page.mouse.up();
  await expect(workbench.locator('.bw-meter').filter({ hasText: 'Direction' })).toContainText('45°');
  await workbench.getByRole('button', { name: 'X-ray', exact: true }).click();
  await expect(workbench.locator('.xr-card')).toContainText('40 pt');
});
