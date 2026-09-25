import * as React from 'react';
import { Button, Switcher, type ButtonCap } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Callouts, Dial, Glyph, SpringPlot, Switch, alphaK, scalePx, useRecipeLayers, useStateLayers, type SpotDef } from './kit';

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
const SPOTS: SpotDef<Spot>[] = [
  { id: 'type', title: 'Type', word: 'The label' },
  { id: 'shape', title: 'Shape', word: 'Size and corners' },
  { id: 'light', title: 'Light', word: 'Where the light comes from' },
  { id: 'shadow', title: 'Shadow', word: 'Height above the page' },
  { id: 'press', title: 'Press', word: 'What happens when you press' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];

const LAYERS = [
  { name: 'Fill', kind: 'fill', why: 'The main colour. It is a little lighter at the top, where the light hits. Turn it off and the button has no body.' },
  { name: 'Inner glow', kind: 'inset', why: 'A soft light just inside the edge. It makes the button look like soft plastic instead of flat paint.' },
  { name: 'Top light', kind: 'inset', why: 'A thin bright line on the top edge. It makes the top look rounded, so the button looks like a real object.' },
  { name: 'Rim', kind: 'outer', why: 'A very thin outline. It keeps the edge sharp when the background is almost the same colour as the button.' },
  { name: 'Contact', kind: 'outer', why: 'A small dark shadow right under the edge. It shows the button is sitting on the page. Without it, the button seems to float.' },
  { name: 'Drop', kind: 'outer', why: 'A bigger, softer shadow. It shows how high the button is. A bigger, blurrier shadow looks higher.' },
] as const;

export interface ButtonXrayModel {
  h: number; padAuto: boolean; pad: number; corners: number;
  lightDeg: number; lightK: number;
  size: number; weight: number; track: number; optical: boolean;
  lift: number; on: boolean[];
}
export const BUTTON_XRAY_INITIAL: ButtonXrayModel = {
  h: Number(P.height), padAuto: true, pad: Number(P.pad), corners: 1,
  lightDeg: 0, lightK: 1,
  size: 12.5, weight: 500, track: -0.005, optical: true,
  lift: 1, on: LAYERS.map(() => true),
};

/** Everything a view of the cap needs, derived from the model. */
function derive(m: ButtonXrayModel, recipe: ReturnType<typeof useRecipeLayers>, textW: number) {
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
export function ButtonXray({ label = 'New Canvas', cap = 'standard', icon = 'none', disabled = false, travel = 1, model, setModel, onReset, startOpen = false }: {
  label?: string; cap?: ButtonCap; icon?: IconName | 'none'; disabled?: boolean; travel?: number;
  model?: ButtonXrayModel; setModel?: (patch: Partial<ButtonXrayModel>) => void; onReset?: () => void; startOpen?: boolean;
}) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('shape');
  const [localModel, setLocalModel] = React.useState<ButtonXrayModel>(BUTTON_XRAY_INITIAL);
  const m = model ?? localModel;
  const [pressed, setPressed] = React.useState(false);
  const [focusLayer, setFocusLayer] = React.useState<number | null>(null);
  const set = (patch: Partial<ButtonXrayModel>) => setModel ? setModel(patch) : setLocalModel((old) => ({ ...old, ...patch }));
  const recipe = useRecipeLayers('button', cap === 'standard' ? 'self' : cap);
  const pressedRecipe = useStateLayers('button', 'pressed', cap === 'standard' ? 'self' : cap);
  const measure = React.useRef<HTMLSpanElement>(null);
  const bench = React.useRef<HTMLDivElement>(null);
  const [textW, setTextW] = React.useState(76);
  React.useLayoutEffect(() => { if (measure.current) setTextW(measure.current.offsetWidth); }, [label, m.size, m.weight, m.track]);
  const d = derive(m, recipe, textW);
  const W = d.W * S, HH = m.h * S, R = d.radius * S;
  const hover = 18 + m.lift * 14 - (pressed ? 12 * travel : 0);
  const exploded = spot === 'layers';
  const wallTone = cap === 'primary' ? '#1c1c1f' : cap === 'destructive' ? '#a6352c' : recipe.colorway === 'graphite' ? '#1c1c1f' : '#d9d7d1';

  const faceShadow = [...d.insets, ...(d.rim ? [d.rim] : [])].map((v) => scalePx(v, S)).join(', ') || 'none';
  const labelStyle: React.CSSProperties = { fontSize: m.size * S, fontWeight: m.weight, letterSpacing: `${m.track}em`, transform: m.optical ? 'translateY(-2px)' : 'translateY(3px)' };
  const current = SPOTS.find((x) => x.id === spot)!;

  return (
    <div className="xr button-xray" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden className="xr-measure" style={{ fontSize: m.size, fontWeight: m.weight, letterSpacing: `${m.track}em` }}>{label}</span>
      {onReset && <div className="button-xray-toolbar" role="group" aria-label="Button view">
        <button type="button" className="status" aria-pressed={!xray} onClick={() => setXray(false)}>Preview</button>
        <button type="button" className="status" aria-pressed={xray} onClick={() => setXray(true)}>X-ray</button>
      </div>}
      <div className="xr-bench" ref={bench}>
        {!xray && (
          <div className="xr-solid" style={{ zoom: S, transform: `translateY(${(1 - m.lift) * 4}px)`, filter: m.lift > 1 ? `drop-shadow(0 ${(m.lift - 1) * 2}px ${(m.lift - 1) * 3}px rgba(0,0,0,.18))` : undefined }}>
            <Button
              cap={cap} disabled={disabled}
              onClick={onReset ? undefined : () => setXray(true)}
              aria-label={onReset ? label || 'Button preview' : `${label}: open the x-ray`}
              onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)} onPointerLeave={() => setPressed(false)}
              onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') setPressed(true); }}
              onKeyUp={() => setPressed(false)}
              style={{
                ['--mu-r-button-self-height' as string]: `${m.h}px`,
                ['--mu-r-button-self-pad' as string]: `${d.pad}px`,
                ['--mu-r-button-self-travel' as string]: `${travel}px`,
                borderRadius: d.radius, fontSize: m.size, fontWeight: m.weight, letterSpacing: `${m.track}em`,
                background: pressed && pressedRecipe.fill !== 'transparent' ? pressedRecipe.fill : d.fill,
                boxShadow: pressed && pressedRecipe.shadows.length ? pressedRecipe.shadows.join(', ') : d.cssShadow,
                color: cap === 'standard' ? undefined : '#fff',
              }}
            >
              {icon !== 'none' && <Icon name={icon} size={m.h <= 24 ? 12 : m.h <= 32 ? 14 : m.h <= 40 ? 16 : 20} />}
              <span style={{ transform: m.optical ? 'translateY(-.5px)' : 'translateY(1px)' }}>{label}</span>
            </Button>
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
                      <span className="xr-label" style={{ ...labelStyle, color: cap === 'standard' ? undefined : '#fff' }}>{label}</span>
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

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, pressed, textW]} />}
        <div className="xr-hint eng">{xray ? onReset ? 'Pick a part to inspect. Tune below or beside the model.' : 'Pick an icon to learn about that part' : onReset ? 'Press and hold. Switch to X-ray to inspect the same button.' : 'Click the button to see inside it'}</div>
        {!onReset && xray && <div className="xr-actions">
          <button type="button" className="status" onClick={() => setLocalModel(BUTTON_XRAY_INITIAL)}><span className="led off" />Reset</button>
          <button type="button" className="status" onClick={() => setXray(false)}><span className="led" />Solid</button>
        </div>}
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          {spot === 'shape' && <ShapeCard m={m} set={set} />}
          {spot === 'light' && <LightCard m={m} set={set} />}
          {spot === 'type' && <TypeCard m={m} set={set} />}
          {spot === 'shadow' && <ShadowCard m={m} set={set} shadows={recipe.shadows} />}
          {spot === 'press' && <PressCard travel={travel} onPressChange={setPressed} />}
          {spot === 'layers' && <LayersCard m={m} set={set} focus={focusLayer} setFocus={setFocusLayer} />}
        </div>
      )}
    </div>
  );
}

function ShapeCard({ m, set }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void }) {
  return (
    <>
      <p>The ends are half circles, so the corner radius is half the height. The side space is half the height minus one, so the text never touches the curve. Change the numbers and see what happens.</p>
      <div className="xr-dials">
        <Dial label="Height" value={m.h} min={20} max={48} step={2} fmt={(v) => `${v} pt`} onChange={(h) => set({ h })} />
        <Switch label="Space = half the height minus one" on={m.padAuto} onChange={(padAuto) => set({ padAuto })} />
        {!m.padAuto && <Dial label="Padding" value={m.pad} min={2} max={32} step={1} fmt={(v) => `${v} pt`} onChange={(pad) => set({ pad })} />}
        <Dial label="Corners" value={m.corners} min={0} max={1} step={0.05} fmt={(v) => (v === 1 ? 'pill' : `${Math.round(v * 100)}%`)} onChange={(corners) => set({ corners })} />
      </div>
    </>
  );
}

function LightCard({ m, set }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void }) {
  return (
    <>
      <p>There is one light for everything. The side facing it is lighter, and its edge gets a bright line. Move the light and the button changes with it.</p>
      <div className="xr-dials">
        <Dial label="Direction" value={m.lightDeg} min={-90} max={90} step={5} fmt={(v) => (v === 0 ? 'top' : v < 0 ? `${-v}° left` : `${v}° right`)} onChange={(lightDeg) => set({ lightDeg })} />
        <Dial label="Strength" value={m.lightK} min={0} max={1.5} step={0.05} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(lightK) => set({ lightK })} />
      </div>
    </>
  );
}

function TypeCard({ m, set }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void }) {
  return (
    <>
      <p>The text sets how wide the button is. Try the size, weight and letter spacing. Centring the box makes the text look too low, so we centre the letters instead.</p>
      <div className="xr-dials">
        <Dial label="Size" value={m.size} min={10} max={16} step={0.5} fmt={(v) => `${v} pt`} onChange={(size) => set({ size })} />
        <div className="xr-dial"><span className="xr-dial-head"><span>Weight</span></span><Switcher size="compact" aria-label="Weight" value={String(m.weight)} onValueChange={(v) => set({ weight: Number(v) })} options={[{ value: '400', label: '400' }, { value: '500', label: '500' }, { value: '600', label: '600' }]} /></div>
        <Dial label="Letter-spacing" value={m.track} min={-0.03} max={0.06} step={0.005} fmt={(v) => `${v.toFixed(3)} em`} onChange={(track) => set({ track })} />
        <div className="xr-dial"><span className="xr-dial-head"><span>Centred on</span></span><Switcher size="compact" aria-label="Centred on" value={m.optical ? 'letters' : 'box'} onValueChange={(v) => set({ optical: v === 'letters' })} options={[{ value: 'letters', label: 'The letters' }, { value: 'box', label: 'The box' }]} /></div>
      </div>
    </>
  );
}

function ShadowCard({ m, set, shadows }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; shadows: string[] }) {
  return (
    <>
      <p>There are two shadows. The small dark one is where the button touches the page. The big soft one shows how high it is. Raise the button and watch them change.</p>
      <div className="xr-dials">
        <Dial label="Height above the page" value={m.lift} min={0} max={3} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(lift) => set({ lift })} />
      </div>
      <div className="xr-proof" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
        {shadows.slice(-2).map((v, i) => <span key={v} className="readout-t ink2">{i ? 'drop' : 'contact'} · {v}</span>)}
      </div>
    </>
  );
}

function PressCard({ travel, onPressChange }: { travel: number; onPressChange: (pressed: boolean) => void }) {
  return (
    <>
      <p>When you hold it, the button moves down {travel} pt in {String(P.press)} and its shadow shrinks. When you let go, a spring brings it back (stiffness {SPRING.stiffness}, damping {SPRING.damping}). Press it and watch.</p>
      <div className="xr-proof">
        <span onPointerDown={() => onPressChange(true)} onPointerUp={() => onPressChange(false)} onPointerCancel={() => onPressChange(false)} onPointerLeave={() => onPressChange(false)} onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') onPressChange(true); }} onKeyUp={() => onPressChange(false)}><Button tabIndex={0}>Press me</Button></span>
        <SpringPlot k={SPRING.stiffness} c={SPRING.damping} />
      </div>
    </>
  );
}

function LayersCard({ m, set, focus, setFocus }: { m: ButtonXrayModel; set: (p: Partial<ButtonXrayModel>) => void; focus: number | null; setFocus: (i: number | null) => void }) {
  const toggle = (i: number, v: boolean) => set({ on: m.on.map((x, j) => (j === i ? v : x)) });
  return (
    <>
      <p>The button is six layers stacked on top of each other. Turn one off to see what it adds.</p>
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

const SIDE: Record<Spot, ['left' | 'right', number]> = {
  light: ['left', 0.2], shape: ['left', 0.48], type: ['left', 0.76],
  layers: ['right', 0.2], press: ['right', 0.48], shadow: ['right', 0.76],
};
