'use client';

import * as React from 'react';
import { GlassFace } from '../../components/glass-face/glass-face';
import { Chip } from '../../components/chip/chip';
import './code-card.css';

/* ─────────────────────────────────────────────────────────
 * CODE CARD (the reference design's .codeobj): a custom block
 *   GlassFace › Screen (the code-card recipe) › Chip(glass, LED code) CODE · LANG · N LINES + numbered, tinted lines
 * Custom because the tinted code is drawn by no component. At most 18 lines show; the tag counts all.
 * ───────────────────────────────────────────────────────── */

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
    <GlassFace.Root ref={ref} className={className ? `mu-codecard ${className}` : 'mu-codecard'} {...props}>
      <GlassFace.Screen className="mu-codecard-screen">
        <Chip variant="glass" className="mu-codecard-tag">
          <Chip.Lead led="code" />
          <Chip.Text>{label}</Chip.Text>
        </Chip>
        <pre className="mu-codecard-code" dangerouslySetInnerHTML={{ __html: tintCode(code, maxLines) }} />
      </GlassFace.Screen>
    </GlassFace.Root>
  );
});
