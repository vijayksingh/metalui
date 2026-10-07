import * as React from 'react';
import { StatusBadge, type LedGesture, type LedKind } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, recipeLayers, tones, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { StatusSpecimenCard } from './StatusSpecimens';
import { StatusCodePanel } from './StatusCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LED AND STATUS BADGE
 *
 *   solid     the real badge: a lamp and a short state in capitals
 *   x-ray     a raised pill on the gridded floor. Its top is the real badge itself, laid out at
 *             the object's own zoom and scaled by transform, so the badge that lands on it is
 *             the badge that was on the table; the wall stands under it.
 *   card      the real badge, handled (StatusSpecimens): drag it sideways through its states;
 *             a sun moves the lamp's bright spot; glow is a switch; the words set their size
 *             and spacing; the top edge, right end and lamp set the shape; a switch per layer.
 *   code      under the card: the React and SwiftUI for exactly this config (StatusCode.tsx)
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.status;
const RP = RECIPE.props as { lamp: { bezel: number; size: number; 'size-small': number }; badge: { height: number; pad: number; gap: number; font: string; tracking: string }; ink: Record<string, string | Record<string, string>> };
type RecipeLayer = { part: string; prop: string; value: string; state?: string };
const RL = RECIPE.layers as RecipeLayer[];
const LIT_FILL = RL.find((l) => l.part === 'lamp' && l.prop === 'background' && !l.state)!.value;
const OFF_FILL = RL.find((l) => l.part === 'lamp' && l.prop === 'background' && l.state === 'off')!.value;
const GLOW = RL.find((l) => l.part === 'lamp' && l.prop === 'shadow' && !l.state)!.value;
const SOCKET_FILL = RL.find((l) => l.part === 'socket' && l.prop === 'background')!.value;
const SOCKET_SHADOWS = RL.filter((l) => l.part === 'socket' && l.prop === 'shadow').map((l) => l.value);
const SPOT_AT = LIT_FILL.match(/at ([\d.]+)% ([\d.]+)%/)!.slice(1).map(Number) as [number, number];
const FONT = Number(RP.badge.font.match(/([\d.]+)px/)![1]);
const S = 4;
const SLICES = 5;
/** The badge's own words for each state, as its agent guide writes them (the badge capitalises them). */
export const WORDS: Record<LedKind, string> = { live: 'Sync live', waiting: 'Sync waiting', failed: 'Sync failed', link: 'Sync linked', off: 'Sync off' };

export type Spot = 'states' | 'light' | 'shadow' | 'type' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'States', word: 'One colour for each state' },
  { id: 'light', title: 'Lamp', word: 'A tiny lit ball' },
  { id: 'shadow', title: 'Glow', word: 'Every lit state, never off' },
  { id: 'type', title: 'Type', word: 'Readable words' },
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], states: ['left', 0.48], shadow: ['left', 0.76],
  layers: ['right', 0.2], type: ['right', 0.48], shape: ['right', 0.76],
};

export const BADGE: LayerDef[] = [
  { name: 'Fill', why: 'The badge colour, a little lighter at the top. It is raised like a button, but it is not a button: you cannot press it.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A thin bright line on the top left edge.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow right under the badge.' },
  { name: 'Drop', why: 'A soft shadow that shows it stands up a little.' },
];
export const LAMP: LayerDef[] = [
  { name: 'Lit ball', why: 'A round gradient with its brightest spot up and to the left. That spot is the reflection of the one light, so the lamp looks like a small glass ball.' },
  { name: 'Rim', why: 'An opaque dark socket separates the lamp from any ground.' },
  { name: 'Glow', why: 'A soft coloured glow around the lamp. Only a lamp that is on has it.' },
];

/** Everything a status badge is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface StatusConfig {
  /** props */
  led: LedKind; label: string;
  /** recipe values: --mu-r-status-badge-* and --mu-r-status-lamp-size */
  h: number; pad: number; lampSize: number; size: number; track: number;
  /** the lamp: where its bright spot sits, whether it glows */
  spotX: number; spotY: number; glow: boolean;
  /** the badge's six layers and the lamp's three, each switchable */
  badge: boolean[]; lamp: boolean[];
}
export type Model = StatusConfig;
export const INITIAL: StatusConfig = {
  led: 'live', label: WORDS.live,
  h: RP.badge.height, pad: RP.badge.pad, lampSize: RP.lamp.size, size: FONT, track: parseFloat(RP.badge.tracking),
  spotX: SPOT_AT[0], spotY: SPOT_AT[1], glow: true,
  badge: BADGE.map(() => true), lamp: LAMP.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(tokens.springs.object.duration * 1000 * 0.55);

/** Picking a state gives the badge that state's words, unless the label was set to something else. */
export function withLed(m: StatusConfig, led: LedKind): StatusConfig {
  return { ...m, led, label: m.label === WORDS[m.led] ? WORDS[led] : m.label };
}

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);
/** A recipe value's `self` is the object's own colour: say which. */
const own = (v: string, ink: string) => v.replace(/self(?:\/([\d.]+))?/g, (_, a) => `color-mix(in srgb, ${ink} ${a ? Number(a) * 100 : 100}%, transparent)`);
const inkOf = (led: LedKind, colorway: Colorway) => (led === 'off' ? RP.ink.off as string : (RP.ink[led] as Record<string, string>)[colorway]);

/** What a config looks like: the variables that set the real badge to it (only those that differ from
 *  the recipe, so a default config is the badge exactly as it ships), the lamp's own look, and the
 *  plate's fill and shadows for the model's hand-built layers. */
export function statusLook(m: StatusConfig, colorway: Colorway) {
  const badge = recipeLayers('status', 'badge', colorway);
  const fill = m.badge[0] ? badge.fill : 'transparent';
  const shadow = badge.shadows.filter((_, i) => m.badge[i + 1]).join(', ') || 'none';
  const style: Record<string, string> = {};
  if (m.h !== INITIAL.h) style['--mu-r-status-badge-height'] = `${m.h}px`;
  if (m.pad !== INITIAL.pad) style['--mu-r-status-badge-pad'] = `${m.pad}px`;
  if (m.lampSize !== INITIAL.lampSize) style['--mu-r-status-lamp-size'] = `${m.lampSize}px`;
  if (m.size !== INITIAL.size) style['--mu-r-status-badge-font'] = `500 ${m.size}px/16px var(--mu-sans)`;
  if (m.track !== INITIAL.track) style['--mu-r-status-badge-tracking'] = `${m.track}em`;
  // the plate's fill and shadows are colours: one set per colorway
  if (!m.badge[0]) style['--mu-r-status-badge-background'] = fill;
  if (!same(m.badge.slice(1), INITIAL.badge.slice(1))) style['--mu-r-status-badge-shadow'] = shadow;

  // The lamp is lit, ringed and glowing by variables the library sets on the lamp itself, so a host cannot reach
  // them from outside. The x-ray still tunes them, through hooks of its own (status-specimens.css); the code does not claim them.
  const lit = m.led !== 'off';
  const self = `var(--mu-r-status-ink-${m.led})`;
  const spot = LIT_FILL.replace(/at [\d.]+% [\d.]+%/, `at ${m.spotX}% ${m.spotY}%`);
  const lampVars: Record<string, string> = {
    '--ed-status-lamp-bg': m.lamp[0] ? own(lit ? spot : OFF_FILL, self) : 'transparent',
    '--ed-status-lamp-shadow': lit && m.glow && m.lamp[2] ? own(GLOW, self) : 'none',
    '--ed-status-socket-bg': m.lamp[1] ? own(SOCKET_FILL, 'var(--mu-r-status-ink-off)') : 'transparent',
    '--ed-status-socket-shadow': m.lamp[1] ? SOCKET_SHADOWS.join(', ') : 'none',
  };
  const lampTuned = m.spotX !== INITIAL.spotX || m.spotY !== INITIAL.spotY || !m.glow || !same(m.lamp, INITIAL.lamp);
  // the same lamp as hand-built faces, for the layers pulled apart (a plain colour, not the object's own)
  const hex = inkOf(m.led, colorway);
  const exploded = {
    fill: m.lamp[0] ? own(lit ? spot : OFF_FILL, hex) : 'transparent',
    rim: `0 0 0 ${RP.lamp.bezel}px ${RP.ink.off as string}`,
    glow: lit ? own(GLOW, hex) : 'none',
  };
  return { colorway, plateRaw: badge, fill, shadow, style: style as React.CSSProperties, lampVars: (lampTuned ? lampVars : {}) as React.CSSProperties, lampTuned, exploded };
}
export function useStatusLook(m: StatusConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => statusLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useStatusLook>;

/** The real badge, set to a config: the table's object, the model's face and every specimen are this. */
export function StatusReal({ m, look, gesture, style, className, children }: { m: StatusConfig; look: Look; gesture?: LedGesture; style?: React.CSSProperties; className?: string; children?: React.ReactNode }) {
  return (
    <StatusBadge led={m.led} gesture={gesture} className={`ed-status-badge ${className ?? ''}`} data-lamp-tuned={look.lampTuned ? '' : undefined} style={{ ...look.style, ...look.lampVars, ...style }}>
      {children ?? m.label}
    </StatusBadge>
  );
}

/** The badge's box and its lamp, in the badge's own points, read off the real thing. */
interface Box { W: number; H: number; lx: number; ly: number; lw: number; lh: number }

export function StatusXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<StatusConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<StatusConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<StatusConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useStatusLook(m);

  // the badge's boxes, measured on an unseen copy at the object's own zoom (so fractions of a point survive)
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<Box>({ W: 0, H: 0, lx: 0, ly: 0, lw: 0, lh: 0 });
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    const read = () => {
      const badge = el.querySelector<HTMLElement>('.mu-badge'), lamp = badge?.querySelector<HTMLElement>('[data-lamp]');
      if (!badge || !lamp) return;
      const b = badge.getBoundingClientRect(), l = lamp.getBoundingClientRect();
      setBox({ W: b.width / oz, H: b.height / oz, lx: (l.left - b.left) / oz, ly: (l.top - b.top) / oz, lw: l.width / oz, lh: l.height / oz });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [m, look, oz]);

  const W = box.W * S, H = box.H * S, R = H / 2;
  const flat = pose === 'flat';
  const wallZ = 1.5;
  const top = wallZ + SLICES * 1.4;
  const exploded = spot === 'layers';
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const lx = box.lx * S, ly = box.ly * S, L = box.lw * S;
  const live = <StatusReal m={m} look={look} />;

  const scene = exploded ? (
    <>
      <Exploded layers={BADGE} on={m.badge} fill={look.fill} shadows={look.plateRaw.shadows} w={W} h={H} r={R} z0={2} gap={14} focus={focus} scale={S} />
      <Exploded layers={LAMP} on={m.lamp} fill={look.exploded.fill} shadows={[look.exploded.rim, look.exploded.glow]} x={lx} y={ly} w={L} h={L} r={L / 2} z0={2 + BADGE.length * 14 + 10} gap={14} focus={focus} scale={S} />
    </>
  ) : (
    <>
      <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: 'blur(6px)', opacity: flat ? 0 : 0.12, transform: 'translate(4px, 8px)' }} />
      {/* the wall: the badge's outline stood on the floor, under the real badge */}
      <div className="xr-thumb">
        {Array.from({ length: SLICES }, (_, i) => (
          <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: R, opacity: flat ? 0 : 1, transform: `translateZ(${flat ? 0 : wallZ + i * 1.4}px)`, background: i === 0 || !m.badge[0] ? 'transparent' : t.wall }} />
        ))}
      </div>
      {/* the top: the real badge, raised */}
      <div className="xr-segface is-top" style={{ display: 'flex', ...face(flat ? 1 : top) }}><span>{live}</span></div>
      {spot === 'shape' && (
        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${top + 1}px)` }} aria-hidden>
          <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
          <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{m.h}</text>
          <path d={`M0 ${H + 16}H${m.pad * S}M0 ${H + 10}V${H + 22}M${m.pad * S} ${H + 10}V${H + 22}`} />
          <text x={(m.pad * S) / 2} y={H + 34} textAnchor="middle">{m.pad}</text>
        </svg>
      )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    states: [lx + L / 2, ly + L / 2, top + 1],
    light: [lx + L * 0.35, ly + L * 0.3, top + 1],
    shadow: [lx + L, ly + L, top],
    type: [((box.lx + box.lw + RP.lamp.bezel) + (box.W - m.pad)) / 2 * S, H / 2, top + 1],
    shape: [W - R * 0.3, H - R * 0.3, top],
    layers: exploded ? [W * 0.8, H * 0.3, 2 + (BADGE.length - 1) * 14] : [W * 0.85, H * 0.8, top],
  };

  const current = SPOTS.find((x) => x.id === spot)!;
  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden inert className="xr-measure" style={{ zoom: oz }}><span>{live}</span></span>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 3, cursor: 'zoom-in' }}>{live}</div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />
              {scene}
              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, led: o.led, label: o.label }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <StatusSpecimenCard spot={spot} m={m} set={set} focus={setFocus} badgeLayers={BADGE} lampLayers={LAMP} look={look} />
        </div>
      )}
      {xray && <StatusCodePanel config={m} />}
    </div></HintLayer>
  );
}

