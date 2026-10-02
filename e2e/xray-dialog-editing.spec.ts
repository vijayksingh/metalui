import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const CALLOUTS = ['Sheet', 'Opening', 'Focus', 'Place', 'Shadow', 'Layers'];
const FOCUSABLE = ['Name', 'Cancel', 'Rename'];

const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const num = async (card: Locator, name: string) => Number(await value(card, name).textContent());
const style = (target: Locator, prop: string) => target.evaluate((el, p) => (el as HTMLElement).style.getPropertyValue(p), prop);

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/dialog');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`each dialog callout holds the real dialog and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of CALLOUTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-dialog')).toHaveCount(1);
      await expect(card.locator('.ed-specimen .mu-dialog .mu-dialog-title')).toHaveText('Rename canvas');
      await expect(card.locator('.mu-slider, .xr-dial, .xr-dials, .xr-switch')).toHaveCount(0);
      await expect(card.getByRole('switch', { name: 'Open a real dialog' })).toHaveCount(1);
    }
    // the last row opens the real, modal dialog
    await card.getByRole('switch', { name: 'Open a real dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}

test('the sheet dims the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Sheet');
  const start = await num(card, 'Dim');
  const sheet = card.locator('.ed-dlg-scrim');
  const before = await style(sheet, 'background');
  const bench = await style(xray.locator('.xr-sheet3d'), 'background');
  await drag(page, card.getByRole('slider', { name: 'Dim' }), 0, -40);
  await expect(value(card, 'Dim')).not.toHaveText(String(start));
  expect(await num(card, 'Dim')).toBeGreaterThan(start);
  expect(await style(sheet, 'background')).not.toBe(before);
  expect(await style(xray.locator('.xr-sheet3d'), 'background')).not.toBe(bench);
});

test('pulling the dialog up sets how far it drops in, on the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Opening');
  const start = await num(card, 'Drops');
  await drag(page, card.getByRole('slider', { name: 'Drop' }), 0, -8);
  const rise = await num(card, 'Drops');
  expect(rise).toBeGreaterThan(start);
  // let go and both the specimen and the bench arrive from that far up
  const froms = () => page.evaluate(() => document.getAnimations().map((a) => {
    const t = (a.effect as KeyframeEffect).target as HTMLElement;
    return { bench: !!t.closest('.xr-bench'), from: String((a.effect as KeyframeEffect).getKeyframes()[0].transform ?? '') };
  }));
  await card.getByRole('slider', { name: 'Drop' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Drops')).toHaveText(String(rise + 1));
  const played = await froms();
  expect(played.some((a) => !a.bench && a.from.includes(`translateY(-${rise + 1}px)`))).toBe(true);
  expect(played.some((a) => a.bench && /translateY\(-[\d.]+px\)/.test(a.from) && !a.from.includes(`-${rise + 1}px)`))).toBe(true);
});

test('the focus ring steps between the real stops and never lands between them', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Focus');
  const ring = card.getByRole('slider', { name: 'Focus' });
  const first = await ring.getAttribute('aria-valuetext');
  expect(FOCUSABLE).toContain(first);
  // a small nudge only leans
  await drag(page, ring, 4, 0);
  await expect(ring).toHaveAttribute('aria-valuetext', first!);
  // far enough, it snaps to another stop
  await drag(page, ring, 10, 6);
  const next = await ring.getAttribute('aria-valuetext');
  expect(FOCUSABLE).toContain(next);
  expect(next).not.toBe(first);
  await expect(value(card, 'Focus')).toHaveText(next!);
  // the bench rings the same thing
  const benchFocus = xray.locator('.xr-bench .is-focus');
  await expect(benchFocus).toHaveText(next === 'Name' ? 'Trip notes' : next!);
  // arrows step it too; Escape closes it and focus goes back to the button
  await ring.focus();
  await page.keyboard.press('ArrowRight');
  await expect(ring).not.toHaveAttribute('aria-valuetext', next!);
  await page.keyboard.press('Escape');
  await expect(card.getByRole('switch', { name: 'Dialog open' })).toHaveAttribute('aria-checked', 'false');
  await expect(xray.locator('.xr-dialogwrap')).toHaveCount(0);
  await expect(value(card, 'Focus')).toHaveText('the button');
  await card.getByRole('switch', { name: 'Dialog open' }).click();
  await expect(xray.locator('.xr-dialogwrap')).toHaveCount(1);
  await expect(ring).toHaveAttribute('aria-valuetext', 'Name');
});

test('place and shadow handles move the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Place');
  const top = await num(card, 'From the top');
  const place = card.locator('.ed-dlg-place');
  const at = await style(place, 'top');
  const bench = await style(xray.locator('.xr-dialogwrap .xr-thumb'), 'transform');
  await drag(page, card.getByRole('slider', { name: 'Distance from the top' }), 0, 30);
  expect(await num(card, 'From the top')).toBeGreaterThan(top);
  expect(await style(place, 'top')).not.toBe(at);
  expect(await style(xray.locator('.xr-dialogwrap .xr-thumb'), 'transform')).not.toBe(bench);

  await part(xray, 'Shadow');
  const lift = await value(card, 'Height').textContent();
  const shadow = await style(card.locator('.ed-specimen .mu-dialog'), 'box-shadow');
  const z = await style(xray.locator('.xr-dialogwrap .xr-face').last(), 'transform');
  await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -30);
  await expect(value(card, 'Height')).not.toHaveText(lift!);
  expect(await style(card.locator('.ed-specimen .mu-dialog'), 'box-shadow')).not.toBe(shadow);
  expect(await style(xray.locator('.xr-dialogwrap .xr-face').last(), 'transform')).not.toBe(z);
});

test('layer switches take the same layer off the specimen and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const dialog = card.locator('.ed-specimen .mu-dialog');
  const plate = xray.locator('.xr-face.is-layer').filter({ hasText: 'Plate' });
  await expect(plate).not.toHaveClass(/is-off/);
  await card.getByRole('switch', { name: 'Plate' }).click();
  await expect(card.getByRole('switch', { name: 'Plate' })).toHaveAttribute('aria-checked', 'false');
  expect(await style(dialog, 'background')).toBe('transparent');
  await expect(plate).toHaveClass(/is-off/);
  const shadow = await style(dialog, 'box-shadow');
  await card.getByRole('switch', { name: 'Far shadow' }).click();
  expect(await style(dialog, 'box-shadow')).not.toBe(shadow);
  await expect(xray.locator('.xr-face.is-layer').filter({ hasText: 'Far shadow' })).toHaveClass(/is-off/);
  // hovering a row points at its slice on the bench
  await card.locator('.ed-layer').filter({ hasText: 'Rim' }).hover();
  await expect(xray.locator('.xr-face.is-layer').filter({ hasText: 'Rim' })).toHaveClass(/is-focus/);
});

test('readouts scrub by drag and by arrows; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Sheet');
  const start = await num(card, 'Dim');
  await drag(page, readout(card, 'Dim'), 0, -24);
  const scrubbed = await num(card, 'Dim');
  expect(scrubbed).toBeGreaterThan(start);
  await readout(card, 'Dim').focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Dim')).toHaveText(String(scrubbed - 5));
  await card.getByRole('slider', { name: 'Dim' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Dim');

  await part(xray, 'Place');
  const top = await num(card, 'From the top');
  await readout(card, 'From the top').focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'From the top')).toHaveText(String(top + 1));
  await card.getByRole('slider', { name: 'Distance from the top' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Distance from the top');
});

test('at 375 px wide in graphite every card fits with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of CALLOUTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-dialog')).toHaveCount(1);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
    const well = await card.locator('.ed-specimen').boundingBox();
    const win = await card.locator('.ed-dlg-win').boundingBox();
    expect(win!.x).toBeGreaterThanOrEqual(well!.x);
    expect(win!.x + win!.width).toBeLessThanOrEqual(well!.x + well!.width + 0.5);
  }
});
