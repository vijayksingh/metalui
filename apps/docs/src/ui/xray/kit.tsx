import * as React from 'react';
import { Slider } from '@unlocalhosted/metalui';
import { useColorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * X-RAY KIT · the parts every x-ray shares
 *
 *   Glyph      the callout icons
 *   Dial       a labelled MetalUI slider with a readout
 *   Switch     a labelled toggle
 *   Callouts   icons in two columns, with leader lines to .xr-anchor[data-spot] points
 *   helpers    read a recipe's layers, scale shadows, simulate a spring
 * ───────────────────────────────────────────────────────── */

export interface SpotDef<T extends string> { id: T; title: string; word: string }

export type GlyphName = 'type' | 'shape' | 'light' | 'shadow' | 'press' | 'layers' | 'well' | 'thumb' | 'slide';

export function Glyph({ id, size = 15 }: { id: GlyphName; size?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (id) {
    case 'type': return <svg {...c}><path d="M4 18 9 6l5 12M5.8 14h6.4" /><path d="M16 11.5a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM18.8 11.5V18" /></svg>;
    case 'shape': return <svg {...c}><rect x="3.5" y="7" width="17" height="10" rx="5" /><path d="M3.5 20.5h17M3.5 19v3M20.5 19v3" /></svg>;
    case 'light': return <svg {...c}><circle cx="12" cy="12" r="3.6" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></svg>;
    case 'shadow': return <svg {...c}><rect x="6" y="4" width="12" height="7" rx="3.5" /><ellipse cx="12" cy="18.5" rx="8" ry="2.5" fill="currentColor" fillOpacity=".25" stroke="none" /><path d="M12 11v4" strokeDasharray="1.5 2" /></svg>;
    case 'press': return <svg {...c}><path d="M12 3v4" /><path d="m9.5 5.5 2.5 2.5 2.5-2.5" /><path d="M5 10h14" /><path d="M7 13c1.2 0 1.2 3 2.5 3s1.3-3 2.5-3 1.2 3 2.5 3 1.3-3 2.5-3" /><path d="M5 20h14" /></svg>;
    case 'layers': return <svg {...c}><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg>;
    case 'well': return <svg {...c}><path d="M3 9h3.5a2 2 0 0 1 2 2v2.5a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V11a2 2 0 0 1 2-2H21" /><path d="M9.5 12.5h5" strokeDasharray="1.5 2" /></svg>;
    case 'thumb': return <svg {...c}><rect x="3" y="8" width="18" height="10" rx="5" strokeOpacity=".45" /><rect x="5" y="5.5" width="8" height="9" rx="4" /></svg>;
    case 'slide': return <svg {...c}><rect x="10" y="7" width="9" height="8" rx="4" /><path d="M3 11h4M4.5 8.5 3 11l1.5 2.5" /><path d="M5 19c2 0 3-2 5.5-2s3 2 5 2 2.5-1 3.5-1" /></svg>;
  }
}

export function Dial({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="xr-dial">
      <span className="xr-dial-head"><span>{label}</span><span className="readout-t">{fmt ? fmt(value) : value}</span></span>
      <Slider.Root value={value} min={min} max={max} step={step} onValueChange={onChange}>
        <Slider.Track />
        <Slider.Knob aria-label={label} />
      </Slider.Root>
    </div>
  );
}

export function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="xr-switch">
      <span>{label}</span>
      <span className="tog sm"><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} aria-label={label} /><span className="tr" /><span className="th" /></span>
    </label>
  );
}

/** One part's layers for the current colorway, in recipe order. */
export function useRecipeLayers(recipe: keyof typeof tokens.recipes, part = 'self') {
  const { colorway } = useColorway();
  const r = tokens.recipes[recipe] as { layers: { part: string; prop: string; value: string; colorway?: string; state?: string }[] };
  const ls = r.layers.filter((l) => l.part === part && (!l.colorway || l.colorway === colorway) && !l.state);
  const fill = ls.find((l) => l.prop === 'background')?.value ?? 'transparent';
  const shadows = ls.filter((l) => l.prop === 'shadow').map((l) => l.value);
  const stops = (fill.match(/linear-gradient\((.*)\)/)?.[1] ?? fill).split(/,(?![^(]*\))/).map((x) => x.trim());
  return { fill, stops, shadows, colorway };
}

export const scalePx = (v: string, k: number) => v.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`);
export const alphaK = (v: string, k: number) => v.replace(/rgba\(([^)]*),\s*([\d.]+)\)/g, (_, rgb, a) => `rgba(${rgb},${Math.min(1, Number(a) * k).toFixed(3)})`);

/** Position of a unit spring step over time: [ms, x]. */
export function springCurve(k: number, c: number, ms = 360, step = 4) {
  let x = 0, v = 0; const pts: [number, number][] = []; const dt = step / 1000;
  for (let t = 0; t <= ms; t += step) { pts.push([t, x]); for (let s = 0; s < 8; s++) { const a = -k * (x - 1) - c * v; v += a * (dt / 8); x += v * (dt / 8); } }
  return pts;
}

/** A spring as a CSS easing: linear() samples until it settles, and the time that takes. */
export function springEasing(k: number, c: number) {
  let x = 0, v = 0, t = 0; const dt = 1 / 1000; const xs: number[] = [0];
  while (t < 3000) {
    for (let i = 0; i < 4; i++) { const a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; t += 1; }
    xs.push(x);
    if (t > 60 && Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.05) break;
  }
  const step = Math.max(1, Math.floor(xs.length / 48));
  const pts = xs.filter((_, i) => i % step === 0).map((n) => Number(n.toFixed(4)));
  pts[pts.length - 1] = 1;
  return { css: `linear(${pts.join(', ')})`, ms: t };
}

/** A spring curve drawn as a path in a w×h box; the dashed line is the target. Values over 1 draw above it. */
export function SpringPlot({ k, c, ms = 360, w = 220, h = 70 }: { k: number; c: number; ms?: number; w?: number; h?: number }) {
  const pts = React.useMemo(() => springCurve(k, c, ms), [k, c, ms]);
  const y = (x: number) => h - 8 - x * (h - 22);
  const d = pts.map(([t, x], i) => `${i ? 'L' : 'M'}${((t / ms) * w).toFixed(1)} ${y(x).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
      <path d={`M0 ${h - 8}H${w}`} stroke="var(--rule)" />
      <path d={`M0 ${y(1)}H${w}`} stroke="var(--rule)" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke="var(--green-deep)" strokeWidth="1.5" />
    </svg>
  );
}

/** A zoom that keeps an isometric model of w×h inside the bench, leaving room for the callout columns. */
export function useFit(bench: React.RefObject<HTMLDivElement | null>, w: number, h: number, active: boolean) {
  const [room, setRoom] = React.useState(0);
  React.useLayoutEffect(() => {
    if (!active) return;
    const el = bench.current; if (!el) return;
    const read = () => setRoom(el.clientWidth);
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [bench, active]);
  const footprint = w * 0.79 + h * 0.62;
  return room ? Math.min(1, (room - 150) / footprint) : 1;
}

export type Side = Record<string, ['left' | 'right', number]>;

/** Icon callouts in two columns, each with a leader line to its anchor on the model. */
export function Callouts<T extends GlyphName>({ bench, spots, side, spot, setSpot, deps }: { bench: React.RefObject<HTMLDivElement | null>; spots: SpotDef<T>[]; side: Record<T, ['left' | 'right', number]>; spot: T; setSpot: (s: T) => void; deps: unknown[] }) {
  const [pts, setPts] = React.useState<Partial<Record<T, [number, number]>>>({});
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    let raf = 0; const until = performance.now() + 1100;
    const measure = () => {
      const el = bench.current;
      if (!el) { raf = requestAnimationFrame(measure); return; }
      const b = el.getBoundingClientRect();
      const next: Partial<Record<T, [number, number]>> = {};
      el.querySelectorAll<HTMLElement>('.xr-anchor').forEach((a) => {
        const r = a.getBoundingClientRect();
        next[a.dataset.spot as T] = [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top];
      });
      setPts(next); setBox({ w: b.width, h: b.height });
      if (performance.now() < until) raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => { raf = requestAnimationFrame(measure); });
    const start = requestAnimationFrame(() => { if (bench.current) ro.observe(bench.current); });
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(start); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const colX = (s: 'left' | 'right') => (s === 'left' ? 28 : box.w - 28);
  return (
    <>
      <svg className="xr-leaders" width={box.w} height={box.h} aria-hidden>
        {spots.map((s) => {
          const p = pts[s.id]; if (!p) return null;
          const [sd, fy] = side[s.id];
          const cx = sd === 'left' ? colX('left') + 36 : colX('right') - 36, cy = box.h * fy;
          const knee = sd === 'left' ? cx + 24 : cx - 24;
          return (
            <g key={s.id} className={spot === s.id ? 'is-on' : ''}>
              <path d={`M${cx} ${cy}H${knee}L${p[0]} ${p[1]}`} />
              <circle cx={p[0]} cy={p[1]} r={spot === s.id ? 4 : 3} />
            </g>
          );
        })}
      </svg>
      {spots.map((s) => {
        const [sd, fy] = side[s.id];
        const style = sd === 'left' ? { left: colX('left'), top: box.h * fy } : { right: 28, top: box.h * fy };
        return (
          <button key={s.id} type="button" className={['xr-callout', sd, spot === s.id ? 'is-on' : ''].join(' ')} style={style} onClick={() => setSpot(s.id)} aria-pressed={spot === s.id} aria-label={`${s.title}: ${s.word}`} title={s.title}>
            <span className="xr-callout-ico"><Glyph id={s.id} /></span>
          </button>
        );
      })}
    </>
  );
}
