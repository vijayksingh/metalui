import * as React from 'react';
import { Button, Kbd, ToastProvider, useToast } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, capTop, scalePx, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOAST
 *
 *   solid     a toast: "Moved 3 blocks · undo it" with an Undo cap and its ⌘Z key
 *   x-ray     a dark glass pill floating near the bottom of the page; a lighter Undo cap
 *             stands on it, with a small key pressed into the cap
 *   play      Timing  it rises in from below; stays 5 s with Undo, 2.6 s without
 *             Type    what happened, then a quieter detail
 *             Undo    the cap, and the key pressed into it
 *             Shape   height · padding that wraps the cap
 *             Shadow  how high it floats
 *             Layers  pill and cap layers
 * ───────────────────────────────────────────────────────── */

type RL = { part: string; prop: string; value: string }[];
const R = tokens.recipes.toast as { props: { self: { height: number; 'pad-left': number; 'pad-right': number; gap: number; ink: string; rise: number; scale: string }; sub: { ink: string }; undo: { height: number; 'pad-left': number; 'pad-right': number; gap: number }; kbd: { ink: string } }; layers: RL };
const P = R.props;
const pick = (part: string, prop: string) => R.layers.filter((l) => l.part === part && l.prop === prop).map((l) => l.value);
const BG = pick('self', 'background')[0], SH = pick('self', 'shadow');
const UNDO_BG = pick('undo', 'background')[0], UNDO_SH = pick('undo', 'shadow');
const KBD_BG = pick('kbd', 'background')[0];
const S = 2.4;

type Spot = 'states' | 'type' | 'press' | 'shape' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'Timing', word: 'Coming and going' },
  { id: 'type', title: 'Type', word: 'What happened' },
  { id: 'press', title: 'Undo', word: 'The way back' },
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'shadow', title: 'Shadow', word: 'Floating' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  states: ['left', 0.2], type: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], press: ['right', 0.48], shadow: ['right', 0.76],
};

const PILL: LayerDef[] = [
  { name: 'Dark glass', why: 'A dark, slightly see-through fill. It is the same glass as the toolbar, so you know it belongs to the app, not to your page.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge.' },
  { name: 'Top light', why: 'A soft bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A soft dark edge along the bottom right.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A bigger soft shadow.' },
  { name: 'Far shadow', why: 'A very big soft shadow. The toast floats over everything on the page.' },
];
const UNDO: LayerDef[] = [
  { name: 'Cap fill', why: 'The Undo cap is lighter than the glass, so it stands out as the one thing you can press.' },
  { name: 'Top light', why: 'A thin bright line on top. It shows the cap is raised.' },
  { name: 'Rim', why: 'A thin dark outline around the cap.' },
];

interface Model { undo: boolean; sub: boolean; padL: number; lift: number; pill: boolean[]; cap: boolean[] }
const INITIAL: Model = { undo: true, sub: true, padL: P.self['pad-left'], lift: 1, pill: PILL.map(() => true), cap: UNDO.map(() => true) };

function RealToast({ undo, sub }: { undo: boolean; sub: boolean }) {
  const toast = useToast();
  return <Button onClick={() => toast.show({ title: 'Moved 3 blocks', sub: sub ? 'undo it any time' : undefined, undo: undo ? () => {} : undefined })}>Show a real toast</Button>;
}

export function ToastXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [cycle, setCycle] = React.useState(0);
  const [pressed, setPressed] = React.useState(false);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);

  const measure = React.useRef<HTMLSpanElement>(null);
  const [tw, setTw] = React.useState(160);
  React.useLayoutEffect(() => { if (measure.current) setTw(measure.current.offsetWidth); }, [m.sub]);
  const undoW = P.undo['pad-left'] + 32 + P.undo.gap + 26 + P.undo['pad-right'];
  const Wp = m.padL + tw + (m.undo ? P.self.gap + undoW + P.self['pad-right'] : m.padL);
  const W = Wp * S, H = P.self.height * S;
  const z = 6 + m.lift * 20, top = capTop(z, 3);
  const ux = (m.padL + tw + P.self.gap) * S, uy = ((P.self.height - P.undo.height) / 2) * S;
  const exploded = spot === 'layers';
  const pillShadow = scalePx(SH.slice(0, 4).filter((_, i) => m.pill[i + 1]).join(', ') || 'none', S);
  const undoShadow = scalePx(UNDO_SH.filter((_, i) => m.cap[i + 1]).join(', ') || 'none', S);

  const text = (
    <span className="xr-toasttext" style={{ fontSize: 13 * S, gap: 6 * S }}>
      Moved 3 blocks{m.sub && <span style={{ color: P.sub.ink }}>· undo it any time</span>}
    </span>
  );

  const scene = exploded ? (
    <>
      <Exploded layers={PILL} on={m.pill} fill={BG} shadows={SH} w={W} h={H} r={H / 2} z0={4} gap={14} focus={focus} scale={S} />
      {m.undo && <Exploded layers={UNDO} on={m.cap} fill={UNDO_BG} shadows={UNDO_SH} x={ux} y={uy} w={undoW * S} h={P.undo.height * S} r={(P.undo.height * S) / 2} z0={4 + PILL.length * 14 + 10} gap={14} focus={focus} scale={S} />}
    </>
  ) : (
    <div key={cycle} className={cycle ? 'xr-toastwrap is-arriving' : 'xr-toastwrap'}>
      {m.pill[7] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: H / 2, filter: `blur(${10 + m.lift * 10}px)`, opacity: 0.3, transform: `translate(${m.lift * 8}px, ${m.lift * 18}px)` }} />}
      <IsoCap w={W} h={H} r={H / 2} z={z} wall={3} fill={m.pill[0] ? BG : 'transparent'} shadow={pillShadow} wallTone="#161618">
        <span style={{ position: 'absolute', left: m.padL * S, top: 0, height: H, display: 'flex', alignItems: 'center', color: P.self.ink }}>{text}</span>
      </IsoCap>
      {m.undo && (
        <div className="xr-thumb" style={{ transform: `translateZ(${top}px)` }}>
          <IsoCap x={ux} y={uy} w={undoW * S} h={P.undo.height * S} r={(P.undo.height * S) / 2} z={pressed ? 0.2 : 1.6} wall={2} fill={m.cap[0] ? UNDO_BG : 'transparent'} shadow={undoShadow} wallTone="#1b1b1d" transition="transform 50ms linear">
            <span className="xr-undoface" style={{ fontSize: 12.5 * S, gap: P.undo.gap * S, paddingLeft: P.undo['pad-left'] * S, paddingRight: P.undo['pad-right'] * S, color: P.self.ink }}>
              Undo<i style={{ font: `500 ${10 * S}px/1 var(--mono)`, color: P.kbd.ink, background: KBD_BG, borderRadius: 999, padding: `${3 * S}px ${6 * S}px`, boxShadow: `inset 0 ${S}px ${1.5 * S}px rgba(0,0,0,.5)` }}>⌘Z</i>
            </span>
          </IsoCap>
        </div>
      )}
    </div>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    states: [W * 0.05, H * 0.5, top],
    type: [(m.padL + 40) * S, H * 0.5, top + 1],
    press: [m.undo ? ux + undoW * S * 0.5 : W * 0.9, H * 0.4, m.undo ? top + 4 : top],
    shape: [H * 0.15, H * 0.85, top],
    shadow: [W * 0.8, H + 24, 0],
    layers: exploded ? [W * 0.3, H * 0.3, 4 + (PILL.length - 1) * 14] : [W * 0.97, H * 0.5, top],
  };

  const replay = () => setCycle((n) => n + 1);
  const tap = () => { setPressed(true); window.setTimeout(() => setPressed(false), 140); };

  const card = (
    <>
      {spot === 'states' && (
        <>
          <p>A toast tells you something you just did worked. It rises in from {P.self.rise} pt below, growing from {Math.round(Number(P.self.scale) * 100)}% to full size, and settles without bouncing. It stays 5 seconds when it has Undo, and 2.6 seconds when it does not. Errors stay until they are fixed. Only one toast shows at a time.</p>
          <p><button type="button" className="status" onClick={replay}><span className="led" />Show it arriving</button></p>
        </>
      )}
      {spot === 'type' && (
        <>
          <p>First what happened, in the words you would use: "Moved 3 blocks". Then a short detail after a dot, in a quieter grey. Toasts are only for things you did. The app never uses them to talk about itself.</p>
          <div className="xr-dials"><Switch label="Detail" on={m.sub} onChange={(sub) => set({ sub })} /></div>
        </>
      )}
      {spot === 'press' && (
        <>
          <p>Undo is a small raised cap on the glass, the only thing you can press. Its ⌘Z key is pressed into the cap, not raised, because it sits on a dark surface. Press the cap and it drops 1 pt.</p>
          <div className="xr-dials"><Switch label="Undo" on={m.undo} onChange={(undo) => set({ undo })} /></div>
          <p><button type="button" className="status" onPointerDown={tap}><span className="led" />Press Undo</button></p>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>A {P.self.height} pt pill. The Undo cap is {P.undo.height} pt tall with {P.self['pad-right']} pt of glass around it, so the cap and the pill have matching round ends. There is more space on the left, where the words start.</p>
          <div className="xr-dials"><Dial label="Space on the left" value={m.padL} min={6} max={30} step={1} fmt={(v) => `${v} pt`} onChange={(padL) => set({ padL })} /></div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>The toast floats above the page with the same three shadows as the toolbar. It sits near the bottom, out of the way of your work.</p>
          <div className="xr-dials"><Dial label="Height above the page" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} /></div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>Two parts: the pill has eight layers and the Undo cap has three. Turn one off to see what it adds.</p>
          <LayerList focus={focus} setFocus={setFocus} groups={[
            { title: 'The pill', layers: PILL, on: m.pill, toggle: (i, v) => set({ pill: m.pill.map((x, j) => (j === i ? v : x)) }) },
            { title: 'The Undo cap', layers: UNDO, on: m.cap, toggle: (i, v) => set({ cap: m.cap.map((x, j) => (j === i ? v : x)) }) },
          ]} />
        </>
      )}
      <Proof><ToastProvider><RealToast undo={m.undo} sub={m.sub} /></ToastProvider></Proof>
    </>
  );

  return (
    <>
      <span ref={measure} aria-hidden className="xr-measure" style={{ font: '500 13px/1 var(--sans)', letterSpacing: '-0.012em' }}>Moved 3 blocks{m.sub ? ' · undo it any time' : ''}</span>
      <XrayFrame
        xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
        solid={<div style={{ zoom: 1.6 }}><ToastStill /></div>}
        W={W} H={H} scene={scene} anchors={anchors}
        onReset={() => setM(INITIAL)} deps={[spot, m, tw, pressed]}
        card={card}
      />
    </>
  );
}

/** A still of the toast, drawn with its own classes (the live one lives in a portal). */
export function ToastStill() {
  return (
    <div className="mu-toast" style={{ display: 'inline-flex' }}>
      <span className="mu-toast-text">Moved 3 blocks<span className="mu-toast-sub">· undo it any time</span></span>
      <span className="mu-toast-undo">Undo <Kbd surface="sunk">⌘Z</Kbd></span>
    </div>
  );
}
