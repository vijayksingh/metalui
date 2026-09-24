import * as React from 'react';
import { Kbd } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { Exploded, IsoCap, IsoTray, LayerList, Proof, XrayFrame, capTop, scalePx, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · COMMAND PALETTE (a block: a plate, a field, rows and a footer of keys)
 *
 *   solid     a still of the palette
 *   x-ray     a frosted plate high over a dimmed page; a field sunk into its top, rows under it,
 *             the chosen row raised with a green bar, keys along the bottom
 *   play      Field   type; the list refilters at once and the first row is chosen again
 *             Rows    ↑ ↓ move the choice; it moves at once, no animation
 *             Labels  section names with counts; the typed words marked in each row
 *             Keys    every key it uses is shown at the bottom
 *             Plate   frost over a dimmed page, like a dialog
 *             Layers  the plate's layers
 * ───────────────────────────────────────────────────────── */

const S = 1.2;
const PW = 360;

type Spot = 'well' | 'states' | 'type' | 'press' | 'surface' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'well', title: 'Field', word: 'Where you type' },
  { id: 'states', title: 'Rows', word: 'The chosen row' },
  { id: 'type', title: 'Labels', word: 'Sections and matches' },
  { id: 'press', title: 'Keys', word: 'Shown at the bottom' },
  { id: 'surface', title: 'Plate', word: 'Over a dimmed page' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], well: ['left', 0.48], type: ['left', 0.76],
  layers: ['right', 0.2], states: ['right', 0.48], press: ['right', 0.76],
};

const LAYERS: LayerDef[] = [
  { name: 'Frost', why: 'A light, slightly see-through plate. You can still sense the page under it.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A faint dark edge along the bottom right.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Mid shadow', why: 'A larger soft shadow.' },
  { name: 'Far shadow', why: 'A very big, very faint shadow. The palette floats as high as a dialog.' },
];

type Row = { sec: string; label: string; key?: string; icon: 'search' | 'plus' | 'tidy' | 'trash'; danger?: boolean };
const ACTIONS: Row[] = [
  { sec: 'ACTIONS', label: 'New canvas', key: '⌘N', icon: 'plus' },
  { sec: 'ACTIONS', label: 'Tidy the canvas', key: '⌘T', icon: 'tidy' },
  { sec: 'ACTIONS', label: 'Delete selection', key: '⌫', icon: 'trash', danger: true },
];
const rowsFor = (q: string): Row[] => {
  const t = q.trim().toLowerCase();
  const acts = t ? ACTIONS.filter((a) => a.label.toLowerCase().includes(t)) : ACTIONS;
  return [...(t ? [{ sec: 'LENS', label: `See “${q.trim()}”`, icon: 'search' as const }] : []), ...acts];
};
const mark = (text: string, q: string) => {
  const t = q.trim(); if (!t) return text;
  const i = text.toLowerCase().indexOf(t.toLowerCase()); if (i < 0) return text;
  return <>{text.slice(0, i)}<mark className="xr-pmark">{text.slice(i, i + t.length)}</mark>{text.slice(i + t.length)}</>;
};

export function PaletteXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('well');
  const [q, setQ] = React.useState('tidy');
  const [sel, setSel] = React.useState(0);
  const [on, setOn] = React.useState(LAYERS.map(() => true));
  const [focus, setFocus] = React.useState<string | null>(null);
  const plate = useStateLayers('surface', 'plate');
  const well = useStateLayers('well', 'field');
  const cw = plate.colorway;
  const rows = rowsFor(q);
  const s = Math.min(sel, Math.max(0, rows.length - 1));
  const type = (v: string) => { setQ(v); setSel(0); };

  const sections = rows.reduce<{ name: string; rows: (Row & { i: number })[] }[]>((acc, r, i) => {
    const last = acc[acc.length - 1];
    if (last && last.name === r.sec) last.rows.push({ ...r, i }); else acc.push({ name: r.sec, rows: [{ ...r, i }] });
    return acc;
  }, []);
  const PH = 16 + 40 + 10 + sections.length * 22 + rows.length * 32 + 36 + 8;
  const W = PW * S, H = PH * S;
  const z = 40, top = capTop(z, 3);
  const exploded = spot === 'layers';
  const shadow = scalePx(plate.shadows.slice(0, 5).filter((_, i) => on[i + 1]).join(', ') || 'none', S);

  const face = (
    <div className="xr-paletteface" style={{ padding: `${8 * S}px ${8 * S}px 0` }}>
      <div style={{ height: 40 * S, position: 'relative', flex: 'none' }}>
        <IsoTray w={W - 16 * S} h={40 * S} r={15 * S} depth={3} fill={well.fill} shadow={scalePx(well.shadows.join(', '), S)} colorway={cw} />
        <span className="xr-pfield" style={{ height: 40 * S, gap: 10 * S, padding: `0 ${14 * S}px`, fontSize: 15 * S }}>
          <span style={{ display: 'grid', color: 'var(--ink3)' }}><Icon name="search" size={15 * S} /></span>
          <span>{q || <span style={{ color: 'var(--ink3)' }}>Lens or action</span>}</span><i className="xr-caret" style={{ background: '#3FB97A', height: 18 * S }} />
        </span>
      </div>
      <div style={{ paddingTop: 10 * S, flex: 1 }}>
        {sections.map((sec) => (
          <div key={sec.name}>
            <div className="xr-psec" style={{ height: 22 * S, padding: `0 ${10 * S}px`, fontSize: 9 * S }}><span>{sec.name}</span><span>{sec.rows.length}</span></div>
            {sec.rows.map((r) => (
              <div key={r.label} className={r.i === s ? 'xr-prow is-on' : 'xr-prow'} onClick={() => setSel(r.i)} style={{ height: 32 * S, gap: 8 * S, padding: `0 ${10 * S}px`, borderRadius: 11 * S, fontSize: 13 * S, color: r.danger ? 'var(--mu-red, #D5392A)' : 'var(--ink)' }}>
                {r.i === s && <i className="xr-pbar" style={{ width: 2.5 * S, height: 14 * S }} />}
                <span style={{ display: 'grid', color: r.danger ? 'inherit' : 'var(--ink2)' }}><Icon name={r.icon} size={14 * S} /></span>
                <span style={{ flex: 1 }}>{mark(r.label, q)}</span>
                {r.key && <span style={{ font: `500 ${9 * S}px/1 var(--mono)`, color: 'var(--ink3)' }}>{r.key}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={spot === 'press' ? 'xr-pfoot is-lit' : 'xr-pfoot'} style={{ height: 36 * S, gap: 14 * S, fontSize: 9 * S, padding: `0 ${10 * S}px` }}>
        <span>↑ ↓ MOVE</span><span>↩ OPEN</span><span>⇧↩ PIN</span><span>⎋ CLOSE</span>
      </div>
    </div>
  );

  const scene = (
    <>
      <div className="xr-face is-flat" style={{ left: -30 * S, top: -20 * S, width: W + 60 * S, height: H + 40 * S, borderRadius: 18 * S, transform: 'translateZ(0.5px)', background: cw === 'graphite' ? 'rgba(14,14,15,.25)' : 'rgba(243,243,241,.25)', boxShadow: '0 0 0 1px color-mix(in srgb, var(--ink) 8%, transparent)' }} />
      {exploded
        ? <Exploded layers={LAYERS} on={on} fill={plate.fill} shadows={plate.shadows} w={W} h={H} r={24 * S} z0={10} gap={14} focus={focus} scale={S} />
        : (
          <>
            {on[8] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: 24 * S, filter: 'blur(22px)', opacity: 0.2, transform: 'translate(12px, 26px)' }} />}
            <IsoCap w={W} h={H} r={24 * S} z={z} wall={3} fill={on[0] ? plate.fill : 'transparent'} shadow={shadow} wallTone={cw === 'graphite' ? '#1c1c1f' : '#e4e2dc'}>{face}</IsoCap>
          </>
        )}
    </>
  );

  const rowY = (i: number) => { let y = 8 + 40 + 10; for (const sec of sections) { y += 22; for (const r of sec.rows) { if (r.i === i) return y + 16; y += 32; } } return y; };
  const anchors: Record<Spot, [number, number, number]> = {
    well: [40 * S, 28 * S, top],
    states: [W - 20 * S, rowY(s) * S, top + 1],
    type: [30 * S, (8 + 40 + 10 + 11) * S, top + 1],
    press: [W * 0.7, H - 18 * S, top + 1],
    surface: [W * 0.05, H * 0.9, top],
    layers: exploded ? [W * 0.9, 20, 10 + (LAYERS.length - 1) * 14] : [W - 12, 12, top],
  };

  const card = (
    <>
      {spot === 'well' && (
        <>
          <p>The field is a tray sunk into the top of the plate. Type and the list changes at once, with no waiting. The first row is always chosen again, so ↩ does the most likely thing.</p>
          <input className="xr-pinput" value={q} onChange={(e) => type(e.target.value)} placeholder="Type here" aria-label="Palette query" />
        </>
      )}
      {spot === 'states' && (
        <>
          <p>The chosen row is a raised cap with a short green bar on its left. It jumps from row to row with no animation, because you read a list by scanning, and a moving highlight would lag behind your eyes.</p>
          <div className="xr-actions-row">
            <button type="button" className="status" onClick={() => setSel((s - 1 + rows.length) % rows.length)}><span className="led off" />↑</button>
            <button type="button" className="status" onClick={() => setSel((s + 1) % rows.length)}><span className="led off" />↓</button>
          </div>
        </>
      )}
      {spot === 'type' && (
        <>
          <p>Rows are grouped under small engraved names, each with a count, so you can see how much is below. The words you typed are marked inside each row, so you can see why it matched.</p>
          <input className="xr-pinput" value={q} onChange={(e) => type(e.target.value)} placeholder="Type here" aria-label="Palette query" />
        </>
      )}
      {spot === 'press' && (
        <>
          <p>The bottom line lists every key the palette understands. You learn the shortcuts just by using it. Rows that have their own shortcut show it on the right.</p>
          <Proof><span className="flex items-center gap-6"><Kbd size="small">↑</Kbd><Kbd size="small">↓</Kbd><span className="eng">move</span><Kbd size="small">↩</Kbd><span className="eng">open</span></span></Proof>
        </>
      )}
      {spot === 'surface' && (
        <p>The palette is a frosted plate over a dimmed page, like a dialog. It opens with ⌘K from anywhere, and ⎋ or a click outside closes it at once.</p>
      )}
      {spot === 'layers' && (
        <>
          <p>The plate has nine layers. The field inside it is a tray, like any field. Turn a layer off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on, toggle: (i, v) => setOn(on.map((x, j) => (j === i ? v : x))) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div className="xr-palette-solid" style={{ width: W, height: H, borderRadius: 24 * S, background: plate.fill, boxShadow: scalePx(plate.shadows.join(', '), S), zoom: 0.75 }}>{face}</div>}
      W={W} H={H} scene={scene} anchors={anchors}
      onReset={() => { setQ('tidy'); setSel(0); setOn(LAYERS.map(() => true)); }} deps={[spot, q, s, on]}
      card={card}
    />
  );
}

/** A small still of the palette, drawn with its own classes (the live one lives in a dialog). */
export function PaletteStill() {
  return (
    <div className="mu-palette mu-frost-plate" style={{ position: 'static', transform: 'none', translate: 'none', margin: 0, width: 300 }}>
      <label className="mu-palette-field"><span className="mu-palette-field-glyph"><Icon name="search" size={15} /></span><span className="mu-palette-input mu-type-content">tidy</span></label>
      <div className="mu-palette-list" style={{ maxHeight: 'none' }}>
        <div className="mu-palette-sec mu-type-label"><span className="mu-palette-eng">ACTIONS</span><span className="mu-palette-eng">1</span></div>
        <div className="mu-palette-row mu-type-ui" data-highlighted=""><span className="mu-palette-row-glyph"><Icon name="tidy" size={14} /></span><span className="mu-palette-row-text"><mark className="mu-palette-mark">Tidy</mark> the canvas</span><span className="mu-palette-row-hint"><Kbd size="small">⌘T</Kbd></span></div>
      </div>
      <div className="mu-palette-foot mu-type-label"><span><Kbd size="small">↩</Kbd><span className="mu-palette-eng">OPEN</span></span></div>
    </div>
  );
}
