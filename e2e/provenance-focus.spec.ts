import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

const original = 'Send #poster tomorrow 4pm, slept 6h in #done by #coffee\nPaint #FF6B3D with Sam; open https://metalui.dev.';

for (const colorway of COLORWAYS) {
  for (const [label, before, after] of [['Task state', '#done', '#dropped'], ['Project tag', '#poster', '#studio']]) {
    test(`focus transfers from numeric typing to ${label} pointer source edit in ${colorway}`, async ({ page }) => {
      await open(page, '/components/provenance-tooltip#source-document', colorway);
      const doc = page.getByTestId('provenance-document'), source = doc.getByRole('textbox', { name: 'Provenance document source', exact: true });
      const target = doc.getByRole('button', { name: new RegExp(`^${label}:`) });
      const scrub = async () => {
        await target.scrollIntoViewIfNeeded();
        await doc.getByRole('spinbutton', { name: 'Sleep', exact: true }).focus();
        const box = (await target.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 24, { steps: 6 });
        await expect(target).toHaveAttribute('data-held', 'true');
        await expect(target).toHaveAttribute('data-value', after);
        await expect(source).toHaveValue(original.replace(before, after));
        await expect(target).toBeFocused();
      };
      await scrub(); await page.keyboard.press('Escape'); await page.mouse.up();
      await expect(source).toHaveValue(original);
      await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
      await scrub(); await page.mouse.up();
      await doc.getByRole('button', { name: 'Undo source edit', exact: true }).click();
      await expect(source).toHaveValue(original);
      await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
    });
  }

  test(`a closing person picker refuses overlapping numeric source capture in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.getByRole('textbox', { name: 'Provenance document source', exact: true });
    const sleep = doc.getByRole('spinbutton', { name: 'Sleep', exact: true });
    await doc.getByRole('combobox', { name: 'Known person: Sam', exact: true }).click();
    await expect(page.getByRole('option', { name: 'Sam', exact: true })).toBeFocused();
    const scrub = async () => {
      const box = (await sleep.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 3, { steps: 3 });
    };
    await scrub(); await page.mouse.up();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(source).toHaveValue(original);
    await expect(sleep).toHaveAttribute('aria-valuetext', '6h, hours');
    await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
    await scrub();
    await expect(sleep).not.toHaveAttribute('aria-valuetext', '6h, hours');
    const words = (await sleep.getAttribute('aria-valuetext'))!.split(',')[0];
    await expect(source).toHaveValue(original.replace('6h', words));
    await page.mouse.up();
    await doc.getByRole('button', { name: 'Undo source edit', exact: true }).click();
    await expect(source).toHaveValue(original);
    await expect(sleep).toHaveAttribute('aria-valuetext', '6h, hours');
    await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
  });

  test(`date handoff from a person picker edits only its own source range in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.getByRole('textbox', { name: 'Provenance document source', exact: true });
    const date = doc.getByRole('spinbutton', { name: 'Send date', exact: true });
    await doc.getByRole('combobox', { name: 'Known person: Sam', exact: true }).click();
    await expect(page.getByRole('option', { name: 'Sam', exact: true })).toBeFocused();
    const box = (await date.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 3, { steps: 3 });
    const words = (await date.getAttribute('aria-valuetext'))!.split(',')[0];
    await expect(source).toHaveValue(original.replace('tomorrow', words));
    await expect(doc.getByRole('combobox', { name: 'Known person: Sam', exact: true })).toHaveCount(1);
    await page.keyboard.press('Escape'); await page.mouse.up();
    await expect(source).toHaveValue(original);
    await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
    await date.focus(); await date.press('Alt+ArrowDown');
    await page.getByRole('button', { name: 'Sunday, 4 October 2026', exact: true }).click();
    await expect(source).toHaveValue(original.replace('tomorrow', 'next Sunday'));
    await doc.getByRole('button', { name: 'Undo source edit', exact: true }).click();
    await expect(source).toHaveValue(original);
    await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
  });
}
