import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { ICON_NAMES } from '../packages/metalui/src/icons/catalog.generated';
import { LIFE_ICON_NAMES } from '../packages/metalui/src/icons/life/catalog.generated';

const captures = 'docs/captures/review/icon-transitions';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = document.startViewTransition.bind(document);
    const records: any[] = (window as any).iconTransitions = [];
    const elements = () => Array.from(document.querySelectorAll<HTMLElement>('[data-catalog-transition]')).map(element => ({ name: element.style.viewTransitionName, tag: element.tagName.toLowerCase(), text: element.textContent, width: element.getBoundingClientRect().width }));
    document.startViewTransition = ((update: () => Promise<void>) => {
      const record: any = { old: elements(), from: location.pathname };
      records.push(record);
      const transition = native(async () => { await update(); record.next = elements(); record.to = location.pathname; });
      transition.ready.then(() => {
        record.ready = true;
        const animations = document.getAnimations().filter(animation => (animation.effect as KeyframeEffect)?.pseudoElement?.includes('view-transition'));
        record.animations = animations.length;
        if ((window as any).holdIconTransition) for (const animation of animations) { animation.pause(); animation.currentTime = 140; }
      }).catch(error => { record.error = String(error); });
      transition.finished.then(() => { record.finished = true; });
      return transition;
    }) as typeof document.startViewTransition;
  });
});

test('all 187 glyphs and their labels have native snapshot partners in their details and back', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/icons');
  const paths = [...ICON_NAMES.map(name => `/icons/${name}`), ...LIFE_ICON_NAMES.map(name => `/icons/life/${name}`)];
  await expect(page.locator('.icon-entry')).toHaveCount(paths.length);
  expect((await page.locator('.icon-entry').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).sort()).toEqual([...paths].sort());
  // Preserve native snapshot validation while keeping full-inventory coverage quick.
  await page.addStyleTag({ content: '::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 1ms !important; }' });
  for (const path of paths) {
    const card = page.locator(`.icon-entry[href="${path}"]`);
    await expect(card.locator('.icon-entry-specimen > svg')).toHaveCount(1);
    const label = await card.locator('.icon-entry-label').innerText();
    const beforeForward = await page.evaluate(() => (window as any).iconTransitions.length);
    await card.click();
    await expect(page).toHaveURL(path);
    const forward = await (await page.waitForFunction(({ count, path }) => {
      const record = (window as any).iconTransitions[count];
      return record?.finished && record.next && record.to === path ? record : false;
    }, { count: beforeForward, path })).jsonValue();
    expect(forward.error, path).toBeUndefined();
    expect(forward.old.map((item: any) => item.name).sort(), path).toEqual(['docs-card-label', 'docs-card-specimen']);
    expect(forward.next.map((item: any) => item.name).sort(), path).toEqual(['docs-card-label', 'docs-card-specimen']);
    expect(forward.old.find((item: any) => item.name === 'docs-card-specimen').tag).toBe('svg');
    expect(forward.next.find((item: any) => item.name === 'docs-card-specimen').tag).toBe('svg');
    expect(forward.next.find((item: any) => item.name === 'docs-card-label').text).toBe(label);
    await expect(page.locator('[data-catalog-transition]')).toHaveCount(0);
    const forwardCount = await page.evaluate(() => (window as any).iconTransitions.length);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Icons', exact: true }).click();
    await expect(page).toHaveURL('/icons');
    const reverse = await (await page.waitForFunction(count => {
      const record = (window as any).iconTransitions[count];
      return record?.finished && record.next && record.to === '/icons' ? record : false;
    }, forwardCount)).jsonValue();
    expect(reverse.error, path).toBeUndefined();
    expect(reverse.old, path).toHaveLength(2);
    expect(reverse.next, path).toHaveLength(2);
  }
  expect(errors).toEqual([]);
});

test('both Save glyphs preserve their set, filtered return, and visual flight across colorways and mobile', async ({ page }) => {
  test.setTimeout(60_000);
  for (const width of [1280, 390]) for (const colorway of ['Bone', 'Graphite']) for (const kind of ['product', 'life']) {
    await page.setViewportSize({ width, height: 900 });
    const index = kind === 'life' ? '/icons/life?q=save' : '/icons?set=product&q=save';
    const detail = kind === 'life' ? '/icons/life/save' : '/icons/save';
    await page.goto(index);
    await page.getByRole('radio', { name: colorway, exact: true }).click();
    await page.evaluate(() => { (window as any).holdIconTransition = true; });
    await page.locator(`.icon-entry[href="${detail}"]`).click();
    await page.waitForFunction(() => (window as any).iconTransitions.at(-1)?.ready);
    const record = await page.evaluate(() => (window as any).iconTransitions.at(-1));
    expect(record.error).toBeUndefined();
    expect(record.animations).toBeGreaterThan(0);
    await page.screenshot({ path: `${captures}/${width}-${colorway.toLowerCase()}-${kind}-flight.png` });
    await page.evaluate(() => {
      (window as any).holdIconTransition = false;
      for (const animation of document.getAnimations()) if ((animation.effect as KeyframeEffect)?.pseudoElement?.includes('view-transition')) animation.finish();
    });
    await page.waitForFunction(() => (window as any).iconTransitions.at(-1)?.finished);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: kind === 'life' ? 'Life icons' : 'Icons', exact: true }).click();
    await expect(page).toHaveURL(index);
    await page.waitForFunction(() => (window as any).iconTransitions.at(-1)?.finished);
    expect((await page.evaluate(() => (window as any).iconTransitions.at(-1))).error).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const preference of ['system', 'switch']) {
    await page.emulateMedia({ reducedMotion: preference === 'system' ? 'reduce' : 'no-preference' });
    await page.goto('/icons/life?q=save');
    if (preference === 'switch') await page.getByRole('checkbox', { name: 'Motion (off = Reduce Motion)' }).uncheck();
    await page.locator('.icon-entry[href="/icons/life/save"]').click();
    await page.waitForFunction(() => (window as any).iconTransitions.at(-1)?.finished);
    const record = await page.evaluate(() => (window as any).iconTransitions.at(-1));
    expect(record.old).toHaveLength(0);
    expect(record.next).toHaveLength(0);
    expect(record.animations).toBe(0);
  }
});
