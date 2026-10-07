import * as React from 'react';
import { Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { KNOB_LAYERS, MAX, MIN, SHINE_FROM, SliderObject, TRACK_LAYERS, WIDTH, fraction, type Look, type Model, type Spot } from './SliderXray';
import { Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg } from '../edit';
import './slider-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE SLIDER'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the real slider, set to the x-ray's config; the model on the bench reads the same.
 *     knob     the knob itself: drag it sideways to turn the shine of its metal
 *     track    the groove's bottom edge: drag it down to make the groove deeper
 *     move     the knob still moves the value (a click jumps on the spring, a drag follows);
 *              its top rim sets the spring's stiffness, its bottom rim the damping
 *     marks    switches for the marks in the track and the labelled ticks under it
 *     light    a sun on an arc above the slider: around turns it, nearer strengthens it
 *     layers   a row with a switch per layer
 *   The slider has no sizes, kinds or states to step through, so nothing here steps.
 * ───────────────────────────────────────────────────────── */

type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void; look: Look };

// one source per fact: the recipe's numbers (SliderXray's constants are read only inside the components)
const RP = tokens.recipes.slider.props as { regular: { track: number; knob: number } };
const K = RP.regular.knob;
const TH = RP.regular.track;
const PART = tokens.springs.part as { stiffness: number; damping: number };

const round = (v: number) => Math.round(v * 10) / 10;
const token = (v: number, at: number) => (v === at ? { at, name: 'token' } : undefined);

/** The real slider, as the bench and the table show it: the config's own marks, ticks and variables. */
function Real({ m, set }: { m: Model; set: Props['set'] }) {
  return <SliderObject config={m} onValueChange={(value) => set({ value })} />;
}

function Well({ well, zoom, light = false, children }: { well: React.RefObject<HTMLDivElement | null>; zoom: number; light?: boolean; children: React.ReactNode }) {
  return <div ref={well} className={`ed-specimen${light ? ' is-light' : ''}`}><div style={{ zoom }}>{children}</div></div>;
}

/** Where the knob sits on the specimen: a box over it that rides the knob's own spring. The knob's
 *  centre travels half a knob in from each end of the control, which is the slider's top row. */
function KnobSpot({ m, children }: { m: Model; children: React.ReactNode }) {
  return <span className="ed-slider-knob" style={{ ['--mu-slider-at' as string]: fraction(m.value), left: `calc(var(--mu-slider-at) * (100% - ${K}px))`, top: 0, width: K, height: K }}>{children}</span>;
}

/** Knob: the knob is the handle; sideways turns the bands of its metal. */
function KnobCard({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const ring = React.useRef<SVGCircleElement>(null);
  const shine = (v: number, caught = true) => { const n = Math.round(clamp(v, -180, 180)); set({ shine: caught && Math.abs(n) <= 6 ? 0 : n }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Shine', value: live ? `${SHINE_FROM + m.shine}°` : undefined, how: 'drag sideways to turn it' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Shine', value: `${SHINE_FROM + m.shine}°`, keys: [{ k: '←→', say: 'turn' }, { k: '⇧', say: 'faster' }] }),
    start: () => m.shine, move: (s0, dx) => { setLive(true); shine(s0 + dx * 3); }, end: () => setLive(false),
    step: (d) => shine(m.shine + d * 5, false), axis: 'x', over: setPeek, grab: () => blip(ring.current),
  });
  useOnLand(live && m.shine === 0 ? 'shine' : undefined, () => blip(ring.current));
  return <>
    <p>The knob is a small metal disc whose light and dark bands turn around its centre. Drag the knob sideways to turn the shine.</p>
    <Well well={well} zoom={zoom}>
      <div className="ed-box ed-slider" data-hint-anchor data-live={live ? 'shine' : undefined} data-peek={peek ? '' : undefined} style={look.style}>
        <Real m={m} set={set} />
        <div className="ed-overlay">
          <KnobSpot m={m}>
            <svg className="ed-slider-ring" width={K} height={K} viewBox={`0 0 ${K} ${K}`} aria-hidden><circle ref={ring} cx={K / 2} cy={K / 2} r={K / 2 - 1.6} data-on={live || peek ? '' : undefined} /></svg>
            <span ref={ref} className="ed-slider-turn" role="slider" tabIndex={0} aria-label="Shine" aria-valuetext={`${SHINE_FROM + m.shine} degrees`} aria-valuenow={SHINE_FROM + m.shine} aria-valuemin={SHINE_FROM - 180} aria-valuemax={SHINE_FROM + 180} {...handle} />
          </KnobSpot>
        </div>
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Shine" value={`${SHINE_FROM + m.shine}`} unit="°" snap={token(m.shine, 0)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => shine(m.shine + d * 5, false)} />
    </div>
  </>;
}

/** Track: the groove's bottom edge; down makes it deeper (its inner shadow darker). */
function TrackCard({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const depth = (v: number, caught = true) => { const n = round(clamp(v, 0, 3)); set({ depth: caught && Math.abs(n - 1) < 0.15 ? 1 : n }); };
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Depth', value: live ? m.depth.toFixed(1) : undefined, how: 'drag down to deepen it' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Depth', value: m.depth.toFixed(1), keys: [{ k: '↑↓', say: 'change' }, { k: '⇧', say: 'faster' }] }),
    start: () => m.depth, move: (d0, _dx, dy) => { setLive(true); depth(d0 + dy / 8); }, end: () => setLive(false),
    step: (d) => depth(m.depth - d * 0.1, false), axis: 'y', over: setPeek, grab: () => blip(segs.current.bottom),
  });
  useOnLand(live && m.depth === 1 ? 'depth' : undefined, () => blip(segs.current.bottom));
  return <>
    <p>The track is a long thin groove pressed into the page, with the knob standing in it. Drag its bottom edge down to make it deeper.</p>
    <Well well={well} zoom={zoom}>
      <div className="ed-box ed-slider is-groove" data-hint-anchor data-live={live ? 'depth' : undefined} data-peek={peek ? '' : undefined} style={look.style}>
        <Real m={m} set={set} />
        <div className="ed-overlay">
          <div className="ed-slider-groove" style={{ top: (K - TH) / 2, width: WIDTH, height: TH }}>
            <Outline W={WIDTH} h={TH} r={TH / 2} on={live || peek ? ['bottom'] : []} only={['bottom']} segs={segs} />
            <span ref={ref} className="ed-edge is-y" style={{ bottom: -3 }} role="slider" tabIndex={0} aria-label="Depth" aria-valuenow={m.depth} aria-valuemin={0} aria-valuemax={3} {...handle} />
          </div>
        </div>
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Depth" value={m.depth === 0 ? 'flat' : m.depth.toFixed(1)} unit="" snap={token(m.depth, 1)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => depth(m.depth + d * 0.1, false)} />
    </div>
  </>;
}

/** Move: the knob still moves the value; its top rim sets the stiffness, its bottom rim the damping. */
function MoveCard({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState<null | 'stiffness' | 'damping'>(null);
  const [peek, setPeek] = React.useState<null | 'stiffness' | 'damping'>(null);
  const els = React.useRef<Partial<Record<'stiffness' | 'damping', HTMLSpanElement | null>>>({});
  const arcs = React.useRef<Partial<Record<'stiffness' | 'damping', SVGPathElement | null>>>({});
  const stiffness = (v: number, caught = true) => { const n = clamp(Math.round(v / 10) * 10, 60, 600); set({ k: caught && Math.abs(n - PART.stiffness) <= 10 ? PART.stiffness : n }); };
  const damping = (v: number, caught = true) => { const n = clamp(Math.round(v), 6, 50); set({ c: caught && Math.abs(n - PART.damping) <= 1 ? PART.damping : n }); };
  const over = (name: 'stiffness' | 'damping') => (on: boolean) => setPeek((p) => (on ? name : p === name ? null : p));
  const top = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Stiffness', value: live === 'stiffness' ? `${m.k}` : undefined, how: 'drag right for firmer' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Stiffness', value: `${m.k}`, keys: [{ k: '←→', say: 'change' }, { k: '⇧', say: 'faster' }] }),
    start: () => m.k, move: (k0, dx) => { setLive('stiffness'); stiffness(k0 + dx * 3); }, end: () => setLive(null),
    step: (d) => stiffness(m.k + d * 10, false), axis: 'x', over: over('stiffness'), grab: () => blip(arcs.current.stiffness),
  });
  const bottom = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Damping', value: live === 'damping' ? `${m.c}` : undefined, how: 'drag down for calmer' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Damping', value: `${m.c}`, keys: [{ k: '↑↓', say: 'change' }, { k: '⇧', say: 'faster' }] }),
    start: () => m.c, move: (c0, _dx, dy) => { setLive('damping'); damping(c0 + dy / 2); }, end: () => setLive(null),
    step: (d) => damping(m.c - d, false), axis: 'y', over: over('damping'), grab: () => blip(arcs.current.damping),
  });
  useOnLand(live === 'stiffness' && m.k === PART.stiffness ? 'k' : undefined, () => blip(arcs.current.stiffness));
  useOnLand(live === 'damping' && m.c === PART.damping ? 'c' : undefined, () => blip(arcs.current.damping));
  // the knob's own rim, split in two: the top quarter-arc and the bottom one, just inside its edge
  const c = K / 2, r = K / 2 - 1.6;
  const pt = (deg: number) => `${(c + r * Math.cos((deg * Math.PI) / 180)).toFixed(2)} ${(c + r * Math.sin((deg * Math.PI) / 180)).toFixed(2)}`;
  const shown = (name: 'stiffness' | 'damping') => (live ?? peek) === null || (live ?? peek) === name;
  return <>
    <p>Click the track and the knob jumps there on a spring; drag the knob and it follows your finger exactly. Drag the knob's top rim sideways to make the spring firmer, or its bottom rim down to make it settle more calmly.</p>
    <Well well={well} zoom={zoom}>
      <div className="ed-box ed-slider" data-hint-anchor data-live={live ?? undefined} data-peek={peek ?? undefined} style={look.style}>
        <Real m={m} set={set} />
        <div className="ed-overlay">
          <KnobSpot m={m}>
            <svg className="ed-slider-ring" width={K} height={K} viewBox={`0 0 ${K} ${K}`} aria-hidden>
              <path ref={(el) => { arcs.current.stiffness = el; }} className="is-heavy" d={`M${pt(-150)}A${r} ${r} 0 0 1 ${pt(-30)}`} data-on={live === 'stiffness' || peek === 'stiffness' ? '' : undefined} data-away={shown('stiffness') ? undefined : ''} />
              <path ref={(el) => { arcs.current.damping = el; }} d={`M${pt(30)}A${r} ${r} 0 0 1 ${pt(150)}`} data-on={live === 'damping' || peek === 'damping' ? '' : undefined} data-away={shown('damping') ? undefined : ''} />
            </svg>
            <span ref={(el) => { els.current.stiffness = el; }} className="ed-slider-rim is-top" role="slider" tabIndex={0} aria-label="Stiffness" aria-valuenow={m.k} aria-valuemin={60} aria-valuemax={600} {...top} />
            <span ref={(el) => { els.current.damping = el; }} className="ed-slider-rim is-bottom" role="slider" tabIndex={0} aria-label="Damping" aria-valuenow={m.c} aria-valuemin={6} aria-valuemax={50} {...bottom} />
          </KnobSpot>
        </div>
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="Value" value={`${m.value}`} unit="" scrub={(d) => set({ value: clamp(Math.round(m.value / 10 + d) * 10, MIN, MAX) })} />
      <Readout label="Stiffness" value={`${m.k}`} unit="" snap={token(m.k, PART.stiffness)} peek={over('stiffness')} pick={() => summon(els.current.stiffness ?? null)} scrub={(d) => stiffness(m.k + d * 10, false)} />
      <Readout label="Damping" value={`${m.c}`} unit="" snap={token(m.c, PART.damping)} peek={over('damping')} pick={() => summon(els.current.damping ?? null)} scrub={(d) => damping(m.c + d, false)} />
    </div>
  </>;
}

/** Marks: two things the slider can show or not, so two switches. */
function MarksCard({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const rows: [keyof Pick<Model, 'marks' | 'ticks'>, string][] = [['marks', 'Marks in the track'], ['ticks', 'Ticks and labels']];
  return <>
    <p>Short marks in the track show moments, like when something happened, and labelled ticks under it show the scale. Turn either off to see the track without it.</p>
    <Well well={well} zoom={zoom}><div className="ed-slider" style={look.style}><Real m={m} set={set} /></div></Well>
    <div className="ed-layers">
      {rows.map(([key, name]) => (
        <Row.Root key={key} variant="list" className="ed-layer" data-off={m[key] ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ [key]: !m[key] }); }}>
          <Row.Text>{name}</Row.Text>
          <Row.Trail><Switch size="small" aria-label={name} checked={m[key]} onCheckedChange={(on) => set({ [key]: on })} /></Row.Trail>
        </Row.Root>
      ))}
    </div>
  </>;
}

/** Light: a sun on a faint orbit; around it turns the light, nearer or further sets its strength. */
function LightCard({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const sunEl = React.useRef<HTMLSpanElement>(null);
  const R = 40; // the orbit, in the specimen's own units, around the slider's centre
  const reach = (k: number) => R * (1.35 - k * 0.35); // stronger light sits nearer
  const at = (deg: number, k: number) => ({ x: Math.sin((deg * Math.PI) / 180) * reach(k), y: -Math.cos((deg * Math.PI) / 180) * reach(k) });
  const sun = at(m.lightDeg, m.lightK);
  const setLight = (x: number, y: number) => {
    let deg = clamp((Math.atan2(x, -y) * 180) / Math.PI, -90, 90);
    let k = clamp((1.35 - Math.hypot(x, y) / R) / 0.35, 0, 1.5);
    deg = Math.abs(deg) < 4 ? 0 : Math.round(deg / 5) * 5;
    k = Math.abs(k - 1) < 0.08 ? 1 : Math.round(k * 20) / 20;
    set({ lightDeg: deg, lightK: k });
  };
  const turn = (d: number) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) });
  const strength = (d: number) => set({ lightK: clamp(Math.round((m.lightK + d * 0.05) * 20) / 20, 0, 1.5) });
  useOnLand(live && m.lightDeg === 0 && m.lightK === 1 ? 'home' : undefined, () => sunEl.current?.animate([{ scale: 1 }, { scale: 1.6, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }));
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${m.lightDeg === 0 ? 'top' : m.lightDeg < 0 ? `${-m.lightDeg}° left` : `${m.lightDeg}° right`} · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag around, closer for stronger' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'stronger' }] }),
    start: () => ({ ...sun }), move: (s0, dx, dy) => { setLive(true); setLight(s0.x + dx, s0.y + dy); }, end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? strength(d) : turn(d)), axis: 'both', over: setPeek,
  });
  return <>
    <p>Light falls from the top, so the groove is darkest along its top edge and the knob casts a small shadow below it. Drag the sun to move the light, or closer to make it stronger.</p>
    <Well light well={well} zoom={zoom}>
      <div className="ed-lightbox" data-hint-anchor data-lit={live || peek ? '' : undefined} style={look.style}>
        <Real m={m} set={set} />
        <svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden>
          <path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} />
          <path className="is-near" d={`M${-reach(1.5)} 0A${reach(1.5)} ${reach(1.5)} 0 0 1 ${reach(1.5)} 0`} />
        </svg>
        <span ref={sunEl} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...handle} />
      </div>
    </Well>
    <div className="ed-readouts">
      <Readout label="From" value={m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}`} unit={m.lightDeg === 0 ? '' : m.lightDeg < 0 ? '° left' : '° right'} snap={token(m.lightDeg, 0)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={turn} />
      <Readout label="Strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={token(m.lightK, 1)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={strength} />
    </div>
  </>;
}

/** Layers: a row with a switch per layer; the whole row toggles, and hovering it points at its slice on the bench. */
function LayersCard({ m, set, focus, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const groups = [['track', TRACK_LAYERS], ['knob', KNOB_LAYERS]] as const;
  const toggle = (group: 'track' | 'knob', i: number, on: boolean) => set({ [group]: m[group].map((v, j) => (j === i ? on : v)) });
  return <>
    <p>The track has five layers and the knob has four. Turn one off to see what it adds.</p>
    <Well well={well} zoom={zoom}><div className="ed-slider" style={look.style}><Real m={m} set={set} /></div></Well>
    <div className="ed-layers">
      {groups.flatMap(([group, list]) => list.map((l, i) => (
        <Row.Root key={l.name} variant="list" className="ed-layer" data-off={m[group][i] ? undefined : ''}
          onPointerEnter={() => focus(l.name)} onPointerLeave={() => focus(null)}
          onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(group, i, !m[group][i]); }}>
          <Row.Text>{l.name}</Row.Text>
          <Row.Trail><Switch size="small" aria-label={l.name} checked={m[group][i]} onCheckedChange={(on) => toggle(group, i, on)} onFocus={() => focus(l.name)} onBlur={() => focus(null)} /></Row.Trail>
        </Row.Root>
      )))}
    </div>
  </>;
}

/** The card for a part of the slider's x-ray. */
export function SliderSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'thumb': return <KnobCard {...props} />;
    case 'well': return <TrackCard {...props} />;
    case 'slide': return <MoveCard {...props} />;
    case 'shape': return <MarksCard {...props} />;
    case 'light': return <LightCard {...props} />;
    case 'layers': return <LayersCard {...props} />;
  }
}
