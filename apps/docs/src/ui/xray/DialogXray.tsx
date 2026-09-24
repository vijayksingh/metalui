import * as React from 'react';
import { Button, Dialog, Surface } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, capTop, scalePx, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · DIALOG (three layers deep: the page, a dimming sheet, the dialog)
 *
 *   solid     a button that opens a real dialog
 *   x-ray     the page lies flat; a thin see-through sheet floats over it; the dialog floats
 *             above that, near the top, with a title and two buttons
 *   play      Sheet    how much it dims the page
 *             Opening  it drops in a step from above, without bouncing
 *             Focus    Tab stays inside; Escape or a click outside closes it
 *             Place    near the top, not the middle
 *             Shadow   how high it floats
 *             Layers   the dialog's layers
 * ───────────────────────────────────────────────────────── */

const D = tokens.recipes.dialog.props as { scrim: { color: Record<string, string> }; self: { top: string; 'enter-y': number; 'enter-scale': string } };
const S = 1.3;
const PAGE_W = 300, PAGE_H = 210, DW = 196, DH = 112;

type Spot = 'surface' | 'states' | 'press' | 'shape' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'surface', title: 'Sheet', word: 'Dimming the page' },
  { id: 'states', title: 'Opening', word: 'How it arrives' },
  { id: 'press', title: 'Focus', word: 'Staying inside' },
  { id: 'shape', title: 'Place', word: 'Near the top' },
  { id: 'shadow', title: 'Shadow', word: 'Floating high' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], shape: ['left', 0.48], shadow: ['left', 0.76],
  layers: ['right', 0.2], states: ['right', 0.48], press: ['right', 0.76],
};

const LAYERS: LayerDef[] = [
  { name: 'Plate', why: 'A light plate, a little lighter at the top. The same stuff as a card, so a dialog feels like a card lifted off the page.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A faint dark edge along the bottom right.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Mid shadow', why: 'A larger soft shadow.' },
  { name: 'Far shadow', why: 'A very big, very faint shadow. Together they lift the dialog well above the page.' },
];
const FOCUSABLE = ['Name field', 'Cancel', 'Save'];

interface Model { dim: number; top: number; lift: number; on: boolean[] }
const INITIAL: Model = { dim: 0.25, top: parseFloat(D.self.top), lift: 1, on: LAYERS.map(() => true) };

export function DialogXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('surface');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [open, setOpen] = React.useState(true);
  const [cycle, setCycle] = React.useState(0);
  const [focusAt, setFocusAt] = React.useState(0);
  const [real, setReal] = React.useState(false);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const plate = useStateLayers('surface', 'plate');
  const cw = plate.colorway;

  const W = PAGE_W * S, H = PAGE_H * S;
  const dx = ((PAGE_W - DW) / 2) * S, dy = (PAGE_H * m.top) / 100 * S;
  const zSheet = 18, zDialog = 40 + m.lift * 30;
  const top = capTop(zDialog, 3);
  const exploded = spot === 'layers';
  const shadow = scalePx(plate.shadows.slice(0, 5).filter((_, i) => m.on[i + 1]).join(', ') || 'none', S);
  const reopen = () => { setOpen(true); setCycle((n) => n + 1); setFocusAt(0); };

  const body = (
    <div className="xr-dialogface" style={{ padding: 14 * S, gap: 10 * S }}>
      <b style={{ font: `600 ${14 * S}px/1.2 var(--sans)`, color: 'var(--ink)' }}>Rename canvas</b>
      <span className={focusAt === 0 && spot === 'press' ? 'xr-dfield is-focus' : 'xr-dfield'} style={{ height: 26 * S, borderRadius: 10 * S, fontSize: 12 * S, padding: `0 ${10 * S}px` }}>Trip notes</span>
      <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 * S }}>
        {['Cancel', 'Save'].map((b, i) => <span key={b} className={focusAt === i + 1 && spot === 'press' ? 'xr-dbtn is-focus' : 'xr-dbtn'} style={{ height: 22 * S, padding: `0 ${10 * S}px`, fontSize: 11 * S, background: b === 'Save' ? '#1B1B1D' : undefined, color: b === 'Save' ? '#F2F2F0' : undefined }}>{b}</span>)}
      </span>
    </div>
  );

  const page = (
    <div className="xr-face is-flat" style={{ width: W, height: H, borderRadius: 18 * S, transform: 'translateZ(0.5px)', background: 'var(--page)', boxShadow: '0 0 0 1px color-mix(in srgb, var(--ink) 10%, transparent)' }}>
      <span className="xr-pagelines" style={{ padding: 18 * S, gap: 9 * S }}>{[0.8, 0.55, 0.7, 0.4, 0.65].map((w, i) => <i key={i} style={{ width: `${w * 100}%`, height: 6 * S }} />)}</span>
    </div>
  );

  const scene = (
    <>
      {page}
      {exploded
        ? <Exploded layers={LAYERS} on={m.on} fill={plate.fill} shadows={plate.shadows} x={dx} y={dy} w={DW * S} h={DH * S} r={24 * S} z0={30} gap={14} focus={focus} scale={S} />
        : open && (
          <div key={cycle} className={cycle ? 'xr-dialogwrap is-arriving' : 'xr-dialogwrap'}>
            <div className="xr-face is-flat xr-sheet3d" style={{ width: W, height: H, borderRadius: 18 * S, transform: `translateZ(${zSheet}px)`, background: D.scrim.color[cw].replace(/,\s*\.25\)/, `, ${m.dim})`) }} onClick={() => setOpen(false)} />
            {m.on[8] && <div className="xr-shadow" style={{ left: dx, top: dy, width: DW * S, height: DH * S, borderRadius: 24 * S, filter: 'blur(20px)', opacity: 0.22, transform: `translate(12px, 26px) translateZ(${zSheet + 1}px)` }} />}
            <IsoCap x={dx} y={dy} w={DW * S} h={DH * S} r={24 * S} z={zDialog} wall={3} fill={m.on[0] ? plate.fill : 'transparent'} shadow={shadow} wallTone={cw === 'graphite' ? '#1c1c1f' : '#e4e2dc'}>{body}</IsoCap>
          </div>
        )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.12, H * 0.85, zSheet],
    states: [dx + DW * S * 0.9, dy + 6, top],
    press: [dx + DW * S * 0.8, dy + DH * S * 0.8, top + 1],
    shape: [dx + 4, dy, top],
    shadow: [dx + DW * S * 0.5, dy + DH * S + 10, zSheet + 1],
    layers: exploded ? [dx + DW * S * 0.9, dy + 8, 30 + (LAYERS.length - 1) * 14] : [dx + DW * S * 0.1, dy + DH * S * 0.9, top],
  };

  const card = (
    <>
      {spot === 'surface' && (
        <>
          <p>When a dialog opens, a thin sheet slides over the page and dims it a little, {Math.round(INITIAL.dim * 100)}%. Your eye goes to the dialog, but you can still see where you were. Click the sheet and the dialog closes.</p>
          <div className="xr-dials"><Dial label="Dim" value={m.dim} min={0} max={0.9} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(dim) => set({ dim })} /></div>
        </>
      )}
      {spot === 'states' && (
        <>
          <p>The dialog drops in from {Math.abs(D.self['enter-y'])} pt above while growing from {Number(D.self['enter-scale']) * 100}% to full size. It settles without bouncing, because it is a surface, not a part you pushed. It leaves faster than it came.</p>
          <p><button type="button" className="status" onClick={reopen}><span className="led" />Open it again</button></p>
        </>
      )}
      {spot === 'press' && (
        <>
          <p>While a dialog is open, Tab only moves between the things inside it. You cannot tab out to the page by accident. Escape closes it, and so does a click on the dimmed page. Then focus goes back to the button that opened it.</p>
          <div className="xr-actions-row">
            <button type="button" className="status" onClick={() => { setOpen(true); setFocusAt((f) => (f + 1) % FOCUSABLE.length); }}><span className="led off" />Tab</button>
            <button type="button" className="status" onClick={() => setOpen(false)}><span className="led off" />Escape</button>
            {!open && <button type="button" className="status" onClick={reopen}><span className="led" />Open</button>}
          </div>
          <p className="readout-t">{open ? `focus: ${FOCUSABLE[focusAt]}` : 'closed · focus is back on the button'}</p>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>The dialog sits {INITIAL.top}% down from the top of the window, not in the middle. That is closer to where your eyes already are, and it leaves room below for a keyboard or a longer form.</p>
          <div className="xr-dials"><Dial label="Distance from the top" value={m.top} min={0} max={46} step={1} fmt={(v) => `${v}%`} onChange={(v) => set({ top: v })} /></div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>A dialog floats the highest of the large surfaces, with four shadows from small to very big. Its shadow falls on the dimmed sheet, not on the page.</p>
          <div className="xr-dials"><Dial label="Height" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} /></div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The dialog is a plate with nine layers. Turn one off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on: m.on, toggle: (i, v) => set({ on: m.on.map((x, j) => (j === i ? v : x)) }) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
      <Proof><Switch label="Open a real dialog" on={real} onChange={setReal} /></Proof>
    </>
  );

  return (
    <>
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }} onClick={(e) => { e.stopPropagation(); setReal(true); }}><Button>Rename canvas…</Button></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      onReset={() => { setM(INITIAL); reopen(); }} deps={[spot, m, open]}
      card={card}
    />
    <Dialog open={real} onOpenChange={setReal}>
        <Dialog.Popup aria-label="Rename canvas" style={{ width: 320, padding: 20 }}>
          <b style={{ display: 'block', marginBottom: 12 }}>Rename canvas</b>
          <input defaultValue="Trip notes" aria-label="Name" style={{ width: '100%', height: 32, borderRadius: 10, border: '1px solid var(--rule)', padding: '0 10px', font: 'inherit', background: 'transparent', color: 'inherit' }} />
          <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><Button onClick={() => setReal(false)}>Cancel</Button><Button cap="primary" onClick={() => setReal(false)}>Save</Button></span>
        </Dialog.Popup>
      </Dialog>
    </>
  );
}

/** A still of a small dialog, for the floating table. */
export function DialogStill() {
  return (
    <Surface material="plate" radius="card" style={{ width: 210, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <b style={{ font: '600 13px/1.2 var(--sans)' }}>Rename canvas</b>
      <span className="xr-dfield" style={{ height: 28, borderRadius: 10, padding: '0 10px', font: '500 12px var(--sans)' }}>Trip notes</span>
      <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, zoom: 0.85 }}><Button tabIndex={-1}>Cancel</Button><Button tabIndex={-1} cap="primary">Save</Button></span>
    </Surface>
  );
}
