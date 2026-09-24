import * as React from 'react';
import { SnapGuides, type SnapGuide } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, IsoCap, Proof, Switch, XrayFrame, capTop, scalePx, tones, useStateLayers, type SpotDef } from './kit';
import { snapMove } from '../snapdemo';
import { SnapCanvas } from '../SnapCanvas';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SNAP GUIDES
 *
 *   solid     the playground canvas: drag a note near the others
 *   x-ray     a note on the page, a second note lifted as if you are dragging it, the
 *             invisible catch zones around the first note's edges and centre shown as
 *             pale bands, and the guides drawn on the page when the second note catches
 *   play      Catch     move the dragged note: inside a band it jumps onto the line
 *             Line      1 pt at every zoom
 *             Centre    edges solid, centres dashed
 *             Overshoot the line runs 8 pt past both notes
 *             Timing    with the snap, never after it; fades when you let go
 * ───────────────────────────────────────────────────────── */

const PR = tokens.presence as unknown as { 'snap-threshold': number; 'guide-overshoot': number; 'guide-dash': number; 'guide-width': number };
const S = 2.2;
const A = { id: 'a', x: 40, y: 0, w: 120, h: 44 };
const B0 = { id: 'b', y: 80, w: 120, h: 44 };

type Spot = 'slide' | 'shape' | 'states' | 'surface' | 'press';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'slide', title: 'Catch', word: 'The invisible band' },
  { id: 'shape', title: 'Line', word: 'One point at every zoom' },
  { id: 'states', title: 'Centre', word: 'Solid or dashed' },
  { id: 'surface', title: 'Overshoot', word: 'A little past both' },
  { id: 'press', title: 'Timing', word: 'With the snap' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  slide: ['left', 0.25], shape: ['left', 0.55], surface: ['left', 0.85],
  states: ['right', 0.3], press: ['right', 0.7],
};

export function SnapGuidesXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('slide');
  const [dx, setDx] = React.useState(9);
  const [held, setHeld] = React.useState(true);
  const [cmd, setCmd] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const card = useStateLayers('surface', 'raise-lite');
  const t = tones(card.colorway);
  const th = PR['snap-threshold'];

  const free = { ...B0, x: A.x + dx };
  const snap = cmd ? { box: free, guides: [] as SnapGuide[] } : snapMove(free, [A], th, 1);
  const b = snap.box;
  const guides = held ? snap.guides : [];
  const caught = !cmd && b.x !== free.x;

  const Wp = 200, Hp = 140, W = Wp * S, H = Hp * S;
  const lift = held ? 14 : 2;
  const fill = card.fill;
  const shadow = scalePx(card.shadows.slice(0, 4).join(', '), S);
  const bands = [A.x, A.x + A.w / 2, A.x + A.w];
  // The guides in scene pixels; scale 1/S keeps them magnified with everything else.
  const sceneGuides = guides.map((g) => ({ ...g, position: g.position * S, start: g.start * S, end: g.end * S }));

  const label = (s: string) => <span className="type-ui" style={{ fontSize: 13 * S, color: 'var(--ink2)' }}>{s}</span>;
  const scene = (
    <>
      {spot === 'slide' && bands.map((x) => (
        <div key={x} className="xr-face is-flat xr-catch" style={{ left: (x - th) * S, top: -12 * S, width: th * 2 * S, height: (Hp + 10) * S, transform: 'translateZ(0.4px)' }} />
      ))}
      <div className="xr-thumb" style={{ transform: 'translateZ(0.8px)' }}><SnapGuides guides={sceneGuides} scale={1 / S} /></div>
      <IsoCap x={A.x * S} y={A.y * S} w={A.w * S} h={A.h * S} r={24 * S * 0.6} z={0.5} wall={3} fill={fill} shadow={shadow} wallTone={t.wall}>{label('call the printer')}</IsoCap>
      {held && <div className="xr-shadow" style={{ left: b.x * S, top: b.y * S, width: b.w * S, height: b.h * S, borderRadius: 24 * S * 0.6, filter: 'blur(10px)', opacity: 0.2, transform: 'translate(6px, 12px)' }} />}
      <IsoCap x={b.x * S} y={b.y * S} w={b.w * S} h={b.h * S} r={24 * S * 0.6} z={lift} wall={3} fill={fill} shadow={shadow} wallTone={t.wall} transition="transform 120ms ease-out">{label('drag me')}</IsoCap>
    </>
  );

  const top = capTop(lift, 3);
  const anchors: Record<Spot, [number, number, number]> = {
    slide: [(A.x - th) * S, (A.y + A.h + 18) * S, 0.4],
    shape: [(A.x + A.w) * S, (A.y + A.h + 18) * S, 0.8],
    states: [(A.x + A.w / 2) * S, (A.y + A.h + 18) * S, 0.8],
    surface: [A.x * S, (b.y + b.h + 6) * S, 0.8],
    press: [(b.x + b.w) * S, (b.y + b.h / 2) * S, top],
  };

  const cardBody = (
    <>
      {spot === 'slide' && (
        <>
          <p>Around every edge and every centre of the other notes there is an invisible band, {th} pt on each side. When an edge of the note you are dragging enters a band, it jumps onto the line. Move the dragged note and watch it catch. Hold ⌘ to drag freely.</p>
          <div className="xr-dials">
            <Dial label="Where you drag it" value={dx} min={-30} max={30} step={1} fmt={(v) => `${v > 0 ? '+' : ''}${v} pt`} onChange={setDx} />
            <Switch label="Hold ⌘ (no snapping)" on={cmd} onChange={setCmd} />
          </div>
          <p className="readout-t">{cmd ? 'free · no guides' : caught ? `caught · jumped ${Math.abs(dx)} pt onto the line` : 'free · outside every band'}</p>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>A guide is always 1 pt on screen. When you zoom in, the canvas gets bigger but the line does not get fatter, so it never covers what it is lining up.</p>
          <div className="xr-dials"><Dial label="Zoom" value={zoom} min={0.25} max={3} step={0.25} fmt={(v) => `${Math.round(v * 100)} %`} onChange={setZoom} /></div>
          <p className="readout-t">drawn {(PR['guide-width'] / zoom).toFixed(2)} pt wide in the canvas · {PR['guide-width']} pt on your screen</p>
        </>
      )}
      {spot === 'states' && (
        <p>A solid line means two edges line up. A dashed line, {PR['guide-dash']} pt on and {PR['guide-dash']} pt off, means two centres line up. Here the notes are the same width, so the left edges, the centres and the right edges all line up at once: two solid lines and one dashed.</p>
      )}
      {spot === 'surface' && (
        <p>Each line starts at the first note and ends at the last, plus {PR['guide-overshoot']} pt at both ends. The extra bit makes it read as a line that joins them, not as the edge of one of them.</p>
      )}
      {spot === 'press' && (
        <>
          <p>The guide appears in the same instant as the snap and moves with it, never after. A guide that arrived late would disagree with where the note already is. When you let go, the guides fade away quickly.</p>
          <p>On a Mac, the trackpad gives one small tap the moment a new line catches. Staying on the line is silent, and so is letting go. Browsers on a Mac or an iPhone cannot tap the trackpad, so on the web there is only the line.</p>
          <div className="xr-dials"><Switch label="Still dragging" on={held} onChange={setHeld} /></div>
        </>
      )}
      <Proof><SnapCanvas height={220} /></Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div onClick={(e) => e.stopPropagation()} style={{ width: '100%' }}><SnapCanvas height={300} /></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      hint={spot === 'slide' ? 'Use the dial to move the dragged note' : undefined}
      onReset={() => { setDx(9); setHeld(true); setCmd(false); setZoom(1); }} deps={[spot, dx, held, cmd]}
      card={cardBody}
    />
  );
}
