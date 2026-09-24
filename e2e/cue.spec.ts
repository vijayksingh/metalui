import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Cue family: every in-flow cue is metric-neutral, the resolved value shows on hover, the dimple is a
// real checkbox whose tick draws on (and appears at once under reduced motion).
for (const colorway of COLORWAYS) {
  test(`cues on a block in ${colorway}`, async ({ page }) => {
    await open(page, '/components/cue', colorway);
    const proof = page.getByTestId('metric-proof');
    const widths = await proof.evaluate((el) => [...el.querySelectorAll('[data-testid^="line-"]')].map((l) => l.getBoundingClientRect().width));
    expect(Math.abs(widths[0] - widths[1])).toBeLessThan(0.005);
    // Each cue's words sit exactly where the plain words do (the text, not the pill's box).
    const perCue = await proof.evaluate((el) => {
      const [cued, plain] = [...el.querySelectorAll('[data-testid^="line-"]')] as HTMLElement[];
      const textBox = (n: HTMLElement) => { const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); return [b.left, b.right]; };
      const a = [...cued.children] as HTMLElement[], b = [...plain.children] as HTMLElement[];
      return a.flatMap((c, i) => { const [x1, y1] = textBox(c), [x2, y2] = textBox(b[i]); return [Math.abs(x1 - x2), Math.abs(y1 - y2)]; });
    });
    for (const d of perCue) expect(d).toBeLessThan(0.005);

    const block = page.getByTestId('cue-block');
    const date = block.locator('.mu-cue[data-kind="date"]');
    await date.hover();
    const chip = await date.evaluate((el) => getComputedStyle(el, '::after').content);
    expect(chip).toBe('"TUE 30 SEP · 16:00"');

    const dimple = block.getByRole('checkbox', { name: 'Send the poster' });
    await expect(dimple).toHaveAttribute('aria-checked', 'false');
    await dimple.focus();
    await page.keyboard.press('Space');
    await expect(dimple).toHaveAttribute('aria-checked', 'true');
    const tick = dimple.locator('.mu-dimple-tick');
    await expect(tick).toBeVisible();
    await tick.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await page.locator('section', { hasText: 'On a block' }).first().screenshot({ path: capture(`cue-${colorway}`) });
    await page.locator('section', { hasText: 'Base UI Checkbox: rest' }).first().screenshot({ path: capture(`cue-dimple-${colorway}`) });
  });
}

test('the tick appears at once under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/cue', 'bone');
  const dimple = page.getByRole('checkbox', { name: 'Send the poster' });
  await dimple.click();
  expect(await dimple.locator('.mu-dimple-tick').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
