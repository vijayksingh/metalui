import * as React from 'react';
import { SuggestionChip } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, aim, capTop, scalePx, tones, useStateLayers, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SUGGESTION CHIP
 *
 *   solid     a chip asking "Track as mood?" with its confidence and ✓ ×
 *   x-ray     a thin frosted pill standing low on the page, text and buttons on top
 *   play      Type     the question and how sure the app is
 *             States   quiet at rest, clear when you point at its line; how it arrives
 *             Press    ✓ accept · × dismiss
 *             Surface  frost and the green hairline
 *             Shape    height · padding
 *             Layers   seven layers, each switchable
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.chip.props.suggestion as { height: number; 'pad-left': number; 'pad-right': number; gap: number; ink: Record<string, string> };
const S = 3;

type Spot = 'type' | 'states' | 'press' | 'surface' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'type', title: 'Type', word: 'The question' },
  { id: 'states', title: 'States', word: 'Quiet until you look' },
  { id: 'press', title: 'Answer', word: 'Yes or no' },
  { id: 'surface', title: 'Surface', word: 'Frost and a green line' },
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], type: ['left', 0.48], shape: ['left', 0.76],
  states: ['right', 0.2], layers: ['right', 0.48], press: ['right', 0.76],
};

const LAYERS: LayerDef[] = [
  { name: 'Frost', why: 'A see-through light fill. The page shows through a little, so the chip feels like it floats over the text, not part of it.' },
  { name: 'Green line', why: 'A thin green outline. Green means "the app suggests this". You can tell a suggestion from your own writing at a glance.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge, so the frost looks like soft plastic.' },
  { name: 'Top light', why: 'A thin bright line on the top left edge. It shows the chip is raised a little.' },
  { name: 'Rim', why: 'A very thin dark outline under the green line, so the edge stays sharp.' },
  { name: 'Contact', why: 'A small shadow right under the chip.' },
  { name: 'Drop', why: 'A soft shadow a little lower. The chip floats just above the page.' },
];

interface Model {
  label: string; conf: number; host: boolean; hairline: boolean; frost: number;
  h: number; padL: number; on: boolean[];
}
const INITIAL: Model = { label: 'Track as mood?', conf: 0.8, host: false, hairline: true, frost: 0.7, h: P.height, padL: P['pad-left'], on: LAYERS.map(() => true) };
const QUESTIONS = ['Track as mood?', 'Task?', 'Date friday?', 'Move to Done?'];

export function ChipXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [gone, setGone] = React.useState<null | 'yes' | 'no'>(null);
  const [arrive, setArrive] = React.useState(0);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const rec = useStateLayers('chip', '', 'suggestion');
  const cw = rec.colorway;
  const t = tones(cw);

  const measure = React.useRef<HTMLSpanElement>(null);
  const [textW, setTextW] = React.useState(110);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [m.label, m.conf]);
  const BTN = 18;
  const Wp = m.padL + textW + P.gap * 2 + BTN * 2 + P.gap + P['pad-right'];
  const W = Wp * S, H = m.h * S, R = H / 2;

  const frostFill = m.on[0] ? rec.fill.replace(/,\s*\.7\)/, `, ${m.frost})`) : 'transparent';
  const shadows = rec.shadows.map((v, i) => (m.on[i + 1] && (i !== 0 || m.hairline) ? aim(v, 0, 1) : null)).filter(Boolean).join(', ') || 'none';
  const z = 3;
  const top = capTop(z, 3);
  const exploded = spot === 'layers';
  const ink = P.ink[cw];
  const answer = (a: 'yes' | 'no') => { setGone(a); window.setTimeout(() => { setGone(null); setArrive((n) => n + 1); }, 900); };

  const face = (
    <span className="xr-chipface" style={{ paddingLeft: m.padL * S, paddingRight: P['pad-right'] * S, gap: P.gap * S, color: ink, fontSize: 11.5 * S }}>
      <span>{m.label}</span>
      <span className="xr-chipconf" style={{ fontSize: 9 * S }}>{m.conf.toFixed(2)}</span>
      <span className="xr-chipbtn" style={{ width: BTN * S, height: 16 * S, fontSize: 11 * S, color: spot === 'press' ? '#3FB97A' : undefined }}>✓</span>
      <span className="xr-chipbtn" style={{ width: BTN * S, height: 16 * S, fontSize: 11 * S }}>×</span>
    </span>
  );

  const scene = exploded ? (
    <Exploded layers={LAYERS} on={m.on} fill={frostFill} shadows={rec.shadows} w={W} h={H} r={R} z0={3} gap={18} focus={focus} scale={S} />
  ) : (
    <>
      <span className="xr-floortext" style={{ top: H + 26, fontSize: 15 * S }}>slept 6h · mood 3</span>
      <div key={arrive} className={['xr-chipwrap', m.host ? '' : 'is-quiet', gone ? `is-${gone}` : '', arrive ? 'is-arriving' : ''].join(' ')}>
        {m.on[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: 'blur(6px)', opacity: 0.14, transform: 'translate(4px, 8px)' }} />}
        <IsoCap w={W} h={H} r={R} z={z} wall={3} fill={frostFill} shadow={scalePx(shadows, S)} wallTone={t.wall}>{face}</IsoCap>
      </div>
      {spot === 'shape' && (
        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${top + 1}px)` }} aria-hidden>
          <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
          <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{m.h}</text>
          <path d={`M0 ${H + 16}H${m.padL * S}M0 ${H + 10}V${H + 22}M${m.padL * S} ${H + 10}V${H + 22}`} />
          <text x={(m.padL * S) / 2} y={H + 34} textAnchor="middle">{m.padL}</text>
          <path d={`M${W - P['pad-right'] * S} ${H + 16}H${W}M${W} ${H + 10}V${H + 22}`} />
          <text x={W - 4} y={H + 34} textAnchor="middle">{P['pad-right']}</text>
        </svg>
      )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    type: [m.padL * S + 30, H * 0.5, top + 1],
    states: [W * 0.55, 2, top],
    press: [W - P['pad-right'] * S - BTN * S * 1.5, H * 0.5, top + 1],
    surface: [W * 0.15, 2, top],
    shape: [R * 0.4, H - 2, top],
    layers: exploded ? [W * 0.85, H * 0.3, 3 + (LAYERS.length - 1) * 18] : [W * 0.7, H * 0.8, top],
  };

  const real = gone ? <span className="eng">{gone === 'yes' ? 'accepted · undo' : 'dismissed · won’t ask again'}</span> : <SuggestionChip label={m.label} confidence={m.conf} hostHovered={m.host} onAccept={() => answer('yes')} onDismiss={() => answer('no')} />;

  const card = (
    <>
      {spot === 'type' && (
        <>
          <p>The chip asks one short question, the way a person would. Next to it is how sure the app is, from 0 to 1. The app always shows this number. A guess that hides how sure it is would be a bug.</p>
          <div className="xr-dials">
            <div className="xr-actions-row">{QUESTIONS.map((q) => <button key={q} type="button" className="status" onClick={() => set({ label: q })}><span className={m.label === q ? 'led' : 'led off'} />{q}</button>)}</div>
            <Dial label="How sure" value={m.conf} min={0.5} max={0.95} step={0.01} fmt={(v) => v.toFixed(2)} onChange={(conf) => set({ conf })} />
          </div>
        </>
      )}
      {spot === 'states' && (
        <>
          <p>The chip waits quietly at 62% so it never shouts over your writing. Point at the line it belongs to and it becomes fully clear. When it first shows up, it drops in from 3 pt above, without bouncing.</p>
          <div className="xr-dials"><Switch label="Point at the line" on={m.host} onChange={(host) => set({ host })} /></div>
          <p><button type="button" className="status" onClick={() => setArrive((n) => n + 1)}><span className="led" />Show it arriving</button></p>
        </>
      )}
      {spot === 'press' && (
        <>
          <p>✓ says yes: the app makes the change, and you can undo it. × says no: the app remembers, and never asks that question about this line again. Hover ✓ and it turns green.</p>
          <div className="xr-actions-row">
            <button type="button" className="status" onClick={() => answer('yes')}><span className="led" />Say yes</button>
            <button type="button" className="status" onClick={() => answer('no')}><span className="led off" />Say no</button>
          </div>
        </>
      )}
      {spot === 'surface' && (
        <>
          <p>The chip is frosted: you can see the page through it a little, so it floats over your text. A thin green line goes around it. Green always means "the app suggests this", so you never mistake it for something you wrote.</p>
          <div className="xr-dials">
            <Dial label="Frost" value={m.frost} min={0.2} max={1} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(frost) => set({ frost })} />
            <Switch label="Green line" on={m.hairline} onChange={(hairline) => set({ hairline })} />
          </div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>A small pill, {P.height} pt tall. There is more space on the left than on the right, because the ✓ and × buttons already have space inside them.</p>
          <div className="xr-dials">
            <Dial label="Height" value={m.h} min={16} max={32} step={1} fmt={(v) => `${v} pt`} onChange={(h) => set({ h })} />
            <Dial label="Space on the left" value={m.padL} min={3} max={18} step={1} fmt={(v) => `${v} pt`} onChange={(padL) => set({ padL })} />
          </div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The chip has seven layers. Turn one off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on: m.on, toggle: (i, v) => set({ on: m.on.map((x, j) => (j === i ? v : x)) }) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
      <Proof>{real}</Proof>
    </>
  );

  return (
    <>
      <span ref={measure} aria-hidden className="xr-measure" style={{ font: '500 11.5px/20px var(--sans)', letterSpacing: '-0.18px' }}>{m.label}<span style={{ font: '400 9px var(--mono)', marginLeft: 2 }}>{m.conf.toFixed(2)}</span></span>
      <XrayFrame
        xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
        solid={<div style={{ zoom: 2.4 }} onClick={(e) => e.stopPropagation()}>{real}</div>}
        W={W} H={H} scene={scene} anchors={anchors}
        onReset={() => setM(INITIAL)} deps={[spot, m, gone]}
        card={card}
      />
    </>
  );
}
