import * as React from 'react';
import { IconButton, Row, Switch, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { KEY, LAYERS, NAME, chipLabel, type Look, type Model, type Side } from './TooltipXray';
import { STEP_AT, CornerArc, Outline, Readout, blip, clamp, snapTo, summon, useHandle, useOnLand, useSpecimenZoom, type Hint, type Seg } from '../edit';
import './tooltip-specimens.css';

/* ─────────────────────────────────────────────────────────
 * TOOLTIP SPECIMENS · the real Tooltip, held open beside a real tool, changed by handling it
 *
 *   The popup is the component's own (Base UI portals it to the page), so its recipe
 *   variables and the well's zoom reach it through a rule on its own class, and the
 *   handles ride inside its label.
 *   Timing   point at the tools (the real delay); the wait is a stepping readout
 *   Type     show the key: a switch
 *   Place    the label is the handle: drag it toward a side (steps); its near edge is the gap
 *   Shape    the right end is the space on the sides, the corner rounds it; long note: a switch
 *   Shadow   the label is the handle: drag it up to float it higher
 *   Layers   a switch per layer
 * ───────────────────────────────────────────────────────── */

// every number from the recipe and the tooltip's tokens (read here, never from TooltipXray at load)
const R = tokens.recipes.tooltip as { props: { self: { 'pad-x': number; radius: number } }; layers: { prop: string; value: string }[] };
const PAD = R.props.self['pad-x'];
const RADIUS = R.props.self.radius;
const GAP = tokens.tooltip.gap;
const DELAYS = [{ at: tokens.tooltip['delay-ms'], name: 'a name waits' }, { at: tokens.provenance['delay-ms'], name: 'a note waits' }];
/** The four sides the component takes, in the order a readout steps them. */
const SIDES: { value: Side; word: string }[] = [{ value: 'top', word: 'above' }, { value: 'right', word: 'right' }, { value: 'bottom', word: 'below' }, { value: 'left', word: 'left' }];
const word = (s: Side) => SIDES.find((x) => x.value === s)!.word;
const LIFT = 1;

type Spot = 'states' | 'type' | 'surface' | 'shape' | 'shadow' | 'layers';
type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void; setShown: (on: boolean) => void; look: Look };

const round = (v: number, places = 1) => Number(v.toFixed(places));
const token = (v: number, at: number, name = 'token') => (v === at ? { at, name } : undefined);

/**
 * The rule that reaches the portalled popup: the well's zoom and the config's recipe variables (the look's
 * style: only what differs from the recipe, as the code sets them). While a handle is held nothing on
 * the label moves by itself.
 */
function TipRule({ cls, m, zoom, live, lifted, look }: { cls: string; m: Model; zoom: number; live: boolean; lifted?: boolean; look: Look }) {
  const vars = Object.entries(look.style).map(([k, v]) => `${k}:${v};`).join('');
  const css = `.${cls}{zoom:${zoom};${vars}${lifted ? `translate:0 ${round(-(m.lift - LIFT) * 3, 2)}px;` : ''}${live ? 'transition:none;' : ''}}`;
  return <style>{css}</style>;
}

function useTipClass() {
  return `ed-tip-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

/** The chip's own box, in its own (unzoomed) units, read from an element laid over it. */
function useChipBox() {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const ro = React.useRef<ResizeObserver | null>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const attach = React.useCallback((el: HTMLSpanElement | null) => {
    ro.current?.disconnect(); ro.current = null;
    ref.current = el;
    if (!el) return;
    const read = () => setBox((b) => (b.w === el.offsetWidth && b.h === el.offsetHeight ? b : { w: el.offsetWidth, h: el.offsetHeight }));
    read();
    ro.current = new ResizeObserver(read); ro.current.observe(el);
  }, []);
  return [attach, box, ref] as const;
}

/**
 * A real tool with its real tooltip held open, in the specimen well. `over` goes inside the
 * label: the handles, laid over the chip. `ghost` is drawn beside the tool (a side's lean).
 */
function Stage({ m, zoom, well, cls, over, ghost, tipRef }: { m: Model; zoom: number; well: React.RefObject<HTMLDivElement | null>; cls: string; over?: React.ReactNode; ghost?: React.ReactNode; tipRef?: React.Ref<HTMLSpanElement> }) {
  return (
    <div ref={well} className="ed-specimen ed-tip-well">
      <div className="ed-tip-stage" style={{ zoom }}>
        <TooltipProvider>
          <span ref={tipRef} className="ed-tip-strip inline-flex rounded-pill p-6 material-frost-graphite" data-mu-colorway="graphite">
            <Tooltip open label={<>{chipLabel(m)}{over}</>} shortcut={m.showKey && !m.long ? KEY : undefined} side={m.side} offset={m.gap * zoom} wrap={m.long} className={`ed-tip ${cls}`}>
              <IconButton variant="tool" label={NAME} icon={<Icon name="select" size={16} />} />
            </Tooltip>
            {ghost}
          </span>
        </TooltipProvider>
      </div>
    </div>
  );
}

/* ───────────────────────── Timing ───────────────────────── */

function Timing({ m, set, setShown, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const cls = useTipClass();
  const strip = React.useRef<HTMLSpanElement>(null);
  // the bench shows what the real tooltips do: shown while one of them is open
  React.useEffect(() => {
    const read = () => setShown(!!document.querySelector(`.${cls}:not([data-ending-style])`));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ending-style', 'data-open'] });
    return () => mo.disconnect();
  }, [cls, setShown]);
  const wait = (v: number) => set({ delay: clamp(Math.round(v / 10) * 10, 0, 1000) });
  const at = DELAYS.find((d) => d.at === m.delay);
  return <>
    <p>Point at a tool and its tooltip waits a moment before it shows, so passing over does nothing. Once one shows, the next tool in the row shows its own at once. Change the wait with the readout.</p>
    <div ref={well} className="ed-specimen ed-tip-well">
      <div className="ed-tip-stage" style={{ zoom }}>
        <TipRule cls={cls} m={m} zoom={zoom} live={false} look={look} />
        <TooltipProvider delay={m.delay}>
          <span ref={strip} className="ed-tip-strip inline-flex gap-8 rounded-pill p-6 material-frost-graphite" data-mu-colorway="graphite">
            <Tooltip label={chipLabel(m)} shortcut={m.showKey && !m.long ? KEY : undefined} side={m.side} offset={m.gap * zoom} wrap={m.long} className={`ed-tip ${cls}`}><IconButton variant="tool" label={NAME} icon={<Icon name="select" size={16} />} /></Tooltip>
            <Tooltip label="Note" shortcut={m.showKey ? 'N' : undefined} side={m.side} offset={m.gap * zoom} className={`ed-tip ${cls}`}><IconButton variant="tool" label="Note" icon={<Icon name="note" size={16} />} /></Tooltip>
          </span>
        </TooltipProvider>
      </div>
    </div>
    <div className="ed-readouts">
      <Readout label="Wait" value={`${m.delay}`} unit="ms" snap={at} scrub={(d) => wait(m.delay + d * 10)} />
    </div>
  </>;
}

/* ───────────────────────── Type ───────────────────────── */

function Type({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const cls = useTipClass();
  return <>
    <p>It says the tool's name in small mono capitals, then its key in a dimmer grey. Turn the key off to see the name alone.</p>
    <TipRule cls={cls} m={m} zoom={zoom} live={false} look={look} />
    <Stage m={m} zoom={zoom} well={well} cls={cls} />
    <div className="ed-layers">
      <Row.Root variant="list" className="ed-layer" data-off={m.showKey ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ showKey: !m.showKey }); }}>
        <Row.Text>Show the key</Row.Text>
        <Row.Trail><Switch size="small" aria-label="Show the key" checked={m.showKey} onCheckedChange={(showKey) => set({ showKey })} /></Row.Trail>
      </Row.Root>
    </div>
  </>;
}

/* ───────────────────────── Place ───────────────────────── */

type PlaceName = 'Side' | 'Gap';
/** Which edge of the label faces the tool, and which way is away from it. */
const FACING: Record<Side, { seg: Seg; axis: 'x' | 'y'; away: 1 | -1 }> = {
  top: { seg: 'bottom', axis: 'y', away: -1 }, bottom: { seg: 'top', axis: 'y', away: 1 },
  left: { seg: 'right', axis: 'x', away: -1 }, right: { seg: 'left', axis: 'x', away: 1 },
};

function Place({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const cls = useTipClass();
  const [chip, box, chipEl] = useChipBox();
  const [active, setActive] = React.useState<PlaceName | null>(null);
  const [peek, setPeek] = React.useState<PlaceName | null>(null);
  const [lean, setLean] = React.useState<Side | null>(null);
  const [tool, setTool] = React.useState({ x: 0, y: 0, w: 0, h: 0 });
  const strip = React.useRef<HTMLSpanElement>(null);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const refs = React.useRef<Partial<Record<PlaceName, HTMLSpanElement | null>>>({});
  React.useLayoutEffect(() => {
    const b = strip.current?.querySelector<HTMLElement>('button');
    if (b) setTool({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight });
  }, [zoom]);
  const facing = FACING[m.side];
  // a step: the label jumps to the next side on the part spring (a FLIP over the positioner's jump)
  const choose = (next: Side) => {
    if (next === m.side) return;
    const popup = chipEl.current?.closest<HTMLElement>('.ed-tip');
    const from = popup?.getBoundingClientRect();
    set({ side: next });
    if (!popup || !from || document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const to = popup.getBoundingClientRect();
      const root = getComputedStyle(document.documentElement);
      const dur = parseFloat(root.getPropertyValue('--mu-spring-part-d')) * 1000 || 600;
      const ease = root.getPropertyValue('--mu-spring-part').trim() || 'ease-out';
      const z = zoom || 1;
      popup.animate([{ transform: `translate(${(from.left - to.left) / z}px, ${(from.top - to.top) / z}px)` }, { transform: 'none' }], { duration: dur, easing: ease });
    }));
  };
  const gap = (v: number, caught = true) => set({ gap: caught ? snapTo(clamp(v, 0, 30), [{ at: GAP, name: 'tooltip gap' }])[0] : clamp(Math.round(v), 0, 30) });
  const sideHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'steps', title: 'Side', value: active === 'Side' ? (lean ? `→ ${word(lean)}` : word(m.side)) : undefined, how: 'drag the label toward another side of the tool' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Side', value: word(m.side), keys: [{ k: '←↑→↓', say: 'move it there' }] }),
    start: () => ({ side: m.side, x: 0, y: 0 }),
    move: (s, dx, dy) => {
      setActive('Side');
      const ddx = dx - s.x, ddy = dy - s.y, across = Math.abs(ddx) >= Math.abs(ddy), d = across ? ddx : ddy;
      const target: Side = across ? (ddx > 0 ? 'right' : 'left') : ddy > 0 ? 'bottom' : 'top';
      if (target === s.side) { setLean(null); return; }
      if (Math.abs(d) >= STEP_AT) { choose(target); s.side = target; s.x = dx; s.y = dy; setLean(null); } else setLean(Math.abs(d) > 2 ? target : null);
    },
    end: () => { setActive(null); setLean(null); },
    step: (_d, e) => choose(({ ArrowUp: 'top', ArrowDown: 'bottom', ArrowLeft: 'left', ArrowRight: 'right' } as Record<string, Side>)[e.key]),
    axis: 'both', over: (on) => setPeek(on ? 'Side' : null), grab: () => blip(chipEl.current),
  });
  const gapHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'Gap', value: active === 'Gap' ? `${m.gap}pt` : undefined, how: 'drag this edge away from the tool for more room' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Gap', value: `${m.gap}pt`, keys: [{ k: facing.axis === 'y' ? '↑↓' : '←→', say: 'change' }] }),
    start: () => m.gap,
    move: (v, dx, dy) => { setActive('Gap'); gap(v + (facing.axis === 'y' ? dy : dx) * facing.away); },
    end: () => setActive(null),
    step: (d) => gap(m.gap + d * (facing.away === -1 && facing.axis === 'y' ? 1 : facing.away === 1 && facing.axis === 'x' ? 1 : -1), false),
    axis: facing.axis, over: (on) => setPeek(on ? 'Gap' : null), grab: () => blip(segs.current[facing.seg]),
  });
  useOnLand(active === 'Gap' && m.gap === GAP ? 'gap' : undefined, () => blip(segs.current[facing.seg]));
  const shown: Seg[] = active === 'Gap' || peek === 'Gap' ? [facing.seg] : active === 'Side' || peek === 'Side' ? [] : [facing.seg];
  // the lean: an outline of the label on the side it is about to take
  const ghostAt = (t: Side) => ({
    left: t === 'left' ? tool.x - m.gap - box.w : t === 'right' ? tool.x + tool.w + m.gap : tool.x + tool.w / 2 - box.w / 2,
    top: t === 'top' ? tool.y - m.gap - box.h : t === 'bottom' ? tool.y + tool.h + m.gap : tool.y + tool.h / 2 - box.h / 2,
  });
  const over = (
    <span ref={chip} className="ed-tip-over" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined}>
      <Outline W={box.w} h={box.h} r={m.radius} on={active === 'Gap' || peek === 'Gap' ? [facing.seg] : []} only={shown} segs={segs} />
      <span ref={(el) => { refs.current.Side = el; }} className="ed-tip-body is-move" role="slider" tabIndex={0} aria-label="Side" aria-valuetext={word(m.side)} aria-valuenow={SIDES.findIndex((s) => s.value === m.side) + 1} aria-valuemin={1} aria-valuemax={SIDES.length} {...sideHandle} />
      <span ref={(el) => { refs.current.Gap = el; }} className="ed-tip-edge" data-seg={facing.seg} role="slider" tabIndex={0} aria-label="Gap" aria-valuenow={m.gap} aria-valuemin={0} aria-valuemax={30} {...gapHandle} />
    </span>
  );
  const index = SIDES.findIndex((s) => s.value === m.side);
  return <>
    <p>The tooltip sits a little way from its tool, above it unless there is no room. Drag the label toward another side of the tool to move it there, or drag its edge nearest the tool to change the gap.</p>
    <TipRule cls={cls} m={m} zoom={zoom} live={active === 'Gap'} look={look} />
    <Stage m={m} zoom={zoom} well={well} cls={cls} over={over} tipRef={strip}
      ghost={lean && box.w ? <i className="ed-tip-ghost" style={{ ...ghostAt(lean), width: box.w, height: box.h, borderRadius: m.radius }} aria-hidden /> : null} />
    <div className="ed-readouts">
      <Readout label="Side" value={word(m.side)} unit="" snap={{ at: index, name: m.side }} peek={(on) => setPeek(on ? 'Side' : null)} pick={() => summon(refs.current.Side ?? null)} scrub={(d) => choose(SIDES[(index + d + SIDES.length) % SIDES.length].value)} />
      <Readout label="Gap" value={`${m.gap}`} snap={token(m.gap, GAP)} peek={(on) => setPeek(on ? 'Gap' : null)} pick={() => summon(refs.current.Gap ?? null)} scrub={(d) => gap(m.gap + d, false)} />
    </div>
  </>;
}

/* ───────────────────────── Shape ───────────────────────── */

type ShapeName = 'Space on the sides' | 'Corners';

function Shape({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const cls = useTipClass();
  const [chip, box] = useChipBox();
  const [active, setActive] = React.useState<ShapeName | null>(null);
  const [peek, setPeek] = React.useState<ShapeName | null>(null);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const refs = React.useRef<Partial<Record<ShapeName, HTMLSpanElement | null>>>({});
  const maxR = box.h ? box.h / 2 : RADIUS * 2;
  const pad = (v: number, caught = true) => { const n = round(clamp(v, 0, 24)); set({ padX: caught && Math.abs(n - PAD) <= 0.6 ? PAD : n }); };
  const corner = (v: number, caught = true) => { const n = round(clamp(v, 0, maxR)); set({ radius: caught && Math.abs(n - RADIUS) <= 0.6 ? RADIUS : n }); };
  const on = (name: ShapeName) => (yes: boolean) => setPeek(yes ? name : null);
  const padHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'Space on the sides', value: active === 'Space on the sides' ? `${m.padX}pt` : undefined, how: 'drag the right end out for more room' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Space on the sides', value: `${m.padX}pt`, keys: [{ k: '←→', say: 'change' }] }),
    start: () => m.padX, move: (v, dx) => { setActive('Space on the sides'); pad(v + dx / 2); }, end: () => setActive(null),
    step: (d) => pad(m.padX + d * 0.5, false), axis: 'x', over: on('Space on the sides'), grab: () => blip(segs.current.right),
  });
  const cornerHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'corner', title: 'Corners', value: active === 'Corners' ? `${m.radius}pt` : undefined, how: 'drag in to round the corner' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Corners', value: `${m.radius}pt`, keys: [{ k: '←→', say: 'rounder' }] }),
    start: () => m.radius, move: (v, dx, dy) => { setActive('Corners'); corner(v + (dx + dy) / 2); }, end: () => setActive(null),
    step: (d) => corner(m.radius + d * 0.5, false), axis: 'both', over: on('Corners'), grab: () => blip(segs.current.corner),
  });
  useOnLand(active === 'Space on the sides' && m.padX === PAD ? 'pad' : undefined, () => blip(segs.current.right));
  useOnLand(active === 'Corners' && m.radius === RADIUS ? 'corner' : undefined, () => blip(segs.current.corner));
  const lit = active ?? peek;
  const shown: Seg[] = lit === 'Space on the sides' ? ['right'] : lit === 'Corners' ? ['corner'] : ['right', 'corner'];
  const over = (
    <span ref={chip} className="ed-tip-over" data-hint-anchor data-live={active ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')}>
      <Outline W={box.w} h={box.h} r={m.radius} on={lit === 'Space on the sides' ? ['right'] : []} only={shown} segs={segs} />
      <span ref={(el) => { refs.current['Space on the sides'] = el; }} className="ed-tip-edge" data-seg="right" role="slider" tabIndex={0} aria-label="Space on the sides" aria-valuenow={m.padX} aria-valuemin={0} aria-valuemax={24} {...padHandle} />
      <span ref={(el) => { refs.current.Corners = el; }} className="ed-tip-corner" style={{ width: Math.max(m.radius, 6) + 3, height: Math.max(m.radius, 6) + 3 }} role="slider" tabIndex={0} aria-label="Corners" aria-valuenow={m.radius} aria-valuemin={0} aria-valuemax={round(maxR)} {...cornerHandle}>
        <CornerArc r={m.radius} on={lit === 'Corners'} arcRef={(el) => { segs.current.corner = el; }} />
      </span>
    </span>
  );
  return <>
    <p>A small dark label with round corners. Drag its right end to change the space on the sides, or its corner to round it. A long note wraps instead of running on.</p>
    <TipRule cls={cls} m={m} zoom={zoom} live={active !== null} look={look} />
    <Stage m={m} zoom={zoom} well={well} cls={cls} over={over} />
    <div className="ed-readouts">
      <Readout label="Space on the sides" value={`${m.padX}`} snap={token(m.padX, PAD)} peek={on('Space on the sides')} pick={() => summon(refs.current['Space on the sides'] ?? null)} scrub={(d) => pad(m.padX + d * 0.5, false)} />
      <Readout label="Corners" value={`${m.radius}`} snap={token(m.radius, RADIUS)} peek={on('Corners')} pick={() => summon(refs.current.Corners ?? null)} scrub={(d) => corner(m.radius + d * 0.5, false)} />
    </div>
    <div className="ed-layers">
      <Row.Root variant="list" className="ed-layer" data-off={m.long ? undefined : ''} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) set({ long: !m.long }); }}>
        <Row.Text>Long note</Row.Text>
        <Row.Trail><Switch size="small" aria-label="Long note" checked={m.long} onCheckedChange={(long) => set({ long })} /></Row.Trail>
      </Row.Root>
    </div>
  </>;
}

/* ───────────────────────── Shadow ───────────────────────── */

function Shadow({ m, set, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const cls = useTipClass();
  const [chip] = useChipBox();
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const el = React.useRef<HTMLSpanElement>(null);
  const lift = (v: number, caught = true) => { const n = round(clamp(v, 0, 3)); set({ lift: caught && Math.abs(n - LIFT) <= 0.15 ? LIFT : n }); };
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'press', title: 'Height above the page', value: live ? m.lift.toFixed(1) : undefined, how: 'drag the label up to float it higher' }),
    keyHint: (): Hint => ({ gesture: 'press', title: 'Height above the page', value: m.lift.toFixed(1), keys: [{ k: '↑↓', say: 'change' }] }),
    start: () => m.lift, move: (v, _dx, dy) => { setLive(true); lift(v - dy / 6); }, end: () => setLive(false),
    step: (d) => lift(m.lift + d * 0.1, false), axis: 'y', over: setPeek,
  });
  useOnLand(live && m.lift === LIFT ? 'lift' : undefined, () => blip(el.current));
  const over = (
    <span ref={chip} className="ed-tip-over" data-hint-anchor data-live={live ? '' : undefined} data-peek={peek ? '' : undefined}>
      <span ref={el} className="ed-tip-body is-lift" role="slider" tabIndex={0} aria-label="Height above the page" aria-valuenow={m.lift} aria-valuemin={0} aria-valuemax={3} {...handle} />
    </span>
  );
  return <>
    <p>The tooltip floats above everything else on the page, even menus, so its shadows are the softest and widest. Drag the label up to float it higher.</p>
    <TipRule cls={cls} m={m} zoom={zoom} live={live} lifted look={look} />
    <Stage m={m} zoom={zoom} well={well} cls={cls} over={over} />
    <div className="ed-readouts">
      <Readout label="Height above the page" value={m.lift.toFixed(1)} unit="" snap={token(m.lift, LIFT)} peek={setPeek} pick={() => summon(el.current)} scrub={(d) => lift(m.lift + d * 0.1, false)} />
    </div>
  </>;
}

/* ───────────────────────── Layers ───────────────────────── */

function Layers({ m, set, focus, look }: Props) {
  const [well, zoom] = useSpecimenZoom();
  const cls = useTipClass();
  const toggle = (i: number, v: boolean) => set({ on: m.on.map((x, j) => (j === i ? v : x)) });
  return <>
    <p>The label is dark glass in eight layers, the same as the toolbar. Turn one off to see what it adds.</p>
    <TipRule cls={cls} m={m} zoom={zoom} live={false} look={look} />
    <Stage m={m} zoom={zoom} well={well} cls={cls} />
    <div className="ed-layers">
      {LAYERS.map((layer, i) => (
        <Row.Root key={layer.name} variant="list" className="ed-layer" data-off={m.on[i] ? undefined : ''} onPointerEnter={() => focus(layer.name)} onPointerLeave={() => focus(null)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) toggle(i, !m.on[i]); }}>
          <Row.Text>{layer.name}</Row.Text>
          <Row.Trail><Switch size="small" aria-label={layer.name} checked={m.on[i]} onCheckedChange={(v) => toggle(i, v)} onFocus={() => focus(layer.name)} onBlur={() => focus(null)} /></Row.Trail>
        </Row.Root>
      ))}
    </div>
  </>;
}

export function TooltipSpecimenCard(props: Props) {
  switch (props.spot) {
    case 'states': return <Timing {...props} />;
    case 'type': return <Type {...props} />;
    case 'surface': return <Place {...props} />;
    case 'shape': return <Shape {...props} />;
    case 'shadow': return <Shadow {...props} />;
    case 'layers': return <Layers {...props} />;
  }
}
