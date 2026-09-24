// The Tailwind class tokens a component or block writes, read from its TSX: string and template
// literals held in UPPER_CASE constants, and literal className attributes. ${…} placeholders and
// the mu-* hook classes are left out.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const LITERAL = /const\s+[A-Z][A-Z0-9_]*[^=\n]*=\s*(?:\{[\s\S]*?\n\};|'[^']*'|`[^`]*`)|className="[^"]*"|className=\{`[^`]*`\}/g;
const STRING = /'([^']*)'|`([^`]*)`|"([^"]*)"/g;

export function classTokens(dir) {
  const tokens = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    const src = readFileSync(join(dir, f), 'utf8');
    for (const block of src.match(LITERAL) ?? []) {
      for (const m of block.matchAll(STRING)) {
        if (block[m.index + m[0].length] === ':') continue; // an object key ('strip-danger': …)
        const text = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^}]*\}/g, ' ');
        for (const t of text.split(/\s+/)) {
          if (!t || t.startsWith('mu-') || !/^[a-z!\[*]/.test(t) || /[{}]/.test(t)) continue;
          tokens.push({ file: f, token: t });
        }
      }
    }
  }
  return tokens;
}

/** The utility part of a token: after the last variant colon that is not inside brackets. */
export function utilityOf(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === '[' || ch === '(') depth++;
    else if (ch === ']' || ch === ')') depth--;
    else if (ch === ':' && depth === 0) cut = i;
  }
  return token.slice(cut + 1).replace(/^!/, '');
}

/** Paint: what a composition block may not set (it arranges; its components paint). */
export const PAINT_UTILITY = /^(recipe-|type-|text-|bg-|shadow|inset-shadow|border|rounded|font-|tracking-|leading-|outline|ring|backdrop-|blur|drop-shadow|fill-|stroke-|decoration|underline|antialiased|uppercase|lowercase|capitalize|engraved|material-)/;
