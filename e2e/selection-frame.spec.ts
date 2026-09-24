import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Selection frame (KAMUI-14): hover shows the corner dots, a click selects (ring + handles + readout
// at the measured size), a second click writes and the ring tracks every keystroke, ⎋ finishes quietly.
for (const colorway of COLORWAYS) {
  test(`select, write and finish a block in ${colorway}`, async ({ page }) => {
    await open(page, '/components/selection-frame', colorway);
    const block = page.getByTestId('text-block');
    const frame = block.locator('.mu-selection-frame');

    await block.hover();
    await expect(frame).toHaveAttribute('data-state', 'hover');
    await expect(frame.locator('.mu-sf-dot')).toHaveCount(4);

    await block.click();
    await expect(frame).toHaveAttribute('data-state', 'selected');
    await expect(block).toHaveAttribute('aria-selected', 'true');
    await expect(frame.locator('.mu-sf-handle')).toHaveCount(8);
    await expect(frame.locator('.mu-sf-handle[data-grip]')).toHaveCount(2);
    const ring = frame.locator('.mu-sf-ring');
    const shadow = await ring.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain(colorway === 'bone' ? 'rgb(63, 185, 122) 0px 0px 0px 1.25px' : 'rgb(120, 214, 165) 0px 0px 0px 1.25px');
    // The entrance plays once (1.02 → 1 on part); then the ring sits at offset 6 around the block.
    expect(await ring.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
    await ring.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const [b, r] = await Promise.all([block.boundingBox(), ring.boundingBox()]);
    expect(r!.x).toBeCloseTo(b!.x - 6, 0);
    expect(r!.width).toBeCloseTo(b!.width + 12, 0);
    const readout = block.locator('.mu-sf-readout');
    const size = () => block.evaluate((el) => `${Math.round(el.getBoundingClientRect().width)} × ${Math.round(el.getBoundingClientRect().height)}`);
    await expect(readout).toHaveText(await size());
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`selection-frame-${colorway}`) });

    // Write: the readout dims and re-measures in the same frame as each keystroke; drift 0.
    await block.click();
    await expect(frame).toHaveAttribute('data-mode', 'writing');
    await page.keyboard.press('End');
    await page.keyboard.type(' and a long walk by the canal after lunch');
    await expect(readout).toHaveText(await size());
    const drift = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="text-block"]') as HTMLElement;
      const ring = host.querySelector('.mu-sf-ring') as HTMLElement;
      const a = host.getBoundingClientRect(), c = ring.getBoundingClientRect();
      return Math.abs(c.width - a.width - 12) + Math.abs(c.height - a.height - 12);
    });
    expect(drift).toBeLessThan(0.01);
    await readout.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    expect(Number(await readout.evaluate((el) => getComputedStyle(el).opacity))).toBeCloseTo(0.78, 2);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`selection-frame-writing-${colorway}`) });

    // ⎋ finishes and selects quietly: the lite ring, no handles.
    await page.keyboard.press('Escape');
    await expect(frame).toHaveAttribute('data-variant', 'lite');
    await expect(frame.locator('.mu-sf-handle')).toHaveCount(0);
    await page.locator('section', { hasText: 'Every state as a still' }).first().screenshot({ path: capture(`selection-frame-states-${colorway}`) });
  });
}

test('the ring appears without its entrance under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/selection-frame', 'bone');
  const block = page.getByTestId('text-block');
  await block.click();
  const ring = block.locator('.mu-sf-ring');
  // part resolves instant: the entrance has no duration, so the ring is at rest immediately.
  expect(await ring.evaluate((el) => getComputedStyle(el).animationDuration)).toBe('0s');
  expect(await ring.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});
