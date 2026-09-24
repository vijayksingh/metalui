import * as React from 'react';
import { Link } from 'react-router';
import { Segmented } from '@unlocalhosted/metalui';
import { Code } from './doc';

/* ─────────────────────────────────────────────────────────
 * The page kit for show-don't-tell pages (docs/SHOW.md, DOCS_ARCHITECTURE.md §3).
 *
 *   Head        title, one line, status, layer trail, spec strip (reference, above the fold)
 *   Beat        one sentence · live bench · verb-first caption · cost line · code folded
 *   useSlow     a 0.25× control for every motion bench: it slows the real transitions
 *   Toggle      the two-way switch a decision beat is built on
 * ───────────────────────────────────────────────────────── */

export interface TrailStep { label: string; to?: string; here?: boolean }

export function LayerTrail({ down, here, up }: { down: TrailStep[]; here: string; up: TrailStep[] }) {
  const step = (s: TrailStep) =>
    s.to ? <Link key={s.label} to={s.to} className="text-ink2 underline decoration-dotted underline-offset-4 hover:text-ink">{s.label}</Link> : <span key={s.label} className="text-ink2">{s.label}</span>;
  return (
    <nav aria-label="Layer trail" className="type-meta flex flex-wrap items-center gap-x-8 gap-y-4 text-ink3">
      <span className="type-label engraved">Built from</span>
      {down.map((s, i) => <span key={s.label} className="contents">{i > 0 && <span aria-hidden>·</span>}{step(s)}</span>)}
      <span aria-hidden>›</span>
      <span className="text-ink" aria-current="page">{here}</span>
      <span aria-hidden>›</span>
      <span className="type-label engraved">Used in</span>
      {up.map((s, i) => <span key={s.label} className="contents">{i > 0 && <span aria-hidden>·</span>}{step(s)}</span>)}
    </nav>
  );
}

export interface SpecItem { label: string; value: string; href: string; mono?: boolean }

/** The spec strip: every item is a jump link into a reference section. */
export function SpecStrip({ items }: { items: SpecItem[] }) {
  return (
    <ul className="flex flex-wrap gap-8" aria-label="At a glance">
      {items.map((it) => (
        <li key={it.label}>
          <a href={it.href} className="material-well type-meta inline-flex h-28 items-center gap-8 rounded-pill px-12 text-ink2 hover:text-ink">
            <span className="type-label engraved">{it.label}</span>
            <span className={it.mono ? 'type-readout text-ink' : 'text-ink'}>{it.value}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Slow motion for one bench: every transition that starts inside it plays at the chosen rate. */
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
  return (
    <Segmented aria-label={label} value={value} onValueChange={(v) => onChange(v as T)} options={options} />
  );
}

export interface BeatProps {
  id: string;
  title: string;
  /** One sentence. No more than 60 words between beats (SHOW.md). */
  setup: React.ReactNode;
  /** Starts with a verb: Watch, Drag, Click, Switch, Count, Press, Hover. */
  caption: string;
  /** One line on what the decision costs. Decision beats must have one. */
  cost?: React.ReactNode;
  /** Controls that sit above the bench (toggles, Slow, Replay). */
  controls?: React.ReactNode;
  code?: { label: string; code: string };
  slow?: boolean;
  children: React.ReactNode;
}

export function Beat({ id, title, setup, caption, cost, controls, code, slow = false, children }: BeatProps) {
  const bench = React.useRef<HTMLDivElement>(null);
  useSlow(bench, slow);
  return (
    <article id={id} className="flex scroll-mt-80 flex-col gap-12">
      <h3 className="type-title text-ink">{title}</h3>
      <p className="prose-body max-w-[62ch] text-ink2">{setup}</p>
      <figure className="flex flex-col gap-10">
        {controls && <div data-md="skip" className="flex flex-wrap items-center gap-8">{controls}</div>}
        <div ref={bench} data-md="skip" className="material-well relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-card p-32">
          {children}
        </div>
        <figcaption className="flex flex-col gap-4">
          <span className="type-meta text-ink">{caption}</span>
          {cost && <span className="type-meta text-ink3"><span className="type-label engraved">Cost</span>&nbsp; {cost}</span>}
        </figcaption>
      </figure>
      {code && (
        <details className="group">
          <summary className="type-meta cursor-pointer text-ink2 hover:text-ink">Show the code</summary>
          <div className="mt-8"><Code label={code.label} code={code.code} /></div>
        </details>
      )}
    </article>
  );
}

/** A Slow switch styled like every other control on the bench. */
export function SlowSwitch({ slow, onChange }: { slow: boolean; onChange: (v: boolean) => void }) {
  return (
    <Segmented
      aria-label="Speed"
      value={slow ? 'slow' : 'real'}
      onValueChange={(v) => onChange(v === 'slow')}
      options={[{ value: "real", label: "Real time" }, { value: "slow", label: "0.25×" }]}
    />
  );
}
