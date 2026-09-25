import * as React from 'react';
import { Link } from 'react-router';
import { Switcher } from '@unlocalhosted/metalui';
import { Code, Stage, Tag } from './doc';
import type { Lang } from '../lib/highlight';

/* ─────────────────────────────────────────────────────────
 * The kit for show-don't-tell pages (docs/SHOW.md, DOCS_ARCHITECTURE.md §3).
 *
 *   LayerTrail  one quiet line: what this is built from › this › where it is used
 *   SpecLine    one quiet line of jump links into the reference
 *   Beat        title · one sentence · a stage with its controls in the bottom edge
 *               · verb-first caption · cost · code folded
 *   Compare     specimens side by side, magnified, each named by a tag
 *   useSlow     a 0.25× control for every motion stage: it slows the real transitions
 * ───────────────────────────────────────────────────────── */

export interface TrailStep { label: string; to?: string }

const link = 'text-ink2 no-underline hover:text-ink hover:underline';

export function LayerTrail({ down, here, up }: { down: TrailStep[]; here: string; up: TrailStep[] }) {
  const step = (s: TrailStep) => (s.to ? <Link to={s.to} className={link}>{s.label}</Link> : <span className="text-ink2">{s.label}</span>);
  const list = (steps: TrailStep[]) => steps.flatMap((s, i) => (i > 0 ? [', ', <span key={s.label}>{step(s)}</span>] : [<span key={s.label}>{step(s)}</span>]));
  return (
    <nav aria-label="Layer trail" className="type-doc-caption text-pretty text-ink3">
      Built from {list(down)} <span aria-hidden className="px-2">→</span> <span className="text-ink" aria-current="page">{here}</span> <span aria-hidden className="px-2">→</span> used in {list(up)}
    </nav>
  );
}

export interface SpecItem { label: string; value: string; href: string; mono?: boolean }

/** The spec line: every item is a jump link into a reference section. */
export function SpecLine({ items }: { items: SpecItem[] }) {
  return (
    <ul className="type-doc-caption flex flex-wrap items-baseline gap-x-6 gap-y-2 text-ink3" aria-label="At a glance">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-baseline gap-6">
          {i > 0 && <span aria-hidden>·</span>}
          <a href={it.href} className="no-underline hover:text-ink">
            {it.mono ? <code className="type-doc-code text-ink2">{it.value}</code> : <><span className="text-ink2">{it.value}</span> {it.label.toLowerCase()}</>}
          </a>
        </li>
      ))}
    </ul>
  );
}
export const SpecStrip = SpecLine;

/** Slow motion for one stage: every transition that starts inside it plays at the chosen rate. */
export function useSlow(ref: React.RefObject<HTMLElement | null>, slow: boolean) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rate = slow ? 0.25 : 1;
    const apply = (e: Event) => {
      const t = e.target as Element;
      for (const a of t.getAnimations?.() ?? []) a.playbackRate = rate;
    };
    el.addEventListener('transitionrun', apply);
    el.addEventListener('animationstart', apply);
    for (const a of el.getAnimations?.({ subtree: true }) ?? []) a.playbackRate = rate;
    return () => {
      el.removeEventListener('transitionrun', apply);
      el.removeEventListener('animationstart', apply);
    };
  }, [ref, slow]);
}

export function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return <Switcher size="compact" aria-label={label} value={value} onValueChange={(v) => onChange(v as T)} options={options} />;
}

/** Real time or a quarter speed, in a stage's bar. */
export function SlowSwitch({ slow, onChange }: { slow: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switcher
      size="compact"
      aria-label="Speed"
      value={slow ? 'slow' : 'real'}
      onValueChange={(v) => onChange(v === 'slow')}
      options={[{ value: 'real', label: 'Real time' }, { value: 'slow', label: '¼ speed' }]}
    />
  );
}

export interface BeatProps {
  id: string;
  title: string;
  /** One sentence. No more than 60 words between beats (SHOW.md). */
  setup: React.ReactNode;
  /** Starts with a verb: Watch, Drag, Click, Switch, Count, Press, Hover, Compare. */
  caption: React.ReactNode;
  /** One line on what the decision costs. Decision beats must have one. */
  cost?: React.ReactNode;
  /** Controls in the stage's bottom edge (toggles, Slow, Replay, a width slider). */
  bar?: React.ReactNode;
  /** @deprecated use bar */
  controls?: React.ReactNode;
  code?: { label: string; code: string; lang?: Lang };
  slow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Beat({ id, title, setup, caption, cost, bar, controls, code, slow = false, className, children }: BeatProps) {
  const stage = React.useRef<HTMLDivElement>(null);
  useSlow(stage, slow);
  return (
    <article id={id} data-beat className="flex scroll-mt-80 flex-col">
      <h3 className="type-doc-subheading text-ink">{title}</h3>
      <p className="type-doc-prose mt-4 max-w-measure text-pretty text-ink2">{setup}</p>
      <div className="mt-20">
        <Stage stageRef={stage} bar={bar ?? controls} caption={caption} cost={cost} className={className}>
          {children}
        </Stage>
      </div>
      {code && (
        <details className="group mt-12">
          <summary data-md="skip" className="type-doc-caption w-fit cursor-pointer list-none text-ink3 hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform duration-150 group-open:rotate-90">›</span> Code
          </summary>
          <div className="mt-8"><Code label={code.label} lang={code.lang} code={code.code} /></div>
        </details>
      )}
    </article>
  );
}

/** Specimens side by side, magnified so the detail reads at rest; each named by a tag above it. */
export function Compare({ items, zoom = 1.6 }: { items: { label: string; note?: string; node: React.ReactNode; lit?: boolean }[]; zoom?: number }) {
  return (
    <div className="grid w-full grid-cols-1 gap-y-32 sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-rule">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center gap-16 px-12">
          <Tag tone={it.lit ? 'lit' : 'quiet'}>{it.label}</Tag>
          <div className="grid place-items-center py-8" style={{ zoom }}>{it.node}</div>
          {it.note && <span className="type-doc-caption text-center text-ink3">{it.note}</span>}
        </div>
      ))}
    </div>
  );
}
