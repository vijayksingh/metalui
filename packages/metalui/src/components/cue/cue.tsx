'use client';

import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import './cue.css';

/* ─────────────────────────────────────────────────────────
 * CUE FAMILY (Kamui 03 §3, the medium demo)
 *
 * A cue is a rendering attribute on the text, never a change to it.
 *   in-flow   date · duration · amount · measurement · tag · derived tag · hex
 *             metric-neutral: width delta 0.00 pt, so a cue appearing mid-word never moves a letter
 *   hover     the resolved value rises 3 over the cue on the part spring (data-chip)
 *   at rest   a URL becomes a host pill; a value Jev read that is not in the text is an inferred pill
 *   margin    the dimple (a task's checkbox), the ghost dimple (a task Jev inferred), the urgency LED
 *   trailing  the life glyph after a middle dot, ink3 → ink2 with its host
 *   tick      draws on in 220 ms after 40 ms, ease-out, not sprung (DS-21); instant under Reduce Motion
 * ───────────────────────────────────────────────────────── */

export type CueKind = 'date' | 'duration' | 'amount' | 'measurement' | 'tag' | 'derived-tag' | 'hex';

export interface CueProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: CueKind;
  /** The resolved value, shown on hover as a graphite chip: "TUE 30 SEP · 16:00", "1 H 30 · 90 MIN". */
  resolved?: string;
  /** For hex: the colour the text names. The underline and swatch take it. */
  color?: string;
  /** For hex: show the 11 pt swatch before the text (display only, never while writing). */
  swatch?: boolean;
}

/** An in-flow cue on recognised text. Metric-neutral: the words keep their exact advance. */
export const Cue = React.forwardRef<HTMLSpanElement, CueProps>(function Cue({ kind, resolved, color, swatch, className, style, children, ...props }, ref) {
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

export interface CueUrlProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The host the pill shows at rest: "figma.com". */
  host: string;
  /** The glyph before the host, at 11: pass the set's link glyph, e.g. <LinkIcon size={11} />. */
  glyph?: React.ReactNode;
}

/** A URL at rest: a short host pill. While writing, show the raw URL as plain text instead. */
export const CueUrl = React.forwardRef<HTMLAnchorElement, CueUrlProps>(function CueUrl({ host, glyph, className, ...props }, ref) {
  return (
    <a ref={ref} target="_blank" rel="noopener noreferrer" className={className ? `mu-cue-url type-ui ${className}` : 'mu-cue-url type-ui'} {...props}>
      {glyph}
      {host}
    </a>
  );
});

export interface CueInferredProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The value and where it came from, on hover: "TUE 30 SEP · JEV 0.82". */
  resolved?: string;
}

/** A value Jev read that is not in the text (a date, a measurement): a hollow pill after the words. */
export const CueInferred = React.forwardRef<HTMLSpanElement, CueInferredProps>(function CueInferred({ resolved, className, ...props }, ref) {
  return <span ref={ref} data-chip={resolved} className={['mu-cue', 'mu-cue-inferred', 'mu-type-label', className].filter(Boolean).join(' ')} {...props} />;
});

export interface DimpleProps extends Omit<Checkbox.Root.Props, 'className' | 'indeterminate'> {
  /** The task is in progress: a half-filled green square (announced as mixed). */
  doing?: boolean;
  /** A task Jev inferred and nobody wrote: the hollow ghost dimple, hanging in the margin. */
  ghost?: boolean;
  className?: string;
}

/**
 * A task's checkbox: a 16 pt well in the margin (Base UI Checkbox). Checked, it turns dark and the
 * tick draws on. Ticking it is a person's action: the host writes `[x]` into the text, with Undo.
 */
export const Dimple = React.forwardRef<HTMLButtonElement, DimpleProps>(function Dimple({ doing, ghost, className, ...props }, ref) {
  // The slot carries placement (the margin at −25): Base UI renders a hidden form input beside the
  // checkbox, and the slot keeps both out of the line's flow.
  return (
    <span className={className ? `mu-dimple-slot ${className}` : 'mu-dimple-slot'}>
      <Checkbox.Root
        ref={ref}
        indeterminate={doing && !props.checked ? true : undefined}
        data-ghost={ghost ? '' : undefined}
        className="mu-dimple"
        {...props}
      >
        <Checkbox.Indicator render={(p, state) => (state.checked ? <span {...p} className="mu-dimple-tick" /> : <span {...p} hidden />)} />
      </Checkbox.Root>
    </span>
  );
});

/** Urgency: a 5 pt amber LED in the margin of an open task that is due soon. */
export function CueUrgency({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span role="img" aria-label="Due soon" className={className ? `mu-cue-urgency ${className}` : 'mu-cue-urgency'} {...props} />;
}

export interface CueLifeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The glyph at 16, e.g. <LifeCoffeeIcon size={16} /> from @unlocalhosted/metalui/icons/life. */
  children: React.ReactNode;
}

/** The life glyph trailing a block: a middle dot, then the glyph. Display only: never while writing. */
export function CueLife({ children, className, ...props }: CueLifeProps) {
  return (
    <span className={className ? `mu-cue-life ${className}` : 'mu-cue-life'} {...props}>
      <span aria-hidden className="mu-cue-md">·</span>
      <span className="mu-cue-lg">{children}</span>
    </span>
  );
}
