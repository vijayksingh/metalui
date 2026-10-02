import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Meter: a level as lit segments coloured by position; a change sweeps from the old edge to the new,
// upward when rising and downward when falling; Reduce Motion changes every segment at once.
const litAt = (meter: import('@playwright/test').Locator) =>
  meter.evaluate((el) => [...el.querySelectorAll('.mu-meter-lamp')].map((l) => (parseFloat(getComputedStyle(l).opacity) > 0.5 ? '1' : '0')).join(''));

for (const colorway of COLORWAYS) {
  test(`reads its level and colours by position in ${colorway}`, async ({ page }) => {
    await open(page, '/components/meter', colorway);
    const storage = page.getByRole('meter', { name: 'Storage' });
    await expect(storage).toHaveAttribute('aria-valuenow', '42');
    await expect.poll(() => litAt(storage)).toBe('1111111000000000');
    expect(await storage.evaluate((el) => [...el.querySelectorAll('.mu-meter-segment')].map((s) => (s as HTMLElement).dataset.zone![0]).join(''))).toBe('oooooooooooowwdd');
    const battery = page.getByRole('meter', { name: 'Battery' });
    expect(await battery.evaluate((el) => (el.querySelector('.mu-meter-segment') as HTMLElement).dataset.zone)).toBe('danger');
    await page.getByRole('button', { name: 'Add 25 GB' }).click();
    await expect(storage).toHaveAttribute('aria-valuenow', '67');
    await page.waitForTimeout(400);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`meter-${colorway}`) });
  });
}

test('the level sweeps up from the old edge and down from it', async ({ page }) => {
  await open(page, '/components/meter', 'bone');
  const storage = page.getByRole('meter', { name: 'Storage' });
  const sweep = (button: string) => storage.evaluate(async (el, name) => {
    const lamps = [...el.querySelectorAll('.mu-meter-lamp')];
    const count = () => lamps.filter((l) => parseFloat(getComputedStyle(l).opacity) > 0.5).length;
    [...document.querySelectorAll('button')].find((b) => b.textContent === name)!.click();
    const out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => { out.push(count()); if (performance.now() - t0 < 300) requestAnimationFrame(frame); else done(); };
      requestAnimationFrame(frame);
    });
    return out;
  }, button);
  const up = await sweep('Add 25 GB');
  expect(up[0]).toBe(7);
  expect(up.some((n) => n > 7 && n < 11)).toBe(true);
  expect(up.at(-1)).toBe(11);
  const down = await sweep('Free 25 GB');
  expect(down.some((n) => n < 11 && n > 7)).toBe(true);
  expect(down.at(-1)).toBe(7);
});

test('Reduce Motion: every segment changes at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/meter', 'graphite');
  const storage = page.getByRole('meter', { name: 'Storage' });
  const delays = await storage.evaluate(async (el) => {
    [...document.querySelectorAll('button')].find((b) => b.textContent === 'Add 25 GB')!.click();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return [...el.querySelectorAll('.mu-meter-lamp')].map((l) => getComputedStyle(l).transitionDelay);
  });
  expect(new Set(delays)).toEqual(new Set(['0s']));
});

test('segments retain their footprint and opaque socket with the shared state inks', async ({ page }) => {
  await open(page, '/components/meter', 'bone');
  const storage = page.getByRole('meter', { name: 'Storage' });
  await expect(storage.locator('.mu-meter-segment')).toHaveCount(16);
  await expect(storage.locator('.mu-meter-segment').first()).toHaveCSS('height', '10px');
  await expect(storage.locator('.mu-meter-lamp').first()).toHaveCSS('height', '8px');
  const colors = await storage.evaluate(el => [...el.querySelectorAll('.mu-meter-segment')].map(s => {
    const c = document.createElement('canvas').getContext('2d')!;
    c.fillStyle = getComputedStyle(s).backgroundColor; c.fillRect(0, 0, 1, 1);
    return [...c.getImageData(0, 0, 1, 1).data];
  }));
  expect(colors.every(c => c.join() === '36,36,39,255')).toBe(true);
  await storage.evaluate(e => e.setAttribute('data-mu-motion', 'reduce'));
  await page.getByRole('button', { name: 'Add 25 GB' }).click();
  expect(await storage.locator('.mu-meter-lamp').evaluateAll(lamps => lamps.every(l => getComputedStyle(l).transitionDelay === '0s'))).toBe(true);
});
