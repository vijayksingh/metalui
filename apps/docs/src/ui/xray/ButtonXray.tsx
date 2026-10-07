import * as React from 'react';
import { Button, type ButtonCap } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Glyph, alphaK, scalePx, recipeLayers, useFit, type SpotDef } from './kit';
import { ButtonSpecimenCard } from './ButtonSpecimens';
import { ButtonCodePanel } from './ButtonCode';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';

/* ─────────────────────────────────────────────────────────
 * X-RAY · BUTTON
 *
 *   solid       the real button. Click it.
 *   x-ray       an isometric cap hovering over a gridded floor: its top face is the real button
 *               itself, scaled up, standing on a wall of slices; its shadows are cast on the floor.
 *               Flown in, the face and the wall start on one plane (the object that landed), then
 *               the cap rises and thickens.
 *   callouts    icons in two columns with leader lines to the part they explain
 *   play        every part is handled on the specimen in the card, and the model follows live:
 *                 Shape   size (the standard cap steps) · padding · corners
 *                 Light   direction · strength (the sun moves, the lip and gradient follow)
 *                 Type    size · weight · letter spacing
 *                 Shadow  height above the page
 *                 Press   press it; it sinks on the release spring, as far as you set
 *                 Layers  each layer explained for a beginner, and switchable
 *   code        under the card: the React, CSS and SwiftUI for exactly this config (ButtonCode.tsx)
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.button;
const P = RECIPE.props as Record<string, Record<string, unknown>>;
const UI = tokens.foundations.type.ui as { size: number; weight: number; tracking: string };
const OBJECT = tokens.springs.object as { duration: number };
const S = 2.6;
const WALL = 7;

type Spot = 'type' | 'shape' | 'light' | 'shadow' | 'press' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'type', title: 'Type', word: 'The label' },
  { id: 'shape', title: 'Shape', word: 'Size and corners' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'shadow', title: 'Shadow', word: 'Height above the page' },
  { id: 'press', title: 'Press', word: 'What happens when you press' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], shape: ['left', 0.48], type: ['left', 0.76],
  layers: ['right', 0.2], press: ['right', 0.48], shadow: ['right', 0.76],
};

export const LAYERS = [
  { name: 'Fill', kind: 'fill', why: 'The main colour. It is a little lighter at the top, where the light hits. Turn it off and the button has no body.' },
  { name: 'Inner glow', kind: 'inset', why: 'A soft light just inside the edge. It makes the button look like soft plastic instead of flat paint.' },
  { name: 'Top light', kind: 'inset', why: 'A thin bright line on the top edge. It makes the top look rounded, so the button looks like a real object.' },
  { name: 'Rim', kind: 'outer', why: 'A very thin outline. It keeps the edge sharp when the background is almost the same colour as the button.' },
  { name: 'Contact', kind: 'outer', why: 'A small dark shadow right under the edge. It shows the button is sitting on the page. Without it, the button seems to float.' },
  { name: 'Drop', kind: 'outer', why: 'A bigger, softer shadow. It shows how high the button is. A bigger, blurrier shadow looks higher.' },
] as const;

/** Everything a button is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface ButtonConfig {
  /** props */
  label: string; cap: ButtonCap; icon: IconName | 'none'; disabled: boolean;
  /** recipe values: --mu-r-button-<size>-height, -pad, --mu-r-button-self-travel; the corners by the button's own style */
  h: number; padAuto: boolean; pad: number; corners: number; travel: number;
  /** the label's type, by the button's own style: changed, it leaves the ui type role */
  fontSize: number; weight: number; track: number;
  /** the fill and shadow stack, as a light, a height above the page and which layers are on */
  lightDeg: number; lightK: number; lift: number; on: boolean[];
}
export type Model = ButtonConfig;

export type SizeName = 'default' | 'compact';
/** The two real sizes: the regular cap and the compact one, each with its own type. */
export const SIZES: Record<SizeName, { h: number; pad: number; type: { fontSize: number; weight: number; track: number } }> = {
  default: { h: Number(P.self.height), pad: Number(P.self.pad), type: { fontSize: UI.size, weight: UI.weight, track: parseFloat(UI.tracking) } },
  compact: { h: Number(P.compact.height), pad: Number(P.compact.pad), type: parseFont(String(P.compact.font), String(P.compact.tracking)) },
};
function parseFont(font: string, tracking: string) {
  const [, weight, size] = font.match(/^(\d+)\s+([\d.]+)px/) ?? [];
  return { fontSize: Number(size), weight: Number(weight), track: parseFloat(tracking) || 0 };
}
export const INITIAL: ButtonConfig = {
  label: 'Get started', cap: 'primary', icon: 'none', disabled: false,
  h: SIZES.default.h, padAuto: true, pad: SIZES.default.pad, corners: 1, travel: Number(P.self.travel),
  ...SIZES.default.type,
  lightDeg: 0, lightK: 1, lift: 1, on: LAYERS.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

/** Only the standard cap comes in two sizes; its size is read off the height. Every other cap has one. */
export const sizeOf = (m: ButtonConfig): SizeName => m.cap === 'standard' && m.h <= (SIZES.compact.h + SIZES.default.h) / 2 ? 'compact' : 'default';
/** Automatic padding is the recipe's at a real size, and half the height less one between them. */
export const autoPad = (m: ButtonConfig) => { const s = sizeOf(m); return m.h === SIZES[s].h ? SIZES[s].pad : m.h / 2 - 1; };
export const padOf = (m: ButtonConfig) => (m.padAuto ? autoPad(m) : m.pad);
export const radiusOf = (m: ButtonConfig) => (m.h / 2) * m.corners;
/** The recipe part the cap draws its fill and shadows from. */
export const partOf = (m: ButtonConfig) => (m.cap === 'standard' ? (sizeOf(m) === 'compact' ? 'compact' : 'self') : m.cap);
const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the cap's fill and shadow stack for the model's parts, and the values
 *  that set the real button to it. Only what differs from the recipe is set, so a default config is
 *  the button exactly as it ships, and the style is the overrides its code needs. */
export function buttonLook(m: ButtonConfig, colorway: Colorway) {
  const size = sizeOf(m), part = partOf(m);
  const recipe = recipeLayers('button', part, colorway);
  const sh = recipe.shadows;
  const fill = m.on[0] ? `linear-gradient(${180 + m.lightDeg}deg, ${recipe.stops.join(', ')})` : 'transparent';
  const layers = [
    m.on[1] && sh[0] ? alphaK(sh[0], m.lightK) : null,
    m.on[2] && sh[1] ? alphaK(sh[1], m.lightK) : null,
    m.on[3] ? sh[2] ?? null : null,
    m.on[4] && sh[3] && m.lift > 0 ? scalePx(sh[3], Math.min(m.lift, 1.5)) : null,
    m.on[5] && sh[4] && m.lift > 0 ? scalePx(sh[4], m.lift) : null,
  ].filter(Boolean) as string[];
  const shadow = layers.join(', ') || 'none';
  const pad = padOf(m), radius = radiusOf(m);
  const sz = size === 'compact' ? 'compact' : 'self';
  const type = SIZES[size].type;
  const lit = m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK;
  const style: Record<string, string | number> = {};
  if (m.h !== SIZES[size].h) style[`--mu-r-button-${sz}-height`] = `${m.h}px`;
  if (pad !== SIZES[size].pad) style[`--mu-r-button-${sz}-pad`] = `${pad}px`;
  if (m.travel !== INITIAL.travel) style['--mu-r-button-self-travel'] = `${m.travel}px`;
  if (m.corners !== 1) style.borderRadius = Math.round(radius * 10) / 10;
  if (m.fontSize !== type.fontSize) style.fontSize = m.fontSize;
  if (m.weight !== type.weight) style.fontWeight = m.weight;
  if (m.track !== type.track) style.letterSpacing = `${m.track}em`;
  // a fill changes with the light or its own layer; the shadow stack with the light, the height or any of its layers
  if (lit || !m.on[0]) style[`--mu-r-button-${part}-background`] = fill;
  if (lit || m.lift !== INITIAL.lift || !same(m.on.slice(1), INITIAL.on.slice(1))) style[`--mu-r-button-${part}-shadow`] = shadow;
  return { colorway, recipe, size, part, pad, radius, fill, shadow, stops: recipe.stops, shadows: sh, style: style as React.CSSProperties };
}
export function useButtonLook(m: ButtonConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => buttonLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useButtonLook>;

/** The button set to a config: the table object, the model's face and the specimens are all this. */
export function ConfiguredButton({ m, look, style, children, ...rest }: { m: ButtonConfig; look: Look } & React.ComponentProps<typeof Button>) {
  return (
    <Button cap={m.cap} size={sizeOf(m)} disabled={m.disabled} icon={m.icon !== 'none' ? <Icon name={m.icon} /> : undefined} style={{ ...look.style, ...style }} {...rest}>
      {children ?? m.label}
    </Button>
  );
}

export function ButtonXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1, model, setModel, onReset }: XrayViewProps<ButtonConfig> & {
  /** The Button page's workbench drives the x-ray: its config, and where a change goes. */
  model?: ButtonConfig; setModel?: (patch: Partial<ButtonConfig>) => void; onReset?: () => void;
}) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('shape');
  const [localModel, setLocalModel] = React.useState<ButtonConfig>(() => ({ ...INITIAL, ...seed }));
  const m = model ?? localModel;
  const [pressed, setPressed] = React.useState(false);
  const [focusLayer, setFocusLayer] = React.useState<number | null>(null);
  const set = React.useCallback((patch: Partial<ButtonConfig>) => (setModel ? setModel(patch) : setLocalModel((old) => ({ ...old, ...patch }))), [setModel]);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useButtonLook(m);
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const exploded = spot === 'layers';
  // the model's box, read off the real button on its top face, in its own points
  const [box, setBox] = React.useState({ W: 0, H: 0 });
  React.useLayoutEffect(() => {
    const el = top.current; if (!el) return;
    const read = () => { const b = el.querySelector<HTMLElement>('.mu-button'); if (b) setBox({ W: b.offsetWidth, H: b.offsetHeight }); };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, exploded]);

  const W = box.W * S, HH = box.H * S, R = look.radius * S;
  const flat = pose === 'flat';
  const hover = flat ? 0 : 18 + m.lift * 14 - (pressed ? 12 * m.travel : 0);
  const fit = useFit(bench, W, HH, xray);
  // coloured caps: the wall is the face's bottom colour in shade; the ink is the cap's own, which flips per colorway
  const faceBottom = (look.stops.at(-1) ?? '').replace(/\s+[\d.]+%$/, '');
  const wallTone = m.cap !== 'standard' ? `color-mix(in srgb, ${faceBottom} 78%, #000)` : look.colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';
  const lightAt = (m.lightDeg * Math.PI) / 180;
  const lipX = -Math.sin(lightAt) * 3, lipY = Math.cos(lightAt) * 3;
  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's face is the button laid out at the object's own zoom, then scaled: the same box, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const press = {
    onPointerDown: () => setPressed(true), onPointerUp: () => setPressed(false), onPointerCancel: () => setPressed(false), onPointerLeave: () => setPressed(false),
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === ' ' || event.key === 'Enter') setPressed(true); }, onKeyUp: () => setPressed(false),
  };

  return (
    <HintLayer>
    <div className="xr button-xray" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      {onReset && <div className="button-xray-toolbar" role="group" aria-label="Button view">
        <button type="button" className="status" aria-pressed={!xray} onClick={() => setXray(false)}>Preview</button>
        <button type="button" className="status" aria-pressed={xray} onClick={() => setXray(true)}>X-ray</button>
      </div>}
      <div className="xr-bench" ref={bench}>
        {!xray && (
          <div className="xr-solid" style={{ zoom: S, transform: `translateY(${(1 - m.lift) * 4}px)`, filter: m.lift > 1 ? `drop-shadow(0 ${(m.lift - 1) * 2}px ${(m.lift - 1) * 3}px rgba(0,0,0,.18))` : undefined }}>
            <ConfiguredButton m={m} look={look} onClick={onReset ? undefined : () => setXray(true)} aria-label={onReset ? m.label || 'Button preview' : `${m.label}: open the x-ray`} {...press} />
          </div>
        )}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: HH * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: HH, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />
              {m.on[5] && <div className="xr-shadow is-drop" style={{ width: W, height: HH, borderRadius: R, filter: `blur(${4 + hover * 0.35}px)`, opacity: flat ? 0 : Math.max(0.16, 0.42 - hover * 0.004), transform: `translate(${hover * 0.25}px, ${hover * 0.45}px)` }} />}
              {m.on[4] && <div className="xr-shadow is-contact" style={{ width: W, height: HH, borderRadius: R, filter: `blur(${1 + hover * 0.06}px)`, opacity: flat ? 0 : Math.max(0.08, 0.5 - hover * 0.012) }} />}

              <div className="xr-cap" style={{ transform: `translateZ(${hover}px)` }}>
                {Array.from({ length: WALL }, (_, i) => (
                  <div key={i} className="xr-slice" style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${flat ? 0 : i * 1.6}px)`, opacity: flat ? 0 : 1, background: i === 0 || !m.on[0] ? 'transparent' : wallTone }} />
                ))}
                {exploded
                  ? <>
                      {LAYERS.map((l, i) => (
                        <div key={l.name} className={['xr-face is-layer', focusLayer === i ? 'is-focus' : '', m.on[i] ? '' : 'is-off'].join(' ')} style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${WALL * 1.6 + i * 17}px)`, background: i === 0 ? look.fill : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(look.shadows[i - 1] ?? '', S) }}>
                          <span className="xr-tag eng">{l.name}</span>
                        </div>
                      ))}
                      {/* the face stays, out of sight, so the layers keep their measure */}
                      <div ref={top} className="xr-segface is-top" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}><ConfiguredButton m={m} look={look} tabIndex={-1} /></div>
                    </>
                  : (
                    <>
                      {/* the top face: the real button, raised on its wall; press it and the model sinks */}
                      <div ref={top} className="xr-segface is-top" style={face(flat ? 1 : WALL * 1.6)}><ConfiguredButton m={m} look={look} {...press} /></div>
                      {/* the measures and the baseline belong to the open model, not to the object that landed */}
                      {spot === 'shape' && !flat && (
                        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${HH + 80}`} style={{ width: W + 80, height: HH + 80, left: -40, top: -40, transform: `translateZ(${WALL * 1.6 + 1}px)` }} aria-hidden>
                          <path d={`M-18 0V${HH}M-24 0H-12M-24 ${HH}H-12`} />
                          <text x="-28" y={HH / 2} textAnchor="end" dominantBaseline="middle">{m.h}</text>
                          <path d={`M0 ${HH + 16}H${look.pad * S}M0 ${HH + 10}V${HH + 22}M${look.pad * S} ${HH + 10}V${HH + 22}`} />
                          <text x={(look.pad * S) / 2} y={HH + 34} textAnchor="middle">{Number(look.pad.toFixed(1))}</text>
                          {R > 2 && <path d={`M${R} 0A${R} ${R} 0 0 0 0 ${R}`} className="is-arc" />}
                          <text x={R + 8} y={-8}>r {Number(look.radius.toFixed(1))}</text>
                        </svg>
                      )}
                      {spot === 'type' && !flat && <span className="xr-baseline" style={{ width: W * 0.72, left: W * 0.14, top: HH * 0.64, transform: `translateZ(${WALL * 1.6 + 1}px)` }} />}
                    </>
                  )}
                {spot === 'light' && m.lightK > 0 && !flat && (
                  <div className="xr-lip" style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${WALL * 1.6 + 0.5}px)`, boxShadow: `inset ${lipX * S}px ${lipY * S}px 0 -1px rgba(255,255,255,${(0.95 * Math.min(1, m.lightK)).toFixed(2)}), inset ${lipX * S * 2}px ${lipY * S * 2}px 14px -8px rgba(255,236,190,${(0.9 * Math.min(1, m.lightK)).toFixed(2)})` }} />
                )}
              </div>

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin(lightAt) * (W * 0.7)}px, ${HH / 2 - Math.cos(lightAt) * (HH * 1.6)}px, ${hover + 150}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  type: [W * 0.5, HH * 0.45, hover + WALL * 1.6 + 2],
                  shape: [Math.min(R * 0.4, W * 0.08) + 2, HH * 0.5, hover + WALL * 1.6],
                  light: [W * 0.35, HH * 0.06, hover + WALL * 1.6 + 1],
                  shadow: [W * 0.55, HH * 1.25, 0],
                  press: [W * 0.9, HH * 0.9, hover + WALL * 0.8],
                  layers: [W * 0.78, HH * 0.3, hover + WALL * 1.6 + (exploded ? 80 : 6)],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, pressed, box, fit]} />}
        <div className="xr-hint eng">{xray ? onReset ? 'Pick a part to inspect. Tune below or beside the model.' : 'Pick an icon to learn about that part' : onReset ? 'Press and hold. Switch to X-ray to inspect the same button.' : 'Click the button to see inside it'}</div>
        {!onReset && xray && <div className="xr-actions">
          <button type="button" className="status" onClick={() => setLocalModel((o) => ({ ...INITIAL, label: o.label, cap: o.cap, icon: o.icon, disabled: o.disabled }))}><span className="led off" />Reset</button>
          <button type="button" className="status" onClick={() => setXray(false)}><span className="led" />Solid</button>
        </div>}
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          {/* the card holds the real button to handle (a specimen); the model on the bench reads the same config */}
          <ButtonSpecimenCard spot={spot} m={m} set={set} look={look} setPressed={setPressed} setFocusLayer={setFocusLayer} />
        </div>
      )}
      {xray && <ButtonCodePanel config={m} />}
    </div>
    </HintLayer>
  );
}
