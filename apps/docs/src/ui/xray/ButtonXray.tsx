import * as React from 'react';
import { Button } from '@unlocalhosted/metalui';
import { useColorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · BUTTON
 *
 *   solid       the real button. Click it.
 *   x-ray       the cap turns isometric: a thick pill (top face + side wall) hovering
 *               over a gridded floor; its shadows land on the floor as two shapes
 *   hotspots    icons on the object itself, each billboarded to face you:
 *                 Type (top face) · Shape (edge) · Light (top lip) · Shadow (floor)
 *                 Press (front) · Layers (above)
 *   explain     each hotspot moves the model: the sun lights the lip; the cap rises and
 *               its shadows spread; it sinks on the release spring; dimensions draw on the
 *               face; the layers separate
 *
 *   Motion: flat → isometric on object; lift and press ride the springs they explain.
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.button;
const P = RECIPE.props.self as Record<string, string | number>;
const SPRING = tokens.springs.release as { stiffness: number; damping: number; half: string; near: string };
const H = Number(P.height), PAD = Number(P.pad);
const S = 2.6;               // model scale
const WALL = 7;              // side-wall slices (the cap's thickness, exaggerated for legibility)
const LAYER_NAMES = ['Fill', 'Inner glow', 'Top light', 'Rim', 'Contact', 'Drop'];

type Spot = 'type' | 'shape' | 'light' | 'shadow' | 'press' | 'layers';

const SPOTS: { id: Spot; title: string; word: string }[] = [
  { id: 'type', title: 'Type', word: 'The label' },
  { id: 'shape', title: 'Shape', word: 'The pill rule' },
  { id: 'light', title: 'Light', word: 'One key light' },
  { id: 'shadow', title: 'Shadow', word: 'Height above the page' },
  { id: 'press', title: 'Press', word: 'Travel and spring' },
  { id: 'layers', title: 'Layers', word: 'Six layers, one recipe' },
];

function Glyph({ id }: { id: Spot }) {
  const common = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (id) {
    case 'type': return <svg {...common}><path d="M4 18 9 6l5 12M5.8 14h6.4" /><path d="M16 11.5a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM18.8 11.5V18" /></svg>;
    case 'shape': return <svg {...common}><rect x="3.5" y="7" width="17" height="10" rx="5" /><path d="M3.5 20.5h17M3.5 19v3M20.5 19v3" /></svg>;
    case 'light': return <svg {...common}><circle cx="12" cy="12" r="3.6" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" /></svg>;
    case 'shadow': return <svg {...common}><rect x="6" y="4" width="12" height="7" rx="3.5" /><ellipse cx="12" cy="18.5" rx="8" ry="2.5" fill="currentColor" fillOpacity=".25" stroke="none" /><path d="M12 11v4" strokeDasharray="1.5 2" /></svg>;
    case 'press': return <svg {...common}><path d="M12 3v4" /><path d="m9.5 5.5 2.5 2.5 2.5-2.5" /><path d="M5 10h14" /><path d="M7 13c1.2 0 1.2 3 2.5 3s1.3-3 2.5-3 1.2 3 2.5 3 1.3-3 2.5-3" /><path d="M5 20h14" /></svg>;
    case 'layers': return <svg {...common}><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg>;
  }
}

function useLayers() {
  const { colorway } = useColorway();
  const ls = RECIPE.layers.filter((l: { part: string; colorway?: string; state?: string }) => l.part === 'self' && l.colorway === colorway && !l.state) as { prop: string; value: string }[];
  const fill = ls.find((l) => l.prop === 'background')?.value ?? 'var(--btn-bg)';
  const shadows = ls.filter((l) => l.prop === 'shadow').map((l) => l.value);
  return { fill, shadows, colorway };
}

function springCurve(k: number, c: number, ms = 360, step = 4) {
  let x = 0, v = 0; const pts: [number, number][] = []; const dt = step / 1000;
  for (let t = 0; t <= ms; t += step) { pts.push([t, x]); for (let s = 0; s < 8; s++) { const a = -k * (x - 1) - c * v; v += a * (dt / 8); x += v * (dt / 8); } }
  return pts;
}

const scalePx = (v: string, k: number) => v.replace(/(-?[\d.]+)px/g, (_, n) => `${(Number(n) * k).toFixed(2)}px`);

export function ButtonXray({ label = 'New Canvas', startOpen = false }: { label?: string; startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('shape');
  const [lift, setLift] = React.useState(1);      // shadow: height above the page, 0..3
  const [pressed, setPressed] = React.useState(false);
  const { fill, shadows, colorway } = useLayers();
  const measure = React.useRef<HTMLSpanElement>(null);
  const bench = React.useRef<HTMLDivElement>(null);
  const [textW, setTextW] = React.useState(76);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [label]);
  const W = (textW + PAD * 2) * S, HH = H * S;

  const inner = shadows.filter((s) => s.trim().startsWith('inset'));
  const outer = shadows.filter((s) => !s.trim().startsWith('inset'));
  const wallTone = colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';
  const hover = 18 + lift * 14 - (pressed ? 12 : 0);          // cap height above the floor, px in model space
  const exploded = spot === 'layers';

  const press = () => { setPressed(true); window.setTimeout(() => setPressed(false), 140); };

  return (
    <div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden className="xr-measure">{label}</span>
      <div className="xr-bench" ref={bench}>
        {!xray && (
          <div className="xr-solid" style={{ zoom: S }}>
            <Button cap="standard" onClick={() => setXray(true)} aria-label={`${label}: open the x-ray`}>{label}</Button>
          </div>
        )}

        {xray && (
          <div className="xr-scene" style={{ ['--w' as string]: `${W}px`, ['--h' as string]: `${HH}px` }}>
            <div className="xr-iso">
              {/* the floor: the page the cap rests on */}
              <div className="xr-floor" />
              {/* shadows fall on the floor: contact tight and dark, drop soft and wide; both follow the lift */}
              <div className="xr-shadow is-drop" style={{ width: W, height: HH, filter: `blur(${4 + hover * 0.35}px)`, opacity: Math.max(0.16, 0.42 - hover * 0.004), transform: `translate(${hover * 0.25}px, ${hover * 0.45}px)` }} />
              <div className="xr-shadow is-contact" style={{ width: W, height: HH, filter: `blur(${1 + hover * 0.06}px)`, opacity: Math.max(0.08, 0.5 - hover * 0.012) }} />

              {/* the cap: side wall slices, then the top face carrying the fill, inner light and label */}
              <div className="xr-cap" style={{ transform: `translateZ(${hover}px)` }}>
                {Array.from({ length: WALL }, (_, i) => (
                  <div key={i} className="xr-slice" style={{ width: W, height: HH, transform: `translateZ(${i * 1.6}px)`, background: i === 0 ? 'transparent' : wallTone }} />
                ))}
                {exploded
                  ? [fill, ...inner].map((layer, i) => (
                      <div key={i} className="xr-face is-layer" style={{ width: W, height: HH, transform: `translateZ(${WALL * 1.6 + i * 26}px)`, background: i === 0 ? layer : 'transparent', boxShadow: i === 0 ? 'none' : scalePx(layer, S) }}>
                        <span className="xr-tag eng" style={{ transform: 'translateZ(0)' }}>{LAYER_NAMES[i]}</span>
                      </div>
                    ))
                  : (
                    <div className="xr-face" style={{ width: W, height: HH, transform: `translateZ(${WALL * 1.6}px)`, background: fill, boxShadow: inner.map((s) => scalePx(s, S)).join(', ') }}>
                      <span className="xr-label">{label}</span>
                      {spot === 'shape' && (
                        <svg className="xr-dims" viewBox={`-40 -40 ${W + 80} ${HH + 80}`} style={{ width: W + 80, height: HH + 80, left: -40, top: -40 }} aria-hidden>
                          <path d={`M-18 0V${HH}M-24 0H-12M-24 ${HH}H-12`} />
                          <text x="-28" y={HH / 2} textAnchor="end" dominantBaseline="middle">{H}</text>
                          <path d={`M0 ${HH + 16}H${PAD * S}M0 ${HH + 10}V${HH + 22}M${PAD * S} ${HH + 10}V${HH + 22}`} />
                          <text x={(PAD * S) / 2} y={HH + 34} textAnchor="middle">{PAD}</text>
                          <path d={`M${HH / 2} 0A${HH / 2} ${HH / 2} 0 0 0 ${HH / 2} ${HH}`} className="is-arc" />
                          <text x={HH / 2 + 8} y={-8}>r = h ÷ 2</text>
                        </svg>
                      )}
                      {spot === 'type' && <span className="xr-baseline" />}
                    </div>
                  )}
                {spot === 'light' && <div className="xr-lip" style={{ width: W, height: HH, transform: `translateZ(${WALL * 1.6 + 0.5}px)` }} />}
              </div>

              {spot === 'light' && (
                <div className="xr-sun" style={{ transform: `translate3d(${-W * 0.35}px, ${-HH * 1.3}px, ${hover + 140}px)` }}>
                  <span className="xr-bill"><Glyph id="light" /></span>
                  <span className="xr-ray" />
                </div>
              )}

              {/* anchors: invisible points on the parts; the callouts outside point at them */}
              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  type: [W * 0.5, HH * 0.45, hover + WALL * 1.6 + 2],
                  shape: [HH * 0.12, HH * 0.5, hover + WALL * 1.6],
                  light: [W * 0.35, HH * 0.06, hover + WALL * 1.6 + 1],
                  shadow: [W * 0.55, HH * 1.25, 0],
                  press: [W * 0.9, HH * 0.9, hover + WALL * 0.8],
                  layers: [W * 0.78, HH * 0.3, hover + WALL * 1.6 + (spot === 'layers' ? 80 : 6)],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div>
          </div>
        )}

        {xray && <Callouts bench={bench} spot={spot} setSpot={setSpot} deps={[spot, lift, pressed]} />}
        <div className="xr-hint eng">{xray ? 'Click a part to see how it is built' : 'Click the button to see inside it'}</div>
        {xray && <button type="button" className="xr-close status" onClick={() => setXray(false)}><span className="led" />Solid</button>}
      </div>

      {xray && (
        <Explain spot={spot} fill={fill} outer={outer} inner={inner} lift={lift} setLift={setLift} onPress={press} />
      )}
    </div>
  );
}

const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], shape: ['left', 0.48], type: ['left', 0.76],
  layers: ['right', 0.2], press: ['right', 0.48], shadow: ['right', 0.76],
};

/** Callouts in two columns beside the model, each with a leader line to its anchor on the object. */
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

function Explain({ spot, fill, outer, inner, lift, setLift, onPress }: { spot: Spot; fill: string; outer: string[]; inner: string[]; lift: number; setLift: (n: number) => void; onPress: () => void }) {
  const s = SPOTS.find((x) => x.id === spot)!;
  return (
    <div className="xr-card raised" key={spot}>
      <span className="eng xr-card-head"><Glyph id={spot} /> {s.title} · {s.word}</span>
      {spot === 'type' && (
        <>
          <p>The label sits on the top face in the <code>ui</code> role: 12.5 on a 16 line, weight 500. Watch the green baseline: the label is centred on the letters, not on the box, because capitals sit high.</p>
          <div className="xr-proof"><span style={{ font: 'var(--mu-type-ui)' }}>New Canvas</span><span className="readout-t ink3">ui · 12.5 / 16 · 500</span></div>
        </>
      )}
      {spot === 'shape' && (
        <>
          <p>The ends are half-circles, so the radius is half the height. The side padding is half the height, less one ({PAD} at {H}): text never touches the curve, and a taller button stays a pill.</p>
          <div className="xr-proof">{[24, 32, 40].map((h) => <span key={h} style={{ ['--mu-button-h' as string]: `${h}px`, ['--mu-button-px' as string]: `${h / 2 - 1}px` }}><Button tabIndex={-1}>Save</Button></span>)}</div>
        </>
      )}
      {spot === 'light' && (
        <>
          <p>One light, top-left. It catches the upper edge as a bright lip and falls off down the face, so the fill runs slightly darker at the bottom. Nothing glows: the light is in the material.</p>
          <div className="xr-proof"><span className="xr-chip" style={{ background: fill }} /><span className="readout-t ink2">{fill}</span></div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>Two shadows on the floor. The dark, tight one is where the cap touches; the soft, wide one says how high it is. Raise the cap and watch them part.</p>
          <div className="xr-proof" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <label className="t-ui" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>Height <input type="range" min={0} max={3} step={0.1} value={lift} onChange={(e) => setLift(+e.target.value)} style={{ flex: 1 }} /> <span className="readout-t">{lift.toFixed(1)}</span></label>
            {outer.slice(-2).map((v, i) => <span key={v} className="readout-t ink2">{i ? 'drop' : 'contact'} · {v}</span>)}
          </div>
        </>
      )}
      {spot === 'press' && <PressProof onPress={onPress} />}
      {spot === 'layers' && (
        <>
          <p>The cap is the fill plus {inner.length} inner lights on top and {outer.length} shadows underneath: {inner.length + outer.length + 1} layers, all from <code>recipes.button</code>. The same data draws the CSS and the SwiftUI, so both are the same object.</p>
          <div className="xr-proof"><span className="readout-t ink2">fill + {inner.length} inset + {outer.length} outer · per colorway</span></div>
        </>
      )}
    </div>
  );
}

function PressProof({ onPress }: { onPress: () => void }) {
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
