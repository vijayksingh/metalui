import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Command palette: ⌘K opens it with the field focused and the first row selected; typing refilters and marks
// matches; arrows and hover move the selection; ↩ runs, ⇧↩ pins, ⎋ closes and focus returns.
for (const colorway of COLORWAYS) {
  test(`ask, move, run and pin in ${colorway}`, async ({ page }) => {
    await open(page, '/components/command-palette', colorway);
    await page.keyboard.press('ControlOrMeta+k');
    const field = page.getByRole('combobox', { name: 'Lenses and actions' });
    await expect(field).toBeFocused();
    const selected = page.locator('.mu-palette-row[data-highlighted]');
    await expect(selected).toHaveText('open tasks');
    await field.pressSequentially('poster');
    await expect(selected).toContainText('See “poster”');
    await expect(page.locator('.mu-palette-sec').first()).toContainText('LENS');
    await expect(page.locator('.mu-palette-mark').first()).toHaveText('poster');
    expect(await page.locator('.mu-palette-mark').first().evaluate((el) => getComputedStyle(el).fontWeight)).toBe('650');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(selected).toContainText('the font on the train poster');
    await page.locator('.mu-palette').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const plate = (await page.locator('.mu-palette').boundingBox())!;
    expect(plate.width).toBe(560);
    await page.screenshot({ path: capture(`command-palette-${colorway}`), clip: { x: plate.x - 40, y: plate.y - 30, width: plate.width + 80, height: plate.height + 60 } });
    await page.locator('.mu-palette-row').nth(1).hover();
    await expect(selected).toContainText('#poster');
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('.mu-palette')).toHaveCount(0);
    await expect(page.getByText('last run · #poster · pinned')).toBeVisible();
    await page.getByRole('button', { name: /Lenses and actions/ }).click();
    await page.keyboard.type('undo');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('last run · Undo')).toBeVisible();
    const trigger = page.getByRole('button', { name: /Lenses and actions/ });
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mu-palette')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test('nothing matches, and the palette rises in place under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/command-palette', 'bone');
  await page.getByRole('button', { name: /Lenses and actions/ }).click();
  const plate = page.locator('.mu-palette');
  expect(await plate.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  await page.keyboard.type('zzqx');
  // The lens row for the words is always there; nothing else matches.
  await expect(page.locator('.mu-palette-row')).toHaveCount(1);
});
