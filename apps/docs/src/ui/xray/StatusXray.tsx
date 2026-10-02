import * as React from 'react';
import { StatusBadge, type LedKind } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Exploded, IsoCap, XrayFrame, aim, capTop, scalePx, tones, useRecipeLayers, useStateLayers, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import { StatusSpecimenCard } from './StatusSpecimens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LED AND STATUS BADGE
 *
 *   solid     a badge: an LED and a short state in capitals
 *   x-ray     a raised pill; on it a tiny round lamp and the engraved words
 *   card      the real badge, handled (StatusSpecimens): drag it sideways through its
 *             states; a sun moves the lamp's bright spot; glow is a switch; the words set
 *             their size and spacing; the top edge, right end and lamp set the shape;
 *             a switch per layer. The bench reads the same model.
 * ───────────────────────────────────────────────────────── */

const RP = tokens.recipes.status.props as { lamp: { bezel: number; size: number; 'size-small': number }; badge: { height: number; pad: number; gap: number; font: string; tracking: string } };
const LIVE_FILL = tokens.recipes.status.layers.find((l) => l.part === 'lamp' && l.prop === 'background' && !('state' in l))!.value;
const SPOT_AT = LIVE_FILL.match(/at ([\d.]+)% ([\d.]+)%/)!.slice(1).map(Number) as [number, number];
const S = 4;
export const WORDS: Record<LedKind, string> = { live: 'SYNC LIVE', waiting: 'WAITING', failed: 'SYNC FAILED', link: 'LINKED', off: 'OFFLINE' };

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

export interface Model {
  kind: LedKind; spotX: number; spotY: number; glow: boolean; track: number; size: number;
  h: number; pad: number; led: number; badge: boolean[]; lamp: boolean[];
}
/** The recipe's own values: every starting number is read from tokens.json. */
export const INITIAL: Model = {
  kind: 'live', spotX: SPOT_AT[0], spotY: SPOT_AT[1], glow: true,
  track: parseFloat(RP.badge.tracking), size: Number(RP.badge.font.match(/([\d.]+)px/)![1]),
  h: RP.badge.height, pad: RP.badge.pad, led: RP.lamp.size, badge: BADGE.map(() => true), lamp: LAMP.map(() => true),
};

export function StatusXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const badge = useRecipeLayers('status', 'badge');
  const lamp = useStateLayers('status', m.kind === 'off' ? 'off' : '', 'lamp');
  const base = useStateLayers('status', '', 'socket');
  const t = tones(badge.colorway);

  const measure = React.useRef<HTMLSpanElement>(null);
  const [textW, setTextW] = React.useState(50);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [m.kind, m.track, m.size]);
  const Wp = m.pad * 2 + m.led + RP.badge.gap + textW;
  const W = Wp * S, H = m.h * S, R = H / 2;
  const fill = m.badge[0] ? `linear-gradient(180deg, ${badge.stops.join(', ')})` : 'transparent';
  const badgeSh = badge.shadows.map((v, i) => (m.badge[i + 1] ? aim(v, 0, 1) : null)).filter(Boolean).join(', ') || 'none';
  const shadow = scalePx(badgeSh, S);
  const inks = tokens.recipes.status.props.ink as Record<string, string | Record<string, string>>;
  const ink = m.kind === 'off' ? inks.off as string : (inks[m.kind] as Record<string, string>)[badge.colorway];
  const own = (v: string) => v.replace(/self(?:\/([\d.]+))?/g, (_, a) => a ? `color-mix(in srgb, ${ink} ${Number(a) * 100}%, transparent)` : ink);
  const lampBg = m.lamp[0] ? own(lamp.fill).replace(/at [\d.]+% [\d.]+%/, `at ${m.spotX}% ${m.spotY}%`) : 'transparent';
  // the lamp's own ring (an off bone lamp has a sunk inset instead), else the shared one
  const glowSh = m.kind !== 'off' ? own(lamp.shadows.find((v) => /0 0 4px/.test(v)) ?? 'none') : undefined;
  const rim = `0 0 0 ${RP.lamp.bezel}px ${inks.off}`;
  const lampSh = [m.lamp[1] ? rim : null, m.lamp[2] && m.glow ? glowSh : null].filter(Boolean).join(', ') || 'none';
  const lampShadow = scalePx(lampSh, S);
  const z = 1.5, top = capTop(z, 4);
  const L = m.led * S, lx = m.pad * S, ly = (H - L) / 2;
  const exploded = spot === 'layers';

  const scene = exploded ? (
    <>
      <Exploded layers={BADGE} on={m.badge} fill={fill} shadows={badge.shadows} w={W} h={H} r={R} z0={2} gap={14} focus={focus} scale={S} />
      <Exploded layers={LAMP} on={m.lamp} fill={lampBg} shadows={[rim ?? 'none', glowSh ?? 'none']} x={lx} y={ly} w={L} h={L} r={L / 2} z0={2 + BADGE.length * 14 + 10} gap={14} focus={focus} scale={S} />
    </>
  ) : (
    <>
      <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: 'blur(6px)', opacity: 0.12, transform: 'translate(4px, 8px)' }} />
      <IsoCap w={W} h={H} r={R} z={z} wall={4} fill={fill} shadow={shadow} wallTone={t.wall}>
        <span className="xr-badgeface" style={{ paddingLeft: m.pad * S, gap: RP.badge.gap * S, fontFamily: 'var(--mu-sans)', fontSize: m.size * S, letterSpacing: `${m.track}em` }}>
          <i style={{ width: L, height: L, borderRadius: '50%', background: lampBg, boxShadow: lampShadow, flex: 'none' }} />
          {WORDS[m.kind]}
        </span>
      </IsoCap>
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
    type: [lx + L + RP.badge.gap * S + (textW * S) / 2, H / 2, top + 1],
    shape: [W - R * 0.3, H - R * 0.3, top],
    layers: exploded ? [W * 0.8, H * 0.3, 2 + (BADGE.length - 1) * 14] : [W * 0.85, H * 0.8, top],
  };

  const real = <StatusBadge led={m.kind}>{WORDS[m.kind]}</StatusBadge>;

  const card = (
    <StatusSpecimenCard spot={spot} m={m} set={set} focus={setFocus} words={WORDS} badgeLayers={BADGE} lampLayers={LAMP}
      parts={{ badgeBg: fill, badgeSh, lampBg, lampSh }} />
  );

  return (
    <HintLayer>
      <span ref={measure} aria-hidden className="xr-measure" style={{ font: `500 ${m.size}px/1 var(--mu-sans)`, letterSpacing: `${m.track}em` }}>{WORDS[m.kind]}</span>
      <XrayFrame
        xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
        solid={<div style={{ zoom: 3, cursor: 'zoom-in' }}>{real}</div>}
        W={W} H={H} scene={scene} anchors={anchors}
        onReset={() => setM(INITIAL)} deps={[spot, m, textW]}
        card={card}
      />
    </HintLayer>
  );
}
