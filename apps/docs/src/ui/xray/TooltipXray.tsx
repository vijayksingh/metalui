import * as React from 'react';
import { IconButton, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, IsoCap, capTop, recipeLayers, scalePx, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { TooltipSpecimenCard } from './TooltipSpecimens';
import { TooltipCodePanel } from './TooltipCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOOLTIP
 *
 *   solid     a tool cap; point at it and its tooltip shows
 *   x-ray     the cap on the page, and the label floating above it, high over everything. The
 *             label is the tooltip's own chip (TooltipChip: the popup's markup, as the library
 *             writes it), laid out at the object's own zoom and scaled by transform, so the chip
 *             that lands on it is the chip that was on the table. Flown in, it lands on the floor
 *             as the object itself; once the copy has gone it floats up and its tool appears.
 *   card      the real tooltip beside a real tool, changed by handling it (TooltipSpecimens):
 *             Timing   point at the tools; the wait is a readout (its tokens: a name, a note)
 *             Type     show the key (switch)
 *             Place    drag the label to another side (steps); its near edge sets the gap
 *             Shape    its right end sets the space on the sides, its corner rounds it; long note (switch)
 *             Shadow   drag the label up to float it higher
 *             Layers   a switch per layer
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (TooltipCode.tsx)
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.tooltip.props as { self: { 'max-width': number; 'pad-y': number; 'pad-x': number; radius: number } };
const TOOL = tokens.recipes['icon-button'].props.tool as { size: number; radius: number; glyph: number; ink: string };
const TL = tokens.recipes['icon-button'].layers as { part: string; prop: string; value: string; state?: string }[];
const TOOL_BG = TL.find((l) => l.part === 'tool' && l.prop === 'background' && !l.state)!.value;
const TOOL_SH = TL.filter((l) => l.part === 'tool' && l.prop === 'shadow' && !l.state).map((l) => l.value);
const OBJECT = tokens.springs.object as { duration: number };
const S = 3;
/** The tool's name and key: what the chip says. */
export const NAME = 'Select';
export const KEY = 'V';
/** The long note: a label that wraps, its detail dimmed. */
export const NOTE = 'Made from a message you sent';
export const NOTE_DIM = ' · 2 days ago';

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

export const LAYERS: LayerDef[] = [
  { name: 'Dark glass', why: 'The same dark glass as the toolbar. Tooltips name tools, so they are made of the same stuff.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge.' },
  { name: 'Top light', why: 'A soft bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A soft dark edge along the bottom right.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A bigger soft shadow.' },
  { name: 'Far shadow', why: 'A very big soft shadow. It floats high, above menus and toasts.' },
];
/** The shadows that are drops (not inset, not the rim): the ones a height above the page scales. */
const DROPS = 4;

export type Side = 'top' | 'bottom' | 'left' | 'right';

/** Everything a tooltip is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface TooltipConfig {
  /** props: side, offset, delay, shortcut, and wrap with a Tooltip.Dim detail */
  side: Side; gap: number; delay: number; showKey: boolean; long: boolean;
  /** recipe values: --mu-r-tooltip-self-* */
  padX: number; radius: number;
  /** the chip's shadow stack, as a height above the page and which layers are on */
  lift: number; on: boolean[];
}
export type Model = TooltipConfig;
export const INITIAL: TooltipConfig = {
  side: 'top', gap: tokens.tooltip.gap, delay: tokens.tooltip['delay-ms'], showKey: true, long: false,
  padX: P.self['pad-x'], radius: P.self.radius,
  lift: 1, on: LAYERS.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the chip's fill and shadow stack for the model's hand-built layers, and the
 *  variables that set the real chip to it. Only what differs from the recipe is set, so a default config
 *  is the tooltip exactly as it ships, and the variables are the overrides its code needs. */
export function tooltipLook(m: TooltipConfig, colorway: Colorway) {
  const raw = recipeLayers('tooltip', 'self', colorway);
  const drops = raw.shadows.length - DROPS;
  const shadow = raw.shadows.map((v, i) => (m.on[i + 1] ? (i >= drops ? scalePx(v, m.lift) : v) : null)).filter(Boolean).join(', ') || 'none';
  const fill = m.on[0] ? raw.fill : 'transparent';
  const style: Record<string, string> = {};
  if (m.padX !== INITIAL.padX) style['--mu-r-tooltip-self-pad-x'] = `${m.padX}px`;
  if (m.radius !== INITIAL.radius) style['--mu-r-tooltip-self-radius'] = `${m.radius}px`;
  // the fill changes with its own layer; the stack with the height or any of its layers
  if (!m.on[0]) style['--mu-r-tooltip-self-background'] = fill;
  if (m.lift !== INITIAL.lift || !same(m.on.slice(1), INITIAL.on.slice(1))) style['--mu-r-tooltip-self-shadow'] = shadow;
  return { colorway, raw, fill, shadow, style: style as React.CSSProperties };
}
export function useTooltipLook(m: TooltipConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => tooltipLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useTooltipLook>;

/** What the chip says for a config: the name, or the note with its detail dimmed (Tooltip.Dim). */
export function chipLabel(m: TooltipConfig) {
  return m.long ? <>{NOTE}<Tooltip.Dim>{NOTE_DIM}</Tooltip.Dim></> : NAME;
}

/* The chip as the library's own popup writes it (tooltip.tsx, POPUP and KEY): the same classes, so
 * its type, padding, corners, fill and shadows are the recipe's, read through the same variables.
 * The real popup lives in a portal and shows on hover, so the table and the model's face hold this
 * instead; a slice (e2e/xray-tooltip-code.spec.ts) proves the real one renders the same pixels. */
const POPUP = 'mu-tooltip max-w-tooltip-max-width py-tooltip-pad-y px-tooltip-pad-x rounded-tooltip-radius type-tooltip text-tooltip-ink recipe-tooltip';
const KEY_CLASS = 'mu-tooltip-key text-tooltip-key-ink';

/** The tooltip's chip, set to a config: the table's object and the model's face are this. */
export function TooltipChip({ m, look, onClick, style }: { m: TooltipConfig; look: Look; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <span className={`${POPUP} ${m.long ? 'whitespace-normal' : 'whitespace-nowrap'} xr-tipchip`} data-wrap={m.long ? '' : undefined} style={{ ...look.style, ...style }} onClick={onClick}>
      {chipLabel(m)}
      {m.showKey && !m.long && <span className={KEY_CLASS}> · {KEY}</span>}
    </span>
  );
}

/** The chip's box in its own points, read off an unseen copy at the object's zoom. */
interface Box { w: number; h: number }

export function TooltipXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<TooltipConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('surface');
  const [m, setM] = React.useState<TooltipConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<TooltipConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useTooltipLook(m);
  // is the specimen's tooltip showing? The Timing card reports its real one; every other card holds it open
  const [shown, setShown] = React.useState(true);
  React.useEffect(() => { if (spot !== 'states') setShown(true); }, [spot]);

  // the chip's box, measured on an unseen copy at the object's own zoom (so fractions of a point survive)
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<Box>({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    const read = () => {
      const chip = el.querySelector<HTMLElement>('.mu-tooltip');
      if (!chip) return;
      const r = chip.getBoundingClientRect();
      setBox((b) => (b.w === r.width / oz && b.h === r.height / oz ? b : { w: r.width / oz, h: r.height / oz }));
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, m, look, oz]);

  const flat = pose === 'flat';
  const TW = box.w, TH = box.h, CAP = TOOL.size;
  // the cap and the label, laid out for the side the label sits on
  const across = m.side === 'left' || m.side === 'right';
  const Wp = across ? CAP + m.gap + TW + 20 : Math.max(TW, CAP) + 20;
  const Hp = across ? Math.max(TH, CAP) + 20 : CAP + m.gap + TH + 10;
  const W = Wp * S, H = Hp * S;
  const capX = (across ? (m.side === 'left' ? 10 + TW + m.gap : 10) : (Wp - CAP) / 2) * S;
  const capY = (across ? (Hp - CAP) / 2 : m.side === 'top' ? TH + m.gap : 0) * S;
  const tipX = (across ? (m.side === 'left' ? 10 : 10 + CAP + m.gap) : (Wp - TW) / 2) * S;
  const tipY = (across ? (Hp - TH) / 2 : m.side === 'top' ? 0 : CAP + m.gap) * S;
  // the point on the label's edge that faces the cap
  const near: [number, number] = m.side === 'top' ? [tipX + TW * S / 2, tipY + TH * S] : m.side === 'bottom' ? [tipX + TW * S / 2, tipY] : m.side === 'left' ? [tipX + TW * S, tipY + TH * S / 2] : [tipX, tipY + TH * S / 2];
  const capTopZ = capTop(0.5, 4);
  const tipZ = 60 + m.lift * 40;
  // the layers come apart only with the model open: landed or leaving, the chip is one thing
  const exploded = spot === 'layers' && !flat;
  const fit = useFit(bench, W, H, xray);
  const visible = shown || flat;
  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's face is the chip laid out at the object's own zoom, then scaled: the same box, to the pixel
  const face = { transform: `scale(${S / oz})`, zoom: oz };
  const chip = <TooltipChip m={m} look={look} />;

  const anchors: Record<Spot, [number, number, number]> = {
    states: [capX + CAP * S * 0.8, capY + CAP * S * 0.8, capTopZ],
    type: [tipX + TW * S * 0.4, tipY + TH * S * 0.5, exploded ? 20 : tipZ],
    surface: [near[0], near[1], exploded ? 20 : tipZ],
    shape: [tipX + 4, tipY + TH * S - 4, exploded ? 20 : tipZ],
    shadow: [tipX + TW * S, tipY + TH * S, exploded ? 20 : tipZ - 10],
    layers: [tipX + TW * S * 0.9, tipY + 4, exploded ? 20 + (LAYERS.length - 1) * 16 : tipZ],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      {xray && <span ref={measure} aria-hidden inert className="xr-measure" style={{ zoom: oz }}>{chip}</span>}
      <div className="xr-bench" ref={bench}>
        {!xray && (
          <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit">
            {/* the real thing: two tools, each with its tooltip one hover away; the strip takes its own clicks */}
            <div style={{ zoom: 2 }} onClick={(e) => e.stopPropagation()}>
              <TooltipProvider delay={m.delay}>
                <span className="inline-flex gap-8 rounded-pill p-6 material-frost-graphite" data-mu-colorway="graphite">
                  <Tooltip label={chipLabel(m)} shortcut={m.showKey && !m.long ? KEY : undefined} side={m.side} offset={m.gap} wrap={m.long} className="xr-tip-solid"><IconButton variant="tool" label={NAME} icon={<Icon name="select" size={TOOL.glyph} />} /></Tooltip>
                  <Tooltip label="Note" shortcut={m.showKey ? 'N' : undefined} side={m.side} offset={m.gap} className="xr-tip-solid"><IconButton variant="tool" label="Note" icon={<Icon name="note" size={TOOL.glyph} />} /></Tooltip>
                </span>
              </TooltipProvider>
            </div>
          </div></div>
        )}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {/* the tool: on the floor under the label; it is not the object that landed, so it comes once the model opens */}
              {!flat && (
                <div className="xr-tipcap">
                  <IsoCap x={capX} y={capY} w={CAP * S} h={CAP * S} r={TOOL.radius * S} z={0.5} wall={4} fill={TOOL_BG} shadow={scalePx(TOOL_SH.join(', '), S)} wallTone="#141416">
                    <span style={{ color: TOOL.ink, display: 'grid' }}><Icon name="select" size={TOOL.glyph * S} /></span>
                  </IsoCap>
                </div>
              )}

              {exploded ? (
                <>
                  <Exploded layers={LAYERS} on={m.on} fill={look.fill} shadows={look.raw.shadows} x={tipX} y={tipY} w={TW * S} h={TH * S} r={m.radius * S} z0={20} gap={16} focus={focus} scale={S} />
                  {/* the chip stays, out of sight, so the layers keep their measure */}
                  <div className="xr-tipat" style={{ transform: `translate(${tipX}px, ${tipY}px)`, visibility: 'hidden' }}><div className="xr-segface is-tip" aria-hidden inert style={face}>{chip}</div></div>
                </>
              ) : (
                <>
                  {/* the stem: a dashed line from the tool's top to the label's near edge, as high as it floats */}
                  {!flat && <i className="xr-stem" style={{ left: near[0], top: near[1], height: tipZ, transform: `translateZ(${capTopZ}px) rotateX(90deg)`, opacity: visible ? 1 : 0 }} />}
                  <div className={['xr-tiplift', visible ? 'is-shown' : ''].join(' ')} style={{ transform: `translateZ(${flat ? 1 : tipZ}px)` }}>
                    {m.on[7] && <div className="xr-shadow" style={{ left: tipX, top: tipY, width: TW * S, height: TH * S, borderRadius: m.radius * S, filter: `blur(${8 + m.lift * 8}px)`, opacity: flat ? 0 : 0.3 * Math.min(1, m.lift), transform: `translate(${m.lift * 10}px, ${m.lift * 22}px) translateZ(${-m.lift * 30}px)` }} />}
                    {/* the face: the chip itself, at the object's own zoom */}
                    <div className="xr-tipat" style={{ transform: `translate(${tipX}px, ${tipY}px)` }}><div className="xr-segface is-tip" style={face}>{chip}</div></div>
                  </div>
                </>
              )}

              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit, shown]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM(INITIAL)}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <TooltipSpecimenCard spot={spot} m={m} set={set} focus={setFocus} setShown={setShown} look={look} />
        </div>
      )}
      {xray && <TooltipCodePanel config={m} />}
    </div></HintLayer>
  );
}
