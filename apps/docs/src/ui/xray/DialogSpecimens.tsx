import * as React from 'react';
import { Button, Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { STEP_AT, Outline, Readout, blip, clamp, snapTo, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg } from '../edit';
import { DIM, DialogFace, FROM, RISE, TOP, focusable, type DialogConfig, type Look } from './DialogXray';
import './dialog-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE DIALOG'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the real dialog's plate (DialogFace: the popup as the library renders it, set to the
 *   config) inside a small window, so where it sits and what it dims can be handled.
 *     sheet    drag on the sheet: how much it dims the page
 *     opening  pull the dialog up and let go: how far it drops in from
 *     focus    drag the focus ring: it steps between the things inside (a state, it snaps)
 *     place    drag the dialog up or down: how far down the window it sits
 *     shadow   lift the dialog: how high it floats
 *     layers   a row with a switch per layer
 *   Every number is read from the dialog recipe in tokens.json; what this file takes from the x-ray
 *   (which imports it) is read only inside functions, never at load.
 * ───────────────────────────────────────────────────────── */

const D = tokens.recipes.dialog.props as { self: { width: number } };

/* the window the specimen sits in: a small viewport, in points, shown at K of its size */
const VW = 400, VH = 300, K = 0.42;
const WW = VW * K, WH = VH * K;
const DW = Math.min(D.self.width, VW - 32) * K; // the dialog is never wider than the viewport less a gutter
const DX = (WW - DW) / 2;

type Spot = 'surface' | 'states' | 'press' | 'shape' | 'shadow' | 'layers';
type Props = {
  spot: Spot; m: DialogConfig; set: (p: Partial<DialogConfig>) => void; look: Look;
  layers: { name: string }[]; focus: (name: string | null) => void;
  open: boolean; setOpen: (v: boolean) => void; focusAt: number; setFocusAt: (i: number) => void; replay: () => void;
  real: boolean; setReal: (v: boolean) => void;
};

const reduced = () => document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
/** The real arrival: it rises from `rise` above and from the enter scale on the surface spring; under reduced motion it fades in place. */
export function arrive(el: HTMLElement | null, rise: number) {
  if (!el) return;
  const easing = cssVar('--mu-spring-surface') || 'ease-out';
  const duration = (parseFloat(cssVar('--mu-spring-surface-d')) || 0.5) * 1000;
  const frames = reduced()
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [{ opacity: 0, transform: `translateY(${-rise}px) scale(${FROM})` }, { opacity: 1, transform: 'none' }];
  el.animate(frames, { duration, easing });
}

/** The window: a page, the sheet over it, and the dialog near the top. */
function Win({ m, look, children, sheet, place, lines = true, open = true, winRef }: {
  m: DialogConfig; look: Look; children?: React.ReactNode; open?: boolean; lines?: boolean;
  sheet?: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>;
  place?: { props?: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>; y?: number; face: React.ReactNode; faceRef?: React.Ref<HTMLDivElement> };
  winRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={winRef} className="ed-dlg-win" style={{ width: WW, height: WH }} data-hint-anchor>
      {lines && <span className="ed-dlg-lines" aria-hidden>{[0.8, 0.55, 0.7, 0.4, 0.65, 0.5].map((w, i) => <i key={i} style={{ width: `${w * 100}%` }} />)}</span>}
      {open && <div className="ed-dlg-scrim" style={{ background: look.scrim }} {...sheet} />}
      {open && place && (
        <div className="ed-dlg-place" style={{ left: DX, top: (WH * m.top) / 100, translate: `0 ${place.y ?? 0}px` }} {...place.props}>
          <div ref={place.faceRef} style={{ zoom: K }}>{place.face}</div>
        </div>
      )}
      {children}
    </div>
  );
}

function Well({ well, zoom, children }: { well: React.RefObject<HTMLDivElement | null>; zoom: number; children: React.ReactNode }) {
  return <div ref={well} className="ed-specimen ed-dlg-specimen"><div style={{ zoom }}>{children}</div></div>;
}

/** The last row of every card: the real, modal dialog, which the code under the card builds. */
function Real({ real, setReal }: { real: boolean; setReal: (v: boolean) => void }) {
  return (
    <div className="ed-layers ed-dlg-real">
      <Row.Root variant="list" className="ed-layer" onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) setReal(!real); }}>
        <Row.Text>Open a real dialog</Row.Text>
        <Row.Trail><Switch size="small" aria-label="Open a real dialog" checked={real} onCheckedChange={setReal} /></Row.Trail>
      </Row.Root>
    </div>
  );
}

/* ───────────────────────── sheet: how much it dims ───────────────────────── */

function Sheet({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const ref = React.useRef<HTMLDivElement>(null);
  const pct = Math.round(m.dim * 100);
  const setDim = (v: number, caught = true) => { const x = Math.round(clamp(v, 0, 0.9) * 100) / 100; set({ dim: caught && Math.abs(x - DIM) <= 0.02 ? DIM : x }); };
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'press', title: 'Dim', value: live ? `${pct}%` : undefined, how: 'drag up on the sheet to dim more' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Dim', value: `${pct}%`, keys: [{ k: '↑↓', say: 'change' }] }),
    start: () => m.dim, move: (d0, _dx, dy) => { setLive(true); setDim(d0 - dy * 0.01); }, end: () => setLive(false),
    step: (d) => setDim(m.dim + d * 0.01, false), axis: 'y', over: setOver, grab: () => blip(segs.current.top),
  });
  useOnLand(live && m.dim === DIM ? 'dim' : undefined, () => blip(segs.current.top, segs.current.right));
  const lit = live || over;
  return (
    <>
      <p>A thin sheet lies over the page and dims it, so your eye goes to the dialog but you can still see where you were. Drag up on the sheet to dim the page more. The sheet is the page's, not the dialog's: it dims the same under every dialog on the page.</p>
      <Well well={well} zoom={zoom}>
        <Win m={m} look={look}
          sheet={{ ref, role: 'slider', tabIndex: 0, 'aria-label': 'Dim', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 90, 'data-live': live ? '' : undefined, ...handle } as Record<string, unknown>}
          place={{ props: { style: { pointerEvents: 'none', left: DX, top: (WH * m.top) / 100 } }, face: <DialogFace m={m} look={look} /> }}>
          <Outline W={WW} h={WH} r={10} on={lit ? ['top', 'right'] : []} only={['top', 'right']} segs={segs} />
        </Win>
      </Well>
      <div className="ed-readouts">
        <Readout label="Dim" value={`${pct}`} unit="%" snap={m.dim === DIM ? { at: DIM, name: 'scrim colour' } : undefined} peek={setOver} pick={() => summon(ref.current)} scrub={(d) => setDim(m.dim + d * 0.05, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── opening: how far it drops in from ───────────────────────── */

function Opening({ m, set, look, replay }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const face = React.useRef<HTMLDivElement>(null);
  const setRise = (v: number, caught = true) => { const x = Math.round(clamp(v, 0, 24)); set({ rise: caught && Math.abs(x - RISE) <= 1 ? RISE : x }); };
  const play = (rise: number) => { requestAnimationFrame(() => arrive(face.current, rise)); replay(); };
  // drags are read in the dialog's own points (the window shows it at K)
  const handle = useHandle({
    zoom: zoom * K,
    hint: (): Hint => ({ gesture: 'press', title: 'Drop', value: live ? `${m.rise}pt` : undefined, how: 'pull the dialog up, then let go' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Drop', value: `${m.rise}pt`, keys: [{ k: '↑↓', say: 'change' }] }),
    start: () => m.rise, move: (r0, _dx, dy) => { setLive(true); setRise(r0 - dy); },
    end: () => { setLive(false); play(m.rise); },
    step: (d) => { const r = clamp(m.rise + d, 0, 24); setRise(r, false); play(r); }, axis: 'y', over: setOver,
  });
  useOnLand(live && m.rise === RISE ? 'rise' : undefined, () => ref.current?.animate([{ opacity: 0.5 }, { opacity: 1, offset: 0.3 }, { opacity: 0.5 }], { duration: 380 }));
  return (
    <>
      <p>The dialog drops in from a little above and grows to full size, then settles without bouncing. Pull it up and let go to watch it arrive from there.</p>
      <Well well={well} zoom={zoom}>
        <Win m={m} look={look}
          place={{
            faceRef: face,
            props: { ref, className: 'ed-dlg-place ed-dlg-grab ed-dlg-rise', role: 'slider', tabIndex: 0, 'aria-label': 'Drop', 'aria-valuenow': m.rise, 'aria-valuemin': 0, 'aria-valuemax': 24, 'data-live': live ? '' : undefined, 'data-peek': over ? '' : undefined, ...handle } as Record<string, unknown>,
            face: <div className="ed-dlg-pull" style={live ? { transform: `translateY(${-m.rise}px) scale(${FROM})`, opacity: 0.55 } : undefined}><DialogFace m={m} look={look} /></div>,
          }} />
      </Well>
      <div className="ed-readouts">
        <Readout label="Drops" value={`${m.rise}`} snap={m.rise === RISE ? { at: RISE, name: 'enter y' } : undefined} peek={setOver} pick={() => summon(ref.current)} scrub={(d) => { const r = clamp(m.rise + d, 0, 24); setRise(r, false); play(r); }} />
        <Readout label="Grows from" value={`${Math.round(FROM * 1000) / 10}`} unit="%" snap={{ at: FROM, name: 'enter scale' }} />
      </div>
    </>
  );
}

/* ───────────────────────── focus: it steps between the things inside ───────────────────────── */

interface Box { x: number; y: number; w: number; h: number; r: number }
function Focus({ m, look, open, setOpen, focusAt, setFocusAt, replay }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const win = React.useRef<HTMLDivElement>(null);
  const opener = React.useRef<HTMLSpanElement>(null);
  const ring = React.useRef<HTMLSpanElement>(null);
  const targets = React.useRef<(HTMLElement | null)[]>([]);
  const [boxes, setBoxes] = React.useState<Box[]>([]);
  const [lean, setLean] = React.useState(0);
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const stops = focusable(m);
  const n = stops.length;
  const wrap = (i: number) => ((i % n) + n) % n;
  // where each focusable thing sits, in the window's units
  React.useLayoutEffect(() => {
    const w = win.current; if (!w) return;
    const read = () => {
      const wr = w.getBoundingClientRect(); const k = wr.width / WW || 1;
      const els = open ? targets.current : [opener.current];
      setBoxes(els.map((el) => {
        if (!el) return { x: 0, y: 0, w: 0, h: 0, r: 0 };
        const r = el.getBoundingClientRect();
        return { x: (r.left - wr.left) / k, y: (r.top - wr.top) / k, w: r.width / k, h: r.height / k, r: (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0) * (r.width / k) / (el.offsetWidth || 1) };
      }));
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(w);
    document.fonts?.ready.then(read);
    return () => ro.disconnect();
  }, [open, m.top, zoom]);
  const to = (i: number) => setFocusAt(wrap(i));
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'steps', title: 'Focus', value: live ? (Math.abs(lean) > 0.3 ? `→ ${stops[wrap(focusAt + Math.sign(lean))]}` : stops[focusAt]) : undefined, how: 'drag the ring to the next one' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Focus', value: stops[focusAt], keys: [{ k: '←→', say: 'move' }, { k: 'esc', say: 'close' }] }),
    start: () => ({ base: 0, at: focusAt }),
    move: (st, dx, dy) => {
      setLive(true);
      const along = dx + dy - st.base;
      if (along > STEP_AT) { st.base += along; st.at = wrap(st.at + 1); to(st.at); setLean(0); }
      else if (along < -STEP_AT) { st.base += along; st.at = wrap(st.at - 1); to(st.at); setLean(0); }
      else setLean(clamp(along / STEP_AT, -1, 1));
    },
    end: () => { setLive(false); setLean(0); },
    step: (d) => to(focusAt + (d > 0 ? 1 : -1)), axis: 'both', over: setOver,
  });
  const onKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; } handle.onKeyDown(e); };
  const at = open ? boxes[focusAt] : boxes[0];
  const leanAt = lean !== 0 && open ? boxes[wrap(focusAt + Math.sign(lean))] : undefined;
  const pad = 2 * K;
  const place = (b: Box) => ({ left: b.x - pad, top: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, borderRadius: b.r + pad });
  const reopen = () => { setOpen(true); setFocusAt(0); replay(); };
  return (
    <>
      <p>While the dialog is open, focus only moves between the things inside it, and never out to the page. Drag the focus ring to move it to the next one; close the dialog and focus goes back to the button that opened it.</p>
      <Well well={well} zoom={zoom}>
        <Win m={m} look={look} open={open} winRef={win}
          place={{ face: <DialogFace m={m} look={look} refs={targets} onPick={to} /> }}>
          {!open && <span ref={opener} className="ed-dlg-opener" style={{ zoom: K }}><Button tabIndex={-1} onClick={reopen}>{m.title}…</Button></span>}
          {leanAt && <span className="ed-dlg-ring is-ghost" style={{ ...place(leanAt), opacity: Math.abs(lean) }} aria-hidden />}
          {at && at.w > 0 && (open
            ? <span ref={ring} className="ed-dlg-ring" data-live={live ? '' : undefined} data-peek={over ? '' : undefined} style={place(at)}
                role="slider" tabIndex={0} aria-label="Focus" aria-valuetext={stops[focusAt]} aria-valuenow={focusAt} aria-valuemin={0} aria-valuemax={n - 1}
                {...handle} onKeyDown={onKeyDown} />
            : <span className="ed-dlg-ring is-rest" style={place(at)} aria-hidden />)}
        </Win>
      </Well>
      <div className="ed-readouts">
        <Readout label="Focus" value={open ? stops[focusAt] : 'the button'} unit="" snap={{ at: focusAt, name: 'a real stop' }}
          peek={setOver} pick={() => (open ? summon(ring.current) : reopen())} scrub={(d) => { if (open) to(focusAt + d); }} />
      </div>
      <div className="ed-layers">
        <Row.Root variant="list" className="ed-layer" data-off={open ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) (open ? setOpen(false) : reopen()); }}>
          <Row.Text>Dialog open</Row.Text>
          <Row.Trail><Switch size="small" aria-label="Dialog open" checked={open} onCheckedChange={(v) => (v ? reopen() : setOpen(false))} /></Row.Trail>
        </Row.Root>
      </div>
    </>
  );
}

/* ───────────────────────── place: how far down it sits ───────────────────────── */

function Place({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const line = React.useRef<SVGPathElement>(null);
  const setTop = (v: number, caught = true) => { const c = clamp(v, 0, 46); set({ top: caught ? snapTo(c, [{ at: TOP, name: 'top' }])[0] : Math.round(c) }); };
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'press', title: 'Distance from the top', value: live ? `${m.top}%` : undefined, how: 'drag the dialog up or down' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Distance from the top', value: `${m.top}%`, keys: [{ k: '↑↓', say: 'move' }] }),
    start: () => m.top, move: (t0, _dx, dy) => { setLive(true); setTop(t0 + (dy / WH) * 100); }, end: () => setLive(false),
    step: (d) => setTop(m.top - d, false), axis: 'y', over: setOver, grab: () => blip(line.current),
  });
  useOnLand(live && m.top === TOP ? 'top' : undefined, () => blip(line.current));
  const y = (WH * m.top) / 100;
  return (
    <>
      <p>The dialog sits near the top of the window, not in the middle: closer to where your eyes already are, with room below for a keyboard. Drag it up or down to change how far down it sits.</p>
      <Well well={well} zoom={zoom}>
        <Win m={m} look={look}
          place={{ props: { ref, className: 'ed-dlg-place ed-dlg-grab', role: 'slider', tabIndex: 0, 'aria-label': 'Distance from the top', 'aria-valuenow': m.top, 'aria-valuemin': 0, 'aria-valuemax': 46, 'data-live': live ? '' : undefined, 'data-peek': over ? '' : undefined, ...handle } as Record<string, unknown>, face: <DialogFace m={m} look={look} /> }}>
          {/* the distance itself: a hairline from the window's top to the dialog's, beside it */}
          <svg className="ed-dlg-measure" data-on={live || over ? '' : undefined} width={6} height={Math.max(y, 1)} style={{ left: DX - 5 }} viewBox={`0 0 6 ${Math.max(y, 1)}`} aria-hidden>
            <path ref={line} d={`M3 0V${y}M1 ${y}H5`} />
          </svg>
        </Win>
      </Well>
      <div className="ed-readouts">
        <Readout label="From the top" value={`${m.top}`} unit="%" snap={m.top === TOP ? { at: TOP, name: 'dialog top' } : undefined} peek={setOver} pick={() => summon(ref.current)} scrub={(d) => setTop(m.top + d, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── shadow: how high it floats ───────────────────────── */

function Shadow({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const setLift = (v: number, caught = true) => { const x = Math.round(clamp(v, 0, 3) * 10) / 10; set({ lift: caught && Math.abs(x - 1) < 0.15 ? 1 : x }); };
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'press', title: 'Height', value: live ? m.lift.toFixed(1) : undefined, how: 'drag up to raise, down to lower' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Height', value: m.lift.toFixed(1), keys: [{ k: '↑↓', say: 'higher' }] }),
    start: () => m.lift, move: (l0, _dx, dy) => { setLive(true); setLift(l0 - dy / 6); }, end: () => setLive(false),
    step: (d) => setLift(m.lift + d * 0.1, false), axis: 'y', over: setOver,
  });
  useOnLand(live && m.lift === 1 ? 'lift' : undefined, () => ref.current?.animate([{ scale: 1 }, { scale: 1.02, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }));
  return (
    <>
      <p>A dialog floats the highest of the large surfaces, and its shadow falls on the dimmed sheet, not on the page. Drag the dialog up to raise it: its shadow grows bigger and softer.</p>
      <Well well={well} zoom={zoom}>
        <Win m={m} look={look}
          place={{ y: -(m.lift - 1) * 3, props: { ref, className: 'ed-dlg-place ed-dlg-grab ed-dlg-lift', role: 'slider', tabIndex: 0, 'aria-label': 'Height', 'aria-valuenow': m.lift, 'aria-valuemin': 0, 'aria-valuemax': 3, 'data-live': live ? '' : undefined, 'data-peek': over ? '' : undefined, ...handle } as Record<string, unknown>, face: <DialogFace m={m} look={look} /> }} />
      </Well>
      <div className="ed-readouts">
        <Readout label="Height" value={m.lift.toFixed(1)} unit="" snap={m.lift === 1 ? { at: 1, name: 'plate shadows' } : undefined} peek={setOver} pick={() => summon(ref.current)} scrub={(d) => setLift(m.lift + d * 0.1, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── layers ───────────────────────── */

function Layers({ m, set, look, layers, focus }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const toggle = (i: number, v: boolean) => set({ on: m.on.map((x, j) => (j === i ? v : x)) });
  return (
    <>
      <p>The dialog is a plate with {layers.length} layers, the same stuff as a card lifted off the page. Turn a layer off to see what it adds.</p>
      <Well well={well} zoom={zoom}><Win m={m} look={look} place={{ face: <DialogFace m={m} look={look} /> }} /></Well>
      <div className="ed-layers">
        {layers.map((l, i) => (
          <Row.Root key={l.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''}
            onPointerEnter={() => focus(l.name)} onPointerLeave={() => focus(null)}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
            <Row.Text>{l.name}</Row.Text>
            <Row.Trail><Switch size="small" aria-label={l.name} checked={m.on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(l.name)} onBlur={() => focus(null)} /></Row.Trail>
          </Row.Root>
        ))}
      </div>
    </>
  );
}

export function DialogSpecimenCard(props: Props) {
  const body = (() => {
    switch (props.spot) {
      case 'surface': return <Sheet {...props} />;
      case 'states': return <Opening {...props} />;
      case 'press': return <Focus {...props} />;
      case 'shape': return <Place {...props} />;
      case 'shadow': return <Shadow {...props} />;
      case 'layers': return <Layers {...props} />;
    }
  })();
  return <>{body}<Real real={props.real} setReal={props.setReal} /></>;
}
