import { readFileSync } from 'node:fs';
import { expect, test, type Locator } from '@playwright/test';
import { compileCandidates } from '../scripts/lib/tw.mjs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const nativeStyles = (control: Locator) => control.evaluate((element) => {
  const style = getComputedStyle(element);
  return Object.fromEntries(['font-family', 'font-size', 'line-height', 'padding', 'border-width', 'box-sizing', 'appearance']
    .map((property) => [property, style.getPropertyValue(property)]));
});

for (const mode of ['layered package', 'unlayered package', 'Tailwind source'] as const) {
  test(`shared layout preserves consumer CSS: ${mode}`, async ({ page }) => {
    const source = mode === 'Tailwind source';
    await page.setContent(`
      <style>
        :root { --spacing: 7px; --font-sans: monospace; }
        body { font-family: monospace; }
        ${source ? '' : '.p-4 { padding: calc(var(--spacing) * 4); }'}
      </style>
      <main class="p-4" id="host">
        <h2 id="heading">Consumer content</h2>
        <button id="native">Native button</button>
        <div id="default" class="mu-stack"><span>One</span><span>Two</span></div>
        <div id="override-last" class="mu-stack gap-mu-group"><span>One</span><span>Two</span></div>
        <div id="override-first" class="gap-mu-group mu-stack"><span>One</span><span>Two</span></div>
        <div id="padding" class="p-mu-space-16">Shared padding</div>
        <div id="cluster" class="mu-cluster" style="width: 220px">
          <button style="width: 150px">First action</button><button style="width: 150px">Second action</button>
        </div>
        <div style="--mu-space-12: 30px">
          <div id="scoped-step" class="mu-stack gap-mu-space-12"><span>One</span><span>Two</span></div>
          <div id="inherited-alias" class="mu-stack"><span>One</span><span>Two</span></div>
          <div id="scoped-alias" class="mu-stack" style="--mu-layout-gap-related: 18px"><span>One</span><span>Two</span></div>
        </div>
        <div id="grid" class="mu-auto-grid" style="width: 180px"><a href="#one">One</a><a href="#two">Two</a></div>
      </main>
    `);
    const native = await nativeStyles(page.locator('#native'));
    const headingMargin = await page.locator('#heading').evaluate((element) => getComputedStyle(element).margin);

    if (source) {
      const { css } = await compileCandidates([
        'p-4', 'mu-stack', 'mu-cluster', 'mu-auto-grid', 'gap-mu-group', 'gap-mu-space-12', 'p-mu-space-16',
      ]);
      // The compiler helper receives raw theme CSS; give its output the cascade boundary
      // provided by a consumer's real Tailwind imports, so defaults cannot override host CSS.
      await page.addStyleTag({ content: `${read('packages/metalui/src/components/tokens.css')}\n@layer theme, base, components, utilities;\n@layer utilities { ${css} }` });
    } else {
      await page.addStyleTag({ content: read(`packages/metalui/dist/styles${mode === 'unlayered package' ? '.unlayered' : ''}.css`) });
    }

    // Importing either delivery lane preserves host fonts, its spacing scale, and native controls.
    await expect(page.locator('#host')).toHaveCSS('padding', '28px');
    await expect(page.locator('#host')).toHaveCSS('font-family', 'monospace');
    expect(await nativeStyles(page.locator('#native'))).toEqual(native);
    await expect(page.locator('#heading')).toHaveCSS('margin', headingMargin);

    await expect(page.locator('#default')).toHaveCSS('display', 'flex');
    await expect(page.locator('#default')).toHaveCSS('flex-direction', 'column');
    await expect(page.locator('#default')).toHaveCSS('gap', '12px');
    for (const id of ['override-last', 'override-first']) {
      await expect(page.locator(`#${id}`)).toHaveCSS('gap', '24px');
    }
    await expect(page.locator('#padding')).toHaveCSS('padding', '16px');

    const cluster = page.locator('#cluster');
    await expect(cluster).toHaveCSS('flex-wrap', 'wrap');
    expect(await cluster.evaluate((element) => element.children[1].getBoundingClientRect().top > element.children[0].getBoundingClientRect().top)).toBe(true);

    // Root aliases resolve before inheritance; scope a semantic property when changing its default.
    await expect(page.locator('#scoped-step')).toHaveCSS('gap', '30px');
    await expect(page.locator('#inherited-alias')).toHaveCSS('gap', '12px');
    await expect(page.locator('#scoped-alias')).toHaveCSS('gap', '18px');

    const grid = page.locator('#grid');
    await expect(grid).toHaveCSS('display', 'grid');
    await expect(grid).toHaveCSS('gap', '24px');
    expect(await grid.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await grid.locator('a').first().focus();
    await page.keyboard.press('Tab');
    await expect(grid.locator('a').last()).toBeFocused();
  });
}
