import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Work in progress: every page carries one quiet notice that links to the page listing what is
// unfinished; that page reads SwiftUI placeholders, blocks and open backlog items from their sources.
const notice = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Work in progress' });

test('every kind of page carries the notice', async ({ page }) => {
  for (const path of ['/overview', '/foundations/color', '/components/button', '/blocks/studio-week', '/icons']) {
    await open(page, path, 'bone');
    await expect(notice(page)).toContainText('Work in progress');
    await expect(notice(page).getByRole('link', { name: "What's unfinished" })).toHaveAttribute('href', '/wip');
  }
});

for (const colorway of COLORWAYS) {
  test(`the notice leads to what is unfinished, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/slider', colorway);
    await page.screenshot({ path: capture(`docs-wip-notice-${colorway}`), clip: { x: 0, y: 0, width: 1280, height: 360 } });
    await notice(page).getByRole('link', { name: "What's unfinished" }).click();
    await expect(page).toHaveURL(/\/wip$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Work in progress' })).toBeVisible();
    // On its own page the notice doesn't link to itself.
    await expect(notice(page).getByRole('link')).toHaveCount(0);
    // The real remaining Table adapter is declared wip; completed native ports leave this list.
    const swift = page.locator('#swiftui');
    await expect(swift.getByRole('link', { name: 'Table', exact: true })).toBeVisible();
    await expect(swift.getByRole('link', { name: 'Drop zone', exact: true })).toHaveCount(0);
    await expect(swift.getByRole('link', { name: 'Button', exact: true })).toHaveCount(0);
    // Blocks and open backlog topics.
    await expect(page.locator('#blocks').getByRole('link', { name: 'Studio week' })).toBeVisible();
    const reworks = page.locator('#reworks');
    await expect(reworks.getByRole('heading', { name: /Being reworked/ })).toBeVisible();
    await expect(reworks).toContainText('Open items from the backlog, by topic.');
    // A topic is allowed to finish; any topics still listed must declare their open count.
    for (const topic of await reworks.getByRole('listitem').all()) await expect(topic).toContainText(/\d+ open/);
    await page.screenshot({ path: capture(`docs-wip-${colorway}`), fullPage: true });
  });
}
