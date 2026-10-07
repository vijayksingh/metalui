import * as React from 'react';
import { Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { ConfiguredButton, INITIAL, LAYERS, SIZES, autoPad, sizeOf, type Look, type Model, type SizeName } from './ButtonXray';
import {
  STEP_AT, snapTo, clamp, useStepMotion, useHandle, Readout, summon, blip, useOnLand, Outline, CornerArc, useSpecimenZoom,
  type Hint, type Seg, type Snap,
} from '../edit';
import './button-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE BUTTON'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the real button, set to the config, to handle; the model on the bench
 *   and the object on the table read the same config. Each part offers its own handles:
 *     shape    top edge steps the size, right end the padding, top-left corner the corners
 *     type     drag the words: sideways spacing, up or down size; weight steps
 *     light    a sun on an arc above the button: around turns it, nearer strengthens it
 *     shadow   lift the button up or set it down
 *     press    press it and pull down for how far it sinks
 *     layers   a row with a switch per layer
 *   Only the standard cap has two sizes, so no other cap gets a size handle.
 * ───────────────────────────────────────────────────────── */

// ButtonXray imports this file back, so its constants are read only inside the components
const TRAVEL = Number((tokens.recipes.button.props as Record<string, Record<string, unknown>>).self.travel);
type Props = { spot: string; m: Model; set: (p: Partial<Model>) => void; look: Look; setPressed: (on: boolean) => void; setFocusLayer: (i: number | null) => void };
type Part = { m: Model; set: (p: Partial<Model>) => void; look: Look };
const other = (s: SizeName): SizeName => (s === 'compact' ? 'default' : 'compact');

/** Shape, on the specimen: the top line steps the size, the right end sets padding, the arc the corners. */
export function ShapeSpecimen({ m, set, look }: Part) {
  // only the standard cap has two sizes; any other cap has one, so its size is not a handle
  const steps = m.cap === 'standard';
  const [well, zoom] = useSpecimenZoom();
  const size = sizeOf(m);
  // the height is the config's own; if something else (the page's workbench) tuned it off a real
  // size, the specimen shows that truthfully, with its LED off; stepping lands on real sizes only
  const h = m.h;
  const onSize = h === SIZES[size].h;
  const auto = autoPad(m);
  const pad = look.pad, radius = look.radius;
  const [live, setLive] = React.useState<null | 'size' | 'pad' | 'corners'>(null);
  const [lean, setLean] = React.useState(0);
  const [over, setOver] = React.useState<Seg | null>(null);
  const [peek, setPeek] = React.useState<Seg[]>([]);
  const motion = useStepMotion();
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const handles = React.useRef<Partial<Record<'pad' | 'size' | 'corner', HTMLSpanElement | null>>>({});
  const box = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const read = () => setW(el.offsetWidth); read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const padSnaps: Snap[] = [{ at: SIZES.compact.pad, name: 'compact' }, { at: SIZES.default.pad, name: 'default' }, { at: auto, name: 'half the height − 1' }];
  const [, padSnap] = snapTo(pad, padSnaps, 0);
  const radSnap: Snap | undefined = m.corners >= 1 ? { at: h / 2, name: 'pill' } : radius === 0 ? { at: 0, name: 'square' } : undefined;
  // a real size brings its own type with it
  const stepTo = (next: SizeName) => set({ h: SIZES[next].h, ...SIZES[next].type });
  const setPad = (v: number) => { const [p] = snapTo(clamp(v, 4, 24), padSnaps); set(p === auto ? { padAuto: true } : { padAuto: false, pad: p }); };
  const setRad = (v: number) => { const r = clamp(v, 0, h / 2); set({ corners: r >= h / 2 - 0.6 ? 1 : Math.round(r) / (h / 2) }); };
  const hover = (seg: Seg) => (on: boolean) => setOver((o) => (on ? seg : o === seg ? null : o));
  useOnLand(size, () => blip(segs.current.top, segs.current.bottom));
  useOnLand(live === 'pad' ? padSnap?.name : undefined, () => blip(segs.current.left, segs.current.right));
  useOnLand(live === 'corners' ? radSnap?.name : undefined, () => blip(segs.current.corner));

  const sizeEdge = useHandle({
    zoom,
    hint: () => ({ gesture: 'steps', title: 'Size', value: live === 'size' ? (lean > 0.3 ? `→ ${other(size)}` : size) : undefined, how: size === 'default' ? 'drag in for compact' : 'drag out for default' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Size', value: size, keys: [{ k: '↑↓', say: 'step' }] }),
    start: () => { motion.held(); return { size, y: 0 }; },
    move: (st, _dx, dy) => {
      setLive('size');
      const grow = -dy * 2 - st.y, toward = st.size === 'default' ? -1 : 1;
      if (grow * toward > STEP_AT) { st.y += grow; motion.stepped(); stepTo(other(st.size)); st.size = other(st.size); setLean(0); }
      else setLean(clamp((grow * toward) / STEP_AT, 0, 1));
    },
    end: () => { motion.let(); setLive(null); setLean(0); }, axis: 'y',
    step: (d) => { if ((d < 0 && size === 'default') || (d > 0 && size === 'compact')) { motion.stepped(); stepTo(other(size)); } },
    over: hover('top'), grab: () => blip(segs.current.top),
  });
  const padEdge = useHandle({
    zoom,
    hint: () => ({ gesture: 'sides', title: 'Padding', value: live === 'pad' ? `${pad}pt` : undefined, how: 'drag to change the padding on both sides' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Padding', value: `${pad}pt`, keys: [{ k: '←→', say: 'wider' }, { k: '⇧', say: '×4' }] }),
    start: () => pad, move: (p0, dx) => { setLive('pad'); setPad(p0 + dx); }, end: () => setLive(null),
    step: (d) => setPad(pad + d),
    over: hover('right'), grab: () => blip(segs.current.right),
  });
  const cornerHandle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Corners', value: live === 'corners' ? `${Math.round(radius)}pt` : undefined, how: 'drag in to round, out to square' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Corners', value: `${Math.round(radius)}pt`, keys: [{ k: '←→', say: 'rounder' }] }),
    start: () => radius, move: (r0, dx, dy) => { setLive('corners'); setRad(r0 + (dx + dy) / 1.2); }, end: () => setLive(null),
    step: (d) => setRad(radius + d), axis: 'both',
    over: hover('corner'), grab: () => blip(segs.current.corner),
  });
  const holding: Seg[] = live === 'pad' ? ['left', 'right'] : live === 'size' ? ['top', 'bottom'] : live === 'corners' ? ['corner'] : [];
  const shown: Seg[] = over ? [over] : holding.length ? holding : peek.length ? peek : steps ? ['top', 'right', 'corner'] : ['right', 'corner'];
  const peekAt = (on: Seg[]) => (show: boolean) => { setPeek(show ? on : []); if (show) requestAnimationFrame(() => blip(...on.map((k) => segs.current[k]))); };

  return (
    <>
      <p>{steps
        ? 'The size, the padding beside the label, and how round the corners are. Drag the top edge to change the size, the right end to change the padding, or the top-left corner to change the corners.'
        : 'The padding beside the label and how round the corners are; this button comes in one size. Drag the right end to change the padding, or the top-left corner to change the corners.'}</p>
      <div ref={well} className="ed-specimen">
        <div style={{ zoom }}>
          <div ref={box} className="ed-box" data-live={live ?? undefined} data-shown={shown.join(' ')} style={{ ['--lean' as string]: lean }} data-hint-anchor>
            {/* a step rides the part spring; a tunable being dragged has no transition */}
            <ConfiguredButton m={m} look={look} style={{ transition: live && live !== 'size' ? 'none' : motion.transition }} />
            <div className="ed-overlay">
              <i className="ed-content" style={{ left: pad, right: pad }} />
              <Outline W={W} h={h} r={radius} on={[...(over ? [over] : []), ...holding, ...peek]} only={shown} segs={segs} />
              {steps && <span ref={(el) => { handles.current.size = el; }} className="ed-edge is-y" style={{ top: -3 }} role="slider" tabIndex={0} aria-label="Size" aria-valuetext={size} aria-valuenow={h} aria-valuemin={SIZES.compact.h} aria-valuemax={SIZES.default.h} {...sizeEdge} />}
              <span ref={(el) => { handles.current.pad = el; }} className="ed-edge is-x" style={{ right: -3 }} role="slider" tabIndex={0} aria-label="Padding" aria-valuenow={pad} aria-valuemin={4} aria-valuemax={24} {...padEdge} />
              <span ref={(el) => { handles.current.corner = el; }} className="ed-corner" style={{ width: Math.max(radius, 6) + 3, height: Math.max(radius, 6) + 3 }} role="slider" tabIndex={0} aria-label="Corner roundness" aria-valuenow={Math.round(radius)} aria-valuemin={0} aria-valuemax={h / 2} {...cornerHandle}>
                <CornerArc r={radius} on={shown.includes('corner') && (over === 'corner' || live === 'corners' || peek.includes('corner'))} arcRef={(el) => { segs.current.corner = el; }} />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="ed-readouts">
        {steps
          ? <Readout label="size" value={`${h}`} snap={onSize ? { at: h, name: size } : undefined} peek={peekAt(['top'])} pick={() => summon(handles.current.size ?? null)} scrub={(d) => { const next: SizeName = d > 0 ? 'default' : 'compact'; if (next !== size) { motion.stepped(); stepTo(next); } }} />
          : <Readout label="size" value={`${h}`} snap={onSize ? { at: h, name: 'its one size' } : undefined} />}
        <Readout label="padding" value={`${pad}`} snap={padSnap} peek={peekAt(['right'])} pick={() => summon(handles.current.pad ?? null)} scrub={(d) => { const p = clamp(pad + d, 4, 24); set(p === auto ? { padAuto: true } : { padAuto: false, pad: p }); }} />
        <Readout label="corners" value={`${Math.round(radius)}`} snap={radSnap} peek={peekAt(['corner'])} pick={() => summon(handles.current.corner ?? null)} scrub={(d) => setRad(radius + d)} />
      </div>
    </>
  );
}

/** Type, on the specimen: drag the label (sideways spacing, up or down size); the weight steps. */
export function TypeSpecimen({ m, set, look }: Part) {
  const [well, zoom] = useSpecimenZoom();
  // the type the cap ships with at this size: the ui type role, or the compact cap's own
  const own = SIZES[sizeOf(m)].type;
  const WEIGHTS = [400, 500, 600];
  const [live, setLive] = React.useState<null | 'size' | 'track'>(null);
  const [over, setOver] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const labelEl = React.useRef<HTMLSpanElement>(null);
  // tunables catch on their tokens; sizes move in half points, spacing in thousandths
  const setSize = (v: number) => { const x = Math.round(clamp(v, 10, 16) * 2) / 2; set({ fontSize: Math.abs(x - own.fontSize) <= 0.3 ? own.fontSize : x }); };
  const setTrack = (v: number) => { const x = Math.round(clamp(v, -0.03, 0.08) * 1000) / 1000; set({ track: Math.abs(x - own.track) <= 0.002 ? own.track : x }); };
  const labelHandle = useHandle({
    zoom,
    hint: () => live === 'size' ? { gesture: 'type', title: 'Size', value: `${m.fontSize}pt` }
      : live === 'track' ? { gesture: 'type', title: 'Letter spacing', value: `${m.track.toFixed(3)}em` }
      : { gesture: 'type', title: 'Label', how: 'drag sideways for spacing, up or down for size' },
    keyHint: (): Hint => ({ gesture: 'type', title: 'Label', value: `${m.fontSize}pt · ${m.track.toFixed(3)}em`, keys: [{ k: '←→', say: 'spacing' }, { k: '↑↓', say: 'size' }] }),
    start: () => ({ axis: '' as '' | 'x' | 'y', size: m.fontSize, track: m.track }),
    move: (st, dx, dy) => {
      if (!st.axis && Math.abs(dx) + Math.abs(dy) > 1.2) st.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (st.axis === 'x') { setLive('track'); setTrack(st.track + dx * 0.0015); }
      if (st.axis === 'y') { setLive('size'); setSize(st.size - dy / 3); }
    },
    end: () => setLive(null),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? setSize(m.fontSize + d * 0.5) : setTrack(m.track + d * 0.005)), axis: 'both',
    over: setOver,
  });
  const show = over || live || peek ? 'label' : undefined;
  const nextWeight = WEIGHTS[(WEIGHTS.indexOf(m.weight) + 1) % WEIGHTS.length];
  return (
    <>
      <p>The label decides how wide the button is. Drag the words sideways to change the space between letters, or up and down to change their size.</p>
      <div ref={well} className="ed-specimen">
        <div className="ed-typebox" data-show={show} data-live={live ?? undefined} style={{ zoom }} data-hint-anchor>
          <ConfiguredButton m={m} look={look}>
            <span ref={labelEl} className="ed-type-label" role="slider" tabIndex={0} aria-label="Label size and spacing" aria-valuetext={`${m.fontSize} points, spacing ${m.track} em`} aria-valuenow={m.fontSize} aria-valuemin={10} aria-valuemax={16} {...labelHandle}>{m.label}</span>
          </ConfiguredButton>
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="size" value={`${m.fontSize}`} snap={m.fontSize === own.fontSize ? { at: own.fontSize, name: 'token' } : undefined} peek={setPeek} pick={() => summon(labelEl.current)} scrub={(d) => setSize(m.fontSize + d * 0.5)} />
        <Readout label="weight" value={`${m.weight}`} unit="" snap={m.weight === own.weight ? { at: own.weight, name: 'token' } : undefined} peek={setPeek} pick={() => set({ weight: nextWeight })} scrub={(d) => set({ weight: WEIGHTS[clamp(WEIGHTS.indexOf(m.weight) + d, 0, WEIGHTS.length - 1)] })} />
        <Readout label="spacing" value={m.track.toFixed(3)} unit="em" snap={m.track === own.track ? { at: own.track, name: 'token' } : undefined} peek={setPeek} pick={() => summon(labelEl.current)} scrub={(d) => setTrack(m.track + d * 0.005)} />
      </div>
    </>
  );
}

/** Light, on the specimen: a sun on a faint orbit; around it turns the light, nearer or further sets its strength. */
export function LightSpecimen({ m, set, look }: Part) {
  const [well, zoom] = useSpecimenZoom();
  const [live, setLive] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const sunEl = React.useRef<HTMLSpanElement>(null);
  const R = 40; // the orbit, in the specimen's own units, around the button's centre
  const reach = (k: number) => R * (1.35 - k * 0.35); // stronger light sits nearer
  const at = (deg: number, k: number) => ({ x: Math.sin((deg * Math.PI) / 180) * reach(k), y: -Math.cos((deg * Math.PI) / 180) * reach(k) });
  const sun = at(m.lightDeg, m.lightK);
  const setLight = (x: number, y: number) => {
    let deg = clamp((Math.atan2(x, -y) * 180) / Math.PI, -90, 90);
    let k = clamp((1.35 - Math.hypot(x, y) / R) / 0.35, 0, 1.5);
    if (Math.abs(deg) < 4) deg = 0; else deg = Math.round(deg / 5) * 5;
    if (Math.abs(k - 1) < 0.08) k = 1; else k = Math.round(k * 20) / 20;
    set({ lightDeg: deg, lightK: k });
  };
  useOnLand(live && m.lightDeg === 0 && m.lightK === 1 ? 'home' : undefined, () => sunEl.current?.animate([{ scale: 1 }, { scale: 1.6, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }));
  const sunHandle = useHandle({
    zoom,
    hint: () => ({ gesture: 'corner', title: 'Light', value: live ? `${m.lightDeg === 0 ? 'top' : m.lightDeg < 0 ? `${-m.lightDeg}° left` : `${m.lightDeg}° right`} · ${Math.round(m.lightK * 100)}%` : undefined, how: 'drag around the button, closer for stronger' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Light', value: `${m.lightDeg}° · ${Math.round(m.lightK * 100)}%`, keys: [{ k: '←→', say: 'turn' }, { k: '↑↓', say: 'stronger' }] }),
    start: () => ({ ...sun }), move: (s0, dx, dy) => { setLive(true); setLight(s0.x + dx, s0.y + dy); }, end: () => setLive(false),
    step: (d, e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? set({ lightK: clamp(Math.round((m.lightK + d * 0.05) * 20) / 20, 0, 1.5) }) : set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })), axis: 'both',
    over: setOver,
  });
  const lit = over || live || peek;
  return (
    <>
      <p>Light falls from the top, so the top edge of the button is brightest. Drag the sun to move the light, or closer to make it stronger.</p>
      <div ref={well} className="ed-specimen is-light">
        <div className="ed-lightbox" data-lit={lit ? '' : undefined} style={{ zoom }} data-hint-anchor>
          <ConfiguredButton m={m} look={look} />
          {/* the sun's path: the upper half only, from the left, over the top, to the right */}
          <svg className="ed-orbit" width={reach(0) * 2 + 2} height={reach(0) + 1} viewBox={`${-reach(0) - 1} ${-reach(0) - 1} ${reach(0) * 2 + 2} ${reach(0) + 1}`} style={{ translate: `0 ${-reach(0) / 2}px` }} aria-hidden>
            <path d={`M${-reach(0)} 0A${reach(0)} ${reach(0)} 0 0 1 ${reach(0)} 0`} />
            <path className="is-near" d={`M${-reach(1.5)} 0A${reach(1.5)} ${reach(1.5)} 0 0 1 ${reach(1.5)} 0`} />
          </svg>
          <span ref={sunEl} className="ed-sun" style={{ translate: `${sun.x}px ${sun.y}px` }} role="slider" tabIndex={0} aria-label="Light direction and strength" aria-valuetext={`${m.lightDeg} degrees, ${Math.round(m.lightK * 100)} percent`} aria-valuenow={m.lightDeg} aria-valuemin={-90} aria-valuemax={90} {...sunHandle} />
        </div>
      </div>
      <div className="ed-readouts">
        <Readout label="from" value={m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}`} unit={m.lightDeg === 0 ? '' : m.lightDeg < 0 ? '° left' : '° right'} snap={m.lightDeg === 0 ? { at: 0, name: 'token' } : undefined} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ lightDeg: clamp(m.lightDeg + d * 5, -90, 90) })} />
        <Readout label="strength" value={`${Math.round(m.lightK * 100)}`} unit="%" snap={m.lightK === 1 ? { at: 1, name: 'token' } : undefined} peek={setPeek} pick={() => summon(sunEl.current)} scrub={(d) => set({ lightK: clamp(Math.round((m.lightK + d * 0.05) * 20) / 20, 0, 1.5) })} />
      </div>
    </>
  );
}

/** Shadow, on the specimen: lift the button off the well; the shadow spreads under it as it rises. */
export function ShadowSpecimen({ m, set, look }: Part) {
  const [well, zoom] = useSpecimenZoom();
  const token = INITIAL.lift;
  const [live, setLive] = React.useState(false);
  const btn = React.useRef<HTMLSpanElement>(null);
  const setLift = (v: number) => { const x = Math.round(clamp(v, 0, 3) * 10) / 10; set({ lift: Math.abs(x - token) < 0.15 ? token : x }); };
  const lift = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Height', value: live ? m.lift.toFixed(1) : undefined, how: 'drag up to raise, down to lower' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Height', value: m.lift.toFixed(1), keys: [{ k: '↑↓', say: 'higher' }] }),
    start: () => m.lift, move: (l0, _dx, dy) => { setLive(true); setLift(l0 - dy / 6); }, end: () => setLive(false),
    step: (d) => setLift(m.lift + d * 0.1), axis: 'y',
  });
  useOnLand(live && m.lift === token ? 'token' : undefined, () => btn.current?.animate([{ scale: 1 }, { scale: 1.04, offset: 0.3 }, { scale: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }));
  return (
    <>
      <p>The shadow shows how high the button sits above the page. Drag the button up to raise it: the shadow grows bigger and softer.</p>
      <div ref={well} className="ed-specimen">
        <div style={{ zoom }} data-hint-anchor>
          <span ref={btn} className="ed-lift" data-live={live ? '' : undefined} style={{ translate: `0 ${-(m.lift - token) * 3}px` }} role="slider" tabIndex={0} aria-label="Height above the page" aria-valuenow={m.lift} aria-valuemin={0} aria-valuemax={3} {...lift}>
            <ConfiguredButton m={m} look={look} tabIndex={-1} />
          </span>
        </div>
      </div>
      <div className="ed-readouts"><Readout label="height" value={m.lift.toFixed(1)} unit="" snap={m.lift === token ? { at: token, name: 'token' } : undefined} scrub={(d) => set({ lift: Math.round(clamp(m.lift + d * 0.1, 0, 3) * 10) / 10 })} /></div>
    </>
  );
}

/**
 * Layers, on the specimen: each layer is a row with a switch, since turning a layer off
 * takes effect at once. The whole row toggles; hovering it points at its slice in the model.
 */
export function LayersSpecimen({ m, set, look, focus }: Part & { focus: (i: number | null) => void }) {
  const [well, zoom] = useSpecimenZoom();
  const toggle = (i: number, on: boolean) => set({ on: m.on.map((v, j) => (j === i ? on : v)) });
  return (
    <>
      <p>The button is six layers stacked on top of each other. Turn a layer off to see what it adds.</p>
      <div ref={well} className="ed-specimen"><div style={{ zoom }}><ConfiguredButton m={m} look={look} /></div></div>
      <div className="ed-layers">
        {LAYERS.map((l, i) => (
          <Row.Root key={l.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''}
            onPointerEnter={() => focus(i)} onPointerLeave={() => focus(null)}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
            <Row.Text>{l.name}</Row.Text>
            <Row.Trail>
              <Switch size="small" aria-label={l.name} checked={m.on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(i)} onBlur={() => focus(null)} />
            </Row.Trail>
          </Row.Root>
        ))}
      </div>
    </>
  );
}

/** Press, on the specimen: hold it and pull down to set how far it sinks; the model sinks with it. */
export function PressSpecimen({ m, set, look, onPress }: Part & { onPress: (on: boolean) => void }) {
  const [well, zoom] = useSpecimenZoom();
  const token = TRAVEL;
  const travel = m.travel;
  const [held, setHeld] = React.useState(false);
  const setTravel = (v: number) => set({ travel: Math.round(clamp(v, 0.5, 4) * 4) / 4 });
  const press = useHandle({
    zoom,
    hint: () => ({ gesture: 'press', title: 'Press depth', value: held ? `${travel}pt` : undefined, how: 'press and pull down' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Press depth', value: `${travel}pt`, keys: [{ k: '↑↓', say: 'deeper' }] }),
    start: () => { setHeld(true); onPress(true); return travel; }, move: (t0, _dx, dy) => setTravel(t0 + dy / 6), end: () => { setHeld(false); onPress(false); },
    step: (d) => setTravel(travel - d * 0.25), axis: 'y',
  });
  return (
    <>
      <p>When you press the button it moves down a little, then springs back when you let go. Press it and pull down to choose how far it moves.</p>
      <div ref={well} className="ed-specimen">
        <div className="ed-press" style={{ zoom }} data-hint-anchor>
          <ConfiguredButton m={m} look={look} {...press} />
          <div className="ed-gauge" aria-hidden data-held={held ? '' : undefined}>
            {[0, 1, 2, 3, 4].map((n) => <i key={n} style={{ top: n * 6 }} data-token={n === token ? '' : undefined} />)}
            <b style={{ top: travel * 6 }} />
          </div>
        </div>
      </div>
      <div className="ed-readouts"><Readout label="sinks" value={`${travel}`} snap={travel === token ? { at: token, name: 'token' } : undefined} scrub={(d) => setTravel(travel + d * 0.25)} /></div>
    </>
  );
}

/** The card for a part of the button's x-ray. */
export function ButtonSpecimenCard({ spot, m, set, look, setPressed, setFocusLayer }: Props) {
  switch (spot) {
    case 'shape': return <ShapeSpecimen m={m} set={set} look={look} />;
    case 'type': return <TypeSpecimen m={m} set={set} look={look} />;
    case 'light': return <LightSpecimen m={m} set={set} look={look} />;
    case 'shadow': return <ShadowSpecimen m={m} set={set} look={look} />;
    case 'layers': return <LayersSpecimen m={m} set={set} look={look} focus={setFocusLayer} />;
    default: return <PressSpecimen m={m} set={set} look={look} onPress={setPressed} />;
  }
}
