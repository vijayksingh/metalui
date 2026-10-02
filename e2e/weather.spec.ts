import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Weather object on Components › Weather: the sky follows the time of day, the hours and the
// week read their values, every tile draws its own sky, and reduced motion holds one frame.
for (const colorway of COLORWAYS) {
  test(`weather widget in ${colorway}`, async ({ page }) => {
    await open(page, '/components/weather', colorway);
    const widget = page.getByTestId(`weather-${colorway}`).locator('section.mu-weather');
    await expect(widget).toHaveAttribute('aria-label', 'Weather in Lisbon');
    await expect(widget.getByRole('img')).toHaveAttribute('aria-label', /Lisbon: .+, -?\d+°/);
    await expect(widget.getByRole('list', { name: 'Next hours' }).getByRole('listitem')).toHaveCount(6);
    await expect(widget.getByRole('list', { name: 'The week' }).getByRole('listitem')).toHaveCount(7);
    await page.getByTestId(`weather-${colorway}`).screenshot({ path: capture(`weather-${colorway}`) });
  });
}

test('every tile draws its own sky', async ({ page }) => {
  await open(page, '/components/weather', 'bone');
  const tiles = page.getByTestId('weather-tiles-bone').locator('section.mu-weather-tile');
  await expect(tiles).toHaveCount(11);
  await expect(tiles.nth(4).locator('path[data-layer="rain"]')).toHaveCount(1);
  await expect(tiles.nth(6).locator('path[data-layer="snow"]')).toHaveCount(1);
  await expect(tiles.nth(8).locator('path[data-layer="fog"]')).toHaveCount(1);
  await expect(tiles.nth(2).locator('path[data-layer="sun"]')).toHaveCount(0);
});

test('night brings the moon', async ({ page }) => {
  await open(page, '/components/weather', 'graphite');
  await page.getByLabel('Time of day').fill('22');
  const clear = page.getByTestId('weather-tiles-graphite').locator('section.mu-weather-tile').first();
  await expect(clear.locator('path[data-layer="moon"]')).toHaveCount(1);
  await expect(clear.locator('path[data-layer="sun"]')).toHaveCount(0);
});

test('reduced motion holds one frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/weather', 'bone');
  const rain = page.getByTestId('weather-tiles-bone').locator('section.mu-weather-tile').nth(4).locator('path[data-layer="rain"]');
  const first = await rain.getAttribute('d');
  await page.waitForTimeout(700);
  expect(await rain.getAttribute('d')).toBe(first);
  for (const colorway of COLORWAYS) {
    await page.getByTestId(`weather-${colorway}`).screenshot({ path: capture(`weather-${colorway}-reduced`) });
  }
});

// The hosted day keeps its advertised rate while sharing the visible dot-frame cadence.
test('the Weather day keeps its rate and sleeps off screen', async ({ page }) => {
  await open(page, '/components/weather', 'bone');
  const clock = page.getByTestId('weather-bone').locator('header .type-readout');
  const minutes = async () => {
    const [hours, minutes] = (await clock.innerText()).split(':').map(Number);
    return hours * 60 + minutes;
  };
  const started = await minutes();
  await page.waitForTimeout(1200);
  const advance = ((await minutes()) - started + 1440) % 1440;
  expect(advance).toBeGreaterThanOrEqual(25);
  expect(advance).toBeLessThanOrEqual(45); // 30 minutes per real second: one day in 48 seconds.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  const held = await clock.innerText();
  await page.waitForTimeout(700);
  expect(await clock.innerText()).toBe(held);
  await page.getByTestId('weather-bone').scrollIntoViewIfNeeded();
  await expect.poll(async () => clock.innerText()).not.toBe(held);
});

for (const width of [375, 1280]) {
  for (const colorway of COLORWAYS) {
    test(`Weather forecast fits its ${width}px host in ${colorway}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/components/weather', colorway);
      const viewport = page.getByTestId(`weather-${colorway}`);
      const widget = viewport.locator('section.mu-weather');
      await viewport.scrollIntoViewIfNeeded();
      await viewport.evaluate(element => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 24));
      const bounds = await viewport.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const body = await widget.evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        recipe: parseFloat(getComputedStyle(element).getPropertyValue('--mu-r-weather-self-width')),
        transform: getComputedStyle(element).transform,
      }));
      expect(body.width).toBe(body.recipe);
      expect(body.transform).toBe('none');
      if (width === 375) {
        expect(await viewport.evaluate((element) => element.scrollWidth)).toBeGreaterThan(bounds!.width);
        await viewport.screenshot({ path: capture(`weather-${colorway}-375-start`) });
        await viewport.focus();
        await expect(viewport).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        await viewport.evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
        const right = await widget.boundingBox();
        expect(right!.x + right!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
        await viewport.screenshot({ path: capture(`weather-${colorway}-375-end`) });
      } else {
        expect(await viewport.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0);
        const first = await page.getByTestId('weather-bone').locator('section.mu-weather').boundingBox();
        const second = await page.getByTestId('weather-graphite').locator('section.mu-weather').boundingBox();
        const separated = first!.x + first!.width <= second!.x || second!.x + second!.width <= first!.x || first!.y + first!.height <= second!.y || second!.y + second!.height <= first!.y;
        expect(separated).toBe(true);
      }
    });
  }
}

test('viewing the stacked Graphite forecast keeps the shared day live', async ({ page }) => {
  await open(page, '/components/weather', 'graphite');
  const bone = page.getByTestId('weather-bone'), graphite = page.getByTestId('weather-graphite');
  await graphite.evaluate(element => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top));
  await page.waitForTimeout(400);
  expect((await bone.boundingBox())!.y + (await bone.boundingBox())!.height).toBeLessThan(0);
  const clock = graphite.locator('header .type-readout');
  const before = await clock.innerText();
  await expect.poll(() => clock.innerText()).not.toBe(before);
});
