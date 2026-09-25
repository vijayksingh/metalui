import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Beeper Part on Parts › Beeper: four earcons that the disc answers note by note, slots and
// plates, detail by size, and no lift with reduced motion.
for (const colorway of COLORWAYS) {
  test(`beepers in ${colorway}`, async ({ page }) => {
    await open(page, '/components/beeper', colorway);
    const looks = page.getByTestId('beeper-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(4);
    expect(await looks.evaluateAll((els) => els.map((e) => e.querySelector('[data-slots]')!.getAttribute('data-slots')))).toEqual(['3', '5', '7', '5']);
    expect(await looks.evaluateAll((els) => els.map((e) => e.getAttribute('data-material')))).toEqual(['metal', 'metal', 'metal', 'clay']);
    await page.getByTestId('beeper-looks').screenshot({ path: capture(`beeper-${colorway}`) });
  });
}

test('the flat tier has no filters', async ({ page }) => {
  await open(page, '/components/beeper', 'bone');
  const tiers = page.getByTestId('beeper-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
});

/** Presses an earcon's button and samples the disc's light and the plate's height every 5 ms. */
async function playAndSample(page: Page, earcon: string) {
  const fig = page.getByTestId(`beeper-${earcon}`);
  await fig.scrollIntoViewIfNeeded();
  return fig.evaluate(async (el) => {
    const flex = el.querySelector('[data-part="beeper.flex"]')!, part = el.querySelector('[data-part="beeper"]')!;
    const rest = part.getBoundingClientRect().y, out: { t: number; light: number; lift: number }[] = [];
    (el.querySelector('button') as HTMLButtonElement).click();
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const id = setInterval(() => {
        out.push({ t: performance.now() - t0, light: Number(getComputedStyle(flex).opacity), lift: rest - part.getBoundingClientRect().y });
        if (performance.now() - t0 > 600) { clearInterval(id); done(); }
      }, 5);
    });
    return out;
  });
}

test('done: the disc catches the light twice, with its two notes, and settles', async ({ page }) => {
  await open(page, '/components/beeper', 'graphite');
  const s = await playAndSample(page, 'done');
  // Its shape, whenever the animation starts: lit, a dip between the notes, lit again, then dark.
  const phases = s.map((x) => (x.light > 0.9 ? 'L' : x.light < 0.8 ? 'd' : '')).filter(Boolean).join('').replace(/(.)\1+/g, '$1');
  expect(phases).toBe('dLdLd');
  expect(Math.max(...s.map((x) => x.lift))).toBeGreaterThan(0.5);
  expect(s[s.length - 1].light).toBe(0);                     // at rest again
  expect(Math.abs(s[s.length - 1].lift)).toBeLessThan(0.05);
  await expect(page.getByTestId('beeper-done')).toHaveAttribute('data-plays', '1');
});

test('with reduced motion the disc still catches the light, but the plate stays put', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/beeper', 'bone');
  const s = await playAndSample(page, 'ready');
  expect(Math.max(...s.map((x) => x.light))).toBeGreaterThan(0.9);
  expect(Math.max(...s.map((x) => Math.abs(x.lift)))).toBeLessThan(0.05);
});
