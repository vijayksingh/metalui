import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const names = ['drop-zone', 'empty-state', 'lens-bar', 'memory-scrubber', 'past-banner', 'region', 'sidebar', 'split-pane'];
const captures = 'docs/captures/review/catalog-transitions';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

// Observe the native snapshots, including skipped transitions, rather than mocking animation.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = document.startViewTransition.bind(document);
    const records: any[] = (window as any).catalogTransitions = [];
    const elements = () => Array.from(document.querySelectorAll<HTMLElement>('[data-catalog-transition]')).map(element => ({ name: element.style.viewTransitionName, text: element.textContent, width: element.getBoundingClientRect().width }));
    document.startViewTransition = ((update: () => Promise<void>) => {
      const record: any = { old: elements() };
      records.push(record);
      const transition = native(async () => { await update(); record.next = elements(); });
      transition.ready.then(() => {
        record.ready = true;
        record.animations = document.getAnimations().filter(animation => (animation.effect as KeyframeEffect)?.pseudoElement?.includes('view-transition')).length;
        if ((window as any).holdCatalogTransition) {
          for (const animation of document.getAnimations()) {
            if ((animation.effect as KeyframeEffect)?.pseudoElement?.includes('view-transition')) { animation.pause(); animation.currentTime = 140; }
          }
        }
      }).catch(error => { record.error = String(error); });
      transition.finished.then(() => { record.finished = true; });
      return transition;
    }) as typeof document.startViewTransition;
  });
});

test('each Places item and its name travel into the guide and back without skipped snapshots', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const name of names) {
    await page.goto(`/places?q=${name.replaceAll('-', ' ')}`);
    await expect(page.locator(`[data-place="${name}"]`)).toBeVisible();
    await page.locator(`[data-place="${name}"] .place-card-copy`).click();
    await expect(page).toHaveURL(`/components/${name}`);
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    let records = await page.evaluate(() => (window as any).catalogTransitions);
    expect(records.at(-1).error).toBeUndefined();
    expect(records.at(-1).old.map((item: any) => item.name).sort()).toEqual(['docs-card-label', 'docs-card-specimen']);
    expect(records.at(-1).next.map((item: any) => item.name).sort()).toEqual(['docs-card-label', 'docs-card-specimen']);
    await expect(page.locator('[data-catalog-transition]')).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Places', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Search places' })).toHaveValue(name.replaceAll('-', ' '));
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    records = await page.evaluate(() => (window as any).catalogTransitions);
    expect(records.at(-1).error).toBeUndefined();
    expect(records.at(-1).old).toHaveLength(2);
    expect(records.at(-1).next).toHaveLength(2);
  }
  expect(errors).toEqual([]);
});

test('motion preferences stay instant; both colorways and mobile show the shared flight', async ({ page }) => {
  for (const width of [1280, 390]) for (const colorway of ['Bone', 'Graphite']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/places?q=past banner');
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.evaluate(() => { (window as any).holdCatalogTransition = true; });
    await page.locator('.place-card-copy').click();
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.ready);
    await page.screenshot({ path: `${captures}/${width}-${colorway.toLowerCase()}-flight.png` });
    expect((await page.evaluate(() => (window as any).catalogTransitions.at(-1))).animations).toBeGreaterThan(0);
    await page.evaluate(() => { for (const animation of document.getAnimations()) if ((animation.effect as KeyframeEffect)?.pseudoElement?.includes('view-transition')) animation.finish(); });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const preference of ['system', 'switch']) {
    await page.emulateMedia({ reducedMotion: preference === 'system' ? 'reduce' : 'no-preference' });
    await page.goto('/places?q=past banner');
    if (preference === 'switch') await page.getByRole('checkbox', { name: 'Motion (off = Reduce Motion)' }).uncheck();
    await page.locator('.place-card-copy').click();
    await expect(page).toHaveURL('/components/past-banner');
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    const record = await page.evaluate(() => (window as any).catalogTransitions.at(-1));
    expect(record.old).toHaveLength(0);
    expect(record.next).toHaveLength(0);
    expect(record.animations).toBe(0);
  }
});
