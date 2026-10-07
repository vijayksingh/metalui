import { expect, test } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The landing page is an image of a table of objects; the page still has to be a page for people who do not
// see it: one main landmark, one top-level heading that says what this is, and a way into the docs by keyboard.
for (const colorway of COLORWAYS) {
  test(`the landing page has a main landmark and one h1, in ${colorway}`, async ({ page }) => {
    await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
    await page.goto('/');
    await page.waitForSelector('.landing');
    await expect(page.getByRole('main')).toHaveCount(1);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('UI components that feel like real objects');
    // The heading is for assistive technology: it adds nothing to what people see.
    expect(await h1.evaluate((e) => e.getBoundingClientRect().width <= 1 && e.getBoundingClientRect().height <= 1)).toBe(true);
    // A keyboard user can get into the docs: the call to action is a real button and reachable by Tab.
    const enter = page.getByRole('button', { name: 'Browse Components' });
    await expect(enter).toBeVisible();
    await enter.focus();
    await expect(enter).toBeFocused();
    await page.keyboard.press('Enter');
    // "Browse Components" flies the objects onto the overview's table: the same objects, by name, on the other side.
    await expect(page).toHaveURL(/\/overview$/);
    await expect(page.getByRole('heading', { name: /UI components that look/, level: 1 })).toBeVisible();
    const names = await page.locator('.drift-item').evaluateAll((items) => items.map((e) => (e as HTMLElement).style.viewTransitionName));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.startsWith('float-'))).toBe(true);
  });
}
