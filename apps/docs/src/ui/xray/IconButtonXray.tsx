import * as React from 'react';
import { IconButton, Switcher } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, LightDials, Proof, Switch, XrayFrame, aim, capTop, scalePx, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · ICON BUTTON (the tool cap)
 *
 *   solid     a graphite tool cap with a glyph; click to latch it
 *   x-ray     the cap standing on a dark strip; pressed, it drops, turns dark inside,
 *             and a small green LED lights in its corner
 *   play      Press    tap it: it dips 1 pt and comes back
 *             Latch    it stays down with the LED on
 *             Shape    size · corners · glyph size
 *             Kinds    tool · ghost · mini
 *             Light    direction · strength
 *             Layers   up and down layers, each switchable
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes['icon-button'].props as { tool: { size: number; radius: number; glyph: number; ink: string; press: number; 'press-time': string; 'shadow-time': string }; led: { size: number; inset: number } };
const RL = tokens.recipes['icon-button'].layers as { part: string; prop: string; value: string; state?: string }[];
const LED_BG = RL.find((l) => l.part === 'led' && l.prop === 'background')!.value;
const LED_SH = RL.find((l) => l.part === 'led' && l.prop === 'shadow')!.value;
const S = 5;

type Spot = 'press' | 'states' | 'shape' | 'surface' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'press', title: 'Press', word: 'A quick tap' },
  { id: 'states', title: 'Latch', word: 'Staying down' },
  { id: 'shape', title: 'Shape', word: 'Size and corners' },
  { id: 'surface', title: 'Kinds', word: 'Tool, ghost and mini' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], shape: ['left', 0.48], surface: ['left', 0.76],
  states: ['right', 0.2], layers: ['right', 0.48], press: ['right', 0.76],
};

const UP: LayerDef[] = [
  { name: 'Fill', why: 'A dark grey cap, a little lighter at the top. Tools sit on a dark bar, so the cap is dark too.' },
  { name: 'Top light', why: 'A thin bright line on the top edge. On a dark cap this line is what shows it is raised.' },
  { name: 'Bottom line', why: 'A thin dark line on the bottom edge, where the cap turns away from the light.' },
  { name: 'Edge', why: 'A dark outline that keeps the cap apart from the dark bar.' },
  { name: 'Contact', why: 'A small shadow right under the cap, where it touches the bar.' },
  { name: 'Drop', why: 'A soft shadow a little lower. It shows the cap stands up.' },
];
const DOWN: LayerDef[] = [
  { name: 'Dark fill', why: 'Pressed, the cap is almost black. It looks like you are seeing into the hole it dropped into.' },
  { name: 'Inner shadow', why: 'A shadow inside the top edge. The cap is now below the bar, so the edge hides the light.' },
  { name: 'Edge', why: 'A dark outline, the same as when it is up.' },
  { name: 'Bottom light', why: 'A faint bright line under the bottom edge, like every hole in this system.' },
];

interface Model {
  latched: boolean; size: number; radius: number; glyph: number; lightDeg: number; lightK: number;
  up: boolean[]; down: boolean[];
}
const INITIAL: Model = {
  latched: false, size: P.tool.size, radius: P.tool.radius, glyph: P.tool.glyph, lightDeg: 0, lightK: 1,
  up: UP.map(() => true), down: DOWN.map(() => true),
};

export function IconButtonXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [tap, setTap] = React.useState(false);
  const [kind, setKind] = React.useState<'tool' | 'ghost' | 'mini'>('tool');
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const up = useStateLayers('icon-button', '', 'tool');
  const down = useStateLayers('icon-button', 'pressed', 'tool');
  const pressTap = () => { setTap(true); window.setTimeout(() => setTap(false), 160); };

  const isDown = m.latched || tap;
  const PAD = 8;
  const W = (m.size + PAD * 2) * S, H = W, x0 = PAD * S, w = m.size * S, r = m.radius * S;
  const grad = (v: string) => v.replace('linear-gradient(', `linear-gradient(${180 + m.lightDeg}deg, `);
  const shade = (list: string[], mask: boolean[]) => scalePx(list.map((v, i) => (mask[i + 1] ? aim(v, m.lightDeg, m.lightK) : null)).filter(Boolean).join(', ') || 'none', S);
  const fill = isDown ? (m.down[0] ? grad(down.fill) : 'transparent') : (m.up[0] ? grad(up.fill) : 'transparent');
  const shadow = isDown ? shade(down.shadows, m.down) : shade(up.shadows, m.up);
  const z = isDown ? 0.5 : 0.5 + P.tool.press * S;
  const WALL = 4;
  const top = capTop(z, WALL);
  const exploded = spot === 'layers';
  const press = `transform ${P.tool['press-time']} linear, box-shadow ${P.tool['shadow-time']} ease-out`;
  const led = P.led.size * S;

  const scene = exploded ? (
    <>
      <div className="xr-face is-flat" style={{ width: W, height: H, borderRadius: (m.radius + 6) * S, transform: 'translateZ(0.5px)', background: 'linear-gradient(#2b2b2e, #1f1f21)' }} />
      <Exploded layers={m.latched ? DOWN : UP} on={m.latched ? m.down : m.up} fill={grad(m.latched ? down.fill : up.fill)} shadows={m.latched ? down.shadows : up.shadows} x={x0} y={x0} w={w} h={w} r={r} z0={4} gap={20} focus={focus} scale={S} />
    </>
  ) : (
    <>
      <div className="xr-face is-flat" style={{ width: W, height: H, borderRadius: (m.radius + 6) * S, transform: 'translateZ(0.5px)', background: 'linear-gradient(#2b2b2e, #1f1f21)', boxShadow: '0 0 0 1px rgba(0,0,0,.4)' }} />
      <IsoCap x={x0} y={x0} w={w} h={w} r={r} z={z} wall={WALL} fill={fill} shadow={shadow} wallTone="#18181a" transition={press}>
        <span style={{ color: P.tool.ink, display: 'grid', placeItems: 'center' }}><Icon name="select" size={m.glyph * S} /></span>
        {m.latched && <span className="xr-led" style={{ top: P.led.inset * S, right: P.led.inset * S, width: led, height: led, background: LED_BG, boxShadow: scalePx(LED_SH, S) }} />}
      </IsoCap>
      {spot === 'shape' && (
        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${top + 1}px)` }} aria-hidden>
          <path d={`M${x0 - 18} ${x0}V${x0 + w}M${x0 - 24} ${x0}H${x0 - 12}M${x0 - 24} ${x0 + w}H${x0 - 12}`} />
          <text x={x0 - 28} y={x0 + w / 2} textAnchor="end" dominantBaseline="middle">{m.size}</text>
          {r > 2 && <path d={`M${x0 + r} ${x0}A${r} ${r} 0 0 0 ${x0} ${x0 + r}`} className="is-arc" />}
          <text x={x0 + r + 6} y={x0 - 8}>r {m.radius}</text>
        </svg>
      )}
    </>
  );

  const Zl = exploded ? 4 + ((m.latched ? DOWN : UP).length - 1) * 20 : top;
  const anchors: Record<Spot, [number, number, number]> = {
    press: [x0 + w * 0.85, x0 + w * 0.85, top - 2],
    states: [x0 + w - P.led.inset * S - led / 2, x0 + P.led.inset * S + led / 2, top + 1],
    shape: [x0 + r * 0.3, x0 + w - r * 0.3, top],
    surface: [W * 0.1, H * 0.9, 0.5],
    light: [x0 + w * 0.35, x0 + 2, top],
    layers: [x0 + w * 0.3, x0 + w * 0.3, Zl],
  };

  const real = (
    <span data-mu-colorway="graphite" className="material-frost-graphite inline-flex rounded-pill p-6">
      <IconButton variant="tool" label="Select" icon={<Icon name="select" size={16} />} pressed={m.latched} onClick={() => set({ latched: !m.latched })} />
    </span>
  );

  const card = (
    <>
      {spot === 'press' && (
        <>
          <p>Tap it and the cap drops {P.tool.press} pt in {P.tool['press-time']}, in a straight line, because your finger pushes at a steady speed. Its shadow shrinks a little slower, over {P.tool['shadow-time']}. Then it comes back up.</p>
          <p><button type="button" className="status" onPointerDown={pressTap}><span className="led" />Tap it</button></p>
        </>
      )}
      {spot === 'states' && (
        <>
          <p>Some tools stay on, like the one you are drawing with. Then the cap stays down, turns dark inside, and a small green light turns on in its corner. You can tell which tool is on from across the room.</p>
          <div className="xr-dials"><Switch label="Stay down" on={m.latched} onChange={(latched) => set({ latched })} /></div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>A {P.tool.size} pt square with round corners, big enough to hit easily. The icon is {P.tool.glyph} pt, in a light grey so it reads on the dark cap.</p>
          <div className="xr-dials">
            <Dial label="Size" value={m.size} min={24} max={56} step={1} fmt={(v) => `${v} pt`} onChange={(size) => set({ size })} />
            <Dial label="Corners" value={m.radius} min={0} max={m.size / 2} step={0.5} fmt={(v) => `${v} pt`} onChange={(radius) => set({ radius })} />
            <Dial label="Icon size" value={m.glyph} min={10} max={28} step={1} fmt={(v) => `${v} pt`} onChange={(glyph) => set({ glyph })} />
          </div>
        </>
      )}
      {spot === 'surface' && (
        <>
          <p>There are three kinds. A tool is a dark cap for a toolbar. A ghost is a flat round button that only shows a fill when you hover it. A mini is a tiny flat button inside a chip, like the ✓ on a suggestion.</p>
          <div className="xr-dials"><Switcher size="compact" aria-label="Kind" value={kind} onValueChange={(v) => setKind(v as typeof kind)} options={[{ value: 'tool', label: 'Tool' }, { value: 'ghost', label: 'Ghost' }, { value: 'mini', label: 'Mini' }]} /></div>
          <Proof>
            {kind === 'tool' ? real : kind === 'ghost' ? <IconButton variant="ghost" label="More" icon={<Icon name="more" size={14} />} /> : <span className="inline-flex items-center gap-4 rounded-pill px-6 ring-1 ring-rule"><span className="type-ui text-ink2">Track as mood?</span><IconButton variant="mini" accept label="Accept" icon={<>✓</>} /></span>}
          </Proof>
        </>
      )}
      {spot === 'light' && (
        <>
          <p>The same light as everything else. Up, the cap has a bright top edge. Down, the light is on the bottom edge instead, because it is now in a hole.</p>
          <LightDials deg={m.lightDeg} k={m.lightK} set={set} />
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The cap has one set of layers when it is up and another when it is down. Switch "Stay down" under Latch to see the other set.</p>
          <LayerList focus={focus} setFocus={setFocus} groups={[m.latched
            ? { title: 'Down', layers: DOWN, on: m.down, toggle: (i, v) => set({ down: m.down.map((x, j) => (j === i ? v : x)) }) }
            : { title: 'Up', layers: UP, on: m.up, toggle: (i, v) => set({ up: m.up.map((x, j) => (j === i ? v : x)) }) }]} />
        </>
      )}
      {spot !== 'surface' && <Proof>{real}</Proof>}
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 2.4 }} onClick={(e) => e.stopPropagation()}>{real}</div>}
      W={W} H={H} scene={scene} anchors={anchors}
      sun={spot === 'light' ? { deg: m.lightDeg, k: m.lightK, z: top + 120 } : undefined}
      onReset={() => setM(INITIAL)} deps={[spot, m, tap]}
      card={card}
    />
  );
}
