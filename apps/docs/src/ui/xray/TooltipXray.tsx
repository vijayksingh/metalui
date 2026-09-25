import * as React from 'react';
import { IconButton, Switcher, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Dial, Exploded, IsoCap, LayerList, Proof, Switch, XrayFrame, capTop, scalePx, type LayerDef, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOOLTIP
 *
 *   solid     a tool cap; point at it and its tooltip shows
 *   x-ray     the cap on the page, and the dark label floating above it, high over everything
 *   play      Timing   wait 120 ms, then show; the next one in a group shows at once
 *             Type     the name, then the key, dimmed
 *             Place    10 pt from the cap, on the side that has room
 *             Shape    padding · corners · long notes wrap
 *             Shadow   it floats highest of all
 *             Layers   the dark glass layers
 * ───────────────────────────────────────────────────────── */

type RL = { part: string; prop: string; value: string }[];
const R = tokens.recipes.tooltip as { props: { self: { 'max-width': number; 'pad-y': number; 'pad-x': number; radius: number; ink: string }; key: { ink: string } }; layers: RL };
const P = R.props;
const BG = R.layers.find((l) => l.prop === 'background')!.value;
const SH = R.layers.filter((l) => l.prop === 'shadow').map((l) => l.value);
const TL = tokens.recipes['icon-button'].layers as { part: string; prop: string; value: string; state?: string }[];
const TOOL_BG = TL.find((l) => l.part === 'tool' && l.prop === 'background' && !l.state)!.value;
const TOOL_SH = TL.filter((l) => l.part === 'tool' && l.prop === 'shadow' && !l.state).map((l) => l.value);
const S = 3;
const DELAY = 120;

type Spot = 'states' | 'type' | 'surface' | 'shape' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'Timing', word: 'When it shows' },
  { id: 'type', title: 'Type', word: 'Name and key' },
  { id: 'surface', title: 'Place', word: 'Where it goes' },
  { id: 'shape', title: 'Shape', word: 'Size and wrapping' },
  { id: 'shadow', title: 'Shadow', word: 'Floating highest' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  type: ['left', 0.2], shape: ['left', 0.48], surface: ['left', 0.76],
  layers: ['right', 0.2], shadow: ['right', 0.48], states: ['right', 0.76],
};

const LAYERS: LayerDef[] = [
  { name: 'Dark glass', why: 'The same dark glass as the toolbar. Tooltips name tools, so they are made of the same stuff.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge.' },
  { name: 'Top light', why: 'A soft bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A soft dark edge along the bottom right.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A bigger soft shadow.' },
  { name: 'Far shadow', why: 'A very big soft shadow. It floats high, above menus and toasts.' },
];

interface Model { side: 'top' | 'bottom'; gap: number; long: boolean; showKey: boolean; padX: number; radius: number; lift: number; on: boolean[] }
const INITIAL: Model = { side: 'top', gap: 10, long: false, showKey: true, padX: P.self['pad-x'], radius: P.self.radius, lift: 1, on: LAYERS.map(() => true) };

export function TooltipXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [shown, setShown] = React.useState(true);
  const [log, setLog] = React.useState('Shown.');
  const [focus, setFocus] = React.useState<string | null>(null);
  const timer = React.useRef(0);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);

  const point = (warm: boolean) => {
    window.clearTimeout(timer.current);
    if (warm) { setShown(true); setLog('Next tool in the group: shown at once.'); return; }
    setShown(false); setLog(`Pointing… waiting ${DELAY} ms (slowed down here so you can see it).`);
    timer.current = window.setTimeout(() => { setShown(true); setLog(`Shown after ${DELAY} ms.`); }, DELAY * 6);
  };
  const leave = () => { window.clearTimeout(timer.current); setShown(false); setLog('Left: it fades away.'); };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const measure = React.useRef<HTMLSpanElement>(null);
  const [tw, setTw] = React.useState(60);
  const text = m.long ? 'Made from a message you sent · 2 days ago' : 'SELECT';
  React.useLayoutEffect(() => { if (measure.current) setTw(Math.min(P.self['max-width'] - m.padX * 2, measure.current.offsetWidth)); }, [text, m.showKey, m.padX]);
  const lines = m.long && measure.current && measure.current.offsetWidth > P.self['max-width'] - m.padX * 2 ? 2 : 1;
  const TW = tw + m.padX * 2, TH = 14.5 * lines + P.self['pad-y'] * 2;
  const CAP = 38;
  const Wp = Math.max(TW, CAP) + 20, Hp = CAP + m.gap + TH + 10;
  const W = Wp * S, H = Hp * S;
  const capX = ((Wp - CAP) / 2) * S, capY = (m.side === 'top' ? TH + m.gap : 0) * S;
  const tipX = ((Wp - TW) / 2) * S, tipY = (m.side === 'top' ? 0 : CAP + m.gap) * S;
  const capTopZ = capTop(0.5, 4);
  const tipZ = 60 + m.lift * 40;
  const exploded = spot === 'layers';
  const shadow = scalePx(SH.slice(0, 4).filter((_, i) => m.on[i + 1]).join(', ') || 'none', S);

  const label = (
    <span className="xr-tipface" style={{ padding: `0 ${m.padX * S}px`, fontSize: 10 * S, lineHeight: 1.45, color: P.self.ink, whiteSpace: lines > 1 ? 'normal' : 'nowrap' }}>
      {text}{m.showKey && !m.long && <span style={{ color: P.key.ink }}> · V</span>}
    </span>
  );

  const scene = (
    <>
      <IsoCap x={capX} y={capY} w={CAP * S} h={CAP * S} r={15 * S} z={0.5} wall={4} fill={TOOL_BG} shadow={scalePx(TOOL_SH.join(', '), S)} wallTone="#141416">
        <span style={{ color: '#D6D6D8', display: 'grid' }}><Icon name="select" size={16 * S} /></span>
      </IsoCap>
      {exploded ? (
        <Exploded layers={LAYERS} on={m.on} fill={BG} shadows={SH} x={tipX} y={tipY} w={TW * S} h={TH * S} r={m.radius * S} z0={20} gap={16} focus={focus} scale={S} />
      ) : (
        <>
          <i className="xr-stem" style={{ left: W / 2, top: m.side === 'top' ? tipY + TH * S : capY + CAP * S * 0.5, height: tipZ, transform: `translateZ(${capTopZ}px) rotateX(90deg)`, opacity: shown ? 1 : 0 }} />
          <div className={['xr-tipwrap', shown ? 'is-shown' : ''].join(' ')} style={{ transform: `translateZ(${tipZ}px)` }}>
            {m.on[7] && <div className="xr-shadow" style={{ left: tipX, top: tipY, width: TW * S, height: TH * S, borderRadius: m.radius * S, filter: 'blur(16px)', opacity: 0.3, transform: 'translate(10px, 22px) translateZ(-30px)' }} />}
            <div className="xr-face" style={{ left: tipX, top: tipY, width: TW * S, height: TH * S, borderRadius: m.radius * S, background: m.on[0] ? BG : 'transparent', boxShadow: shadow }}>{label}</div>
          </div>
        </>
      )}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    states: [capX + CAP * S * 0.8, capY + CAP * S * 0.8, capTopZ],
    type: [tipX + TW * S * 0.4, tipY + TH * S * 0.5, exploded ? 20 : tipZ],
    surface: [W / 2, m.side === 'top' ? tipY + TH * S : tipY, exploded ? 20 : tipZ],
    shape: [tipX + 4, tipY + TH * S - 4, exploded ? 20 : tipZ],
    shadow: [tipX + TW * S, tipY + TH * S, exploded ? 20 : tipZ - 10],
    layers: [tipX + TW * S * 0.9, tipY + 4, exploded ? 20 + (LAYERS.length - 1) * 16 : tipZ],
  };

  const real = (
    <TooltipProvider>
      <span className="inline-flex gap-8 rounded-pill p-6 material-frost-graphite" data-mu-colorway="graphite">
        <Tooltip label="Select" shortcut="V" side={m.side}><IconButton variant="tool" label="Select" icon={<Icon name="select" size={16} />} /></Tooltip>
        <Tooltip label="Note" shortcut="N" side={m.side}><IconButton variant="tool" label="Note" icon={<Icon name="note" size={16} />} /></Tooltip>
      </span>
    </TooltipProvider>
  );

  const card = (
    <>
      {spot === 'states' && (
        <>
          <p>Point at a tool and nothing happens for {DELAY} ms. If you are just passing over, no tooltip pops up. If you stay, it fades in. Once one is showing, the next tool in the same bar shows its tooltip at once, so you can read along the row. The tooltip never catches the pointer; you click right through it.</p>
          <div className="xr-actions-row">
            <button type="button" className="status" onClick={() => point(false)}><span className="led off" />Point at it (slowed down)</button>
            <button type="button" className="status" onClick={() => point(true)}><span className="led" />Move to the next tool</button>
            <button type="button" className="status" onClick={leave}><span className="led off" />Leave</button>
          </div>
          <p className="readout-t">{log}</p>
        </>
      )}
      {spot === 'type' && (
        <>
          <p>It says the tool's name, then its key in a dimmer grey. Small mono capitals, like the labels on a machine. Now you know the name and the faster way to pick it.</p>
          <div className="xr-dials"><Switch label="Show the key" on={m.showKey} onChange={(showKey) => set({ showKey })} /></div>
        </>
      )}
      {spot === 'surface' && (
        <>
          <p>The tooltip sits {INITIAL.gap} pt away from the tool, close enough to belong to it. If there is no room on one side, it flips to the other.</p>
          <div className="xr-dials">
            <Switcher size="compact" aria-label="Side" value={m.side} onValueChange={(v) => set({ side: v as Model['side'] })} options={[{ value: 'top', label: 'Above' }, { value: 'bottom', label: 'Below' }]} />
            <Dial label="Gap" value={m.gap} min={0} max={30} step={1} fmt={(v) => `${v} pt`} onChange={(gap) => set({ gap })} />
          </div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>A small dark label with round corners. Short names stay on one line. A longer note, like where something came from, wraps at {P.self['max-width']} pt so it never becomes a long ribbon.</p>
          <div className="xr-dials">
            <Switch label="Long note" on={m.long} onChange={(long) => set({ long })} />
            <Dial label="Space on the sides" value={m.padX} min={4} max={20} step={1} fmt={(v) => `${v} pt`} onChange={(padX) => set({ padX })} />
            <Dial label="Corners" value={m.radius} min={0} max={20} step={0.5} fmt={(v) => `${v} pt`} onChange={(radius) => set({ radius })} />
          </div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>The tooltip floats above everything else, even menus. It has the same three shadows as the toolbar: small, bigger, and very big and soft.</p>
          <div className="xr-dials"><Dial label="Height above the page" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} /></div>
        </>
      )}
      {spot === 'layers' && (
        <>
          <p>The label has eight layers, the same as the toolbar's glass. Turn one off to see what it adds.</p>
          <LayerList groups={[{ layers: LAYERS, on: m.on, toggle: (i, v) => set({ on: m.on.map((x, j) => (j === i ? v : x)) }) }]} focus={focus} setFocus={setFocus} />
        </>
      )}
      <Proof>{real}</Proof>
    </>
  );

  return (
    <>
      <span ref={measure} aria-hidden className="xr-measure" style={{ font: '500 10px/1.45 var(--mono)', letterSpacing: '.05em' }}>{text}{m.showKey && !m.long ? ' · V' : ''}</span>
      <XrayFrame
        xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
        solid={<div style={{ zoom: 2 }} onClick={(e) => e.stopPropagation()}>{real}</div>}
        W={W} H={H} scene={scene} anchors={anchors}
        onReset={() => { setM(INITIAL); setShown(true); }} deps={[spot, m, shown, tw]}
        card={card}
      />
    </>
  );
}
