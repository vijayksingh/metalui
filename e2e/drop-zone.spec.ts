import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Drop zone: files picked or dropped land below as attachments; files dragged in the window arm it, over
// it the tray sinks and says to let go, a type it won't take is refused in words and with a shake.
const region = (page: Page) => page.getByRole('region', { name: 'Region files' });
const zone = (page: Page) => region(page).locator('.mu-drop-zone');

/** Fires a drag event carrying the given files (name, type, bytes) at a target: 'zone' or 'outside'. */
async function drag(page: Page, type: 'dragover' | 'drop' | 'dragleave', where: 'zone' | 'outside', files: { name: string; type: string; size?: number }[]) {
  await page.evaluate(({ type, where, files }) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(new File([new Uint8Array(f.size ?? 1000)], f.name, { type: f.type }));
    const target = where === 'zone' ? document.querySelector('[aria-label="Region files"] .mu-drop-zone')! : document.querySelector('h1')!;
    target.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true, relatedTarget: type === 'dragleave' ? document.body : null }));
  }, { type, where, files });
}

/** Holds files over the zone for `ms`, repeating dragover every 50 ms as a real drag does. */
async function hold(page: Page, files: { name: string; type: string }[], ms: number) {
  for (let t = 0; t < ms; t += 50) { await drag(page, 'dragover', 'zone', files); await page.waitForTimeout(50); }
}

const pdf = { name: 'Tram map.pdf', type: 'application/pdf' };

for (const colorway of COLORWAYS) {
  test(`compact long title keeps picking words separate in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/drop-zone#compact', colorway);
    const receiver = page.getByRole('region', { name: 'Compact receiver' });
    const words = receiver.locator('.mu-drop-zone-words');
    const choose = receiver.locator('.mu-drop-zone-choose');
    const text = (await words.boundingBox())!;
    const key = (await choose.boundingBox())!;
    expect(text.x + text.width).toBeLessThanOrEqual(key.x);
    expect(await words.evaluate((el) => el.scrollWidth > el.clientWidth || el.querySelector('.mu-swap-layer')!.scrollWidth > el.querySelector('.mu-swap-layer')!.clientWidth)).toBe(true);
    const input = receiver.getByLabel('Add images for the Lisbon travel journal');
    await input.focus();
    await expect(input).toBeFocused();
    await input.setInputFiles({ name: 'Lisbon.png', mimeType: 'image/png', buffer: Buffer.alloc(10) });
    await expect(receiver.getByRole('status')).toHaveText('1 files chosen');
    await receiver.screenshot({ path: capture(`drop-zone-compact-${colorway}`) });
  });

  test(`arms, sinks under files and takes what it accepts, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/drop-zone', colorway);
    await drag(page, 'dragover', 'outside', [pdf]);
    await expect(zone(page)).toHaveAttribute('data-armed', '');
    await drag(page, 'dragover', 'zone', [pdf]);
    await expect(zone(page)).toHaveAttribute('data-over', '');
    await expect(zone(page)).toContainText('Let go to attach');
    await hold(page, [pdf], 450);
    expect(Number(await zone(page).evaluate((el) => getComputedStyle(el).scale))).toBeLessThan(1);
    await drag(page, 'dragover', 'zone', [pdf]);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`drop-zone-${colorway}`) });
    await drag(page, 'drop', 'zone', [pdf]);
    await expect(zone(page)).not.toHaveAttribute('data-over', '');
    await expect(region(page).getByRole('group', { name: /Tram map/ })).toBeVisible();
    await expect(zone(page)).toContainText('Drop files here');
  });
}

test('refuses a type it will not take, in words and with a shake', async ({ page }) => {
  await open(page, '/components/drop-zone', 'bone');
  await drag(page, 'dragover', 'zone', [{ name: 'notes.txt', type: 'text/plain' }]);
  await expect(zone(page)).toHaveAttribute('data-refused', '');
  await expect(zone(page)).toContainText('This file isn’t taken here');
  await drag(page, 'drop', 'zone', [{ name: 'notes.txt', type: 'text/plain' }, pdf]);
  expect(await zone(page).evaluate((el) => el.getAnimations().some((a) => (a as Animation & { id: string }).id === 'mu-refusal'))).toBe(true);
  await expect(region(page).getByRole('alert')).toContainText('notes.txt is not a PDF or an image');
  await expect(region(page).getByRole('group', { name: /Tram map/ })).toBeVisible();
});

test('picking works without dragging, and refuses a file too large', async ({ page }) => {
  await open(page, '/components/drop-zone', 'bone');
  const input = region(page).getByLabel('Drop files here');
  await input.focus();
  await expect(input).toHaveAccessibleDescription(/PDFs and images/);
  expect(await zone(page).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await input.setInputFiles([{ name: 'Receipt.png', mimeType: 'image/png', buffer: Buffer.alloc(2000) }, { name: 'Scan.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(11_000_000) }]);
  await expect(region(page).getByRole('group', { name: /Receipt/ })).toBeVisible();
  await expect(region(page).getByRole('alert')).toContainText('Scan.pdf is larger than 10 MB');
  await expect(page.getByLabel('Uploads are paused')).toBeDisabled();
});

test('reduced motion: the edge lights, nothing sinks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/drop-zone', 'graphite');
  await drag(page, 'dragover', 'zone', [pdf]);
  await expect(zone(page)).toHaveAttribute('data-over', '');
  await hold(page, [pdf], 200);
  expect(Number(await zone(page).evaluate((el) => getComputedStyle(el).scale))).toBe(1);
  expect(await zone(page).evaluate((el) => getComputedStyle(el, '::before').boxShadow)).not.toContain('rgba(0, 0, 0, 0)');
});
