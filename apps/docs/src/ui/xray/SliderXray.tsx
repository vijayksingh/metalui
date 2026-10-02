import * as React from 'react';
import { Slider } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Exploded, IsoCap, IsoTray, XrayFrame, aim, capTop, scalePx, springEasing, useStateLayers, type LayerDef, type SpotDef } from './kit';
import { clampSpringCurve } from '../springTuning';
import { HintLayer } from '../edit';
import { SliderSpecimenCard } from './SliderSpecimens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SLIDER
 *
 *   solid     a slider with marks and labelled ticks
 *   x-ray     a long thin hole (the track), a green fill inside it, a round metal knob
 *             standing on the track, marks inside, ticks and labels on the floor below
 *   card      the real slider, handled (SliderSpecimens): turn the knob for its shine,
 *             pull the groove's bottom edge for depth, the knob's rims for the spring,
 *             a sun on an arc for the light, switches for marks, ticks and layers
 * ───────────────────────────────────────────────────────── */

const RP = tokens.recipes.slider.props as { regular: { track: number; knob: number }; mark: { w: number; radius: number; color: Record<string, string> }; tick: { w: number; h: number; gap: number; color: Record<string, string> }; knob: { rise: number } };
const RL = tokens.recipes.slider.layers as { part: string; prop: string; value: string; colorway?: string }[];
/** The fill in a colorway: full strength, deeper on bone so it reads against the pale groove. */
const fillOf = (cw: string) => RL.find((l) => l.part === 'fill' && l.prop === 'background' && (!l.colorway || l.colorway === cw))!.value;
const KNOB_BG = RL.find((l) => l.part === 'knob' && l.prop === 'background')!.value;
const KNOB_SH = RL.filter((l) => l.part === 'knob' && l.prop === 'shadow').map((l) => l.value);
const PART = tokens.springs.part as { stiffness: number; damping: number };
const S = 2.2;
const L = 180;
/** Notches at every large step (a tenth), never loose. */
export const MARKS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
export const TICKS = [0, 0.25, 0.5, 0.75, 1];

export type Spot = 'thumb' | 'well' | 'slide' | 'shape' | 'light' | 'layers';
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

export const TRACK_LAYERS: LayerDef[] = [
  { name: 'Groove fill', why: 'The colour inside the groove. Darker at the top and lighter at the bottom, because it goes down into the page.' },
  { name: 'Inner shadow', why: 'A soft shadow inside the top edge, where the edge blocks the light.' },
  { name: 'Edge line', why: 'A very thin outline so the groove keeps its edge on a light page.' },
  { name: 'Bottom light', why: 'A thin bright line on the bottom edge, where light hits the far wall.' },
  { name: 'Green fill', why: 'A solid green from the start to the knob\'s centre, deeper on the light finish so it stands out from the pale groove. It shows how much is chosen. It sits inside the groove, so it never looks like a separate bar.' },
];
export const KNOB_LAYERS: LayerDef[] = [
  { name: 'Metal', why: 'A cone-shaped gradient: light and dark bands turn around the centre. That is how brushed metal looks on a real knob.' },
  { name: 'Inner ring', why: 'A soft white ring just inside the edge, where the metal is cut and catches light.' },
  { name: 'Rim', why: 'A very thin dark outline so the knob stays sharp on the light groove.' },
  { name: 'Shadow', why: 'A small shadow under the knob. The knob stands up, so it has a shadow. The groove does not.' },
];

export interface Model {
  v: number; shine: number; depth: number; k: number; c: number;
  marks: boolean; ticks: boolean; lightDeg: number; lightK: number;
  track: boolean[]; knob: boolean[];
}
export const INITIAL: Model = {
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
  const FILL = fillOf(cw);

  // the knob travels the groove minus itself: half a knob in from each end, like the real slider
  const K = RP.regular.knob, TH = RP.regular.track, IN = K / 2;
  const Hp = K + 22;
  const W = L * S, H = Hp * S;
  const ty = ((K - TH) / 2) * S, th = TH * S;
  const kx = (IN + m.v * (L - IN * 2)) * S - (K * S) / 2;
  const ease = React.useMemo(() => springEasing(m.k, m.c), [m.k, m.c]);
  const move = `transform ${ease.ms}ms ${clampSpringCurve(ease.css)}`;

  const lit = (list: string[], mask: boolean[], k = 1) => list.map((v, i) => (mask[i + 1] ? aim(i === 0 ? v.replace(/rgba\(([^)]*),\s*([\d.]+)\)/, (_, c, a) => `rgba(${c},${Math.min(1, Number(a) * k).toFixed(3)})`) : v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none';
  const grooveFill = m.track[0] ? well.fill.replace('linear-gradient(', `linear-gradient(${180 + m.lightDeg}deg, `) : 'transparent';
  const grooveShadow = scalePx(lit(well.shadows, m.track, m.depth), S);
  const metal = m.knob[0] ? KNOB_BG.replace('from 200deg', `from ${200 + m.shine}deg`) : 'transparent';
  const knobShadow = scalePx(KNOB_SH.map((v, i) => (m.knob[i + 1] ? aim(v, m.lightDeg, i === 0 ? m.lightK : 1) : null)).filter(Boolean).join(', ') || 'none', S);
  // the specimen wears the same model at its own size: the recipe's variables, overridden
  const face = {
    ['--mu-r-well-self-track-background' as string]: grooveFill,
    ['--mu-r-well-self-track-shadow' as string]: lit(well.shadows, m.track, m.depth),
    ['--mu-r-slider-fill-background' as string]: m.track[4] ? FILL : 'transparent',
    ['--mu-r-slider-knob-background' as string]: metal,
    ['--mu-r-slider-knob-shadow' as string]: KNOB_SH.map((v, i) => (m.knob[i + 1] ? aim(v, m.lightDeg, i === 0 ? m.lightK : 1) : null)).filter(Boolean).join(', ') || 'none',
    ['--mu-r-slider-self-transition' as string]: move,
  } as React.CSSProperties;
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
      {m.track[4] && <div className="xr-face is-flat" style={{ top: ty, width: L * S, height: th, borderRadius: th / 2, transformOrigin: 'left', transform: `translateZ(1px) scaleX(${(kx + K * S / 2) / (L * S)})`, background: FILL, transition: move }} />}
      {m.marks && MARKS.map((f) => (
        <i key={f} className="xr-face is-flat" style={{ left: (IN + f * (L - IN * 2)) * S, top: ty, width: RP.mark.w * S, height: th, marginLeft: (-RP.mark.w * S) / 2, borderRadius: RP.mark.radius * S, transform: 'translateZ(1.2px)', background: RP.mark.color[cw] }} />
      ))}
      {m.ticks && TICKS.map((f) => (
        <span key={f} style={{ position: 'absolute', left: (IN + f * (L - IN * 2)) * S, top: ty + th + RP.tick.gap * S, transform: 'translateX(-50%) translateZ(0.5px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: RP.tick.gap * S }}>
          <i style={{ width: RP.tick.w * S, height: RP.tick.h * S, background: RP.tick.color[cw] }} />
          <span className="xr-tick-label type-meta text-ink2" style={{ fontSize: 22 }}>{Math.round(f * 100)}</span>
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
        {m.ticks && <Slider.Ticks ticks={TICKS.map((f) => ({ at: f, label: Math.round(f * 100) }))} />}
        <Slider.Knob aria-label="Amount" />
      </Slider.Root>
    </div>
  );

  const card = <SliderSpecimenCard spot={spot} m={m} set={set} focus={setFocus} face={face} />;

  return (
    <HintLayer><XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }} onClick={(e) => e.stopPropagation()}>{real(300)}</div>}
      W={W} H={H} scene={scene} anchors={anchors}
      sun={spot === 'light' ? { deg: m.lightDeg, k: m.lightK, z: top + 120 } : undefined}
      onReset={() => setM(INITIAL)} deps={[spot, m]}
      card={card}
    /></HintLayer>
  );
}
