import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`page and code copy report real results and reset in ${colorway}`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, '/components/button', colorway);
    const pageCopy = page.getByRole('button', { name: 'Copy page as Markdown for agents' });
    await expect(pageCopy.locator('svg')).toHaveAttribute('data-glyph', 'copy');
    await pageCopy.click();
    const copiedPage = page.getByRole('button', { name: 'Copied page as Markdown for agents' });
    await expect(copiedPage.locator('svg')).toHaveAttribute('data-glyph', 'check');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('# Button');
    await copiedPage.evaluate(el => Promise.allSettled(el.getAnimations({ subtree: true }).map(animation => animation.finished)));
    await copiedPage.screenshot({ path: capture(`copy-page-${colorway}`) });
    await expect(pageCopy).toBeVisible({ timeout: 3000 });

    const screen = page.locator('.code-screen').first();
    const codeCopy = screen.getByRole('button');
    await codeCopy.click();
    await expect(codeCopy).toHaveAccessibleName('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<Button');
    // Change the copied content while the acknowledgement is present: it belongs to the old tab.
    await screen.getByRole('radio', { name: 'SwiftUI' }).click();
    await expect(codeCopy).toHaveAccessibleName('Copy');
    await expect(codeCopy.locator('svg')).toHaveAttribute('data-glyph', 'copy');
    await codeCopy.click();
    await expect(codeCopy).toHaveAccessibleName('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('MetalButton');
    await page.waitForTimeout(850);
    await codeCopy.click();
    await page.waitForTimeout(850);
    await expect(codeCopy).toHaveAccessibleName('Copied');
    await expect(codeCopy).toHaveAccessibleName('Copy', { timeout: 2500 });

    await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: () => Promise.reject(new DOMException('Clipboard denied', 'NotAllowedError')) }));
    await codeCopy.click();
    await expect(codeCopy).toHaveAccessibleName('Copy failed');
    await expect(codeCopy.locator('svg')).toHaveAttribute('data-glyph', 'copy');
    await expect(screen).toContainText('MetalButton');
    await codeCopy.screenshot({ path: capture(`copy-failed-${colorway}`) });
  });
}

test('reduced copy keeps a full result and retry works after a clipboard refusal', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/button', 'graphite');
  const screen = page.locator('.code-screen').first();
  const copy = screen.getByRole('button');
  await page.evaluate(() => {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) });
    (window as unknown as { restoreClipboard: () => void }).restoreClipboard = () => Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: write });
  });
  await copy.click();
  await expect(copy).toHaveAccessibleName('Copy failed');
  await page.evaluate(() => (window as unknown as { restoreClipboard: () => void }).restoreClipboard());
  await copy.click();
  await expect(copy).toHaveAccessibleName('Copied');
  await expect(copy.locator('svg')).toHaveAttribute('data-glyph', 'check');
  await expect.poll(() => copy.locator('svg').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  await copy.screenshot({ path: capture('copy-reduced') });
});
