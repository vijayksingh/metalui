import * as React from 'react';
import { SuggestionChip } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, recipeLayers, tones, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { ChipSpecimenCard } from './ChipSpecimens';
import { ChipCodePanel } from './ChipCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SUGGESTION CHIP
 *
 *   solid     the real chip: a question, how sure the app is, ✓ and ×
 *   x-ray     a thin frosted pill standing low on the page. Its top is the real chip itself, laid
 *             out at the object's own zoom and scaled by transform, so the chip that lands on it
 *             is the chip that was on the table; a low wall stands under it.
 *   card      the real chip, handled (ChipSpecimens): the question and how sure it is, its line and
 *             arrival, ✓ and ×, frost and the green line, height and the space on the left, and a
 *             switch per layer. The bench reads the same model.
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (ChipCode.tsx)
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.chip.props.suggestion as { height: number; 'pad-left': number; 'pad-right': number; gap: number; ink: Record<string, string> };
const S = 3;
/** How see-through the frost is: the alpha of the recipe's suggestion background. */
export const FROST = Number((tokens.recipes.chip.layers as { part: string; prop: string; value: string }[]).find((l) => l.part === 'suggestion' && l.prop === 'background')!.value.match(/,\s*([\d.]+)\)$/)![1]);
/** How faint the chip waits until its line is pointed at. */
const REST = tokens.suggestion['rest-opacity'];

export type Spot = 'type' | 'states' | 'press' | 'surface' | 'shape' | 'layers';
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

export const LAYERS: LayerDef[] = [
  { name: 'Frost', why: 'A see-through light fill. The page shows through a little, so the chip feels like it floats over the text, not part of it.' },
  { name: 'Green line', why: 'A thin green outline. Green means "the app suggests this". You can tell a suggestion from your own writing at a glance.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge, so the frost looks like soft plastic.' },
  { name: 'Top light', why: 'A thin bright line on the top left edge. It shows the chip is raised a little.' },
  { name: 'Rim', why: 'A very thin dark outline under the green line, so the edge stays sharp.' },
  { name: 'Contact', why: 'A small shadow right under the chip.' },
  { name: 'Drop', why: 'A soft shadow a little lower. The chip floats just above the page.' },
];

/** Everything a suggestion chip is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface ChipConfig {
  /** props: the question, how sure the app is, and whether its line is pointed at (`hostHovered`) */
  label: string; conf: number; host: boolean;
  /** recipe values: --mu-r-chip-suggestion-*: how see-through the frost is, the height, the space on the left */
  frost: number; h: number; padL: number;
  /** the chip's seven layers (the frost, then its six shadows), each switchable */
  on: boolean[];
}
export type Model = ChipConfig;
export const INITIAL: ChipConfig = { label: 'Track as mood?', conf: 0.8, host: false, frost: FROST, h: P.height, padL: P['pad-left'], on: LAYERS.map(() => true) };
/** Questions the agent guide gives as examples; the chip shows one at a time. */
export const QUESTIONS = ['Track as mood?', 'Task?', 'Date friday?', 'Move to Done?'];
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(tokens.springs.object.duration * 1000 * 0.55);

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the variables that set the real chip to it (only those that differ from
 *  the recipe, so a default config is the chip exactly as it ships), and the plate's fill and shadows
 *  for the model's hand-built layers. */
export function chipLook(m: ChipConfig, colorway: Colorway) {
  const plate = recipeLayers('chip', 'suggestion', colorway);
  const fill = m.on[0] ? plate.fill.replace(/,\s*[\d.]+\)$/, `, ${m.frost})`) : 'transparent';
  const shadow = plate.shadows.filter((_, i) => m.on[i + 1]).join(', ') || 'none';
  const style: Record<string, string> = {};
  if (m.h !== INITIAL.h) style['--mu-r-chip-suggestion-height'] = `${m.h}px`;
  if (m.padL !== INITIAL.padL) style['--mu-r-chip-suggestion-pad-left'] = `${m.padL}px`;
  // the plate's fill and shadows are colours: one set per colorway
  if (!m.on[0] || m.frost !== INITIAL.frost) style['--mu-r-chip-suggestion-background'] = fill;
  if (!same(m.on.slice(1), INITIAL.on.slice(1))) style['--mu-r-chip-suggestion-shadow'] = shadow;
  return { colorway, plateRaw: plate, fill, shadow, style: style as React.CSSProperties };
}
export function useChipLook(m: ChipConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => chipLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useChipLook>;

/** The real chip, set to a config: the table's object, the model's face and every specimen are this. */
export function ChipReal({ m, look, onAnswer, style, className }: { m: ChipConfig; look: Look; onAnswer?: (a: 'yes' | 'no') => void; style?: React.CSSProperties; className?: string }) {
  return (
    <SuggestionChip label={m.label} confidence={m.conf} hostHovered={m.host} className={className} style={{ ...look.style, ...style }}
      onAccept={() => onAnswer?.('yes')} onDismiss={() => onAnswer?.('no')} />
  );
}

/** The chip's box and its parts, in the chip's own points, read off the real thing. */
interface Box { W: number; H: number; tx: number; tw: number; ax: number; aw: number }

export function ChipXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<ChipConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<ChipConfig>(() => ({ ...INITIAL, ...seed }));
  const [gone, setGone] = React.useState<null | 'yes' | 'no'>(null);
  const [arrive, setArrive] = React.useState(0);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<ChipConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useChipLook(m);

  // the chip's boxes, measured on an unseen copy at the object's own zoom (so fractions of a point survive)
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<Box>({ W: 0, H: 0, tx: 0, tw: 0, ax: 0, aw: 0 });
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    const read = () => {
      const chip = el.querySelector<HTMLElement>('.mu-suggestion'), text = chip?.querySelector<HTMLElement>('.mu-chip-text'), acts = chip?.querySelector<HTMLElement>('.mu-chip-actions');
      if (!chip || !text || !acts) return;
      const b = chip.getBoundingClientRect(), t = text.getBoundingClientRect(), a = acts.getBoundingClientRect();
      setBox({ W: b.width / oz, H: b.height / oz, tx: (t.left - b.left) / oz, tw: t.width / oz, ax: (a.left - b.left) / oz, aw: a.width / oz });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [m, look, oz]);

  const W = box.W * S, H = box.H * S, R = H / 2;
  const flat = pose === 'flat';
  const wallZ = 1.5;
  const SLICES = 4;
  const top = wallZ + SLICES * 1.4;
  const exploded = spot === 'layers';
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const answer = (a: 'yes' | 'no') => { setGone(a); window.setTimeout(() => { setGone(null); setArrive((n) => n + 1); }, 900); };
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const wall = m.host ? 1 : REST;

  const live = <ChipReal m={m} look={look} onAnswer={answer} />;
  // the model's chip is the one on the table, already settled: it arrives only when you ask it to
  const body = <ChipReal key={arrive} m={m} look={look} style={arrive ? undefined : { animation: 'none' }} />;

  const scene = exploded ? (
    <Exploded layers={LAYERS} on={m.on} fill={look.fill} shadows={look.plateRaw.shadows} w={W} h={H} r={R} z0={3} gap={18} focus={focus} scale={S} />
  ) : (
    <>
      <span className="xr-floortext" style={{ top: H + 26, fontSize: 15 * S, opacity: flat ? 0 : 1 }}>slept 6h · mood 3</span>
      {m.on[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: R, filter: 'blur(6px)', opacity: flat || gone ? 0 : 0.14, transform: 'translate(4px, 8px)' }} />}
      {/* the wall: the chip's outline stood on the floor, under the real chip */}
      <div className="xr-thumb">
        {Array.from({ length: SLICES }, (_, i) => (
          <div key={i} className={['xr-slice xr-chipwall', gone ? 'is-gone' : ''].join(' ')} style={{ width: W, height: H, borderRadius: R, opacity: flat || gone ? 0 : wall, transform: `translateZ(${flat ? 0 : wallZ + i * 1.4}px)`, background: i === 0 || !m.on[0] ? 'transparent' : t.wall }} />
        ))}
      </div>
      {/* the top: the real chip, raised. Only the picture: the specimen is the one to press */}
      <div className={['xr-segface is-top xr-chiptop', gone ? 'is-gone' : ''].join(' ')} inert aria-hidden style={{ display: 'flex', ...face(flat ? 1 : top) }}><span>{body}</span></div>
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
    type: [(box.tx + box.tw * 0.5) * S, H * 0.5, top + 1],
    states: [W * 0.55, 2, top],
    press: [(box.ax + box.aw * 0.5) * S, H * 0.5, top + 1],
    surface: [W * 0.15, 2, top],
    shape: [R * 0.4, H - 2, top],
    layers: exploded ? [W * 0.85, H * 0.3, 3 + (LAYERS.length - 1) * 18] : [W * 0.7, H * 0.8, top],
  };

  const real = gone ? <span className="eng">{gone === 'yes' ? 'accepted · undo' : 'dismissed · won’t ask again'}</span> : live;
  const current = SPOTS.find((x) => x.id === spot)!;

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden inert className="xr-measure xr-chipmeasure" style={{ zoom: oz }}><span>{live}</span></span>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 2.4, cursor: 'zoom-in' }} onClick={(e) => { if ((e.target as HTMLElement).closest('button')) e.stopPropagation(); }}>{real}</div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />
              {scene}
              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit, gone]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, label: o.label, conf: o.conf, host: o.host }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <ChipSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} gone={gone} answer={answer} arrive={() => setArrive((n) => n + 1)} />
        </div>
      )}
      {xray && <ChipCodePanel config={m} />}
    </div></HintLayer>
  );
}
