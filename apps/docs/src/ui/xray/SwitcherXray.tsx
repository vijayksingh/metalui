import * as React from 'react';
import { Switcher } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, useFit, Glyph, alphaK, scalePx, springEasing, recipeLayers, type SpotDef, planeStyle } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { SwitcherSpecimenCard } from './SwitcherSpecimens';
import { SwitcherCodePanel } from './SwitcherCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SWITCHER
 *
 *   solid       the real control. Try it, then open the x-ray.
 *   x-ray       a tray with a raised rim (the well) on the gridded floor, a raised thumb
 *               inside it, and the labels floating just above the thumb. The tray's floor
 *               and the thumb-and-labels plane are the real control itself, scaled up: two
 *               copies, one with its thumb and words hidden, one with its track turned off.
 *               Flown in, both start on one plane (the object that landed), then part.
 *   play        Shape   size · tray padding · option padding
 *               Well    how deep the tray is
 *               Thumb   how high the thumb sits
 *               Slide   click a label; the thumb slides on a spring you can tune
 *               Light   one light: the thumb gets a bright top, the tray a dark top and a bright bottom
 *               Layers  the tray's four layers and the thumb's six, each switchable
 *   code        under the card: the React and SwiftUI for exactly this config (SwitcherCode.tsx)
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.switcher;
const SELF = RECIPE.props.self as { pad: number };
const SEG = RECIPE.props.option as { height: number; 'height-regular': number; 'pad-x': number };
const PART = tokens.springs.part as { stiffness: number; damping: number };
const OBJECT = tokens.springs.object as { duration: number };
const S = 2.4;
const RIM = 5;
const SLICES = 5;
export const OPTIONS = [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }];

type Spot = 'shape' | 'well' | 'thumb' | 'slide' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'well', title: 'Well', word: 'The tray it sits in' },
  { id: 'thumb', title: 'Thumb', word: 'The raised part' },
  { id: 'slide', title: 'Slide', word: 'How the thumb moves' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], thumb: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], well: ['right', 0.48], slide: ['right', 0.76],
};

export const WELL_LAYERS = [
  { name: 'Tray fill', why: 'The tray colour. It is darker at the top and lighter at the bottom. That is the opposite of the button, because the tray goes down into the page.' },
  { name: 'Inner shadow', why: 'A soft shadow inside the top edge. The top edge blocks the light, so the inside is darker there.' },
  { name: 'Edge line', why: 'A very thin outline so the tray still has an edge on a page of almost the same colour.' },
  { name: 'Bottom light', why: 'A thin bright line on the bottom edge. The light hits the far wall of the tray. This is what makes it look dug in and not just grey.' },
];
export const THUMB_LAYERS = [
  { name: 'Thumb fill', why: 'The thumb colour. Lighter at the top, like the button.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge. It makes the thumb look like soft plastic.' },
  { name: 'Top light', why: 'A thin bright line on the top left edge. It shows the thumb is rounded and facing the light.' },
  { name: 'Rim', why: 'A very thin outline that keeps the thumb sharp against the tray.' },
  { name: 'Contact', why: 'A small shadow right under the thumb. It shows the thumb is resting on the tray floor.' },
  { name: 'Drop', why: 'A bigger, softer shadow. It shows how far the thumb stands above the tray.' },
];

/** Everything a switcher is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface SwitcherConfig {
  /** props */
  value: string; size: 'regular' | 'compact';
  /** recipe values: --mu-r-switcher-* */
  pad: number; padX: number;
  /** the tray's and thumb's shadow stacks, as a depth, a lift, a light and which layers are on */
  depth: number; lift: number; lightDeg: number; lightK: number; well: boolean[]; thumb: boolean[];
  /** the thumb's glide: --mu-spring-part */
  k: number; c: number; instant: boolean;
}
export type Model = SwitcherConfig;
export const INITIAL: SwitcherConfig = {
  value: 'week', size: 'regular', pad: SELF.pad, padX: SEG['pad-x'],
  depth: 1, lift: 1, lightDeg: 0, lightK: 1,
  well: WELL_LAYERS.map(() => true), thumb: THUMB_LAYERS.map(() => true),
  k: PART.stiffness, c: PART.damping, instant: false,
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

/** Turn a shadow's offset to follow the light (0° is straight above), and scale its strength. */
function aim(v: string, deg: number, k: number) {
  const a = (deg * Math.PI) / 180;
  const lit = alphaK(v, k);
  return lit.replace(/^(inset\s+)?(-?[\d.]+)(px)?\s+(-?[\d.]+)(px)?/, (_, inset = '', x, _u1, y) => {
    const X = Number(x) * Math.cos(a) - Number(y) * Math.sin(a), Y = Number(x) * Math.sin(a) + Number(y) * Math.cos(a);
    return `${inset}${X.toFixed(2)}px ${Y.toFixed(2)}px`;
  });
}
const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the tray's and thumb's fill and shadows for the model's parts, and the
 *  variables that set the real control to it. Only what differs from the recipe is set, so a default
 *  config is the control exactly as it ships, and the variables are the overrides its code needs. */
export function switcherLook(m: SwitcherConfig, colorway: Colorway) {
  const well = recipeLayers('switcher', 'self', colorway);
  const thumb = recipeLayers('switcher', 'thumb', colorway);
  const grad = (stops: string[]) => `linear-gradient(${180 + m.lightDeg}deg, ${stops.join(', ')})`;
  const wellShadows = well.shadows.map((v, i) => (m.well[i + 1] ? aim(i === 0 ? alphaK(v, m.depth) : v, m.lightDeg, m.lightK) : null));
  const liftK = (v: string, i: number) => (i >= 3 ? alphaK(scalePx(v, 0.4 + m.lift * 0.6), 0.5 + m.lift * 0.5) : v);
  const thumbShadows = thumb.shadows.map((v, i) => (m.thumb[i + 1] ? aim(liftK(v, i), m.lightDeg, i < 2 ? m.lightK : 1) : null));
  const ease = springEasing(m.k, m.c);
  const look = {
    colorway,
    wellRaw: well, thumbRaw: thumb, ease,
    wellFill: m.well[0] ? grad(well.stops) : 'transparent',
    thumbFill: m.thumb[0] ? grad(thumb.stops) : 'transparent',
    wellShadow: wellShadows.filter(Boolean).join(', ') || 'none',
    thumbShadow: thumbShadows.filter(Boolean).join(', ') || 'none',
  };
  const lit = m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK;
  const style: Record<string, string> = {};
  if (m.pad !== INITIAL.pad) style['--mu-r-switcher-self-pad'] = `${m.pad}px`;
  if (m.padX !== INITIAL.padX) style['--mu-r-switcher-option-pad-x'] = `${m.padX}px`;
  // a fill changes with the light or its own layer; a shadow stack with the light, its depth or lift, or any of its layers
  if (lit || !m.well[0]) style['--mu-r-switcher-self-background'] = look.wellFill;
  if (lit || m.depth !== INITIAL.depth || !same(m.well.slice(1), INITIAL.well.slice(1))) style['--mu-r-switcher-self-shadow'] = look.wellShadow;
  if (lit || !m.thumb[0]) style['--mu-r-switcher-thumb-background'] = look.thumbFill;
  if (lit || m.lift !== INITIAL.lift || !same(m.thumb.slice(1), INITIAL.thumb.slice(1))) style['--mu-r-switcher-thumb-shadow'] = look.thumbShadow;
  if (m.instant) style['--mu-spring-part-d'] = '0s';
  else if (m.k !== INITIAL.k || m.c !== INITIAL.c) { style['--mu-spring-part'] = ease.css; style['--mu-spring-part-d'] = `${ease.ms}ms`; }
  return { ...look, style: style as React.CSSProperties };
}
export function useSwitcherLook(m: SwitcherConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => switcherLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useSwitcherLook>;

/** The real control's box and its chosen option, in its own points, read off the model's top copy. */
interface Box { W: number; H: number; x: number; y: number; w: number; h: number }

export function SwitcherXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<SwitcherConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('slide');
  const [m, setM] = React.useState<SwitcherConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<SwitcherConfig>) => setM((o) => ({ ...o, ...p })), []);
  const sel = m.value;
  const setSel = React.useCallback((value: string) => set({ value }), [set]);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useSwitcherLook(m);
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box>({ W: 0, H: 0, x: 0, y: 0, w: 0, h: 0 });
  React.useLayoutEffect(() => {
    const el = top.current; if (!el) return;
    const read = () => {
      const track = el.querySelector<HTMLElement>('.mu-switcher'), on = track?.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!track || !on) return;
      setBox({ W: track.offsetWidth, H: track.offsetHeight, x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, sel, m.size, m.pad, m.padX]);

  // geometry in points, then scaled
  const W = box.W * S, H = box.H * S, R = H / 2;
  const tx = box.x * S, ty = box.y * S, tw = box.w * S, th = box.h * S;
  const flat = pose === 'flat';
  const rimZ = RIM * m.depth * 1.6;
  const thumbZ = 1 + m.lift * 3;
  const thumbTop = thumbZ + SLICES * 1.4;
  const exploded = spot === 'layers';
  const fit = useFit(bench, W, H, xray);
  const wallTone = look.colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';
  const rimTone = look.colorway === 'graphite' ? '#2a2a2d' : '#f4f3ef';

  const reduced = typeof document !== 'undefined' && document.documentElement.classList.contains('rm');
  // the thumb's wall follows the real thumb on the same spring; its rise rides the object spring, like every part
  const slide = m.instant || reduced ? 'none' : `${look.ease.ms}ms ${look.ease.css}`;
  const move = slide === 'none' ? 'none' : `transform ${slide}, width ${slide}`;
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const current = SPOTS.find((x) => x.id === spot)!;
  const control = (label: string, extra?: Partial<React.ComponentProps<typeof Switcher>>) => <span className="xr-seg-vars" style={look.style}><Switcher aria-label={label} size={m.size} value={sel} onValueChange={setSel} options={OPTIONS} {...extra} /></span>;
  // the model's faces are the control laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => planeStyle(z, S, oz);

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" style={{ zoom: S }}>{control('View')}</div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the well: the real track on the floor, its thumb and words hidden; a rim that rises from the floor around it */}
              {!exploded && (
                <>
                  <div className="xr-segface is-well" aria-hidden inert style={face(0.5)}>{control('View', { onValueChange: undefined })}</div>
                  {Array.from({ length: RIM }, (_, i) => (
                    <div key={i} className="xr-ring" style={{ width: W, height: H, borderRadius: R, transform: `translateZ(${flat ? 0 : ((i + 1) / RIM) * rimZ}px)`, borderColor: i === RIM - 1 ? rimTone : wallTone }} />
                  ))}
                </>
              )}

              {/* the thumb's wall and its shadow on the tray floor, under the real thumb */}
              {!exploded && (
                <div className="xr-thumb" style={{ transform: `translate(${tx}px, ${ty}px)`, transition: move }}>
                  {m.thumb[5] && <div className="xr-shadow is-drop" style={{ width: tw, height: th, borderRadius: th / 2, transition: move === 'none' ? undefined : `${move}, opacity .3s`, filter: `blur(${2 + m.lift * 3}px)`, opacity: flat ? 0 : 0.12 + m.lift * 0.05, transform: `translate(${m.lift * 3}px, ${m.lift * 5}px) translateZ(1px)` }} />}
                  {Array.from({ length: SLICES }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: tw, height: th, borderRadius: th / 2, transition: move === 'none' ? rise : `${rise}, width ${slide}`, transform: `translateZ(${flat ? 0 : thumbZ + i * 1.4}px)`, background: i === 0 || !m.thumb[0] ? 'transparent' : wallTone }} />
                  ))}
                </div>
              )}

              {/* the top: the real control, raised; once the tray has gone down its own track is turned off, and the thumb and words float */}
              {!exploded && (
                <div ref={top} className={flat ? 'xr-segface is-top' : 'xr-segface is-top is-raised'} style={face(flat ? 1 : thumbTop)}>{control('View')}</div>
              )}

              {spot === 'shape' && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${rimZ + 1}px)` }} aria-hidden>
                  <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
                  <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{box.H}</text>
                  <path d={`M${tx} ${H + 16}H${tx + m.padX * S}M${tx} ${H + 10}V${H + 22}M${tx + m.padX * S} ${H + 10}V${H + 22}`} />
                  <text x={tx + (m.padX * S) / 2} y={H + 34} textAnchor="middle">{m.padX}</text>
                  <path d={`M${W - 2} ${H / 2}H${W - m.pad * S}`} />
                  <text x={W + 8} y={H / 2} dominantBaseline="middle">{m.pad}</text>
                </svg>
              )}

              {exploded && (
                <>
                  {WELL_LAYERS.map((l, i) => (
                    <div key={l.name} className={['xr-face is-layer', focus === l.name ? 'is-focus' : '', m.well[i] ? '' : 'is-off'].join(' ')} style={{ width: W, height: H, borderRadius: R, transform: `translateZ(${i * 14}px)`, background: i === 0 ? look.wellFill : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(look.wellRaw.shadows[i - 1] ?? '', S) }}>
                      <span className="xr-tag eng">{l.name}</span>
                    </div>
                  ))}
                  {THUMB_LAYERS.map((l, i) => (
                    <div key={l.name} className={['xr-face is-layer', focus === l.name ? 'is-focus' : '', m.thumb[i] ? '' : 'is-off'].join(' ')} style={{ width: tw, height: th, borderRadius: th / 2, transform: `translate(${tx}px, ${ty}px) translateZ(${WELL_LAYERS.length * 14 + 16 + i * 14}px)`, background: i === 0 ? look.thumbFill : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(look.thumbRaw.shadows[i - 1] ?? '', S) }}>
                      <span className="xr-tag eng">{l.name}</span>
                    </div>
                  ))}
                  {/* the top copy stays, out of sight, so the layers keep their measure */}
                  <div ref={top} className="xr-segface is-top" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}>{control('View', { onValueChange: undefined })}</div>
                </>
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${thumbTop + 140}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  shape: [R * 0.35, H * 0.5, rimZ],
                  well: [W - R * 0.9, H * 0.72, 1],
                  thumb: [tx + tw * 0.5, ty + th * 0.2, thumbTop],
                  slide: [tx + tw, ty + th * 0.5, thumbTop - 2],
                  light: [W * 0.3, 1, rimZ],
                  layers: exploded ? [tx + tw * 0.8, ty + th * 0.3, WELL_LAYERS.length * 14 + 16 + (THUMB_LAYERS.length - 1) * 14] : [W * 0.8, H * 0.3, thumbTop + 1],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? (spot === 'slide' ? 'Drag the thumb or click an option' : 'Pick an icon to learn about that part') : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, value: o.value }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <SwitcherSpecimenCard spot={spot} m={m} set={set} sel={sel} setSel={setSel} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <SwitcherCodePanel config={m} />}
    </div></HintLayer>
  );
}
