import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) for (const motion of ['no-preference', 'reduce'] as const) {
  test(`Fan grouped tools and named glyph trays in ${colorway}/${motion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await open(page, '/components/fan', colorway);
    const fan = page.getByRole('toolbar', { name: 'Canvas tools' });
    const tool = fan.getByRole('button', { name: 'Tool: Select' });
    await tool.click();
    const select = fan.getByRole('option', { name: 'Select · V' });
    await expect(select).toBeFocused();
    await expect(select).toHaveAttribute('aria-selected', 'true');
    await expect(fan.getByRole('option')).toHaveCount(11);
    await page.keyboard.press('ArrowRight');
    await expect(fan.getByRole('option', { name: 'Write · T' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(fan.getByRole('option', { name: 'Pencil · N' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(fan.getByRole('option', { name: 'Pen · P' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(tool).toBeFocused();
    await tool.click();
    await fan.getByRole('option', { name: 'Pen · P' }).click();
    const ink = fan.getByRole('button', { name: 'Ink', exact: true });
    await ink.click();
    await fan.getByRole('button', { name: 'Ink: red', exact: true }).click();
    await fan.getByRole('button', { name: 'Width: bold', exact: true }).click();
    await expect(fan.getByRole('button', { name: 'Ink: red' })).toHaveAttribute('aria-pressed', 'true');
    await expect(fan.getByRole('button', { name: 'Width: bold' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('img', { name: 'red bold ink sample' })).toBeVisible();
    const stroke = fan.getByRole('button', { name: 'Width: bold' }).locator('span');
    const dimensions = await stroke.evaluate(el => { const r = el.getBoundingClientRect(); return [r.width, r.height]; });
    expect(dimensions[0]).toBeGreaterThan(dimensions[1]);
    await fan.getByRole('button', { name: 'Fold Ink' }).click();
    await expect(ink).toBeFocused();
    const pen = fan.getByRole('button', { name: 'Tool: Pen' });
    await pen.click();
    await fan.getByRole('option', { name: 'Select · V' }).click();
    await page.getByText('A text block', { exact: true }).click();
    await fan.getByRole('button', { name: 'Text actions', exact: true }).click();
    for (const label of ['Tasks', 'Summarise', 'Gather', 'Region', 'Export', 'Send away']) {
      const action = fan.getByRole('button', { name: label, exact: true });
      await expect(action.locator('svg')).toBeVisible();
      await expect(action).not.toContainText(label);
    }
    await fan.getByRole('button', { name: 'Tasks', exact: true }).click();
    await expect(page.getByText('Tasks', { exact: true }).first()).toBeVisible();
    await fan.getByRole('button', { name: 'Tool: Select' }).click();
    const choice = fan.getByRole('option', { name: 'Write · T' });
    await expect(choice).toBeVisible();
    await page.waitForTimeout(550);
    const boxes = await fan.getByRole('option').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    expect(new Set(boxes.map(b => Math.round(b.x))).size).toBe(3);
    expect(new Set(boxes.map(b => Math.round(b.y))).size).toBe(4);
    if (motion === 'reduce') expect(await choice.evaluate(el => getComputedStyle(el).transitionProperty)).toBe('opacity');
    const area = (await fan.boundingBox())!;
    const x = Math.max(0, area.x - 100), y = Math.max(0, area.y - 200);
    await page.screenshot({ path: `docs/captures/web/fan-grid-${colorway}-${motion}.png`, clip: { x, y, width: Math.min(600, 1280 - x), height: Math.min(300, 900 - y) } });
    await page.mouse.click(5, 5);
    await expect(tool).toHaveAttribute('aria-expanded', 'false');
  });
}

test('Fan grid and wrapped trays fit a narrow canvas; site motion switch updates live', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await open(page, '/components/fan', 'bone');
  const fan = page.getByRole('toolbar', { name: 'Canvas tools' });
  await fan.getByRole('button', { name: 'Tool: Select' }).click();
  await page.waitForTimeout(550);
  const choices = await fan.getByRole('option').evaluateAll(nodes => nodes.map(n => { const r=n.getBoundingClientRect(); return { left:r.left,right:r.right,top:r.top }; }));
  for (const box of choices) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(375); expect(box.top).toBeGreaterThanOrEqual(0); }
  await page.evaluate(() => document.documentElement.classList.add('rm'));
  await expect(fan.getByRole('option').first()).toHaveCSS('transition-property', 'opacity');
  await page.keyboard.press('Escape');
  await page.getByText('A text block', { exact: true }).click();
  await fan.getByRole('button', { name: 'Text actions', exact: true }).click();
  const bounds = await fan.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await expect(fan.getByRole('button', { name: 'Send away', exact: true })).toBeVisible();
});
