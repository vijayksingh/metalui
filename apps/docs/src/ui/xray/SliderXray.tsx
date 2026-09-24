import * as React from 'react';
import { Slider } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, IsoTray, LayerList, LightDials, Proof, SpringPlot, Switch, XrayFrame, aim, capTop, scalePx, springEasing, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SLIDER
 *
 *   solid     a slider with marks and labelled ticks
 *   x-ray     a long thin hole (the track), a green fill inside it, a round metal knob
 *             standing on the track, marks inside, ticks and labels on the floor below
 *   play      Knob    the metal: turn the shine
 *             Track   how deep the hole is
 *             Move    click Jump: the knob jumps on a spring; tune the spring
 *             Marks   marks inside the track, labelled ticks under it
 *             Light   direction · strength
 *             Layers  track, fill and knob layers
 * ───────────────────────────────────────────────────────── */

const RP = tokens.recipes.slider.props as { track: { height: number; inset: number }; fill: { opacity: string }; mark: { w: number; h: number; radius: number; color: Record<string, string> }; tick: { w: number; h: number; top: number; lift: number; color: Record<string, string> }; knob: { size: number; rise: number } };
const RL = tokens.recipes.slider.layers as { part: string; prop: string; value: string }[];
const FILL = RL.find((l) => l.part === 'fill')!.value;
const KNOB_BG = RL.find((l) => l.part === 'knob' && l.prop === 'background')!.value;
const KNOB_SH = RL.filter((l) => l.part === 'knob' && l.prop === 'shadow').map((l) => l.value);
const PART = tokens.springs.part as { stiffness: number; damping: number };
const S = 2.2;
const L = 180;
const MARKS = [0.15, 0.4, 0.62, 0.9];
const TICKS = [0, 0.25, 0.5, 0.75, 1];

type Spot = 'thumb' | 'well' | 'slide' | 'shape' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'thumb', title: 'Knob', word: 'The metal knob' },
  { id: 'well', title: 'Track', word: 'The groove' },
  { id: 'slide', title: 'Move', word: 'Jump and drag' },
  { id: 'shape', title: 'Marks', word: 'Marks and ticks' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], well: ['left', 0.48], shape: ['left', 0.76],
  thumb: ['right', 0.2], layers: ['right', 0.48], slide: ['right', 0.76],
};

const TRACK_LAYERS: LayerDef[] = [
  { name: 'Groove fill', why: 'The colour inside the groove. Darker at the top and lighter at the bottom, because it goes down into the page.' },
  { name: 'Inner shadow', why: 'A soft shadow inside the top edge, where the edge blocks the light.' },
  { name: 'Edge line', why: 'A very thin outline so the groove keeps its edge on a light page.' },
  { name: 'Bottom light', why: 'A thin bright line on the bottom edge, where light hits the far wall.' },
  { name: 'Green fill', why: 'A see-through green from the start to the knob. It shows how much is chosen. It sits inside the groove, so it never looks like a separate bar.' },
];
const KNOB_LAYERS: LayerDef[] = [
  { name: 'Metal', why: 'A cone-shaped gradient: light and dark bands turn around the centre. That is how brushed metal looks on a real knob.' },
  { name: 'Inner ring', why: 'A soft white ring just inside the edge, where the metal is cut and catches light.' },
  { name: 'Rim', why: 'A very thin dark outline so the knob stays sharp on the light groove.' },
  { name: 'Shadow', why: 'A small shadow under the knob. The knob stands up, so it has a shadow. The groove does not.' },
];

interface Model {
  v: number; shine: number; depth: number; k: number; c: number;
  marks: boolean; ticks: boolean; lightDeg: number; lightK: number;
  track: boolean[]; knob: boolean[];
}
const INITIAL: Model = {
  v: 0.55, shine: 0, depth: 1, k: PART.stiffness, c: PART.damping,
  marks: true, ticks: true, lightDeg: 0, lightK: 1,
  track: TRACK_LAYERS.map(() => true), knob: KNOB_LAYERS.map(() => true),
};

export function SliderXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('slide');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const well = useStateLayers('well', 'track');
  const cw = well.colorway;

  const K = RP.knob.size, TH = RP.track.height, IN = RP.track.inset;
  const Hp = K + 22;
  const W = L * S, H = Hp * S;
  const ty = ((K - TH) / 2) * S, th = TH * S;
  const kx = (IN + m.v * (L - IN * 2)) * S - (K * S) / 2;
  const ease = React.useMemo(() => springEasing(m.k, m.c), [m.k, m.c]);
  const move = `transform ${ease.ms}ms ${ease.css}, width ${ease.ms}ms ${ease.css}`;

  const lit = (list: string[], mask: boolean[], k = 1) => list.map((v, i) => (mask[i + 1] ? aim(i === 0 ? v.replace(/rgba\(([^)]*),\s*([\d.]+)\)/, (_, c, a) => `rgba(${c},${Math.min(1, Number(a) * k).toFixed(3)})`) : v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none';
  const grooveFill = m.track[0] ? well.fill.replace('linear-gradient(', `linear-gradient(${180 + m.lightDeg}deg, `) : 'transparent';
  const grooveShadow = scalePx(lit(well.shadows, m.track, m.depth), S);
  const metal = m.knob[0] ? KNOB_BG.replace('from 200deg', `from ${200 + m.shine}deg`) : 'transparent';
  const knobShadow = scalePx(KNOB_SH.map((v, i) => (m.knob[i + 1] ? aim(v, m.lightDeg, i === 0 ? m.lightK : 1) : null)).filter(Boolean).join(', ') || 'none', S);
  const wall = Math.round((RP.knob.rise * S) / 1.4);
  const top = capTop(1, wall);
  const exploded = spot === 'layers';

  const scene = exploded ? (
    <>
      <Exploded layers={TRACK_LAYERS} on={m.track} fill={grooveFill} shadows={well.shadows} backgrounds={[grooveFill, undefined, undefined, undefined, FILL]} y={ty} w={W} h={th} r={th / 2} z0={2} gap={16} focus={focus} scale={S} />
      <Exploded layers={KNOB_LAYERS} on={m.knob} fill={metal} shadows={KNOB_SH} x={kx} y={0} w={K * S} h={K * S} r={(K * S) / 2} z0={2 + TRACK_LAYERS.length * 16 + 10} gap={16} focus={focus} scale={S} />
    </>
  ) : (
    <>
      <IsoTray y={ty} w={W} h={th} r={th / 2} depth={4 * m.depth} fill={grooveFill} shadow={grooveShadow} colorway={cw} />
      {m.track[4] && <div className="xr-face is-flat" style={{ top: ty, width: kx + (K * S) / 2, height: th, borderRadius: th / 2, transform: 'translateZ(1px)', background: FILL, opacity: Number(RP.fill.opacity), transition: move }} />}
      {m.marks && MARKS.map((f) => (
        <i key={f} className="xr-face is-flat" style={{ left: (IN + f * (L - IN * 2)) * S, top: ty + (th - RP.mark.h * S) / 2, width: RP.mark.w * S, height: RP.mark.h * S, borderRadius: RP.mark.radius * S, transform: 'translateZ(1.2px)', background: RP.mark.color[cw] }} />
      ))}
      {m.ticks && TICKS.map((f) => (
        <span key={f} style={{ position: 'absolute', left: (IN + f * (L - IN * 2)) * S, top: ty + th + (RP.tick.top - RP.tick.lift) * S, transform: 'translateX(-50%) translateZ(0.5px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <i style={{ width: RP.tick.w * S, height: RP.tick.h * S, background: RP.tick.color[cw] }} />
          <span className="eng" style={{ fontSize: 18 }}>{Math.round(f * 100)}</span>
        </span>
      ))}
      <div className="xr-shadow" style={{ left: 0, top: 0, width: K * S, height: K * S, borderRadius: '50%', filter: 'blur(5px)', opacity: 0.22, transform: `translate(${kx + 6}px, 10px)`, transition: move }} />
      <IsoCap x={kx} w={K * S} h={K * S} r={(K * S) / 2} z={1} wall={wall} fill={metal} shadow={knobShadow} wallTone={cw === 'graphite' ? '#8d8d89' : '#a9a9a5'} transition={move} />
    </>
  );

  const Zk = exploded ? 2 + TRACK_LAYERS.length * 16 + 10 + (KNOB_LAYERS.length - 1) * 16 : top;
  const anchors: Record<Spot, [number, number, number]> = {
    thumb: [kx + K * S * 0.5, K * S * 0.3, Zk],
    well: [W * 0.08, ty + th * 0.5, 1],
    slide: [kx + K * S, K * S * 0.5, top - 4],
    shape: [(IN + MARKS[0] * (L - IN * 2)) * S, ty + th * 0.5, 1.2],
    light: [kx + K * S * 0.3, 2, top],
    layers: exploded ? [W * 0.9, ty, 2 + (TRACK_LAYERS.length - 1) * 16] : [W * 0.9, ty + th * 0.5, 1],
  };

  const real = (w = 300) => (
    <div style={{ width: w, height: 44 }}>
      <Slider.Root value={Math.round(m.v * 100)} min={0} max={100} step={1} onValueChange={(v) => set({ v: v / 100 })}>
        <Slider.Track />
        {m.marks && <Slider.Marks at={MARKS} />}
        {m.ticks && <Slider.Ticks ticks={TICKS.map((f) => ({ at: f, label: <span className="eng">{Math.round(f * 100)}</span> }))} />}
        <Slider.Knob aria-label="Amount" />
      </Slider.Root>
    </div>
  );

  const card = (
    <>
      {spot === 'thumb' && (
        <>
          <p>The knob is a small metal disc. Its top uses a cone-shaped gradient, so light and dark bands turn around the centre, like a real brushed metal knob. Turn the shine and watch the bands move.</p>
          <div className="xr-dials"><Dial label="Shine" value={m.shine} min={-180} max={180} step={5} fmt={(v) => `${v}°`} onChange={(shine) => set({ shine })} /></div>
        </>
      )}
      {spot === 'well' && (
        <>
          <p>The track is a long thin groove pressed into the page. The knob stands in it, and the green fill sits inside it. Make it deeper and the inner shadow gets stronger.</p>
          <div className="xr-dials"><Dial label="Depth" value={m.depth} min={0} max={3} step={0.1} fmt={(v) => (v === 0 ? 'flat' : v.toFixed(1))} onChange={(depth) => set({ depth })} /></div>
        </>
      )}
      {spot === 'slide' && (
        <>
          <p>There are two ways to move the knob. Click the track or press an arrow key and the knob jumps there on a spring. Drag it and it follows your finger exactly, with no spring, because your hand is already moving it.</p>
          <div className="xr-actions-row">
            {[0.1, 0.5, 0.9].map((v) => <button key={v} type="button" className="status" onClick={() => set({ v })}><span className="led off" />Jump to {Math.round(v * 100)}</button>)}
          </div>
          <div className="xr-dials">
            <Dial label="Stiffness" value={m.k} min={60} max={600} step={10} onChange={(k) => set({ k })} />
            <Dial label="Damping" value={m.c} min={6} max={50} step={1} onChange={(c) => set({ c })} />
          </div>
          <Proof column><SpringPlot k={m.k} c={m.c} ms={Math.max(360, Math.min(900, ease.ms))} /></Proof>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>Short marks inside the track show moments, like when something happened. Labelled ticks under the track show the scale. Both are faint, so the knob stays the thing you look at.</p>
          <div className="xr-dials">
            <Switch label="Marks in the track" on={m.marks} onChange={(marks) => set({ marks })} />
            <Switch label="Ticks and labels" on={m.ticks} onChange={(ticks) => set({ ticks })} />
          </div>
        </>
      )}
      {spot === 'light' && (
        <>
          <p>The same light as everything else. The groove is dark at the top and bright at the bottom. The knob stands up, so it gets a bright ring and a shadow.</p>
          <LightDials deg={m.lightDeg} k={m.lightK} set={set} />
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>Two parts: the track has five layers and the knob has four. Turn one off to see what it adds.</p>
          <LayerList focus={focus} setFocus={setFocus} groups={[
            { title: 'The track', layers: TRACK_LAYERS, on: m.track, toggle: (i, v) => set({ track: m.track.map((x, j) => (j === i ? v : x)) }) },
            { title: 'The knob', layers: KNOB_LAYERS, on: m.knob, toggle: (i, v) => set({ knob: m.knob.map((x, j) => (j === i ? v : x)) }) },
          ]} />
        </>
      )}
      <Proof>{real(240)}</Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }} onClick={(e) => e.stopPropagation()}>{real(300)}</div>}
      W={W} H={H} scene={scene} anchors={anchors}
      sun={spot === 'light' ? { deg: m.lightDeg, k: m.lightK, z: top + 120 } : undefined}
      hint={spot === 'slide' ? 'Press a Jump button to move the knob' : undefined}
      onReset={() => setM(INITIAL)} deps={[spot, m]}
      card={card}
    />
  );
}
