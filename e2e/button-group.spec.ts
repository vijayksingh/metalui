import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Button group: keys in one tray press on their own; the split button's chevron opens the other
// ways, turning over while open, and a choice runs.
const play = (page: import('@playwright/test').Page) => page.locator('section', { hasText: 'Playground' }).first();
const lift = (el: import('@playwright/test').Locator) => el.evaluate((e) => { const t = getComputedStyle(e).translate; return t === 'none' ? 0 : parseFloat(t.split(' ')[1] ?? '0'); });

const direction = (el: import('@playwright/test').Locator) => el.locator('.mu-morph-icon > path').first().evaluate((node) => {
  const path = node as SVGPathElement, end = path.getPointAtLength(0), corner = path.getPointAtLength(path.getTotalLength());
  return corner.y < end.y ? 'up' : 'down';
});

for (const colorway of COLORWAYS) {
  test(`keys press alone; the split chevron opens the other ways, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/button-group', colorway);
    const history = play(page).getByRole('group', { name: 'History', exact: true });
    const undo = history.getByRole('button', { name: 'Undo' });
    const redo = history.getByRole('button', { name: 'Redo' });
    const b = (await undo.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect.poll(() => lift(undo)).toBeGreaterThan(0.5);
    expect(await lift(redo)).toBe(0);
    await page.mouse.up();
    await expect(play(page)).toContainText('Undid');

    const zoom = play(page).getByRole('group', { name: 'Zoom' });
    await zoom.getByRole('button', { name: 'Zoom in' }).click();
    await expect(zoom).toContainText('125 %');

    const chevron = play(page).getByRole('button', { name: 'More export options' });
    await chevron.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(chevron.locator('svg')).toHaveClass(/mu-morph-icon/);
    await expect.poll(() => direction(chevron)).toBe('up');
    await page.waitForTimeout(400);
    await page.screenshot({ path: capture(`button-group-${colorway}`), clip: { ...(await play(page).boundingBox())! } });
    await menu.getByRole('menuitem', { name: 'SVG' }).click();
    await expect(play(page)).toContainText('Exported SVG');
    await expect.poll(() => direction(chevron)).toBe('down');
  });
}

for (const colorway of COLORWAYS) {
  test(`machined bar has square faces, fixed seams, readout window and inset focus in ${colorway}`, async ({ page }) => {
    await open(page, '/components/button-group', colorway);
    const demo = play(page);
    const history = demo.getByRole('group', { name: 'History', exact: true });
    const undo = history.getByRole('button', { name: 'Undo', exact: true });
    const redo = history.getByRole('button', { name: 'Redo', exact: true });
    expect(await undo.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('0px');
    expect(await undo.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
    const seam = history.locator('[data-segment="0"]');
    expect(await seam.evaluate((el) => getComputedStyle(el, '::after').width)).toBe('1px');
    expect(await seam.evaluate((el) => getComputedStyle(el, '::after').top)).toBe('6px');
    const start = (await seam.boundingBox())!;
    const b = (await undo.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect.poll(() => lift(undo)).toBeGreaterThan(.5);
    expect(await lift(redo)).toBe(0);
    expect((await seam.boundingBox())!.y).toBe(start.y);
    await page.mouse.up();
    await undo.focus();
    await page.keyboard.press('Tab');
    await expect(redo).toBeFocused();
    expect(await redo.evaluate((el) => getComputedStyle(el).outlineOffset)).toBe('-2px');
    expect(await redo.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    const zoom = demo.getByRole('group', { name: 'Zoom', exact: true });
    const readout = zoom.getByRole('status', { name: 'Zoom level' }); // native output has status semantics
    await expect(readout).toHaveCount(1);
    expect(await readout.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
    expect(await readout.evaluate((el) => el.tagName)).toBe('OUTPUT');
    await zoom.getByRole('button', { name: 'Zoom out' }).click();
    await expect(readout).toContainText('75 %');
    await zoom.getByRole('button', { name: 'Zoom out' }).focus();
    await page.keyboard.press('Tab');
    await expect(zoom.getByRole('button', { name: 'Zoom in' })).toBeFocused();
    const compact = demo.getByRole('group', { name: 'Compact history' });
    expect((await compact.getByRole('button', { name: 'Undo' }).boundingBox())!.height).toBe(26);
    await expect(compact.getByRole('button', { name: 'Redo' })).toBeDisabled();
    for (const key of await demo.getByRole('group', { name: 'Unavailable history' }).getByRole('button').all()) await expect(key).toBeDisabled();
    const chevron = demo.getByRole('button', { name: 'More export options' });
    expect((await chevron.locator('svg').boundingBox())!.width).toBe(12);
    const main = demo.getByRole('button', { name: 'Export PDF' });
    expect(await chevron.evaluate((el) => getComputedStyle(el).color)).toBe(await main.evaluate((el) => getComputedStyle(el).color));
    await chevron.press('ArrowDown');
    await expect(page.getByRole('menu')).toBeVisible();
    await expect.poll(() => lift(chevron)).toBeGreaterThan(.5);
    await page.keyboard.press('Escape');
    await expect(chevron).toBeFocused();
    await expect.poll(() => lift(chevron)).toBe(0);
  });
}

test('latched bar retains lamps and Base UI arrows; rocker has no reduced tilt', async ({ page }) => {
  await open(page, '/components/button-group', 'bone');
  const demo = play(page);
  const latched = demo.getByRole('group', { name: 'Canvas aids' });
  const snap = latched.getByRole('button', { name: 'Snap' });
  const grid = latched.getByRole('button', { name: 'Grid' });
  await expect(snap).toHaveAttribute('aria-pressed', 'true');
  await grid.click();
  await expect(grid).toHaveAttribute('aria-pressed', 'true');
  expect(await grid.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('0px');
  await snap.focus();
  await page.keyboard.press('ArrowRight');
  await expect(grid).toBeFocused();
  await page.keyboard.press('Space');
  await expect(grid).toHaveAttribute('aria-pressed', 'false');
  const rocker = demo.getByRole('group', { name: 'History rocker' });
  const undo = rocker.getByRole('button', { name: 'Undo' });
  await undo.focus();
  await page.keyboard.down('Space');
  await expect.poll(() => rocker.evaluate((el) => parseFloat(getComputedStyle(el).rotate))).toBeLessThan(-.5);
  await page.keyboard.up('Space');
  await expect.poll(() => rocker.evaluate((el) => getComputedStyle(el).rotate)).toMatch(/^(0deg|none)$/);
  await rocker.evaluate((el) => el.setAttribute('data-mu-motion', 'reduce'));
  await page.keyboard.down('Space');
  expect(await rocker.evaluate((el) => getComputedStyle(el).rotate)).toBe('none');
  await page.keyboard.up('Space');
  await page.mouse.move(0, 0);
  await page.screenshot({ path: capture('button-group-reduced'), clip: (await demo.boundingBox())! });
});


test('split glyph cancels into its orientation when the scope reduces during opening', async ({ page }) => {
  await open(page, '/components/button-group', 'bone');
  const key = play(page).getByRole('button', { name: 'More export options' });
  const group = play(page).getByRole('group', { name: 'More export options', exact: true });
  await key.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();
  await group.evaluate(el => el.setAttribute('data-mu-motion', 'reduce'));
  await expect.poll(() => direction(key)).toBe('up');
  const glyph = key.locator('svg');
  expect(await glyph.evaluate(el => getComputedStyle(el).rotate)).toBe('none');
  const landed = await glyph.innerHTML();
  await page.waitForTimeout(150);
  expect(await glyph.innerHTML()).toBe(landed);
  await page.keyboard.press('Escape');
  await expect(key).toBeFocused();
  await expect.poll(() => direction(key)).toBe('down');
  await play(page).screenshot({ path: capture('button-group-reduced') });
});
