'use client';

import * as React from 'react';
import { GlassFace } from '../../components/glass-face/glass-face';
import { Chip } from '../../components/chip/chip';

/* ─────────────────────────────────────────────────────────
 * CODE CARD (the reference design's .codeobj): a custom block
 *   GlassFace › Screen (the code-card recipe) › Chip(glass, LED code) CODE · LANG · N LINES + numbered, tinted lines
 * Custom because the tinted code is drawn by no component. At most 18 lines show; the tag counts all.
 * ───────────────────────────────────────────────────────── */

/* The screen replaces the glass face's; the code is the recipe's type and ink, and its tinted spans
 * (written by tintCode) take the recipe's tints. */
const CARD = 'mu-codecard min-w-code-card-min-width max-w-code-card-max-width';
const SCREEN = 'mu-codecard-screen pt-code-card-screen-pad-top px-code-card-screen-pad-x pb-code-card-screen-pad-bottom !recipe-code-card-screen';
const TAG = 'mu-codecard-tag !absolute left-code-card-chip-inset top-code-card-chip-inset';
const CODE = 'mu-codecard-code m-0 overflow-hidden whitespace-pre type-code-card-code text-code-card-code-ink [&_.mu-code-ln]:inline-block [&_.mu-code-ln]:w-code-card-code-number [&_.mu-code-ln]:text-code-card-tint-line [&_.mu-code-kw]:text-code-card-tint-keyword [&_.mu-code-ty]:text-code-card-tint-type [&_.mu-code-st]:text-code-card-tint-string [&_.mu-code-cm]:text-code-card-tint-comment [&_.mu-code-nu]:text-code-card-tint-number';

const KEYWORDS = /\b(func|let|var|if|else|return|for|in|while|const|function|import|export|from|class|struct|enum|case|switch|guard|def|async|await|new|true|false|nil|null|self|this)\b/g;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The reference tinting, on escaped text: strings, a trailing comment, keywords, types, numbers. */
export function tintCode(code: string, maxLines = 18) {
  return code
    .split('\n')
    .slice(0, maxLines)
    .map((l, i) => {
      const h = esc(l)
        .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="mu-code-st">$1</span>')
        .replace(/(\/\/.*$|#.*$)/, '<span class="mu-code-cm">$1</span>')
        .replace(KEYWORDS, '<span class="mu-code-kw">$1</span>')
        .replace(/\b([A-Z][A-Za-z0-9]+)\b/g, '<span class="mu-code-ty">$1</span>')
        .replace(/(?<![\w#])(\d+(?:\.\d+)?)\b/g, '<span class="mu-code-nu">$1</span>');
      return `<span class="mu-code-ln">${i + 1}</span>${h}`;
    })
    .join('\n');
}

export interface CodeCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  code: string;
  /** The language, shown in the tag: "swift". */
  lang?: string;
  /** Lines shown (the tag counts all). Default 18. */
  maxLines?: number;
  /** The tag's text. Default: CODE · LANG · N LINES. */
  tag?: string;
}

/** Code as a glass object: numbered, tinted lines under a tag. */
export const CodeCard = React.forwardRef<HTMLDivElement, CodeCardProps>(function CodeCard({ code, lang, maxLines = 18, tag, className, ...props }, ref) {
  const n = code.split('\n').length;
  const label = tag ?? `CODE${lang ? ' · ' + lang.toUpperCase() : ''} · ${n} ${n === 1 ? 'LINE' : 'LINES'}`;
  return (
    <GlassFace.Root ref={ref} className={className ? `${CARD} ${className}` : CARD} {...props}>
      <GlassFace.Screen className={SCREEN}>
        <Chip variant="glass" className={TAG}>
          <Chip.Lead led="code" />
          <Chip.Text>{label}</Chip.Text>
        </Chip>
        <pre className={CODE} dangerouslySetInnerHTML={{ __html: tintCode(code, maxLines) }} />
      </GlassFace.Screen>
    </GlassFace.Root>
  );
});
