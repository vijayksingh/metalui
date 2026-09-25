#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './lib/visual-lint.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (p) => readFileSync(join(root, p), 'utf8');
const tokens = JSON.parse(read('tokens/tokens.json'));
const css = read('packages/metalui/src/components/tokens.css');
const swift = read('swift/Sources/MetalUI/Tokens/MetalTokens.generated.swift');
const errors = [];
function findRecipeCollections(node, path = '') {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  for (const [key, value] of Object.entries(node)) {
    const next = path ? `${path}.${key}` : key;
    if (key === 'recipes' && next !== 'recipes' && next !== 'frost.recipes') errors.push(`${next}: recipe collection has no CSS/Swift parser`);
    else if (key !== 'recipes') findRecipeCollections(value, next);
  }
}
findRecipeCollections(tokens);
const norm = (s) => s.replace(/^Metal/, '').replace(/View$/, '').replace(/[^a-z\d]/gi, '').toLowerCase();
const number = (s) => Number(s);
const nums = (s) => [...s.matchAll(/-?(?:\d*\.\d+|\d+(?:\.\d+)?)/g)].map((m) => number(m[0]));
const split = (s) => { let depth = 0, part = '', out = []; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { out.push(part.trim()); part = ''; } else part += ch; } if (part.trim()) out.push(part.trim()); return out; };
const color = (s) => { const h = s.match(/#([\da-f]{3}|[\da-f]{6})\b/i); if (h) { const v = h[1].length === 3 ? [...h[1]].map((c) => c + c).join('') : h[1]; return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)).concat(1); } const m = s.match(/rgba?\(([^)]*)\)/i); return m ? nums(m[1]).concat(m[0].startsWith('rgba') ? [] : [1]) : null; };
const cssLayers = (value) => {
  if (!value) return null;
  if (/gradient\(/.test(value)) {
    const body = value.slice(value.indexOf('(') + 1, -1);
    const parts = split(body);
    const angle = /deg$/.test(parts[0]) ? number(parts.shift().replace('deg', '')) : 180;
    return [{ type: 'gradient', angle, stops: parts.map((p, i) => ({ color: color(p), position: /\d+(?:\.\d+)?%/.test(p) ? number(p.match(/[\d.]+%/g).at(-1).slice(0, -1)) / 100 : i / Math.max(1, parts.length - 1) })) }];
  }
  if (/\binset\b|\d+px/.test(value) && /rgba?\(|#/.test(value)) return split(value).map((layer) => { const c = color(layer); const lengths = nums(layer.slice(0, layer.search(/#|rgba?\(/i))); return { type: 'shadow', inset: /\binset\b/.test(layer), values: [lengths[0] ?? 0, lengths[1] ?? 0, lengths[2] ?? 0, lengths[3] ?? 0], color: c }; });
  return [{ type: 'color', color: color(value) }];
};
const swiftLayers = (value) => {
  if (/MetalShadow\(/.test(value)) return [...value.matchAll(/MetalShadow\(inset: (true|false), x: ([-\d.]+), y: ([-\d.]+), blur: ([-\d.]+), spread: ([-\d.]+), color: MetalRGBA\(([^)]*)\)\)/g)].map((m) => ({ type: 'shadow', inset: m[1] === 'true', values: m.slice(2, 6).map(number), color: nums(m[6]) }));
  if (/MetalGradient\(/.test(value)) { const a = value.match(/angle: ([-\d.]+)/); return [{ type: 'gradient', angle: number(a?.[1] ?? 180), stops: [...value.matchAll(/\.init\(MetalRGBA\(([^)]*)\), ([-\d.]+)\)/g)].map((m) => ({ color: nums(m[1]), position: number(m[2]) })) }]; }
  const m = value.match(/MetalRGBA\(([^)]*)\)/);
  return m ? [{ type: 'color', color: nums(m[1]) }] : null;
};
const cssVars = {};
for (const m of css.matchAll(/(--mu-[\w-]+):\s*([^;]+);/g)) cssVars[m[1]] = m[2].trim();
const cssRecipe = (name) => css.match(new RegExp(`\\.mu-frost-${name}\\s*\\{([^}]*)\\}`))?.[1];
const swiftRecipe = (name) => swift.match(new RegExp(`case \\.${name}:\\s*return MetalRecipe\\(([\\s\\S]*?)(?=\\n        case \\.|\\n        }\\n)`))?.[1];
const field = (body, key, next) => body?.match(new RegExp(`${key}: ([\\s\\S]*?)(?=,\\n\\s*${next}:)`))?.[1]?.trim();
const tokenValue = (name, colorway) => {
  const start = swift.indexOf(`public static let ${colorway} = MetalColorwayTokens(`);
  const end = swift.indexOf('    public static let ', start + 20);
  const body = swift.slice(start, end < 0 ? undefined : end);
  const pattern = new RegExp(`\\n        ${name}: ([\\s\\S]*?)(?=,\\n        [A-Za-z]|\\n    \\))`);
  return body.match(pattern)?.[1]?.trim();
};
const resolveCSS = (v, cw) => { const key = v?.match(/var\((--mu-[\w-]+)\)/)?.[1]; return key ? (tokens.colorways[cw]?.[key.slice(5)] ?? cssVars[key]) : v; };
const resolveSwift = (v, cw) => { const ref = v?.match(/(?:t|MetalTokens\.(?:bone|graphite))\.([A-Za-z\d]+)/)?.[1]; return ref ? tokenValue(ref, cw) : v; };
function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

for (const [name, recipe] of Object.entries(tokens.frost?.recipes ?? {})) {
  const c = cssRecipe(name), s = swiftRecipe(name);
  if (!c || !s) { errors.push(`frost.${name}: ${!c ? 'CSS ' : ''}${!s ? 'Swift ' : ''}recipe missing`); continue; }
  for (const cw of Object.keys(tokens.colorways)) for (const [part, cssProp, swiftKey, next] of [['fill', 'background', 'fill', 'shadows'], ['shadow', 'box-shadow', 'shadows', 'backdrop']]) {
    const cv = c.match(new RegExp(`${cssProp}: ([^;]+)`))?.[1];
    const sv = field(s, swiftKey, next);
    const ca = cssLayers(resolveCSS(cv, cw));
    const sa = swiftLayers(resolveSwift(sv, cw));
    if (!ca || !sa || !equal(ca, sa)) errors.push(`frost.${name}.${cw}.${part}: CSS/Swift layer mismatch (${JSON.stringify(ca)} != ${JSON.stringify(sa)})`);
  }
  const opaqueCSS = css.match(new RegExp(`\\.mu-frost-${name} \\{ background: ([^;]+); -webkit-backdrop-filter: none`))?.[1];
  const opaqueSwift = field(s, 'opaqueFill', 'contrastEdge');
  for (const cw of Object.keys(tokens.colorways)) {
    const ca = cssLayers(resolveCSS(opaqueCSS, cw));
    const sa = swiftLayers(resolveSwift(opaqueSwift, cw));
    if (!ca || !sa || !equal(ca, sa)) errors.push(`frost.${name}.${cw}.opaque: CSS/Swift layer mismatch`);
  }
}
if (!equal(nums(cssVars['--mu-backdrop-blur']), nums(swift.match(/public static let blur: Double = ([-\d.]+)/)?.[1] ?? '')) ||
    !equal(nums(cssVars['--mu-backdrop-saturate']), nums(swift.match(/public static let saturation: Double = ([-\d.]+)/)?.[1] ?? '')))
  errors.push('frost.backdrop: CSS/Swift numeric mismatch');
const cssFrostNames = new Set([...css.matchAll(/\.mu-frost-([\w-]+) \{ background:/g)].map((m) => m[1]));
const swiftFrostNames = new Set([...swift.slice(swift.indexOf('public enum MetalFrost'), swift.indexOf('public enum MetalPresence')).matchAll(/case \.([\w]+):/g)].map((m) => m[1]));
for (const name of new Set([...cssFrostNames, ...swiftFrostNames])) if (!tokens.frost?.recipes?.[name] || !cssFrostNames.has(name) || !swiftFrostNames.has(name)) errors.push(`frost.${name}: recipe exists on only one platform or not in tokens.json`);

// New component recipes use named layer markers in both generators. The markers make
// the output independently parseable, even when a recipe's Swift layout changes.
const entries = Object.fromEntries(Object.entries({ ...tokens.componentRecipes, ...tokens.components, ...tokens.recipes }).filter(([k]) => !k.startsWith('$')));
const names = new Set(Object.keys(entries));
const cssMarkers = new Set([...css.matchAll(/\/\* mu-recipe:([^:]+):\d+ \*\//g)].map((m) => m[1]));
const swiftMarkers = new Set([...swift.matchAll(/\/\/ mu-recipe:([^:]+):\d+/g)].map((m) => m[1]));
for (const name of new Set([...cssMarkers, ...swiftMarkers])) if (!names.has(name) || !cssMarkers.has(name) || !swiftMarkers.has(name)) errors.push(`${name}: recipe output exists on only one platform or not in tokens.json`);
let generated;
if (names.size) {
  const modulePath = join(root, 'scripts/lib/recipes.mjs');
  if (!existsSync(modulePath)) errors.push('scripts/lib/recipes.mjs: recipe generator missing');
  else generated = (await import('./lib/recipes.mjs')).buildRecipes(tokens.recipes ?? {});
}
const markedLines = (source, name, index, kind) => {
  const marker = new RegExp(`${kind === '/*' ? '/\\*' : '//'} mu-recipe:${name}:${index}(?=\\s|\\*/|$)`);
  return [...new Set(source.split('\n').filter((line) => marker.test(line)).map((line) => line.trim()))];
};
for (const name of names) {
  const recipe = entries[name];
  const layers = recipe?.layers ?? recipe?.recipe?.layers;
  if (!Array.isArray(layers)) { errors.push(`${name}: recipe needs ordered layers array`); continue; }
  for (const [index, layer] of layers.entries()) {
    const cssLines = markedLines(css, name, index, '/*');
    const swiftLines = markedLines(swift, name, index, '//');
    if (!cssLines.length || swiftLines.length !== 1) { errors.push(`${name}: layer ${index} missing or duplicated in ${!cssLines.length ? 'CSS ' : ''}${swiftLines.length !== 1 ? 'Swift' : ''}`); continue; }
    for (const cssLine of cssLines) {
      const cssValue = cssLine.slice(cssLine.indexOf('*/') + 2).replace(/[,;]\s*$/, '').trim();
      const swiftValue = swiftLines[0].slice(swiftLines[0].indexOf(`// mu-recipe:${name}:${index}`) + `// mu-recipe:${name}:${index}`.length).replace(/[,;]\s*$/, '').trim();
      if (!equal(nums(cssValue), nums(swiftValue))) errors.push(`${name}: layer ${index} CSS/Swift marker numeric mismatch`);
    }
    if (generated) {
      const expectedCSS = [...new Set([generated.css.root, generated.css.bone, generated.css.graphite].flatMap((section) => markedLines(section, name, index, '/*')))];
      const expectedSwift = markedLines(generated.swift, name, index, '//');
      if (!equal(cssLines, expectedCSS)) errors.push(`${name}: layer ${index} generated CSS value/order mismatch`);
      if (!equal(swiftLines, expectedSwift)) errors.push(`${name}: layer ${index} generated Swift typed value/order mismatch`);
    }
  }
}
// Components need a recipe; so do custom blocks (docs/COMPOSITION.md). Composition blocks draw only
// through their components and have none.
const customBlocks = new Set(existsSync(join(root, 'packages/metalui/src/blocks')) ? readdirSync(join(root, 'packages/metalui/src/blocks')).filter((d) => { const m = join(root, 'packages/metalui/src/blocks', d, 'meta.json'); return existsSync(m) && JSON.parse(readFileSync(m, 'utf8')).kind === 'custom'; }) : []);
const inCustomBlock = (p) => { const m = p.match(/src\/blocks\/([\w-]+)\//); return m && customBlocks.has(m[1]); };
const react = [...walk(join(root, 'packages/metalui/src/components'), ['.tsx']), ...walk(join(root, 'packages/metalui/src/blocks'), ['.tsx']).filter(inCustomBlock)].filter((p) => !p.includes('.generated.'));
const swiftCustom = new Set([...customBlocks].map((d) => norm(d)));
const native = [...walk(join(root, 'swift/Sources/MetalUI/Components'), ['.swift']), ...walk(join(root, 'swift/Sources/MetalUI/Blocks'), ['.swift']).filter((p) => swiftCustom.has(norm(p.split('/').at(-1).replace('.swift', ''))))].filter((p) => !p.includes('.generated.'));
// Gadget Parts take their look from the gadget foundations (tokens gadgets.*), checked by build-gadgets
// and the parity fixtures; their meta.json says "recipe": "gadgets" and they carry no CSS recipe.
const gadgetParts = new Set(readdirSync(join(root, 'packages/metalui/src/components')).filter((d) => { const m = join(root, 'packages/metalui/src/components', d, 'meta.json'); return existsSync(m) && JSON.parse(readFileSync(m, 'utf8')).recipe === 'gadgets'; }).map((d) => norm(d)));
for (const path of [...react, ...native]) {
  const name = norm(path.split('/').at(-1).replace(/\.(tsx|swift)$/, ''));
  if (gadgetParts.has(name)) continue;
  if (![...names].some((n) => norm(n) === name)) errors.push(`${path.slice(root.length + 1)}: component has no matching component recipe`);
}
for (const error of errors) console.log(error);
console.log(`Recipe parity: ${errors.length} finding(s)`);
process.exitCode = errors.length ? 1 : 0;
