import * as React from 'react';
import { Field, Kbd } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, NARROW, aim, alphaK, recipeLayers, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { FieldSpecimenCard } from './FieldSpecimens';
import { FieldCodePanel } from './FieldCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · FIELD
 *
 *   solid     the real field. Type in it, then open the x-ray.
 *   x-ray     a wide shallow tray on the gridded floor with a raised rim. Three planes are the real
 *             field itself, scaled up: one with only its tray (the glyph, the words and the key hidden),
 *             one with the glyph and the words, one with only the key, which stands up on a wall of its own.
 *             Flown in, all start on one plane (the object that landed), then part.
 *   card      a real field you handle (FieldSpecimens), reading the same config as the bench:
 *             Well    drag its bottom edge for depth
 *             Type    type in it; the caret switches on and off
 *             Key     the key at the end switches on and off
 *             Shape   top edge for height, the corner, the glyph for the space on the left
 *             Light   the sun on its arc
 *             Layers  a switch per tray and key layer
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (FieldCode.tsx)
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.field.props.field as { height: number; radius: number; 'pad-left': number; 'pad-right': number; gap: number; glyph: number };
const K = tokens.recipes.kbd.props.self as { height: number; min: number; radius: number };
const OBJECT = tokens.springs.object as { duration: number };
/** The field on the floating table is this wide, and the x-ray's face is laid out at the same width. */
export const FIELD_WIDTH = 230;
/** What the field says before there is anything in it. */
export const PLACEHOLDER = 'Lens or action';
const S = 2;
const RIM = 5;
const WALL = 4;

export type Spot = 'well' | 'type' | 'surface' | 'shape' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'well', title: 'Well', word: 'The tray you type in' },
  { id: 'type', title: 'Type', word: 'Text, hint and caret' },
  { id: 'surface', title: 'Key', word: 'A raised key inside' },
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], type: ['left', 0.48], shape: ['left', 0.76],
  surface: ['right', 0.2], layers: ['right', 0.48], well: ['right', 0.76],
};

export const TRAY: LayerDef[] = [
  { name: 'Tray fill', why: 'The colour inside the field. Darker at the top and lighter at the bottom, because it goes down into the page.' },
  { name: 'Inner shadow', why: 'A soft shadow inside the top edge. It says "this is a hole you can put something in".' },
  { name: 'Edge line', why: 'A very thin outline so the field keeps its edge on a light page.' },
  { name: 'Bottom light', why: 'A thin bright line on the bottom edge, where light hits the far wall.' },
];
export const KEY: LayerDef[] = [
  { name: 'Key fill', why: 'The key is lighter than the tray, because it stands up into the light.' },
  { name: 'Inner glow', why: 'A soft light just inside the key\'s edge.' },
  { name: 'Top light', why: 'A bright line on the key\'s top left edge.' },
  { name: 'Rim', why: 'A thin outline around the key.' },
  { name: 'Contact', why: 'A small shadow where the key sits on the tray floor.' },
  { name: 'Drop', why: 'A soft shadow that shows the key stands up out of the tray.' },
];

/** Everything a field is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface FieldConfig {
  /** props: what is typed in it, and whether the key sits at its end (a Field.Trail holding a Kbd) */
  value: string; showKey: boolean;
  /** recipe values: --mu-r-field-field-*; the caret is --mu-r-field-field-caret, on or clear */
  h: number; radius: number; padL: number; caret: boolean;
  /** the tray's and the key's shadow stacks, as a depth, a light and which layers are on */
  depth: number; lightDeg: number; lightK: number; tray: boolean[]; key: boolean[];
}
export type Model = FieldConfig;
export const INITIAL: FieldConfig = {
  value: '', showKey: true,
  h: P.height, radius: P.radius, padL: P['pad-left'], caret: true,
  depth: 1, lightDeg: 0, lightK: 1, tray: TRAY.map(() => true), key: KEY.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);
const stops = (fill: string) => (fill.match(/linear-gradient\((.*)\)/)?.[1] ?? fill).split(/,(?![^(]*\))/).map((x) => x.trim());

/** The well recipe's field state: the tray's fill and shadows for a colorway, in recipe order. */
function trayLayers(colorway: Colorway) {
  const ls = (tokens.recipes.well as { layers: { part: string; prop: string; value: string; colorway?: string; state?: string }[] }).layers
    .filter((l) => l.part === 'self' && l.state === 'field' && (!l.colorway || l.colorway === colorway));
  const fill = ls.find((l) => l.prop === 'background')?.value ?? 'transparent';
  return { fill, stops: stops(fill), shadows: ls.filter((l) => l.prop === 'shadow').map((l) => l.value) };
}

/** What a config looks like: the tray's and key's fill and shadows for the model's parts, and the
 *  variables that set the real field to it. Only what differs from the recipe is set, so a default
 *  config is the field exactly as it ships, and the variables are the overrides its code needs. */
export function fieldLook(m: FieldConfig, colorway: Colorway) {
  const tray = trayLayers(colorway);
  const key = recipeLayers('kbd', 'self', colorway);
  const grad = (s: string[]) => `linear-gradient(${180 + m.lightDeg}deg, ${s.join(', ')})`;
  const trayShadows = tray.shadows.map((v, i) => (m.tray[i + 1] ? aim(i === 0 ? alphaK(v, m.depth) : v, m.lightDeg, m.lightK) : null));
  const keyShadows = key.shadows.map((v, i) => (m.key[i + 1] ? aim(v, m.lightDeg, m.lightK) : null));
  const look = {
    colorway, trayRaw: tray, keyRaw: key,
    trayFill: m.tray[0] ? grad(tray.stops) : 'transparent',
    keyFill: m.key[0] ? grad(key.stops) : 'transparent',
    trayShadow: trayShadows.filter(Boolean).join(', ') || 'none',
    keyShadow: keyShadows.filter(Boolean).join(', ') || 'none',
  };
  const lit = m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK;
  const style: Record<string, string> = {};
  if (m.h !== INITIAL.h) style['--mu-r-field-field-height'] = `${m.h}px`;
  if (m.radius !== INITIAL.radius) style['--mu-r-field-field-radius'] = `${m.radius}px`;
  if (m.padL !== INITIAL.padL) style['--mu-r-field-field-pad-left'] = `${m.padL}px`;
  if (!m.caret) style['--mu-r-field-field-caret'] = 'transparent';
  // a fill changes with the light or its own layer; a shadow stack with the light, its depth, or any of its layers
  if (lit || !m.tray[0]) style['--mu-r-well-self-field-background'] = look.trayFill;
  if (lit || m.depth !== INITIAL.depth || !same(m.tray.slice(1), INITIAL.tray.slice(1))) style['--mu-r-well-self-field-shadow'] = look.trayShadow;
  // with no key in the field there is nothing for its variables to reach
  if (m.showKey) {
    if (lit || !m.key[0]) style['--mu-r-kbd-self-background'] = look.keyFill;
    if (lit || !same(m.key.slice(1), INITIAL.key.slice(1))) style['--mu-r-kbd-self-shadow'] = look.keyShadow;
  }
  return { ...look, style: style as React.CSSProperties };
}
export function useFieldLook(m: FieldConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => fieldLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useFieldLook>;

/** The real field, as the table has it and the model's faces do: set to a config, in the width the table gives it. */
export function FieldFace({ m, look, onValue, inert, still, width = FIELD_WIDTH }: { m: FieldConfig; look: Look; onValue?: (value: string) => void; inert?: boolean; still?: boolean; width?: number | string }) {
  // a still field has no transition, so a value dragged under the finger is never chased
  const none = still ? { transition: 'none' } : undefined;
  return (
    <span className="xr-field-vars" style={{ ...look.style, width }}>
      <Field className={still ? 'ed-field' : undefined} style={{ width: '100%', ...none }}>
        <Field.Icon><Icon name="search" size={P.glyph} /></Field.Icon>
        <Field.Input placeholder={PLACEHOLDER} aria-label={PLACEHOLDER} value={m.value} readOnly={inert || !onValue} tabIndex={inert ? -1 : undefined} onChange={(e) => onValue?.(e.target.value)} />
        {m.showKey && <Field.Trail><Kbd style={none}>⌘K</Kbd></Field.Trail>}
      </Field>
    </span>
  );
}

/** The real field's box and its key, in its own points, read off the model's words plane. */
interface Box { W: number; H: number; kx: number; ky: number; kw: number; kh: number }

export function FieldXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<FieldConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('type');
  const [m, setM] = React.useState<FieldConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<FieldConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useFieldLook(m);
  const exploded = spot === 'layers';
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box>({ W: 0, H: 0, kx: 0, ky: 0, kw: 0, kh: 0 });
  React.useLayoutEffect(() => {
    const el = top.current; if (!el) return;
    const read = () => {
      const field = el.querySelector<HTMLElement>('.mu-field'), key = field?.querySelector<HTMLElement>('.mu-kbd');
      // a plane that has gone, or one not laid out yet, measures nothing
      if (!field || !field.offsetWidth) return;
      setBox({ W: field.offsetWidth, H: field.offsetHeight, kx: key?.offsetLeft ?? 0, ky: key?.offsetTop ?? 0, kw: key?.offsetWidth ?? 0, kh: key?.offsetHeight ?? 0 });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, exploded, m.h, m.radius, m.padL, m.showKey, m.value]);

  // geometry in points, then scaled
  const W = box.W * S, H = box.H * S, R = m.radius * S;
  const kx = box.kx * S, ky = box.ky * S, kw = box.kw * S, kh = box.kh * S, kr = K.radius * S;
  const flat = pose === 'flat';
  const rimZ = RIM * m.depth * 1.6;
  const keyZ = 1;
  const keyTop = keyZ + WALL * 1.4;
  // a narrow bench pads the scene 40 px a side, which the shared fit does not count: the field is long, so leave that room
  const [narrow, setNarrow] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = bench.current; if (!el) return;
    const read = () => setNarrow(el.clientWidth < NARROW);
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fit = useFit(bench, W, H, xray) * (narrow ? 0.78 : 1);
  const wallTone = look.colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';
  const rimTone = look.colorway === 'graphite' ? '#2a2a2d' : '#f4f3ef';
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's faces are the field laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const setValue = React.useCallback((value: string) => set({ value }), [set]);

  const anchors: Record<Spot, [number, number, number]> = {
    well: [W * 0.5, H * 0.85, 1],
    type: [(m.padL + P.glyph + P.gap + 40) * S, H * 0.5, 1],
    surface: m.showKey ? [kx + kw * 0.5, ky + kh * 0.3, exploded ? 1 + TRAY.length * 14 + 10 + (KEY.length - 1) * 14 : keyTop] : [W - 28 * S, H * 0.5, 1],
    shape: [R * 0.3, H - R * 0.3, rimZ],
    light: [W * 0.3, 1, rimZ],
    layers: exploded ? [W * 0.2, H * 0.3, 1 + (TRAY.length - 1) * 14] : [W * 0.72, H * 0.75, 1],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" style={{ zoom: 1.5 }}><FieldFace m={m} look={look} onValue={setValue} /></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the well: the real field on the floor, its glyph, words and key hidden; a rim that rises from the floor around it */}
              {!exploded && (
                <>
                  <div className="xr-segface is-fwell" aria-hidden inert style={face(0.5)}><FieldFace m={m} look={look} inert /></div>
                  {Array.from({ length: RIM }, (_, i) => (
                    <div key={i} className="xr-ring" style={{ width: W, height: H, borderRadius: R, transform: `translateZ(${flat ? 0 : ((i + 1) / RIM) * rimZ}px)`, borderColor: i === RIM - 1 ? rimTone : wallTone }} />
                  ))}
                </>
              )}

              {/* the key's wall, under the real key */}
              {!exploded && m.showKey && (
                <div className="xr-thumb" style={{ transform: `translate(${kx}px, ${ky}px)` }}>
                  {Array.from({ length: WALL }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: kw, height: kh, borderRadius: kr, transition: rise, transform: `translateZ(${flat ? 0 : keyZ + i * 1.4}px)`, background: i === 0 || !m.key[0] ? 'transparent' : wallTone }} />
                  ))}
                </div>
              )}

              {/* the words: the real field with its tray turned off, so the glyph and what is typed lie on the floor; you can type in it */}
              {!exploded && (
                <div ref={top} className="xr-segface is-fwords" style={face(1)}><FieldFace m={m} look={look} onValue={setValue} /></div>
              )}

              {/* the key: the real field with only its key left, raised on its wall */}
              {!exploded && m.showKey && (
                <div className="xr-segface is-fkey" aria-hidden inert style={face(flat ? 1.05 : keyTop)}><FieldFace m={m} look={look} inert /></div>
              )}

              {spot === 'shape' && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${rimZ + 1}px)` }} aria-hidden>
                  <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
                  <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{m.h}</text>
                  <path d={`M0 ${H + 16}H${m.padL * S}M0 ${H + 10}V${H + 22}M${m.padL * S} ${H + 10}V${H + 22}`} />
                  <text x={(m.padL * S) / 2} y={H + 34} textAnchor="middle">{m.padL}</text>
                  {R > 2 && <path d={`M${R} 0A${R} ${R} 0 0 0 0 ${R}`} className="is-arc" />}
                  <text x={R + 6} y={-8}>r {m.radius}</text>
                </svg>
              )}

              {exploded && (
                <>
                  <Exploded layers={TRAY} on={m.tray} fill={look.trayFill} shadows={look.trayRaw.shadows} w={W} h={H} r={R} z0={1} gap={14} focus={focus} scale={S} />
                  {m.showKey && <Exploded layers={KEY} on={m.key} fill={look.keyFill} shadows={look.keyRaw.shadows} x={kx} y={ky} w={kw} h={kh} r={kr} z0={1 + TRAY.length * 14 + 10} gap={14} focus={focus} scale={S} />}
                  {/* the words plane stays, out of sight, so the layers keep their measure */}
                  <div ref={top} className="xr-segface is-fwords" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}><FieldFace m={m} look={look} inert /></div>
                </>
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${keyTop + 120}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Type in it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, value: o.value }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <FieldSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <FieldCodePanel config={m} />}
    </div></HintLayer>
  );
}
