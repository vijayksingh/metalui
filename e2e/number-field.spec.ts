import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Number field: keycaps and arrows step the value and turn the drum the way it went; at a limit the
// keycap disables and an arrow past it shakes only the digits; typing commits on blur.
for (const colorway of COLORWAYS) {
  test(`steps, stops at its limit, and takes typing in ${colorway}`, async ({ page }) => {
    await open(page, '/components/number-field', colorway);
    const copies = page.getByRole('textbox', { name: 'Copies', exact: true });
    await expect(copies).toHaveValue('2');
    await expect(page.getByRole('button', { name: 'Decrease' }).first().locator('svg')).toHaveClass(/mu-ic-minus/);
    await expect(page.getByRole('button', { name: 'Increase' }).first().locator('svg')).toHaveClass(/mu-ic-plus/);
    const glyphSize = await page.getByRole('button', { name: 'Increase' }).first().locator('svg').evaluate(el => ({ width: parseFloat(getComputedStyle(el).width), height: parseFloat(getComputedStyle(el).height) }));
    expect(glyphSize.width).toBeCloseTo(12, 0);
    expect(glyphSize.height).toBeCloseTo(12, 0);
    await page.getByRole('button', { name: 'Increase' }).first().click();
    await expect(copies).toHaveValue('3');
    await copies.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(copies).toHaveValue('1');
    await expect(page.getByRole('button', { name: 'Decrease' }).first()).toBeDisabled();

    await copies.fill('14');
    await copies.blur();
    await expect(copies).toHaveValue('14');
    await copies.fill('99');
    await copies.blur();
    await expect(copies).toHaveValue('20');

    await expect(page.getByRole('textbox', { name: 'Locked' })).toBeDisabled();
    await page.waitForTimeout(500);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`number-field-${colorway}`) });
  });
}

test('the drum turns up for more and down for less', async ({ page }) => {
  await open(page, '/components/number-field', 'bone');
  const field = page.locator('.mu-number-field').first();
  const sample = (key: string) => field.evaluate(async (root, k) => {
    const input = root.querySelector('input')!;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 40));
    const enter = [...root.querySelectorAll<HTMLElement>('.mu-swap-layer')].find((l) => l.dataset.state === 'in' && l.textContent === input.value)!;
    const y = new DOMMatrix(getComputedStyle(enter).transform).m42;
    const hidden = getComputedStyle(input).color;
    await new Promise((r) => setTimeout(r, 600));
    return { y, hidden, after: getComputedStyle(input).color };
  }, key);
  const up = await sample('ArrowUp');
  expect(up.y).toBeGreaterThan(0.5); // the new number comes from below
  expect(up.hidden).toBe('rgba(0, 0, 0, 0)');
  expect(up.after).not.toBe('rgba(0, 0, 0, 0)');
  const down = await sample('ArrowDown');
  expect(down.y).toBeLessThan(-0.5); // and from above for less
});

test('an arrow past the limit shakes only the digits; Reduce Motion keeps them still', async ({ page }) => {
  await open(page, '/components/number-field', 'graphite');
  const columns = page.locator('.mu-number-field').nth(1);
  const xs = await columns.evaluate(async (root) => {
    const input = root.querySelector('input')!;
    const win = root.querySelector('.mu-number-field-window')!;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    const out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => { out.push(new DOMMatrix(getComputedStyle(win).transform).m41); if (performance.now() - t0 < 300) requestAnimationFrame(frame); else done(); };
      requestAnimationFrame(frame);
    });
    return out;
  });
  expect(Math.max(...xs)).toBeGreaterThan(4);
  expect(Math.min(...xs)).toBeLessThan(-1);
  await expect(page.getByRole('textbox', { name: 'Columns' })).toHaveValue('12');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(1300); // the first shake has rung out
  const shook = await columns.evaluate(async (root) => {
    const input = root.querySelector('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await new Promise((r) => requestAnimationFrame(r));
    return root.querySelector('.mu-number-field-window')!.getAnimations().length > 0;
  });
  expect(shook).toBe(false);
});

test('invalid shows the shared ring and says so', async ({ page }) => {
  await open(page, '/components/number-field', 'bone');
  const seats = page.getByRole('textbox', { name: 'Seats', exact: true });
  await expect(seats).toHaveAttribute('aria-invalid', 'true');
  const group = seats.locator('xpath=ancestor::*[contains(@class,"mu-number-field-group")][1]');
  expect(await group.evaluate((el) => getComputedStyle(el, '::before').boxShadow)).toContain('inset');
});

test('shared step keys repeat and stay still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/number-field', 'graphite');
  const increase = page.getByRole('button', { name: 'Increase' }).first();
  const input = page.getByRole('textbox', { name: 'Copies', exact: true });
  const b = (await increase.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const glyph = increase.locator('svg');
  const rest = await glyph.innerHTML();
  await page.mouse.down();
  await page.waitForTimeout(800);
  await page.mouse.up();
  expect(Number(await input.inputValue())).toBeGreaterThan(3);
  expect(await glyph.innerHTML()).toBe(rest);
  await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture('number-field-reduced') });
});
