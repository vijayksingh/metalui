import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open, withoutPointerLock } from './helpers';

test.beforeEach(({ page }) => withoutPointerLock(page));
const original = 'Send #poster tomorrow 4pm, slept 6h in #done by #coffee\nPaint #FF6B3D with Sam; open https://metalui.dev.';
for (const colorway of COLORWAYS) {
  test(`pointer scrub after another focused cue keeps clock face and source together in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.locator('textarea[aria-label="Provenance document source"]');
    const sleep = doc.getByRole('spinbutton', { name: 'Sleep', exact: true });
    const clock = doc.getByRole('spinbutton', { name: 'Send time', exact: true });
    await clock.scrollIntoViewIfNeeded();
    const scrub = async () => {
      await sleep.focus();
      await expect(doc).toHaveAttribute('data-editing', 'true');
      const box = (await clock.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 3, { steps: 3 });
      await expect(clock).not.toHaveAttribute('aria-valuetext', '4pm, time of day');
      const words = (await clock.getAttribute('aria-valuetext'))!.split(',')[0];
      await expect(source).toHaveValue(original.replace('4pm', words));
      await expect(doc).toHaveAttribute('data-editing', 'true');
      await expect(clock).toBeFocused();
    };
    await scrub();
    await page.keyboard.press('Escape'); await page.mouse.up();
    await expect(source).toHaveValue(original);
    await expect(clock).toHaveAttribute('aria-valuetext', '4pm, time of day');
    await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
    await scrub(); await page.mouse.up();
    await expect(doc).not.toHaveAttribute('data-editing');
    await doc.getByRole('button', { name: 'Undo source edit', exact: true }).click();
    await expect(source).toHaveValue(original);
    await expect(clock).toHaveAttribute('aria-valuetext', '4pm, time of day');
    await expect(doc.getByRole('button', { name: 'Undo source edit', exact: true })).toBeDisabled();
  });
}
for (const colorway of COLORWAYS) {
  test(`one provenance source retains UTF16 history through clock, quantity and state in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document');
    const source = doc.locator('textarea[aria-label="Provenance document source"]');
    const words = `🧠 ${original}`;
    await source.fill(words); await source.evaluate((field, count) => { (field as HTMLTextAreaElement).setSelectionRange(count, count); field.dispatchEvent(new Event('select', { bubbles: true })); }, words.length);
    await doc.getByRole('spinbutton', { name: 'Sleep', exact: true }).focus();
    await expect(doc.getByRole('spinbutton', { name: 'Sleep', exact: true })).toHaveAccessibleDescription(/You.*sleep quantity.*horizontally/);
    await page.keyboard.press('Alt+ArrowRight');
    await expect(source).toHaveValue(words.replace('6h', '360min'));
    await page.keyboard.press('Enter');
    await doc.getByRole('button', { name: /Task state/ }).focus();
    await expect(page.locator('.mu-provenance', { hasText: 'Explicit source words' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(source).toHaveValue(words.replace('6h', '360min').replace('#done', '#dropped'));
    await expect(doc.getByRole('status', { name: 'Retained source selection' })).toContainText(`UTF16 ${words.length + 7}–${words.length + 7}`);
    await doc.getByRole('button', { name: 'Undo source edit' }).click();
    await expect(source).toHaveValue(words.replace('6h', '360min'));
    await doc.getByRole('button', { name: 'Undo source edit' }).click(); await expect(source).toHaveValue(words);
    await doc.getByRole('spinbutton', { name: 'Send time', exact: true }).focus(); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
    await expect(source).toHaveValue(words.replace('4pm', '4:15pm'));
    await source.focus(); await source.press('Meta+z');
    await expect(source).toHaveValue(words); await expect(source).toBeFocused();
    expect(await source.evaluate(field => (field as HTMLTextAreaElement).selectionStart)).toBe(words.length);
    await expect(doc.locator('.mu-swap-layer[data-state=out]')).toHaveCount(0);
    await doc.screenshot({ path: capture(`provenance-document-${colorway}`) });
  });
  test(`provenance hides during a held state and cancellation restores its source in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.locator('textarea[aria-label="Provenance document source"]');
    const state = doc.getByRole('button', { name: /Task state/ });
    await state.focus(); await expect(page.locator('.mu-provenance', { hasText: 'Explicit source words' })).toBeVisible();
    // Reading reserves the editing instrument only after pickup.
    let before: Awaited<ReturnType<typeof state.boundingBox>>;
    const rect = (await state.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down();
    await expect(state).toHaveAttribute('data-held', 'true');
    before = await doc.getByTestId('provenance-tail-0').boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2 - 48, { steps: 6 });
    await expect(source).not.toHaveValue(original);
    await expect(page.locator('.mu-provenance', { hasText: 'Explicit source words' })).toHaveCount(0);
    await expect(state).toHaveAttribute('aria-description', /You, Explicit source words/);
    await expect(state.locator('[data-enum-instrument] > span')).toHaveCount(2);
    const during = await doc.getByTestId('provenance-tail-0').boundingBox();
    expect(during!.x).toBeCloseTo(before!.x, 1); expect(during!.y).toBeCloseTo(before!.y, 1);
    await page.keyboard.press('Escape'); await page.mouse.up();
    await expect(source).toHaveValue(original);
    await expect(state.locator('[data-enum-instrument] > span')).toHaveCount(0);
    await expect(doc.getByRole('button', { name: 'Undo source edit' })).toBeDisabled();
    const sleep = doc.getByRole('spinbutton', { name: 'Sleep', exact: true });
    await sleep.focus(); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Escape');
    await expect(source).toHaveValue(original.replace('6h', '6h5'));
    await doc.getByRole('button', { name: 'Undo source edit' }).click();
    await expect(source).toHaveValue(original);
    await expect(doc.locator('.mu-swap-layer[data-state=out]')).toHaveCount(0);
    await doc.screenshot({ path: capture(`provenance-document-${colorway}-reduced`) });
  });
}

for (const colorway of COLORWAYS) {
  test(`source provenance stays operable through a person picker and captured hash in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.locator('textarea[aria-label="Provenance document source"]');
    const person = doc.getByRole('combobox', { name: 'Known person: Sam', exact: true });
    await person.focus(); await expect(page.locator('.mu-provenance', { hasText: 'Explicit source words' })).toBeVisible();
    await person.press('Enter'); await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('a'); await page.keyboard.press('Enter');
    await expect(source).toHaveValue(original.replace('Sam;', 'Ana;'));
    await expect(doc.getByRole('combobox', { name: 'Known person: Ana', exact: true })).toBeFocused();
    await doc.getByRole('button', { name: 'Undo source edit' }).click(); await expect(source).toHaveValue(original);
    await source.focus(); await source.press('End'); await source.press('Control+End'); await source.press('Meta+ArrowDown');
    await source.press('Space'); await source.press('#');
    const typed = `${original} #`; await expect(source).toHaveValue(typed);
    const search = page.getByRole('combobox', { name: 'Find a source tag', exact: true });
    await search.fill('studio'); await page.getByRole('option', { name: '#studio', exact: true }).click();
    await expect(source).toHaveValue(`${original} #studio`); await expect(source).toBeFocused();
    expect(await source.evaluate(field => (field as HTMLTextAreaElement).selectionStart)).toBe(original.length + 8);
    await doc.getByRole('button', { name: 'Undo source edit' }).click(); await expect(source).toHaveValue(typed);
    await doc.getByRole('button', { name: 'Undo source edit' }).click(); await expect(source).toHaveValue(original);
  });
}

for (const colorway of COLORWAYS) {
  test(`the real link edits exact source and its adjacent punctuation follows the host in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.locator('textarea[aria-label="Provenance document source"]');
    const link = doc.getByRole('link', { name: 'Reference link: https://metalui.dev', exact: true });
    await expect(link).toHaveAttribute('href', 'https://metalui.dev');
    await link.focus(); await expect(link).toHaveAccessibleDescription(/Enter follows.*You.*Explicit source words/);
    await doc.getByRole('button', { name: 'Edit Reference link URL', exact: true }).click();
    const field = page.getByRole('textbox', { name: 'Reference link URL', exact: true });
    await field.fill('https://example.com/notes#one'); await expect(source).toHaveValue(original);
    await field.press('Enter'); await expect(source).toHaveValue(original.replace('https://metalui.dev', 'https://example.com/notes#one'));
    const after = await doc.getByTestId('provenance-tail-1').boundingBox();
    const current = await doc.locator('.mu-link-cue').boundingBox();
    expect(after!.x - (current!.x + current!.width)).toBeLessThan(2);
    expect(Math.abs(after!.y - current!.y)).toBeLessThan(4);
    await doc.getByRole('button', { name: 'Undo source edit' }).click(); await expect(source).toHaveValue(original);
    await expect(doc.getByRole('button', { name: 'Undo source edit' })).toBeDisabled();
  });
}

for (const colorway of COLORWAYS) {
  test(`authored Unicode spellings retain exact source, selection and history in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.locator('textarea[aria-label="Provenance document source"]');
    const composed = `é ${original}`, decomposed = `e\u0301 ${original}`;
    await source.fill(composed); await source.press('Tab'); await source.focus();
    await source.press('Control+Home'); await source.press('Meta+ArrowUp'); await source.press('Shift+ArrowRight');
    expect(await source.evaluate(field => [(field as HTMLTextAreaElement).selectionStart, (field as HTMLTextAreaElement).selectionEnd])).toEqual([0, 1]);
    await page.keyboard.insertText('e\u0301'); await expect(source).toHaveValue(decomposed);
    expect(await source.evaluate(field => (field as HTMLTextAreaElement).selectionStart)).toBe(2);
    await source.press('Meta+z'); await expect(source).toHaveValue(composed);
    expect(await source.evaluate(field => [(field as HTMLTextAreaElement).selectionStart, (field as HTMLTextAreaElement).selectionEnd])).toEqual([0, 1]);
    await source.press('Meta+Shift+z'); await expect(source).toHaveValue(decomposed);
    expect(await source.evaluate(field => (field as HTMLTextAreaElement).selectionStart)).toBe(2);
    await source.press('Control+Home'); await source.press('Meta+ArrowUp');
    await doc.getByRole('button', { name: /Task state/ }).focus(); await page.keyboard.press('Space');
    await expect(source).toHaveValue(decomposed.replace('#done', '#dropped'));
    await source.focus(); await source.press('Meta+z'); await expect(source).toHaveValue(decomposed);
    expect(await source.evaluate(field => (field as HTMLTextAreaElement).selectionStart)).toBe(0);
  });
}

for (const colorway of COLORWAYS) {
  test(`the declared source host accepts exact minute quantities and leaves sub-minute words authored in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document'), source = doc.locator('textarea[aria-label="Provenance document source"]');
    const fractional = original.replace('6h', '6.001min');
    await source.fill(fractional); await source.press('Tab');
    await expect(doc.getByRole('spinbutton', { name: 'Sleep', exact: true })).toHaveCount(0);
    await expect(doc.getByTestId('provenance-line-0')).toContainText('6.001min');
    await expect(source).toHaveValue(fractional);
    const exact = original.replace('6h', '0.1h');
    await source.fill(exact); await source.press('Tab');
    const sleep = doc.getByRole('spinbutton', { name: 'Sleep', exact: true });
    await sleep.focus(); await page.keyboard.press('Alt+ArrowRight');
    await expect(source).toHaveValue(original.replace('6h', '6min'));
    await doc.getByRole('button', { name: 'Undo source edit' }).click(); await expect(source).toHaveValue(exact);
    await source.fill(original.replace('6h', '24.1h')); await source.press('Tab');
    await expect(doc.getByRole('spinbutton', { name: 'Sleep', exact: true })).toHaveCount(0);
  });
}

for (const colorway of COLORWAYS) for (const width of [375, 1280]) {
  test(`reading sentence keeps glyphs inline and words compact at ${width} in ${colorway}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/provenance-tooltip#source-document', colorway);
    const doc = page.getByTestId('provenance-document');
    const geometry = await doc.evaluate(element => {
      const lines = Array.from(element.querySelectorAll<HTMLElement>('.mu-mark-line'));
      const glyphs = Array.from(element.querySelectorAll<HTMLElement>('.mu-mark-meaning')).map(glyph => {
        const face = glyph.closest('.mu-cue')!, words = face.querySelector('.mu-mark-words')!;
        const g = glyph.getBoundingClientRect(), w = words.getBoundingClientRect(), f = face.getBoundingClientRect();
        return { gap: w.left - g.right, middle: Math.abs((g.top + g.bottom) / 2 - (w.top + w.bottom) / 2), excess: f.width - g.width - w.width - parseFloat(getComputedStyle(face).paddingLeft) - parseFloat(getComputedStyle(face).paddingRight) };
      });
      const link = element.querySelector<HTMLElement>('.mu-link-cue')!, anchor = link.querySelector<HTMLAnchorElement>('a:not([tabindex="-1"])')!;
      return { glyphs, linkGap: link.getBoundingClientRect().width - anchor.getBoundingClientRect().width,
        overflow: lines.map(line => line.scrollWidth - line.clientWidth),
        space: getComputedStyle(element.querySelector('.mu-mark-line > span')!).whiteSpace,
        font: getComputedStyle(element.querySelector('.mu-mark-line')!).fontSize,
        colorFont: getComputedStyle(element.querySelector('.mu-colour-cue')!).fontSize,
        linkFont: getComputedStyle(anchor).fontSize };
    });
    expect(geometry.glyphs).toHaveLength(6);
    for (const glyph of geometry.glyphs) { expect(glyph.gap).toBeGreaterThanOrEqual(3); expect(glyph.gap).toBeLessThanOrEqual(5); expect(glyph.middle).toBeLessThan(4); expect(glyph.excess).toBeLessThan(6); }
    expect(geometry.linkGap).toBeGreaterThanOrEqual(17); expect(geometry.linkGap).toBeLessThan(19);
    expect(geometry.overflow.every(excess => excess <= 1)).toBe(true);
    expect(geometry.space).toBe('pre-wrap');
    expect(geometry.colorFont).toBe(geometry.font); expect(geometry.linkFont).toBe(geometry.font);
    const source = doc.getByRole('textbox', { name: 'Provenance document source', exact: true });
    await source.fill('Check this reference link: https://metalui.dev.'); await source.press('Tab');
    expect(await doc.getByTestId('provenance-line-0').evaluate(line => line.scrollWidth - line.clientWidth)).toBeLessThanOrEqual(1);
    await source.fill(original); await source.press('Tab');
    await expect(doc.locator('.mu-swap-layer[data-state=out]')).toHaveCount(0);
    await doc.locator('p.type-meta').click();
    await expect(page.locator('.mu-provenance', { hasText: 'Explicit source words' })).toHaveCount(0);
    await doc.screenshot({ path: capture(`provenance-reading-${colorway}-${width}`) });
  });
}
