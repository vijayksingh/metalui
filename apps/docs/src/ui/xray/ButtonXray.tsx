import * as React from 'react';
import { Button, Segmented, Slider } from '@unlocalhosted/metalui';
import { useColorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · BUTTON
 *
 *   solid       the real button. Click it.
 *   x-ray       an isometric cap (top face + side wall) hovering over a gridded floor;
 *               its shadows are cast on the floor
 *   callouts    icons in two columns with leader lines to the part they explain
 *   play        every part has dials beside the model, and the model follows them live:
 *                 Shape   height · pill rule · padding · corners
 *                 Light   direction · strength (the sun moves, the lip and gradient follow)
 *                 Type    size · weight · tracking · centred on the letters or the box
 *                 Shadow  height above the page
 *                 Press   press it; it sinks on the release spring
 *                 Layers  each layer explained for a beginner, and switchable
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.button;
const P = RECIPE.props.self as Record<string, string | number>;
const SPRING = tokens.springs.release as { stiffness: number; damping: number; half: string; near: string };
const S = 2.6;
const WALL = 7;

type Spot = 'type' | 'shape' | 'light' | 'shadow' | 'press' | 'layers';
const SPOTS: { id: Spot; title: string; word: string }[] = [
  { id: 'type', title: 'Type', word: 'The label' },
  { id: 'shape', title: 'Shape', word: 'The pill rule' },
  { id: 'light', title: 'Light', word: 'One key light' },
  { id: 'shadow', title: 'Shadow', word: 'Height above the page' },
  { id: 'press', title: 'Press', word: 'Travel and spring' },
  { id: 'layers', title: 'Layers', word: 'What each layer does' },
];

const LAYERS = [
  { name: 'Fill', kind: 'fill', why: 'The body. A flat colour reads as a sticker, so the fill is a gentle gradient: a little lighter where the light lands. Switch it off and there is nothing left to hold.' },
  { name: 'Inner glow', kind: 'inset', why: 'A soft light just inside the edge. Real plastic scatters light near its surface, so the edges look a touch brighter than the middle. It is what makes the material feel soft rather than painted.' },
  { name: 'Top light', kind: 'inset', why: 'A thin highlight along the top edge. Your eye reads a bright top rim as "this edge is rounded and faces the light". That is the moment a flat shape starts to look like an object.' },
  { name: 'Rim', kind: 'outer', why: 'A hairline outline you barely notice. It keeps the edge crisp when the button sits on a background of almost the same colour, which happens all the time in a light interface.' },
  { name: 'Contact', kind: 'outer', why: 'A small, dark, tight shadow right at the edge. It says "I am touching the surface". Without it, objects look weightless, as if they hover.' },
  { name: 'Drop', kind: 'outer', why: 'A larger, softer shadow, pushed down and pulled in. It tells you how high the object sits: the bigger and blurrier, the higher it feels. That is elevation.' },
] as const;

interface Model {
  h: number; padAuto: boolean; pad: number; corners: number;
  lightDeg: number; lightK: number;
  size: number; weight: number; track: number; optical: boolean;
  lift: number; on: boolean[];
}
const INITIAL: Model = {
  h: Number(P.height), padAuto: true, pad: Number(P.pad), corners: 1,
  lightDeg: 0, lightK: 1,
  size: 12.5, weight: 500, track: -0.005, optical: true,
  lift: 1, on: LAYERS.map(() => true),
};

function Glyph({ id, size = 15 }: { id: Spot; size?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (id) {
    case 'type': return <svg {...c}><path d="M4 18 9 6l5 12M5.8 14h6.4" /><path d="M16 11.5a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM18.8 11.5V18" /></svg>;
    case 'shape': return <svg {...c}><rect x="3.5" y="7" width="17" height="10" rx="5" /><path d="M3.5 20.5h17M3.5 19v3M20.5 19v3" /></svg>;
    case 'light': return <svg {...c}><circle cx="12" cy="12" r="3.6" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></svg>;
    case 'shadow': return <svg {...c}><rect x="6" y="4" width="12" height="7" rx="3.5" /><ellipse cx="12" cy="18.5" rx="8" ry="2.5" fill="currentColor" fillOpacity=".25" stroke="none" /><path d="M12 11v4" strokeDasharray="1.5 2" /></svg>;
    case 'press': return <svg {...c}><path d="M12 3v4" /><path d="m9.5 5.5 2.5 2.5 2.5-2.5" /><path d="M5 10h14" /><path d="M7 13c1.2 0 1.2 3 2.5 3s1.3-3 2.5-3 1.2 3 2.5 3 1.3-3 2.5-3" /><path d="M5 20h14" /></svg>;
    case 'layers': return <svg {...c}><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg>;
  }
}

/** The recipe's layers for the current colorway, in recipe order: fill, then shadows. */
function useRecipe() {
  const { colorway } = useColorway();
  const ls = RECIPE.layers.filter((l: { part: string; colorway?: string; state?: string }) => l.part === 'self' && l.colorway === colorway && !l.state) as { prop: string; value: string }[];
  const fill = ls.find((l) => l.prop === 'background')?.value ?? 'linear-gradient(#FFFFFF,#F4F3F0)';
  const shadows = ls.filter((l) => l.prop === 'shadow').map((l) => l.value);
  const stops = (fill.match(/linear-gradient\((.*)\)/)?.[1] ?? '#FFFFFF,#F4F3F0').split(/,(?![^(]*\))/).map((x) => x.trim());
  return { fill, stops, shadows, colorway };
}

const scalePx = (v: string, k: number) => v.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`);
const alphaK = (v: string, k: number) => v.replace(/rgba\(([^)]*),\s*([\d.]+)\)/g, (_, rgb, a) => `rgba(${rgb},${Math.min(1, Number(a) * k).toFixed(3)})`);

function springCurve(k: number, c: number, ms = 360, step = 4) {
  let x = 0, v = 0; const pts: [number, number][] = []; const dt = step / 1000;
  for (let t = 0; t <= ms; t += step) { pts.push([t, x]); for (let s = 0; s < 8; s++) { const a = -k * (x - 1) - c * v; v += a * (dt / 8); x += v * (dt / 8); } }
  return pts;
}

/** Everything a view of the cap needs, derived from the model. */
function derive(m: Model, recipe: ReturnType<typeof useRecipe>, textW: number) {
  const pad = m.padAuto ? m.h / 2 - 1 : m.pad;
  const radius = (m.h / 2) * m.corners;
  const shadows = recipe.shadows;
  const lightAt = (m.lightDeg * Math.PI) / 180;
  const fill = m.on[0] ? `linear-gradient(${180 + m.lightDeg}deg, ${recipe.stops.join(', ')})` : 'transparent';
  const insets = LAYERS.map((l, i) => (i > 0 && l.kind === 'inset' && m.on[i] ? alphaK(shadows[i - 1] ?? '', m.lightK) : null)).filter(Boolean) as string[];
  const rim = m.on[3] ? shadows[2] ?? null : null;
  const lipX = -Math.sin(lightAt) * 3, lipY = Math.cos(lightAt) * 3;
  const cssShadow = [...insets, ...(rim ? [rim] : []), ...(m.on[4] && shadows[3] ? [shadows[3]] : []), ...(m.on[5] && shadows[4] ? [shadows[4]] : [])].join(', ') || 'none';
  return { pad, radius, fill, insets, rim, lipX, lipY, cssShadow, W: textW + pad * 2 };
}
type D = ReturnType<typeof derive>;

export function ButtonXray({ label = 'New Canvas', startOpen = false }: { label?: string; startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('shape');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [pressed, setPressed] = React.useState(false);
  const [focusLayer, setFocusLayer] = React.useState<number | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);
  const recipe = useRecipe();
  const measure = React.useRef<HTMLSpanElement>(null);
  const bench = React.useRef<HTMLDivElement>(null);
  const [textW, setTextW] = React.useState(76);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [label, m.size, m.weight, m.track]);
  const d = derive(m, recipe, textW);
  const W = d.W * S, HH = m.h * S, R = d.radius * S;
  const hover = 18 + m.lift * 14 - (pressed ? 12 : 0);
  const exploded = spot === 'layers';
  const wallTone = recipe.colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';
  const press = () => { setPressed(true); window.setTimeout(() => setPressed(false), 140); };

  const faceShadow = [...d.insets, ...(d.rim ? [d.rim] : [])].map((v) => scalePx(v, S)).join(', ') || 'none';
  const labelStyle: React.CSSProperties = { fontSize: m.size * S, fontWeight: m.weight, letterSpacing: `${m.track}em`, transform: m.optical ? 'translateY(-2px)' : 'translateY(3px)' };
  const current = SPOTS.find((x) => x.id === spot)!;

  return (
    <div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden className="xr-measure" style={{ fontSize: m.size, fontWeight: m.weight, letterSpacing: `${m.track}em` }}>{label}</span>
      <div className="xr-bench" ref={bench}>
        {!xray && (
          <div className="xr-solid" style={{ zoom: S }}>
            <Button cap="standard" onClick={() => setXray(true)} aria-label={`${label}: open the x-ray`}>{label}</Button>
          </div>
        )}

        {xray && (
          <div className="xr-scene" style={{ width: W, height: HH }}>
            <div className="xr-iso">
              <div className="xr-floor" />
              {m.on[5] && <div className="xr-shadow is-drop" style={{ width: W, height: HH, borderRadius: R, filter: `blur(${4 + hover * 0.35}px)`, opacity: Math.max(0.16, 0.42 - hover * 0.004), transform: `translate(${hover * 0.25}px, ${hover * 0.45}px)` }} />}
              {m.on[4] && <div className="xr-shadow is-contact" style={{ width: W, height: HH, borderRadius: R, filter: `blur(${1 + hover * 0.06}px)`, opacity: Math.max(0.08, 0.5 - hover * 0.012) }} />}

              <div className="xr-cap" style={{ transform: `translateZ(${hover}px)` }}>
                {Array.from({ length: WALL }, (_, i) => (
                  <div key={i} className="xr-slice" style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${i * 1.6}px)`, background: i === 0 || !m.on[0] ? 'transparent' : wallTone }} />
                ))}
                {exploded
                  ? LAYERS.map((l, i) => (
                      <div key={l.name} className={['xr-face is-layer', focusLayer === i ? 'is-focus' : '', m.on[i] ? '' : 'is-off'].join(' ')} style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${WALL * 1.6 + i * 17}px)`, background: i === 0 ? d.fill : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(recipe.shadows[i - 1] ?? '', S) }}>
                        <span className="xr-tag eng">{l.name}</span>
                      </div>
                    ))
                  : (
                    <div className="xr-face" style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${WALL * 1.6}px)`, background: d.fill, boxShadow: faceShadow }}>
                      <span className="xr-label" style={labelStyle}>{label}</span>
                      {spot === 'shape' && (
                        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${HH + 80}`} style={{ width: W + 80, height: HH + 80, left: -40, top: -40 }} aria-hidden>
                          <path d={`M-18 0V${HH}M-24 0H-12M-24 ${HH}H-12`} />
                          <text x="-28" y={HH / 2} textAnchor="end" dominantBaseline="middle">{m.h}</text>
                          <path d={`M0 ${HH + 16}H${d.pad * S}M0 ${HH + 10}V${HH + 22}M${d.pad * S} ${HH + 10}V${HH + 22}`} />
                          <text x={(d.pad * S) / 2} y={HH + 34} textAnchor="middle">{Number(d.pad.toFixed(1))}</text>
                          {R > 2 && <path d={`M${R} 0A${R} ${R} 0 0 0 0 ${R}`} className="is-arc" />}
                          <text x={R + 8} y={-8}>r {Number(d.radius.toFixed(1))}</text>
                        </svg>
                      )}
                      {spot === 'type' && <span className="xr-baseline" style={{ top: m.optical ? '60%' : '66%' }} />}
                    </div>
                  )}
                {spot === 'light' && m.lightK > 0 && (
                  <div className="xr-lip" style={{ width: W, height: HH, borderRadius: R, transform: `translateZ(${WALL * 1.6 + 0.5}px)`, boxShadow: `inset ${d.lipX * S}px ${d.lipY * S}px 0 -1px rgba(255,255,255,${(0.95 * Math.min(1, m.lightK)).toFixed(2)}), inset ${d.lipX * S * 2}px ${d.lipY * S * 2}px 14px -8px rgba(255,236,190,${(0.9 * Math.min(1, m.lightK)).toFixed(2)})` }} />
                )}
              </div>

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${W / 2 + Math.sin((m.lightDeg * Math.PI) / 180) * (W * 0.7)}px, ${HH / 2 - Math.cos((m.lightDeg * Math.PI) / 180) * (HH * 1.6)}px, ${hover + 150}px)`, opacity: 0.35 + 0.65 * Math.min(1, m.lightK) }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                </div>
              )}

              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  type: [W * 0.5, HH * 0.45, hover + WALL * 1.6 + 2],
                  shape: [Math.min(R * 0.4, W * 0.08) + 2, HH * 0.5, hover + WALL * 1.6],
                  light: [W * 0.35, HH * 0.06, hover + WALL * 1.6 + 1],
                  shadow: [W * 0.55, HH * 1.25, 0],
                  press: [W * 0.9, HH * 0.9, hover + WALL * 0.8],
                  layers: [W * 0.78, HH * 0.3, hover + WALL * 1.6 + (exploded ? 80 : 6)],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div>
          </div>
        )}

        {xray && <Callouts bench={bench} spot={spot} setSpot={setSpot} deps={[spot, m, pressed, textW]} />}
        <div className="xr-hint eng">{xray ? 'Click a part, then play with it' : 'Click the button to see inside it'}</div>
        {xray && (
          <div className="xr-actions">
            <button type="button" className="status" onClick={() => setM(INITIAL)}><span className="led off" />Reset</button>
            <button type="button" className="status" onClick={() => setXray(false)}><span className="led" />Solid</button>
          </div>
        )}
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          {spot === 'shape' && <ShapeCard m={m} set={set} d={d} />}
          {spot === 'light' && <LightCard m={m} set={set} d={d} />}
          {spot === 'type' && <TypeCard m={m} set={set} />}
          {spot === 'shadow' && <ShadowCard m={m} set={set} shadows={recipe.shadows} />}
          {spot === 'press' && <PressCard onPress={press} />}
          {spot === 'layers' && <LayersCard m={m} set={set} focus={focusLayer} setFocus={setFocusLayer} d={d} />}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── dials ───────────────────────── */

function Dial({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="xr-dial">
      <span className="xr-dial-head"><span>{label}</span><span className="readout-t">{fmt ? fmt(value) : value}</span></span>
      <Slider.Root value={value} min={min} max={max} step={step} onValueChange={onChange}>
        <Slider.Track />
        <Slider.Knob aria-label={label} />
      </Slider.Root>
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="xr-switch">
      <span>{label}</span>
      <span className="tog sm"><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} aria-label={label} /><span className="tr" /><span className="th" /></span>
    </label>
  );
}

function ShapeCard({ m, set, d }: { m: Model; set: (p: Partial<Model>) => void; d: D }) {
  return (
    <>
      <p>A pill's ends are half-circles, so its corner radius is half its height. The side padding follows the pill rule, half the height less one, so the text never crowds the curve. Break the rule and watch it turn into a lozenge.</p>
      <div className="xr-dials">
        <Dial label="Height" value={m.h} min={20} max={48} step={2} fmt={(v) => `${v} pt`} onChange={(h) => set({ h })} />
        <Switch label="Padding follows the pill rule" on={m.padAuto} onChange={(padAuto) => set({ padAuto })} />
        {!m.padAuto && <Dial label="Padding" value={m.pad} min={2} max={32} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />}
        <Dial label="Corners" value={m.corners} min={0} max={1} step={0.05} fmt={(v) => (v === 1 ? 'pill' : `${Math.round(v * 100)}%`)} onChange={(corners) => set({ corners })} />
      </div>
      <div className="xr-proof" style={{ justifyContent: 'center' }}>
        <span style={{ ['--mu-button-h' as string]: `${m.h}px`, ['--mu-button-px' as string]: `${d.pad}px` }}><Button tabIndex={-1} style={{ borderRadius: d.radius }}>New Canvas</Button></span>
      </div>
    </>
  );
}

function LightCard({ m, set, d }: { m: Model; set: (p: Partial<Model>) => void; d: D }) {
  return (
    <>
      <p>Everything is lit by one light. Where it lands, the fill is lighter and the edge catches a bright lip; away from it, the fill darkens. Move the light and every object in the system would follow, which is why it is one decision, not one per component.</p>
      <div className="xr-dials">
        <Dial label="Direction" value={m.lightDeg} min={-90} max={90} step={5} fmt={(v) => (v === 0 ? 'top' : v < 0 ? `${-v}° left` : `${v}° right`)} onChange={(lightDeg) => set({ lightDeg })} />
        <Dial label="Strength" value={m.lightK} min={0} max={1.5} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(lightK) => set({ lightK })} />
      </div>
      <div className="xr-proof" style={{ justifyContent: 'center' }}>
        <Button tabIndex={-1} style={{ background: d.fill, boxShadow: d.cssShadow }}>New Canvas</Button>
      </div>
    </>
  );
}

function TypeCard({ m, set }: { m: Model; set: (p: Partial<Model>) => void }) {
  return (
    <>
      <p>The label sets the button's width. Size and weight carry emphasis; letter-spacing opens or tightens it. Centre the box and the words look low, because capitals sit high in their line: centring on the letters fixes that.</p>
      <div className="xr-dials">
        <Dial label="Size" value={m.size} min={10} max={16} step={0.5} fmt={(v) => `${v} pt`} onChange={(size) => set({ size })} />
        <div className="xr-dial"><span className="xr-dial-head"><span>Weight</span></span><Segmented size="compact" aria-label="Weight" value={String(m.weight)} onValueChange={(v) => set({ weight: Number(v) })} options={[{ value: '400', label: '400' }, { value: '500', label: '500' }, { value: '600', label: '600' }]} /></div>
        <Dial label="Letter-spacing" value={m.track} min={-0.03} max={0.06} step={0.005} fmt={(v) => `${v.toFixed(3)} em`} onChange={(track) => set({ track })} />
        <div className="xr-dial"><span className="xr-dial-head"><span>Centred on</span></span><Segmented size="compact" aria-label="Centred on" value={m.optical ? 'letters' : 'box'} onValueChange={(v) => set({ optical: v === 'letters' })} options={[{ value: 'letters', label: 'The letters' }, { value: 'box', label: 'The box' }]} /></div>
      </div>
      <div className="xr-proof" style={{ justifyContent: 'center' }}>
        <Button tabIndex={-1} style={{ fontSize: m.size, fontWeight: m.weight, letterSpacing: `${m.track}em` }}>New Canvas</Button>
      </div>
    </>
  );
}

function ShadowCard({ m, set, shadows }: { m: Model; set: (p: Partial<Model>) => void; shadows: string[] }) {
  return (
    <>
      <p>Two shadows on the floor. The dark, tight one is where the cap touches; the soft, wide one says how high it is. Raise the cap and watch them part.</p>
      <div className="xr-dials">
        <Dial label="Height above the page" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} />
      </div>
      <div className="xr-proof" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        {shadows.slice(-2).map((v, i) => <span key={v} className="readout-t ink2">{i ? 'drop' : 'contact'} · {v}</span>)}
      </div>
    </>
  );
}

function PressCard({ onPress }: { onPress: () => void }) {
  const curve = React.useMemo(() => springCurve(SPRING.stiffness, SPRING.damping), []);
  const Wd = 220, Ht = 70, T = 360;
  const path = curve.map(([t, x], i) => `${i ? 'L' : 'M'}${((t / T) * Wd).toFixed(1)} ${(Ht - 8 - x * (Ht - 16)).toFixed(1)}`).join('');
  return (
    <>
      <p>Held, the cap sinks {String(P.travel)} pt in {String(P.press)}, linear, and its shadow tucks under. Released, it rides the release spring: stiffness {SPRING.stiffness}, damping {SPRING.damping}, halfway back in {SPRING.half}. Press it and watch the model.</p>
      <div className="xr-proof">
        <span onPointerDown={onPress}><Button tabIndex={0}>Press me</Button></span>
        <svg viewBox={`0 0 ${Wd} ${Ht}`} width={Wd} height={Ht} aria-hidden><path d={`M0 ${Ht - 8}H${Wd}`} stroke="var(--rule)" /><path d={path} fill="none" stroke="var(--green-deep)" strokeWidth="1.5" /></svg>
      </div>
    </>
  );
}

function LayersCard({ m, set, focus, setFocus, d }: { m: Model; set: (p: Partial<Model>) => void; focus: number | null; setFocus: (i: number | null) => void; d: D }) {
  const toggle = (i: number, v: boolean) => set({ on: m.on.map((x, j) => (j === i ? v : x)) });
  return (
    <>
      <p>Six layers, stacked. None of them is decoration: each one tells your eye one fact about the object. Switch one off and see what the button loses.</p>
      <div className="xr-proof" style={{ justifyContent: 'center' }}>
        <Button tabIndex={-1} style={{ background: d.fill, boxShadow: d.cssShadow }}>New Canvas</Button>
      </div>
      <ol className="xr-layers">
        {LAYERS.map((l, i) => (
          <li key={l.name} className={[focus === i ? 'is-focus' : '', m.on[i] ? '' : 'is-off'].join(' ')} onPointerEnter={() => setFocus(i)} onPointerLeave={() => setFocus(null)}>
            <Switch label={l.name} on={m.on[i]} onChange={(v) => toggle(i, v)} />
            <p>{l.why}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ───────────────────────── callouts ───────────────────────── */

const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], shape: ['left', 0.48], type: ['left', 0.76],
  layers: ['right', 0.2], press: ['right', 0.48], shadow: ['right', 0.76],
};

function Callouts({ bench, spot, setSpot, deps }: { bench: React.RefObject<HTMLDivElement | null>; spot: Spot; setSpot: (s: Spot) => void; deps: unknown[] }) {
  const [pts, setPts] = React.useState<Partial<Record<Spot, [number, number]>>>({});
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    let raf = 0; const until = performance.now() + 1100;
    const measure = () => {
      const el = bench.current;
      if (!el) { raf = requestAnimationFrame(measure); return; }
      const b = el.getBoundingClientRect();
      const next: Partial<Record<Spot, [number, number]>> = {};
      el.querySelectorAll<HTMLElement>('.xr-anchor').forEach((a) => {
        const r = a.getBoundingClientRect();
        next[a.dataset.spot as Spot] = [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top];
      });
      setPts(next); setBox({ w: b.width, h: b.height });
      if (performance.now() < until) raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => { raf = requestAnimationFrame(measure); });
    const start = requestAnimationFrame(() => { if (bench.current) ro.observe(bench.current); });
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(start); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const colX = (side: 'left' | 'right') => (side === 'left' ? 28 : box.w - 28);
  return (
    <>
      <svg className="xr-leaders" width={box.w} height={box.h} aria-hidden>
        {SPOTS.map((s) => {
          const p = pts[s.id]; if (!p) return null;
          const [side, fy] = SIDE[s.id];
          const cx = side === 'left' ? colX('left') + 36 : colX('right') - 36, cy = box.h * fy;
          const knee = side === 'left' ? cx + 24 : cx - 24;
          return (
            <g key={s.id} className={spot === s.id ? 'is-on' : ''}>
              <path d={`M${cx} ${cy}H${knee}L${p[0]} ${p[1]}`} />
              <circle cx={p[0]} cy={p[1]} r={spot === s.id ? 4 : 3} />
            </g>
          );
        })}
      </svg>
      {SPOTS.map((s) => {
        const [side, fy] = SIDE[s.id];
        const style = side === 'left' ? { left: colX('left'), top: box.h * fy } : { right: 28, top: box.h * fy };
        return (
          <button key={s.id} type="button" className={['xr-callout', side, spot === s.id ? 'is-on' : ''].join(' ')} style={style} onClick={() => setSpot(s.id)} aria-pressed={spot === s.id} aria-label={`${s.title}: ${s.word}`} title={s.title}>
            <span className="xr-callout-ico"><Glyph id={s.id} /></span>
          </button>
        );
      })}
    </>
  );
}
