// Every component inherits the CSS habits: hover and focus work for the person's input, scroll stays
// inside its pane, motion uses tokens, and layout respects the host. This compiles the shipped CSS
// and flags the habits marked Linted in docs/CSS_HABITS.md, with nesting resolved in every selector.
// Existing ones are listed in lint-css-habits.allow.json by their selector and declaration; a new one fails.
// Fix one and --ratchet to drop it. --rule <id> lists every current break of that habit.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { root } from './lib/emit.mjs';

const require = createRequire(root('package.json'));
const postcss = require('postcss');
const RULES = ['hover-gate', 'focus-outline', 'overscroll-contain', 'motion-tokens', 'transition-all', 'ease-in', 'logical-inline', 'viewport-units', 'safe-area-fallback', 'z-index', 'overflow-clip', 'title-balance', 'ellipsis-complete'];
const allowPath = root('scripts/lint-css-habits.allow.json');
const option = (flag) => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : null;
const only = option('--rule'), input = option('--css');
if (process.argv.includes('--rule') && !RULES.includes(only) || process.argv.includes('--css') && (!input || input.startsWith('--'))) {
  console.error(`lint-css-habits: use --rule <${RULES.join('|')}>`);
  process.exit(1);
}
const space = (s) => s.replace(/\s+/g, ' ').trim();
const pseudo = (name) => new RegExp(`(?<!\\\\):${name}(?![\\w-])`, 'i');
const focus = /(?<!\\):focus-(visible|within)(?![\w-])/gi;
const none = (v) => /(^|\s)none($|\s)/i.test(v);
const outline = (d) => /^(outline|outline-style)$/.test(d.prop);
const utility = (s) => ['.outline-none', '.focus-visible\\:outline-none', '.focus-visible\\:outline-none:focus-visible'].includes(s);
const calls = (value, name) => {
  const out = [], re = new RegExp(`\\b${name}\\(`, 'gi');
  for (let m; (m = re.exec(value));) {
    let end = re.lastIndex, depth = 1, quote = '';
    for (; end < value.length && depth; end++) {
      const c = value[end];
      if (c === '\\') { end++; continue; }
      if (quote) { if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'") quote = c;
      else if (c === '(') depth++;
      else if (c === ')') depth--;
    }
    out.push({ start: m.index, end, args: value.slice(re.lastIndex, end - 1) });
    re.lastIndex = end;
  }
  return out;
};
const withoutVars = (v) => { for (const c of calls(v, 'var').reverse()) v = v.slice(0, c.start) + ' ' + v.slice(c.end); return v; };

let css;
if (input) css = readFileSync(input, 'utf8');
else {
  const dir = mkdtempSync(join(tmpdir(), 'metalui-css-habits-')), path = join(dir, 'styles.css');
  try {
    execFileSync(root('node_modules/.bin/tailwindcss'), ['-i', 'styles.input.css', '-o', path], { cwd: root('packages/metalui'), stdio: 'pipe' });
    css = readFileSync(path, 'utf8');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const ast = postcss.parse(css);
const selectors = new Map();
const resolved = (r) => {
  if (selectors.has(r)) return selectors.get(r);
  let parent = r.parent;
  while (parent && parent.type !== 'rule') parent = parent.parent;
  const own = postcss.list.comma(r.selector), bases = parent ? resolved(parent) : [];
  const list = bases.length ? own.flatMap((s) => {
    if (!s.includes('&')) return bases.map((p) => space(`${p} ${s}`));
    const [first, ...parts] = s.split('&');
    return parts.reduce((list, part) => list.flatMap((t) => bases.map((p) => t + p + part)), [first]).map(space);
  }) : own.map(space);
  selectors.set(r, list);
  return list;
};
const ignored = (r) => {
  for (let p = r; p; p = p.parent) {
    if (p.type === 'atrule' && p.name === 'property') return true;
    if (p.type === 'rule' && /^:root\s*,\s*:host$|^:host\s*,\s*:root$/.test(p.selector.trim())) return true;
  }
  return false;
};
const gated = (r) => {
  let hover = false, pointer = false;
  for (let p = r.parent; p; p = p.parent) if (p.type === 'atrule' && p.name === 'media') {
    const branches = postcss.list.comma(p.params);
    const requires = (re) => branches.every((s) => !/\b(not|or)\b/i.test(s) && re.test(s));
    hover ||= requires(/\(\s*hover\s*:\s*hover\s*\)/i);
    pointer ||= requires(/\(\s*pointer\s*:\s*fine\s*\)/i);
  }
  return hover && pointer;
};
const rules = [], rings = new Set();
ast.walkRules((r) => {
  if (ignored(r)) return;
  const decls = r.nodes.filter((d) => d.type === 'decl'), sels = resolved(r);
  rules.push({ r, decls, sels });
  if (decls.some((d) => outline(d) && !none(d.value))) for (const s of sels) {
    if (pseudo('focus-(visible|within)').test(s)) rings.add(s.replace(focus, ''));
  }
});

const found = [];
const add = (id, s, d) => found.push({ id, key: `${id}: ${space(s)} ‖ ${d.prop}: ${space(d.value)}` });
for (const { r, decls, sels } of rules) for (const s of sels) {
  // A hover inside :not() is the rest state, true on touch, so it stays ungated.
  const hover = pseudo('hover').test(calls(s, 'not').reverse().reduce((t, c) => t.slice(0, c.start) + t.slice(c.end), s)) && !gated(r);
  const scroller = !decls.some((d) => /^overscroll-behavior(?:-|$)/.test(d.prop));
  // A shadow on a ::before/::after is that layer's own (a revealed chip), not the focus ring.
  const shadow = pseudo('focus-visible').test(s) && !/::?(before|after)$/.test(s) && !decls.some(outline) && !utility(s);
  for (const d of decls) {
    const p = d.prop, v = d.value, plain = withoutVars(v);
    if (hover) add('hover-gate', s, d);
    if (!utility(s) && (outline(d) && none(v) && !rings.has(s.replace(focus, '')) || shadow && p === 'box-shadow')) add('focus-outline', s, d);
    if (/^overflow(?:-[xy])?$/.test(p) && /(^|\s)(auto|scroll)($|\s)/i.test(v) && scroller && !/^\.overflow(-[xy])?-(auto|scroll)$/.test(s)) add('overscroll-contain', s, d);
    if (!p.startsWith('--') && /^(transition|animation)(-|$)|-(duration|timing-function)$/.test(p) && /(?<![\w.])[-+]?(?:\d*\.)?\d+(?:ms|s)\b|\bcubic-bezier\(/i.test(plain.replace(/(?<![\w.])[-+]?0*\.?0+(?:ms|s)\b/g, ''))) add('motion-tokens', s, d);
    if (/^transition(-property)?$/.test(p) && /(^|[\s,])all($|[\s,)])/i.test(v)) add('transition-all', s, d);
    if (/^(transition|animation)(-|$)/.test(p) && /(^|[\s,])ease-in($|[\s,])/i.test(v)) add('ease-in', s, d);
    // Centring on the middle (left: 50%, calc(50% …)) reads the same in either direction.
    if ((/^(margin|padding)-(left|right)$|^border-(left|right)(-|$)|^(left|right)$/.test(p) && !/^(calc\()?\s*(50%|1 \/ 2 \* 100%)/.test(v)) || p === 'text-align' && /^(left|right)$/i.test(v)) add('logical-inline', s, d);
    // A four-value shorthand with different right and left sides is physical too: use padding-inline / margin-inline.
    if (/^(padding|margin|inset)$/.test(p)) { const parts = postcss.list.space(v); if (parts.length === 4 && parts[1] !== parts[3]) add('logical-inline', s, d); }
    if (/(?<![\w.])[-+]?(?:\d*\.)?\d+vh\b/i.test(v)) add('viewport-units', s, d);
    if (calls(v, 'env').some((c) => /^safe-area-inset-[\w-]+\s*$/i.test(c.args))) add('safe-area-fallback', s, d);
    if (p === 'z-index' && /^[+-]?\d+$/.test(v) && +v > 1) add('z-index', s, d);
    // Tailwind's own utilities are checked where they are used (the TSX scan below); truncate and sr-only stay Tailwind's.
    if (/^overflow(?:-[xy])?$/.test(p) && /(^|\s)hidden($|\s)/i.test(v) && !/^\.overflow(-[xy])?-hidden$|(^\.|:)(truncate|sr-only)\b/.test(s)) add('overflow-clip', s, d);
  }
}

// A Tailwind scroller pairs its overflow-*-auto with an overscroll-* class in the same class string.
const tsx = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? tsx(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : []);
for (const file of ['components', 'blocks'].flatMap((d) => tsx(root(`packages/metalui/src/${d}`)))) {
  for (const [, str] of readFileSync(file, 'utf8').matchAll(/['"`]([^'"`]*\boverflow(?:-[xy])?-(?:auto|scroll)\b[^'"`]*)['"`]/g)) {
    if (/(^|[\s:])overscroll-/.test(str)) continue;
    for (const [token] of str.matchAll(/\S*overflow(?:-[xy])?-(?:auto|scroll)\b/g)) found.push({ id: 'overscroll-contain', key: `overscroll-contain: ${relative(root(), file)} ‖ ${token}` });
  }
}
// A Tailwind clip is overflow-clip; overflow-*-hidden is kept only beside a scrolling axis, where it computes the same.
for (const file of ['components', 'blocks'].flatMap((d) => tsx(root(`packages/metalui/src/${d}`)))) {
  for (const [, str] of readFileSync(file, 'utf8').matchAll(/['"`]([^'"`]*\boverflow(?:-[xy])?-hidden\b[^'"`]*)['"`]/g)) {
    if (/\boverflow-[xy]-(auto|scroll)\b/.test(str)) continue;
    for (const [token] of str.matchAll(/\S*overflow(?:-[xy])?-hidden\b/g)) found.push({ id: 'overflow-clip', key: `overflow-clip: ${relative(root(), file)} ‖ ${token}` });
  }
}

// A named title (mu-*-title) that can wrap balances its lines; a single-line title (truncate, nowrap, clamp) is exempt.
for (const file of ['components', 'blocks'].flatMap((d) => tsx(root(`packages/metalui/src/${d}`)))) {
  for (const [, str] of readFileSync(file, 'utf8').matchAll(/['"`]([^'"`]*\bmu-[\w-]+-title\b[^'"`]*)['"`]/g)) {
    if (/\btext-balance\b|truncate|nowrap|clamp|-words\b/.test(str)) continue;
    found.push({ id: 'title-balance', key: `title-balance: ${relative(root(), file)} ‖ ${str.match(/\bmu-[\w-]+-title\b/)[0]}` });
  }
}

// An ellipsis shows only on one clipped line: text-ellipsis needs whitespace-nowrap and an overflow clip beside it.
for (const file of ['components', 'blocks'].flatMap((d) => tsx(root(`packages/metalui/src/${d}`)))) {
  for (const [, str] of readFileSync(file, 'utf8').matchAll(/['"`]([^'"`]*\btext-ellipsis\b[^'"`]*)['"`]/g)) {
    if (/\bwhitespace-nowrap\b/.test(str) && /\boverflow(-x)?-(clip|hidden)\b/.test(str)) continue;
    found.push({ id: 'ellipsis-complete', key: `ellipsis-complete: ${relative(root(), file)} ‖ ${space(str).slice(0, 80)}` });
  }
}

const tally = (list) => list.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
if (process.argv.includes('--ratchet')) {
  writeFileSync(allowPath, JSON.stringify(tally(found.map((x) => x.key)), null, 2) + '\n');
  console.log(`lint-css-habits: allowlist now ${found.length} declaration(s)`);
  process.exit(0);
}
if (only) {
  for (const x of found.filter((x) => x.id === only)) console.log(`  ${x.key}`);
  process.exit(0);
}
const allow = existsSync(allowPath) ? JSON.parse(readFileSync(allowPath, 'utf8')) : {};
const seen = tally(found.map((x) => x.key));
const fresh = found.filter((x, i) => found.findIndex((y) => y.key === x.key) === i && (seen[x.key] > (allow[x.key] ?? 0)));
for (const id of RULES) console.log(`lint-css-habits: ${id}: ${found.filter((x) => x.id === id).length} existing`);
if (fresh.length) {
  console.error(`lint-css-habits: ${fresh.length} new break(s):`);
  for (const x of fresh) console.error(`  ${x.key}`);
  console.error('Follow docs/CSS_HABITS.md, or --ratchet once reviewed.');
  process.exit(1);
}
console.log(`lint-css-habits: ${found.length} existing, none new`);
