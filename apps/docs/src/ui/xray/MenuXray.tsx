import * as React from 'react';
import { Button, Kbd, Menu, MenuItem, MenuSeparator } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, capTop, scalePx, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · MENU
 *
 *   solid     a still of the menu: a heading, rows, a line, a red row
 *   x-ray     a frosted plate floating just below its button; one row lit
 *   play      Rows    ↑ ↓ move the lit row; the pointer and the keys share it; ↩ picks it
 *             Heading what the menu acts on, engraved
 *             Line    the engraved line between groups
 *             Glass   frosted light glass, 6 pt below its button
 *             Shape   padding · row corners · plate corners that follow
 *             Layers  the plate's layers
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.menu.props as { self: { 'min-width': number; pad: number; radius: number }; heading: { 'pad-top': number; 'pad-x': number; 'pad-bottom': number }; row: { height: number; pad: number; gap: number; radius: number; glyph: number }; sep: { thickness: number; 'inset-y': number; 'inset-x': number } };
const S = 1.8;
const ROWS = [
  { icon: 'task', label: 'Make a task', key: '⌘T' },
  { icon: 'pin', label: 'Pin to the canvas', key: '⌘P' },
  null,
  { icon: 'trash', label: 'Delete', key: '⌫', danger: true },
] as const;
const HEADING = 'NOTE · 3 LINES';

type Spot = 'states' | 'type' | 'well' | 'surface' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'Rows', word: 'The lit row' },
  { id: 'type', title: 'Heading', word: 'What it acts on' },
  { id: 'well', title: 'Line', word: 'Between groups' },
  { id: 'surface', title: 'Glass', word: 'Frost, close to its button' },
  { id: 'shape', title: 'Shape', word: 'Corners that match' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], type: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], states: ['right', 0.48], well: ['right', 0.76],
};

const LAYERS: LayerDef[] = [
  { name: 'Frost', why: 'A light, slightly see-through fill. The page shows through a little, so you remember where you are.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A faint dark edge along the bottom right.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Mid shadow', why: 'A larger soft shadow.' },
  { name: 'Far shadow', why: 'A very big, very faint shadow. The menu floats well above the page, but below tooltips.' },
];

interface Model { lit: number; heading: boolean; sep: boolean; offset: number; pad: number; rowR: number; follow: boolean; on: boolean[] }
const INITIAL: Model = { lit: 0, heading: true, sep: true, offset: 6, pad: P.self.pad, rowR: P.row.radius, follow: true, on: LAYERS.map(() => true) };
const rowIndexes = ROWS.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);

/** A still of the menu, drawn with its own classes (the live one lives in a portal). */
export function MenuStill({ lit = 0 }: { lit?: number }) {
  return (
    <div className="mu-menu" style={{ position: 'static', width: 220 }}>
      <div className="mu-menu-heading mu-type-label">{HEADING}</div>
      {ROWS.map((r, i) => r
        ? <div key={i} className="mu-menu-row mu-type-ui" data-highlighted={i === lit ? '' : undefined} data-danger={'danger' in r ? '' : undefined}><span className="mu-menu-glyph"><Icon name={r.icon} size={14} /></span><span className="mu-menu-label">{r.label}</span><Kbd size="small" className="mu-menu-key">{r.key}</Kbd></div>
        : <div key={i} className="mu-menu-sep" />)}
    </div>
  );
}

export function MenuXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const plate = useStateLayers('menu', '');
  const hover = useStateLayers('menu', 'hover', 'row');
  const sepL = useStateLayers('menu', '', 'sep');
  const cw = plate.colorway;

  const WIDTH = P.self['min-width'] + 20;
  const headH = m.heading ? P.heading['pad-top'] + 11 + P.heading['pad-bottom'] : 0;
  const sepH = m.sep ? P.sep.thickness + P.sep['inset-y'] * 2 : 0;
  const Hmenu = m.pad * 2 + headH + P.row.height * 3 + sepH;
  const BTN = 32;
  const Wp = WIDTH, Hp = BTN + m.offset + Hmenu;
  const W = Wp * S, H = Hp * S;
  const plateR = m.follow ? m.rowR + m.pad : P.self.radius;
  const z = 40;
  const top = capTop(z, 3);
  const exploded = spot === 'layers';
  const plateShadow = scalePx(plate.shadows.slice(0, 5).filter((_, i) => m.on[i + 1]).join(', ') || 'none', S);
  const y0 = (BTN + m.offset) * S;

  const move = (d: number) => { const k = rowIndexes.indexOf(m.lit); set({ lit: rowIndexes[(k + d + rowIndexes.length) % rowIndexes.length] }); setPicked(null); };
  const choose = () => { const r = ROWS[m.lit]; if (r) setPicked(r.label); };

  let y = m.pad + headH;
  const rows = ROWS.map((r, i) => { const at = y; y += r ? P.row.height : m.sep ? sepH : 0; return { r, i, at }; });

  const face = (
    <div className="xr-menuface" style={{ padding: m.pad * S, fontSize: 13 * S }}>
      {m.heading && <div className="xr-menuhead" style={{ height: headH * S, padding: `${P.heading['pad-top'] * S}px ${P.heading['pad-x'] * S}px 0`, fontSize: 9 * S }}>{HEADING}</div>}
      {rows.map(({ r, i }) => r ? (
        <div key={i} className="xr-menurow" style={{ height: P.row.height * S, padding: `0 ${P.row.pad * S}px`, gap: P.row.gap * S, borderRadius: m.rowR * S, background: m.lit === i ? hover.fill : 'transparent', color: 'danger' in r ? 'var(--mu-red, #D5392A)' : 'var(--ink)' }} onClick={() => { set({ lit: i }); setPicked(r.label); }}>
          <span style={{ display: 'grid', color: 'danger' in r ? 'inherit' : 'var(--ink2)' }}><Icon name={r.icon} size={P.row.glyph * S} /></span>
          <span style={{ flex: 1 }}>{r.label}</span>
          <span style={{ font: `500 ${9 * S}px/1 var(--mono)`, color: 'var(--ink3)' }}>{r.key}</span>
        </div>
      ) : m.sep ? <div key={i} style={{ height: sepH * S, display: 'flex', alignItems: 'center', padding: `0 ${P.sep['inset-x'] * S}px` }}><i style={{ flex: 1, height: P.sep.thickness * S, background: sepL.fill, boxShadow: scalePx(sepL.shadows[0] ?? 'none', S) }} /></div> : null)}
    </div>
  );

  const scene = (
    <>
      <IsoCap x={0} y={0} w={120 * S} h={BTN * S} r={(BTN * S) / 2} z={0.5} wall={4} fill="linear-gradient(#FFFFFF,#F4F3F0)" shadow={scalePx('inset 0 0 4px 1px rgba(255,255,255,.85), 0 0 0 .5px rgba(24,22,16,.05), 0 1px 2px rgba(24,22,16,.07)', S)} wallTone={cw === 'graphite' ? '#1c1c1f' : '#d9d7d1'}>
        <span style={{ font: `500 ${13 * S}px/1 var(--sans)`, color: '#1B1B1D' }}>Actions</span>
      </IsoCap>
      {exploded
        ? <Exploded layers={LAYERS} on={m.on} fill={plate.fill} shadows={plate.shadows} y={y0} w={W} h={Hmenu * S} r={plateR * S} z0={10} gap={14} focus={focus} scale={S} />
        : (
          <>
            <i className="xr-stem" style={{ left: 20 * S, top: BTN * S, height: z, transform: `translateZ(4px) rotateX(90deg)` }} />
            {m.on[8] && <div className="xr-shadow" style={{ top: y0, width: W, height: Hmenu * S, borderRadius: plateR * S, filter: 'blur(24px)', opacity: 0.18, transform: 'translate(10px, 24px)' }} />}
            <IsoCap y={y0} w={W} h={Hmenu * S} r={plateR * S} z={z} wall={3} fill={m.on[0] ? plate.fill : 'transparent'} shadow={plateShadow} wallTone={cw === 'graphite' ? '#1c1c1f' : '#e4e2dc'}>{face}</IsoCap>
          </>
        )}
    </>
  );

  const litRow = rows.find((r) => r.i === m.lit)!;
  const sepRow = rows.find((r) => !r.r)!;
  const anchors: Record<Spot, [number, number, number]> = {
    states: [W * 0.85, y0 + (litRow.at + P.row.height / 2) * S, top + 1],
    type: [(m.pad + P.heading['pad-x'] + 20) * S, y0 + (m.pad + headH / 2) * S, top + 1],
    well: [W * 0.8, y0 + (sepRow.at + sepH / 2) * S, top + 1],
    surface: [W * 0.1, y0 + 4, top],
    shape: [plateR * S * 0.3, y0 + Hmenu * S - plateR * S * 0.3, top],
    layers: exploded ? [W * 0.9, y0 + 10, 10 + (LAYERS.length - 1) * 14] : [W * 0.95, y0 + Hmenu * S * 0.9, top],
  };

  const real = (
    <Menu heading={HEADING} trigger={<Button>Actions</Button>}>
      <MenuItem icon={<Icon name="task" size={14} />} shortcut="⌘T" onSelect={() => setPicked('Make a task')}>Make a task</MenuItem>
      <MenuItem icon={<Icon name="pin" size={14} />} shortcut="⌘P" onSelect={() => setPicked('Pin to the canvas')}>Pin to the canvas</MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Icon name="trash" size={14} />} shortcut="⌫" danger onSelect={() => setPicked('Delete')}>Delete</MenuItem>
    </Menu>
  );

  const card = (
    <>
      {spot === 'states' && (
        <>
          <p>One row is lit at a time. Your pointer and the arrow keys move the same light, so you can switch between mouse and keys without losing your place. ↩ picks the lit row and the menu closes. A row that deletes things is red.</p>
          <div className="xr-actions-row">
            <button type="button" className="status" onClick={() => move(-1)}><span className="led off" />↑</button>
            <button type="button" className="status" onClick={() => move(1)}><span className="led off" />↓</button>
            <button type="button" className="status" onClick={choose}><span className="led" />↩ pick</button>
          </div>
          {picked && <p className="readout-t">picked: {picked}</p>}
        </>
      )}
      {spot === 'type' && (
        <>
          <p>The top line says what the menu will act on, in small engraved capitals. You always know which thing you are changing before you pick a row.</p>
          <div className="xr-dials"><Switch label="Heading" on={m.heading} onChange={(heading) => set({ heading })} /></div>
        </>
      )}
      {spot === 'well' && (
        <>
          <p>A thin line splits the rows into groups. The safe actions are on top and the red one is below the line, so you do not hit it by accident. The line is cut into the glass: dark, with a faint bright edge under it.</p>
          <div className="xr-dials"><Switch label="Line" on={m.sep} onChange={(sep) => set({ sep })} /></div>
        </>
      )}
      {spot === 'surface' && (
        <>
          <p>The menu is frosted glass, a little see-through. It opens {INITIAL.offset} pt below the button that opened it, or right at the pointer when you right-click, so your eye does not have to travel.</p>
          <div className="xr-dials"><Dial label="Gap to the button" value={m.offset} min={0} max={30} step={1} fmt={(v) => `${v} pt`} onChange={(offset) => set({ offset })} /></div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>The lit row has round corners, and the plate's corners are the row's corners plus the space around the rows. So the lit row always fits the plate with an even gap.</p>
          <div className="xr-dials">
            <Dial label="Space around the rows" value={m.pad} min={0} max={16} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />
            <Dial label="Row corners" value={m.rowR} min={0} max={15} step={0.5} fmt={(v) => `${v} pt`} onChange={(rowR) => set({ rowR })} />
            <Switch label="Plate corners follow the rows" on={m.follow} onChange={(follow) => set({ follow })} />
          </div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The plate has nine layers, including four shadows. Turn one off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on: m.on, toggle: (i, v) => set({ on: m.on.map((x, j) => (j === i ? v : x)) }) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
      <Proof>{real}</Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.4 }}><MenuStill lit={m.lit} /></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      hint={spot === 'states' ? 'Use ↑ ↓ in the card, or click a row' : undefined}
      onReset={() => { setM(INITIAL); setPicked(null); }} deps={[spot, m]}
      card={card}
    />
  );
}
