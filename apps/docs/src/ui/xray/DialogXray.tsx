import * as React from 'react';
import { Button, Surface } from '@unlocalhosted/metalui';
import { RenameDemo } from '../rename/RenameDemo';
import { tokens } from '../../lib/tokens';
import { Exploded, IsoCap, XrayFrame, capTop, scalePx, useStateLayers, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import { DIM, RISE, TOP, DialogSpecimenCard, arrive, withAlpha, type DialogModel } from './DialogSpecimens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · DIALOG (three layers deep: the page, a dimming sheet, the dialog)
 *
 *   solid     a button that opens a real dialog
 *   x-ray     the page lies flat; a thin see-through sheet floats over it; the dialog floats
 *             above that, near the top, with a title and two buttons
 *   card      the real dialog in a small window, handled (DialogSpecimens.tsx):
 *             Sheet    drag on the sheet: how much it dims the page
 *             Opening  pull it up and let go: how far it drops in from
 *             Focus    drag the focus ring: Tab stays inside; Escape closes it
 *             Place    drag it up or down: near the top, not the middle
 *             Shadow   lift it: how high it floats
 *             Layers   a switch per layer
 * ───────────────────────────────────────────────────────── */

const D = tokens.recipes.dialog.props as { scrim: { color: Record<string, string> } };
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

type Model = DialogModel;
const INITIAL: Model = { dim: DIM, top: TOP, lift: 1, rise: RISE, on: LAYERS.map(() => true) };

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
  const reopen = React.useCallback(() => { setOpen(true); setCycle((n) => n + 1); setFocusAt(0); }, []);
  // the bench arrives the way the dialog does: from the drop above, on the surface spring
  const wrap = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (cycle) arrive(wrap.current, m.rise * S); }, [cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const body = (
    <div className="xr-dialogface" style={{ padding: 14 * S, gap: 10 * S }}>
      <b style={{ font: `600 ${14 * S}px/1.2 var(--sans)`, color: 'var(--ink)' }}>Rename canvas</b>
      <span className={focusAt === 0 && spot === 'press' ? 'xr-dfield is-focus' : 'xr-dfield'} style={{ height: 26 * S, borderRadius: 10 * S, fontSize: 12 * S, padding: `0 ${10 * S}px` }}>Trip notes</span>
      <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 * S }}>
        {['Cancel', 'Rename'].map((b, i) => <span key={b} className={focusAt === i + 1 && spot === 'press' ? 'xr-dbtn is-focus' : 'xr-dbtn'} style={{ height: 22 * S, padding: `0 ${10 * S}px`, fontSize: 11 * S, background: b === 'Rename' ? '#1B1B1D' : undefined, color: b === 'Rename' ? '#F2F2F0' : undefined }}>{b}</span>)}
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
          <div key={cycle} ref={wrap} className="xr-dialogwrap">
            <div className="xr-face is-flat xr-sheet3d" style={{ width: W, height: H, borderRadius: 18 * S, transform: `translateZ(${zSheet}px)`, background: withAlpha(D.scrim.color[cw], m.dim) }} onClick={() => setOpen(false)} />
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
    <DialogSpecimenCard spot={spot} m={m} set={set} fill={plate.fill} shadows={plate.shadows} cw={cw} layers={LAYERS} focus={setFocus}
      open={open} setOpen={setOpen} focusAt={focusAt} setFocusAt={setFocusAt} replay={reopen} real={real} setReal={setReal} />
  );

  return (
    <HintLayer>
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }} onClick={(e) => { e.stopPropagation(); setReal(true); }}><Button>Rename canvas…</Button></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      onReset={() => { setM(INITIAL); reopen(); }} deps={[spot, m, open]}
      card={card}
    />
    <RenameDemo dialog open={real} onOpenChange={setReal} trigger={false} initial="Trip notes" label="Name" testId="rename-canvas-xray" />
    </HintLayer>
  );
}

/** A still of a small dialog, for the floating table. */
export function DialogStill() {
  return (
    <Surface material="plate" radius="card" style={{ width: 210, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <b style={{ font: '600 13px/1.2 var(--sans)' }}>Rename canvas</b>
      <span className="xr-dfield" style={{ height: 28, borderRadius: 10, padding: '0 10px', font: '500 12px var(--sans)' }}>Trip notes</span>
      <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, zoom: 0.85 }}><Button tabIndex={-1}>Cancel</Button><Button tabIndex={-1} cap="primary">Rename</Button></span>
    </Surface>
  );
}
