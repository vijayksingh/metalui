import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Pull Part on Parts › Pull: a bar standing out in front of its drawer front on two posts, with
// its shadow; a recess cut into the front instead, with no posts and no shadow.
for (const colorway of COLORWAYS) {
  test(`pulls in ${colorway}`, async ({ page }) => {
    await open(page, '/components/pull', colorway);
    const looks = page.getByTestId('pull-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(3);
    expect(await looks.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="pull"]')!.getAttribute('data-style')))).toEqual(['bar', 'recess', 'bar']);
    await expect(looks.first().locator('[data-part="pull"] rect')).toHaveCount(2);
    await expect(looks.first().locator('[data-part="pull.shadow"]')).toHaveCount(1);
    await expect(looks.nth(1).locator('[data-part="pull.shadow"]')).toHaveCount(0);
    // A bar stands out below the front's edge; a recess lies inside the front.
    const box = (i: number, part: string) => looks.nth(i).locator(`[data-part="${part}"]`).first().boundingBox();
    const [front, bar] = [await box(0, 'pull.front'), await box(0, 'pull')];
    expect(bar!.y + bar!.height).toBeGreaterThan(front!.y + front!.height);
    const [front2, slot] = [await box(1, 'pull.front'), await box(1, 'pull')];
    expect(slot!.y).toBeGreaterThan(front2!.y);
    expect(slot!.y + slot!.height).toBeLessThan(front2!.y + front2!.height);
    await page.getByTestId('pull-looks').screenshot({ path: capture(`pull-${colorway}`) });
  });
}
