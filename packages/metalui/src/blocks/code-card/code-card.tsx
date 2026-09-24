'use client';

import * as React from 'react';
import { GlassFace } from '../../components/glass-face/glass-face';
import { Chip } from '../../components/chip/chip';

/* ─────────────────────────────────────────────────────────
 * CODE CARD (the reference design's .codeobj): a custom block
 *   GlassFace › Screen (the code-card recipe) › Chip(glass, LED code) CODE · LANG · N LINES + numbered, tinted lines
 * Custom because the tinted code is drawn by no component. At most 18 lines show; the tag counts all.
 * A diff fence tints whole lines: added a faint green band, removed a faint red one, each with its
 * sign in the band's colour. The classes come from the core (one per line); without them a diff
 * fence is classed the core's way here (+ adds, - removes, +++ and --- are headers).
 * ───────────────────────────────────────────────────────── */

/* The screen replaces the glass face's; the code is the recipe's type and ink, and its tinted spans
 * (written by tintCode) take the recipe's tints. */
const CARD = 'mu-codecard min-w-code-card-min-width max-w-code-card-max-width';
const SCREEN = 'mu-codecard-screen pt-code-card-screen-pad-top px-code-card-screen-pad-x pb-code-card-screen-pad-bottom !recipe-code-card-screen';
const TAG = 'mu-codecard-tag !absolute left-code-card-chip-inset top-code-card-chip-inset';
const CODE = 'mu-codecard-code m-0 overflow-hidden whitespace-pre type-code-card-code text-code-card-code-ink [&_.mu-code-ln]:inline-block [&_.mu-code-ln]:w-code-card-code-number [&_.mu-code-ln]:text-code-card-tint-line [&_.mu-code-kw]:text-code-card-tint-keyword [&_.mu-code-ty]:text-code-card-tint-type [&_.mu-code-st]:text-code-card-tint-string [&_.mu-code-cm]:text-code-card-tint-comment [&_.mu-code-nu]:text-code-card-tint-number [&_.mu-code-row]:block [&_.mu-code-row[data-diff=add]]:bg-code-card-diff-add-bg [&_.mu-code-row[data-diff=remove]]:bg-code-card-diff-remove-bg [&_[data-diff=add]_.mu-code-sign]:text-code-card-diff-add-ink [&_[data-diff=remove]_.mu-code-sign]:text-code-card-diff-remove-ink';

const KEYWORDS = /\b(func|let|var|if|else|return|for|in|while|const|function|import|export|from|class|struct|enum|case|switch|guard|def|async|await|new|true|false|nil|null|self|this)\b/g;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The reference tinting, on escaped text: strings, a trailing comment, keywords, types, numbers. */
/* One pass over each escaped line: every token is tinted once, so no pattern can match inside the
 * markup another inserted. Order is priority: a string or a comment wins over what is inside it. */
const TOKEN = new RegExp(
  [
    '(&quot;.*?&quot;|&#39;.*?&#39;)', // 1 string
    '(\\/\\/.*$|#(?![\\d]).*$)', // 2 comment
    `${KEYWORDS.source}`, // 3 keyword
    '\\b([A-Z][A-Za-z0-9]+)\\b', // 4 type
    '(?<![\\w#&])(\\d+(?:\\.\\d+)?)\\b', // 5 number (not an entity's digits)
  ].join('|'),
  'g',
);
const CLASS = ['', 'mu-code-st', 'mu-code-cm', 'mu-code-kw', 'mu-code-ty', 'mu-code-nu'];

export type DiffClass = 'add' | 'remove' | 'context';

/** The core's diff classes, for a host without the core: + adds, - removes, +++ and --- are headers. */
export function diffClasses(code: string): DiffClass[] {
  return code.split('\n').map((l) => (l.startsWith('+') && !l.startsWith('+++') ? 'add' : l.startsWith('-') && !l.startsWith('---') ? 'remove' : 'context'));
}

/** Each line as a row: its number, then its tinted text; a diff line carries its class. */
export function tintCode(code: string, maxLines = 18, diff?: DiffClass[]) {
  return code
    .split('\n')
    .slice(0, maxLines)
    .map((l, i) => {
      const d = diff?.[i];
      const signed = d && d !== 'context';
      const body = signed ? l.slice(1) : l;
      const h = esc(body).replace(TOKEN, (m, ...groups) => {
        const k = groups.slice(0, 5).findIndex((g) => g !== undefined) + 1;
        return k ? `<span class="${CLASS[k]}">${m}</span>` : m;
      });
      const sign = signed ? `<span class="mu-code-sign">${esc(l[0])}</span>` : '';
      return `<span class="mu-code-row"${d ? ` data-diff="${d}"` : ''}><span class="mu-code-ln">${i + 1}</span>${sign}${h || ' '}</span>`;
    })
    .join('');
}

export interface CodeCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  code: string;
  /** The language, shown in the tag: "swift". */
  lang?: string;
  /** Lines shown (the tag counts all). Default 18. */
  maxLines?: number;
  /** The tag's text. Default: CODE · LANG · N LINES. */
  tag?: string;
  /** A diff fence's class per line, from the core. Default for lang "diff": classed here the core's way. */
  diff?: DiffClass[];
}

/** Code as a glass object: numbered, tinted lines under a tag. */
export const CodeCard = React.forwardRef<HTMLDivElement, CodeCardProps>(function CodeCard({ code, lang, maxLines = 18, tag, diff, className, ...props }, ref) {
  const n = code.split('\n').length;
  const label = tag ?? `CODE${lang ? ' · ' + lang.toUpperCase() : ''} · ${n} ${n === 1 ? 'LINE' : 'LINES'}`;
  return (
    <GlassFace.Root ref={ref} className={className ? `${CARD} ${className}` : CARD} {...props}>
      <GlassFace.Screen className={SCREEN}>
        <Chip variant="glass" className={TAG}>
          <Chip.Lead led="code" />
          <Chip.Text>{label}</Chip.Text>
        </Chip>
        <pre className={CODE} dangerouslySetInnerHTML={{ __html: tintCode(code, maxLines, diff ?? (lang === 'diff' ? diffClasses(code) : undefined)) }} />
      </GlassFace.Screen>
    </GlassFace.Root>
  );
});
