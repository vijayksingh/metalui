import { expect, test } from '@playwright/test';
import { open, COLORWAYS } from './helpers';
for (const colorway of COLORWAYS) test(`OPEN names its shared external glyph and stays the only link on ${colorway}`, async ({ page }) => {
  await open(page, '/components/link-card', colorway);
  await page.evaluate(() => document.documentElement.setAttribute('data-mu-motion', 'reduce'));
  const card = page.locator('main .mu-linkcard').first(); const action = card.getByRole('link', { name: 'OPEN', exact: true });
  await expect(card.getByRole('link')).toHaveCount(1); await expect(action).toHaveAttribute('target', '_blank'); await expect(action).toHaveAttribute('rel', 'noopener noreferrer');
  const glyph = action.locator('svg.mu-ic-external'); await expect(glyph).toHaveCount(1);
  expect((await glyph.boundingBox())!.height).toBe(14);
  await action.focus(); await expect(action).toBeFocused();
  await page.context().route('https://lanterns.photo/**', route => route.fulfill({ body: 'Link opened', contentType: 'text/plain' }));
  const popup = page.waitForEvent('popup'); await action.press('Enter'); const opened = await popup; await expect(opened).toHaveURL(/lanterns\.photo\/night-market/); await opened.close();
  await card.screenshot({ path: `docs/captures/web/link-card-open-${colorway}.png` });
});
