import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`waiting belongs to each real host in ${colorway}`, async ({ page }) => {
    await open(page, '/components/spinner', colorway);
    const item = page.getByTestId('waiting-item');
    await item.getByRole('button', { name: 'Upload' }).click();
    await expect(item).toHaveAttribute('aria-busy', 'true');
    await expect(item.locator('.mu-spinner-arc')).toBeVisible();
    await expect(item.getByRole('button', { name: 'Upload' })).toBeDisabled();
    const ink = await item.locator('.mu-spinner').evaluate((el) => ({ ink: getComputedStyle(el).color, well: getComputedStyle(el).boxShadow, width: el.getBoundingClientRect().width }));
    expect(ink.well).toBe('none'); expect(ink.width).toBe(16);
    expect(ink.ink).toBe(await item.locator('.mu-row-lead').evaluate((el) => getComputedStyle(el.querySelector('span')!).color));
    await page.getByTestId('waiting-background').getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByText('1 local edits.', { exact: false })).toBeVisible();
    await expect(item).toHaveAttribute('data-phase', 'done');
    await expect(item.locator('.waiting-check-fade')).toHaveCSS('opacity', '0');
    await expect(item.locator('.mu-spinner-arc')).toHaveCount(0);

    const card = page.getByTestId('waiting-card'); const place = page.getByTestId('waiting-place');
    const before = await card.boundingBox();
    await card.getByRole('button', { name: 'Build preview' }).click();
    await place.getByRole('button', { name: 'Open library' }).click();
    await expect(card.locator('.mu-skeleton')).not.toHaveCount(0);
    await expect(card.getByRole('progressbar')).toBeVisible();
    expect(Math.abs((await card.boundingBox())!.height - before!.height)).toBeLessThanOrEqual(1);
    await expect(card.locator('.mu-spinner-arc')).toHaveCount(0);
    await expect(place.getByRole('progressbar')).toBeVisible();
    const height = await place.locator('.mu-progress-track').evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBe(1);
    await page.getByTestId('waiting-placements').screenshot({ path: capture(`spinner-${colorway}`) });
    await expect(card).toHaveAttribute('data-phase', 'done');
    await expect(place).toHaveAttribute('data-phase', 'done');
    await expect(card.locator('.mu-skeleton')).toHaveCount(0);
  });
}

test('search reserves its trailing slot and typing cancels stale replies', async ({ page }) => {
  await open(page, '/components/spinner', 'bone');
  const field = page.getByTestId('waiting-field');
  const input = field.getByRole('textbox', { name: 'Search subjects' });
  await field.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(field).toHaveAttribute('aria-busy', 'true');
  await expect(field.getByRole('button', { name: 'Clear search' })).toHaveCount(0);
  await expect(field.locator('.mu-spinner-arc')).toBeVisible();
  await expect(input).toBeEnabled();
  await input.fill('another subject');
  await expect(field).toHaveAttribute('aria-busy', 'false');
  await expect(field.getByRole('button', { name: 'Clear search' })).toBeVisible();
  await page.waitForTimeout(2600);
  await expect(field.getByText('Found', { exact: false })).toHaveCount(0);
  await expect(input).toHaveValue('another subject');
});

test('background wait remains local and reduced motion pauses travel', async ({ page }) => {
  await open(page, '/components/spinner', 'graphite');
  const sync = page.getByTestId('waiting-background');
  await sync.getByRole('button', { name: 'Sync now' }).click();
  await expect(sync.locator('.mu-led')).toHaveAttribute('data-gesture', 'breathe');
  await sync.getByRole('button', { name: 'Keep editing' }).click();
  await expect(sync).toContainText('1 local edits');
  await page.getByTestId('waiting-placements').evaluate((el) => el.setAttribute('data-mu-motion', 'reduce'));
  const item = page.getByTestId('waiting-item');
  await item.getByRole('button', { name: 'Upload' }).click();
  const arc = item.locator('.mu-spinner-arc');
  await expect(arc).toHaveCSS('animation-name', 'mu-progress-breathe');
  await expect(arc).toHaveCSS('rotate', 'none');
  const card = page.getByTestId('waiting-card');
  await card.getByRole('button', { name: 'Build preview' }).click();
  await expect(card.locator('.mu-skeleton').first()).toBeVisible();
  expect(await card.locator('.mu-skeleton').first().evaluate((el) => getComputedStyle(el, '::after').animationName)).toBe('none');
  await page.getByTestId('waiting-placements').screenshot({ path: capture('spinner-reduced') });
});

test('a visible arc pauses offscreen and idle hosts run no waiting animations', async ({ page }) => {
  await open(page, '/components/spinner', 'bone');
  await expect(page.locator('.mu-spinner-arc')).toHaveCount(0);
  const item = page.getByTestId('waiting-item');
  await item.getByRole('button', { name: 'Upload' }).click();
  await expect(item.locator('.mu-spinner-arc')).toBeVisible();
  const speed = await item.locator('.mu-spinner-arc').evaluate(async (el) => {
    const angle = () => parseFloat(getComputedStyle(el).rotate) || 0;
    const a = angle(), start = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 150));
    return ((angle() - a + 360) % 360) / (performance.now() - start);
  });
  expect(speed).toBeCloseTo(.4, 1);
  await page.locator('section').last().scrollIntoViewIfNeeded();
  await expect(item.locator('.mu-spinner-arc')).toHaveCSS('animation-play-state', 'paused');
});

async function setDial(page: import('@playwright/test').Page, label: string, value: number) {
  if (await page.locator('.dialkit-panel-inner[data-collapsed="true"]').count()) await page.locator('.dialkit-panel-inner[data-collapsed="true"]').first().click();
  const control = page.locator('.dialkit-slider', { has: page.locator('.dialkit-slider-label', { hasText: new RegExp(`^${label.replace(/([A-Z])/g, ' $1')}$`, 'i') }) });
  await control.locator('.dialkit-slider-value').hover();
  await control.locator('.dialkit-slider-value-editable').click();
  await control.locator('input').fill(String(value));
  await control.locator('input').press('Enter');
}

test('shared timing skips fast work, holds shown work and explains long work once', async ({ page }) => {
  await open(page, '/components/spinner', 'bone');
  await setDial(page, 'latency', 100);
  const item = page.getByTestId('waiting-item');
  const fast = await item.evaluate(async (el) => {
    let shown = false;
    const observer = new MutationObserver(() => { if (el.querySelector('.mu-spinner-arc')) shown = true; });
    observer.observe(el, { childList: true, subtree: true });
    (el.querySelector('button') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 500)); observer.disconnect(); return shown;
  });
  expect(fast).toBe(false);
  await setDial(page, 'latency', 450);
  const timing = await item.evaluate(async (el) => {
    let start = 0, end = 0;
    const observer = new MutationObserver(() => {
      if (el.getAttribute('data-phase') === 'waiting' && !start) start = performance.now();
      if (start && el.getAttribute('data-phase') === 'done') end = performance.now();
    });
    observer.observe(el, { attributes: true });
    (el.querySelector('button') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 1000)); observer.disconnect(); return end - start;
  });
  expect(timing).toBeGreaterThanOrEqual(280);
  await setDial(page, 'latency', 3000); await setDial(page, 'longAfter', 1000);
  await item.getByRole('button', { name: 'Upload' }).click();
  await expect(item).toContainText('Still uploading…');
  await expect(item).toHaveAttribute('data-phase', 'done');
  await expect(item).not.toContainText('Still uploading…');
});

test('failure retains each host and permits a retry', async ({ page }) => {
  await open(page, '/components/spinner', 'bone');
  await setDial(page, 'latency', 600);
  const toggle = page.locator('.dialkit-labeled-control', { has: page.locator('.dialkit-labeled-control-label', { hasText: /^fail$/i }) });
  await toggle.getByRole('button', { name: 'On', exact: true }).click();
  const item = page.getByTestId('waiting-item');
  await item.getByRole('button', { name: 'Upload' }).click();
  await expect(item).toHaveAttribute('data-phase', 'error');
  await expect(item).toContainText('Upload failed');
  await expect(item.getByRole('button', { name: 'Try again' })).toBeEnabled();
  await toggle.getByRole('button', { name: 'Off', exact: true }).click();
  await item.getByRole('button', { name: 'Try again' }).click();
  await expect(item).toHaveAttribute('data-phase', 'done');
});
