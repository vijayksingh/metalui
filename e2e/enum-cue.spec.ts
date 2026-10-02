import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
for (const colorway of COLORWAYS) {
  test(`Enum edits exact source, preserves the widest footprint and retains one undo per gesture in ${colorway}`, async ({ page }) => {
    await open(page, '/components/enum-cue', colorway);
    const host = page.getByTestId('enum-document'), source = host.getByRole('textbox', { name: 'Enum document source' });
    const cue = host.locator('.mu-enum-cue'); const tail = host.locator('[data-enum-tail]');
    const footprint = await cue.boundingBox(), anchor = await tail.boundingBox();
    await expect(cue).toHaveAccessibleName('Task state: To do (#todo)');
    await cue.focus(); await page.keyboard.press('Space');
    await expect(source).toHaveValue('🧠 Task #doing, send the poster.');
    await expect(cue).toHaveAttribute('data-value', '#doing');
    await expect(host.getByRole('button', { name: 'Undo enum edit' })).toBeEnabled();
    expect((await cue.boundingBox())!.width).toBeCloseTo(footprint!.width, 2); expect((await tail.boundingBox())!.x).toBeCloseTo(anchor!.x, 2);
    await cue.focus(); await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown');
    await expect(cue).toHaveAttribute('data-held', 'true'); await expect(cue.locator('[data-enum-instrument]')).toBeVisible();
    await page.keyboard.up('ArrowDown'); await expect(source).toHaveValue('🧠 Task #dropped, send the poster.');
    await host.getByRole('button', { name: 'Undo enum edit' }).click(); await expect(source).toHaveValue('🧠 Task #doing, send the poster.');
    await host.getByRole('button', { name: 'Undo enum edit' }).click(); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
    await expect(host.getByLabel('Enum retained selection')).toHaveText('UTF16 30–30 · committed');
    await cue.focus(); await page.keyboard.down('ArrowDown'); await expect(source).toHaveValue('🧠 Task #doing, send the poster.');
    await page.keyboard.press('Escape'); await page.keyboard.up('ArrowDown'); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
    await expect(host.getByRole('button', { name: 'Undo enum edit' })).toBeDisabled();
    const box = (await cue.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 48, { steps: 4 });
    await expect(source).toHaveValue('🧠 Task #done, send the poster.');
    await host.screenshot({ path: capture(`enum-held-${colorway}`) });
    await page.mouse.up(); await expect(cue.locator('[data-enum-instrument]')).toHaveCount(0);
    await expect(source).toHaveValue('🧠 Task #done, send the poster.');
    expect((await tail.boundingBox())!.x).toBeCloseTo(anchor!.x, 2);
    await host.getByRole('button', { name: 'Undo enum edit' }).click(); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
  });
}
test('focused wheel is one edit; ordinary page scroll and disabled/read-only remain inert; unmount cancels', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, '/components/enum-cue', 'graphite');
  const host = page.getByTestId('enum-document'), source = host.getByRole('textbox', { name: 'Enum document source' }), cue = host.locator('.mu-enum-cue');
  await cue.dispatchEvent('wheel', { deltaY: 24, deltaMode: 0 }); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
  await cue.focus(); await cue.dispatchEvent('wheel', { deltaY: 24, deltaMode: 0 }); await cue.dispatchEvent('wheel', { deltaY: 24, deltaMode: 0 });
  await expect(source).toHaveValue('🧠 Task #done, send the poster.'); await expect(host).toHaveAttribute('data-editing', 'true');
  await expect(host).not.toHaveAttribute('data-editing', 'true');
  await host.getByRole('button', { name: 'Undo enum edit' }).click(); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
  await expect(host.getByRole('button', { name: 'Undo enum edit' })).toBeDisabled();
  for (const panel of await page.locator('.dialkit-panel-inner[data-collapsed="true"]').all()) await panel.click();
  const dial = (name: string) => page.locator('.dialkit-labeled-control', { has: page.locator('.dialkit-labeled-control-label', { hasText: new RegExp(`^${name.replace(/([A-Z])/g, '\\s*$1')}$`, 'i') }) });
  await dial('raw').getByRole('button', { name: 'On', exact: true }).click();
  await host.screenshot({ path: capture('enum-raw-reduced') });
  await dial('readOnly').getByRole('button', { name: 'On', exact: true }).click(); await cue.focus(); await page.keyboard.press('Space'); await cue.dispatchEvent('wheel', { deltaY: 48, deltaMode: 0 });
  await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
  await dial('readOnly').getByRole('button', { name: 'Off', exact: true }).click();
  await dial('disabled').getByRole('button', { name: 'On', exact: true }).click(); await expect(cue).toBeDisabled();
  await cue.dispatchEvent('wheel', { deltaY: 48, deltaMode: 0 }); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
  await dial('disabled').getByRole('button', { name: 'Off', exact: true }).click();
  await cue.focus(); await page.keyboard.down('ArrowDown'); await expect(source).toHaveValue('🧠 Task #doing, send the poster.');
  await dial('mounted').getByRole('button', { name: 'Off', exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(source).toHaveValue('🧠 Task #todo, send the poster.'); await page.keyboard.up('ArrowDown');
});

test('external document typing ends the old source range without erasing new words', async ({ page }) => {
  await open(page, '/components/enum-cue', 'bone');
  const host = page.getByTestId('enum-document'), cue = host.locator('.mu-enum-cue'), source = host.getByRole('textbox', { name: 'Enum document source' });
  await cue.focus(); await page.keyboard.down('ArrowDown'); await expect(source).toHaveValue('🧠 Task #doing, send the poster.');
  // An editor host can receive a source edit while a cue owns focus (typing/paste from a retained editor).
  await source.evaluate((input: HTMLTextAreaElement) => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, '🧠 Task #doing, external edit.');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(host).not.toHaveAttribute('data-editing', 'true'); await expect(cue.locator('[data-enum-instrument]')).toHaveCount(0);
  await page.keyboard.up('ArrowDown'); await expect(source).toHaveValue('🧠 Task #doing, external edit.');
  await host.getByRole('button', { name: 'Undo enum edit' }).click(); await expect(source).toHaveValue('🧠 Task #doing, send the poster.');
  await host.getByRole('button', { name: 'Undo enum edit' }).click(); await expect(source).toHaveValue('🧠 Task #todo, send the poster.');
});


test('operable words retain the provenance trigger and help through source edits', async ({ page }) => {
  await open(page, '/components/enum-cue', 'bone');
  const host = page.getByTestId('enum-document'); const cue = host.locator('.mu-enum-cue');
  await cue.focus();
  await expect(cue).toHaveAttribute('aria-description', /You, Declared task states/);
  await expect(page.locator('.mu-provenance')).toHaveText('You · Declared task states');
  await page.keyboard.press('Space');
  await expect(host.getByRole('textbox', { name: 'Enum document source' })).toHaveValue('🧠 Task #doing, send the poster.');
  await expect(cue).toBeFocused();
  await host.getByRole('button', { name: 'Undo enum edit', exact: true }).click();
  await expect(host.getByRole('textbox', { name: 'Enum document source' })).toHaveValue('🧠 Task #todo, send the poster.');
});
