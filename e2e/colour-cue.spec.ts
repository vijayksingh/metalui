import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
for (const colorway of COLORWAYS) {
  test(`colour words keep their footprint and keyboard history in ${colorway}`, async ({ page }) => {
    await open(page, '/components/colour-cue#source', colorway);
    const doc = page.getByTestId('colour-document'), source = doc.getByRole('textbox', { name: 'Colour source' });
    const trigger = doc.getByRole('button', { name: 'Paint colour, #FF6B3D', exact: true });
    const neighbour = doc.getByTestId('colour-neighbour');
    const before = await neighbour.boundingBox();
    await trigger.focus(); await trigger.press('Enter');
    const hue = page.getByRole('slider', { name: 'Paint colour hue' });
    await hue.focus(); await hue.press('ArrowRight');
    const one = await source.inputValue();
    expect(one).not.toBe('🎨 Paint #FF6B3D with Sam.');
    await hue.press('ArrowRight');
    const two = await source.inputValue(); expect(two).not.toBe(one);
    const after = await neighbour.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 1); expect(after!.y).toBeCloseTo(before!.y, 1);
    await hue.press('Escape');
    await expect(doc.locator('.mu-colour-cue').first()).toBeFocused();
    await doc.getByRole('button', { name: 'Undo colour edit' }).click(); await expect(source).toHaveValue(one);
    await doc.getByRole('button', { name: 'Undo colour edit' }).click(); await expect(source).toHaveValue('🎨 Paint #FF6B3D with Sam.');
    await expect(doc.getByRole('status')).toContainText('selection 2–2');
    await doc.getByRole('button', { name: 'Redo colour edit' }).click(); await expect(source).toHaveValue(one);
    await expect(doc.locator('.mu-colour-cue').first().locator('.mu-swap-layer')).toHaveCount(1);
    await doc.screenshot({ path: capture(`colour-cue-${colorway}`) });
  });
  test(`colour drag records one edit and Escape restores exact source in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/colour-cue#source', colorway);
    const doc = page.getByTestId('colour-document'), source = doc.getByRole('textbox', { name: 'Colour source' });
    await source.fill('🎨 Paint #ff6b3d with Sam.');
    await doc.getByRole('button', { name: 'Paint colour, #ff6b3d', exact: true }).click();
    const control = page.getByRole('dialog').locator('.mu-slider-control');
    const box = (await control.boundingBox())!;
    await page.mouse.move(box.x + box.width * .3, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width * .65, box.y + box.height / 2, { steps: 8 });
    expect(await source.inputValue()).not.toBe('🎨 Paint #ff6b3d with Sam.');
    await page.keyboard.press('Escape'); await page.mouse.up();
    await expect(source).toHaveValue('🎨 Paint #ff6b3d with Sam.');
    await doc.getByRole('button', { name: 'Paint colour, #ff6b3d', exact: true }).click();
    const second = (await page.getByRole('dialog').locator('.mu-slider-control').boundingBox())!;
    await page.mouse.move(second.x + second.width * .25, second.y + second.height / 2); await page.mouse.down();
    await page.mouse.move(second.x + second.width * .8, second.y + second.height / 2, { steps: 8 }); await page.mouse.up();
    const changed = await source.inputValue(); expect(changed).not.toBe('🎨 Paint #ff6b3d with Sam.');
    await page.keyboard.press('Escape');
    await doc.getByRole('button', { name: 'Undo colour edit' }).click(); await expect(source).toHaveValue('🎨 Paint #ff6b3d with Sam.');
    await doc.getByRole('button', { name: 'Redo colour edit' }).click(); await expect(source).toHaveValue(changed);
    await doc.getByRole('button', { name: 'Read-only colour, #334455, read only' }).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(doc.getByRole('button', { name: 'Disabled colour, #556677' })).toBeDisabled();
    await doc.getByRole('button', { name: 'Achromatic colour, #888888' }).click();
    const greyHue = page.getByRole('slider', { name: 'Achromatic colour hue' }); await greyHue.focus(); await greyHue.press('ArrowRight');
    await expect(page.getByRole('dialog')).toContainText('#888888');
    await expect(source).toHaveValue(changed);
    await doc.screenshot({ path: capture(`colour-cue-${colorway}-reduced`) });
  });
}

test('a scoped motion preference follows colour text into its portalled well', async ({ page }) => {
  await open(page, '/components/colour-cue#source', 'graphite');
  await page.getByTestId('colour-document').evaluate(el => el.setAttribute('data-mu-motion', 'reduce'));
  await page.getByRole('button', { name: 'Paint colour, #FF6B3D', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('data-mu-motion', 'reduce');
  await expect(page.getByRole('dialog').locator('..')).toHaveAttribute('data-mu-colorway', 'graphite');
});

test('colour provenance reaches its actual operable words and preserves popup focus', async ({ page }) => {
  await open(page, '/components/colour-cue#source', 'bone');
  const doc = page.getByTestId('colour-document');
  const trigger = doc.getByRole('button', { name: 'Paint colour, #FF6B3D', exact: true });
  await trigger.focus();
  await expect(trigger).toHaveAttribute('aria-description', /arrow keys.*You, Authored colour words/);
  await expect(page.locator('.mu-provenance')).toContainText('You · Authored colour words');
  await trigger.press('Enter');
  const hue = page.getByRole('slider', { name: 'Paint colour hue' });
  await hue.focus(); await hue.press('ArrowRight'); await hue.press('Escape');
  await expect(doc.locator('.mu-colour-cue').first()).toBeFocused();
  await doc.getByRole('button', { name: 'Undo colour edit' }).click();
  await expect(doc.getByRole('textbox', { name: 'Colour source' })).toHaveValue('🎨 Paint #FF6B3D with Sam.');
});
