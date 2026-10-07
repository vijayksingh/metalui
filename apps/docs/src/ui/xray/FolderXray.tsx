import * as React from 'react';
import { Folder, type FolderHue, type FolderPeek } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Glyph, useFit, type LayerDef, type SpotDef, planeStyle } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { FolderSpecimenCard } from './FolderSpecimens';
import { FolderCodePanel } from './FolderCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · FOLDER (an object: a pocket that holds blocks)
 *
 *   solid     the real folder with three blocks peeking out
 *   x-ray     the folder taken apart on the gridded floor. Every plane is the real Folder, laid out
 *             at the table's zoom and scaled by transform, with the parts that are not that plane's
 *             hidden: the paper back with its tab and edge on the floor, the blocks fanned above
 *             it, and the frosted flap highest, with the name and the count. Flown in, it lands as
 *             one whole folder (the object itself), then the blocks and the flap rise off the back.
 *   card      the real folder, handled (FolderSpecimens):
 *             Drop in  point at it, drag a block onto it: it opens, takes it and shuts
 *             Paper    drag the tab sideways through its six colours (steps)
 *             Fan      drag the front block to set how far the blocks rise and lean
 *             Flap     drag the flap's top edge to tilt it
 *             Glass    drag across the flap: sideways for frost, up or down to see through
 *             Layers   a switch per layer of its material
 *   code      under the card: the React and SwiftUI for exactly this config (FolderCode.tsx)
 * ───────────────────────────────────────────────────────── */

type ByColorway = { bone: string; graphite: string };
const R = tokens.recipes.folder as unknown as {
  props: {
    self: { width: number; height: number };
    back: { height: number; radius: number; 'tab-width': number; 'tab-rise': number; taper: number };
    hue: Record<string, ByColorway>;
    card: { width: number; height: number; radius: number; bottom: number; thumb: number };
    flap: { height: number; radius: number; taper: number; rest: string; hover: string; open: string; frost: string; 'fill-opacity': ByColorway };
    count: { size: number };
    fan: Record<string, string>;
  };
};
export const FP = R.props;
export const HUES: FolderHue[] = ['neutral', 'red', 'amber', 'green', 'blue', 'violet'];
const OBJECT = tokens.springs.object as { duration: number };
const deg = (v: string) => parseFloat(v);
export const FOLDER_TOKENS = {
  flap: deg(FP.flap.rest), hover: deg(FP.flap.hover), open: deg(FP.flap.open),
  lift: parseFloat(FP.fan['rest-y-front']), lean: deg(FP.fan['rest-r-front']),
  frost: Number(FP.flap.frost.match(/blur\(([\d.]+)px\)/)?.[1]),
  see: (cw: Colorway) => Number(FP.flap['fill-opacity'][cw]),
};
const S = 1.6;

/** The layers of the folder's material, each reached through the recipe variables the library reads.
 *  The blocks are not here: they are what it holds (its peeks), handled on the Drop in card. */
export const LAYERS: LayerDef[] = [
  { name: 'Shadow', why: 'A soft shadow in the folder\'s outline, under the pocket and under the flap. It sits on the canvas like paper.' },
  { name: 'Back paper', why: 'The back of the pocket, with its tab. Soft paper in the folder\'s colour, a little see-through, so the canvas shows softly behind it.' },
  { name: 'Edge', why: 'A hairline around the paper and the flap, and a bright line along their tops, where the light catches the fold.' },
  { name: 'Frost', why: 'The flap is frosted glass: the blocks behind it blur, so the name in front stays easy to read.' },
  { name: 'Flap tint', why: 'A see-through fill in the paper\'s colour over the frost, so the flap belongs to the same folder.' },
  { name: 'Count chip', why: 'A small raised chip the count sits in, on the flap.' },
];
const L = { shadow: 0, paper: 1, edge: 2, frost: 3, tint: 4, count: 5 } as const;

/** The folder's name on the table. */
export const NAME = 'poster refs';
export const PEEKS: FolderPeek[] = [
  { id: 'poster', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'type', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'night', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623)' },
];
/** Blocks to drop in, in turn. */
export const MORE: FolderPeek[] = [
  { thumb: 'linear-gradient(135deg,#F7D774,#D99A1E 55%,#8C5A12)' },
  { thumb: 'linear-gradient(135deg,#C9B6F2,#6E54C9)', link: true },
  { thumb: 'linear-gradient(135deg,#9AD8C0,#2E8C6A)' },
];

/** Everything a folder is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface FolderConfig {
  /** props: its name, what it holds (up to six peek out as cards, front last) and how many, its paper */
  name: string; count: number; peeks: FolderPeek[]; hue: FolderHue;
  /** recipe values: the flap's tilt at rest, the front block's rise and lean, the frost; how much the tint lets through, or the colorway's own when null */
  flap: number; lift: number; lean: number; frost: number; see: number | null;
  /** which layers of its material are on */
  on: boolean[];
}
export type Model = FolderConfig;
export const INITIAL: FolderConfig = {
  name: NAME, count: PEEKS.length, peeks: PEEKS, hue: 'neutral',
  flap: FOLDER_TOKENS.flap, lift: FOLDER_TOKENS.lift, lean: FOLDER_TOKENS.lean, frost: FOLDER_TOKENS.frost, see: null,
  on: LAYERS.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);
export const seeOf = (m: FolderConfig, cw: Colorway) => m.see ?? FOLDER_TOKENS.see(cw);

/** What a config looks like: the variables that set the real folder to it, and only the ones that differ
 *  from the recipe, so a default config is the folder exactly as it ships and the variables are the
 *  overrides its code needs. A layer off is the recipe value that leaves it out. */
export function folderLook(m: FolderConfig, colorway: Colorway) {
  const style: Record<string, string> = {};
  if (m.flap !== INITIAL.flap) style['--mu-r-folder-flap-rest'] = `${m.flap}deg`;
  if (m.lift !== INITIAL.lift) style['--mu-r-folder-fan-rest-y-front'] = `${m.lift}px`;
  if (m.lean !== INITIAL.lean) style['--mu-r-folder-fan-rest-r-front'] = `${m.lean}deg`;
  if (!m.on[L.frost]) style['--mu-r-folder-flap-frost'] = 'none';
  else if (m.frost !== INITIAL.frost) style['--mu-r-folder-flap-frost'] = FP.flap.frost.replace(/blur\([\d.]+px\)/, `blur(${m.frost}px)`);
  if (!m.on[L.tint]) style['--mu-r-folder-flap-fill-opacity'] = '0';
  else if (m.see !== null) style['--mu-r-folder-flap-fill-opacity'] = `${m.see}`;
  if (!m.on[L.shadow]) style['--mu-r-folder-shade-ink'] = 'transparent';
  if (!m.on[L.paper]) style['--mu-r-folder-shape-translucency'] = '0%';
  if (!m.on[L.edge]) { style['--mu-r-folder-shape-edge'] = 'transparent'; style['--mu-r-folder-shape-light'] = 'transparent'; }
  if (!m.on[L.count]) { style['--mu-r-folder-count-background'] = 'transparent'; style['--mu-r-folder-count-shadow'] = 'none'; }
  return { colorway, see: seeOf(m, colorway), top: FP.hue[`${m.hue}-top`][colorway], style: style as React.CSSProperties };
}
export function useFolderLook(m: FolderConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => folderLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useFolderLook>;

/** The real folder set to a config: the table's object, the flying copy, the model's planes and the specimens
 *  are all this. A still one takes no pointer (it rests while you handle it) and no focus. */
export function FolderFace({ m, look, open, landed, className, still }: { m: FolderConfig; look: Look; open?: boolean; landed?: number; className?: string; still?: boolean }) {
  return (
    <div className={['ed-folder', still ? 'is-still' : '', className].filter(Boolean).join(' ')}>
      <Folder name={m.name} count={m.count} peeks={m.peeks} hue={m.hue} open={open} landed={landed} tabIndex={still ? -1 : 0} style={look.style} />
    </div>
  );
}

/* The planes the model takes the folder apart into, by the parts of the real folder each keeps
 * (folder-specimens.css hides the rest): the back with its edge on the floor, the blocks above it, and
 * the flap, its shadow, its frost, its tint, its name and its count highest. */
const PLANES = [
  { id: 'back', keep: 'shade back frame', z: 1 },
  { id: 'cards', keep: 'cards', z: 16 },
  { id: 'flap', keep: 'flapshade frost fill flapedge label count', z: 34 },
] as const;
/** Pulled apart: one plane per layer of its material, and one for the blocks between them. */
const PARTS: { name: string; keep: string; layer?: number }[] = [
  { name: LAYERS[L.shadow].name, keep: 'shade flapshade', layer: L.shadow },
  { name: LAYERS[L.paper].name, keep: 'back', layer: L.paper },
  { name: LAYERS[L.edge].name, keep: 'frame flapedge', layer: L.edge },
  { name: 'Blocks', keep: 'cards' },
  { name: LAYERS[L.frost].name, keep: 'frost', layer: L.frost },
  { name: LAYERS[L.tint].name, keep: 'fill label', layer: L.tint },
  { name: LAYERS[L.count].name, keep: 'count', layer: L.count },
];
const GAP = 22;

type Spot = 'states' | 'surface' | 'thumb' | 'slide' | 'light' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'Drop in', word: 'Putting a block in' },
  { id: 'surface', title: 'Paper', word: 'Six soft colours' },
  { id: 'thumb', title: 'Fan', word: 'The blocks peeking out' },
  { id: 'slide', title: 'Flap', word: 'The glass front' },
  { id: 'light', title: 'Glass', word: 'Frost and see-through' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], thumb: ['left', 0.48], states: ['left', 0.76],
  slide: ['right', 0.2], light: ['right', 0.48], layers: ['right', 0.76],
};

export function FolderXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<FolderConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<FolderConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<FolderConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useFolderLook(m);
  const bench = React.useRef<HTMLDivElement>(null);

  const Wp = FP.self.width, Hp = FP.self.height;
  const W = Wp * S, H = Hp * S;
  const flat = pose === 'flat';
  // the layers come apart only with the model open: landed or leaving, the folder is one thing
  const exploded = spot === 'layers' && !flat;
  const fit = useFit(bench, W, H, xray);
  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's planes are the folder laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => planeStyle(z, S, oz);
  const plane = (key: string, keep: string, z: number, cls = '') => (
    <div key={key} className={`xr-segface xr-fplane ${cls}`} aria-hidden inert data-keep={keep} style={face(z)}><FolderFace m={m} look={look} still /></div>
  );

  // where the parts are, in the model's points: the tab, the front block, the flap's top edge
  const backTop = (Hp - FP.back.height - FP.back['tab-rise']) * S;
  const cardTop = (Hp - FP.card.bottom - FP.card.height + m.lift) * S;
  const flapTop = (Hp - FP.flap.height * Math.cos((m.flap * Math.PI) / 180)) * S;
  const zOf = (id: (typeof PLANES)[number]['id']) => (flat ? 1 : PLANES.find((p) => p.id === id)!.z);
  const anchors: Record<Spot, [number, number, number]> = {
    states: [W * 0.5, cardTop + FP.card.height * S * 0.5, zOf('cards')],
    surface: [FP.back['tab-width'] * S * 0.4, backTop + 6, zOf('back')],
    thumb: [W * 0.5, cardTop + 10, zOf('cards')],
    slide: [W * 0.8, flapTop, zOf('flap')],
    light: [W * 0.3, H - FP.flap.height * S * 0.5, zOf('flap')],
    layers: exploded ? [W * 0.85, backTop + 20, 1 + (PARTS.length - 1) * GAP] : [W * 0.9, H - 20, zOf('flap')],
  };

  return (
    <HintLayer><div className="xr folder-xray" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 1.4, cursor: 'zoom-in', paddingTop: 40 }}><FolderFace m={m} look={look} still /></div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {exploded ? (
                // each part on its own plane, with a layer box at the same height that carries its tag
                PARTS.flatMap((p, i) => {
                  const on = p.layer === undefined || m.on[p.layer];
                  const cls = ['is-layer', focus === p.name ? 'is-focus' : '', on ? '' : 'is-off'].join(' ');
                  const z = 1 + i * GAP;
                  return [
                    plane(p.name, p.keep, z, cls),
                    <div key={`${p.name} tag`} className={`xr-face ${cls}`} style={{ width: W, height: H, borderRadius: FP.back.radius * S, transform: `translateZ(${z}px)` }}><span className="xr-tag eng">{p.name}</span></div>,
                  ];
                })
              ) : (
                // landed flat, the first plane is the whole folder and the others wait inside it; open, each keeps its own parts and rises
                PLANES.map((p, i) => plane(p.id, flat ? (i === 0 ? 'all' : '') : p.keep, flat ? 1 + i * 0.02 : p.z, `is-f${p.id}`))
              )}

              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, fit, flat]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM((o) => ({ ...INITIAL, name: o.name, count: o.count, peeks: o.peeks, hue: o.hue }))}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <FolderSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} />
        </div>
      )}
      {xray && <FolderCodePanel config={m} />}
    </div></HintLayer>
  );
}
