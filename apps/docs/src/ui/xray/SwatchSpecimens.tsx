import * as React from 'react';
import { Row, Swatch, Switch, swatchInk } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { LAYERS, NAME, type Look, type SwatchConfig as Model } from './SwatchXray';
import { CornerArc, Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, type Seg } from '../edit';
import './swatch-specimens.css';

type Spot = 'shape' | 'type' | 'light' | 'well' | 'shadow' | 'layers';
type Props = {
  spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void;
  look: Look;
};
const P = tokens.recipes.swatch.props;
const SHINE = tokens.recipes.swatch.layers.find((layer) => layer.part === 'self' && layer.prop === 'background')!.value;
const SHINE_ALPHA = Number(SHINE.match(/rgba\(255,255,255,\.([\d]+)\)/)?.[1]) / 100;
const SHINE_ANGLE = Number(SHINE.match(/linear-gradient\(([\d.]+)deg/)?.[1]);
const DROP = tokens.recipes.swatch.layers.filter((layer) => layer.part === 'self' && layer.prop === 'shadow').at(-1)!.value;
const DROP_BLUR = Number(DROP.match(/-?[\d.]+px/g)?.[1].replace('px', ''));
const round = (value: number) => Math.round(value * 10) / 10;
const catchAt = (value: number, at: number, reach = 0.6) => Math.abs(value - at) <= reach ? at : value;
const token = (value: number, at: number) => value === at ? { at, name: 'recipe token' } : undefined;

/** The specimen is the real Swatch, set to the config the same way the table's and the code's are. */
function Face({ m, look, className }: { m: Model; look: Look; className?: string }) {
  return <Swatch hex={m.hex} label={m.label} className={className} style={look.style} />;
}
function Well({ children, light = false, well, zoom }: { children: React.ReactNode; light?: boolean; well: React.RefObject<HTMLDivElement | null>; zoom: number }) {
  return <div ref={well} className={`ed-specimen${light ? ' is-light' : ''}`}><div style={{ zoom }}>{children}</div></div>;
}

function Shape({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [active, setActive] = React.useState<'Size' | 'Corners' | null>(null);
  const [peek, setPeek] = React.useState<'Size' | 'Corners' | null>(null);
  const edges = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const refs = React.useRef<Partial<Record<'Size' | 'Corners', HTMLSpanElement | null>>>({});
  const setSize = (value: number, caught = true) => set({ size: caught ? catchAt(round(clamp(value, P.self.size / 2, P.self.size * 1.5)), P.self.size) : round(clamp(value, P.self.size / 2, P.self.size * 1.5)) });
  const setCorners = (value: number, caught = true) => set({ radius: caught ? catchAt(round(clamp(value, 0, m.size / 2)), P.self.radius) : round(clamp(value, 0, m.size / 2)) });
  const size = useHandle({ zoom, hint: () => ({ gesture: 'sides', title: 'Size', value: active === 'Size' ? `${m.size}pt` : undefined, how: 'drag up to make the chip larger' }), keyHint: () => ({ gesture: 'sides', title: 'Size', value: `${m.size}pt`, keys: [{ k: '↑↓', say: 'change' }] }), start: () => m.size, move: (start, _dx, dy) => { setActive('Size'); setSize(start - dy / 2); }, end: () => setActive(null), step: (d) => setSize(m.size + d), axis: 'y', over: (yes) => setPeek(yes ? 'Size' : null), grab: () => blip(edges.current.top) });
  const corners = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Corners', value: active === 'Corners' ? `${m.radius}pt` : undefined, how: 'drag out to round the corner' }), keyHint: () => ({ gesture: 'corner', title: 'Corners', value: `${m.radius}pt`, keys: [{ k: '←→', say: 'change' }] }), start: () => m.radius, move: (start, dx, dy) => { setActive('Corners'); setCorners(start + (dx + dy) / 2); }, end: () => setActive(null), step: (d) => setCorners(m.radius + d), axis: 'both', over: (yes) => setPeek(yes ? 'Corners' : null), grab: () => blip(edges.current.corner) });
  useOnLand(active === 'Size' && m.size === P.self.size ? 'size' : undefined, () => blip(edges.current.top));
  useOnLand(active === 'Corners' && m.radius === P.self.radius ? 'corners' : undefined, () => blip(edges.current.corner));
  const shown: Seg[] = active === 'Size' || peek === 'Size' ? ['top'] : active === 'Corners' || peek === 'Corners' ? ['corner'] : ['top', 'corner'];
  return <><p>The chip has a square body and rounded corners; drag its top edge to change its size or its corner to round it.</p><Well well={well} zoom={zoom}><ShapeFace m={m} look={look} edges={edges} refs={refs} shown={shown} active={active} peek={peek} size={size} corners={corners} /></Well><div className="ed-readouts"><Readout label="Size" value={`${m.size}`} snap={token(m.size, P.self.size)} peek={(yes) => setPeek(yes ? 'Size' : null)} pick={() => summon(refs.current.Size ?? null)} scrub={(d) => setSize(m.size + d, false)} /><Readout label="Corners" value={`${m.radius}`} snap={token(m.radius, P.self.radius)} peek={(yes) => setPeek(yes ? 'Corners' : null)} pick={() => summon(refs.current.Corners ?? null)} scrub={(d) => setCorners(m.radius + d, false)} /></div></>;
}
function ShapeFace({ m, look, edges, refs, shown, active, peek, size, corners }: { m: Model; look: Look; edges: React.MutableRefObject<Partial<Record<Seg, SVGPathElement | null>>>; refs: React.MutableRefObject<Partial<Record<'Size' | 'Corners', HTMLSpanElement | null>>>; shown: Seg[]; active: string | null; peek: string | null; size: ReturnType<typeof useHandle>; corners: ReturnType<typeof useHandle> }) {
  return <div className="ed-box ed-swatch-box" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')}><Face m={m} look={look} /><div className="ed-overlay"><Outline W={m.size} h={m.size} r={m.radius} on={active === 'Size' || peek === 'Size' ? ['top'] : []} only={shown} segs={edges} /><span ref={(el) => { refs.current.Size = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Size" aria-valuenow={m.size} aria-valuemin={P.self.size / 2} aria-valuemax={P.self.size * 1.5} {...size} /><span ref={(el) => { refs.current.Corners = el; }} className="ed-corner" style={{ width: Math.max(m.radius, 6) + 3, height: Math.max(m.radius, 6) + 3 }} role="slider" tabIndex={0} aria-label="Corners" aria-valuenow={m.radius} aria-valuemin={0} aria-valuemax={m.size / 2} {...corners}><CornerArc r={m.radius} on={active === 'Corners' || peek === 'Corners'} arcRef={(el) => { edges.current.corner = el; }} /></span></div></div>;
}

// The public colour prop accepts any hex. A horizontal drag turns its hue while keeping its saturation and lightness.
function hueOf(hex: string) {
  const parts = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(...parts), min = Math.min(...parts), delta = max - min;
  let hue = 0;
  if (delta) hue = max === parts[0] ? ((parts[1] - parts[2]) / delta) % 6 : max === parts[1] ? (parts[2] - parts[0]) / delta + 2 : (parts[0] - parts[1]) / delta + 4;
  const light = (max + min) / 2;
  return { hue: (hue * 60 + 360) % 360, saturation: delta ? delta / (1 - Math.abs(2 * light - 1)) : 0, light };
}
function withHue(hex: string, hue: number) {
  const { saturation, light } = hueOf(hex);
  const a = saturation * Math.min(light, 1 - light);
  const component = (n: number) => { const k = (n + hue / 30) % 12; return Math.round(255 * (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return `#${[component(0), component(8), component(4)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
function Type({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false); const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const hue = hueOf(m.hex).hue;
  const change = (next: number) => set({ hex: withHue(m.hex, (next + 360) % 360) });
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'sides', title: 'Colour', value: live ? m.hex : undefined, how: 'drag sideways to turn the colour' }), keyHint: () => ({ gesture: 'sides', title: 'Colour', value: m.hex, keys: [{ k: '←→', say: 'turn' }] }), start: () => hue, move: (start, dx) => { setLive(true); change(start + dx * 2); }, end: () => setLive(false), step: (d) => change(hue + d * 5), axis: 'x', over: setPeek });
  return <><p>The chip has its name engraved in a corner and the ink follows the colour; drag the open face sideways to turn the colour.</p><Well well={well} zoom={zoom}><div className="ed-swatch-color" data-hint-anchor style={{ ['--swatch-zoom' as string]: zoom }} data-peek={peek || live ? '' : undefined}><Face m={m} look={look} /><span ref={ref} className="ed-swatch-color-handle" role="slider" tabIndex={0} aria-label="Colour" aria-valuetext={m.hex} aria-valuenow={Math.round(hue)} aria-valuemin={0} aria-valuemax={360} {...handle} /></div></Well><div className="ed-readouts"><Readout label="Colour" value={m.hex} unit="" peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => change(hue + d * 5)} /><Readout label="Ink" value={swatchInk(m.hex)} unit="" /></div><div className="ed-layers"><Row.Root variant="list" className="ed-layer" onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ label: m.label === undefined ? NAME : undefined }); }}><Row.Text>Engrave the colour code</Row.Text><Row.Trail><Switch size="small" aria-label="Engrave the colour code" checked={m.label === undefined} onCheckedChange={(on) => set({ label: on ? undefined : NAME })} /></Row.Trail></Row.Root></div></>;
}

function Light({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false); const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const orbit = P.self.size * 0.55;
  const reach = (strength: number) => orbit * (1.35 - strength * 0.35);
  const point = (deg: number, strength: number) => ({ x: Math.sin(deg * Math.PI / 180) * reach(strength), y: -Math.cos(deg * Math.PI / 180) * reach(strength) });
  const sun = point(m.lightDeg, m.sheen);
  const update = (x: number, y: number) => { const deg = clamp(Math.round(Math.atan2(x, -y) * 180 / Math.PI / 5) * 5, -90, 90); const raw = clamp(round((1.35 - Math.hypot(x, y) / orbit) / 0.35), 0, 2); const strength = catchAt(raw, 1, 0.1); set({ lightDeg: deg, sheen: strength, lightK: strength }); };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${SHINE_ANGLE + m.lightDeg}° · ${Math.round(SHINE_ALPHA * m.sheen * 100)}%` : undefined, how: 'drag around the chip, closer for brighter shine' }), keyHint: () => ({ gesture: 'corner', title: 'Light', value: `${SHINE_ANGLE + m.lightDeg}° · ${Math.round(SHINE_ALPHA * m.sheen * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'strength' }] }), start: () => sun, move: (start, dx, dy) => { setLive(true); update(start.x + dx, start.y + dy); }, end: () => setLive(false), step: (d, e) => e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ sheen: clamp(round(m.sheen + d * 0.1), 0, 2), lightK: clamp(round(m.sheen + d * 0.1), 0, 2) }) : set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) }), axis: 'both', over: setPeek });
  useOnLand(live && m.sheen === 1 ? 'shine' : undefined, () => blip(ref.current));
  return <><p>A pale shine crosses the chip; drag the sun around it to turn the light or closer to brighten it.</p><Well light well={well} zoom={zoom}><div className="ed-lightbox ed-swatch-light" data-hint-anchor data-lit={live || peek ? '' : undefined}><Face m={m} look={look} /><svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden><path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} /><path className="is-near" d={`M${-reach(1)} 0A${reach(1)} ${reach(1)} 0 0 1 ${reach(1)} 0`} /></svg><span ref={ref} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light" aria-valuetext={`${SHINE_ANGLE + m.lightDeg} degrees, ${Math.round(SHINE_ALPHA * m.sheen * 100)} percent`} aria-valuenow={SHINE_ANGLE + m.lightDeg} aria-valuemin={SHINE_ANGLE - 90} aria-valuemax={SHINE_ANGLE + 90} {...handle} /></div></Well><div className="ed-readouts"><Readout label="Direction" value={`${SHINE_ANGLE + m.lightDeg}`} unit="°" snap={token(m.lightDeg, 0)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })} /><Readout label="Shine" value={`${Math.round(SHINE_ALPHA * m.sheen * 100)}`} unit="%" snap={token(m.sheen, 1)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => set({ sheen: clamp(round(m.sheen + d * 0.1), 0, 2), lightK: clamp(round(m.sheen + d * 0.1), 0, 2) })} /></div></>;
}

function Dimple({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false); const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const size = P.led.size * m.dimple;
  const change = (value: number, caught = true) => { const v = round(clamp(value, 0, P.led.size * 2)); set({ dimple: (caught ? catchAt(v, P.led.size) : v) / P.led.size }); };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'sides', title: 'Dimple', value: live ? `${round(size)}pt` : undefined, how: 'drag right to widen the dimple' }), keyHint: () => ({ gesture: 'sides', title: 'Dimple', value: `${round(size)}pt`, keys: [{ k: '←→', say: 'change' }] }), start: () => size, move: (start, dx) => { setLive(true); change(start + dx / 2); }, end: () => setLive(false), step: (d) => change(size + d * 0.5), axis: 'x', over: setPeek });
  useOnLand(live && size === P.led.size ? 'dimple' : undefined, () => blip(ref.current));
  return <><p>The small hole sits near the top right corner; drag its rim sideways to change its width.</p><Well well={well} zoom={zoom}><div className="ed-swatch-dimple" data-hint-anchor style={{ ['--swatch-zoom' as string]: zoom }} data-peek={peek || live ? '' : undefined}><Face m={m} look={look} /><span ref={ref} className="ed-swatch-dimple-handle" style={{ width: Math.max(size, P.led.size), height: Math.max(size, P.led.size), right: P.led.inset - (Math.max(size, P.led.size) - size) / 2, top: P.led.inset - (Math.max(size, P.led.size) - size) / 2 }} role="slider" tabIndex={0} aria-label="Dimple" aria-valuenow={round(size)} aria-valuemin={0} aria-valuemax={P.led.size * 2} {...handle} /></div></Well><div className="ed-readouts"><Readout label="Dimple" value={`${round(size)}`} snap={token(size, P.led.size)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => change(size + d * 0.5, false)} /></div></>;
}

function Shadow({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false); const [peek, setPeek] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const blur = round(DROP_BLUR * m.lift);
  const change = (value: number, caught = true) => { const v = round(clamp(value, 0, DROP_BLUR * 3)); set({ lift: (caught ? catchAt(v, DROP_BLUR) : v) / DROP_BLUR }); };
  const handle = useHandle({ zoom, hint: () => ({ gesture: 'press', title: 'Shadow blur', value: live ? `${blur}pt` : undefined, how: 'drag up to soften the shadow' }), keyHint: () => ({ gesture: 'press', title: 'Shadow blur', value: `${blur}pt`, keys: [{ k: '↑↓', say: 'change' }] }), start: () => blur, move: (start, _dx, dy) => { setLive(true); change(start - dy / 2); }, end: () => setLive(false), step: (d) => change(blur + d), axis: 'y', over: setPeek });
  useOnLand(live && blur === DROP_BLUR ? 'blur' : undefined, () => blip(ref.current));
  return <><p>The chip casts a shadow in its own colour; drag it up to spread the shadow farther.</p><Well well={well} zoom={zoom}><span ref={ref} className="ed-lift ed-swatch-lift" data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined} style={{ translate: `0 ${-(m.lift - 1) * 3}px` }} role="slider" tabIndex={0} aria-label="Shadow blur" aria-valuenow={blur} aria-valuemin={0} aria-valuemax={DROP_BLUR * 3} {...handle}><Face m={m} look={look} /></span></Well><div className="ed-readouts"><Readout label="Shadow blur" value={`${blur}`} snap={token(blur, DROP_BLUR)} peek={setPeek} pick={() => summon(ref.current)} scrub={(d) => change(blur + d, false)} /></div></>;
}
function Layers({ m, set, focus, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const toggle = (index: number, value: boolean) => set({ on: m.on.map((old, i) => i === index ? value : old) });
  return <><p>The chip has a stack of visible layers; turn one off to see what it adds.</p><Well well={well} zoom={zoom}><Face m={m} look={look} /></Well><div className="ed-layers">{LAYERS.map((layer, i) => <Row.Root key={layer.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''} onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}><Row.Text>{layer.name}</Row.Text><Row.Trail><Switch size="small" aria-label={layer.name} checked={m.on[i]} onCheckedChange={(value) => toggle(i, value)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail></Row.Root>)}</div></>;
}
export function SwatchSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'shape': return <Shape {...props} />;
    case 'type': return <Type {...props} />;
    case 'light': return <Light {...props} />;
    case 'well': return <Dimple {...props} />;
    case 'shadow': return <Shadow {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
