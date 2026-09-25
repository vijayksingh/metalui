import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Backlight Part on Parts › Backlight: a glow, a beam and blips inside a bezel's glass, under
// the glass's surface; the beam turns and the light dims.
for (const colorway of COLORWAYS) {
  test(`backlights in ${colorway}`, async ({ page }) => {
    await open(page, '/components/backlight', colorway);
    const looks = page.getByTestId('backlight-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(4);
    expect(await looks.evaluateAll((els) => els.map((e) => [...e.querySelectorAll('[data-part="backlight"]')].map((b) => b.getAttribute('data-shape')).join(',')))).toEqual(['glow', 'beam', 'dot,dot,dot', 'glow']);
    // The light is inside the glass: after the glass, before its surface, clipped to it.
    const beam = looks.nth(1);
    expect(await beam.evaluate((e) => [...e.querySelectorAll('[data-part="glass"], [data-part="backlight"], [data-part="glass.glare"]')].map((x) => x.getAttribute('data-part')))).toEqual(['glass', 'backlight', 'glass.glare']);
    await expect(beam.locator('[data-part="bezel.light"]')).toHaveAttribute('clip-path', /url\(#/);
    // A beam: slices fading behind a bright leading edge.
    await expect(beam.locator('[data-shape="beam"] path[fill]')).toHaveCount(14);
    await page.getByTestId('backlight-looks').screenshot({ path: capture(`backlight-${colorway}`) });
  });
}

test('the beam turns and the light dims with its controls', async ({ page }) => {
  await open(page, '/components/backlight', 'bone');
  const beam = page.getByTestId('backlight-looks').locator('[data-shape="beam"]');
  await expect(beam).toHaveAttribute('transform', 'rotate(40 200 196)');
  await page.getByRole('slider', { name: 'Heading' }).focus();
  await page.keyboard.press('End');
  await expect(beam).toHaveAttribute('transform', 'rotate(359 200 196)');
  await page.getByRole('slider', { name: 'Alpha' }).focus();
  await page.keyboard.press('Home');
  const glowAlpha = () => page.getByTestId('backlight-looks').locator('[data-shape="glow"] circle').first().evaluate((c) => {
    const id = c.getAttribute('fill')!.match(/#([^)]+)/)![1];
    return document.getElementById(id)!.querySelector('stop')!.getAttribute('stop-opacity');
  });
  await expect.poll(glowAlpha).toBe('0');
});
