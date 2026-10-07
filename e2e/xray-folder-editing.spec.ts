import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The folder x-ray: every callout holds the real folder, handled, and the bench model (planes of the real folder) follows.
const SPOTS = ['Drop in', 'Paper', 'Fan', 'Flap', 'Glass', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}:"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ has: card.page().locator('b', { hasText: new RegExp(`^${name}$`) }) });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const folderVar = (card: Locator, prop: string) => card.locator('.ed-specimen .mu-folder').evaluate((el, p) => (el as HTMLElement).style.getPropertyValue(p), prop);

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
  await page.goto('/components/folder');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`each folder callout holds the real folder and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of SPOTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-folder')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .xr-switch, .xr-proof')).toHaveCount(0);
    }
  });
}

test('dropping the block onto the folder puts it in, on the card and on the bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Drop in');
  await expect(value(card, 'Blocks')).toHaveText('3');
  const block = card.locator('.ed-folder-block');
  const folder = card.locator('.ed-specimen .mu-folder');
  // the card settles in below the bench: bring the whole well to the middle of the view first
  await card.locator('.ed-specimen').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  const from = (await block.boundingBox())!, to = (await folder.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  // coming over, the folder opens wide
  await expect.poll(() => folder.getAttribute('data-open')).not.toBeNull();
  await page.mouse.up();
  await expect(value(card, 'Blocks')).toHaveText('4');
  await expect(folder.locator('.mu-folder-count')).toHaveText('4');
  await expect(xray.locator('.xr-segface.is-fflap .mu-folder-count')).toHaveText('4');
  // the keyboard puts one in too
  await block.focus();
  await page.keyboard.press('Enter');
  await expect(value(card, 'Blocks')).toHaveText('5');
});

test('the tab leans toward the next paper and snaps there, never between', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Paper');
  const tab = card.getByRole('slider', { name: 'Colour' });
  const hue = () => card.locator('.ed-specimen .mu-folder').getAttribute('data-hue');
  await expect(tab).toHaveAttribute('aria-valuetext', 'Neutral');
  const zoom = Number(await card.locator('.ed-specimen > div').evaluate((el) => (el as HTMLElement).style.zoom));
  // a nudge short of a step only leans
  await drag(page, tab, 4 * zoom, 0);
  expect(await hue()).toBe('neutral');
  // a step's worth snaps to the next paper on the card and the bench
  await drag(page, tab, 9 * zoom, 0);
  expect(await hue()).toBe('red');
  await expect(tab).toHaveAttribute('aria-valuetext', 'Red');
  await expect(xray.locator('.xr-segface.is-fback .mu-folder')).toHaveAttribute('data-hue', 'red');
  // the readout steps it with the keyboard
  await tab.focus();
  await page.keyboard.press('ArrowRight');
  expect(await hue()).toBe('amber');
});

test('the front block raises the fan on the card and the bench, and the readout scrubs it', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Fan');
  const front = card.getByRole('slider', { name: 'Fan' });
  const rise0 = Number(await front.getAttribute('aria-valuenow'));
  const bench = () => xray.locator('.xr-segface.is-fcards .mu-folder').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--mu-r-folder-fan-rest-y-front'));
  expect(await bench()).toBe('');
  await drag(page, front, 0, -30);
  const rise = Number(await front.getAttribute('aria-valuenow'));
  expect(rise).toBeGreaterThan(rise0);
  expect(await folderVar(card, '--mu-r-folder-fan-rest-y-front')).toBe(`${-rise}px`);
  expect(await bench()).toBe(`${-rise}px`);
  await expect(value(card, 'Rise')).toHaveText(`${rise}`);
  // keyboard focus shows its tag; ↑ raises it one more
  await front.focus();
  await expect(page.locator('.ed-tag')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(front).toHaveAttribute('aria-valuenow', `${Math.round((rise + 1) * 10) / 10}`);
});

test('the flap tips by its top edge and catches where it rests', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Flap');
  const edge = card.getByRole('slider', { name: 'Tilt' });
  const rest = Number(await edge.getAttribute('aria-valuenow'));
  await drag(page, edge, 0, -24);
  const tipped = Number(await edge.getAttribute('aria-valuenow'));
  expect(tipped).toBeGreaterThan(rest);
  expect(await folderVar(card, '--mu-r-folder-flap-rest')).toBe(`${-tipped}deg`);
  // back to just short of rest (in the card's units): it catches there
  const zoom = Number(await card.locator('.ed-specimen > div').evaluate((el) => (el as HTMLElement).style.zoom));
  await drag(page, edge, 0, ((tipped - rest - 1) / 0.8) * zoom);
  await expect(edge).toHaveAttribute('aria-valuenow', `${rest}`);
});

test('a layer switched off leaves the folder, through the recipe value that leaves it out', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  // the blocks are what it holds, not a layer: no switch for them
  await expect(card.getByRole('switch', { name: 'Blocks' })).toHaveCount(0);
  await card.getByRole('switch', { name: 'Frost' }).click();
  expect(await folderVar(card, '--mu-r-folder-flap-frost')).toBe('none');
  await expect(xray.locator('.xr-fplane.is-off')).toHaveCount(1);
  await expect(xray.locator('.xr-fplane.is-off .mu-folder')).toHaveAttribute('style', /--mu-r-folder-flap-frost:\s*none/);
});

test('the folder on the home page opens its x-ray', async ({ page }) => {
  await page.goto('/');
  // it drifts, so it is never still enough for a plain click
  await page.locator('[data-float="folder"] .mu-folder').click({ force: true });
  await expect(page.locator('.xr-overlay .xr-card')).toContainText('Drop in');
});

for (const colorway of COLORWAYS) {
  test(`375 px ${colorway}: every folder card fits without sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const xray = await openDocs(page, colorway);
    for (const name of SPOTS) {
      await part(xray, name);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  });
}
