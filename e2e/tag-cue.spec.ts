import { test, expect } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';
for (const colorway of COLORWAYS) {
  test(`recent tags retain identity, footprint and one wheel history in ${colorway}`, async ({ page }) => {
    await open(page, '/components/tag-cue', colorway);
    const host = page.getByTestId('tag-document'), cue = host.locator('.mu-enum-cue').first(), source = host.locator('input[aria-label="Tag source"]');
    const neighbor = host.getByTestId('tag-neighbour'), start = await neighbor.boundingBox();
    await cue.focus(); await page.keyboard.press('Space'); await expect(source).toHaveValue('🎨 Send #studio with Sam.');
    await cue.dispatchEvent('wheel', { deltaY: 48 }); await expect(source).toHaveValue('🎨 Send #long-project with Sam.');
    await expect.poll(async () => (await neighbor.boundingBox())!.x).toBeCloseTo(start!.x, 1);
    await host.screenshot({ path: capture(`tag-cue-${colorway}`) });
    await expect(host.getByRole('button', { name: 'Undo tag edit' })).toBeEnabled();
    await page.waitForTimeout(300); await host.getByRole('button', { name: 'Undo tag edit' }).click(); await expect(source).toHaveValue('🎨 Send #studio with Sam.');
    await host.getByRole('button', { name: 'Undo tag edit' }).click(); await expect(source).toHaveValue('🎨 Send #poster with Sam.');
    await host.getByRole('button', { name: 'Redo tag edit' }).click(); await expect(source).toHaveValue('🎨 Send #studio with Sam.');
    const fixed = host.getByRole('button', { name: 'Read-only tag: #coffee' }); await fixed.focus(); await page.keyboard.press('Space'); await expect(source).toHaveValue('🎨 Send #studio with Sam.');
    await expect(host.getByRole('button', { name: 'Disabled tag: #poster' })).toBeDisabled();
  });
  test(`typing a hash chooses one recent tag at the UTF16 caret and Escape keeps source in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, '/components/tag-cue', colorway);
    const host = page.getByTestId('tag-document'), source = host.locator('input[aria-label="Tag source"]');
    await source.focus(); await source.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 3));
    await page.keyboard.type('#');
    const lookup = page.getByRole('combobox', { name: 'Find a recent tag' }); await expect(lookup).toBeFocused();
    await lookup.fill('coffee'); await expect(page.getByRole('option', { name: '#coffee', exact: true })).toBeVisible();
    await expect(source).toHaveValue('🎨 #Send #poster with Sam.');
    await page.screenshot({ path: capture(`tag-picker-${colorway}-reduced`) });
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    await expect(source).toHaveValue('🎨 #coffeeSend #poster with Sam.'); await expect(source).toBeFocused();
    await expect.poll(() => source.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(10);
    await host.getByRole('button', { name: 'Undo tag edit' }).click(); await expect(source).toHaveValue('🎨 #Send #poster with Sam.');
    await source.focus(); await source.evaluate((input: HTMLInputElement) => { input.setSelectionRange(input.value.length, input.value.length); input.dispatchEvent(new Event('select', { bubbles: true })); }); await page.keyboard.type(' #'); await expect(lookup).toBeFocused();
    await lookup.fill('never-used'); await expect(page.getByText('No recent tags', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(source).toHaveValue('🎨 #Send #poster with Sam. #'); await expect(source).toBeFocused();
    await host.screenshot({ path: capture(`tag-completion-${colorway}-reduced`) });
  });
}
