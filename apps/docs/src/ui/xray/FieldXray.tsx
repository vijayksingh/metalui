import * as React from 'react';
import { Field, Kbd } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, IsoTray, LayerList, LightDials, Proof, Switch, XrayFrame, aim, alphaK, capTop, scalePx, tones, useRecipeLayers, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · FIELD
 *
 *   solid     a text field with a search glyph and a ⌘K key
 *   x-ray     a wide shallow tray; the glyph and the words lie on its floor, a green caret
 *             stands after the words, and a small raised key sits inside the tray at the end
 *   play      Well    how deep the tray is
 *             Type    typed text, hint text and the green caret
 *             Key     a raised key inside a sunken field
 *             Shape   height · corners · padding
 *             Light   direction · strength
 *             Layers  tray and key layers
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.field.props.field as { height: number; radius: number; 'pad-left': number; 'pad-right': number; gap: number; glyph: number; ink: Record<string, string>; hint: Record<string, string>; caret: string };
const K = tokens.recipes.kbd.props.self as { height: number; min: number; radius: number };
const S = 1.8;
const WIDTH = 260;

type Spot = 'well' | 'type' | 'surface' | 'shape' | 'light' | 'layers';
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

const TRAY: LayerDef[] = [
  { name: 'Tray fill', why: 'The colour inside the field. Darker at the top and lighter at the bottom, because it goes down into the page.' },
  { name: 'Inner shadow', why: 'A soft shadow inside the top edge. It says "this is a hole you can put something in".' },
  { name: 'Edge line', why: 'A very thin outline so the field keeps its edge on a light page.' },
  { name: 'Bottom light', why: 'A thin bright line on the bottom edge, where light hits the far wall.' },
];
const KEY: LayerDef[] = [
  { name: 'Key fill', why: 'The key is lighter than the tray, because it stands up into the light.' },
  { name: 'Inner glow', why: 'A soft light just inside the key\'s edge.' },
  { name: 'Top light', why: 'A bright line on the key\'s top left edge.' },
  { name: 'Rim', why: 'A thin outline around the key.' },
  { name: 'Contact', why: 'A small shadow where the key sits on the tray floor.' },
  { name: 'Drop', why: 'A soft shadow that shows the key stands up out of the tray.' },
];

interface Model {
  text: string; caret: boolean; depth: number; keyUp: boolean;
  h: number; radius: number; padL: number; lightDeg: number; lightK: number;
  tray: boolean[]; key: boolean[];
}
const INITIAL: Model = {
  text: '', caret: true, depth: 1, keyUp: true, h: P.height, radius: P.radius, padL: P['pad-left'], lightDeg: 0, lightK: 1,
  tray: TRAY.map(() => true), key: KEY.map(() => true),
};

export function FieldXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('surface');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const tray = useStateLayers('well', 'field');
  const key = useRecipeLayers('kbd', 'self');
  const cw = tray.colorway;
  const t = tones(cw);

  const W = WIDTH * S, H = m.h * S, R = m.radius * S;
  const grad = (v: string) => v.replace('linear-gradient(', `linear-gradient(${180 + m.lightDeg}deg, `);
  const trayFill = m.tray[0] ? grad(tray.fill) : 'transparent';
  const trayShadow = scalePx(tray.shadows.map((v, i) => (m.tray[i + 1] ? aim(i === 0 ? alphaK(v, m.depth) : v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none', S);
  const keyFill = m.key[0] ? `linear-gradient(${180 + m.lightDeg}deg, ${key.stops.join(', ')})` : 'transparent';
  const keyShadow = scalePx(key.shadows.map((v, i) => (m.key[i + 1] ? aim(v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none', S);
  const kw = 28 * S, kh = K.height * S, kx = W - P['pad-right'] * S - kw, ky = (H - kh) / 2;
  const kz = m.keyUp ? 1 : -0.01;
  const top = capTop(kz, 4);
  const exploded = spot === 'layers';
  const typed = m.text.length > 0;

  const scene = exploded ? (
    <>
      <Exploded layers={TRAY} on={m.tray} fill={trayFill} shadows={tray.shadows} w={W} h={H} r={R} z0={1} gap={14} focus={focus} scale={S} />
      <Exploded layers={KEY} on={m.key} fill={keyFill} shadows={key.shadows} x={kx} y={ky} w={kw} h={kh} r={K.radius * S} z0={1 + TRAY.length * 14 + 10} gap={14} focus={focus} scale={S} />
    </>
  ) : (
    <>
      <IsoTray w={W} h={H} r={R} depth={5 * m.depth} fill={trayFill} shadow={trayShadow} colorway={cw} />
      <div className="xr-fieldrow" style={{ left: m.padL * S, right: (P['pad-right'] + 28 + P.gap) * S, height: H, gap: P.gap * S, fontSize: 15 * S }}>
        <span style={{ color: P.hint[cw], display: 'grid' }}><Icon name="search" size={P.glyph * S} /></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: typed ? P.ink[cw] : P.hint[cw] }}>
          {!typed && m.caret && <i className="xr-caret" style={{ background: P.caret, height: 18 * S }} />}
          {typed ? m.text : 'Lens or action'}
          {typed && m.caret && <i className="xr-caret" style={{ background: P.caret, height: 18 * S }} />}
        </span>
      </div>
      {m.keyUp
        ? <IsoCap x={kx} y={ky} w={kw} h={kh} r={K.radius * S} z={kz} wall={4} fill={keyFill} shadow={keyShadow} wallTone={t.wall}><span style={{ font: `500 ${10 * S}px/1 var(--mono)`, color: 'var(--ink2)' }}>⌘K</span></IsoCap>
        : <span className="xr-seglabel" style={{ left: kx, top: ky, width: kw, height: kh, font: `500 ${10 * S}px/1 var(--mono)`, color: 'var(--ink3)', transform: 'translateZ(0.7px)', pointerEvents: 'none' }}>⌘K</span>}
      {spot === 'shape' && (
        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${5 * m.depth + 1}px)` }} aria-hidden>
          <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
          <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{m.h}</text>
          <path d={`M0 ${H + 16}H${m.padL * S}M0 ${H + 10}V${H + 22}M${m.padL * S} ${H + 10}V${H + 22}`} />
          <text x={(m.padL * S) / 2} y={H + 34} textAnchor="middle">{m.padL}</text>
          {R > 2 && <path d={`M${R} 0A${R} ${R} 0 0 0 0 ${R}`} className="is-arc" />}
          <text x={R + 6} y={-8}>r {m.radius}</text>
        </svg>
      )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    well: [W * 0.5, H * 0.85, 1],
    type: [(m.padL + P.glyph + P.gap + 40) * S, H * 0.5, 1],
    surface: [kx + kw * 0.5, ky + kh * 0.3, exploded ? 1 + TRAY.length * 14 + 10 + (KEY.length - 1) * 14 : top],
    shape: [R * 0.3, H - R * 0.3, 5 * m.depth],
    light: [W * 0.3, 1, 5 * m.depth],
    layers: exploded ? [W * 0.2, H * 0.3, 1 + (TRAY.length - 1) * 14] : [W * 0.72, H * 0.75, 1],
  };

  const real = (w = 260) => (
    <span style={{ width: w, display: 'inline-flex' }}>
      <Field style={{ width: '100%' }}>
        <Field.Icon><Icon name="search" size={15} /></Field.Icon>
        <Field.Input placeholder="Lens or action" value={m.text} onChange={(e) => set({ text: e.target.value })} aria-label="Lens or action" />
        <Field.Trail><Kbd>⌘K</Kbd></Field.Trail>
      </Field>
    </span>
  );

  const card = (
    <>
      {spot === 'well' && (
        <>
          <p>A field is a shallow tray. A tray says "put something here", so you know you can type in it before you read anything. Make it deeper and the inner shadow gets stronger.</p>
          <div className="xr-dials"><Dial label="Depth" value={m.depth} min={0} max={3} step={0.1} fmt={(v) => (v === 0 ? 'flat' : v.toFixed(1))} onChange={(depth) => set({ depth })} /></div>
        </>
      )}
      {spot === 'type' && (
        <>
          <p>Before you type, it shows a hint in a soft grey. What you type is in full black. The caret is green, the same green as every "you are here" in the system. Type in the field below and watch the model.</p>
          <div className="xr-dials"><Switch label="Caret" on={m.caret} onChange={(caret) => set({ caret })} /></div>
        </>
      )}
      {spot === 'surface' && (
        <>
          <p>The ⌘K key stands up inside the field. So the field has two depths side by side: the tray goes down, the key comes up. Flatten the key and it looks like printed text you might try to type over.</p>
          <div className="xr-dials"><Switch label="Raised key" on={m.keyUp} onChange={(keyUp) => set({ keyUp })} /></div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>The field is {P.height} pt tall, easy to hit. The corners are {P.radius} pt, round but not a full pill, so it looks like a box to write in, not a button. The text starts {P['pad-left']} pt in.</p>
          <div className="xr-dials">
            <Dial label="Height" value={m.h} min={28} max={60} step={1} fmt={(v) => `${v} pt`} onChange={(h) => set({ h })} />
            <Dial label="Corners" value={m.radius} min={0} max={m.h / 2} step={0.5} fmt={(v) => `${v} pt`} onChange={(radius) => set({ radius })} />
            <Dial label="Space on the left" value={m.padL} min={6} max={28} step={1} fmt={(v) => `${v} pt`} onChange={(padL) => set({ padL })} />
          </div>
        </>
      )}
      {spot === 'light' && (
        <>
          <p>One light for both parts. The tray is dark at the top and bright at the bottom. The key is the other way round, bright at the top.</p>
          <LightDials deg={m.lightDeg} k={m.lightK} set={set} />
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>Two parts: the tray has four layers and the key has six. Turn one off to see what it adds.</p>
          <LayerList focus={focus} setFocus={setFocus} groups={[
            { title: 'The tray', layers: TRAY, on: m.tray, toggle: (i, v) => set({ tray: m.tray.map((x, j) => (j === i ? v : x)) }) },
            { title: 'The key', layers: KEY, on: m.key, toggle: (i, v) => set({ key: m.key.map((x, j) => (j === i ? v : x)) }) },
          ]} />
        </>
      )}
      <Proof>{real(240)}</Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }} onClick={(e) => e.stopPropagation()}>{real(280)}</div>}
      W={W} H={H} scene={scene} anchors={anchors}
      sun={spot === 'light' ? { deg: m.lightDeg, k: m.lightK, z: top + 120 } : undefined}
      onReset={() => setM(INITIAL)} deps={[spot, m]}
      card={card}
    />
  );
}
