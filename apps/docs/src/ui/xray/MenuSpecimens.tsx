import * as React from 'react';
import { Button, Row, Switch } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { LAYERS, MenuObject, ROWS, plateRadius, rowIndexes, type Look, type Model, type Spot } from './MenuXray';
import {
  STEP_AT, STEP_MOTION, CornerArc, Outline, Readout, blip, clamp, summon, useHandle, useOnLand, useSpecimenZoom, useStepMotion,
  type Hint, type Seg,
} from '../edit';
import './menu-specimens.css';

/* ─────────────────────────────────────────────────────────
 * THE MENU'S SPECIMENS · the x-ray card for each part
 *
 *   The card holds the menu's real still (MenuObject: the library's own part classes) to handle;
 *   the model on the bench and the table's object are the same still, set by the same config.
 *     rows     the lit row is the handle: drag it up or down and it steps row to row;
 *              pointing at a row lights it, as in the live menu
 *     heading  a switch       line   a switch
 *     glass    the plate's top edge sets the gap to its button
 *     shape    the right edge the space around the rows, the lit row's corner its
 *              corners; plate corners follow the rows is a switch
 *     layers   a row with a switch per layer
 *   The menu has one size and one kind, so nothing else steps.
 * ───────────────────────────────────────────────────────── */

// every real value from the recipe (one source per fact); only these read tokens at load time
const P = tokens.recipes.menu.props;
const OFFSET = tokens.menu.offset;
const PAD = P.self.pad;
const ROW_R = P.row.radius;
const PLATE_R = P.self.radius;
const ROW_H = P.row.height;
const PAD_MAX = ROW_H / 2;
const ROW_R_MAX = ROW_H / 2;
const OFFSET_MAX = ROW_H;

type Props = { spot: Spot; m: Model; set: (patch: Partial<Model>) => void; focus: (name: string | null) => void; look: Look };
type Rect = { x: number; y: number; w: number; h: number };

const half = (v: number) => Math.round(v * 2) / 2;
/** A tunable moves in half points and catches on its token when it comes within reach. */
const tune = (v: number, lo: number, hi: number, at: number, caught = true) => { const x = half(clamp(v, lo, hi)); return caught && Math.abs(x - at) <= 0.75 ? at : x; };
const token = (v: number, at: number) => (v === at ? { at, name: 'menu token' } : undefined);
const labelOf = (i: number) => { const r = ROWS[i]; return r ? r.label : ''; };

/** Where the plate and its rows sit, in the plate's own units (read after every change). */
function useRects(box: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  const [rects, setRects] = React.useState<{ plate: Rect; rows: Record<number, Rect> }>({ plate: { x: 0, y: 0, w: 0, h: 0 }, rows: {} });
  React.useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const read = () => {
      const plate = el.querySelector<HTMLElement>('.mu-menu'); if (!plate) return;
      const rows: Record<number, Rect> = {};
      plate.querySelectorAll<HTMLElement>('[data-row]').forEach((r) => { rows[Number(r.dataset.row)] = { x: r.offsetLeft, y: r.offsetTop, w: r.offsetWidth, h: r.offsetHeight }; });
      setRects({ plate: { x: plate.offsetLeft, y: plate.offsetTop, w: plate.offsetWidth, h: plate.offsetHeight }, rows });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return rects;
}

/**
 * The specimen's magnification: the shared zoom, eased down only as far as the plate needs
 * to fit a narrow card. Handles read drags at the same scale.
 */
function useFit(width: number) {
  const [well, zoom] = useSpecimenZoom();
  const [room, setRoom] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = well.current; if (!el) return;
    const read = () => setRoom(el.clientWidth - 24);
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [well]);
  const fit = room > 0 && width > 0 ? Math.min(zoom, Math.floor((room / width) * 100) / 100) : zoom;
  return [well, fit] as const;
}

function Well({ well, zoom, children }: { well: React.RefObject<HTMLDivElement | null>; zoom: number; children: React.ReactNode }) {
  return <div ref={well} className="ed-specimen"><div style={{ zoom }}>{children}</div></div>;
}

/** Rows: the lit row is the handle; it leans toward the next row, then snaps there. */
function Rows({ m, set, look }: Props) {
  const box = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<HTMLSpanElement>(null);
  const rects = useRects(box, [m.lit, m.heading, m.sep, m.pad, m.rowR]);
  const [well, zoom] = useFit(rects.plate.w);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const [lean, setLean] = React.useState<number | null>(null);
  const motion = useStepMotion();
  const phase = motion.transition === STEP_MOTION.drag ? 'drag' : motion.transition === STEP_MOTION.step ? 'step' : 'back';
  const glide = phase === 'drag' ? 'none' : phase === 'step' ? 'top var(--spring-part-d) var(--spring-part)' : 'top var(--spring-release-d) var(--spring-release)';
  const k = rowIndexes.indexOf(m.lit);
  const go = (d: number) => { const next = rowIndexes[clamp(k + d, 0, rowIndexes.length - 1)]; if (next !== m.lit) { motion.stepped(); set({ lit: next }); } };
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'steps', title: 'Lit row', value: live ? (lean !== null ? `→ ${labelOf(lean)}` : labelOf(m.lit)) : undefined, how: 'drag up or down to light another row' }),
    keyHint: (): Hint => ({ gesture: 'steps', title: 'Lit row', value: labelOf(m.lit), keys: [{ k: '↑↓', say: 'move' }] }),
    start: () => { motion.held(); return { k, traveled: 0 }; },
    move: (s, _dx, dy) => {
      setLive(true);
      const travel = dy - s.traveled, dir = Math.sign(travel), target = rowIndexes[s.k + dir];
      if (target !== undefined && Math.abs(travel) >= STEP_AT) { motion.stepped(); set({ lit: target }); s.k += dir; s.traveled = dy; setLean(null); }
      else setLean(target !== undefined && Math.abs(travel) > 2 ? target : null);
    },
    end: () => { setLive(false); setLean(null); motion.let(); },
    step: (d) => go(-d), axis: 'y', over: setPeek,
  });
  const lit = rects.rows[m.lit], ghost = lean !== null ? rects.rows[lean] : undefined;
  return (
    <>
      <p>One row is lit at a time, and your pointer and the arrow keys move the same light. Drag the lit row up or down to light another one, or point at a row.</p>
      <Well well={well} zoom={zoom}>
        <div ref={box} className="ed-box ed-menu" data-hint-anchor data-live={live ? 'lit' : undefined} data-peek={peek ? 'lit' : undefined}>
          <MenuObject m={m} look={look} onRow={(i) => { if (!live && i !== m.lit) set({ lit: i }); }} />
          <div className="ed-overlay">
            {ghost && <i className="ed-menu-lean" style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h, borderRadius: m.rowR }} aria-hidden />}
            {lit && <span ref={frame} className="ed-menu-lit" style={{ left: lit.x, top: lit.y, width: lit.w, height: lit.h, borderRadius: m.rowR, transition: glide }}
              role="slider" tabIndex={0} aria-label="Lit row" aria-valuetext={labelOf(m.lit)} aria-valuenow={k + 1} aria-valuemin={1} aria-valuemax={rowIndexes.length} {...handle} />}
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Lit row" value={labelOf(m.lit)} unit="" snap={{ at: m.lit, name: 'one of its rows' }} peek={setPeek} pick={() => summon(frame.current)} scrub={(d) => go(-d)} />
      </div>
    </>
  );
}

/** Glass: the plate's top edge sets how far below its button the menu opens. */
function Glass({ m, set, look }: Props) {
  const box = React.useRef<HTMLDivElement>(null);
  const edge = React.useRef<HTMLSpanElement>(null);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const rects = useRects(box, [m.heading, m.sep, m.pad, m.rowR, m.offset]);
  const [well, zoom] = useFit(rects.plate.w);
  const [live, setLive] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const setGap = (v: number, caught = true) => set({ offset: tune(v, 0, OFFSET_MAX, OFFSET, caught) });
  useOnLand(live && m.offset === OFFSET ? 'gap' : undefined, () => blip(segs.current.top));
  const handle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'Gap to the button', value: live ? `${m.offset}pt` : undefined, how: 'drag the top edge down to open it farther away' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Gap to the button', value: `${m.offset}pt`, keys: [{ k: '↑↓', say: 'change' }, { k: '⇧', say: '×4' }] }),
    start: () => m.offset, move: (v, _dx, dy) => { setLive(true); setGap(v + dy); }, end: () => setLive(false),
    step: (d) => setGap(m.offset - d), axis: 'y', over: setPeek, grab: () => blip(segs.current.top),
  });
  const r = plateRadius(m);
  return (
    <>
      <p>The menu is frosted glass that opens just below the button that opened it, so your eye does not have to travel. Drag the menu's top edge to change the gap.</p>
      <Well well={well} zoom={zoom}>
        <div className="ed-menu-stack" data-hint-anchor>
          <Button tabIndex={-1}>Actions</Button>
          <div ref={box} className="ed-box ed-menu" style={{ marginTop: m.offset }} data-live={live ? 'gap' : undefined} data-peek={peek ? 'gap' : undefined} data-shown="top">
            <MenuObject m={m} look={look} />
            <div className="ed-overlay">
              <Outline W={rects.plate.w} h={rects.plate.h} r={r} on={live || peek ? ['top'] : []} only={['top']} segs={segs} />
              <span ref={edge} className="ed-edge is-y" role="slider" tabIndex={0} aria-label="Gap to the button" aria-valuenow={m.offset} aria-valuemin={0} aria-valuemax={OFFSET_MAX} {...handle} />
            </div>
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Gap to the button" value={`${m.offset}`} snap={token(m.offset, OFFSET)} peek={setPeek} pick={() => summon(edge.current)} scrub={(d) => setGap(m.offset + d, false)} />
      </div>
    </>
  );
}

/** Shape: the right edge sets the space around the rows, the lit row's corner its corners. */
function Shape({ m, set, look }: Props) {
  const box = React.useRef<HTMLDivElement>(null);
  const segs = React.useRef<Partial<Record<Seg, SVGPathElement | null>>>({});
  const refs = React.useRef<Partial<Record<'pad' | 'corner', HTMLSpanElement | null>>>({});
  const rects = useRects(box, [m.lit, m.heading, m.sep, m.pad, m.rowR, m.follow]);
  const [well, zoom] = useFit(rects.plate.w);
  const [live, setLive] = React.useState<'pad' | 'corner' | null>(null);
  const [peek, setPeek] = React.useState<'pad' | 'corner' | null>(null);
  const setPad = (v: number, caught = true) => set({ pad: tune(v, 0, PAD_MAX, PAD, caught) });
  const setRowR = (v: number, caught = true) => set({ rowR: tune(v, 0, ROW_R_MAX, ROW_R, caught) });
  useOnLand(live === 'pad' && m.pad === PAD ? 'pad' : undefined, () => blip(segs.current.right));
  useOnLand(live === 'corner' && m.rowR === ROW_R ? 'corner' : undefined, () => blip(segs.current.corner));
  const padHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'sides', title: 'Space around the rows', value: live === 'pad' ? `${m.pad}pt` : undefined, how: 'drag the right edge out for more space' }),
    keyHint: (): Hint => ({ gesture: 'sides', title: 'Space around the rows', value: `${m.pad}pt`, keys: [{ k: '←→', say: 'change' }, { k: '⇧', say: '×4' }] }),
    start: () => m.pad, move: (v, dx) => { setLive('pad'); setPad(v + dx); }, end: () => setLive(null),
    step: (d) => setPad(m.pad + d * 0.5), axis: 'x', over: (on) => setPeek(on ? 'pad' : null), grab: () => blip(segs.current.right),
  });
  const cornerHandle = useHandle({
    zoom,
    hint: (): Hint => ({ gesture: 'corner', title: 'Row corners', value: live === 'corner' ? `${m.rowR}pt` : undefined, how: 'drag in to round, out to square' }),
    keyHint: (): Hint => ({ gesture: 'corner', title: 'Row corners', value: `${m.rowR}pt`, keys: [{ k: '←→', say: 'rounder' }] }),
    start: () => m.rowR, move: (v, dx, dy) => { setLive('corner'); setRowR(v + (dx + dy) / 1.2); }, end: () => setLive(null),
    step: (d) => setRowR(m.rowR + d * 0.5), axis: 'both', over: (on) => setPeek(on ? 'corner' : null), grab: () => blip(segs.current.corner),
  });
  const pointed = live ?? peek;
  const shown: Seg[] = pointed === 'pad' ? ['right'] : pointed === 'corner' ? ['corner'] : ['right', 'corner'];
  const r = plateRadius(m);
  const lit = rects.rows[m.lit];
  return (
    <>
      <p>The plate's corners are the lit row's corners plus the space around the rows, so the lit row always sits in it with an even gap. Drag the right edge to change the space around the rows, or the lit row's corner to round it.</p>
      <Well well={well} zoom={zoom}>
        <div ref={box} className="ed-box ed-menu" data-hint-anchor data-live={live ?? undefined} data-peek={peek ?? undefined} data-shown={shown.join(' ')}>
          <MenuObject m={m} look={look} />
          <div className="ed-overlay">
            <Outline W={rects.plate.w} h={rects.plate.h} r={r} on={pointed === 'pad' ? ['right'] : []} only={shown.filter((s) => s !== 'corner')} segs={segs} />
            <span ref={(el) => { refs.current.pad = el; }} className="ed-edge is-x" role="slider" tabIndex={0} aria-label="Space around the rows" aria-valuenow={m.pad} aria-valuemin={0} aria-valuemax={PAD_MAX} {...padHandle} />
            {lit && (
              <div className="ed-menu-rowcorner" style={{ left: lit.x, top: lit.y, width: lit.w, height: lit.h }}>
                <span ref={(el) => { refs.current.corner = el; }} className="ed-corner" style={{ width: Math.max(m.rowR, 6) + 3, height: Math.max(m.rowR, 6) + 3 }} role="slider" tabIndex={0} aria-label="Row corners" aria-valuenow={m.rowR} aria-valuemin={0} aria-valuemax={ROW_R_MAX} {...cornerHandle}>
                  <CornerArc r={m.rowR} on={pointed === 'corner'} arcRef={(el) => { segs.current.corner = el; }} />
                </span>
              </div>
            )}
          </div>
        </div>
      </Well>
      <div className="ed-readouts">
        <Readout label="Space around the rows" value={`${m.pad}`} snap={token(m.pad, PAD)} peek={(on) => setPeek(on ? 'pad' : null)} pick={() => summon(refs.current.pad ?? null)} scrub={(d) => setPad(m.pad + d * 0.5, false)} />
        <Readout label="Row corners" value={`${m.rowR}`} snap={token(m.rowR, ROW_R)} peek={(on) => setPeek(on ? 'corner' : null)} pick={() => summon(refs.current.corner ?? null)} scrub={(d) => setRowR(m.rowR + d * 0.5, false)} />
        <Readout label="Plate corners" value={`${r}`} snap={token(r, PLATE_R)} />
      </div>
      <div className="ed-layers">
        <Toggle name="Plate corners follow the rows" on={m.follow} change={(follow) => set({ follow })} />
      </div>
    </>
  );
}

function Toggle({ name, on, change, focus }: { name: string; on: boolean; change: (on: boolean) => void; focus?: (name: string | null) => void }) {
  return (
    <Row.Root variant="list" className="ed-layer" data-off={on ? undefined : ''} onPointerEnter={() => focus?.(name)} onPointerLeave={() => focus?.(null)}
      onClick={(e) => { if (!(e.target as HTMLElement).closest('.mu-switch')) change(!on); }}>
      <Row.Text>{name}</Row.Text>
      <Row.Trail><Switch size="small" aria-label={name} checked={on} onCheckedChange={change} onFocus={() => focus?.(name)} onBlur={() => focus?.(null)} /></Row.Trail>
    </Row.Root>
  );
}

/** A card whose values are on or off: the plate, then a switch for each. */
function Switches({ m, look, words, children }: { m: Model; look: Look; words: string; children: React.ReactNode }) {
  const box = React.useRef<HTMLDivElement>(null);
  const rects = useRects(box, [m.heading, m.sep, m.pad, m.rowR, m.on]);
  const [well, zoom] = useFit(rects.plate.w);
  return (
    <>
      <p>{words}</p>
      <Well well={well} zoom={zoom}><div ref={box} className="ed-menu"><MenuObject m={m} look={look} /></div></Well>
      <div className="ed-layers">{children}</div>
    </>
  );
}

export function MenuSpecimenCard(props: Props) {
  const { spot, m, set, focus, look } = props;
  switch (spot) {
    case 'states': return <Rows {...props} />;
    case 'surface': return <Glass {...props} />;
    case 'shape': return <Shape {...props} />;
    case 'type': return (
      <Switches m={m} look={look} words="The engraved line at the top says what the menu will act on, so you know what you are changing before you pick a row. Switch it off to see the menu without it.">
        <Toggle name="Heading" on={m.heading} change={(heading) => set({ heading })} />
      </Switches>
    );
    case 'well': return (
      <Switches m={m} look={look} words="A thin line cut into the glass splits the rows into groups, so the red row sits apart from the safe ones and you do not hit it by accident. Switch it off to see the rows run together.">
        <Toggle name="Line" on={m.sep} change={(sep) => set({ sep })} />
      </Switches>
    );
    case 'layers': return (
      <Switches m={m} look={look} words="The plate is made of nine layers, four of them shadows. Turn one off to see what it adds.">
        {LAYERS.map((layer, i) => <Toggle key={layer.name} name={layer.name} on={m.on[i]} focus={focus} change={(on) => set({ on: m.on.map((old, j) => (j === i ? on : old)) })} />)}
      </Switches>
    );
  }
}
