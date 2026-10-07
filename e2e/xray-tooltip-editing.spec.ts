import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The Tooltip x-ray's cards hold a real tool with its real tooltip; the tooltip is the
// component's own popup (portalled to the page), and its handles ride inside it. The bench's label
// is the chip itself (the popup's markup), so what a handle changes shows there as computed style.
const CALLOUTS = ['Timing', 'Type', 'Place', 'Shape', 'Shadow', 'Layers'];
const SIDES = ['above', 'right', 'below', 'left'];

const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const style = (target: Locator, name: string) => target.evaluate((el, property) => getComputedStyle(el).getPropertyValue(property), name);
const inline = (target: Locator, name: string) => target.evaluate((el, property) => (el as HTMLElement).style.getPropertyValue(property), name);

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}
async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/tooltip');
  await page.waitForSelector('main h1');
  await page.addStyleTag({ content: 'body > #root header { position: static !important; }' });
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`each Tooltip callout holds a real tool and tooltip, and no old controls, in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of CALLOUTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-icon-button').first()).toBeVisible();
      await expect(card.locator('.mu-slider, .xr-dial, .mu-switcher')).toHaveCount(0);
      // every card but Timing holds the real tooltip open (Timing's shows when you point)
      if (name !== 'Timing') await expect(page.locator('.ed-tip.mu-tooltip')).toHaveCount(1);
    }
  });
}

test('Timing: pointing at the real tool shows its tooltip on the specimen and the bench; the wait scrubs', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Timing');
  const tool = card.getByRole('button', { name: 'Select' });
  await tool.scrollIntoViewIfNeeded();
  await expect(xray.locator('.xr-tiplift')).not.toHaveClass(/is-shown/);
  await tool.hover();
  await expect(page.locator('.ed-tip.mu-tooltip')).toBeVisible();
  await expect(xray.locator('.xr-tiplift')).toHaveClass(/is-shown/);
  await page.mouse.move(5, 5);
  await expect(xray.locator('.xr-tiplift')).not.toHaveClass(/is-shown/);
  // the wait has no place on the component: a readout, by drag and by arrows
  const wait = value(card, 'Wait');
  const start = Number(await wait.textContent());
  await drag(page, readout(card, 'Wait'), 0, -24);
  await expect(wait).not.toHaveText(`${start}`);
  expect(Number(await wait.textContent())).toBeGreaterThan(start);
  const mid = Number(await wait.textContent());
  await readout(card, 'Wait').focus();
  await page.keyboard.press('ArrowDown');
  await expect(wait).toHaveText(`${mid - 10}`);
});

test('Type: the key switch changes the real tooltip and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const tip = page.locator('.ed-tip.mu-tooltip');
  await expect(tip.locator('.mu-tooltip-key')).toHaveCount(1);
  await expect(xray.locator('.xr-segface.is-tip .mu-tooltip')).toContainText('· V');
  const key = card.getByRole('switch', { name: 'Show the key' });
  await key.click();
  await expect(key).toHaveAttribute('aria-checked', 'false');
  await expect(tip.locator('.mu-tooltip-key')).toHaveCount(0);
  await expect(xray.locator('.xr-segface.is-tip .mu-tooltip')).not.toContainText('· V');
});

test('Place: the label steps between its real sides (lean, then snap), and its near edge tunes the gap', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Place');
  const side = page.getByRole('slider', { name: 'Side' });
  const at = xray.locator('.xr-tipat');
  const start = (await side.getAttribute('aria-valuetext'))!;
  expect(SIDES).toContain(start);
  const bench0 = await inline(at, 'transform');
  // a short drag only leans: the outline of the target side lights, the tooltip stays put
  await side.scrollIntoViewIfNeeded();
  const box = (await side.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 8, y, { steps: 4 });
  await expect(page.locator('.ed-tip-ghost')).toHaveCount(1);
  await expect(side).toHaveAttribute('aria-valuetext', start);
  // further, and it snaps to the right; never anything between
  await page.mouse.move(x + 40, y, { steps: 6 });
  await page.mouse.up();
  await expect(side).toHaveAttribute('aria-valuetext', 'right');
  expect(SIDES).toContain(await side.getAttribute('aria-valuetext'));
  await expect(page.locator('.ed-tip-ghost')).toHaveCount(0);
  await expect.poll(() => inline(at, 'transform')).not.toBe(bench0);
  // the real popup now sits to the right of the tool
  const tool = (await card.getByRole('button', { name: 'Select' }).boundingBox())!;
  await expect.poll(async () => (await page.locator('.ed-tip.mu-tooltip').boundingBox())!.x).toBeGreaterThan(tool.x + tool.width - 1);

  // the gap: drag the edge that faces the tool away from it
  const gap = page.getByRole('slider', { name: 'Gap' });
  const gap0 = Number(await gap.getAttribute('aria-valuenow'));
  const tip0 = (await page.locator('.ed-tip.mu-tooltip').boundingBox())!.x;
  const benchGap0 = await inline(at, 'transform');
  await drag(page, gap, 24, 0);
  await expect(gap).not.toHaveAttribute('aria-valuenow', `${gap0}`);
  expect(Number(await gap.getAttribute('aria-valuenow'))).toBeGreaterThan(gap0);
  await expect.poll(async () => (await page.locator('.ed-tip.mu-tooltip').boundingBox())!.x).toBeGreaterThan(tip0);
  expect(await inline(at, 'transform')).not.toBe(benchGap0);

  // the side readout steps through the real sides only
  await readout(card, 'Side').focus();
  await page.keyboard.press('ArrowUp');
  expect(SIDES).toContain(await value(card, 'Side').textContent());
  await expect(value(card, 'Side')).toHaveText('below');

  // keyboard on the handle: its hint shows above the label
  await side.focus();
  await page.keyboard.press('ArrowUp');
  await expect(side).toHaveAttribute('aria-valuetext', 'above');
  await expect(page.locator('.ed-tag')).toContainText('Side');
});

test('Shape: the right end and the corner tune the real label and the bench; long note wraps', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const tip = page.locator('.ed-tip.mu-tooltip');
  const label = xray.locator('.xr-segface.is-tip .mu-tooltip');
  const pad = page.getByRole('slider', { name: 'Space on the sides' });
  const pad0 = await style(tip, 'padding-right');
  const benchPad0 = await style(label, 'padding-right');
  await drag(page, pad, 30, 0);
  expect(await style(tip, 'padding-right')).not.toBe(pad0);
  expect(await style(label, 'padding-right')).not.toBe(benchPad0);
  const corners = page.getByRole('slider', { name: 'Corners' });
  const r0 = await style(tip, 'border-top-left-radius');
  const benchR0 = await style(label, 'border-top-left-radius');
  await drag(page, corners, -14, -14);
  expect(await style(tip, 'border-top-left-radius')).not.toBe(r0);
  expect(await style(label, 'border-top-left-radius')).not.toBe(benchR0);
  // readouts: a drag and the arrows
  const padValue = value(card, 'Space on the sides');
  const before = Number(await padValue.textContent());
  await drag(page, readout(card, 'Space on the sides'), 0, -24);
  expect(Number(await padValue.textContent())).toBeGreaterThan(before);
  const cornerValue = value(card, 'Corners');
  const c0 = await cornerValue.textContent();
  await readout(card, 'Corners').focus();
  await page.keyboard.press('ArrowDown');
  await expect(cornerValue).not.toHaveText(c0!);
  // long note
  const h0 = (await tip.boundingBox())!.height;
  await card.getByRole('switch', { name: 'Long note' }).click();
  await expect(tip).toContainText('Made from a message');
  await expect(label).toContainText('Made from a message');
  await expect.poll(async () => (await tip.boundingBox())!.height).toBeGreaterThan(h0);
  // keyboard focus on a handle shows its hint
  await pad.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.ed-tag')).toContainText('Space on the sides');
});

test('Shadow and Layers: lifting the label and switching layers change the real label and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shadow');
  const tip = page.locator('.ed-tip.mu-tooltip');
  const lift = page.getByRole('slider', { name: 'Height above the page' });
  const shadow0 = await style(tip, 'box-shadow');
  const bench0 = await inline(xray.locator('.xr-tiplift'), 'transform');
  const lift0 = Number(await lift.getAttribute('aria-valuenow'));
  await drag(page, lift, 0, -40);
  expect(Number(await lift.getAttribute('aria-valuenow'))).toBeGreaterThan(lift0);
  expect(await style(tip, 'box-shadow')).not.toBe(shadow0);
  expect(await inline(xray.locator('.xr-tiplift'), 'transform')).not.toBe(bench0);
  await lift.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.ed-tag')).toContainText('Height above the page');

  await part(xray, 'Layers');
  const far = card.getByRole('switch', { name: 'Far shadow' });
  const layered0 = await style(tip, 'box-shadow');
  await far.click();
  await expect(far).toHaveAttribute('aria-checked', 'false');
  expect(await style(tip, 'box-shadow')).not.toBe(layered0);
  await expect(xray.locator('.xr-face.is-layer.is-off').filter({ hasText: 'Far shadow' })).toHaveCount(1);
  await card.locator('.ed-layer').filter({ hasText: 'Rim' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus').filter({ hasText: 'Rim' })).toHaveCount(1);
});

test('375 px graphite: every card fits without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of CALLOUTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-icon-button').first()).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
  }
  // the label on a side still fits
  await part(xray, 'Place');
  await card.locator('.ed-readout').filter({ hasText: 'Side' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Side')).toHaveText('right');
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
});
