import * as React from 'react';
import { Checkbox } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, aim, alphaK, capTop, scalePx, tones, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { CheckboxSpecimenCard } from './CheckboxSpecimens';
import { CheckboxCodePanel } from './CheckboxCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · CHECKBOX
 *
 *   solid     a task line with its checkbox in the margin; click the box to tick it
 *   x-ray     the checkbox on the gridded floor. Its face is the real checkbox itself, laid out at
 *             the object's own zoom and scaled by transform, so the checkbox that lands on it is the
 *             one that was on the table, to the pixel. Around it a rim rises: the well. Ticked, the
 *             face is the dark key, standing on a wall of slices in the well; suggested, a ring on
 *             the floor. Flown in, every part starts on one plane (the object that landed), then the
 *             model opens up.
 *   play      States  rest · hover · done · mixed · doing · suggested
 *             Tick    how the tick is drawn, and its angle
 *             Shape   size · corners
 *             Well    how deep the hole is
 *             Light   direction · strength
 *             Layers  the layers of the current state
 *   code      under the card: the React and SwiftUI for exactly this config (CheckboxCode.tsx)
 * ───────────────────────────────────────────────────────── */

const R = tokens.recipes.checkbox;
export const CHECKBOX_PROPS = R.props;
const P = CHECKBOX_PROPS;
const OBJECT = tokens.springs.object as { duration: number };
const S = 10;
const RIM = 5;
const WALL = 4;
const KEY_WALL = '#161618';

export type CheckboxState = 'rest' | 'hover' | 'on' | 'mixed' | 'doing' | 'ghost';
export type CheckboxSize = 'margin' | 'row';
export type Group = 'rest' | 'on' | 'ghost';
type Spot = 'states' | 'tick' | 'shape' | 'well' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'States', word: 'Every way it can look' },
  { id: 'tick', title: 'Tick', word: 'How the tick is drawn' },
  { id: 'shape', title: 'Shape', word: 'Size and corners' },
  { id: 'well', title: 'Well', word: 'The small hole' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], shape: ['left', 0.48], well: ['left', 0.76],
  layers: ['right', 0.2], tick: ['right', 0.48], states: ['right', 0.76],
};

export const LAYERS: Record<Group, LayerDef[]> = {
  rest: [
    { name: 'Hole fill', why: 'The colour inside the hole. Darker at the top, lighter at the bottom, because the hole goes down into the page.' },
    { name: 'Inner shadow', why: 'A soft shadow inside the top edge. The edge blocks the light, so the top of the hole is darker.' },
    { name: 'Edge line', why: 'A very thin outline so the hole still has an edge on a light page.' },
    { name: 'Bottom light', why: 'A thin bright line on the bottom edge, where the light hits the far wall of the hole.' },
  ],
  on: [
    { name: 'Dark fill', why: 'When the task is done, the hole fills with a dark key. Dark means done, and it is easy to see in a long list.' },
    { name: 'Top light', why: 'A thin bright line on the top edge. It shows the dark key is raised a little, not a flat dark square.' },
    { name: 'Shadow', why: 'A small shadow under the key. With the top light, it makes the key look pressed into place.' },
  ],
  ghost: [
    { name: 'Clear fill', why: 'No fill at all. Nobody wrote this task. The app guessed it, so it is only an outline.' },
    { name: 'Ring', why: 'A thin outline. It says "there could be a task here" without looking like a real one.' },
    { name: 'Inner shadow', why: 'A faint shadow inside the top edge, so the ring still looks like a shallow hole.' },
  ],
};
/** The layer group a state draws: the dark key, the ghost ring, or the well (doing is the well with a green square in it). */
export const groupOf = (s: CheckboxState): Group => (s === 'on' || s === 'mixed' ? 'on' : s === 'ghost' ? 'ghost' : 'rest');
/** The recipe part a state's size and corners come from. */
export const partOf = (m: { state: CheckboxState; size: CheckboxSize }) => (m.state === 'ghost' ? 'ghost' : m.size === 'row' ? 'row' : 'self');
/** The recipe's size and corners for a config, as the checkbox ships. */
export const sizeOf = (m: { state: CheckboxState; size: CheckboxSize }) => P[partOf(m)].size;
export const shipRadius = (m: { state: CheckboxState; size: CheckboxSize }) => P[partOf(m)].radius;

/** Everything a checkbox is set to: its real props first (the state, the size), then what the x-ray lets
 *  you tune. One object, handed from the table to the x-ray and back; the code is read off it. */
export interface CheckboxConfig {
  /** props: the state (hover is the x-ray's look at the rest state, so it never leaves the x-ray) and the size */
  state: CheckboxState; size: CheckboxSize;
  /** recipe values: --mu-r-checkbox-<part>-radius and --mu-r-checkbox-tick-rotate */
  radius: number; angle: number;
  /** the well's, the key's and the ring's fill and shadow stacks, as a depth, a light and which layers are on */
  depth: number; lightDeg: number; lightK: number; on: Record<Group, boolean[]>;
}
export type Model = CheckboxConfig;
export const INITIAL: CheckboxConfig = {
  state: 'rest', size: 'margin', radius: P.self.radius, angle: parseFloat(P.tick.rotate),
  depth: 1, lightDeg: 0, lightK: 1,
  on: { rest: LAYERS.rest.map(() => true), on: LAYERS.on.map(() => true), ghost: LAYERS.ghost.map(() => true) },
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);
type RecipeLayer = { part: string; prop: string; value: string; colorway?: string; state?: string };
/** The checkbox's layers for a state ('' is rest) in a colorway, in recipe order. */
function stateLayers(state: string, colorway: Colorway) {
  const ls = (R.layers as RecipeLayer[]).filter((l) => l.part === 'self' && (!l.colorway || l.colorway === colorway) && (l.state ?? '') === state);
  return { fill: ls.find((l) => l.prop === 'background')?.value ?? 'transparent', shadows: ls.filter((l) => l.prop === 'shadow').map((l) => l.value) };
}

/** What a config looks like: the well's, the key's and the ring's fill and shadows for the model's parts, and
 *  the variables that set the real checkbox to it. Only what differs from the recipe is set, so a default
 *  config is the checkbox exactly as it ships, and the variables are the overrides its code needs. A checkbox
 *  turns from a well into a key as it is used, so both stacks are set when the light or a layer changes them. */
export function checkboxLook(m: CheckboxConfig, colorway: Colorway) {
  const rest = stateLayers('', colorway), hover = stateLayers('hover', colorway), on = stateLayers('on', colorway), ghost = stateLayers('ghost', colorway);
  const grad = (fill: string) => fill.replace('linear-gradient(', `linear-gradient(${180 + m.lightDeg}deg, `);
  const lit = (list: string[], mask: boolean[], depth = 1) => list.map((v, i) => (mask[i + 1] ? aim(i === 0 ? alphaK(v, depth) : v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none';
  const look = {
    colorway, restRaw: rest, onRaw: on, ghostRaw: ghost,
    holeFill: m.on.rest[0] ? grad(rest.fill) : 'transparent',
    hoverFill: m.on.rest[0] ? grad(hover.fill) : 'transparent',
    holeShadow: lit(rest.shadows, m.on.rest, m.depth),
    keyFill: m.on.on[0] ? grad(on.fill) : 'transparent',
    keyShadow: lit(on.shadows, m.on.on),
    ringShadow: lit(ghost.shadows, m.on.ghost),
  };
  const moved = m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK;
  const style: Record<string, string> = {};
  if (m.radius !== shipRadius(m)) style[`--mu-r-checkbox-${partOf(m)}-radius`] = `${m.radius}px`;
  if (m.angle !== INITIAL.angle) style['--mu-r-checkbox-tick-rotate'] = `${m.angle}deg`;
  if (m.state === 'ghost') {
    // the ring has no fill to turn; its stack follows the light and its layers
    if (moved || !same(m.on.ghost.slice(1), INITIAL.on.ghost.slice(1))) style['--mu-r-checkbox-self-ghost-shadow'] = look.ringShadow;
  } else {
    // a fill changes with the light or its own layer; a shadow stack with the light, its depth or any of its layers
    if (moved || !m.on.rest[0]) { style['--mu-r-checkbox-self-background'] = look.holeFill; style['--mu-r-checkbox-self-hover-background'] = look.hoverFill; }
    if (moved || m.depth !== INITIAL.depth || !same(m.on.rest.slice(1), INITIAL.on.rest.slice(1))) style['--mu-r-checkbox-self-shadow'] = look.holeShadow;
    if (moved || !m.on.on[0]) style['--mu-r-checkbox-self-on-background'] = look.keyFill;
    if (moved || !same(m.on.on.slice(1), INITIAL.on.on.slice(1))) style['--mu-r-checkbox-self-on-shadow'] = look.keyShadow;
  }
  return { ...look, style: style as React.CSSProperties };
}
export function useCheckboxLook(m: CheckboxConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => checkboxLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useCheckboxLook>;

/** The checkbox itself, set to a config. The one place its props and variables are put together: the table's
 *  object, the model's face and every specimen are this. `hover` holds the well's hover fill on for a
 *  specimen you are not pointing at; the real hover is the pointer's. */
export function CheckboxFor({ m, look, hover, ...rest }: { m: CheckboxConfig; look: Look; hover?: boolean } & Omit<React.ComponentProps<typeof Checkbox>, 'size' | 'checked' | 'mixed' | 'doing' | 'ghost'>) {
  const held = hover && m.state === 'hover' ? { background: look.hoverFill } : undefined;
  // the checkbox reads its recipe through its own variables, so they are set on it; the box around it keeps its layout to its own
  return (
    <span className="xr-checkbox-box">
      <Checkbox aria-label="Task" checked={m.state === 'on'} mixed={m.state === 'mixed'} doing={m.state === 'doing'} ghost={m.state === 'ghost'} size={m.size} {...rest} style={{ ...look.style, ...held, ...rest.style }} />
    </span>
  );
}

export function CheckboxXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<CheckboxConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<CheckboxConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<CheckboxConfig>) => setM((o) => ({ ...o, ...p })), []);
  // a state change keeps tuned corners, but corners left as they ship follow the state's own (the ring's, the key's)
  const setState = React.useCallback((state: CheckboxState) => setM((o) => ({ ...o, state, radius: o.radius === shipRadius(o) ? shipRadius({ state, size: o.size }) : o.radius })), []);
  // every change goes straight back to where the object came from; hover is the x-ray's own look at rest
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.({ ...m, state: m.state === 'hover' ? 'rest' : m.state }); } }, [m]);
  const look = useCheckboxLook(m);
  const g = groupOf(m.state), on = m.on[g];
  const exploded = spot === 'layers';
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState({ W: 0, H: 0 });
  // the scene is sized from a copy of the checkbox out of the tilt, at the object's own zoom
  React.useLayoutEffect(() => {
    const el = measure.current?.querySelector<HTMLElement>('.mu-dimple'); if (!el) return;
    const r = el.getBoundingClientRect();
    setBox((b) => (Math.abs(b.W - r.width / oz) < 0.001 && Math.abs(b.H - r.height / oz) < 0.001 ? b : { W: r.width / oz, H: r.height / oz }));
  }, [m.state, m.size, oz]);

  // geometry in points, then scaled
  const W = box.W * S, H = box.H * S, Rr = m.radius * S;
  const flat = pose === 'flat';
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const keyed = g === 'on', ghost = g === 'ghost';
  const wellZ = 6 * m.depth;
  const keyZ = 0.5, keyTop = capTop(keyZ, WALL);
  const faceZ = flat ? 1 : keyed ? keyTop : 0.5;
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's face is the checkbox laid out at the object's own zoom, then scaled: the same box, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const Z = exploded ? 2 + (LAYERS[g].length - 1) * 26 : keyed ? keyTop : wellZ;
  const at: Record<Spot, [number, number, number]> = {
    states: [W * 0.85, H * 0.85, Z],
    tick: [W * 0.55, H * 0.4, keyed ? keyTop + 1 : 2],
    shape: [Rr * 0.3, H - Rr * 0.3, ghost ? 1 : wellZ],
    well: [W * 0.3, H * 0.75, 1],
    light: [W * 0.4, 1, ghost ? 1 : wellZ],
    layers: exploded ? [W * 0.7, H * 0.2, Z] : [W * 0.2, H * 0.3, 2],
  };

  const live = <CheckboxFor m={m} look={look} hover={!flat} onCheckedChange={(v) => setState(v ? 'on' : 'rest')} />;
  const line = (
    <span className="flex items-center gap-10" style={{ font: '500 15px/22px var(--sans)', letterSpacing: '-.015em' }}>
      {live}
      <span style={m.state === 'on' ? { color: 'var(--ink3)', textDecoration: 'line-through' } : undefined}>call printer about paper stock</span>
    </span>
  );

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        <span ref={measure} className="xr-checkbox-measure" aria-hidden inert style={{ zoom: oz }}><CheckboxFor m={m} look={look} /></span>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 2.4, cursor: 'zoom-in' }} onClick={(e) => { if ((e.target as HTMLElement).closest('.mu-dimple')) e.stopPropagation(); }}>{line}</div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the well: a rim that rises from the floor around the face (the ghost ring lies on the floor, no well) */}
              {!exploded && !ghost && Array.from({ length: RIM }, (_, i) => (
                <div key={i} className="xr-ring" style={{ width: W, height: H, borderRadius: Rr, opacity: flat ? 0 : 1, transition: `${rise}, opacity .2s`, transform: `translateZ(${flat ? 0 : ((i + 1) / RIM) * wellZ}px)`, borderColor: i === RIM - 1 ? t.rim : t.wall }} />
              ))}

              {/* the key: a wall of slices under the real checkbox, standing in the well */}
              {!exploded && keyed && (
                <div className="xr-thumb">
                  {Array.from({ length: WALL }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: Rr, opacity: flat ? 0 : 1, transition: `${rise}, opacity .2s`, transform: `translateZ(${flat ? 0 : keyZ + i * 1.4}px)`, background: i === 0 || !on[0] ? 'transparent' : KEY_WALL }} />
                  ))}
                </div>
              )}

              {/* the face: the real checkbox */}
              {!exploded && <div className="xr-segface is-top" style={face(faceZ)}>{live}</div>}

              {spot === 'shape' && !exploded && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${faceZ + 1}px)` }} aria-hidden>
                  <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
                  <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{Number(box.H.toFixed(1))}</text>
                  {Rr > 2 && <path d={`M${Rr} 0A${Rr} ${Rr} 0 0 0 0 ${Rr}`} className="is-arc" />}
                  <text x={Rr + 6} y={-8}>r {m.radius}</text>
                </svg>
              )}

              {exploded && (
                <Exploded layers={LAYERS[g]} on={on} fill={keyed ? look.keyFill : ghost ? 'transparent' : look.holeFill}
                  shadows={keyed ? look.onRaw.shadows : ghost ? look.ghostRaw.shadows : look.restRaw.shadows} w={W} h={H} r={Rr} z0={2} gap={26} focus={focus} scale={S} />
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${keyTop + 120}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={(next) => { setSpot(next); if (next === 'tick') setState('on'); if (next === 'well') setState('rest'); }} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Tick it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, state: o.state, radius: shipRadius({ state: o.state, size: INITIAL.size }) }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <CheckboxSpecimenCard spot={spot} m={m} set={set} setState={setState} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <CheckboxCodePanel config={m} />}
    </div></HintLayer>
  );
}
