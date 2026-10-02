import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Alert dialog: a question that must be answered. Focus starts on Cancel; a click outside is refused
// with one shake on the refusal spring; Esc cancels; the confirm button does the thing.
for (const colorway of COLORWAYS) {
  test(`starts on Cancel, refuses a click outside, cancels on Esc, confirms in ${colorway}`, async ({ page }) => {
    await open(page, '/components/alert-dialog', colorway);
    const trigger = page.getByRole('button', { name: 'Delete 3 regions…' });
    await trigger.click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete 3 regions?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.waitForTimeout(600);
    await page.screenshot({ path: capture(`alert-dialog-${colorway}`) });

    // A click outside does not close it.
    await page.mouse.click(10, 10);
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await dialog.getByRole('button', { name: 'Delete regions' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('deleted · the regions are in the past')).toBeVisible();
  });
}

test('the refusal rings out against where the plate stands', async ({ page }) => {
  await open(page, '/components/alert-dialog', 'bone');
  await page.getByRole('button', { name: 'Delete 3 regions…' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete 3 regions?' });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(600);
  const xs = await dialog.evaluate(async (el) => {
    document.querySelector('.mu-alert-dialog-scrim')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => { out.push(new DOMMatrix(getComputedStyle(el).transform).m41); if (performance.now() - t0 < 1300) requestAnimationFrame(frame); else done(); };
      requestAnimationFrame(frame);
    });
    return out;
  });
  // It leaves a nest aside, swings past where it stands, and comes to rest there.
  expect(Math.max(...xs)).toBeGreaterThan(5);
  expect(Math.min(...xs)).toBeLessThan(-1);
  expect(Math.abs(xs.at(-1)!)).toBeLessThan(0.1);
});

test('Reduce Motion: a click outside does not shake', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/alert-dialog', 'graphite');
  await page.getByRole('button', { name: 'Delete 3 regions…' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete 3 regions?' });
  await expect(dialog).toBeVisible();
  const moved = await dialog.evaluate(async (el) => {
    document.querySelector('.mu-alert-dialog-scrim')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return el.getAnimations().some((a) => a.id === 'mu-refusal');
  });
  expect(moved).toBe(false);
  await expect(dialog).toBeVisible();
});

for (const colorway of COLORWAYS) {
  test(`irreversible hold cancels early and confirms exactly once in ${colorway}`, async ({ page }) => {
    await open(page, '/components/alert-dialog', colorway);
    await page.getByRole('button', { name: 'Delete forever…', exact: true }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete these regions forever?' });
    const confirm = dialog.getByRole('button', { name: 'Delete forever', exact: true });
    await expect(confirm).toHaveAccessibleDescription('Hold to confirm');
    await confirm.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('status')).toHaveText('Hold to confirm');
    await confirm.focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(300);
    await page.keyboard.up('Space');
    await expect(dialog).toBeVisible();
    await page.keyboard.down('Enter');
    await page.waitForTimeout(900);
    await page.keyboard.up('Enter');
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Permanently deleted', { exact: true })).toBeVisible();
  });
}

test('holding the pointer shows timed fill under reduced motion and leaving cancels', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/alert-dialog', 'bone');
  await page.getByRole('button', { name: 'Delete forever…', exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete these regions forever?' });
  const button = dialog.getByRole('button', { name: 'Delete forever', exact: true });
  const box = (await button.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(350);
  const progress = await button.locator('span[aria-hidden]').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
  expect(progress).toBeGreaterThan(0.2);
  expect(progress).toBeLessThan(0.8);
  await expect(button.locator('svg')).not.toHaveAttribute('data-playing', '');
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

for (const colorway of COLORWAYS) {
  test(`hold has visible distinct progress and a coordinated trash lid in ${colorway}`, async ({ page }) => {
    await open(page, '/components/alert-dialog', colorway);
    await page.getByRole('button', { name: 'Delete forever…', exact: true }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete these regions forever?' });
    const button = dialog.getByRole('button', { name: 'Delete forever', exact: true });
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(400);
    const fill = button.locator('span[aria-hidden]');
    expect((await fill.boundingBox())!.width).toBeGreaterThan(box.width * 0.2);
    expect((await fill.boundingBox())!.width).toBeLessThan(box.width * 0.9);
    expect(await fill.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(80, 0, 0, 0.25)');
    const lid = button.locator('[data-part="lid"]');
    expect(await lid.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).b)).toBeLessThan(-0.05);
    await page.screenshot({ path: capture(`alert-hold-progress-${colorway}`), clip: (await dialog.boundingBox())! });
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await expect.poll(async () => lid.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).b)).toBe(0);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Use single press', exact: true }).click();
    await page.getByRole('button', { name: 'Delete forever…', exact: true }).click();
    await dialog.getByRole('button', { name: 'Delete forever', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Permanently deleted', { exact: true })).toBeVisible();
  });
}
