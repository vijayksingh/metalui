import * as React from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Kbd, Led } from '@unlocalhosted/metalui';
import './edit.css';

/* ─────────────────────────────────────────────────────────
 * THE EDITING LAYER · change a real component by handling it
 *
 *   handles    hairlines inside the component's real edge (Outline), a corner arc
 *              (CornerArc), or the component itself (useHandle): drag, or arrows
 *   steps      what comes in steps (a size, a state) is only ever one of them: a drag
 *              builds a lean, then it snaps (useStepMotion); tunables move freely and
 *              catch on their tokens (snapTo), with a blip when they land (blip, useOnLand)
 *   hint tag   how to use a handle shows above the component, never on it (HintLayer);
 *              while you drag it is the readout
 *   readouts   value and unit in a small well, an LED for "on a token"; hover points at
 *              the handle, click hands it the keyboard, drag up or down steps the value
 *   concise    only what you point at shows
 * ───────────────────────────────────────────────────────── */

export const Z = 2; // shown at twice its size, so the handles have room

/** How far a drag must travel (button units) before a size clicks over. */
export const STEP_AT = 7;

export interface Snap { at: number; name: string }
/** The value, pulled onto a token when it is within reach. */
export function snapTo(v: number, targets: Snap[], within = 1.2): [number, Snap | undefined] {
  const t = targets.find((s) => Math.abs(s.at - v) <= within);
  return t ? [t.at, t] : [Math.round(v), undefined];
}
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/**
 * How a stepping size moves: not at all under the finger (the give tracks the pointer),
 * a click onto the next size on the part spring (fast, a little overshoot), and a crisp
 * return on the release spring when you let go before it clicks over.
 */
export const SIZE_PROPS = ['height', 'padding', 'font-size'];
export const STEP_MOTION = {
  drag: 'none',
  step: SIZE_PROPS.map((p) => `${p} var(--spring-part-d) var(--spring-part)`).join(', '),
  back: SIZE_PROPS.map((p) => `${p} var(--spring-release-d) var(--spring-release)`).join(', '),
};
export type StepMotion = keyof typeof STEP_MOTION;
/** The motion for a stepping size: drag while held, step for a moment after a click-over, back on release. */
export function useStepMotion() {
  const [motion, setMotion] = React.useState<StepMotion>('back');
  const timer = React.useRef(0);
  return {
    transition: STEP_MOTION[motion],
    held: () => { clearTimeout(timer.current); setMotion('drag'); },
    // the click-over plays out in full (cutting a running transition jumps it to the end), then the give tracks the pointer again
    stepped: () => { clearTimeout(timer.current); setMotion('step'); timer.current = window.setTimeout(() => setMotion((m) => (m === 'step' ? 'drag' : m)), parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-spring-part-d')) * 1000 || 600); },
    let: () => { clearTimeout(timer.current); setMotion((m) => (m === 'step' ? 'step' : 'back')); },
  };
}


/* ───────────────────────── the hint tag ───────────────────────── */

export type Gesture = 'sides' | 'steps' | 'corner' | 'press' | 'flip' | 'type';
export interface HintKey { k: string; say: string; held?: boolean }
export interface Hint { gesture: Gesture; title: string; value?: string; token?: string; keys?: HintKey[]; how?: string }
export interface HintAt extends Hint { x: number; y: number }

/** Gesture glyphs (prototype; would join the icon set). */
export function GestureGlyph({ g }: { g: Gesture }) {
  const c = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (g) {
    case 'sides': return <svg {...c}><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" /></svg>;
    case 'steps': return <svg {...c}><rect x="3" y="13" width="8" height="6" rx="3" /><rect x="13" y="7" width="8" height="12" rx="4" /><path d="M9 9l3-3 3 3" /></svg>;
    case 'corner': return <svg {...c}><path d="M5 20V12a7 7 0 0 1 7-7h8" /><circle cx="9" cy="9" r="1.6" fill="currentColor" stroke="none" /></svg>;
    case 'press': return <svg {...c}><rect x="4" y="5" width="16" height="7" rx="3.5" /><path d="M12 14v6M9 17l3 3 3-3" /></svg>;
    case 'type': return <svg {...c}><path d="M5 17 9.5 6 14 17M6.8 13h5.4" /><path d="M17 8v9M15 10l2-2 2 2M15 15l2 2 2-2" /></svg>;
    case 'flip': return <svg {...c}><rect x="2.5" y="7" width="19" height="10" rx="5" /><circle cx="7.5" cy="12" r="2.6" /><path d="M13 12h5M16 10l2 2-2 2" /></svg>;
  }
}

export const HintContext = React.createContext<{ show: (h: Hint, at: { x: number; y: number }) => void; hide: () => void }>({ show: () => {}, hide: () => {} });

export function HintLayer({ children }: { children: React.ReactNode }) {
  const [hint, setHint] = React.useState<HintAt | null>(null);
  const [alt, setAlt] = React.useState(false);
  const [shift, setShift] = React.useState(false);
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => { setAlt(e.altKey); setShift(e.shiftKey); };
    window.addEventListener('keydown', on); window.addEventListener('keyup', on);
    return () => { window.removeEventListener('keydown', on); window.removeEventListener('keyup', on); };
  }, []);
  const api = React.useMemo(() => ({ show: (h: Hint, at: { x: number; y: number }) => setHint({ ...h, ...at }), hide: () => setHint(null) }), []);
  const held = (k: string) => (k === '⌥' ? alt : k === '⇧' ? shift : false);
  return (
    <HintContext.Provider value={api}>
      {children}
      {hint && createPortal(
        <div className="ed-tag mu-tooltip recipe-tooltip text-tooltip-ink type-tooltip rounded-tooltip-radius" style={{ left: hint.x, top: hint.y }} role="status" aria-live="polite">
          <span className="ed-tag-ico"><GestureGlyph g={hint.gesture} /></span>
          <b>{hint.title}</b>
          {hint.value && <span className="ed-tag-val">{hint.value}</span>}
          {!hint.value && hint.how && <span className="ed-tag-how">{hint.how}</span>}
          {hint.keys?.map((k) => (
            <span key={k.k} className="ed-tag-key" data-held={held(k.k) ? '' : undefined}><Kbd size="small">{k.k}</Kbd>{k.say}</span>
          ))}
        </div>,
        document.body,
      )}
    </HintContext.Provider>
  );
}

/**
 * A handle: drag in the button's own units, arrows for the keyboard, and a hint tag
 * that follows the pointer (shown after a short rest, so passing over does not flash)
 * or pins beside the handle while it has keyboard focus.
 */
export function useHandle<S>(opts: {
  hint: () => Hint; keyHint: () => Hint;
  start: () => S; move: (s: S, dx: number, dy: number, e: PointerEvent) => void; end?: () => void;
  step: (d: number, e: React.KeyboardEvent) => void; axis?: 'x' | 'y' | 'both';
  /** The pointer or focus is on this handle (true) or has left it (false). */
  over?: (on: boolean) => void;
  /** The handle was taken hold of. */
  grab?: () => void;
  /** How much the section is magnified (drags are read in the component's own units). */
  zoom?: number;
}) {
  const tag = React.useContext(HintContext);
  const o = React.useRef(opts); o.current = opts;
  const timer = React.useRef(0);
  const dragging = React.useRef(false);
  const last = React.useRef({ x: 0, y: 0 });
  // the tag never covers the component: it rides just above it, level with the pointer or the handle
  const anchor = React.useRef<Element | null>(null);
  const above = (x: number) => { const r = anchor.current?.getBoundingClientRect(); return r ? { x: clamp(x, r.left, r.right), y: r.top - 14 } : { x, y: 0 }; };
  const near = (x: number, _y: number) => above(x);
  const beside = (el: Element) => { anchor.current = el.closest('[data-hint-anchor]'); const r = el.getBoundingClientRect(); return above(r.left + r.width / 2); };
  return {
    onPointerEnter: (e: React.PointerEvent) => { o.current.over?.(true); anchor.current = e.currentTarget.closest('[data-hint-anchor]'); last.current = near(e.clientX, e.clientY); clearTimeout(timer.current); timer.current = window.setTimeout(() => tag.show(o.current.hint(), last.current), 220); },
    onPointerMove: (e: React.PointerEvent) => { last.current = near(e.clientX, e.clientY); if (dragging.current) tag.show(o.current.hint(), last.current); },
    onPointerLeave: () => { clearTimeout(timer.current); if (!dragging.current) { tag.hide(); o.current.over?.(false); } },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const el = e.currentTarget; el.setPointerCapture(e.pointerId);
      clearTimeout(timer.current); dragging.current = true; o.current.grab?.();
      const s = o.current.start(), x0 = e.clientX, y0 = e.clientY;
      const z = o.current.zoom ?? Z;
      const onMove = (ev: PointerEvent) => { o.current.move(s, (ev.clientX - x0) / z, (ev.clientY - y0) / z, ev); last.current = near(ev.clientX, ev.clientY); requestAnimationFrame(() => tag.show(o.current.hint(), last.current)); };
      const onUp = () => {
        dragging.current = false;
        el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
        o.current.end?.();
        requestAnimationFrame(() => { if (el.matches(':hover')) tag.show(o.current.hint(), last.current); else { tag.hide(); o.current.over?.(false); } });
      };
      el.addEventListener('pointermove', onMove); el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp);
      tag.show(o.current.hint(), near(e.clientX, e.clientY));
    },
    onFocus: (e: React.FocusEvent) => { if (e.currentTarget.matches(':focus-visible') || (e.currentTarget as HTMLElement).dataset.summoned !== undefined) { o.current.over?.(true); tag.show(o.current.keyHint(), beside(e.currentTarget)); } },
    onBlur: (e: React.FocusEvent) => { delete (e.currentTarget as HTMLElement).dataset.summoned; tag.hide(); o.current.over?.(false); },
    onKeyDown: (e: React.KeyboardEvent) => {
      const k = e.shiftKey ? 4 : 1, axis = o.current.axis ?? 'x';
      const d = { ArrowRight: axis !== 'y' ? k : 0, ArrowUp: axis !== 'x' ? k : 0, ArrowLeft: axis !== 'y' ? -k : 0, ArrowDown: axis !== 'x' ? -k : 0 }[e.key];
      if (!d) return;
      e.preventDefault(); o.current.step(d, e);
      const el = e.currentTarget; requestAnimationFrame(() => tag.show(o.current.keyHint(), beside(el)));
    },
  };
}

/**
 * A value that rolls when it changes: the new one slides in from below as it goes up and
 * from above as it goes down, while the old one leaves the other way.
 */
export function Rolling({ value, dir }: { value: string; dir: 1 | -1 }) {
  const [shown, setShown] = React.useState<{ cur: string; prev: string | null; dir: 1 | -1 }>({ cur: value, prev: null, dir });
  React.useLayoutEffect(() => {
    if (value === shown.cur) return;
    const n = parseFloat(value), o = parseFloat(shown.cur);
    const d: 1 | -1 = Number.isFinite(n) && Number.isFinite(o) && n !== o ? (n > o ? 1 : -1) : dir;
    setShown({ cur: value, prev: shown.cur, dir: d });
    const t = window.setTimeout(() => setShown((s2) => ({ ...s2, prev: null })), 320);
    return () => clearTimeout(t);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="ed-roll" data-dir={shown.dir > 0 ? 'up' : 'down'}>
      {shown.prev !== null && <span key={`p${shown.prev}`} className="is-out" aria-hidden>{shown.prev}</span>}
      <span key={`c${shown.cur}`} className={shown.prev !== null ? 'is-in' : undefined}>{shown.cur}</span>
    </span>
  );
}

/**
 * A readout. When it belongs to handles, it points at them: hover or focus it and the
 * handles light up on the component; click it and the handle takes the keyboard.
 * With `scrub`, drag it up or down (or press ↑↓) to step the value; the digits roll.
 */
export function Readout({ label, value, unit = 'pt', snap, peek, pick, scrub }: { label: string; value: string; unit?: string; snap?: Snap; peek?: (on: boolean) => void; pick?: () => void; scrub?: (dir: 1 | -1) => void }) {
  const dir = React.useRef<1 | -1>(1);
  const moved = React.useRef(false);
  const [scrubbing, setScrubbing] = React.useState(false);
  // the newest step: each step renders before the next, so a long drag counts every step from the last
  const scrubRef = React.useRef(scrub); scrubRef.current = scrub;
  const step = (d: 1 | -1) => { dir.current = d; flushSync(() => scrubRef.current?.(d)); };
  // one step per 8 px of drag, up for more; a drag is not a click
  const onPointerDown = scrub ? (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    moved.current = false; let acc = 0, last = e.clientY;
    const mv = (ev: PointerEvent) => {
      acc += last - ev.clientY; last = ev.clientY;
      if (Math.abs(acc) > 3 && !moved.current) { moved.current = true; setScrubbing(true); }
      while (acc >= 8) { acc -= 8; step(1); }
      while (acc <= -8) { acc += 8; step(-1); }
    };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); setScrubbing(false); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  } : undefined;
  // the value and its unit; an LED says whether it sits on a token (lit) or was tuned off one,
  // and flickers as a value lands on one. The token's name is for the screen reader.
  const body = <>
    <b className="eng">{label}</b>
    {value !== '' && <span className="ed-val"><Rolling value={value} dir={dir.current} />{unit && <small>{unit}</small>}</span>}
    <Led kind={snap ? 'live' : 'off'} size="small" gesture={snap ? 'flicker' : 'steady'} />
  </>;
  const said = `${label} ${value}${unit}${snap ? `, ${snap.name}` : ', tuned'}`;
  if (!peek && !scrub) return <span className="ed-readout" aria-label={said}>{body}</span>;
  return (
    <button type="button" className="ed-readout is-link" data-scrub={scrub ? '' : undefined} data-scrubbing={scrubbing ? '' : undefined}
      aria-label={`${said}${scrub ? ': drag up or down, or ↑↓, to change' : ': adjust'}`}
      onPointerEnter={() => peek?.(true)} onPointerLeave={() => peek?.(false)} onFocus={() => peek?.(true)} onBlur={() => peek?.(false)}
      onPointerDown={onPointerDown}
      onKeyDown={scrub ? (e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); step(e.key === 'ArrowUp' ? 1 : -1); } } : undefined}
      onClick={() => { if (moved.current) { moved.current = false; return; } pick?.(); }}>
      {body}
    </button>
  );
}

/** Hands a handle the keyboard from somewhere else (a readout), with its hint showing. */
export function summon(el: HTMLElement | null) {
  if (!el) return;
  el.dataset.summoned = '';
  el.focus();
}

/* ───────────────────────── the outline handles ───────────────────────── */

/** A blip: the line thickens for a beat and settles, to mark an event (a grab, a catch, a step). */
export function blip(...els: (Element | null | undefined)[]) {
  if (document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const el of els) {
    if (!el) continue;
    const w = parseFloat(getComputedStyle(el).strokeWidth) || 1;
    el.animate([{ strokeWidth: `${w}px`, opacity: 1 }, { strokeWidth: `${w * 2.6}px`, opacity: 1, offset: 0.3 }, { strokeWidth: `${w}px` }], { duration: 380, easing: 'cubic-bezier(.3, .7, .3, 1)' });
  }
}

/** Fires when a value lands on something worth marking (a token, a step), not while it sits there. */
export function useOnLand(key: string | undefined, fire: () => void) {
  const prev = React.useRef(key);
  React.useEffect(() => { if (key && key !== prev.current) fire(); prev.current = key; });
}

export type Seg = 'top' | 'right' | 'bottom' | 'left' | 'corner';
export const HEAVY: Seg[] = ['top', 'right'];

/**
 * The button's own outline, drawn as the handles: hairlines just inside its real edge,
 * curves included. Top and right (the ones you reach for) are heavier; bottom and left
 * mirror them. The top-left quarter is the corner handle's (CornerArc).
 */
export function Outline({ W, h, r, on, only, segs }: { W: number; h: number; r: number; on: Seg[]; only?: Seg[]; segs: React.MutableRefObject<Partial<Record<Seg, SVGPathElement | null>>> }) {
  if (!W) return null;
  const i = 1.6, rr = Math.max(r - i, 0), round = r >= 2;
  const d: Record<Exclude<Seg, 'corner'>, string> = {
    top: `M${Math.max(r, 6)} ${i}H${W - Math.max(r, 6)}`,
    bottom: `M${Math.max(r, 6)} ${h - i}H${W - Math.max(r, 6)}`,
    right: round ? `M${W - r} ${i}A${rr} ${rr} 0 0 1 ${W - i} ${r}V${h - r}A${rr} ${rr} 0 0 1 ${W - r} ${h - i}` : `M${W - i} ${i}V${h - i}`,
    left: round ? `M${i} ${r}V${h - r}A${rr} ${rr} 0 0 0 ${r} ${h - i}` : `M${i} 6V${h - i}`,
  };
  return (
    <svg className="ed-outline" width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden>
      {(Object.keys(d) as (keyof typeof d)[]).map((k) => (
        <path key={k} ref={(el) => { segs.current[k] = el; }} className="ed-seg" d={d[k]} data-weight={HEAVY.includes(k) ? 'heavy' : undefined} data-on={on.includes(k) ? '' : undefined} data-away={only && !only.includes(k) ? '' : undefined} />
      ))}
    </svg>
  );
}


/**
 * The corner handle draws what it controls: a hairline arc along the corner's own curve,
 * and, while you work it, the rest of that circle, dotted, which is the radius itself.
 * Square corners get a small bracket instead.
 */
export function CornerArc({ r, arcRef, on }: { r: number; arcRef?: (el: SVGPathElement | null) => void; on?: boolean }) {
  const i = 1.6, rr = Math.max(r - i, 0), size = Math.max(r, 6) + 3;
  return (
    <svg className="ed-corner-art" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {r >= 2 ? (
        <>
          <circle className="ed-corner-circle" cx={r} cy={r} r={rr} />
          <path ref={arcRef} className="ed-corner-arc" data-on={on ? '' : undefined} d={`M${i} ${r}A${rr} ${rr} 0 0 1 ${r} ${i}`} />
        </>
      ) : <path ref={arcRef} className="ed-corner-arc" data-on={on ? '' : undefined} d={`M${i} 6V${i}H6`} />}
    </svg>
  );
}

/**
 * How much a specimen is magnified: twice when its well has room, one and a half on a
 * narrow card (a phone, or the x-ray's own column). Handles read drags at the same scale.
 */
export function useSpecimenZoom() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(Z);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const read = () => setZoom(el.clientWidth < 360 ? 1.5 : Z);
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, zoom] as const;
}
