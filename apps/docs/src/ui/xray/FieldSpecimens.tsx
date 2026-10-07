import * as React from 'react';
import { Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { FieldFace, KEY, TRAY, type Look, type Model, type Spot } from './FieldXray';
import { CornerArc, Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg } from '../edit';
import './field-specimens.css';

/* ─────────────────────────────────────────────────────────
 * FIELD SPECIMENS · the x-ray's card is a real field you handle
 *
 *   The field has one size and no kinds, so nothing here steps. What is tunable moves
 *   freely and catches on the field recipe: depth (the bottom edge), height (the top
 *   edge), corners (the corner arc) and the space on the left (the glyph itself).
 *   The caret, the raised key and the layers are switches.
 * ───────────────────────────────────────────────────────── */

// read the field's tokens here, not through FieldXray: FieldXray imports this file, so its
// constants do not exist yet while this module loads (a circular import)
const F = tokens.recipes.field.props.field as { height: number; radius: number; 'pad-left': number; 'pad-right': number; gap: number; glyph: number };
/** The recipe's depth: the tray's inner shadow at its own strength. */
const DEPTH = 1;
const LIMITS = { h: [28, 60], padL: [6, 28], depth: [0, 3] } as const;

type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void; look: Look };
type Name = 'depth' | 'height' | 'corners' | 'padL';
const NAMES: Record<Name, string> = { depth: 'Well depth', height: 'Height', corners: 'Corners', padL: 'Space on the left' };

const round = (v: number, places = 1) => Number(v.toFixed(places));
const token = (v: number, at: number) => (v === at ? { at, name: 'token' } : undefined);
/** A tuned value catches on its token when it comes within reach. A key or readout step passes `false`:
 *  a step is never caught, or one step off a token would land back on it. */
const catchOn = (v: number, at: number, reach: number, caught: boolean) => (caught && Math.abs(v - at) <= reach ? at : v);

/** The real field, set to the model's config the way its code sets it: through the library's variables on a wrapper. */
function RealField({ m, set, look, width }: { m: Model; set: Props['set']; look: Look; width: number }) {
  return <FieldFace m={m} look={look} width={width} onValue={(value) => set({ value })} still />;
}

/** How wide the field can be in its well at this zoom (it is a wide part; a narrow card shortens it). */
function useFieldWidth(well: React.RefObject<HTMLDivElement | null>, zoom: number) {
  const [w, setW] = React.useState(240);
  React.useLayoutEffect(() => {
    const el = well.current; if (!el) return;
    const read = () => setW(Math.round(clamp((el.clientWidth - 24) / zoom, 150, 240)));
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [well, zoom]);
  return w;
}

/* ───────────────────────── Well and Shape: handles on the field's own edges ───────────────────────── */

function Edges({ spot, m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const width = useFieldWidth(well, zoom);
  const els = React.useRef<Partial<Record<Name, HTMLSpanElement | null>>>({});
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const [active, setActive] = React.useState<Name | null>(null);
  const [peek, setPeek] = React.useState<Name | null>(null);

  const depth = (v: number, caught = true) => set({ depth: catchOn(round(clamp(v, ...LIMITS.depth)), DEPTH, 0.15, caught) });
  const height = (v: number, caught = true) => { const h = catchOn(Math.round(clamp(v, ...LIMITS.h)), F.height, 1, caught); set({ h, radius: Math.min(m.radius, h / 2) }); };
  const corners = (v: number, caught = true) => set({ radius: catchOn(Math.round(clamp(v, 0, m.h / 2) * 2) / 2, F.radius, 0.75, caught) });
  const padL = (v: number, caught = true) => set({ padL: catchOn(Math.round(clamp(v, ...LIMITS.padL)), F['pad-left'], 1, caught) });

  const show = (n: Name) => active === n || peek === n;
  const hint = (n: Name, value: string, how: string, gesture: Hint['gesture'], keys: string): Hint => ({ gesture, title: NAMES[n], value: active === n ? value : undefined, how, keys: [{ k: keys, say: 'change' }, { k: '⇧', say: 'faster' }] });
  const keyHint = (n: Name, value: string, gesture: Hint['gesture'], keys: string): Hint => ({ gesture, title: NAMES[n], value, keys: [{ k: keys, say: 'change' }, { k: '⇧', say: 'faster' }] });
  const grabs: Record<Name, () => Element | null | undefined> = { depth: () => segs.current.bottom, height: () => segs.current.top, corners: () => segs.current.corner, padL: () => els.current.padL };
  const named = <S,>(n: Name, opts: Omit<Parameters<typeof useHandle<S>>[0], 'zoom' | 'over' | 'grab'>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const events = useHandle<S>({ ...opts, zoom, over: (on) => setPeek(on ? n : null), grab: () => blip(grabs[n]()), end: () => setActive(null) });
    return { ...events, ref: (el: HTMLSpanElement | null) => { els.current[n] = el; } };
  };

  const depthHandle = named('depth', {
    hint: () => hint('depth', m.depth.toFixed(1), 'drag down to make it deeper', 'press', '↑↓'), keyHint: () => keyHint('depth', m.depth.toFixed(1), 'press', '↑↓'),
    start: () => m.depth, move: (s, _dx, dy) => { setActive('depth'); depth(s + dy / 8); }, step: (d) => depth(m.depth - d * 0.1, false), axis: 'y',
  });
  const heightHandle = named('height', {
    hint: () => hint('height', `${m.h}pt`, 'drag up to make it taller', 'press', '↑↓'), keyHint: () => keyHint('height', `${m.h}pt`, 'press', '↑↓'),
    // the field grows both ways from its centre, so the edge moves half as far as the height
    start: () => m.h, move: (s, _dx, dy) => { setActive('height'); height(s - dy * 2); }, step: (d) => height(m.h + d, false), axis: 'y',
  });
  const cornerHandle = named('corners', {
    hint: () => hint('corners', `${m.radius}pt`, 'drag in to round the corner', 'corner', '←→'), keyHint: () => keyHint('corners', `${m.radius}pt`, 'corner', '←→'),
    start: () => m.radius, move: (s, dx, dy) => { setActive('corners'); corners(s + (dx + dy) / 2); }, step: (d) => corners(m.radius + d * 0.5, false), axis: 'both',
  });
  const padHandle = named('padL', {
    hint: () => hint('padL', `${m.padL}pt`, 'drag the glyph sideways', 'sides', '←→'), keyHint: () => keyHint('padL', `${m.padL}pt`, 'sides', '←→'),
    start: () => m.padL, move: (s, dx) => { setActive('padL'); padL(s + dx); }, step: (d) => padL(m.padL + d, false), axis: 'x',
  });

  useOnLand(active === 'depth' && m.depth === DEPTH ? 'depth' : undefined, () => blip(segs.current.bottom));
  useOnLand(active === 'height' && m.h === F.height ? 'height' : undefined, () => blip(segs.current.top));
  useOnLand(active === 'corners' && m.radius === F.radius ? 'corners' : undefined, () => blip(segs.current.corner));
  useOnLand(active === 'padL' && m.padL === F['pad-left'] ? 'padL' : undefined, () => blip(els.current.padL));

  // only what is pointed at: one handle while it is held or its readout is, else the card's main ones, faint
  const pointed = (['depth', 'height', 'corners', 'padL'] as Name[]).find(show);
  const segOf: Record<Name, Seg> = { depth: 'bottom', height: 'top', corners: 'corner', padL: 'left' };
  const shown: Seg[] = pointed ? [segOf[pointed]] : spot === 'well' ? ['bottom'] : ['top', 'corner', 'left'];
  const glyphTop = (m.h - F.glyph) / 2;
  const read = (n: Name, value: number, snap: ReturnType<typeof token>, scrub: (d: 1 | -1) => void, unit = 'pt') => (
    <Readout label={NAMES[n]} value={n === 'depth' ? value.toFixed(1) : `${value}`} unit={unit} snap={snap} peek={(on) => setPeek(on ? n : null)} pick={() => summon(els.current[n] ?? null)} scrub={scrub} />
  );

  return (
    <>
      <p>{spot === 'well'
        ? 'A field is a shallow tray, so you know you can type in it before you read anything. Drag its bottom edge down to make it deeper.'
        : `The field is ${F.height} pt tall with ${F.radius} pt corners, round but not a pill, and the glyph starts ${F['pad-left']} pt in. Drag the top edge to change its height, the corner to round it, or the glyph to move it in.`}</p>
      <div ref={well} className="ed-specimen">
        <div style={{ zoom }}>
          <div className="ed-box ed-field-box" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')}>
            <RealField m={m} set={set} look={look} width={width} />
            <div className="ed-overlay">
              <Outline W={width} h={m.h} r={m.radius} on={pointed ? [segOf[pointed]] : []} only={shown.filter((x) => x !== 'left')} segs={segs} />
              {spot === 'well' && (
                <span className="ed-edge is-y ed-field-bottom" role="slider" tabIndex={0} aria-label={NAMES.depth} aria-valuetext={m.depth.toFixed(1)} aria-valuenow={m.depth} aria-valuemin={LIMITS.depth[0]} aria-valuemax={LIMITS.depth[1]} {...depthHandle} />
              )}
              {spot === 'shape' && <>
                <span className="ed-edge is-y ed-field-top" role="slider" tabIndex={0} aria-label={NAMES.height} aria-valuenow={m.h} aria-valuemin={LIMITS.h[0]} aria-valuemax={LIMITS.h[1]} {...heightHandle} />
                <span className="ed-corner" style={{ width: Math.max(m.radius, 6) + 3, height: Math.max(m.radius, 6) + 3 }} role="slider" tabIndex={0} aria-label={NAMES.corners} aria-valuenow={m.radius} aria-valuemin={0} aria-valuemax={m.h / 2} {...cornerHandle}>
                  <CornerArc r={m.radius} on={show('corners')} arcRef={(el) => { segs.current.corner = el; }} />
                </span>
                {/* the space on the left lives between the edge and the glyph: a hairline across it, and the glyph is the handle */}
                <i className="ed-field-gap" data-on={show('padL') ? '' : undefined} style={{ top: m.h / 2, width: m.padL }} aria-hidden />
                <span className="ed-field-glyph" data-on={show('padL') ? '' : undefined} style={{ left: m.padL - 3, top: glyphTop - 3, width: F.glyph + 6, height: F.glyph + 6 }} role="slider" tabIndex={0} aria-label={NAMES.padL} aria-valuenow={m.padL} aria-valuemin={LIMITS.padL[0]} aria-valuemax={LIMITS.padL[1]} {...padHandle} />
              </>}
            </div>
          </div>
        </div>
      </div>
      <div className="ed-readouts">
        {spot === 'well' && read('depth', m.depth, token(m.depth, DEPTH), (d) => depth(m.depth + d * 0.1, false), '')}
        {spot === 'shape' && <>
          {read('height', m.h, token(m.h, F.height), (d) => height(m.h + d, false))}
          {read('corners', m.radius, token(m.radius, F.radius), (d) => corners(m.radius + d * 0.5, false))}
          {read('padL', m.padL, token(m.padL, F['pad-left']), (d) => padL(m.padL + d, false))}
        </>}
      </div>
    </>
  );
}

/* ───────────────────────── Light: the sun on its arc ───────────────────────── */

function Light({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const width = useFieldWidth(well, zoom);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const sunEl = React.useRef<HTMLSpanElement>(null);
  const radius = 42;
  const reach = (k: number) => radius * (1.35 - k * 0.35);
  const at = (deg: number, k: number) => ({ x: Math.sin(deg * Math.PI / 180) * reach(k), y: -Math.cos(deg * Math.PI / 180) * reach(k) });
  const sun = at(m.lightDeg, m.lightK);
  const aimAt = (x: number, y: number) => {
    const deg = clamp(Math.round(Math.atan2(x, -y) * 180 / Math.PI / 5) * 5, -90, 90);
    const k = clamp(Math.round((1.35 - Math.hypot(x, y) / radius) / 0.35 * 20) / 20, 0, 1.5);
    set({ lightDeg: Math.abs(deg) < 5 ? 0 : deg, lightK: Math.abs(k - 1) < 0.08 ? 1 : k });
  };
  const strength = (d: number) => set({ lightK: clamp(round(m.lightK + d * 0.05, 2), 0, 1.5) });
  const turn = (d: number) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) });
  const handle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag the sun around, closer for stronger light' }),
    keyHint: () => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'strength' }] }),
    start: () => sun, move: (s, dx, dy) => { setLive(true); aimAt(s.x + dx, s.y + dy); }, end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? strength(d) : turn(d)), axis: 'both', over: setPeek,
  });
  useOnLand(live && m.lightDeg === 0 && m.lightK === 1 ? 'home' : undefined, () => blip(sunEl.current));
  return (
    <>
      <p>One light falls on both parts. The tray is dark at the top and bright at the bottom, and the key the other way round. Drag the sun to move the light, or closer to make it stronger.</p>
      <div ref={well} className="ed-specimen is-light">
        <div className="ed-lightbox" data-hint-anchor data-lit={live || peek ? '' : undefined} style={{ zoom }}>
          <RealField m={m} set={set} look={look} width={width} />
          <svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden>
            <path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} />
            <path className="is-near" d={`M${-reach(1.5)} 0A${reach(1.5)} ${reach(1.5)} 0 0 1 ${reach(1.5)} 0`} />
          </svg>
          <span ref={sunEl} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...handle} />
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="Light direction" value={m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}`} unit={m.lightDeg === 0 ? '' : m.lightDeg < 0 ? '° left' : '° right'} snap={token(m.lightDeg, 0)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={turn} />
        <Readout label="Light strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={token(m.lightK, 1)} peek={setPeek} pick={() => summon(sunEl.current)} scrub={strength} />
      </div>
    </>
  );
}

/* ───────────────────────── Type, Key and Layers: the real field and switches ───────────────────────── */

function Plain({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const width = useFieldWidth(well, zoom);
  return <div ref={well} className="ed-specimen"><div style={{ zoom }}><RealField m={m} set={set} look={look} width={width} /></div></div>;
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="ed-layers">
      <Row.Root variant="list" className="ed-layer" data-off={on ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set(!on); }}>
        <Row.Text>{label}</Row.Text>
        <Row.Trail><Switch size="small" aria-label={label} checked={on} onCheckedChange={set} /></Row.Trail>
      </Row.Root>
    </div>
  );
}

function Layers(props: Props) {
  const { m, set, focus } = props;
  const toggle = (group: 'tray' | 'key', i: number, on: boolean) => set({ [group]: m[group].map((v, j) => (j === i ? on : v)) });
  return (
    <>
      <p>{m.showKey ? 'Two parts: the tray has four layers and the key has six. Turn one off to see what it adds.' : 'The tray has four layers. The key is switched off, so its six layers are not drawn. Turn one off to see what it adds.'}</p>
      <Plain {...props} />
      <div className="ed-layers">
        {([['tray', TRAY], ['key', KEY]] as const).filter(([group]) => group === 'tray' || m.showKey).flatMap(([group, list]) => list.map((layer, i) => (
          <Row.Root key={layer.name} variant="list" className="ed-layer" data-off={m[group][i] ? undefined : ''}
            onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(group, i, !m[group][i]); }}>
            <Row.Text>{layer.name}</Row.Text>
            <Row.Trail><Switch size="small" aria-label={layer.name} checked={m[group][i]} onCheckedChange={(on) => toggle(group, i, on)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail>
          </Row.Root>
        )))}
      </div>
    </>
  );
}

export function FieldSpecimenCard(props: Props) {
  const { spot, m, set } = props;
  switch (spot) {
    case 'well':
    case 'shape': return <Edges {...props} />;
    case 'light': return <Light {...props} />;
    case 'layers': return <Layers {...props} />;
    case 'type': return <>
      <p>Before you type, the field shows a hint in soft grey. What you type is dark, and the caret is green, like everything that says "you are here". Type in the field and watch the model.</p>
      <Plain {...props} />
      <Toggle label="Caret" on={m.caret} set={(caret) => set({ caret })} />
    </>;
    case 'surface': return <>
      <p>The ⌘K key stands up inside the field, so the tray goes down and the key comes up. Switch the key off and the field has no key at its end.</p>
      <Plain {...props} />
      <Toggle label="Key" on={m.showKey} set={(showKey) => set({ showKey })} />
    </>;
  }
}
