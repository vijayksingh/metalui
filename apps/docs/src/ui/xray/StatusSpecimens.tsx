import * as React from 'react';
import { Led, Row, StatusBadge, Switch, type LedKind } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import type { LayerDef } from './kit';
import type { Model, Spot } from './StatusXray';
import { STEP_AT, Outline, Readout, blip, clamp, snapTo, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg, type Snap } from '../edit';
import './status-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE STATUS BADGE'S SPECIMENS · the x-ray card for each part
 *
 *   states   drag the badge sideways: it leans toward the next state, then snaps
 *   lamp     a sun on an arc above the lamp: around turns the bright spot, nearer
 *            pulls it toward the middle
 *   glow     a switch (every lit state has one)
 *   type     drag the words: sideways for spacing, up or down for size
 *   shape    top edge for the height, right end for the space on the ends, the lamp's
 *            own ring for its size. The badge is always a pill: no corner handle.
 *   layers   a row with a switch per layer
 *
 *   Every number is read from the status recipe in tokens.json (never from StatusXray,
 *   which imports this file).
 * ───────────────────────────────────────────────────────── */

const R = tokens.recipes.status as { props: { lamp: { size: number; 'size-small': number }; badge: { height: number; pad: number; gap: number; font: string; tracking: string } }; layers: { part: string; prop: string; value: string; state?: string }[] };
const P = R.props;
const FONT = Number(P.badge.font.match(/([\d.]+)px/)![1]);
const TRACK = parseFloat(P.badge.tracking);
const LIVE_FILL = R.layers.find((l) => l.part === 'lamp' && l.prop === 'background' && !l.state)!.value;
const [SPOT_X, SPOT_Y] = LIVE_FILL.match(/at ([\d.]+)% ([\d.]+)%/)!.slice(1).map(Number);
/** The real states, in the order the recipe lists their lamps. */
const KINDS: LedKind[] = ['live', 'waiting', 'failed', 'link', 'off'];
const SAY: Record<LedKind, string> = { live: 'live', waiting: 'waiting', failed: 'failed', link: 'linked', off: 'off' };

type Parts = { badgeBg: string; badgeSh: string; lampBg: string; lampSh: string };
type Props = {
  spot: Spot; m: Model; set: (p: Partial<Model>) => void; focus: (name: string | null) => void;
  words: Record<LedKind, string>; badgeLayers: LayerDef[]; lampLayers: LayerDef[]; parts: Parts;
};

const round = (v: number, k = 10) => Math.round(v * k) / k;
const on = (v: number, at: number, name = 'token'): Snap | undefined => (v === at ? { at, name } : undefined);
const reduced = () => document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
/** A small pulse on something that is not a stroke (the lamp, the sun) when a value lands. */
const pulse = (el: Element | null | undefined, k = 1.5) => { if (el && !reduced()) el.animate([{ scale: 1 }, { scale: k, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }); };

/**
 * The real StatusBadge, its recipe variables set from the model, so the specimen and the
 * bench draw the same values. Nothing on it animates: a tunable follows the finger exactly.
 */
function Badge({ m, parts, words, children }: { m: Model; parts: Parts; words: Record<LedKind, string>; children?: React.ReactNode }) {
  const style = {
    '--mu-r-status-badge-height': `${m.h}px`,
    '--mu-r-status-badge-pad': `${m.pad}px`,
    '--ed-status-lamp-size': `${m.led}px`,
    '--mu-r-status-badge-font': `500 ${m.size}px/1 var(--mu-sans)`,
    '--mu-r-status-badge-tracking': `${m.track}em`,
    '--mu-r-status-badge-background': parts.badgeBg,
    '--mu-r-status-badge-shadow': parts.badgeSh,
    '--ed-status-lamp-bg': parts.lampBg,
    '--ed-status-lamp-shadow': parts.lampSh,
    transition: 'none',
  } as React.CSSProperties;
  return <StatusBadge gesture="steady" led={m.kind} className="ed-status-badge" style={style}>{children ?? words[m.kind]}</StatusBadge>;
}

/* ───────────────────────── states ───────────────────────── */

function States({ m, set, parts, words }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [held, setHeld] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const [lean, setLean] = React.useState<LedKind | null>(null);
  const el = React.useRef<HTMLSpanElement>(null);
  const index = KINDS.indexOf(m.kind);
  const choose = (i: number) => { const next = KINDS[clamp(i, 0, KINDS.length - 1)]; if (next !== m.kind) set({ kind: next }); };
  useOnLand(m.kind, () => pulse(el.current?.querySelector('.mu-led'), 1.6));
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'steps', title: 'State', value: held ? (lean ? `→ ${SAY[lean]}` : SAY[m.kind]) : undefined, how: 'drag sideways for the next state' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'State', value: SAY[m.kind], keys: [{ k: '←→', say: 'step' }] }),
    start: () => { setHeld(true); return { index, at: 0 }; },
    move: (s, dx) => {
      const travel = dx - s.at, d = Math.sign(travel), next = KINDS[s.index + d];
      if (next && Math.abs(travel) >= STEP_AT) { choose(s.index + d); s.index += d; s.at = dx; setLean(null); }
      else setLean(next && Math.abs(travel) > 2 ? next : null);
    },
    end: () => { setHeld(false); setLean(null); },
    step: (d) => choose(index + Math.sign(d)), axis: 'x', over: setPeek, grab: () => blip(el.current),
  });
  return (
    <>
      <p>The lamp's colour tells you the state: green is working, amber is waiting, red has failed, blue is linked and grey is off. The words always say it too, so colour is never alone. Drag the badge sideways to step through the states.</p>
      <div ref={well} className="ed-specimen">
        <div className="ed-status-states" style={{ zoom }} data-hint-anchor>
          <span ref={el} className="ed-status-grab" data-peek={peek || held ? '' : undefined} role="slider" tabIndex={0} aria-label="State" aria-valuetext={SAY[m.kind]} aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={KINDS.length} {...handle}>
            <Badge m={m} parts={parts} words={words} />
            {lean && <i className="ed-status-lean" aria-hidden />}
          </span>
          {/* the five real states, in order: the one it is ringed, the one it leans to lit */}
          <span className="ed-status-pips" aria-hidden>
            {KINDS.map((k) => <span key={k} data-at={k === m.kind ? '' : undefined} data-lean={k === lean ? '' : undefined}><Led kind={k} size="small" /></span>)}
          </span>
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="State" value={SAY[m.kind]} unit="" snap={{ at: index, name: m.kind }} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => choose(index + d)} />
      </div>
    </>
  );
}

/* ───────────────────────── lamp ───────────────────────── */

/** The bright spot's distance from the middle, at the recipe's own spot. */
const OFF0 = Math.hypot(SPOT_X - 50, SPOT_Y - 50);
const ORBIT = 22; // the sun's arc around the lamp, in the badge's own units
// the arc stops short of the words on the right, so the sun never sits on them
const DEG_MIN = -90, DEG_MAX = 30;

function Lamp({ m, set, parts, words }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const sunEl = React.useRef<HTMLSpanElement>(null);
  // around the lamp turns the spot; further out pushes it toward the edge, nearer toward the middle
  const reach = (off: number) => ORBIT * (0.65 + (0.35 * off) / OFF0);
  const offX = m.spotX - 50, offY = m.spotY - 50;
  const deg = (Math.atan2(offX, -offY) * 180) / Math.PI;
  const r = reach(Math.hypot(offX, offY));
  const sun = { x: Math.sin((deg * Math.PI) / 180) * r, y: -Math.cos((deg * Math.PI) / 180) * r };
  const setSpot = (x: number, y: number, caught = true) => {
    const a = (clamp((Math.atan2(x, -y) * 180) / Math.PI, DEG_MIN, DEG_MAX) * Math.PI) / 180;
    const off = clamp(((Math.hypot(x, y) / ORBIT - 0.65) / 0.35) * OFF0, 0, OFF0 * 2);
    let sx = Math.round(clamp(50 + Math.sin(a) * off, 10, 90)), sy = Math.round(clamp(50 - Math.cos(a) * off, 10, 90));
    if (caught && Math.abs(sx - SPOT_X) <= 3 && Math.abs(sy - SPOT_Y) <= 3) { sx = SPOT_X; sy = SPOT_Y; }
    set({ spotX: sx, spotY: sy });
  };
  const home = m.spotX === SPOT_X && m.spotY === SPOT_Y;
  useOnLand(live && home ? 'home' : undefined, () => pulse(sunEl.current, 1.6));
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Bright spot', value: live ? `${m.spotX}% · ${m.spotY}%` : undefined, how: 'drag around the lamp, nearer to centre it' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Bright spot', value: `${m.spotX}% · ${m.spotY}%`, keys: [{ k: '←→', say: 'across' }, { k: '↑↓', say: 'down' }] }),
    start: () => ({ ...sun }), move: (s, dx, dy) => { setLive(true); setSpot(s.x + dx, s.y + dy); }, end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ spotY: clamp(m.spotY - d, 10, 90) }) : set({ spotX: clamp(m.spotX + d, 10, 90) })), axis: 'both',
    over: setPeek,
  });
  const arc = (rr: number, cls?: string) => {
    const p = (dd: number) => `${(Math.sin((dd * Math.PI) / 180) * rr).toFixed(2)} ${(-Math.cos((dd * Math.PI) / 180) * rr).toFixed(2)}`;
    return <path className={cls} d={`M${p(DEG_MIN)}A${rr} ${rr} 0 0 1 ${p(DEG_MAX)}`} />;
  };
  const big = reach(OFF0 * 2);
  return (
    <>
      <p>The lamp is a tiny glass ball, {P.lamp.size} pt wide. Its brightest spot sits up and to the left, where the light comes from. Drag the sun around the lamp to move the spot, and see how it stops looking like a ball.</p>
      <div ref={well} className="ed-specimen">
        {/* the box reaches up to the arc's top, so the hint tag rides above the sun, never on it */}
        <div className="ed-status-light" data-lit={live || peek ? '' : undefined} style={{ zoom, paddingTop: Math.ceil(big - m.h / 2 + 5) }} data-hint-anchor>
          <Badge m={m} parts={parts} words={words} />
          <span className="ed-status-orbit" style={{ left: m.pad + m.led / 2, top: `calc(100% - ${m.h / 2}px)` }}>
            <svg className="ed-orbit" width={big * 2 + 2} height={big * 2 + 2} viewBox={`${-big - 1} ${-big - 1} ${big * 2 + 2} ${big * 2 + 2}`} style={{ left: -big - 1, top: -big - 1 }} aria-hidden>
              {arc(reach(OFF0))}
              {arc(reach(0), 'is-near')}
            </svg>
            <span ref={sunEl} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Bright spot" aria-valuetext={`${m.spotX} percent across, ${m.spotY} percent down`} aria-valuenow={m.spotX} aria-valuemin={10} aria-valuemax={90} {...handle} />
          </span>
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="Spot across" value={`${m.spotX}`} unit="%" snap={on(m.spotX, SPOT_X)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ spotX: clamp(m.spotX + d, 10, 90) })} />
        <Readout label="Spot down" value={`${m.spotY}`} unit="%" snap={on(m.spotY, SPOT_Y)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ spotY: clamp(m.spotY + d, 10, 90) })} />
      </div>
    </>
  );
}

/* ───────────────────────── glow ───────────────────────── */

function Glow({ m, set, parts, words }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const index = KINDS.indexOf(m.kind);
  // only the green lamp has a glow in the recipe: on any other state the switch has nothing to turn on
  const has = m.kind === 'live';
  return (
    <>
      <p>A lamp that is on gives off a little light, so the green lamp has a soft glow in its own colour. That is how you tell a lit lamp from a green dot. {has ? 'Turn the glow off to see the difference.' : 'Only the green lamp glows; step the state back to live to see it.'}</p>
      <div ref={well} className="ed-specimen"><div style={{ zoom }}><Badge m={m} parts={parts} words={words} /></div></div>
      <div className="ed-readouts">
        <Readout label="State" value={SAY[m.kind]} unit="" snap={{ at: index, name: m.kind }} pick={() => set({ kind: KINDS[(index + 1) % KINDS.length] })} scrub={(d) => set({ kind: KINDS[clamp(index + d, 0, KINDS.length - 1)] })} />
      </div>
      <div className="ed-layers" style={{ marginTop: 8 }}>
        <Row.Root variant="list" className="ed-layer" data-off={m.glow && has ? undefined : ''} onClick={(e) => { if (has && !(e.target as HTMLElement).closest('.mu-switch')) set({ glow: !m.glow }); }}>
          <Row.Text>Glow</Row.Text>
          <Row.Trail><Switch size="small" aria-label="Glow" checked={m.glow && has} disabled={!has} onCheckedChange={(glow) => set({ glow })} /></Row.Trail>
        </Row.Root>
      </div>
    </>
  );
}

/* ───────────────────────── type ───────────────────────── */

function Type({ m, set, parts, words }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState<null | 'size' | 'track'>(null);
  const [over, setOver] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const label = React.useRef<HTMLSpanElement>(null);
  const setSize = (v: number, caught = true) => { const x = Math.round(clamp(v, 7, 14) * 2) / 2; set({ size: caught && Math.abs(x - FONT) <= 0.3 ? FONT : x }); };
  const setTrack = (v: number, caught = true) => { const x = round(clamp(v, 0, 0.3), 100); set({ track: caught && Math.abs(x - TRACK) <= 0.012 ? TRACK : x }); };
  useOnLand(live === 'size' && m.size === FONT ? 'size' : live === 'track' && m.track === TRACK ? 'track' : undefined, () => pulse(label.current, 1.06));
  const handle = useHandle({
    zoom,
    hint: () => live === 'size' ? { gesture: 'type', title: 'Letter size', value: `${m.size}pt` }
      : live === 'track' ? { gesture: 'type', title: 'Letter spacing', value: `${m.track.toFixed(2)}em` }
      : { gesture: 'type', title: 'Words', how: 'drag sideways for spacing, up or down for size' },
    keyHint: (): Hint => ({ gesture: 'type', title: 'Words', value: `${m.size}pt · ${m.track.toFixed(2)}em`, keys: [{ k: '←→', say: 'spacing' }, { k: '↑↓', say: 'size' }] }),
    start: () => ({ axis: '' as '' | 'x' | 'y', size: m.size, track: m.track }),
    move: (st, dx, dy) => {
      if (!st.axis && Math.abs(dx) + Math.abs(dy) > 1.2) st.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (st.axis === 'x') { setLive('track'); setTrack(st.track + dx * 0.004); }
      if (st.axis === 'y') { setLive('size'); setSize(st.size - dy / 3); }
    },
    end: () => setLive(null),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? setSize(m.size + d * 0.5) : setTrack(m.track + d * 0.01)), axis: 'both',
    over: setOver,
  });
  return (
    <>
      <p>The words are small mono capitals, spaced out, as if stamped into the badge like the labels on a machine. Drag the words sideways to change the space between letters, or up and down to change their size.</p>
      <div ref={well} className="ed-specimen">
        <div className="ed-typebox" data-show={over || live || peek ? 'label' : undefined} data-live={live ?? undefined} style={{ zoom }} data-hint-anchor>
          <Badge m={m} parts={parts} words={words}>
            <span ref={label} className="ed-type-label" role="slider" tabIndex={0} aria-label="Letter size and spacing" aria-valuetext={`${m.size} points, spacing ${m.track} em`} aria-valuenow={m.size} aria-valuemin={7} aria-valuemax={14} {...handle}>{words[m.kind]}</span>
          </Badge>
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="Letter size" value={`${m.size}`} snap={on(m.size, FONT)} peek={setPeek} pick={() => summon(label.current)} scrub={(d) => setSize(m.size + d * 0.5, false)} />
        <Readout label="Letter spacing" value={m.track.toFixed(2)} unit="em" snap={on(m.track, TRACK)} peek={setPeek} pick={() => summon(label.current)} scrub={(d) => setTrack(m.track + d * 0.01, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── shape ───────────────────────── */

type ShapeName = 'height' | 'ends' | 'lamp';
const H_SNAPS: Snap[] = [{ at: P.badge.height, name: 'badge height' }];
const PAD_SNAPS: Snap[] = [{ at: P.badge.pad, name: 'badge padding' }];
const LED_SNAPS: Snap[] = [{ at: P.lamp.size, name: 'lamp' }, { at: P.lamp['size-small'], name: 'small lamp' }];

function Shape({ m, set, parts, words }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const box = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const read = () => setW(el.offsetWidth); read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const handles = React.useRef<Partial<Record<ShapeName, HTMLSpanElement | null>>>({});
  const [live, setLive] = React.useState<ShapeName | null>(null);
  const [over, setOver] = React.useState<ShapeName | null>(null);
  const [peek, setPeek] = React.useState<ShapeName | null>(null);
  const setH = (v: number, caught = true) => set({ h: caught ? snapTo(clamp(v, 18, 40), H_SNAPS)[0] : Math.round(clamp(v, 18, 40)) });
  const setPad = (v: number, caught = true) => set({ pad: caught ? snapTo(clamp(v, 4, 20), PAD_SNAPS)[0] : Math.round(clamp(v, 4, 20)) });
  const setLed = (v: number, caught = true) => { const x = Math.round(clamp(v, 3, 10) * 2) / 2; set({ led: caught ? (LED_SNAPS.find((s) => Math.abs(s.at - x) <= 0.3)?.at ?? x) : x }); };
  const hSnap = H_SNAPS.find((s) => s.at === m.h), padSnap = PAD_SNAPS.find((s) => s.at === m.pad), ledSnap = LED_SNAPS.find((s) => s.at === m.led);
  useOnLand(live === 'height' ? hSnap?.name : undefined, () => blip(segs.current.top, segs.current.bottom));
  useOnLand(live === 'ends' ? padSnap?.name : undefined, () => blip(segs.current.left, segs.current.right));
  useOnLand(live === 'lamp' ? ledSnap?.name : undefined, () => pulse(handles.current.lamp, 1.3));
  const hover = (n: ShapeName) => (yes: boolean) => setOver((o) => (yes ? n : o === n ? null : o));
  const height = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Height', value: live === 'height' ? `${m.h}pt` : undefined, how: 'drag the top edge up to make it taller' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Height', value: `${m.h}pt`, keys: [{ k: '↑↓', say: 'taller' }] }),
    start: () => m.h, move: (h0, _dx, dy) => { setLive('height'); setH(h0 - dy * 2); }, end: () => setLive(null),
    step: (d) => setH(m.h + d), axis: 'y', over: hover('height'), grab: () => blip(segs.current.top),
  });
  const ends = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Space on the ends', value: live === 'ends' ? `${m.pad}pt` : undefined, how: 'drag the right end out for more space' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Space on the ends', value: `${m.pad}pt`, keys: [{ k: '←→', say: 'wider' }, { k: '⇧', say: '×4' }] }),
    start: () => m.pad, move: (p0, dx) => { setLive('ends'); setPad(p0 + dx); }, end: () => setLive(null),
    step: (d) => setPad(m.pad + d), axis: 'x', over: hover('ends'), grab: () => blip(segs.current.right),
  });
  const lamp = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Lamp size', value: live === 'lamp' ? `${m.led}pt` : undefined, how: 'drag the lamp up or right to make it bigger' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Lamp size', value: `${m.led}pt`, keys: [{ k: '↑↓', say: 'bigger' }] }),
    start: () => m.led, move: (l0, dx, dy) => { setLive('lamp'); setLed(l0 + (dx - dy) / 4); }, end: () => setLive(null),
    step: (d) => setLed(m.led + d * 0.5), axis: 'both', over: hover('lamp'), grab: () => pulse(handles.current.lamp, 1.3),
  });
  const pointed = over ?? live ?? peek;
  const segOf: Record<ShapeName, Seg[]> = { height: ['top'], ends: ['right'], lamp: [] };
  const holding: Seg[] = live === 'height' ? ['top', 'bottom'] : live === 'ends' ? ['left', 'right'] : [];
  const shown: Seg[] = pointed ? (holding.length ? holding : segOf[pointed]) : ['top', 'right'];
  const lampShown = !pointed || pointed === 'lamp';
  const ring = m.led + 5;
  return (
    <>
      <p>A raised pill, {P.badge.height} pt tall, with the same space on both ends. It looks like a button but you cannot press it. Drag the top edge to change its height, the right end to change the space on the ends, or the lamp to change its size.</p>
      <div ref={well} className="ed-specimen">
        <div style={{ zoom }}>
          <div ref={box} className="ed-box ed-status-box" data-live={live ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')} data-hint-anchor>
            <Badge m={m} parts={parts} words={words} />
            <div className="ed-overlay">
              <Outline W={W} h={m.h} r={m.h / 2} on={pointed ? (holding.length ? holding : segOf[pointed]) : []} only={shown} segs={segs} />
              <span ref={(el) => { handles.current.height = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Height" aria-valuenow={m.h} aria-valuemin={18} aria-valuemax={40} {...height} />
              <span ref={(el) => { handles.current.ends = el; }} className="ed-edge is-x" style={{ right: -3 }} role="slider" tabIndex={0} aria-label="Space on the ends" aria-valuenow={m.pad} aria-valuemin={4} aria-valuemax={20} {...ends} />
              <span ref={(el) => { handles.current.lamp = el; }} className="ed-status-lamp" data-away={lampShown ? undefined : ''} data-on={pointed === 'lamp' ? '' : undefined}
                style={{ left: m.pad + m.led / 2 - ring / 2, top: m.h / 2 - ring / 2, width: ring, height: ring }}
                role="slider" tabIndex={0} aria-label="Lamp size" aria-valuenow={m.led} aria-valuemin={3} aria-valuemax={10} {...lamp} />
            </div>
          </div>
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="Height" value={`${m.h}`} snap={hSnap} peek={(y) => setPeek(y ? 'height' : null)} pick={() => summon(handles.current.height ?? null)} scrub={(d) => setH(m.h + d, false)} />
        <Readout label="Space on the ends" value={`${m.pad}`} snap={padSnap} peek={(y) => setPeek(y ? 'ends' : null)} pick={() => summon(handles.current.ends ?? null)} scrub={(d) => setPad(m.pad + d, false)} />
        <Readout label="Lamp size" value={`${m.led}`} snap={ledSnap} peek={(y) => setPeek(y ? 'lamp' : null)} pick={() => summon(handles.current.lamp ?? null)} scrub={(d) => setLed(m.led + d * 0.5, false)} />
      </div>
    </>
  );
}

/* ───────────────────────── layers ───────────────────────── */

function Layers({ m, set, focus, parts, words, badgeLayers, lampLayers }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const groups = [['badge', badgeLayers], ['lamp', lampLayers]] as const;
  const toggle = (g: 'badge' | 'lamp', i: number, v: boolean) => set({ [g]: m[g].map((x, j) => (j === i ? v : x)) });
  return (
    <>
      <p>Two parts: the badge is {badgeLayers.length} layers and the lamp is {lampLayers.length}. Turn a layer off to see what it adds.</p>
      <div ref={well} className="ed-specimen"><div style={{ zoom }}><Badge m={m} parts={parts} words={words} /></div></div>
      <div className="ed-layers">
        {groups.flatMap(([g, list]) => list.map((l, i) => {
          // the lamp's rim and the badge's rim share a name: say whose it is
          const name = list.filter((x) => x.name === l.name).length === 1 && [...badgeLayers, ...lampLayers].filter((x) => x.name === l.name).length > 1 ? `${g === 'badge' ? 'Badge' : 'Lamp'} ${l.name.toLowerCase()}` : l.name;
          return (
            <Row.Root key={`${g}-${l.name}`} variant="list" className="ed-layer" data-off={m[g][i] ? undefined : ''}
              onPointerEnter={() => focus(l.name)} onPointerLeave={() => focus(null)}
              onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(g, i, !m[g][i]); }}>
              <Row.Text>{name}</Row.Text>
              <Row.Trail><Switch size="small" aria-label={name} checked={m[g][i]} onCheckedChange={(v) => toggle(g, i, v)} onFocus={() => focus(l.name)} onBlur={() => focus(null)} /></Row.Trail>
            </Row.Root>
          );
        }))}
      </div>
    </>
  );
}

/** The card for a part of the status badge's x-ray. */
export function StatusSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'states': return <States {...props} />;
    case 'light': return <Lamp {...props} />;
    case 'shadow': return <Glow {...props} />;
    case 'type': return <Type {...props} />;
    case 'shape': return <Shape {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
