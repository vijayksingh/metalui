import { expect, test, type Locator } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { ICON_NAMES } from '../packages/metalui/src/icons/catalog.generated';
import { MORPH_NAMES } from '../packages/metalui/src/icons/morph.generated';

const captures = 'docs/captures/review/icon-morph';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

/** Every frame the glyph draws for the next 550ms. */
const framesOf = (glyph: Locator) => glyph.evaluate(async el => {
  const frames: string[] = [];
  const until = performance.now() + 550;
  while (performance.now() < until) { await new Promise(requestAnimationFrame); frames.push(el.innerHTML); }
  return frames;
});

test('morph has its own page, and old links to the guide section reach it', async ({ page }) => {
  await page.goto('/icons#morph');
  await expect(page).toHaveURL('/icons/morph');
  await expect(page.getByRole('heading', { name: 'Morph', level: 1 })).toBeVisible();
  const nav = page.getByRole('complementary', { name: 'Documentation' });
  await expect(nav.getByRole('link', { name: 'Icons', exact: true })).toHaveAttribute('aria-current', 'location');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('li')).toHaveText(['MetalUI', 'Icons', 'Morph']);
  await page.goto('/icons');
  await page.getByRole('navigation', { name: 'Icon guides' }).getByRole('link', { name: 'Morph' }).click();
  await expect(page).toHaveURL('/icons/morph');
  await page.goto('/icons/guide');
  await page.locator('#morph').getByRole('link', { name: 'their own page' }).click();
  await expect(page).toHaveURL('/icons/morph');
});

test('pressing a control morphs its glyph through in-between frames and turns its label', async ({ page }) => {
  await page.goto('/icons/morph');
  const sync = page.locator('[data-morph-control="sync"]');
  const glyph = sync.locator('svg[data-glyph]');
  await expect(sync).toHaveAccessibleName('Synced');
  await expect(glyph).toHaveAttribute('data-glyph', 'synced');
  const start = await glyph.innerHTML();
  await sync.click();
  await expect(glyph).toHaveAttribute('data-glyph', 'offline');
  const frames = await framesOf(glyph);
  expect(frames.some(frame => frame !== start && frame !== frames.at(-1))).toBe(true);
  await expect(sync).toHaveAccessibleName('Offline');
  // A direction is a turn of one glyph.
  const disclosure = page.getByRole('button', { name: 'More', exact: true });
  await disclosure.click();
  const less = page.getByRole('button', { name: 'Less', exact: true });
  await expect(less).toHaveAttribute('aria-expanded', 'true');
  await expect(less.locator('svg[data-glyph]')).toHaveAttribute('data-turn', '180');
});

test('reduced motion changes glyphs in place; both colorways and a phone stay in bounds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/icons/morph');
  const transport = page.locator('[data-morph-control="transport"]');
  const glyph = transport.locator('svg[data-glyph]');
  await transport.click();
  await expect(glyph).toHaveAttribute('data-glyph', 'pause');
  const frames = await framesOf(glyph);
  expect(new Set(frames).size).toBe(1);
  for (const colorway of ['Bone', 'Graphite']) {
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${captures}/top-${colorway.toLowerCase()}.png` });
    await page.locator('#in-controls').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${captures}/controls-${colorway.toLowerCase()}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${captures}/mobile.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a glyph page morphs the glyph into the glyphs it becomes most easily', async ({ page }) => {
  await page.goto('/icons/synced');
  const keys = page.getByRole('radiogroup', { name: 'Morph into' });
  // Ranked by the planner's strain: Offline is synced's nearest state.
  await expect(keys.getByRole('radio')).toHaveCount(7);
  await expect(keys.getByRole('radio').nth(1)).toHaveAccessibleName('Offline');
  await expect(keys.getByRole('radio', { name: 'Synced' })).toBeChecked();
  const stage = page.locator('.icon-morph-stage svg[data-glyph]');
  await keys.getByRole('radio', { name: 'Offline' }).click();
  await expect(stage).toHaveAttribute('data-glyph', 'offline');
  await expect(page.locator('.icon-morph-readout')).toHaveText(/^synced → offline · strain 0\.\d\d · reads as one object changing$/);
  await expect(page.locator('#morph pre, #morph code').first()).toContainText("on ? 'offline' : 'synced'");
  await page.locator('#morph').screenshot({ path: 'docs/captures/review/icon-morph/glyph-page-synced.png' });
  // Outside the family: the solid character glyph rides the drum.
  const outside = ICON_NAMES.filter(name => !(MORPH_NAMES as readonly string[]).includes(name));
  expect(outside).toHaveLength(1);
  await page.goto(`/icons/${outside[0]}`);
  await expect(page.locator('#morph')).toContainText('changes on the drum');
  await expect(page.getByRole('radiogroup', { name: 'Morph into' })).toHaveCount(0);
  // Life glyphs are not controls and do not morph.
  await page.goto('/icons/life/breakfast');
  await expect(page.getByRole('heading', { name: 'Breakfast', level: 1 })).toBeVisible();
  await expect(page.locator('#morph')).toHaveCount(0);
});
