// Compile a list of class candidates against MetalUI's Tailwind theme (theme.css), as a consumer's
// Tailwind would: returns the generated CSS and the candidates that produced nothing.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { root } from './emit.mjs';

const require = createRequire(import.meta.url);

export async function compileCandidates(candidates) {
  const { compile } = await import(require.resolve('@tailwindcss/node'));
  const tw = root('node_modules/tailwindcss');
  const css = [
    readFileSync(`${tw}/theme.css`, 'utf8'),
    readFileSync(root('packages/metalui/src/components/theme.css'), 'utf8'),
    '@tailwind utilities;',
  ].join('\n');
  const compiler = await compile(css, { base: root('packages/metalui'), onDependency() {} });
  // The compiler accumulates candidates, so a candidate that adds nothing to the output is unknown.
  const unknown = [];
  let size = compiler.build([]).length;
  for (const c of candidates) {
    const next = compiler.build([c]).length;
    if (next === size) unknown.push(c);
    size = next;
  }
  return { css: compiler.build([]), unknown };
}
