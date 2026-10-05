import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const captures = 'docs/captures/review/section-catalogs';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = document.startViewTransition.bind(document);
    const records: any[] = (window as any).catalogTransitions = [];
    const names = () => [...document.querySelectorAll<HTMLElement>('[data-catalog-transition]')].map(element => element.style.viewTransitionName).sort();
    document.startViewTransition = ((update: () => Promise<void>) => {
      const record: any = { old: names() }; records.push(record);
      const transition = native(async () => { await update(); record.next = names(); });
      transition.ready.catch(error => { record.error = String(error); });
      transition.finished.then(() => { record.finished = true; });
      return transition;
    }) as typeof document.startViewTransition;
  });
});

for (const section of ['objects', 'instruments']) {
  test(`${section}: every visual card opens its guide and returns through the breadcrumb`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${section}`);
    const cards = page.locator('.place-card');
    await expect(cards.first()).toBeVisible();
    const entries = await cards.evaluateAll(nodes => nodes.map(node => ({ to: node.querySelector('.place-card-copy')!.getAttribute('href')!, label: node.querySelector('.place-card-copy h2')!.textContent! })));
    expect(entries.length).toBeGreaterThan(0);
    await expect(page.locator('.section-entry')).toHaveCount(0);
    for (const entry of entries) {
      await page.goto(`/${section}?q=${encodeURIComponent(entry.label)}`);
      const card = cards.filter({ has: page.getByRole('heading', { name: entry.label, exact: true }) });
      await expect(card).toHaveCount(1);
      await expect(card.locator('.place-scene > *').first()).toBeAttached();
      await card.locator('.place-card-copy').click();
      await expect(page).toHaveURL(entry.to);
      await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
      const transition = await page.evaluate(() => (window as any).catalogTransitions.at(-1));
      expect(transition.error, entry.to).toBeUndefined();
      expect(transition.old, entry.to).toEqual(['docs-card-label', 'docs-card-specimen']);
      expect(transition.next, entry.to).toEqual(['docs-card-label', 'docs-card-specimen']);
      await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: new RegExp(`^${section}$`, 'i') }).click();
      await expect(page.getByRole('textbox', { name: `Search ${section}` })).toHaveValue(entry.label);
      await page.waitForFunction(() => (window as any).catalogTransitions.at(-1)?.finished);
    }
    expect(errors).toEqual([]);
  });

  test(`${section}: complete visual inventory fits both colorways and mobile with reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${section}`);
    await expect(page.locator('.place-card').first()).toBeVisible();
    for (const width of [1280, 390]) for (const colorway of ['Bone', 'Graphite']) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole('radio', { name: colorway, exact: true }).click();
      await page.screenshot({ path: `${captures}/${section}-${width}-${colorway.toLowerCase()}.png`, fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.place-preview').evaluateAll(nodes => nodes.flatMap(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running')).length)).toBe(0);
    }
  });
}
