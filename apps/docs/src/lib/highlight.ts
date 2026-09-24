import { language as tsx } from '@twinkleplop/tsx';
import { language as typescript } from '@twinkleplop/typescript';
import { language as css } from '@twinkleplop/css';
import { language as json } from '@twinkleplop/json';
import { language as bash } from '@twinkleplop/bash';
import { language as markdown } from '@twinkleplop/markdown';

/* Syntax highlighting for every code surface on the site. twinkleplop returns token classes only;
   the colours are the syn-* inks from tokens.json (styles.css maps the classes). */

export type Lang = 'tsx' | 'ts' | 'css' | 'json' | 'bash' | 'md' | 'swift' | 'text';

const HIGHLIGHT = {
  tsx: tsx(),
  ts: typescript(),
  css: css(),
  json: json(),
  bash: bash(),
  md: markdown(),
  // No Swift grammar yet: the TypeScript one reads Swift's strings, numbers, comments,
  // types and punctuation correctly, and misses only Swift-only keywords.
  swift: typescript(),
} as const;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The inner HTML of a highlighted block (the <code> content), with optional line numbers. */
export function highlight(code: string, lang: Lang, lineNumbers = false): string {
  const src = code.replace(/\n+$/, '');
  if (lang === 'text') return escape(src);
  const html = HIGHLIGHT[lang](src, { line_numbers: lineNumbers });
  return html.replace(/^<pre[^>]*><code>/, '').replace(/<\/code><\/pre>$/, '');
}

/** A language from a file name or label: "button.tsx", "tokens.json › recipes.button". */
export function langOf(name = ''): Lang {
  const m = /\.(tsx?|jsx?|css|json|swift|md|sh)\b/.exec(name.toLowerCase());
  if (!m) return /swift/i.test(name) ? 'swift' : /css/i.test(name) ? 'css' : /agent|markdown/i.test(name) ? 'md' : 'tsx';
  return ({ ts: 'ts', tsx: 'tsx', js: 'ts', jsx: 'tsx', css: 'css', json: 'json', swift: 'swift', md: 'md', sh: 'bash' } as const)[m[1] as 'ts'];
}
