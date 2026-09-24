import * as React from 'react';
import { Button } from '@unlocalhosted/metalui';
import { useColorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · BUTTON
 *
 *   solid     the real button, magnified. Click it.
 *   x-ray     the cap turns to a blueprint: outline, dimension lines, baseline, radius;
 *             numbered hotspots sit on its parts
 *   hotspot   label · padding · rim · shadow · press → an explanation with the rule,
 *             the recipe's numbers and a small live proof
 *   layers    the cap tilts into depth and its recipe layers separate
 *
 *   Motion: fills fade and outlines draw on the settle spring; the tilt rides object.
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.button;
const P = RECIPE.props.self as Record<string, string | number>;
const SPRING = tokens.springs.release as { stiffness: number; damping: number; half: string; near: string };
const H = Number(P.height), PAD = Number(P.pad), SCALE = 3;
const LAYER_NAMES = ['Fill', 'Inner glow', 'Top light', 'Rim', 'Contact', 'Drop'];

type Spot = 'label' | 'padding' | 'rim' | 'shadow' | 'press' | 'layers';
const SPOTS: { id: Spot; n: number; title: string }[] = [
  { id: 'label', n: 1, title: 'The label' },
  { id: 'padding', n: 2, title: 'The pill rule' },
  { id: 'rim', n: 3, title: 'Light and rim' },
  { id: 'shadow', n: 4, title: 'Where it meets the page' },
  { id: 'press', n: 5, title: 'The press' },
  { id: 'layers', n: 6, title: 'Six layers' },
];

function useLayers() {
  const { colorway } = useColorway();
  const ls = RECIPE.layers.filter((l: { part: string; colorway?: string; state?: string }) => l.part === 'self' && l.colorway === colorway && !l.state) as { prop: string; value: string }[];
  const fill = ls.find((l) => l.prop === 'background')?.value ?? 'var(--btn-bg)';
  const shadows = ls.filter((l) => l.prop === 'shadow').map((l) => l.value);
  return { fill, shadows };
}

function springCurve(k: number, c: number, ms = 360, step = 4) {
  let x = 0, v = 0; const pts: [number, number][] = []; const dt = step / 1000;
  for (let t = 0; t <= ms; t += step) { pts.push([t, x]); for (let s = 0; s < 8; s++) { const a = -k * (x - 1) - c * v; v += a * (dt / 8); x += v * (dt / 8); } }
  return pts;
}

export function ButtonXray({ label = 'New Canvas', startOpen = false }: { label?: string; startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot | null>(startOpen ? 'label' : null);
  const { fill, shadows } = useLayers();
  const measure = React.useRef<HTMLSpanElement>(null);
  const [textW, setTextW] = React.useState(76);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [label]);
  const W = textW + PAD * 2;
  const exploded = xray && spot === 'layers';

  const open = () => { setXray(true); setSpot('label'); };
  const close = () => { setXray(false); setSpot(null); };

  return (
    <div className="xr" data-xray={xray || undefined} data-exploded={exploded || undefined}>
      <span ref={measure} aria-hidden className="xr-measure">{label}</span>
      <div className="xr-bench">
        <div className="xr-grid" aria-hidden />
        <div className="xr-specimen" style={{ width: W * SCALE, height: H * SCALE }}>
          {/* the real object */}
          <div className="xr-solid" style={{ zoom: SCALE }}>
            <Button cap="standard" onClick={xray ? undefined : open} aria-label={xray ? label : `${label} — open the x-ray`}>{label}</Button>
          </div>

          {/* the blueprint: layers as planes, then the wireframe and its dimensions */}
          <div className={['xr-stack', exploded ? 'is-exploded' : ''].join(' ')} aria-hidden>
            {[{ bg: fill, sh: 'none' }, ...shadows.map((sh) => ({ bg: 'transparent', sh }))].map((l, i) => (
              <div key={i} className="xr-plane" style={{ ['--i' as string]: i, width: W * SCALE, height: H * SCALE }}>
                <span className="xr-plane-fill" style={{ background: l.bg, boxShadow: l.sh.replace(/(-?[\d.]+)px/g, (_, n) => `${Number(n) * SCALE}px`) }} />
                {exploded && <span className="xr-plane-name eng">{LAYER_NAMES[i] ?? `Layer ${i + 1}`}</span>}
              </div>
            ))}
          </div>

          <svg className="xr-wire" viewBox={`-60 -60 ${W * SCALE + 120} ${H * SCALE + 150}`} style={{ left: -60, top: -60, width: W * SCALE + 120, height: H * SCALE + 150 }} aria-hidden>
            <rect x="0" y="0" width={W * SCALE} height={H * SCALE} rx={(H * SCALE) / 2} className="xr-outline" />
            {/* height */}
            <path d={`M-24 0V${H * SCALE}M-30 0H-18M-30 ${H * SCALE}H-18`} className="xr-dim" />
            <text x="-34" y={(H * SCALE) / 2} className="xr-num" textAnchor="end" dominantBaseline="middle">{H}</text>
            {/* padding */}
            <path d={`M0 ${H * SCALE + 22}H${PAD * SCALE}M0 ${H * SCALE + 16}V${H * SCALE + 28}M${PAD * SCALE} ${H * SCALE + 16}V${H * SCALE + 28}`} className={['xr-dim', spot === 'padding' ? 'is-hot' : ''].join(' ')} />
            <text x={(PAD * SCALE) / 2} y={H * SCALE + 42} className="xr-num" textAnchor="middle">{PAD} = {H} ÷ 2 − 1</text>
            {/* baseline and cap height of the label */}
            <path d={`M${PAD * SCALE} ${H * SCALE * 0.66}H${(W - PAD) * SCALE}`} className={['xr-guide', spot === 'label' ? 'is-hot' : ''].join(' ')} />
            {/* radius */}
            <path d={`M${(H * SCALE) / 2} 0A${(H * SCALE) / 2} ${(H * SCALE) / 2} 0 0 0 ${(H * SCALE) / 2} ${H * SCALE}`} className={['xr-guide', spot === 'rim' ? 'is-hot' : ''].join(' ')} />
            {/* the page line under the cap */}
            <path d={`M-40 ${H * SCALE + 2}H${W * SCALE + 40}`} className={['xr-page', spot === 'shadow' ? 'is-hot' : ''].join(' ')} />
          </svg>

          {xray && SPOTS.map((s) => {
            const pos: Record<Spot, [number, number]> = {
              label: [W * SCALE * 0.5, H * SCALE * 0.5],
              padding: [(PAD * SCALE) / 2, H * SCALE * 0.5],
              rim: [W * SCALE * 0.72, 3],
              shadow: [W * SCALE * 0.28, H * SCALE + 4],
              press: [W * SCALE - (H * SCALE) / 2, H * SCALE * 0.5],
              layers: [W * SCALE + 30, -26],
            };
            const [x, y] = pos[s.id];
            return (
              <button key={s.id} type="button" className={['xr-hot', spot === s.id ? 'is-on' : ''].join(' ')} style={{ left: x, top: y }} onClick={() => setSpot(s.id)} aria-pressed={spot === s.id} aria-label={s.title}>
                {s.n}
              </button>
            );
          })}
        </div>

        <div className="xr-hint eng">{xray ? 'Click a number' : 'Click the button to see inside it'}</div>
        {xray && <button type="button" className="xr-close status" onClick={close}><span className="led" />Solid</button>}
      </div>

      {xray && spot && <Explain spot={spot} fill={fill} shadows={shadows} />}
    </div>
  );
}

function Explain({ spot, fill, shadows }: { spot: Spot; fill: string; shadows: string[] }) {
  const s = SPOTS.find((x) => x.id === spot)!;
  return (
    <div className="xr-card raised" key={spot}>
      <span className="eng">{s.n} · {s.title}</span>
      {spot === 'label' && (
        <>
          <p>The label is set in the <code>ui</code> role: Geist 12.5 on a 16 line, weight 500, tracking −0.005 em. It sits on the optical centre, not the box centre, because caps sit high.</p>
          <div className="xr-proof"><span style={{ font: 'var(--mu-type-ui)' }}>New Canvas</span><span className="readout-t ink3">ui · 12.5 / 16 · 500</span></div>
        </>
      )}
      {spot === 'padding' && (
        <>
          <p>Sides are half the height, less one: <code>{PAD} = {H} ÷ 2 − 1</code>. That keeps the text off the curve at any height, so a taller button is still a pill, never a lozenge.</p>
          <div className="xr-proof">{[24, 32, 40].map((h) => <span key={h} style={{ ['--mu-button-h' as string]: `${h}px`, ['--mu-button-px' as string]: `${h / 2 - 1}px` }}><Button tabIndex={-1}>Save</Button></span>)}</div>
        </>
      )}
      {spot === 'rim' && (
        <>
          <p>One key light from the top-left. A bright lip runs along the top edge, a half-point rim holds the silhouette, and the fill darkens slightly downward. Light lives inside the material; nothing glows.</p>
          <div className="xr-proof"><span className="readout-t ink2">{fill}</span></div>
        </>
      )}
      {spot === 'shadow' && (
        <>
          <p>Two shadows, not one. A tight contact shadow says the cap is touching the page; a soft drop says it has height. Together they are elevation 1.</p>
          <div className="xr-proof" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>{shadows.slice(-2).map((v) => <span key={v} className="readout-t ink2">{v}</span>)}</div>
        </>
      )}
      {spot === 'press' && <PressProof />}
      {spot === 'layers' && (
        <>
          <p>The cap is {shadows.length + 1} layers from one recipe in <code>tokens.json</code>. The same data generates the CSS and the SwiftUI, so both platforms render it identically.</p>
          <div className="xr-proof"><span className="readout-t ink2">recipes.button · {shadows.length} shadows + fill · per colorway</span></div>
        </>
      )}
    </div>
  );
}

function PressProof() {
  const curve = React.useMemo(() => springCurve(SPRING.stiffness, SPRING.damping), []);
  const Wd = 220, Ht = 70, T = 360;
  const path = curve.map(([t, x], i) => `${i ? 'L' : 'M'}${((t / T) * Wd).toFixed(1)} ${(Ht - 8 - x * (Ht - 16)).toFixed(1)}`).join('');
  return (
    <>
      <p>Held, it sinks {String(P.travel)} pt in {String(P.press)}, linear, and the shadow collapses into a well. Released, it rides the release spring: stiffness {SPRING.stiffness}, damping {SPRING.damping}, halfway in {SPRING.half}.</p>
      <div className="xr-proof">
        <Button tabIndex={0}>Press me</Button>
        <svg viewBox={`0 0 ${Wd} ${Ht}`} width={Wd} height={Ht} aria-hidden><path d={`M0 ${Ht - 8}H${Wd}`} stroke="var(--rule)" /><path d={path} fill="none" stroke="var(--green-deep)" strokeWidth="1.5" /></svg>
      </div>
    </>
  );
}
