import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The x-ray's editing layer: the card holds the real button (a specimen) to change by handling
// it, never a slider. Its handles, readouts and switches change the same model the bench draws.

async function openButtonXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="button"]');
  await page.locator('[data-float="button"] button').click({ force: true });
  await page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
  return page.locator('.xr-overlay');
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, label: string) => card.locator('.ed-readout').filter({ hasText: label }).locator('.ed-roll > span:not(.is-out)');
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

for (const colorway of COLORWAYS) {
  test(`every part of the button x-ray is handled, not slid, in ${colorway}`, async ({ page }) => {
    const xray = await openButtonXray(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of ['Shape', 'Type', 'Light', 'Shadow', 'Press', 'Layers']) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-button')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial')).toHaveCount(0);
    }
    await part(xray, 'Shape');
    await page.screenshot({ path: capture(`xray-editing-shape-${colorway}`), clip: (await xray.locator('.xr').boundingBox())! });
  });
}

test('shape: the primary button has one size; padding and corners are handles the model follows', async ({ page }) => {
  const xray = await openButtonXray(page, 'bone');
  const card = xray.locator('.xr-card');
  // a primary button comes in one size, so its size is not a handle and does not scrub
  await expect(card.locator('.ed-edge.is-y')).toHaveCount(0);
  await expect(card.locator('.ed-readout[data-scrub]').filter({ hasText: 'size' })).toHaveCount(0);
  const face = xray.locator('.xr-face').first();
  const width0 = await face.evaluate((el) => parseFloat((el as HTMLElement).style.width));
  // hover the button, then the right end: the hint tag says what it does, above the button
  await card.locator('.ed-box').hover();
  await card.locator('.ed-edge.is-x').hover();
  await expect(page.locator('.ed-tag')).toContainText('Padding');
  await drag(page, card.locator('.ed-edge.is-x'), 10, 0);
  await expect(readout(card, 'padding')).not.toHaveText('15');
  expect(await face.evaluate((el) => parseFloat((el as HTMLElement).style.width))).toBeGreaterThan(width0);
  // the corner arc squares the corners, on the specimen and the model alike
  await card.locator('.ed-box').hover();
  await drag(page, card.locator('.ed-corner'), -40, -40);
  await expect(readout(card, 'corners')).toHaveText('0');
  await expect(face).toHaveCSS('border-radius', '0px');
});

test('readouts scrub: dragging one up steps its value, and the arrows do the same', async ({ page }) => {
  const xray = await openButtonXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'size' }), 0, -24);
  await expect(readout(card, 'size')).toHaveText('14');
  await card.locator('.ed-readout').filter({ hasText: 'spacing' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(readout(card, 'spacing')).toHaveText('-0.010');
  await expect(xray.locator('.xr-label')).toHaveCSS('font-weight', '500');
  await card.locator('.ed-readout').filter({ hasText: 'weight' }).click();
  await expect(xray.locator('.xr-label')).toHaveCSS('font-weight', '600');
});

test('light, shadow and press are handled on the specimen and felt on the model', async ({ page }) => {
  const xray = await openButtonXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Light');
  await drag(page, card.locator('.ed-sun'), 40, 10);
  await expect(readout(card, 'from')).not.toHaveText('top');
  await part(xray, 'Shadow');
  const cap = xray.locator('.xr-cap');
  const z0 = await cap.evaluate((el) => (el as HTMLElement).style.transform);
  await drag(page, card.locator('.ed-lift'), 0, -14);
  await expect(readout(card, 'height')).not.toHaveText('1.0');
  expect(await cap.evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(z0);
  await part(xray, 'Press');
  const b = (await card.locator('.ed-specimen .mu-button').boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 12, { steps: 6 });
  // held: the model sinks with the specimen
  await expect(cap).not.toHaveCSS('transform', await cap.evaluate((el) => getComputedStyle(el).transform));
  await page.mouse.up();
  await expect(readout(card, 'sinks')).not.toHaveText('1');
});

test('layers are switches: turning one off takes it off the model', async ({ page }) => {
  const xray = await openButtonXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  await expect(xray.locator('.xr-shadow.is-drop')).toHaveCount(1);
  const drop = card.locator('.ed-layer').filter({ hasText: 'Drop' });
  await drop.locator('.mu-row-text').click();
  await expect(drop.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await expect(xray.locator('.xr-shadow.is-drop')).toHaveCount(0);
  await drop.getByRole('switch').click();
  await expect(xray.locator('.xr-shadow.is-drop')).toHaveCount(1);
});
