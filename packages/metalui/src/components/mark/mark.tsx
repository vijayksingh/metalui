'use client';

import * as React from 'react';
import './mark.css';

/* ─────────────────────────────────────────────────────────
 * CUE FAMILY (the reference design)
 *
 * A cue is a rendering attribute on the text, never a change to it.
 *   in-flow   date · duration · amount · measurement · tag · derived tag · hex
 *             metric-neutral: width delta 0.00 pt, so a cue appearing mid-word never moves a letter
 *   hover     the resolved value rises 3 over the cue on the part spring (data-chip)
 *   at rest   a URL becomes a host pill; a value the recognizer read that is not in the text is an inferred pill
 *   margin    the dimple (a task's checkbox), the ghost dimple (an inferred task), the urgency LED
 *   trailing  the life glyph after a middle dot, ink3 → ink2 with its host
 *   tick      draws on in 220 ms after 40 ms, ease-out, not sprung (DS-21); instant under Reduce Motion
 * ───────────────────────────────────────────────────────── */

export type MarkKind = 'date' | 'duration' | 'amount' | 'measurement' | 'tag' | 'derived-tag' | 'hex';

export interface MarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: MarkKind;
  /** The resolved value, shown on hover as a graphite chip: "TUE 30 SEP · 16:00", "1 H 30 · 90 MIN". */
  resolved?: string;
  /** For hex: the colour the text names. The underline and swatch take it. */
  color?: string;
  /** For hex: show the 11 pt swatch before the text (display only, never while writing). */
  swatch?: boolean;
}

/** An in-flow cue on recognised text. Metric-neutral: the words keep their exact advance. */
export const Mark = React.forwardRef<HTMLSpanElement, MarkProps>(function Mark({ kind, resolved, color, swatch, className, style, children, ...props }, ref) {
  return (
    <span
      ref={ref}
      data-kind={kind}
      data-chip={resolved}
      className={className ? `mu-cue ${className}` : 'mu-cue'}
      style={color ? ({ '--mu-cue-hex': color, ...style } as React.CSSProperties) : style}
      {...props}
    >
      {kind === 'hex' && swatch && <i aria-hidden className="mu-cue-swatch" />}
      {children}
    </span>
  );
});

export interface MarkUrlProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The host the pill shows at rest: "figma.com". */
  host: string;
  /** The glyph before the host, at 11: pass the set's link glyph, e.g. <LinkIcon size={11} />. */
  glyph?: React.ReactNode;
}

/** A URL at rest: a short host pill. While writing, show the raw URL as plain text instead. */
export const MarkUrl = React.forwardRef<HTMLAnchorElement, MarkUrlProps>(function MarkUrl({ host, glyph, className, ...props }, ref) {
  return (
    <a ref={ref} target="_blank" rel="noopener noreferrer" className={className ? `mu-cue-url type-ui ${className}` : 'mu-cue-url type-ui'} {...props}>
      {glyph}
      {host}
    </a>
  );
});

export interface MarkInferredProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The value and where it came from, on hover: "TUE 30 SEP · 0.82". */
  resolved?: string;
}

/** A value the recognizer read that is not in the text (a date, a measurement): a hollow pill after the words. */
export const MarkInferred = React.forwardRef<HTMLSpanElement, MarkInferredProps>(function MarkInferred({ resolved, className, ...props }, ref) {
  return <span ref={ref} data-chip={resolved} className={['mu-cue', 'mu-cue-inferred', 'mu-type-label', className].filter(Boolean).join(' ')} {...props} />;
});


/** Urgency: a 5 pt amber LED in the margin of an open task that is due soon. */
export function MarkUrgency({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span role="img" aria-label="Due soon" className={className ? `mu-cue-urgency ${className}` : 'mu-cue-urgency'} {...props} />;
}

export interface MarkLifeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The glyph at 16, e.g. <LifeCoffeeIcon size={16} /> from @unlocalhosted/metalui/icons/life. */
  children: React.ReactNode;
}

/** The life glyph trailing a block: a middle dot, then the glyph. Display only: never while writing. */
export function MarkLife({ children, className, ...props }: MarkLifeProps) {
  return (
    <span className={className ? `mu-cue-life ${className}` : 'mu-cue-life'} {...props}>
      <span aria-hidden className="mu-cue-md">·</span>
      <span className="mu-cue-lg">{children}</span>
    </span>
  );
}

/** Earlier names (kept for existing hosts). */
export { Mark as Cue, MarkUrl as CueUrl, MarkInferred as CueInferred, MarkUrgency as CueUrgency, MarkLife as CueLife };
export type { MarkKind as CueKind, MarkProps as CueProps, MarkUrlProps as CueUrlProps, MarkInferredProps as CueInferredProps, MarkLifeProps as CueLifeProps };
