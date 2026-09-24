import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Region: dragging a block over a region lights it and says the drop; dropping lands it inside and counts it;
// double-click renames; dim and past states.
for (const colorway of COLORWAYS) {
  test(`drag a block into Done in ${colorway}`, async ({ page }) => {
    await open(page, '/components/region', colorway);
    const board = page.getByTestId('region-board');
    const done = board.locator('[data-region="done"]');
    const block = board.getByTestId('drag-block');
    const b = (await block.boundingBox())!, g = (await done.boundingBox())!;
    await page.mouse.move(b.x + 20, b.y + 10);
    await page.mouse.down();
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2, { steps: 8 });
    await expect(done).toHaveAttribute('data-over', '');
    await expect(done.locator('.mu-region-rule')).toHaveText('drop to mark tasks done');
    await done.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const ring = await done.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(ring).toContain('rgba(63, 185, 122, 0.45) 0px 0px 0px 1px inset');
    await page.locator('section', { hasText: 'Drop a block' }).first().screenshot({ path: capture(`region-over-${colorway}`) });
    await page.mouse.up();
    await expect(done).not.toHaveAttribute('data-over', '');
    await expect(done.locator('.mu-region-count')).toHaveText('1');
    await block.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const nb = (await block.boundingBox())!, ng = (await done.boundingBox())!;
    expect(nb.x).toBeGreaterThan(ng.x);
    expect(nb.x + nb.width).toBeLessThan(ng.x + ng.width);
    // Rename by double-click.
    await board.locator('[data-region="todo"] .mu-region-name').dblclick();
    const field = board.getByRole('textbox', { name: 'Region name' });
    await field.fill('Doing');
    await page.keyboard.press('Enter');
    await expect(board.locator('[data-region="todo"] .mu-region-name')).toHaveText('Doing');
    await expect(board.locator('[data-region="todo"]')).toHaveAttribute('aria-label', /Region Doing/);
    await page.locator('section', { hasText: 'a pinned lens with rows' }).first().screenshot({ path: capture(`region-states-${colorway}`) });
  });
}
