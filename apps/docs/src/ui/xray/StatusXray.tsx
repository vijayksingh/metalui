import * as React from 'react';
import { Segmented, StatusBadge, type LedKind } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, aim, capTop, scalePx, tones, useRecipeLayers, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LED AND STATUS BADGE
 *
 *   solid     a badge: an LED and a short state in capitals
 *   x-ray     a raised pill; on it a tiny round lamp and the engraved words
 *   play      States  live · waiting · failed · link · off
 *             Lamp    the bright spot sits up and to the left, where the light is
 *             Glow    only a lamp that is on glows
 *             Type    small mono capitals, spaced out
 *             Shape   height · padding · lamp size
 *             Layers  badge and lamp layers
 * ───────────────────────────────────────────────────────── */

const RP = tokens.recipes.status.props as { led: { size: number }; badge: { height: number; pad: number; gap: number } };
const S = 4;
const WORDS: Record<LedKind, string> = { live: 'SYNC LIVE', waiting: 'WAITING', failed: 'SYNC FAILED', link: 'LINKED', off: 'OFFLINE' };

type Spot = 'states' | 'light' | 'shadow' | 'type' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'States', word: 'One colour for each state' },
  { id: 'light', title: 'Lamp', word: 'A tiny lit ball' },
  { id: 'shadow', title: 'Glow', word: 'Only when it is on' },
  { id: 'type', title: 'Type', word: 'The engraved words' },
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], states: ['left', 0.48], shadow: ['left', 0.76],
  layers: ['right', 0.2], type: ['right', 0.48], shape: ['right', 0.76],
};

const BADGE: LayerDef[] = [
  { name: 'Fill', why: 'The badge colour, a little lighter at the top. It is raised like a button, but it is not a button: you cannot press it.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A thin bright line on the top left edge.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow right under the badge.' },
  { name: 'Drop', why: 'A soft shadow that shows it stands up a little.' },
];
const LAMP: LayerDef[] = [
  { name: 'Lit ball', why: 'A round gradient with its brightest spot up and to the left. That spot is the reflection of the one light, so the lamp looks like a small glass ball.' },
  { name: 'Rim', why: 'A very thin dark outline so a pale lamp does not melt into the badge.' },
  { name: 'Glow', why: 'A soft coloured glow around the lamp. Only a lamp that is on has it.' },
];

interface Model {
  kind: LedKind; spotX: number; spotY: number; glow: boolean; track: number;
  h: number; pad: number; led: number; badge: boolean[]; lamp: boolean[];
}
const INITIAL: Model = { kind: 'live', spotX: 40, spotY: 35, glow: true, track: 0.1, h: RP.badge.height, pad: RP.badge.pad, led: RP.led.size, badge: BADGE.map(() => true), lamp: LAMP.map(() => true) };

export function StatusXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const badge = useRecipeLayers('status', 'badge');
  const lamp = useStateLayers('status', m.kind, 'led');
  const base = useStateLayers('status', '', 'led');
  const t = tones(badge.colorway);

  const measure = React.useRef<HTMLSpanElement>(null);
  const [textW, setTextW] = React.useState(50);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [m.kind, m.track]);
  const Wp = m.pad * 2 + m.led + RP.badge.gap + textW;
  const W = Wp * S, H = m.h * S, R = H / 2;
  const fill = m.badge[0] ? `linear-gradient(180deg, ${badge.stops.join(', ')})` : 'transparent';
  const shadow = scalePx(badge.shadows.map((v, i) => (m.badge[i + 1] ? aim(v, 0, 1) : null)).filter(Boolean).join(', ') || 'none', S);
  const lampBg = m.lamp[0] ? lamp.fill.replace(/at 40% 35%/, `at ${m.spotX}% ${m.spotY}%`) : 'transparent';
  const rim = [...base.shadows, ...lamp.shadows].find((v) => /\.5px/.test(v));
  const glowSh = lamp.shadows.find((v) => /0 0 2px/.test(v));
  const lampShadow = scalePx([m.lamp[1] ? rim : null, m.lamp[2] && m.glow ? glowSh : null].filter(Boolean).join(', ') || 'none', S);
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
        <span className="xr-badgeface" style={{ paddingLeft: m.pad * S, gap: RP.badge.gap * S, fontSize: 9.5 * S, letterSpacing: `${m.track}em` }}>
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
    <>
      {spot === 'states' && (
        <>
          <p>The lamp's colour tells you the state. Green is on and working. Amber is waiting. Red has failed. Blue is linked. Grey is off. The words next to it always say the same thing, so you never have to rely on colour alone.</p>
          <div className="xr-dials"><Segmented size="compact" aria-label="State" value={m.kind} onValueChange={(v) => set({ kind: v as LedKind })} options={[{ value: 'live', label: 'Live' }, { value: 'waiting', label: 'Waiting' }, { value: 'failed', label: 'Failed' }, { value: 'link', label: 'Link' }, { value: 'off', label: 'Off' }]} /></div>
        </>
      )}
      {spot === 'light' && (
        <>
          <p>The lamp is a tiny glass ball, only {RP.led.size} pt wide. Its brightest spot is up and to the left, because that is where the light comes from. Move the spot and see how it stops looking like a ball.</p>
          <div className="xr-dials">
            <Dial label="Bright spot, left to right" value={m.spotX} min={10} max={90} step={1} fmt={(v) => `${v}%`} onChange={(spotX) => set({ spotX })} />
            <Dial label="Bright spot, top to bottom" value={m.spotY} min={10} max={90} step={1} fmt={(v) => `${v}%`} onChange={(spotY) => set({ spotY })} />
          </div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>A lamp that is on gives off a little light, so it has a soft glow in its own colour. A lamp that is off has none. That is how you can tell "on" from "a green dot".</p>
          <div className="xr-dials"><Switch label="Glow" on={m.glow} onChange={(glow) => set({ glow })} /></div>
        </>
      )}
      {spot === 'type' && (
        <>
          <p>The words are small capitals in the mono font, spaced out. It looks stamped into the badge, like the labels on a machine. Keep it short: what state, and at most what fixes it.</p>
          <div className="xr-dials"><Dial label="Letter spacing" value={m.track} min={0} max={0.25} step={0.01} fmt={(v) => `${v.toFixed(2)} em`} onChange={(track) => set({ track })} /></div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>A raised pill, {RP.badge.height} pt tall, with the same space on both ends. It looks like a button, but it is not one. If there is a fix, it shows in a tooltip when you point at it.</p>
          <div className="xr-dials">
            <Dial label="Height" value={m.h} min={18} max={40} step={1} fmt={(v) => `${v} pt`} onChange={(h) => set({ h })} />
            <Dial label="Space on the ends" value={m.pad} min={4} max={20} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />
            <Dial label="Lamp size" value={m.led} min={3} max={10} step={0.5} fmt={(v) => `${v} pt`} onChange={(led) => set({ led })} />
          </div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>Two parts: the badge has six layers and the lamp has three. Turn one off to see what it adds.</p>
          <LayerList focus={focus} setFocus={setFocus} groups={[
            { title: 'The badge', layers: BADGE, on: m.badge, toggle: (i, v) => set({ badge: m.badge.map((x, j) => (j === i ? v : x)) }) },
            { title: 'The lamp', layers: LAMP, on: m.lamp, toggle: (i, v) => set({ lamp: m.lamp.map((x, j) => (j === i ? v : x)) }) },
          ]} />
        </>
      )}
      <Proof>{real}</Proof>
    </>
  );

  return (
    <>
      <span ref={measure} aria-hidden className="xr-measure" style={{ font: '500 9.5px/1 var(--mono)', letterSpacing: `${m.track}em` }}>{WORDS[m.kind]}</span>
      <XrayFrame
        xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
        solid={<div style={{ zoom: 3, cursor: 'zoom-in' }}>{real}</div>}
        W={W} H={H} scene={scene} anchors={anchors}
        onReset={() => setM(INITIAL)} deps={[spot, m, textW]}
        card={card}
      />
    </>
  );
}
