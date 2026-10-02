'use client';

import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { LifeIcon } from '../../icons/life/LifeIcon';
import { SPRINGS } from '../../motion/springs.generated';
import { SwapText } from '../../motion/swap';
import { tagColor, tagIdentity, MARK_GLYPH_SIZE } from './identity.generated';
export { tagColor, tagIdentity } from './identity.generated';

/* ─────────────────────────────────────────────────────────
 * CUE FAMILY (the reference design)
 *
 *   match     the words a search matched in a result: heavier, a green underline (not metric-neutral;
 *             only in result rows, never in writing)
 *
 * A cue is a rendering attribute on the text, never a change to it.
 *   in-flow   date · duration · amount · measurement · tag · derived tag · hex
 *             metric-neutral: width delta 0.00 pt, so a cue appearing mid-word never moves a letter
 *   hover     the resolved value rises 3 over the cue on the part spring (data-chip)
 *   at rest   a URL becomes a host pill; a value the recognizer read that is not in the text is an inferred pill
 *   margin    the dimple (a task's checkbox), the ghost dimple (an inferred task), the urgency LED
 *   trailing  the life glyph after a middle dot, ink3 → ink2 with its host
 *   tick      a pen draws the check glyph's tick (the checkbox's storyboard: a 40 ms beat, the short leg,
 *             a dwell at the corner, the long leg on the part spring); whole at once under Reduce Motion
 * ───────────────────────────────────────────────────────── */

export type MarkKind = 'date' | 'duration' | 'amount' | 'measurement' | 'tag' | 'derived-tag' | 'hex' | 'match';

export type MarkMeaning = 'time' | 'money' | 'sleep' | 'steps' | 'colour' | 'person';

export interface MarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: MarkKind;
  /** Opt into the semantic grammar inside MarkLine; plain Mark metrics stay unchanged. */
  meaning?: MarkMeaning;
  /** Meaning shown on hover. Person is the known person's name. */
  meaningLabel?: string;
  /** A host-provided person object or custom meaning glyph; the Part never constructs an Object. */
  meaningGlyph?: React.ReactNode;
  /** Reserve semantic slots and fade decoration while showing raw text. */
  raw?: boolean;
  /** Change once per recognizer identity, after the caret leaves and composition ends. */
  recognition?: string;
  /** Optional display formatting, without changing the saved source. */
  formatted?: string;
  /** Confirmed suggestions retain the same tab; the host owns confirmation. */
  inferred?: boolean;
  /** The resolved value, shown on hover as a graphite chip: "TUE 30 SEP · 16:00", "1 H 30 · 90 MIN". */
  resolved?: string;
  /** For hex: the colour the text names. The underline and swatch take it. */
  color?: string;
  /** For hex: show the 11 pt swatch before the text (display only, never while writing). */
  swatch?: boolean;
}

/* Styled with the theme's utilities: each cue is the mark recipe's own drawing (mark-<kind>), written
 * against the cue tokens, with the resolved value's chip on hover (mark-chip). */
const KINDS: Record<MarkKind, string> = {
  date: 'mark-date',
  duration: 'mark-quiet',
  amount: 'mark-quiet',
  measurement: 'mark-measure',
  tag: 'mark-tag',
  'derived-tag': 'mark-derived-tag',
  hex: 'mark-hex',
  match: 'mark-match',
};

/** An in-flow cue on recognised text. Metric-neutral: the words keep their exact advance. */
const ReadingLine = React.createContext(false);
/** Internal cue layout policy; source bounds remain owned by each control. */
export function useReadingLine() { return React.useContext(ReadingLine); }
export interface MarkLineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Reading keeps committed words compact and glyphs beside them. Semantic retains overhead slots. */
  presentation?: 'semantic' | 'reading';
}
/** One typography and baseline policy for a sentence of operable cues. */
export function MarkLine({ presentation = 'semantic', className, ...props }: MarkLineProps) {
  const own = `mu-mark-line ${presentation === 'reading' ? 'mark-reading-line' : 'mark-semantic-line'}`;
  return <ReadingLine.Provider value={presentation === 'reading'}><div className={className ? `${own} ${className}` : own} {...props} /></ReadingLine.Provider>;
}

/** In-flow display decoration. Recognition never writes the source string. */
export const Mark = React.forwardRef<HTMLSpanElement, MarkProps>(function Mark({ kind, meaning, meaningLabel, meaningGlyph, raw = false, recognition, formatted, inferred = kind === 'derived-tag', resolved, color, swatch, className, style, children, ...props }, ref) {
  const [act, setAct] = React.useState(0);
  const [reveal, setReveal] = React.useState(false);
  const seen = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!recognition || seen.current === recognition || raw) return;
    seen.current = recognition;
    setAct(n => n + 1);
    if (kind !== 'date' || !resolved) return;
    setReveal(true);
    const timer = setTimeout(() => setReveal(false), (SPRINGS.part.duration + SPRINGS.settle.duration) * 1000);
    return () => { clearTimeout(timer); setReveal(false); };
  }, [recognition, raw, kind, resolved]);
  const tag = kind === 'tag' || kind === 'derived-tag';
  const text = typeof children === 'string' ? children : '';
  const variables = { ...(color ? { '--mu-cue-hex': color } : {}), ...(tag ? { '--mu-cue-identity': tagColor(text) } : {}), ...style } as React.CSSProperties;
  const glyph = meaning === 'time' ? 'clock' : meaning === 'money' ? 'coin' : meaning === 'sleep' ? 'moon' : null;
  return (
    <span ref={ref} title={meaningLabel} data-reveal={reveal || undefined} data-kind={kind} data-chip={resolved} data-raw={raw || undefined}
      data-recognition={recognition} data-act={act} data-inferred={inferred || undefined}
      data-semantic-tag={tag || undefined} data-tag-identity={tag ? tagIdentity(text) : undefined}
      className={`mu-cue relative mark-chip mark-semantic ${KINDS[kind]}${act > 0 ? ' mark-recognised' : ''}${className ? ` ${className}` : ''}`}
      style={variables} {...props}>
      {tag && <span key={`tab-${act}`} aria-hidden className="mu-mark-tab mark-semantic-tag" />}
      {(meaning || meaningGlyph || (kind === 'derived-tag' && !inferred && recognition)) && <span key={`meaning-${act}`} aria-hidden title={meaningLabel ?? meaning} className="mu-mark-meaning mark-semantic-glyph">
        {kind === 'derived-tag' && !inferred && recognition && <Icon name="spark" size={MARK_GLYPH_SIZE} act={act} />}
        {glyph && <Icon name={glyph} size={MARK_GLYPH_SIZE} act={act} />}
        {meaning === 'steps' && <LifeIcon name="steps" size={MARK_GLYPH_SIZE} />}
        {meaning === 'colour' && <i className="mark-swatch" />}
        {meaningGlyph}
      </span>}
      {kind === 'hex' && swatch && !meaning && <i aria-hidden className="mu-cue-swatch mark-swatch" />}
      <span className="mu-mark-words">{tag && text.startsWith('#') ? <><span className="mu-mark-hash">#</span>{text.slice(1)}</> : formatted ? <span className="mark-format"><span aria-hidden className="mark-reserve">{text}</span><span aria-hidden className="mark-reserve">{formatted}</span><span className="mark-face"><SwapText value={raw ? text : formatted} /></span></span> : children}</span>
      {act > 0 && !tag && <span key={`line-${act}`} aria-hidden className="mu-mark-underline mark-recognition-line" />}
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
    <a ref={ref} target="_blank" rel="noopener noreferrer" className={className ? `mu-cue-url type-ui mark-url ${className}` : 'mu-cue-url type-ui mark-url'} {...props}>
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
  return <span ref={ref} data-chip={resolved} className={className ? `mu-cue mu-cue-inferred mark-inferred mark-chip ${className}` : 'mu-cue mu-cue-inferred mark-inferred mark-chip'} {...props} />;
});


/** Urgency: a 5 pt amber LED in the margin of an open task that is due soon. */
export function MarkUrgency({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span role="img" aria-label="Due soon" className={className ? `mu-cue-urgency mark-urgency ${className}` : 'mu-cue-urgency mark-urgency'} {...props} />;
}

export interface MarkLifeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The glyph at 16, e.g. <LifeCoffeeIcon size={16} /> from @unlocalhosted/metalui/icons/life. */
  children: React.ReactNode;
  /** Names the whole line's kind on hover and for assistive technology. */
  label?: string;
}

/** The life glyph trailing a block: a middle dot, then the glyph. Display only: never while writing. */
export function MarkLife({ children, label, className, ...props }: MarkLifeProps) {
  return (
    <span title={label} aria-label={label} className={className ? `mu-cue-life mark-life ${className}` : 'mu-cue-life mark-life'} {...props}>
      <span aria-hidden className="mu-cue-md">·</span>
      <span className="mu-cue-lg">{children}</span>
    </span>
  );
}

/** Earlier names (kept for existing hosts). */
export { Mark as Cue, MarkUrl as CueUrl, MarkInferred as CueInferred, MarkUrgency as CueUrgency, MarkLife as CueLife };
export type { MarkKind as CueKind, MarkProps as CueProps, MarkUrlProps as CueUrlProps, MarkInferredProps as CueInferredProps, MarkLifeProps as CueLifeProps };
