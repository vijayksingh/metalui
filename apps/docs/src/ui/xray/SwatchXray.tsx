import * as React from 'react';
import { Swatch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, capTop, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { SwatchSpecimenCard } from './SwatchSpecimens';
import { SwatchCodePanel } from './SwatchCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SWATCH
 *
 *   solid     the real chip. Open the x-ray.
 *   x-ray     a thick glossy chip in its own colour on the gridded floor. Its top face is the
 *             real Swatch, laid out at the table's zoom and scaled by transform, so its label,
 *             dimple, sheen and edges are the object's own. Under it, a wall of slices and the
 *             shadows it casts on the floor. Flown in, every part starts on one plane (the
 *             object that landed), then opens.
 *   play      Shape   size · corners
 *             Type    the colour (turn it) · the engraved name or the colour code
 *             Light   one light: its direction and the shine
 *             Dimple  the small hole
 *             Shadow  how far the coloured shadow spreads
 *             Layers  the seven layers, each switchable
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (SwatchCode.tsx)
 * ───────────────────────────────────────────────────────── */

const R = tokens.recipes.swatch as { props: { self: { size: number; radius: number }; label: { font: string; tracking: string; x: number; y: number; 'ink-dark': string; 'ink-light': string }; led: { size: number; inset: number } }; layers: { part: string; prop: string; value: string }[] };
const P = R.props;
const S = 3;
const WALL = 5;
const SELF_LAYERS = R.layers.filter((l) => l.part === 'self');
/** The recipe's own words: `self` is the object's colour, which the library resolves through --mu-self. */
const own = (v: string) => v.replace(/(?<![\w-])self(?:\/([\d.]+))?(?![\w-])/g, (_, a) => `color-mix(in srgb, var(--mu-self) ${+((a !== undefined ? +a : 1) * 100).toFixed(2)}%, transparent)`);
const SHEEN = SELF_LAYERS.find((l) => l.prop === 'background' && l.value !== 'self')!.value;
const COLOUR = own(SELF_LAYERS.find((l) => l.prop === 'background' && l.value === 'self')!.value);
const SHADOWS = SELF_LAYERS.filter((l) => l.prop === 'shadow').map((l) => own(l.value));
const SHEEN_ANGLE = Number(SHEEN.match(/linear-gradient\(([\d.]+)deg/)?.[1]);
/** The coloured drop is the last shadow; the contact is the one before it. */
const DROP = SHADOWS.length - 1;
/** What the chip engraves when it is given a name: the table's chip is called this. */
export const NAME = 'Colour';

type Spot = 'shape' | 'type' | 'light' | 'well' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'shape', title: 'Shape', word: 'Size and corners' },
  { id: 'type', title: 'Type', word: 'The engraved label' },
  { id: 'light', title: 'Light', word: 'The shine' },
  { id: 'well', title: 'Dimple', word: 'The small hole' },
  { id: 'shadow', title: 'Shadow', word: 'A shadow in its own colour' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  type: ['left', 0.2], light: ['left', 0.48], shape: ['left', 0.76],
  well: ['right', 0.2], layers: ['right', 0.48], shadow: ['right', 0.76],
};

export const LAYERS: LayerDef[] = [
  { name: 'Colour', why: 'The chip is made of its own colour, all the way through. The sides are the same colour, only darker.' },
  { name: 'Shine', why: 'A see-through white fade from the top left corner. It makes the chip look hard and glossy, like a sweet or a plastic tile.' },
  { name: 'Top edge', why: 'A thin bright line along the top. It shows the top edge is rounded and catches the light.' },
  { name: 'Bottom edge', why: 'A thin dark line along the bottom, where the chip turns away from the light.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge, so the colour looks lit from within the plastic.' },
  { name: 'Contact', why: 'A small grey shadow right under the chip. It shows the chip is sitting on the page.' },
  { name: 'Coloured drop', why: 'A big soft shadow in the chip\'s own colour. Light passing through coloured plastic makes a coloured shadow, so this makes it look real.' },
];

/** Everything a swatch is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface SwatchConfig {
  /** props: the colour, and what is engraved (undefined engraves the colour code) */
  hex: string; label?: string;
  /** recipe values: --mu-r-swatch-self-size, -radius and -led-size (as a share of the recipe's) */
  size: number; radius: number; dimple: number;
  /** the shine, the light's direction and strength, and the coloured shadow's blur (as a share of the recipe's) */
  sheen: number; lightDeg: number; lightK: number; lift: number;
  /** which of the seven layers are on */
  on: boolean[];
}
export type Model = SwatchConfig;
export const INITIAL: SwatchConfig = {
  hex: '#FF6B3D', label: NAME, size: P.self.size, radius: P.self.radius, dimple: 1,
  sheen: 1, lightDeg: 0, lightK: 1, lift: 1, on: LAYERS.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(tokens.springs.object.duration * 1000 * 0.55);

const rgb = (hex: string) => { const v = hex.replace('#', ''); const n = parseInt(v.length === 3 ? v.replace(/./g, '$&$&') : v, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const shade = (hex: string, k: number) => `rgb(${rgb(hex).map((c) => Math.round(c * k)).join(',')})`;
const num = (n: number, digits: number) => `${+n.toFixed(digits)}`;

/** Turns a shadow's offset to follow the light (0° is straight above) and scales its strength; as written, when neither changes. */
function aimed(v: string, deg: number, k: number) {
  if (deg === 0 && k === 1) return v;
  const a = (deg * Math.PI) / 180;
  const lit = k === 1 ? v : v.replace(/rgba\(([^)]*),\s*([\d.]+)\)/g, (_, c, alpha) => `rgba(${c},${num(Math.min(1, Number(alpha) * k), 3)})`);
  if (deg === 0) return lit;
  return lit.replace(/^(inset\s+)?(-?[\d.]+)(px)?\s+(-?[\d.]+)(px)?/, (_, inset = '', x, _u1, y) => {
    const X = Number(x) * Math.cos(a) - Number(y) * Math.sin(a), Y = Number(x) * Math.sin(a) + Number(y) * Math.cos(a);
    return `${inset}${num(X, 2)}px ${num(Y, 2)}px`;
  });
}

/** The chip's fill and its five shadows for a config, in the library's own words (--mu-self for its colour). */
function stacks(m: SwatchConfig) {
  const sheen = m.lightDeg === 0 && m.sheen === 1 ? SHEEN : SHEEN
    .replace(`${SHEEN_ANGLE}deg`, `${SHEEN_ANGLE + m.lightDeg}deg`)
    .replace(/rgba\(255,255,255,(\.\d+)\)/, (_, a) => `rgba(255,255,255,${num(Number(a) * m.sheen, 3)})`);
  const stack = SHADOWS.map((v, i) => {
    // the light turns every shadow and strengthens the three on the chip's own edge; the lift is the drop's blur
    const lit = aimed(v, m.lightDeg, i < 3 ? m.lightK : 1);
    return i === DROP && m.lift !== 1 ? lit.replace(/^((?:inset\s+)?\S+\s+\S+\s+)([\d.]+)px/, (_, head, blur) => `${head}${num(Number(blur) * m.lift, 2)}px`) : lit;
  });
  const background = [m.on[1] ? sheen : null, m.on[0] ? COLOUR : null].filter(Boolean).join(', ') || 'transparent';
  const shadow = stack.filter((_, i) => m.on[i + 2]).join(', ') || 'none';
  return { sheen, stack, background, shadow };
}
const BASE = stacks(INITIAL);

/** What a config looks like: the fills and shadows for the model's hand-built parts, and the variables
 *  that set the real chip to it. Only what differs from the recipe is set, so a default config is the
 *  chip exactly as it ships, and the variables are the overrides its code needs. */
export function swatchLook(m: SwatchConfig, colorway: Colorway) {
  const s = stacks(m);
  const style: Record<string, string> = {};
  if (m.size !== INITIAL.size) style['--mu-r-swatch-self-size'] = `${m.size}px`;
  if (m.radius !== INITIAL.radius) style['--mu-r-swatch-self-radius'] = `${m.radius}px`;
  if (m.dimple !== INITIAL.dimple) style['--mu-r-swatch-led-size'] = `${num(P.led.size * m.dimple, 2)}px`;
  if (s.background !== BASE.background) style['--mu-r-swatch-self-background'] = s.background;
  if (s.shadow !== BASE.shadow) style['--mu-r-swatch-self-shadow'] = s.shadow;
  return { colorway, ...s, wall: m.on[0] ? shade(m.hex, 0.72) : 'transparent', style: style as React.CSSProperties };
}
export function useSwatchLook(m: SwatchConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => swatchLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useSwatchLook>;

export function SwatchXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<SwatchConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('shadow');
  const [m, setM] = React.useState<SwatchConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<SwatchConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useSwatchLook(m);
  const bench = React.useRef<HTMLDivElement>(null);

  // the chip is a square of its recipe size, so its box is known; scaled for the model
  const W = m.size * S, H = m.size * S, Rr = m.radius * S;
  const flat = pose === 'flat';
  const exploded = spot === 'layers' && !flat;
  const z = m.lift * 4;
  const top = capTop(z, WALL);
  const fit = useFit(bench, W, H, xray);
  const led = P.led.size * m.dimple * S, ledX = W - P.led.inset * S - led, ledY = P.led.inset * S;

  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's face is the chip laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (zz: number) => ({ transform: `translateZ(${zz}px) scale(${S / oz})`, zoom: oz });
  // risen, the face keeps its own edges; the shadows it casts go down on the floor
  const faceStyle = flat ? look.style : { ...look.style, ['--mu-r-swatch-self-shadow' as string]: look.stack.filter((_, i) => i < 3 && m.on[i + 2]).join(', ') || 'none' };
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const anchors: Record<Spot, [number, number, number]> = {
    shape: [Rr * 0.3, H - Rr * 0.3, top],
    type: [P.label.x * S + 30, H - P.label.y * S - 10, top + 1],
    light: [W * 0.3, H * 0.35, top],
    well: [ledX + led / 2, ledY + led / 2, top],
    shadow: [W * 0.9, H + 20, 0],
    layers: exploded ? [W * 0.8, H * 0.2, 4 + (LAYERS.length - 1) * 22] : [W * 0.7, H * 0.7, top],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 2.2, cursor: 'zoom-in' }}><Swatch hex={m.hex} label={m.label} style={look.style} /></div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})`, ['--mu-self' as string]: m.hex }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the shadows it casts on the floor: they appear as the model opens */}
              {!exploded && m.on[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: Rr, background: m.hex, transition: 'opacity .3s', filter: `blur(${10 + m.lift * 8}px)`, opacity: flat ? 0 : 0.55, transform: `translate(${m.lift * 6}px, ${m.lift * 12}px)` }} />}
              {!exploded && m.on[5] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: Rr, transition: 'opacity .3s', filter: 'blur(2px)', opacity: flat ? 0 : 0.18 }} />}

              {/* the chip's side wall: slices that rise from the floor to the face */}
              {!exploded && (
                <div className="xr-thumb">
                  {Array.from({ length: WALL }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: Rr, transition: rise, transform: `translateZ(${flat ? 0 : z + i * 1.4}px)`, background: i === 0 || flat ? 'transparent' : look.wall }} />
                  ))}
                </div>
              )}

              {/* the top: the real chip */}
              {!exploded && (
                <div className="xr-segface is-top" aria-hidden inert style={face(flat ? 1 : top)}><Swatch hex={m.hex} label={m.label} style={faceStyle} /></div>
              )}

              {spot === 'shape' && !exploded && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${top + 1}px)` }} aria-hidden>
                  <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
                  <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{m.size}</text>
                  {Rr > 2 && <path d={`M${Rr} 0A${Rr} ${Rr} 0 0 0 0 ${Rr}`} className="is-arc" />}
                  <text x={Rr + 6} y={-8}>r {m.radius}</text>
                </svg>
              )}

              {exploded && (
                <Exploded layers={LAYERS} on={m.on} fill={COLOUR} backgrounds={[COLOUR, look.sheen]} shadows={['none', ...look.stack]} w={W} h={H} r={Rr} z0={4} gap={22} focus={focus} scale={S} />
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${top + 120}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const [x, y, zz] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${zz}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, hex: o.hex, label: o.label }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <SwatchSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <SwatchCodePanel config={m} />}
    </div></HintLayer>
  );
}
