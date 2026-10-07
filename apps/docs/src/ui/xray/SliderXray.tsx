import * as React from 'react';
import { Slider } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, aim, alphaK, capTop, springEasing, tones, useFit, type LayerDef, type SpotDef } from './kit';
import { clampSpringCurve } from '../springTuning';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { SliderSpecimenCard } from './SliderSpecimens';
import { SliderCodePanel } from './SliderCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SLIDER
 *
 *   solid     a slider with marks and labelled ticks
 *   x-ray     a long thin groove pressed into the gridded floor, a green fill and marks inside it,
 *             the ticks and labels on the floor below, and a round metal knob standing on the
 *             groove. The floor plane and the knob are the real slider itself, scaled up: two
 *             copies, one with its knob hidden, one with its groove, marks and ticks turned off.
 *             Flown in, both start on one plane (the object that landed), then the knob rises.
 *   card      the real slider, handled (SliderSpecimens): turn the knob for its shine,
 *             pull the groove's bottom edge for depth, the knob's rims for the spring,
 *             a sun on an arc for the light, switches for marks, ticks and layers
 *   code      under the card: the React and SwiftUI for exactly this config (SliderCode.tsx)
 * ───────────────────────────────────────────────────────── */

const RP = tokens.recipes.slider.props as { regular: { track: number; knob: number }; knob: { rise: number } };
const RL = tokens.recipes.slider.layers as { part: string; prop: string; value: string; colorway?: string; state?: string }[];
const WL = tokens.recipes.well.layers as { part: string; prop: string; value: string; colorway?: string; state?: string }[];
/** The fill in a colorway: full strength, deeper on bone so it reads against the pale groove. */
const fillOf = (cw: string) => RL.find((l) => l.part === 'fill' && l.prop === 'background' && (!l.colorway || l.colorway === cw))!.value;
/** The groove: the track well's layers in a colorway, in recipe order (a fill, then its shadows). */
function trackOf(cw: string) {
  const ls = WL.filter((l) => l.part === 'self' && l.state === 'track' && (!l.colorway || l.colorway === cw));
  return { fill: ls.find((l) => l.prop === 'background')?.value ?? 'transparent', shadows: ls.filter((l) => l.prop === 'shadow').map((l) => l.value) };
}
const KNOB_BG = RL.find((l) => l.part === 'knob' && l.prop === 'background')!.value;
const KNOB_SH = RL.filter((l) => l.part === 'knob' && l.prop === 'shadow' && !l.state).map((l) => l.value);
/** Where the metal's bands start: the recipe's conic angle. */
export const SHINE_FROM = Number(KNOB_BG.match(/from\s+([\d.]+)deg/)?.[1] ?? 0);
const PART = tokens.springs.part as { stiffness: number; damping: number };
const OBJECT = tokens.springs.object as { duration: number };
const S = 2.2;
const RIM = 5;
/** The knob's wall: its rise from the recipe, in slices. */
const SLICES = Math.round((RP.knob.rise * S) / 1.4);
/** The slider's real props that the x-ray keeps fixed: its range and width, its marks (one at every
 *  large step) and its labelled ticks. */
export const MIN = 0;
export const MAX = 100;
export const WIDTH = 200;
export const MARKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
export const TICKS = [0, 25, 50, 75, 100].map((value) => ({ value, label: value }));
export const fraction = (value: number) => (value - MIN) / (MAX - MIN);

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

/** Everything a slider is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface SliderConfig {
  /** props: the value, and whether its marks and its ticks are drawn */
  value: number; marks: boolean; ticks: boolean;
  /** the knob's metal, turned: --mu-r-slider-knob-background */
  shine: number;
  /** the groove's and the knob's shadow stacks, as a depth, a light and which layers are on */
  depth: number; lightDeg: number; lightK: number; track: boolean[]; knob: boolean[];
  /** the jump's spring: --mu-r-slider-self-transition */
  k: number; c: number;
}
export type Model = SliderConfig;
export const INITIAL: SliderConfig = {
  value: 62, marks: true, ticks: true,
  shine: 0, depth: 1, lightDeg: 0, lightK: 1,
  track: TRACK_LAYERS.map(() => true), knob: KNOB_LAYERS.map(() => true),
  k: PART.stiffness, c: PART.damping,
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);
const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the groove's and the knob's fill and shadows for the model's parts, and
 *  the variables that set the real slider to it. Only what differs from the recipe is set, so a
 *  default config is the slider exactly as it ships, and the variables are the overrides its code needs. */
export function sliderLook(m: SliderConfig, colorway: Colorway) {
  const well = trackOf(colorway);
  const lit = (list: string[], mask: boolean[], k: number) => list.map((v, i) => (mask[i + 1] ? aim(i === 0 ? alphaK(v, k) : v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none';
  const ease = springEasing(m.k, m.c);
  const look = {
    colorway, ease,
    wellRaw: well, knobRaw: KNOB_SH,
    grooveFill: m.track[0] ? well.fill.replace('linear-gradient(', `linear-gradient(${180 + m.lightDeg}deg, `) : 'transparent',
    grooveShadow: lit(well.shadows, m.track, m.depth),
    fill: m.track[4] ? fillOf(colorway) : 'transparent',
    metal: m.knob[0] ? KNOB_BG.replace(/from\s+[\d.]+deg/, `from ${SHINE_FROM + m.shine}deg`) : 'transparent',
    knobShadow: KNOB_SH.map((v, i) => (m.knob[i + 1] ? aim(v, m.lightDeg, i === 0 ? m.lightK : 1) : null)).filter(Boolean).join(', ') || 'none',
  };
  const moved = m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK;
  const style: Record<string, string> = {};
  // a fill changes with the light or its own layer; a shadow stack with the light, its depth or any of its layers
  if (moved || !m.track[0]) style['--mu-r-well-self-track-background'] = look.grooveFill;
  if (moved || m.depth !== INITIAL.depth || !same(m.track.slice(1, 4), INITIAL.track.slice(1, 4))) style['--mu-r-well-self-track-shadow'] = look.grooveShadow;
  if (!m.track[4]) style['--mu-r-slider-fill-background'] = look.fill;
  if (m.shine !== INITIAL.shine || !m.knob[0]) style['--mu-r-slider-knob-background'] = look.metal;
  if (moved || !same(m.knob.slice(1), INITIAL.knob.slice(1))) style['--mu-r-slider-knob-shadow'] = look.knobShadow;
  // the jump rides the part spring clipped at the groove's ends. The recipe bakes the spring into its own
  // transition variable at the root, so a host sets that variable, in the recipe's form: the duration still
  // times the travel switch, so reduced motion still lands at once
  if (m.k !== INITIAL.k || m.c !== INITIAL.c) style['--mu-r-slider-self-transition'] = `transform calc(${ease.ms}ms * var(--mu-travel-part)) ${clampSpringCurve(ease.css)}`;
  return { ...look, style: style as React.CSSProperties };
}
export function useSliderLook(m: SliderConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => sliderLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useSliderLook>;

/** The slider set to a config: the object on the table, the model's faces, the specimen in every card.
 *  Its config reaches it the way the library supports from a host: the recipe's variables on a wrapper. */
export function SliderObject({ config, onValueChange, label = 'Amount' }: { config: SliderConfig; onValueChange?: (value: number) => void; label?: string }) {
  const { style } = useSliderLook(config);
  return (
    <div className="xr-slider-vars" style={style}>
      <Slider aria-label={label} width={WIDTH} value={config.value} min={MIN} max={MAX} onValueChange={onValueChange} marks={config.marks ? MARKS : undefined} ticks={config.ticks ? TICKS : undefined} />
    </div>
  );
}

/** The real slider's boxes in its own points, read off the model's top copy: the whole, its control,
 *  its groove and its knob's size. The knob's place follows from the value, like the real knob's. */
interface Box { W: number; H: number; cx: number; cy: number; cw: number; ch: number; tx: number; ty: number; tw: number; th: number; K: number }
const NO_BOX: Box = { W: 0, H: 0, cx: 0, cy: 0, cw: 0, ch: 0, tx: 0, ty: 0, tw: 0, th: 0, K: RP.regular.knob };

export function SliderXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<SliderConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('slide');
  const [m, setM] = React.useState<SliderConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<SliderConfig>) => setM((o) => ({ ...o, ...p })), []);
  const setValue = React.useCallback((value: number) => set({ value }), [set]);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useSliderLook(m);
  const exploded = spot === 'layers';
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box>(NO_BOX);
  React.useLayoutEffect(() => {
    const el = top.current; if (!el) return;
    const read = () => {
      // a copy that has just been swapped out (the layers view keeps its own) reports nothing but zeros
      if (!el.isConnected) return;
      const root = el.querySelector<HTMLElement>('.mu-slider'), ctl = root?.querySelector<HTMLElement>('.mu-slider-control');
      const track = ctl?.querySelector<HTMLElement>('.mu-slider-track'), knob = ctl?.querySelector<HTMLElement>('.mu-slider-knob');
      if (!root || !ctl || !track || !knob) return;
      setBox({ W: root.offsetWidth, H: root.offsetHeight, cx: ctl.offsetLeft, cy: ctl.offsetTop, cw: ctl.offsetWidth, ch: ctl.offsetHeight, tx: ctl.offsetLeft + track.offsetLeft, ty: ctl.offsetTop + track.offsetTop, tw: track.offsetWidth, th: track.offsetHeight, K: knob.offsetWidth });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, exploded, m.marks, m.ticks]);

  // geometry in points, then scaled
  const W = box.W * S, H = box.H * S;
  const tx = box.tx * S, ty = box.ty * S, tw = box.tw * S, th = box.th * S;
  const K = box.K * S;
  // the knob's centre travels half a knob in from each end of the control, like the real knob
  const kx = (box.cx + box.cw / 2 + (fraction(m.value) - 0.5) * (box.cw - box.K) - box.K / 2) * S;
  const ky = (box.cy + box.ch / 2 - box.K / 2) * S;
  const flat = pose === 'flat';
  const rimZ = RIM * m.depth * 1.6;
  const knobZ = 1;
  const knobTop = capTop(knobZ, SLICES);
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const knobWall = look.colorway === 'graphite' ? '#8d8d89' : '#a9a9a5';

  const reduced = typeof document !== 'undefined' && document.documentElement.classList.contains('rm');
  // the knob's wall follows the real knob on the same spring, clipped at the stops like the slider's own
  const slide = reduced ? 'none' : `${look.ease.ms}ms ${clampSpringCurve(look.ease.css)}`;
  const move = slide === 'none' ? 'none' : `transform ${slide}`;
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const current = SPOTS.find((x) => x.id === spot)!;
  const control = (onChange?: (value: number) => void) => <SliderObject config={m} onValueChange={onChange} />;
  // the model's faces are the slider laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const explodedKnobZ = 2 + TRACK_LAYERS.length * 16 + 10;

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" style={{ zoom: 1.6 }}>{control(setValue)}</div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the groove on the floor: the real slider with its knob hidden; a rim that rises from the floor around the groove.
                  Flat, the top copy is the whole object by itself, so the floor copy waits out of sight: its groove's
                  shadows and labels would paint twice through the top copy's clear parts. */}
              {!exploded && (
                <>
                  <div className="xr-segface is-well" aria-hidden inert style={{ ...face(0.5), visibility: flat ? 'hidden' : undefined }}>{control()}</div>
                  {Array.from({ length: RIM }, (_, i) => (
                    <div key={i} className="xr-ring" style={{ width: tw, height: th, borderRadius: th / 2, transform: `translate(${tx}px, ${ty}px) translateZ(${flat ? 0 : ((i + 1) / RIM) * rimZ}px)`, borderColor: i === RIM - 1 ? t.rim : t.wall }} />
                  ))}
                </>
              )}

              {/* the knob's wall and its shadow on the floor, under the real knob */}
              {!exploded && (
                <div className="xr-thumb" style={{ transform: `translate(${kx}px, ${ky}px)`, transition: move }}>
                  {m.knob[3] && <div className="xr-shadow is-drop" style={{ width: K, height: K, borderRadius: '50%', filter: 'blur(5px)', opacity: flat ? 0 : 0.22, transition: 'opacity .3s', transform: 'translate(6px, 10px) translateZ(1px)' }} />}
                  {Array.from({ length: SLICES }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: K, height: K, borderRadius: '50%', opacity: flat ? 0 : 1, transition: `${rise}, opacity .25s`, transform: `translateZ(${flat ? 0 : knobZ + i * 1.4}px)`, background: i === 0 || !m.knob[0] ? 'transparent' : knobWall }} />
                  ))}
                </div>
              )}

              {/* the top: the real slider, raised; once the groove has gone down its own groove, marks and ticks are turned off, and the knob stands alone */}
              {!exploded && (
                <div ref={top} className={flat ? 'xr-segface is-top' : 'xr-segface is-top is-raised'} style={face(flat ? 1 : knobTop)}>{control(setValue)}</div>
              )}

              {exploded && (
                <>
                  <Exploded layers={TRACK_LAYERS} on={m.track} fill={look.grooveFill} shadows={look.wellRaw.shadows} backgrounds={[look.grooveFill, undefined, undefined, undefined, look.fill]} x={tx} y={ty} w={tw} h={th} r={th / 2} z0={2} gap={16} focus={focus} scale={S} />
                  <Exploded layers={KNOB_LAYERS} on={m.knob} fill={look.metal} shadows={look.knobRaw} x={kx} y={ky} w={K} h={K} r={K / 2} z0={explodedKnobZ} gap={16} focus={focus} scale={S} />
                  {/* the top copy stays, out of sight, so the layers keep their measure */}
                  <div ref={top} className="xr-segface is-top" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}>{control()}</div>
                </>
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${knobTop + 120}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  thumb: [kx + K * 0.5, ky + K * 0.3, exploded ? explodedKnobZ + (KNOB_LAYERS.length - 1) * 16 : knobTop],
                  well: [tx + tw * 0.08, ty + th * 0.5, 1],
                  slide: [kx + K, ky + K * 0.5, knobTop - 4],
                  shape: [tx + (box.K / 2 + fraction(MARKS[0]) * (box.cw - box.K)) * S, ty + th * 0.5, 1.2],
                  light: [kx + K * 0.3, ky + 2, knobTop],
                  layers: exploded ? [tx + tw * 0.9, ty, 2 + (TRACK_LAYERS.length - 1) * 16] : [tx + tw * 0.9, ty + th * 0.5, 1],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? (spot === 'slide' ? 'Click the groove or drag the knob' : 'Pick an icon to learn about that part') : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, value: o.value }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <SliderSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <SliderCodePanel config={m} />}
    </div></HintLayer>
  );
}
