import * as React from 'react';
import { Kbd, menuParts as M } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, IsoCap, capTop, recipeLayers, scalePx, tones, useFit, useRecipeLayers, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { MenuSpecimenCard } from './MenuSpecimens';
import { MenuCodePanel } from './MenuCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · MENU
 *
 *   solid     the menu's still: a heading, rows with glyphs and keys, a line, a red row
 *   x-ray     a frosted plate floating just below its button. Its top is the real still itself, laid
 *             out at the object's own zoom and scaled by transform, so the plate that lands on it is
 *             the plate that was on the table; a thin wall stands under it, and the button it opened
 *             from is hand-built below.
 *   card      the real still, handled (MenuSpecimens): the lit row steps row to row, the plate's top
 *             edge sets the gap to its button, its right edge the space around the rows, the lit row's
 *             corner the row corners; heading, line, corners that follow and each layer are switches.
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (MenuCode.tsx). A
 *             real menu opens from a trigger in a portal, so the code is the library's Menu, not the still.
 *
 *   The still is the library's own: `menuParts` are the classes its popup is made of, exported for stills
 *   outside a popup. The table, the model's face, the specimens and the measure are all MenuObject.
 * ───────────────────────────────────────────────────────── */

const P = tokens.recipes.menu.props as { self: { 'min-width': number; pad: number; radius: number }; heading: { 'pad-top': number; 'pad-x': number; 'pad-bottom': number }; row: { height: number; pad: number; gap: number; radius: number; glyph: number }; sep: { thickness: number; 'inset-y': number; 'inset-x': number } };
const BTN = tokens.recipes.button.props as { self: { height: number } };
const S = 1.8;
/** The rows of the x-ray's menu, and the handler each one calls in the code. */
export const ROWS = [
  { icon: 'task', label: 'Make a task', key: '⌘T', act: 'onTask' },
  { icon: 'pin', label: 'Pin to the canvas', key: '⌘P', act: 'onPin' },
  null,
  { icon: 'trash', label: 'Delete', key: '⌫', act: 'onDelete', danger: true },
] as const;
export const HEADING = 'NOTE · 3 LINES';
export const TRIGGER = 'Actions';

export type Spot = 'states' | 'type' | 'well' | 'surface' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'Rows', word: 'The lit row' },
  { id: 'type', title: 'Heading', word: 'What it acts on' },
  { id: 'well', title: 'Line', word: 'Between groups' },
  { id: 'surface', title: 'Glass', word: 'Frost, close to its button' },
  { id: 'shape', title: 'Shape', word: 'Corners that match' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], type: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], states: ['right', 0.48], well: ['right', 0.76],
};

export const LAYERS: LayerDef[] = [
  { name: 'Frost', why: 'A light, slightly see-through fill. The page shows through a little, so you remember where you are.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A faint dark edge along the bottom right.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Mid shadow', why: 'A larger soft shadow.' },
  { name: 'Far shadow', why: 'A very big, very faint shadow. The menu floats well above the page, but below tooltips.' },
];

/** Everything the menu is set to: its real parts first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface MenuConfig {
  /** parts: the heading above the rows and the line between the groups are in the code; the lit row is where the pointer or the keys are, so it is not */
  heading: boolean; sep: boolean; lit: number;
  /** --mu-menu-offset (the gap to the button), --mu-r-menu-self-pad, --mu-r-menu-row-radius; the plate's corners follow the rows (--mu-r-menu-self-radius) */
  offset: number; pad: number; rowR: number; follow: boolean;
  /** the plate's nine layers (the frost, then its eight shadows), each switchable */
  on: boolean[];
}
export type Model = MenuConfig;
export const INITIAL: MenuConfig = { heading: true, sep: true, lit: 0, offset: tokens.menu.offset, pad: P.self.pad, rowR: P.row.radius, follow: true, on: LAYERS.map(() => true) };
export const rowIndexes = ROWS.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
/** The plate's corners: the rows' corners plus the space around them when they follow, else the recipe's own. */
export const plateRadius = (m: MenuConfig) => (m.follow ? m.rowR + m.pad : P.self.radius);
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(tokens.springs.object.duration * 1000 * 0.55);

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the variables that set the real plate to it (only those that differ from the
 *  recipe, so a default config is the menu exactly as it ships), and the plate's fill and shadows for the
 *  model's hand-built layers. The gap to the button is not on the plate (the library reads it from the
 *  document's root), so it rides beside the style. */
export function menuLook(m: MenuConfig, colorway: Colorway) {
  const plate = recipeLayers('menu', 'self', colorway);
  const fill = m.on[0] ? plate.fill : 'transparent';
  const shadow = plate.shadows.filter((_, i) => m.on[i + 1]).join(', ') || 'none';
  const plateR = plateRadius(m);
  const style: Record<string, string> = {};
  if (m.pad !== INITIAL.pad) style['--mu-r-menu-self-pad'] = `${m.pad}px`;
  if (m.rowR !== INITIAL.rowR) style['--mu-r-menu-row-radius'] = `${m.rowR}px`;
  if (plateR !== P.self.radius) style['--mu-r-menu-self-radius'] = `${plateR}px`;
  // the plate's fill and shadows are colours: one set per colorway
  if (!m.on[0]) style['--mu-r-menu-self-background'] = fill;
  if (!same(m.on.slice(1), INITIAL.on.slice(1))) style['--mu-r-menu-self-shadow'] = shadow;
  const offset = m.offset !== INITIAL.offset ? `${m.offset}px` : undefined;
  return { colorway, plateRaw: plate, fill, shadow, plateR, offset, style: style as React.CSSProperties };
}
export function useMenuLook(m: MenuConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => menuLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useMenuLook>;

/** The menu's still, set to a config: the library's own part classes (the real popup lives in a portal), so
 *  the table's object, the model's face and every specimen are this. A row lights under the pointer when
 *  asked to (the specimen), or on a click (the model). */
export function MenuObject({ m, look, onRow, onPick, style, className }: { m: MenuConfig; look: Look; onRow?: (i: number) => void; onPick?: (i: number) => void; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className ? `${M.PLATE} ${className}` : M.PLATE} style={{ ...look.style, ...style }}>
      {m.heading && <div className={M.HEADING}>{HEADING}</div>}
      {ROWS.map((r, i) => r
        ? (
          <div key={i} data-row={i} className={M.ROW} data-highlighted={i === m.lit ? '' : undefined} data-danger={'danger' in r ? '' : undefined}
            onPointerEnter={onRow ? () => onRow(i) : undefined} onClick={onPick ? () => onPick(i) : undefined}>
            <span aria-hidden className={M.GLYPH}><Icon name={r.icon as IconName} size={P.row.glyph} /></span>
            <span className={M.LABEL}>{r.label}</span>
            <Kbd size="small" className={M.KEY}>{r.key}</Kbd>
          </div>
        )
        : m.sep ? <div key={i} className={M.SEP} /> : null)}
    </div>
  );
}

/** The plate's box and its parts, in the plate's own points, read off the real thing. */
type Part = { x: number; y: number; w: number; h: number };
interface Box { W: number; H: number; heading?: Part; sep?: Part; rows: Record<number, Part> }
const NO_BOX: Box = { W: 0, H: 0, rows: {} };

export function MenuXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<MenuConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<MenuConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<MenuConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useMenuLook(m);
  const btn = useRecipeLayers('button');

  // the plate's boxes, measured on an unseen copy at the object's own zoom (so fractions of a point survive)
  const bench = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<Box>(NO_BOX);
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    const read = () => {
      const plate = el.querySelector<HTMLElement>('.mu-menu'); if (!plate) return;
      const b = plate.getBoundingClientRect();
      const part = (p: Element | null): Part | undefined => { if (!p) return undefined; const r = p.getBoundingClientRect(); return { x: (r.left - b.left) / oz, y: (r.top - b.top) / oz, w: r.width / oz, h: r.height / oz }; };
      const rows: Record<number, Part> = {};
      plate.querySelectorAll<HTMLElement>('[data-row]').forEach((r) => { rows[Number(r.dataset.row)] = part(r)!; });
      setBox({ W: b.width / oz, H: b.height / oz, heading: part(plate.querySelector('.mu-menu-heading')), sep: part(plate.querySelector('.mu-menu-sep')), rows });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [m, look, oz]);

  const W = box.W * S, H = box.H * S;
  const flat = pose === 'flat';
  const btnH = BTN.self.height, btnW = 120;
  // the plate floats this far above the floor, on a thin wall; flat, it lies as the object that landed
  const z = 40, WALL = 3;
  const top = flat ? 1 : capTop(z, WALL);
  const y0 = (btnH + m.offset) * S;
  const Hs = y0 + H;
  const plateR = look.plateR * S;
  const exploded = spot === 'layers';
  const fit = useFit(bench, W, Hs, xray);
  const t = tones(look.colorway);
  const face = (zz: number) => ({ transform: `translate(0px, ${y0}px) translateZ(${zz}px) scale(${S / oz})`, zoom: oz });
  // every shadow but the far one sits on the plate; the far one is drawn beneath it, blurred
  const wallShadow = scalePx(look.plateRaw.shadows.slice(0, 7).filter((_, i) => m.on[i + 1]).join(', ') || 'none', S);
  const rise = 'transform var(--spring-object-d) var(--spring-object), opacity .25s';

  const still = <MenuObject m={m} look={look} />;

  const scene = exploded ? (
    <Exploded layers={LAYERS} on={m.on} fill={look.fill} shadows={look.plateRaw.shadows} y={y0} w={W} h={H} r={plateR} z0={10} gap={14} focus={focus} scale={S} />
  ) : (
    <>
      {/* the button it opened from: hand-built, and only there once the plate has risen off it */}
      <div className="xr-menubtn" style={{ opacity: flat ? 0 : 1, transition: 'opacity .3s' }}>
        <IsoCap x={0} y={0} w={btnW * S} h={btnH * S} r={(btnH * S) / 2} z={0.5} wall={4} fill={btn.fill} shadow={scalePx(btn.shadows.slice(0, 4).join(', '), S)} wallTone={t.wall}>
          <span style={{ font: `500 ${13 * S}px/1 var(--sans)`, color: 'var(--ink)' }}>{TRIGGER}</span>
        </IsoCap>
        <i className="xr-stem" style={{ left: 20 * S, top: btnH * S, height: z, transform: 'translateZ(4px) rotateX(90deg)' }} />
      </div>
      {m.on[8] && <div className="xr-shadow" style={{ top: y0, width: W, height: H, borderRadius: plateR, filter: 'blur(24px)', opacity: flat ? 0 : 0.18, transform: 'translate(10px, 24px)' }} />}
      {/* the wall: the plate's outline stood on the floor, under the real plate */}
      <div className="xr-thumb" style={{ transform: `translate(0px, ${y0}px)` }}>
        {Array.from({ length: WALL }, (_, i) => (
          <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: plateR, opacity: flat ? 0 : 1, transition: rise, transform: `translateZ(${flat ? 0 : z + i * 1.4}px)`, background: i === 0 || !m.on[0] ? 'transparent' : t.wall, boxShadow: i === WALL - 1 ? wallShadow : undefined }} />
        ))}
      </div>
      {/* the top: the real still, raised. Click a row to light it */}
      <div className="xr-segface is-top" style={face(top)}><MenuObject m={m} look={look} onPick={(lit) => set({ lit })} /></div>
    </>
  );

  const lit = box.rows[m.lit], row1 = box.rows[rowIndexes[1]];
  const anchors: Record<Spot, [number, number, number]> = {
    states: [W * 0.85, y0 + (lit ? (lit.y + lit.h / 2) * S : H / 2), top + 1],
    type: [box.heading ? (box.heading.x + 20) * S : W * 0.3, y0 + (box.heading ? (box.heading.y + box.heading.h / 2) * S : m.pad * S), top + 1],
    well: [W * 0.8, y0 + (box.sep ? (box.sep.y + box.sep.h / 2) * S : row1 ? (row1.y + row1.h) * S : H / 2), top + 1],
    surface: [W * 0.1, y0 + 4, top],
    shape: [plateR * 0.3, y0 + H - plateR * 0.3, top],
    layers: exploded ? [W * 0.9, y0 + 10, 10 + (LAYERS.length - 1) * 14] : [W * 0.95, y0 + H * 0.9, top],
  };
  const current = SPOTS.find((x) => x.id === spot)!;

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden inert className="xr-measure" style={{ zoom: oz }}>{still}</span>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 1.4, cursor: 'zoom-in' }}>{still}</div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: Hs * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: Hs, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />
              {scene}
              {SPOTS.map((s) => {
                const [x, y, zz] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${zz}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit]} />}
        <div className="xr-hint eng">{xray ? (spot === 'states' ? 'Drag the lit row in the card, or click a row here' : 'Pick an icon to learn about that part') : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, heading: o.heading, sep: o.sep, lit: o.lit }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <MenuSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <MenuCodePanel config={m} />}
    </div></HintLayer>
  );
}
