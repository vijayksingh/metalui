import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Share layout answers block width through a nearer container on ${colorway}`, async ({ page }) => {
    await open(page, '/blocks/share-panel', colorway);
    const block = page.getByRole('region', { name: 'Share “Lisbon trip”' });
    await expect(block).toHaveCSS('container-name', 'block');
    const list = block.getByRole('list', { name: 'People with access to Lisbon trip' });
    const row = list.locator(':scope > li').first();
    const columns = () => row.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(await columns()).toBe(4);
    await list.evaluate(el => { el.style.containerType = 'inline-size'; el.style.width = '250px'; });
    expect(await columns()).toBe(4);
    await block.evaluate(el => { el.style.width = '280px'; });
    await expect.poll(columns).toBe(3);
  });

  test(`Composer gutters answer block width through ScrollArea on ${colorway}`, async ({ page }) => {
    await open(page, '/blocks/ai-composer', colorway);
    const block = page.getByRole('region', { name: 'Assistant', exact: true }).first();
    await expect(block).toHaveCSS('container-name', 'block');
    const log = block.getByRole('log', { name: 'Conversation' });
    await expect(log).toHaveCSS('padding-left', '20px');
    await log.evaluate(el => { const parent = el.parentElement!; parent.style.containerType = 'inline-size'; parent.style.width = '250px'; });
    await expect(log).toHaveCSS('padding-left', '20px');
    await block.evaluate(el => { el.style.width = '375px'; });
    await expect(log).toHaveCSS('padding-left', '14px');
  });
}
