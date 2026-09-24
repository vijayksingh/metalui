import * as React from 'react';
import { Swatch, swatchInk } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, LightDials, Proof, Switch, XrayFrame, aim, capTop, scalePx, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SWATCH
 *
 *   solid     a colour chip
 *   x-ray     a thick glossy chip in its own colour, its label engraved top left,
 *             a small dimple top right, its drop shadow tinted with its own colour
 *   play      Shape   size · corners
 *             Type    the label turns dark on bright colours and light on dark ones
 *             Light   sheen strength · light direction
 *             Well    the dimple: a small hole pressed into the top
 *             Shadow  the drop shadow in its own colour, or plain grey
 *             Layers  seven layers, each switchable
 *   A colour row in the cards changes the chip everywhere.
 * ───────────────────────────────────────────────────────── */

const R = tokens.recipes.swatch as { props: { self: { size: number; radius: number }; label: { x: number; y: number; 'ink-dark': string; 'ink-light': string }; led: { size: number; inset: number } }; layers: { part: string; prop: string; value: string }[] };
const P = R.props;
const S = 3;
const SHEEN = R.layers.find((l) => l.part === 'self' && l.prop === 'background' && l.value !== 'self')!.value;
const SHADOWS = R.layers.filter((l) => l.part === 'self' && l.prop === 'shadow').map((l) => l.value);
const LED = R.layers.filter((l) => l.part === 'led');
const PRESETS = ['#FF6B3D', '#FFD84D', '#35C77A', '#3D7BFF', '#1B1B1D', '#F2F1EE'];

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

const LAYERS: LayerDef[] = [
  { name: 'Colour', why: 'The chip is made of its own colour, all the way through. The sides are the same colour, only darker.' },
  { name: 'Shine', why: 'A see-through white fade from the top left corner. It makes the chip look hard and glossy, like a sweet or a plastic tile.' },
  { name: 'Top edge', why: 'A thin bright line along the top. It shows the top edge is rounded and catches the light.' },
  { name: 'Bottom edge', why: 'A thin dark line along the bottom, where the chip turns away from the light.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge, so the colour looks lit from within the plastic.' },
  { name: 'Contact', why: 'A small grey shadow right under the chip. It shows the chip is sitting on the page.' },
  { name: 'Coloured drop', why: 'A big soft shadow in the chip\'s own colour. Light passing through coloured plastic makes a coloured shadow, so this makes it look real.' },
];

interface Model {
  hex: string; size: number; radius: number; sheen: number; lightDeg: number; lightK: number;
  dimple: number; tinted: boolean; lift: number; hue: number; on: boolean[];
}
const INITIAL: Model = {
  hex: '#FF6B3D', size: P.self.size, radius: P.self.radius, sheen: 1, lightDeg: 0, lightK: 1,
  dimple: 1, tinted: true, lift: 1, hue: 15, on: LAYERS.map(() => true),
};

const rgb = (hex: string) => { const v = hex.replace('#', ''); const n = parseInt(v.length === 3 ? v.replace(/./g, '$&$&') : v, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const luma = (hex: string) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b; };
const shade = (hex: string, k: number) => `rgb(${rgb(hex).map((c) => Math.round(c * k)).join(',')})`;
const hueHex = (h: number) => {
  const f = (n: number) => { const k = (n + h / 30) % 12; const a = 0.9 * Math.min(0.58, 1 - 0.58); return Math.round(255 * (0.58 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return `#${[f(0), f(8), f(4)].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

/** The recipe's shadows with "self" swapped for the chip's colour. */
function selfShadows(m: Model) {
  const [r, g, b] = rgb(m.hex);
  return SHADOWS.map((v, i) => {
    let s = v.replace(/self\/\.?(\d+)/, (_, a) => (m.tinted ? `rgba(${r},${g},${b},.${a})` : `rgba(0,0,0,.${Math.round(Number(a) * 0.5)})`));
    if (i >= 3) s = scalePx(s, 0.4 + m.lift * 0.6);
    return aim(s, m.lightDeg, i < 3 ? m.lightK : 1);
  });
}

export function SwatchXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('shadow');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);

  const W = m.size * S, H = m.size * S, Rr = m.radius * S;
  const shadows = selfShadows(m);
  const sheen = SHEEN.replace('135deg', `${135 + m.lightDeg}deg`).replace(/rgba\(255,255,255,\.(\d+)\)/, (_, a) => `rgba(255,255,255,${(Number(`.${a}`) * m.sheen).toFixed(3)})`);
  const fill = [m.on[1] ? sheen : null, m.on[0] ? m.hex : null].filter(Boolean).join(', ') || 'transparent';
  const inset = shadows.slice(0, 3).filter((_, i) => m.on[i + 2]);
  const faceShadow = scalePx(inset.join(', '), S) || 'none';
  const z = m.lift * 4;
  const WALL = 10;
  const top = capTop(z, WALL);
  const ink = swatchInk(m.hex) === 'dark' ? P.label['ink-dark'] : P.label['ink-light'];
  const exploded = spot === 'layers';
  const led = P.led.size * S * m.dimple, ledX = W - P.led.inset * S - led, ledY = P.led.inset * S;

  const scene = exploded ? (
    <Exploded layers={LAYERS} on={m.on} fill={m.hex} backgrounds={[m.hex, sheen]} shadows={['none', ...shadows]} w={W} h={H} r={Rr} z0={4} gap={22} focus={focus} scale={S} />
  ) : (
    <>
      {m.on[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: Rr, background: m.tinted ? m.hex : '#000', filter: `blur(${10 + m.lift * 8}px)`, opacity: m.tinted ? 0.55 : 0.25, transform: `translate(${m.lift * 6}px, ${m.lift * 12}px)` }} />}
      {m.on[5] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: Rr, filter: 'blur(2px)', opacity: 0.18 }} />}
      <IsoCap w={W} h={H} r={Rr} z={z} wall={WALL} fill={fill} shadow={faceShadow} wallTone={m.on[0] ? shade(m.hex, 0.72) : 'transparent'}>
        <span style={{ position: 'absolute', left: P.label.x * S, top: P.label.y * S, font: `600 ${9.5 * S}px/1 var(--mono)`, letterSpacing: '.04em', color: ink }}>{m.hex}</span>
      </IsoCap>
      {m.dimple > 0 && (
        <div className="xr-face is-flat" style={{ left: ledX, top: ledY, width: led, height: led, borderRadius: '50%', transform: `translateZ(${top + 0.5}px)`, background: LED[0].value, boxShadow: scalePx(LED.slice(1).map((l) => l.value).join(', '), S) }} />
      )}
      {spot === 'shape' && (
        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${top + 1}px)` }} aria-hidden>
          <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
          <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{m.size}</text>
          {Rr > 2 && <path d={`M${Rr} 0A${Rr} ${Rr} 0 0 0 0 ${Rr}`} className="is-arc" />}
          <text x={Rr + 6} y={-8}>r {m.radius}</text>
        </svg>
      )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    shape: [Rr * 0.3, H - Rr * 0.3, top],
    type: [P.label.x * S + 30, P.label.y * S + 12, top + 1],
    light: [W * 0.3, H * 0.35, top],
    well: [ledX + led / 2, ledY + led / 2, top],
    shadow: [W * 0.9, H + 20, 0],
    layers: exploded ? [W * 0.8, H * 0.2, 4 + (LAYERS.length - 1) * 22] : [W * 0.7, H * 0.7, top],
  };

  const colours = (
    <div className="xr-dial">
      <span className="xr-dial-head"><span>Colour</span><span className="readout-t">{m.hex}</span></span>
      <span className="flex flex-wrap items-center gap-6">
        {PRESETS.map((h) => (
          <button key={h} type="button" aria-label={`Colour ${h}`} aria-pressed={m.hex === h} onClick={() => set({ hex: h })} className="xr-chip" style={{ background: h, outline: m.hex === h ? '2px solid var(--green-deep)' : undefined, outlineOffset: 2, cursor: 'pointer', border: 0 }} />
        ))}
      </span>
      <Dial label="Hue" value={m.hue} min={0} max={360} step={5} fmt={(v) => `${v}°`} onChange={(hue) => set({ hue, hex: hueHex(hue) })} />
    </div>
  );
  const proof = <Proof><div style={{ zoom: 0.9 }}><Swatch hex={m.hex} /></div></Proof>;

  const card = (
    <>
      {spot === 'shape' && (
        <>
          <p>A square with large round corners. It is a chip you could pick up, not a flat colour box.</p>
          <div className="xr-dials">
            <Dial label="Size" value={m.size} min={40} max={110} step={2} fmt={(v) => `${v} pt`} onChange={(size) => set({ size })} />
            <Dial label="Corners" value={m.radius} min={0} max={m.size / 2} step={1} fmt={(v) => `${v} pt`} onChange={(radius) => set({ radius })} />
          </div>
        </>
      )}
      {spot === 'type' && (
        <>
          <p>The colour code is written in the top left corner. On a bright colour the text is dark. On a dark colour the text is light. The chip decides by how bright the colour is: over 150 out of 255 means dark text.</p>
          <div className="xr-dials">{colours}</div>
          <p className="readout-t">brightness {Math.round(luma(m.hex))} · text is {swatchInk(m.hex)}</p>
        </>
      )}
      {spot === 'light' && (
        <>
          <p>A see-through white fade runs from the top left corner. It is the shine you see on hard, glossy plastic. Turn it down and the chip looks matte.</p>
          <div className="xr-dials"><Dial label="Shine" value={m.sheen} min={0} max={2.5} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(sheen) => set({ sheen })} /></div>
          <LightDials deg={m.lightDeg} k={m.lightK} set={set} />
        </>
      )}
      {spot === 'well' && (
        <>
          <p>A small round hole pressed into the top right corner. It is where a light could sit. It is dark inside, with a bright line under its bottom edge, like every hole in this system.</p>
          <div className="xr-dials"><Dial label="Size" value={m.dimple} min={0} max={2} step={0.1} fmt={(v) => (v === 0 ? 'none' : `${Math.round(P.led.size * v)} pt`)} onChange={(dimple) => set({ dimple })} /></div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>Coloured plastic lets some light through, so its shadow takes the colour. The big shadow uses the chip's own colour. Switch it to grey and the chip looks painted, not solid.</p>
          <div className="xr-dials">
            <Switch label="Shadow in its own colour" on={m.tinted} onChange={(tinted) => set({ tinted })} />
            <Dial label="Height above the page" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} />
            {colours}
          </div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The chip has seven layers. Turn one off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on: m.on, toggle: (i, v) => set({ on: m.on.map((x, j) => (j === i ? v : x)) }) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
      {proof}
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 2.2, cursor: 'zoom-in' }}><Swatch hex={m.hex} /></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      sun={spot === 'light' ? { deg: m.lightDeg, k: m.lightK, z: top + 120 } : undefined}
      onReset={() => setM(INITIAL)} deps={[spot, m]}
      card={card}
    />
  );
}
