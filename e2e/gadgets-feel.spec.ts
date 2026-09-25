import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The feel model (tokens.gadgets.feel, .jobs, .set) and the spec validator, as a reader meets them
// on Foundations › Gadgets: a feel crossing a material boundary re-casts the object, a job's pin
// wins over feel, the worked set is checked side by side, and every broken spec says how to fix it.
const bench = (page: import('@playwright/test').Page) => page.getByTestId('feel-bench');

async function choose(page: import('@playwright/test').Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('feel picks the material, and crossing a boundary re-casts the object', async ({ page }) => {
  await open(page, '/foundations/gadgets', 'bone');
  await expect(bench(page)).toHaveAttribute('data-material', 'resin');     // link, a 0.8, w 0.4: active → resin
  const weight = page.getByRole('slider', { name: 'Weight' });
  await weight.focus();
  await weight.press('PageUp');                                            // w 0.5, still active → metal
  await expect(bench(page)).toHaveAttribute('data-material', 'metal');
  await expect(page.getByTestId('feel-material')).toHaveText('Metal');
  await weight.press('PageUp'); await weight.press('PageUp'); await weight.press('PageUp');   // w 0.8 → glass
  await expect(bench(page)).toHaveAttribute('data-material', 'glass');
  const valence = page.getByRole('slider', { name: 'Valence' });
  await valence.focus();
  for (let i = 0; i < 3; i++) await valence.press('PageDown');             // v 0.4, still heavy → rubber
  await expect(bench(page)).toHaveAttribute('data-material', 'rubber');
});

test("a job's pin wins over feel", async ({ page }) => {
  await open(page, '/foundations/gadgets', 'graphite');
  await choose(page, 'Job', 'identify');
  await expect(bench(page)).toHaveAttribute('data-job', 'identify');
  await expect(bench(page)).toHaveAttribute('data-material', 'glass');
  await choose(page, 'Job', 'command');
  await expect(bench(page)).toHaveAttribute('data-material', 'ceramic');
});

test('the worked set resolves, and side by side it says where it repeats itself', async ({ page }) => {
  await open(page, '/foundations/gadgets', 'bone');
  await expect(page.getByTestId('worked-set').locator('[data-placement]')).toHaveCount(11);
  await expect(page.locator('[data-placement="trash"]')).toHaveAttribute('data-material', 'rubber');
  await expect(page.locator('[data-placement="account"]')).toHaveAttribute('data-material', 'glass');
  await expect(page.locator('[data-placement="capture"]')).toHaveAttribute('data-material', 'resin');
  await expect(page.getByTestId('set-problems').locator('[data-code="set.hue"]').first()).toBeVisible();
  await expect(page.getByTestId('set-problems').locator('[data-code="set.cvd"]').first()).toBeVisible();
});

const BROKEN: [string, string][] = [
  ['Break: an invented part', 'part.unknown'],
  ['Break: no lamp', 'part.roles'],
  ['Break: beeping at rest', 'state.beep'],
  ['Break: an unbound slot', 'mechanism.unbound'],
  ['Break: a jack cut from clay', 'part.material'],
  ['Break: off the canvas', 'part.offCanvas'],
  ['Break: a feel out of range', 'field.range'],
  ['Break: an old schema', 'schema.version'],
  ['Break: cables in a loop', 'cable.cycle'],
  ['Break: a cable of the wrong kind', 'port.kind'],
  ['Break: two of the same', 'set.band'],
];

test('valid specs pass and every broken one names its problem and its fix', async ({ page }) => {
  await open(page, '/foundations/gadgets', 'bone');
  const specBench = page.getByTestId('spec-bench');
  for (const valid of ['Patch bay (valid)', 'Counter drum (valid)', 'Needle gauge (valid)', 'Reading rig (valid)']) {
    await choose(page, 'Example spec', valid);
    await expect(specBench.locator('[data-result="ok"]')).toBeVisible();
  }
  for (const [label, code] of BROKEN) {
    await choose(page, 'Example spec', label);
    const problem = specBench.locator(`[data-code="${code}"]`).first();
    await expect(problem, label).toBeVisible();
    await expect(problem.locator('text=→').first(), `${label} offers a fix`).toBeVisible();
  }
  // Editing the text validates as you type.
  await choose(page, 'Example spec', 'Counter drum (valid)');
  await page.getByRole('textbox', { name: 'Spec' }).fill('{ "$schema": "metalui/gadget@1" ');
  await expect(specBench.locator('[data-result="parse"]')).toBeVisible();
});

for (const colorway of COLORWAYS) {
  test(`gadgets page in ${colorway}`, async ({ page }) => {
    await open(page, '/foundations/gadgets', colorway);
    await page.locator('section', { hasText: 'Choose a job, then move through the space' }).first().screenshot({ path: capture(`gadgets-feel-${colorway}`) });
    await page.getByTestId('worked-set').screenshot({ path: capture(`gadgets-worked-set-${colorway}`) });
  });
}
