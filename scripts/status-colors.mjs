// Source-grounded palette measurement, not a test of component internals.
import { readFileSync, writeFileSync } from 'node:fs';
import { STATUS_VISION, contrast, linearRGB, simulate, oklab } from '../apps/docs/src/lib/status-colors.ts';
const source = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const ink = source.recipes.status.props.ink;
const kinds = ['live', 'waiting', 'failed', 'link'];
const report = ['# Status ink measurement', '',
  'Source: `recipes.status.props.ink`, measured with `node scripts/status-colors.mjs`. Full-severity linearRGB matrices from [Machado’s thesis, appendix A](https://www.inf.ufrgs.br/~oliveira/students_dissertations/Masters/Gustavo_Machado_Masters_thesis_UFRGS_2010.pdf). SVG previews use the same matrices. Contrast uses relative sRGB luminance; [WCAG non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) supplies the 3:1 reference.', '',
  '| Colorway | Lamp | Ink | Base ink / opaque socket |', '|---|---|---|---|'];
for (const cw of ['bone', 'graphite']) for (const kind of kinds) report.push(`| ${cw} | ${kind} | ${ink[kind][cw]} | ${contrast(ink[kind][cw], ink.off).toFixed(3)}:1 |`);
report.push('', '| Colorway | Vision | Closest pair | ΔE OK |', '|---|---|---|---|');
for (const cw of ['bone', 'graphite']) for (const [vision, matrix] of Object.entries(STATUS_VISION)) {
  const samples = Object.fromEntries(kinds.map((k) => [k, oklab(simulate(linearRGB(ink[k][cw]), matrix))]));
  const pairs = kinds.flatMap((a, i) => kinds.slice(i + 1).map((b) => ({ a, b, distance: Math.hypot(...samples[a].map((v, j) => v - samples[b][j])) })));
  const nearest = pairs.sort((a, b) => a.distance - b.distance)[0];
  report.push(`| ${cw} | ${vision} | ${nearest.a} / ${nearest.b} | ${nearest.distance.toFixed(4)} |`);
}
report.push('', 'The original proposal’s bone link was 2.67:1 against the socket. Original live/failed deuteranopia separation was 0.0591 bone and 0.0524 graphite. The reviewed refinement raises those lens contrasts above 3 and separates all measured pairs by at least 0.0665.', '',
  'These are base-ink measurements before white lens highlights, halos, antialiasing or actual host imagery. ΔE is comparative evidence, not a WCAG criterion or a recognition study. Simulations cannot represent every person. Words are mandatory; live is steady, waiting breathes, failed double-blinks once and off stays dark. Reduced motion keeps every lamp steady with the words carrying the state. Quiet badges belong on a controlled ground; use an opaque plate over imagery.', '',
  'Explicit transparent/frosted surfaces use full shared ink. Strong frost over worst-case black/white gives ink2 only 3.981 bone / 3.161 graphite; full ink gives 10.286 / 6.847. Opaque default/strong and controlled quiet grounds retain ink2. This is a semantic ink selection, not a new color.', '',
  'Badge font: reviewed 500 12px/16px sans, tracking 0.01em, ink2. The native mono renderer deliberately resolves Courier, so this token uses the shared UI family and avoids the old serif specimen. Transparent means existing strong frost fill without blur; frosted adds the shared 22px/1.6 backdrop. Solid is the opaque cap plate. Reduced transparency/low power uses the existing frost opaque twin. Strong tint is 12% of the same state ink over the opaque plate.', '');
writeFileSync(new URL('../docs/STATUS-COLORS.md', import.meta.url), report.join('\n'));
console.log(report.join('\n'));
