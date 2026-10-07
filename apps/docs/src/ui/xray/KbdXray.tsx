import * as React from 'react';
import { Kbd } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, aim, alphaK, recipeLayers, scalePx, tones, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { KbdSpecimenCard } from './KbdSpecimens';
import { KbdCodePanel } from './KbdCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · KEYCAP
 *
 *   solid       the real keycap. Open the x-ray.
 *   x-ray       the keycap on the gridded floor. Its top face is the real keycap itself, laid out at
 *               the object's own zoom and scaled by transform, so it lands on the table's keycap to
 *               the pixel. Under it: a wall of slices and a shadow on the floor (the cap), or a rim
 *               that rises around it (a key sunk into a pill). Flown in, every part starts on one
 *               plane (the object that landed), then the model opens up.
 *   play        Shape    size · space beside the glyph · corners
 *               Type     glyph size · letter spacing
 *               Surface  on the page · on a dark strip · sunk into a pill
 *               Light    direction · strength
 *               Shadow   height above the page
 *               Layers   the current surface's layers, each switchable
 *   code        under the card: the React and SwiftUI for exactly this config (KbdCode.tsx)
 * ───────────────────────────────────────────────────────── */

export const KBD_PROPS = tokens.recipes.kbd.props;
const P = KBD_PROPS.self;
const OBJECT = tokens.springs.object as { duration: number };
const S = 5;
const SLICES = 5;
const RIM = 5;

export type Surface = 'default' | 'strip' | 'sunk';
export type KbdSize = 'default' | 'small';
type Spot = 'shape' | 'type' | 'surface' | 'light' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'shape', title: 'Shape', word: 'Size and corners' },
  { id: 'type', title: 'Type', word: 'The glyph' },
  { id: 'surface', title: 'Surface', word: 'Where the key sits' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'shadow', title: 'Shadow', word: 'Height above the page' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], layers: ['left', 0.48], shape: ['left', 0.76],
  type: ['right', 0.2], surface: ['right', 0.48], shadow: ['right', 0.76],
};

export const LAYERS: Record<Surface, LayerDef[]> = {
  default: [
    { name: 'Fill', why: 'The key colour. A little lighter at the top, where the light hits.' },
    { name: 'Inner glow', why: 'A soft light just inside the edge. It makes the key look like soft plastic.' },
    { name: 'Top light', why: 'A thin bright line on the top left edge. It shows the key is rounded and faces the light.' },
    { name: 'Rim', why: 'A very thin outline. It keeps the small key sharp on a light background.' },
    { name: 'Contact', why: 'A small shadow right under the key. It shows the key is sitting on the surface.' },
    { name: 'Drop', why: 'A bigger, softer shadow. It shows how high the key stands.' },
  ],
  strip: [
    { name: 'Fill', why: 'A dark key colour, a little lighter than the dark strip, so the key stands out from it.' },
    { name: 'Top light', why: 'One bright line on the top edge. On a dark surface this line is all you need to show the key is raised.' },
    { name: 'Edge', why: 'A dark outline that separates the key from the strip.' },
  ],
  sunk: [
    { name: 'Fill', why: 'A dark colour, darker than the pill around it, because the key is pressed in.' },
    { name: 'Inner shadow', why: 'A shadow inside the top edge. The pill\'s edge blocks the light, so the top of the hole is dark.' },
    { name: 'Bottom light', why: 'A faint bright line under the bottom edge, where the pill catches the light again.' },
  ],
};

/** The recipe part each surface draws from. */
export const partOf = (surface: Surface) => (surface === 'default' ? 'self' : surface);
/** The recipe's values for a size: its height, padding and corners. */
export const sizeProps = (size: KbdSize) => KBD_PROPS[size === 'small' ? 'small' : 'self'];

/** Everything a keycap is set to: its real props first (the glyph, the size, the surface), then what the
 *  x-ray lets you tune. One object, handed from the table to the x-ray and back; the code is read off it. */
export interface KbdConfig {
  /** props */
  glyph: string; size: KbdSize; surface: Surface;
  /** recipe values: --mu-r-kbd-* (padding and corners belong to the size) */
  pad: number; radius: number; fontSize: number; track: number;
  /** the cap's fill and shadow stack, as a lift, a light and which layers are on, per surface */
  lift: number; lightDeg: number; lightK: number; on: Record<Surface, boolean[]>;
}
export type Model = KbdConfig;
export const INITIAL: KbdConfig = {
  glyph: '⌘K', size: 'default', surface: 'default',
  pad: P.pad, radius: P.radius, fontSize: Number(P.font.match(/[\d.]+(?=px)/)?.[0]), track: Number(P.tracking.replace('em', '')),
  lift: 1, lightDeg: 0, lightK: 1,
  on: { default: LAYERS.default.map(() => true), strip: LAYERS.strip.map(() => true), sunk: LAYERS.sunk.map(() => true) },
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the cap's fill and shadows for the model's parts, and the variables that set
 *  the real keycap to it. Only what differs from the recipe is set, so a default config is the keycap
 *  exactly as it ships, and the variables are the overrides its code needs. */
export function kbdLook(m: KbdConfig, colorway: Colorway) {
  const part = partOf(m.surface);
  const raw = recipeLayers('kbd', part, colorway);
  const on = m.on[m.surface], ship = INITIAL.on[m.surface];
  const grad = `linear-gradient(${180 + m.lightDeg}deg, ${raw.stops.join(', ')})`;
  const fill = on[0] ? grad : 'transparent';
  const lifted = (v: string) => (m.surface === 'default' && !/^inset/.test(v) ? alphaK(scalePx(v, 0.4 + m.lift * 0.6), 0.5 + m.lift * 0.5) : v);
  const shadow = raw.shadows.map((v, i) => (on[i + 1] ? aim(lifted(v), m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none';
  const look = { colorway, raw, grad, fill, shadow };

  const sp = m.size === 'small' ? 'small' : 'self', ship_ = sizeProps(m.size);
  const style: Record<string, string> = {};
  if (m.pad !== ship_.pad) style[`--mu-r-kbd-${sp}-pad`] = `${m.pad}px`;
  // a sunk key is a pill, whatever its corners
  if (m.surface !== 'sunk' && m.radius !== ship_.radius) style[`--mu-r-kbd-${sp}-radius`] = `${m.radius}px`;
  if (m.fontSize !== INITIAL.fontSize) style['--mu-r-kbd-self-font'] = P.font.replace(/[\d.]+px/, `${m.fontSize}px`).replace(/\bmono$/, 'var(--mu-mono)');
  if (m.track !== INITIAL.track) style['--mu-r-kbd-self-tracking'] = `${m.track}em`;
  // a fill changes with the light's direction or its own layer; a shadow stack with the light, the lift or any of its layers
  if (m.lightDeg !== INITIAL.lightDeg || !on[0]) style[`--mu-r-kbd-${part}-background`] = fill;
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK || (m.surface === 'default' && m.lift !== INITIAL.lift) || !same(on.slice(1), ship.slice(1))) style[`--mu-r-kbd-${part}-shadow`] = shadow;
  return { ...look, style: style as React.CSSProperties };
}
export function useKbdLook(m: KbdConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => kbdLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useKbdLook>;

/** The keycap itself, set to a config. The one place its props and variables are put together. */
export function KbdFor({ m, look, ...rest }: { m: KbdConfig; look: Look } & Omit<React.ComponentProps<typeof Kbd>, 'size' | 'surface'>) {
  // the keycap reads its recipe through its own variables, so they are set on it; the box around it only keeps its layout to its own
  return <span className="xr-kbd-box"><Kbd size={m.size} surface={m.surface} {...rest} style={{ ...look.style, ...rest.style }}>{rest.children ?? m.glyph}</Kbd></span>;
}

export function KbdXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<KbdConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('surface');
  const [m, setM] = React.useState<KbdConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<KbdConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useKbdLook(m);
  const exploded = spot === 'layers';
  const on = m.on[m.surface];
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ W: 0, H: 0 });
  const measure = React.useRef<HTMLSpanElement>(null);
  const take = React.useCallback((W: number, H: number) => setBox((b) => (Math.abs(b.W - W) < 0.001 && Math.abs(b.H - H) < 0.001 ? b : { W, H })), []);
  // the scene is sized before anything is painted or flown to, from a copy of the keycap out of the tilt;
  // then the observer reads the model's own keycap, fractions and all (offsetWidth rounds, and the model must match to the pixel)
  React.useLayoutEffect(() => {
    const key = measure.current?.querySelector<HTMLElement>('.mu-kbd'); if (!key) return;
    const r = key.getBoundingClientRect(); take(r.width / oz, r.height / oz);
  }, [m.glyph, m.size, m.surface, m.pad, m.fontSize, m.track, oz, take]);
  React.useLayoutEffect(() => {
    const key = top.current?.querySelector<HTMLElement>('.mu-kbd'); if (!key) return;
    const ro = new ResizeObserver(([e]) => take(e.borderBoxSize[0].inlineSize, e.borderBoxSize[0].blockSize));
    ro.observe(key);
    return () => ro.disconnect();
  }, [xray, exploded, take]);

  // geometry in points, then scaled
  const W = box.W * S, H = box.H * S;
  const sunk = m.surface === 'sunk';
  const R = sunk ? H / 2 : m.radius * S;
  const flat = pose === 'flat';
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const wallTone = m.surface === 'strip' ? '#1a1a1c' : t.wall;
  const rimTone = tones('graphite');
  const capZ = m.surface === 'default' ? 1 + m.lift * 3 : 6;
  const topZ = sunk ? 1 : capZ + SLICES * 1.4;
  const rimZ = RIM * 1.6;
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const current = SPOTS.find((x) => x.id === spot)!;
  const control = (extra?: Partial<React.ComponentProps<typeof Kbd>>) => <KbdFor m={m} look={look} {...extra} />;
  // the model's face is the keycap laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });

  const Z = exploded ? 6 + (LAYERS[m.surface].length - 1) * 16 : topZ;
  const at: Record<Spot, [number, number, number]> = {
    shape: [R * 0.3, R * 0.3, topZ],
    type: [W / 2, H / 2, topZ + 1],
    surface: [W * 0.85, H * 0.8, 1],
    light: [W / 2, 2, topZ],
    shadow: [W * 0.7, H + 6, 0],
    layers: [W * 0.7, H * 0.3, Z],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        <span ref={measure} className="xr-kbd-measure" aria-hidden inert style={{ zoom: oz }}><KbdFor m={m} look={look} /></span>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: S, cursor: 'zoom-in' }}>{control()}</div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* a raised cap: its shadow on the floor, then a wall of slices under the real keycap */}
              {!exploded && !sunk && (
                <div className="xr-thumb">
                  {on[look.raw.shadows.length] && m.surface === 'default' && <div className="xr-shadow is-drop" style={{ width: W, height: H, borderRadius: R, filter: `blur(${2 + m.lift * 3}px)`, opacity: flat ? 0 : 0.12 + m.lift * 0.05, transform: `translate(${m.lift * 3}px, ${m.lift * 5}px) translateZ(1px)` }} />}
                  {Array.from({ length: SLICES }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: R, transition: `${rise}, opacity .2s`, opacity: flat ? 0 : 1, transform: `translateZ(${flat ? 0 : capZ + i * 1.4}px)`, background: i === 0 || !on[0] ? 'transparent' : wallTone }} />
                  ))}
                </div>
              )}

              {/* a sunk key: a rim that rises from the floor around it */}
              {!exploded && sunk && Array.from({ length: RIM }, (_, i) => (
                <div key={i} className="xr-ring" style={{ width: W, height: H, borderRadius: R, opacity: flat ? 0 : 1, transform: `translateZ(${flat ? 0 : ((i + 1) / RIM) * rimZ}px)`, borderColor: i === RIM - 1 ? rimTone.rim : rimTone.wall }} />
              ))}

              {/* the top: the real keycap */}
              {!exploded && <div ref={top} className="xr-segface is-top" style={face(flat ? 1 : topZ)}>{control()}</div>}

              {spot === 'shape' && !exploded && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${topZ + 1}px)` }} aria-hidden>
                  <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
                  <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{Number(box.H.toFixed(1))}</text>
                  <path d={`M0 ${H + 16}H${W}M0 ${H + 10}V${H + 22}M${W} ${H + 10}V${H + 22}`} />
                  <text x={W / 2} y={H + 34} textAnchor="middle">{Number(box.W.toFixed(1))}</text>
                  {!sunk && R > 2 && <path d={`M${R} 0A${R} ${R} 0 0 0 0 ${R}`} className="is-arc" />}
                  {!sunk && <text x={R + 6} y="-8">r {m.radius}</text>}
                </svg>
              )}

              {exploded && (
                <>
                  <Exploded layers={LAYERS[m.surface]} on={on} fill={look.grad} shadows={look.raw.shadows} w={W} h={H} r={R} z0={6} gap={16} focus={focus} scale={S} />
                  {/* the top copy stays, out of sight, so the layers keep their measure */}
                  <div ref={top} className="xr-segface is-top" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}>{control()}</div>
                </>
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${topZ + 120}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
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

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, glyph: o.glyph }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <KbdSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <KbdCodePanel config={m} />}
    </div></HintLayer>
  );
}
