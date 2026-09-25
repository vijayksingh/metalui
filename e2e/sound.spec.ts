import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The sound foundation (tokens.sound), as a reader meets it on Foundations → Sound:
// off until asked, acts and states obey the Plays setting, a muted material stays
// silent, the beeper lights its lamp, and the settings (never "on") are remembered.
test('sound is off until the person turns it on', async ({ page }) => {
  await open(page, '/foundations/sound', 'bone');
  const last = page.getByTestId('sound-last');
  await expect(page.getByTestId('sound-settings')).toHaveAttribute('data-on', 'false');

  await page.locator('[data-sound-material="clay"]').dispatchEvent('pointerdown');
  await expect(last).toHaveText(/Clay · \d+ Hz · silent \(sound is off\)/);

  await page.getByRole('switch', { name: 'Sound' }).click();
  await expect(page.getByTestId('sound-settings')).toHaveAttribute('data-on', 'true');
  await page.locator('[data-sound-material="clay"]').dispatchEvent('pointerdown');
  await expect(last).toHaveText(/^Clay · \d+ Hz · peak -?\d+(\.\d)? dBFS$/);
});

test('each material strikes at its own pitch', async ({ page }) => {
  await open(page, '/foundations/sound', 'bone');
  await page.getByRole('switch', { name: 'Sound' }).click();
  const hz = async (m: string) => {
    await page.locator(`[data-sound-material="${m}"]`).dispatchEvent('pointerdown');
    const text = await page.getByTestId('sound-last').textContent();
    expect(text).toContain(m[0].toUpperCase() + m.slice(1));
    return Number(text!.match(/(\d+) Hz/)![1]);
  };
  // Glass tinks high, metal clangs low: the two the owner heard as too alike must stay apart.
  const glass = await hz('glass'), metal = await hz('metal');
  expect(glass).toBeGreaterThan(metal * 2.2);
  expect(await hz('ceramic')).toBeGreaterThan(await hz('clay'));
});

test('states only silences acts but not the beeper, whose lamp lights', async ({ page }) => {
  await open(page, '/foundations/sound', 'graphite');
  const last = page.getByTestId('sound-last');
  await page.getByRole('switch', { name: 'Sound' }).click();
  await page.getByRole('radio', { name: 'States only' }).click();
  await expect(page.getByTestId('sound-settings')).toHaveAttribute('data-plays', 'states');

  await page.locator('[data-sound-material="metal"]').dispatchEvent('pointerdown');
  await expect(last).toHaveText(/Metal · \d+ Hz · silent \(states only\)/);

  const done = page.locator('[data-earcon="done"]');
  await done.click();
  await expect(last).toHaveText('beep · done');
  await expect(done.locator('[data-kind]')).toHaveAttribute('data-kind', 'live');
  await expect(done.locator('[data-kind]')).toHaveAttribute('data-kind', 'off', { timeout: 3000 });
});

test('a muted material stays silent, and settings survive a reload but sound does not', async ({ page }) => {
  await open(page, '/foundations/sound', 'bone');
  const last = page.getByTestId('sound-last');
  await page.getByRole('switch', { name: 'Sound' }).click();
  await page.getByRole('radio', { name: 'States only' }).click();
  await page.getByRole('radio', { name: 'Acts and states' }).click();
  await page.locator('label', { hasText: 'Stone' }).getByRole('checkbox').click();
  await page.locator('[data-sound-material="stone"]').dispatchEvent('pointerdown');
  await expect(last).toHaveText(/Stone · \d+ Hz · silent \(material muted\)/);

  await page.reload();
  await page.waitForSelector('main h1');
  await expect(page.getByTestId('sound-settings')).toHaveAttribute('data-on', 'false');
  await expect(page.locator('label', { hasText: 'Stone' }).getByRole('checkbox')).not.toBeChecked();
});

for (const colorway of COLORWAYS) {
  test(`sound page in ${colorway}`, async ({ page }) => {
    await open(page, '/foundations/sound', colorway);
    await page.locator('section', { hasText: 'The library exposes three settings' }).first().screenshot({ path: capture(`sound-settings-${colorway}`) });
    await page.locator('section', { hasText: 'Seven materials, closed' }).first().screenshot({ path: capture(`sound-materials-${colorway}`) });
  });
}

test('a part dragged along a groove scrapes, faster is louder, and it stops when let go', async ({ page }) => {
  await open(page, '/foundations/sound', 'bone');
  const last = page.getByTestId('sound-last'), track = page.getByTestId('slide-track');
  await track.scrollIntoViewIfNeeded();
  const drag = async (steps: number) => {
    await track.scrollIntoViewIfNeeded();
    const groove = (await track.locator('.touch-none').boundingBox())!;
    await page.mouse.move(groove.x + 30, groove.y + groove.height / 2);
    await page.mouse.down();
    await page.mouse.move(groove.x + groove.width - 30, groove.y + groove.height / 2, { steps });
  };
  // Off: it says so, and makes no sound.
  await drag(4);
  await expect(last).toHaveText('Clay · sliding · silent (sound is off)');
  await page.mouse.up();
  // On: a fast drag is faster than a slow one, and letting go stops it.
  await page.getByRole('switch', { name: 'Sound' }).click();
  await track.getByRole('radio', { name: 'Stone' }).click();
  await drag(3);
  await expect(last).toHaveText('Stone · sliding');
  const fast = Number(await track.getAttribute('data-speed'));
  await page.mouse.up();
  await expect(track).toHaveAttribute('data-speed', '0.00');
  await drag(60);
  const slow = Number(await track.getAttribute('data-speed'));
  await page.mouse.up();
  expect(fast).toBeGreaterThan(slow);
  // A key nudges it: a short scrape.
  await track.getByRole('slider', { name: 'Slide the cap' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(track.getByRole('slider')).not.toHaveAttribute('aria-valuenow', '90');
});
