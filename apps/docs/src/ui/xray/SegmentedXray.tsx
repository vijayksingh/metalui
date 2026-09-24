import * as React from 'react';
import { Segmented } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Callouts, Dial, useFit, Glyph, SpringPlot, Switch, alphaK, scalePx, springEasing, useRecipeLayers, type SpotDef } from './kit';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SEGMENTED CONTROL
 *
 *   solid       the real control. Try it, then open the x-ray.
 *   x-ray       a tray with a raised rim (the well) on the gridded floor, a raised thumb
 *               inside it, and the labels floating just above the thumb
 *   play        Shape   size · tray padding · segment padding
 *               Well    how deep the tray is
 *               Thumb   how high the thumb sits
 *               Slide   click a label; the thumb slides on a spring you can tune
 *               Light   one light: the thumb gets a bright top, the tray a dark top and a bright bottom
 *               Layers  the tray's four layers and the thumb's six, each switchable
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.segmented;
const SELF = RECIPE.props.self as { pad: number };
const SEG = RECIPE.props.segment as { height: number; 'height-regular': number; 'pad-x': number; fade: string; ink: Record<string, string>; 'ink-on': Record<string, string> };
const PART = tokens.springs.part as { stiffness: number; damping: number };
const S = 2.4;
const RIM = 5;
const OPTIONS = [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }];

type Spot = 'shape' | 'well' | 'thumb' | 'slide' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'well', title: 'Well', word: 'The tray it sits in' },
  { id: 'thumb', title: 'Thumb', word: 'The raised part' },
  { id: 'slide', title: 'Slide', word: 'How the thumb moves' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], thumb: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], well: ['right', 0.48], slide: ['right', 0.76],
};

const WELL_LAYERS = [
  { name: 'Tray fill', why: 'The tray colour. It is darker at the top and lighter at the bottom. That is the opposite of the button, because the tray goes down into the page.' },
  { name: 'Inner shadow', why: 'A soft shadow inside the top edge. The top edge blocks the light, so the inside is darker there.' },
  { name: 'Edge line', why: 'A very thin outline so the tray still has an edge on a page of almost the same colour.' },
  { name: 'Bottom light', why: 'A thin bright line on the bottom edge. The light hits the far wall of the tray. This is what makes it look dug in and not just grey.' },
];
const THUMB_LAYERS = [
  { name: 'Thumb fill', why: 'The thumb colour. Lighter at the top, like the button.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge. It makes the thumb look like soft plastic.' },
  { name: 'Top light', why: 'A thin bright line on the top left edge. It shows the thumb is rounded and facing the light.' },
  { name: 'Rim', why: 'A very thin outline that keeps the thumb sharp against the tray.' },
  { name: 'Contact', why: 'A small shadow right under the thumb. It shows the thumb is resting on the tray floor.' },
  { name: 'Drop', why: 'A bigger, softer shadow. It shows how far the thumb stands above the tray.' },
];

interface Model {
  size: 'regular' | 'compact'; pad: number; padX: number;
  depth: number; lift: number;
  k: number; c: number; instant: boolean;
  lightDeg: number; lightK: number;
  well: boolean[]; thumb: boolean[];
}
const INITIAL: Model = {
  size: 'regular', pad: SELF.pad, padX: SEG['pad-x'],
  depth: 1, lift: 1,
  k: PART.stiffness, c: PART.damping, instant: false,
  lightDeg: 0, lightK: 1,
  well: WELL_LAYERS.map(() => true), thumb: THUMB_LAYERS.map(() => true),
};

/** Turn a shadow's offset to follow the light (0° is straight above), and scale its strength. */
function aim(v: string, deg: number, k: number) {
  const a = (deg * Math.PI) / 180;
  const lit = alphaK(v, k);
  return lit.replace(/^(inset\s+)?(-?[\d.]+)(px)?\s+(-?[\d.]+)(px)?/, (_, inset = '', x, _u1, y) => {
    const X = Number(x) * Math.cos(a) - Number(y) * Math.sin(a), Y = Number(x) * Math.sin(a) + Number(y) * Math.cos(a);
    return `${inset}${X.toFixed(2)}px ${Y.toFixed(2)}px`;
  });
}

function useParts(m: Model) {
  const well = useRecipeLayers('segmented', 'self');
  const thumb = useRecipeLayers('segmented', 'thumb');
  const grad = (stops: string[]) => `linear-gradient(${180 + m.lightDeg}deg, ${stops.join(', ')})`;
  const wellShadows = well.shadows.map((v, i) => (m.well[i + 1] ? aim(i === 0 ? alphaK(v, m.depth) : v, m.lightDeg, m.lightK) : null));
  const liftK = (v: string, i: number) => (i >= 3 ? alphaK(scalePx(v, 0.4 + m.lift * 0.6), 0.5 + m.lift * 0.5) : v);
  const thumbShadows = thumb.shadows.map((v, i) => (m.thumb[i + 1] ? aim(liftK(v, i), m.lightDeg, i < 2 ? m.lightK : 1) : null));
  return {
    colorway: well.colorway,
    wellRaw: well, thumbRaw: thumb,
    wellFill: m.well[0] ? grad(well.stops) : 'transparent',
    thumbFill: m.thumb[0] ? grad(thumb.stops) : 'transparent',
    wellShadow: wellShadows.filter(Boolean).join(', ') || 'none',
    thumbShadow: thumbShadows.filter(Boolean).join(', ') || 'none',
  };
}
type Parts = ReturnType<typeof useParts>;

export function SegmentedXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('slide');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [sel, setSel] = React.useState('week');
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const parts = useParts(m);
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [textW, setTextW] = React.useState<number[]>([22, 30, 36]);
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    setTextW([...el.children].map((c) => (c as HTMLElement).offsetWidth));
  }, []);

  // geometry in points, then scaled
  const segH = m.size === 'regular' ? SEG['height-regular'] : SEG.height;
  const segW = textW.map((w) => w + m.padX * 2);
  const idx = Math.max(0, OPTIONS.findIndex((o) => o.value === sel));
  const Wp = segW.reduce((a, b) => a + b, 0) + m.pad * 2, Hp = segH + m.pad * 2;
  const W = Wp * S, H = Hp * S, R = H / 2;
  const tx = (m.pad + segW.slice(0, idx).reduce((a, b) => a + b, 0)) * S, tw = segW[idx] * S, th = segH * S, ty = m.pad * S;
  const rimZ = RIM * m.depth * 1.6;
  const thumbZ = 1 + m.lift * 3;
  const thumbTop = thumbZ + 5 * 1.4;
  const labelZ = thumbTop + 1;
  const exploded = spot === 'layers';
  const fit = useFit(bench, W, H, xray);
  const wallTone = parts.colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';
  const rimTone = parts.colorway === 'graphite' ? '#2a2a2d' : '#f4f3ef';
  const ink = SEG.ink[parts.colorway], inkOn = SEG['ink-on'][parts.colorway];

  const ease = React.useMemo(() => springEasing(m.k, m.c), [m.k, m.c]);
  const reduced = typeof document !== 'undefined' && document.documentElement.classList.contains('rm');
  const move = m.instant || reduced ? 'none' : `transform ${ease.ms}ms ${ease.css}, width ${ease.ms}ms ${ease.css}`;

  const current = SPOTS.find((x) => x.id === spot)!;
  const segVars = { ['--mu-r-segmented-self-pad' as string]: `${m.pad}px`, ['--mu-r-segmented-segment-pad-x' as string]: `${m.padX}px`, ['--mu-r-segmented-self-shadow' as string]: parts.wellShadow, ['--mu-r-segmented-self-background' as string]: parts.wellFill, ['--mu-r-segmented-thumb-shadow' as string]: parts.thumbShadow, ['--mu-r-segmented-thumb-background' as string]: parts.thumbFill } as React.CSSProperties;
  const control = (label: string) => <span className="xr-seg-vars" style={segVars}><Segmented aria-label={label} size={m.size} value={sel} onValueChange={setSel} options={OPTIONS} /></span>;

  return (
    <div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden className="xr-measure" style={{ font: '500 11.5px/1 var(--sans)' }}>
        {OPTIONS.map((o) => <span key={o.value} style={{ display: 'inline-block' }}>{o.label}</span>)}
      </span>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" style={{ zoom: S }}>{control('View')}</div>}

        {xray && (
          <div className="xr-scene" style={{ width: W, height: H, zoom: fit }}>
            <div className="xr-iso">
              <div className="xr-floor" />

              {/* the well: a tray whose rim rises from the floor */}
              {!exploded && (
                <>
                  <div className="xr-face is-flat" style={{ width: W, height: H, borderRadius: R, transform: 'translateZ(0.5px)', background: parts.wellFill, boxShadow: scalePx(parts.wellShadow, S) }} />
                  {Array.from({ length: RIM }, (_, i) => (
                    <div key={i} className="xr-ring" style={{ width: W, height: H, borderRadius: R, transform: `translateZ(${((i + 1) / RIM) * rimZ}px)`, borderColor: i === RIM - 1 ? rimTone : wallTone }} />
                  ))}
                </>
              )}

              {/* the thumb: a raised cap that slides inside the tray */}
              {!exploded && (
                <div className="xr-thumb" style={{ transform: `translate(${tx}px, ${ty}px)`, transition: move }}>
                  {m.thumb[5] && <div className="xr-shadow is-drop" style={{ width: tw, height: th, borderRadius: th / 2, transition: move, filter: `blur(${2 + m.lift * 3}px)`, opacity: 0.12 + m.lift * 0.05, transform: `translate(${m.lift * 3}px, ${m.lift * 5}px) translateZ(1px)` }} />}
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="xr-slice" style={{ width: tw, height: th, borderRadius: th / 2, transition: move, transform: `translateZ(${thumbZ + i * 1.4}px)`, background: i === 0 || !m.thumb[0] ? 'transparent' : wallTone }} />
                  ))}
                  <div className="xr-face" style={{ width: tw, height: th, borderRadius: th / 2, transition: move, transform: `translateZ(${thumbTop}px)`, background: parts.thumbFill, boxShadow: scalePx(parts.thumbShadow, S) }} />
                </div>
              )}

              {/* the labels float just above the thumb, so the thumb never covers them */}
              {!exploded && (
                <div className="xr-labels" style={{ transform: `translateZ(${labelZ}px)` }}>
                  {OPTIONS.map((o, i) => {
                    const x = (m.pad + segW.slice(0, i).reduce((a, b) => a + b, 0)) * S;
                    return (
                      <button key={o.value} type="button" className="xr-seglabel" onClick={() => setSel(o.value)} aria-pressed={sel === o.value}
                        style={{ left: x, top: ty, width: segW[i] * S, height: th, color: sel === o.value ? inkOn : ink, transition: `color ${SEG.fade}` }}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {spot === 'shape' && (
                <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${H + 80}`} style={{ width: W + 80, height: H + 80, left: -40, top: -40, transform: `translateZ(${rimZ + 1}px)` }} aria-hidden>
                  <path d={`M-18 0V${H}M-24 0H-12M-24 ${H}H-12`} />
                  <text x="-28" y={H / 2} textAnchor="end" dominantBaseline="middle">{Hp}</text>
                  <path d={`M${tx} ${H + 16}H${tx + m.padX * S}M${tx} ${H + 10}V${H + 22}M${tx + m.padX * S} ${H + 10}V${H + 22}`} />
                  <text x={tx + (m.padX * S) / 2} y={H + 34} textAnchor="middle">{m.padX}</text>
                  <path d={`M${W - 2} ${H / 2}H${W - m.pad * S}`} />
                  <text x={W + 8} y={H / 2} dominantBaseline="middle">{m.pad}</text>
                </svg>
              )}

              {exploded && (
                <>
                  {WELL_LAYERS.map((l, i) => (
                    <div key={l.name} className={['xr-face is-layer', focus === l.name ? 'is-focus' : '', m.well[i] ? '' : 'is-off'].join(' ')} style={{ width: W, height: H, borderRadius: R, transform: `translateZ(${i * 14}px)`, background: i === 0 ? parts.wellFill : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(parts.wellRaw.shadows[i - 1] ?? '', S) }}>
                      <span className="xr-tag eng">{l.name}</span>
                    </div>
                  ))}
                  {THUMB_LAYERS.map((l, i) => (
                    <div key={l.name} className={['xr-face is-layer', focus === l.name ? 'is-focus' : '', m.thumb[i] ? '' : 'is-off'].join(' ')} style={{ width: tw, height: th, borderRadius: th / 2, transform: `translate(${tx}px, ${ty}px) translateZ(${WELL_LAYERS.length * 14 + 16 + i * 14}px)`, background: i === 0 ? parts.thumbFill : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(parts.thumbRaw.shadows[i - 1] ?? '', S) }}>
                      <span className="xr-tag eng">{l.name}</span>
                    </div>
                  ))}
                </>
              )}

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.6)}px, ${H / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (H * 1.8)}px, ${labelZ + 140}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  shape: [R * 0.35, H * 0.5, rimZ],
                  well: [W - R * 0.9, H * 0.72, 1],
                  thumb: [tx + tw * 0.5, ty + th * 0.2, thumbTop],
                  slide: [tx + tw, ty + th * 0.5, thumbTop - 2],
                  light: [W * 0.3, 1, rimZ],
                  layers: exploded ? [tx + tw * 0.8, ty + th * 0.3, WELL_LAYERS.length * 14 + 16 + (THUMB_LAYERS.length - 1) * 14] : [W * 0.8, H * 0.3, labelZ],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, sel, textW, fit]} />}
        <div className="xr-hint eng">{xray ? (spot === 'slide' ? 'Click a label to move the thumb' : 'Pick an icon to learn about that part') : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM(INITIAL)}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          {spot === 'shape' && <ShapeCard m={m} set={set} control={control} />}
          {spot === 'well' && <WellCard m={m} set={set} control={control} />}
          {spot === 'thumb' && <ThumbCard m={m} set={set} control={control} />}
          {spot === 'slide' && <SlideCard m={m} set={set} control={control} />}
          {spot === 'light' && <LightCard m={m} set={set} control={control} />}
          {spot === 'layers' && <LayersCard m={m} set={set} focus={focus} setFocus={setFocus} control={control} parts={parts} />}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── cards ───────────────────────── */

type CardProps = { m: Model; set: (p: Partial<Model>) => void; control: (label: string) => React.ReactNode };

function Proof({ children }: { children: React.ReactNode }) {
  return <div className="xr-proof" style={{ justifyContent: 'center' }}>{children}</div>;
}

function ShapeCard({ m, set, control }: CardProps) {
  return (
    <>
      <p>Each segment is as wide as its word plus some space on both sides. The tray adds a little space all around, so the thumb never touches the tray's edge.</p>
      <div className="xr-dials">
        <div className="xr-dial"><span className="xr-dial-head"><span>Size</span></span><Segmented size="compact" aria-label="Size" value={m.size} onValueChange={(v) => set({ size: v as Model['size'] })} options={[{ value: 'regular', label: 'Regular 28' }, { value: 'compact', label: 'Compact 24' }]} /></div>
        <Dial label="Space around the thumb" value={m.pad} min={0} max={8} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />
        <Dial label="Space beside each word" value={m.padX} min={4} max={20} step={1} fmt={(v) => `${v} pt`} onChange={(padX) => set({ padX })} />
      </div>
      <Proof>{control('Shape preview')}</Proof>
    </>
  );
}

function WellCard({ m, set, control }: CardProps) {
  return (
    <>
      <p>The well is a tray pressed into the page. It is darker at the top and has a bright line at the bottom. Make it deeper and the inner shadow gets stronger.</p>
      <div className="xr-dials">
        <Dial label="Depth" value={m.depth} min={0} max={3} step={0.1} fmt={(v) => (v === 0 ? 'flat' : v.toFixed(1))} onChange={(depth) => set({ depth })} />
      </div>
      <Proof>{control('Well preview')}</Proof>
    </>
  );
}

function ThumbCard({ m, set, control }: CardProps) {
  return (
    <>
      <p>The thumb is a small raised button inside the tray. It shows which option is on. Raise it and its shadow grows, so it looks like it stands higher.</p>
      <div className="xr-dials">
        <Dial label="Height above the tray" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} />
      </div>
      <Proof>{control('Thumb preview')}</Proof>
    </>
  );
}

function SlideCard({ m, set, control }: CardProps) {
  const ease = springEasing(m.k, m.c);
  return (
    <>
      <p>When you pick another option, the thumb slides there on a spring. It goes a little past the spot and comes back, like a real part hitting a stop. Change the spring and click a label.</p>
      <div className="xr-dials">
        <Dial label="Stiffness" value={m.k} min={60} max={600} step={10} onChange={(k) => set({ k })} />
        <Dial label="Damping" value={m.c} min={6} max={50} step={1} onChange={(c) => set({ c })} />
        <Switch label="No animation" on={m.instant} onChange={(instant) => set({ instant })} />
      </div>
      <div className="xr-proof" style={{ flexDirection: 'column', gap: 10 }}>
        {control('Slide preview')}
        <SpringPlot k={m.k} c={m.c} ms={Math.max(360, Math.min(900, ease.ms))} />
        <span className="readout-t ink2">settles in about {Math.round(ease.ms / 10) * 10} ms</span>
      </div>
    </>
  );
}

function LightCard({ m, set, control }: CardProps) {
  return (
    <>
      <p>One light shines on both parts. The thumb sticks up, so its top edge is bright. The tray goes down, so its top edge is in shadow and its bottom edge is bright. Move the light and both change.</p>
      <div className="xr-dials">
        <Dial label="Direction" value={m.lightDeg} min={-90} max={90} step={5} fmt={(v) => (v === 0 ? 'top' : v < 0 ? `${-v}° left` : `${v}° right`)} onChange={(lightDeg) => set({ lightDeg })} />
        <Dial label="Strength" value={m.lightK} min={0} max={1.5} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(lightK) => set({ lightK })} />
      </div>
      <Proof>{control('Light preview')}</Proof>
    </>
  );
}

function LayersCard({ m, set, focus, setFocus, control }: CardProps & { focus: string | null; setFocus: (n: string | null) => void; parts: Parts }) {
  const row = (group: 'well' | 'thumb', list: typeof WELL_LAYERS, i: number) => {
    const l = list[i];
    const on = m[group][i];
    return (
      <li key={l.name} className={[focus === l.name ? 'is-focus' : '', on ? '' : 'is-off'].join(' ')} onPointerEnter={() => setFocus(l.name)} onPointerLeave={() => setFocus(null)}>
        <Switch label={l.name} on={on} onChange={(v) => set({ [group]: m[group].map((x, j) => (j === i ? v : x)) } as Partial<Model>)} />
        <p>{l.why}</p>
      </li>
    );
  };
  return (
    <>
      <p>Two parts: the tray has four layers and the thumb has six. Turn one off to see what it adds.</p>
      <Proof>{control('Layers preview')}</Proof>
      <ol className="xr-layers">
        <li className="xr-layers-head eng">The tray</li>
        {WELL_LAYERS.map((_, i) => row('well', WELL_LAYERS, i))}
        <li className="xr-layers-head eng">The thumb</li>
        {THUMB_LAYERS.map((_, i) => row('thumb', THUMB_LAYERS, i))}
      </ol>
    </>
  );
}
