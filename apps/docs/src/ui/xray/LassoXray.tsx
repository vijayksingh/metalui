import * as React from 'react';
import { SizeReadout } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, IsoCap, Proof, Switch, XrayFrame, scalePx, tones, useStateLayers, type SpotDef } from './kit';
import { SnapCanvas } from '../SnapCanvas';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LASSO
 *
 *   solid     the playground: drag on empty canvas to draw a box
 *   x-ray     three notes on the page, a box drawn on the page over some of them, its
 *             count under it
 *   play      Box     width and height; a hairline over a faint fill
 *             Count   the number it will select, and only when it is more than none
 *             Touch   a note counts as soon as the box touches it
 *             Timing  follows the pointer; fades when you let go
 * ───────────────────────────────────────────────────────── */

const PR = tokens.presence as unknown as { 'readout-gap': number };
const S = 1.6;
const NOTES = [
  { id: 'a', x: 20, y: 20, w: 120, h: 44, t: 'call the printer' },
  { id: 'b', x: 170, y: 70, w: 130, h: 44, t: 'pick the typeface' },
  { id: 'c', x: 40, y: 140, w: 110, h: 44, t: 'book the venue' },
];

type Spot = 'shape' | 'type' | 'slide' | 'press';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'shape', title: 'Box', word: 'Line and fill' },
  { id: 'type', title: 'Count', word: 'What it will select' },
  { id: 'slide', title: 'Touch', word: 'When a note counts' },
  { id: 'press', title: 'Timing', word: 'With the pointer' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  shape: ['left', 0.3], slide: ['left', 0.7], type: ['right', 0.3], press: ['right', 0.7],
};

export function LassoXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('slide');
  const [w, setW] = React.useState(170);
  const [h, setH] = React.useState(110);
  const [held, setHeld] = React.useState(true);
  const card = useStateLayers('surface', 'raise-lite');
  const t = tones(card.colorway);
  const box = { x: 0, y: 0, w, h };
  const hit = (n: typeof NOTES[number]) => n.x < box.x + box.w && n.x + n.w > box.x && n.y < box.y + box.h && n.y + n.h > box.y;
  const count = NOTES.filter(hit).length;

  const Wp = 320, Hp = 210, W = Wp * S, H = Hp * S;
  const scene = (
    <>
      {NOTES.map((n) => (
        <IsoCap key={n.id} x={n.x * S} y={n.y * S} w={n.w * S} h={n.h * S} r={24 * S * 0.6} z={0.5} wall={3} fill={card.fill} shadow={scalePx(card.shadows.slice(0, 4).join(', '), S)} wallTone={t.wall}>
          <span className="type-ui" style={{ fontSize: 12 * S, color: hit(n) ? 'var(--ink)' : 'var(--ink3)' }}>{n.t}</span>
        </IsoCap>
      ))}
      {held && (
        <div className="xr-thumb" style={{ transform: 'translateZ(18px)' }}>
          <div className="mu-lasso presence-lasso" style={{ position: 'absolute', left: box.x * S, top: box.y * S, width: box.w * S, height: box.h * S, ['--mu-canvas-scale' as string]: 1 / S }}>
            {count > 0 && <span className="presence-lasso-readout"><SizeReadout value={count} unit={count === 1 ? 'block' : 'blocks'} /></span>}
          </div>
        </div>
      )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    shape: [box.w * S, box.h * S * 0.5, 18],
    type: [box.w * S * 0.5, (box.h + PR['readout-gap']) * S, 18],
    slide: [NOTES[1].x * S + 6, (NOTES[1].y + 10) * S, 4],
    press: [box.w * S, box.h * S, 18],
  };

  const cardBody = (
    <>
      {spot === 'shape' && (
        <>
          <p>A drag that starts on empty space draws a box: a thin green line over a very faint green fill. No moving dashes and no glow, so it never looks more important than the notes under it.</p>
          <div className="xr-dials">
            <Dial label="Width" value={w} min={20} max={320} step={5} fmt={(v) => `${v} pt`} onChange={setW} />
            <Dial label="Height" value={h} min={20} max={210} step={5} fmt={(v) => `${v} pt`} onChange={setH} />
          </div>
        </>
      )}
      {spot === 'type' && (
        <p>Under the box, a small dark readout counts what will be selected when you let go: ● {count} {count === 1 ? 'block' : 'blocks'}. The box shows where; only the count can show how many. When the box touches nothing, there is no readout.</p>
      )}
      {spot === 'slide' && (
        <>
          <p>A note counts as soon as the box touches it, even a corner. You do not have to fit the whole note inside. Make the box bigger or smaller and watch the count and the note text change.</p>
          <div className="xr-dials">
            <Dial label="Width" value={w} min={20} max={320} step={5} fmt={(v) => `${v} pt`} onChange={setW} />
            <Dial label="Height" value={h} min={20} max={210} step={5} fmt={(v) => `${v} pt`} onChange={setH} />
          </div>
          <p className="readout-t">{count} of {NOTES.length} notes touched</p>
        </>
      )}
      {spot === 'press' && (
        <>
          <p>The box follows your pointer in the same frame, whichever way you drag. When you let go, it fades and the notes it touched are selected.</p>
          <div className="xr-dials"><Switch label="Still dragging" on={held} onChange={setHeld} /></div>
        </>
      )}
      <Proof><SnapCanvas height={220} lasso /></Proof>
    </>
  );

  return (
    <XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div onClick={(e) => e.stopPropagation()} style={{ width: '100%' }}><SnapCanvas height={300} lasso /></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      onReset={() => { setW(170); setH(110); setHeld(true); }} deps={[spot, w, h, held]}
      card={cardBody}
    />
  );
}
