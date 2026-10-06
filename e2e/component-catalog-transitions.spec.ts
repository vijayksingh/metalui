import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const captures = 'docs/captures/review/component-transitions';
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

// Every Component's guide is walked into and back. The walk is cut into shards so each has its own
// budget and they run on separate workers: 102 animated navigations in one test outgrew 180s on CI.
const SHARDS = 6;
async function entriesOf(page: import('@playwright/test').Page) {
  await page.goto('/components');
  await expect(page.locator('.library-card')).toHaveCount(51);
  return page.locator('.library-card').evaluateAll(cards => cards.map(card => ({ name: (card as HTMLElement).dataset.component!, label: card.querySelector('.library-card-label')!.textContent!, to: card.querySelector('h3 a')!.getAttribute('href')! })));
}

test('the library lists all 51 Components, each with a label and a guide', async ({ page }) => {
  const entries = await entriesOf(page);
  expect(entries).toHaveLength(51);
  for (const item of entries) { expect(item.label, item.name).toBeTruthy(); expect(item.to, item.name).toMatch(/^\/components\//); }
});

for (let shard = 0; shard < SHARDS; shard++) {
  test(`Components carry their resting body and label into guides and back (shard ${shard + 1} of ${SHARDS})`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const entries = (await entriesOf(page)).filter((_, i) => i % SHARDS === shard);
    for (const item of entries.filter(item => !process.env.METALUI_COMPONENT_SLICE || process.env.METALUI_COMPONENT_SLICE.split(',').includes(item.name))) {
    await page.goto(`/components?q=${encodeURIComponent(item.name)}`);
    const card = page.locator(`[data-component="${item.name}"]`);
    await expect(card).toBeVisible();
    await card.locator('h3 a').click();
    await expect(page).toHaveURL(item.to);
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    const record = await page.evaluate(() => (window as any).catalogTransitions.at(-1));
    expect.soft(record.error, item.name).toBeUndefined();
    expect.soft(record.old.map((item: any) => item.name).sort(), `${item.name} source`).toEqual(['docs-card-label', 'docs-card-specimen']);
    expect.soft(record.next.map((item: any) => item.name).sort(), `${item.name} destination`).toEqual(['docs-card-label', 'docs-card-specimen']);
    expect.soft(record.next.every((item: any) => item.width > 0), `${item.name} visible destination`).toBe(true);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Components', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Search components' })).toHaveValue(item.name);
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    const back = await page.evaluate(() => (window as any).catalogTransitions.at(-1));
    expect.soft(back.error, `${item.name} reverse`).toBeUndefined();
    expect.soft(back.old).toHaveLength(2);
    expect.soft(back.next).toHaveLength(2);
    await expect(page.locator('[data-catalog-transition]')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('keyboard opens guide, Try it remains local, and motion preferences suppress flight', async ({ page }) => {
  await page.goto('/components?q=switch');
  const card = page.locator('[data-component="switch"]');
  await card.getByRole('button', { name: 'Try Switch', exact: true }).click();
  await card.getByRole('switch', { name: 'Live sync' }).uncheck();
  await expect(page).toHaveURL('/components?q=switch');
  await card.locator('h3 a').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/components/switch');
  await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
  for (const preference of ['system', 'switch']) {
    await page.emulateMedia({ reducedMotion: preference === 'system' ? 'reduce' : 'no-preference' });
    await page.goto('/components?q=switch');
    if (preference === 'switch') await page.getByRole('checkbox', { name: 'Motion (off = Reduce Motion)' }).uncheck();
    await page.locator('[data-component="switch"] h3 a').click();
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    const record = await page.evaluate(() => (window as any).catalogTransitions.at(-1));
    expect(record.old).toHaveLength(0);
    expect(record.next).toHaveLength(0);
    expect(record.animations).toBe(0);
  }
});

test('a resting preview opens its guide while Try it keeps the preview local', async ({ page }) => {
  await page.goto('/components?q=switch');
  const card = page.locator('[data-component="switch"]');
  await expect(card).toBeVisible();
  await card.click({ position: { x: 80, y: 80 } });
  await expect(page).toHaveURL('/components/switch');
  await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Components', exact: true }).click();
  await expect(page).toHaveURL('/components?q=switch');
  await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
  await card.getByRole('button', { name: 'Try Switch', exact: true }).click();
  await card.click({ position: { x: 80, y: 80 } });
  await expect(page).toHaveURL('/components?q=switch');
});

test('desktop and mobile retain actual shared flight in both colorways', async ({ page }) => {
  for (const width of [1280, 390]) for (const colorway of ['Bone', 'Graphite']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/components?q=switch');
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.evaluate(() => { (window as any).holdCatalogTransition = true; });
    await page.locator('[data-component="switch"] h3 a').click();
    await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.ready);
    await page.screenshot({ path: `${captures}/${width}-${colorway.toLowerCase()}-flight.png` });
    const record = await page.evaluate(() => (window as any).catalogTransitions.at(-1));
    expect(record.old).toHaveLength(2);
    expect(record.next).toHaveLength(2);
    expect(record.animations).toBeGreaterThan(0);
    await page.evaluate(() => { for (const animation of document.getAnimations()) if ((animation.effect as KeyframeEffect)?.pseudoElement?.includes('view-transition')) animation.finish(); });
  }
});
