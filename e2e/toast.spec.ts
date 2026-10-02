import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Toast: the result of your own action, with Undo that undoes. Results stack as a deck in depth:
// the newest in front, the older ones stepping back behind it; point at the deck to fan it out.

const live = (page: Page) => page.locator('.mu-toast-viewport .mu-toast');
const drawn = (page: Page) => page.locator('.mu-toast-viewport .mu-toast:not([data-limited])');
const settled = (toasts: Locator) => toasts.evaluateAll((els) => Promise.all(els.flatMap((el) => el.getAnimations({ subtree: true }).map((a) => a.finished))));
/** The card's scale and lift, read from its transform (a CSS matrix). */
const placement = (toast: Locator) => toast.evaluate((el) => {
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return { scale: m.a, y: m.f };
});
const DECK_CLIP = { x: 340, y: 580, width: 600, height: 250 };

for (const colorway of COLORWAYS) {
  test(`act, see the result, undo it in ${colorway}`, async ({ page }) => {
    await open(page, '/components/toast', colorway);
    await page.getByRole('button', { name: 'Correct a cue' }).click();
    await live(page).filter({ hasText: 'Correction remembered' }).getByRole('button', { name: /Undo/ }).click();
    await expect(page.getByText('Correction forgotten')).toBeVisible();
  });

  test(`results stack as a deck, three drawn, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/toast', colorway);
    await page.getByRole('button', { name: 'Move 3 blocks' }).click();
    await page.getByRole('button', { name: 'Pin a lens' }).click();
    await page.getByRole('button', { name: 'Correct a cue' }).click();
    await page.getByRole('button', { name: 'Fail an export' }).click();
    await page.getByRole('button', { name: 'Tick a box' }).click();
    await page.mouse.move(10, 10);
    await expect(live(page)).toHaveCount(5);
    await expect(drawn(page)).toHaveCount(3);
    await settled(live(page));
    // Newest in front at full size; each card behind a step smaller and higher.
    const [front, second, third] = await Promise.all([0, 1, 2].map((i) => placement(drawn(page).nth(i))));
    expect(front.scale).toBeCloseTo(1, 2);
    expect(second.scale).toBeCloseTo(0.95, 2);
    expect(third.scale).toBeCloseTo(0.9, 2);
    expect(second.y).toBeLessThan(front.y);
    expect(third.y).toBeLessThan(second.y);
    await expect(drawn(page).first()).toContainText('Ticked');
    // The two not drawn are counted above the back card.
    await expect(page.locator('.mu-toast-more')).toHaveText('+2');
    await page.screenshot({ path: capture(`toast-deck-${colorway}`), clip: DECK_CLIP });

    // Pointing at the deck fans it out into a column you can read, and holds every timer.
    await drawn(page).first().hover();
    await expect(drawn(page).first()).toHaveAttribute('data-expanded', '');
    await settled(live(page));
    const boxes = await Promise.all([0, 1, 2].map(async (i) => (await drawn(page).nth(i).boundingBox())!));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].y + boxes[i].height).toBeLessThanOrEqual(boxes[i - 1].y + 0.5);
    await page.screenshot({ path: capture(`toast-fan-${colorway}`), clip: DECK_CLIP });

    // Leaving folds it back.
    await page.mouse.move(10, 10);
    await expect(drawn(page).first()).not.toHaveAttribute('data-expanded', '');
  });
}

test('the timers wait while the deck is fanned out', async ({ page }) => {
  await open(page, '/components/toast', 'bone');
  await page.getByRole('button', { name: 'Pin a lens' }).click(); // plain: 2.6 s
  const pinned = live(page).filter({ hasText: 'Pinned as a live region' });
  await pinned.hover();
  await page.waitForTimeout(3600);
  await expect(pinned).toBeVisible();
  await page.mouse.move(10, 10);
  await expect(pinned).toHaveCount(0, { timeout: 5000 });
});

test('swipe the front card away, and the next comes forward', async ({ page }) => {
  await open(page, '/components/toast', 'bone');
  await page.getByRole('button', { name: 'Fail an export' }).click(); // stays until dismissed
  await page.getByRole('button', { name: 'Tick a box' }).click();
  const front = live(page).filter({ hasText: 'Ticked' });
  const box = (await front.locator('.mu-toast-text').boundingBox())!;
  const x = box.x + 10, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y, { steps: 6 });
  await page.mouse.move(x + 140, y, { steps: 6 });
  await page.mouse.up();
  await expect(front).toHaveCount(0);
  await expect(live(page)).toHaveCount(1);
  await expect(live(page).first()).toContainText('Could not export');
  // A short drag springs home instead.
  const error = live(page).first();
  const eb = (await error.locator('.mu-toast-text').boundingBox())!;
  await page.mouse.move(eb.x + 10, eb.y + eb.height / 2);
  await page.mouse.down();
  await page.mouse.move(eb.x + 25, eb.y + eb.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(error).toBeVisible();
  // Its close key dismisses it too.
  await error.getByRole('button', { name: 'Dismiss' }).click();
  await expect(live(page)).toHaveCount(0);
});

test('the same result again counts instead of adding a card', async ({ page }) => {
  await open(page, '/components/toast', 'bone');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Move 3 blocks' }).click();
  await expect(live(page)).toHaveCount(1);
  await expect(live(page).first()).toContainText('×3');
  await expect(live(page).first()).toHaveAttribute('data-bump', 'a');
  await page.mouse.move(10, 10);
  await settled(live(page));
  await page.screenshot({ path: capture('toast-count-bone'), clip: DECK_CLIP });
});

test('the deck under Reduce Motion has no travel or scale', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/toast', 'graphite');
  // Sample every card each frame (its top and its scale), from arrival through fanning out and folding back.
  await page.evaluate(() => {
    const seen = ((window as unknown as { seen: Set<string> }).seen = new Set());
    const tick = () => {
      for (const el of document.querySelectorAll<HTMLElement>('.mu-toast-viewport .mu-toast:not([data-ending-style])')) {
        const r = el.getBoundingClientRect();
        seen.add(`${Math.round(r.y)} ×${(r.width / el.offsetWidth).toFixed(2)}`);
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
  const rest = () => drawn(page).evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return `${Math.round(r.y)} ×${(r.width / el.offsetWidth).toFixed(2)}`; }));
  for (const name of ['Move 3 blocks', 'Pin a lens', 'Correct a cue']) await page.getByRole('button', { name, exact: true }).click();
  await page.mouse.move(10, 10);
  await settled(live(page));
  const folded = await rest();
  await page.screenshot({ path: capture('toast-deck-reduced-graphite'), clip: DECK_CLIP });
  await drawn(page).first().hover();
  await expect(drawn(page).first()).toHaveAttribute('data-expanded', '');
  await settled(live(page));
  const fanned = await rest();
  await page.mouse.move(10, 10);
  await settled(live(page));
  // A card is only ever at a resting place, folded or fanned: it jumps there, never travels.
  const seen = await page.evaluate(() => [...(window as unknown as { seen: Set<string> }).seen]);
  // The deck keeps its depth at rest; only the motion goes.
  expect(folded.map((s) => s.split(' ')[1])).toEqual(['×1.00', '×0.95', '×0.90']);
  expect(seen.filter((s) => !folded.includes(s) && !fanned.includes(s))).toEqual([]);
});

for (const colorway of COLORWAYS) {
  test(`folded widths, edge count and error glyph in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/toast', colorway);
    for (const name of ['Move 3 blocks', 'Pin a lens', 'Correct a cue', 'Fail an export', 'Tick a box']) await page.getByRole('button', { name, exact: true }).click();
    await page.mouse.move(10, 10);
    await settled(live(page));
    const widths = await drawn(page).evaluateAll((cards) => cards.map((card) => (card as HTMLElement).offsetWidth));
    expect(widths).toEqual([widths[0], widths[0], widths[0]]);
    const edge = await page.locator('.mu-toast-more').evaluate((badge) => {
      const card = badge.parentElement!.getBoundingClientRect(), box = badge.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, edge: card.top, right: box.right, cardRight: card.right };
    });
    expect(edge.top).toBeLessThan(edge.edge);
    expect(edge.bottom).toBeGreaterThan(edge.edge);
    expect(edge.right).toBeLessThan(edge.cardRight);
    await page.screenshot({ path: capture(`toast-fold-width-${colorway}`), clip: DECK_CLIP });
    await drawn(page).first().hover();
    await expect(drawn(page).first()).toHaveAttribute('data-expanded', '');
    const error = live(page).filter({ hasText: 'Could not export' });
    await expect(error.locator('svg.mu-toast-error')).toHaveCount(1);
    expect(await error.locator('.mu-toast-error').evaluate((el) => getComputedStyle(el).color)).not.toBe(await error.locator('.mu-toast-text').evaluate((el) => getComputedStyle(el).color));
    const ownWidths = await drawn(page).evaluateAll((cards) => cards.map((card) => (card as HTMLElement).offsetWidth));
    expect(new Set(ownWidths).size).toBeGreaterThan(1);
    await drawn(page).first().getByRole('button', { name: 'Dismiss' }).click();
    await page.mouse.move(10, 10);
    await page.getByRole('textbox', { name: 'Draft with its own Undo' }).click();
    await expect(drawn(page).first()).not.toHaveAttribute('data-expanded', '');
    await settled(live(page));
    const nextWidths = await drawn(page).evaluateAll((cards) => cards.map((card) => (card as HTMLElement).offsetWidth));
    expect(new Set(nextWidths).size).toBe(1);
  });
}

test('Undo shortcuts target latest or focused card and respect text editing and host ownership', async ({ page }) => {
  await open(page, '/components/toast', 'bone');
  await page.getByRole('button', { name: 'Move 3 blocks', exact: true }).click();
  await page.getByRole('button', { name: 'Pin a lens', exact: true }).click();
  await page.keyboard.press('Meta+z');
  await expect(page.getByText('Undone: moved 3 blocks back')).toBeVisible();
  await expect(live(page).filter({ hasText: 'Moved 3 blocks' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Move 3 blocks', exact: true }).click();
  await page.getByRole('button', { name: 'Correct a cue', exact: true }).click();
  await page.keyboard.press('F6');
  await expect(drawn(page).first()).toHaveAttribute('data-expanded', '');
  const older = live(page).filter({ hasText: 'Moved 3 blocks' });
  await older.getByRole('button', { name: /Undo/ }).focus();
  await page.keyboard.press('Control+z');
  await expect(page.getByText('Undone: moved 3 blocks back')).toBeVisible();
  await expect(older).toHaveCount(0);
  const field = page.getByRole('textbox', { name: 'Draft with its own Undo' });
  await field.fill('A local edit');
  await page.keyboard.press('Meta+z');
  await expect(live(page).filter({ hasText: 'Correction remembered' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Host handles Undo' }).click();
  const host = live(page).filter({ hasText: 'Host-owned change' });
  await expect(host.locator('.mu-kbd')).toHaveCount(0);
  await host.hover();
  await host.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('Host-owned change undone')).toBeVisible();
});
