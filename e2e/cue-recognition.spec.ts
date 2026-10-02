import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
for (const colorway of COLORWAYS) {
  test(`cue recognition preserves source, wrap and identity in ${colorway}`, async ({ page }) => {
    await open(page, '/components/cue#recognition', colorway);
    const demo = page.getByTestId('recognition-demo');
    const source = demo.getByRole('textbox', { name: 'Cue source text' });
    const line = page.getByTestId('recognition-line');
    await source.fill('slept 6h for $40 tomorrow 4pm #poster #café #café');
    await source.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 6)); await source.press('ArrowRight');
    const sleep = line.locator('[data-kind=measurement]').first();
    await expect(sleep).toHaveAttribute('data-raw', 'true');
    await source.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    await expect(line.locator('[data-raw]')).toHaveCount(6);
    await source.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    await demo.getByRole('button', { name: 'Raw text' }).focus();
    await expect(sleep).not.toHaveAttribute('data-raw');
    await expect(line.locator('[data-kind=amount]')).toContainText('$40.00');
    const tags = await line.locator('[data-semantic-tag]').evaluateAll(els => els.map(el => el.getAttribute('data-tag-identity')));
    expect(tags[1]).toBe(tags[2]);
    const before = await line.evaluate(el => ({ box: el.getBoundingClientRect().toJSON(), words: [...el.querySelectorAll('.mu-mark-words')].map(n => n.getBoundingClientRect().toJSON()), acts: [...el.querySelectorAll('[data-act]')].map(n => n.getAttribute('data-act')) }));
    await demo.getByRole('button', { name: 'Raw text' }).click();
    await expect(sleep).toHaveAttribute('data-raw', 'true');
    const after = await line.evaluate(el => ({ box: el.getBoundingClientRect().toJSON(), words: [...el.querySelectorAll('.mu-mark-words')].map(n => n.getBoundingClientRect().toJSON()), acts: [...el.querySelectorAll('[data-act]')].map(n => n.getAttribute('data-act')) }));
    expect(after.box).toEqual(before.box);
    expect(after.words).toEqual(before.words);
    expect(after.acts).toEqual(before.acts);
    expect(await source.inputValue()).toBe('slept 6h for $40 tomorrow 4pm #poster #café #café');
    await demo.getByRole('button', { name: 'Raw text' }).click();
    await source.focus(); await source.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 6)); await source.press('ArrowRight');
    await demo.getByRole('button', { name: 'Raw text' }).focus();
    expect(await sleep.getAttribute('data-act')).toBe(before.acts[0]);
    await demo.getByTestId('inferred-cue').focus();
    await expect(demo.getByRole('status')).toHaveText('Confirmed Friday');
    await expect(demo.getByTestId('inferred-cue').locator('[data-inferred]')).toHaveCount(0);
    await page.setViewportSize({ width: 560, height: 900 });
    const clearance = await line.evaluate(el => {
      const glyphs = [...el.querySelectorAll('.mu-mark-meaning')].map(g => g.getBoundingClientRect());
      const words: DOMRect[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const node = walker.currentNode; const parent = node.parentElement; if (!parent || parent.closest('[aria-hidden=true]') || getComputedStyle(parent).visibility === 'hidden') continue; const range = document.createRange(); range.selectNodeContents(node); words.push(...range.getClientRects()); }
      return glyphs.every(g => words.every(w => g.bottom <= w.top || g.top >= w.bottom || g.right <= w.left || g.left >= w.right));
    });
    expect(clearance).toBe(true);
    await demo.screenshot({ path: capture(`cue-recognition-${colorway}`) });
  });
}
test('reduced cue recognition lands, adds no display tab stops, and never replays on raw toggle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/cue#recognition', 'bone');
  const line = page.getByTestId('recognition-line');
  await expect(line.locator('button, [tabindex]')).toHaveCount(0);
  expect(await line.locator('.mu-mark-meaning').evaluateAll(els => els.flatMap(el => el.getAnimations({ subtree: true }).filter(a => a instanceof CSSAnimation).map(a => a.playState)))).toEqual([]);
  await page.getByTestId('recognition-demo').getByRole('button', { name: 'Raw text' }).click();
  await page.getByTestId('recognition-demo').getByRole('button', { name: 'Raw text' }).click();
  expect(await line.locator('.mu-mark-meaning').evaluateAll(els => els.flatMap(el => el.getAnimations({ subtree: true }).filter(a => a instanceof CSSAnimation).map(a => a.playState)))).toEqual([]);
});
