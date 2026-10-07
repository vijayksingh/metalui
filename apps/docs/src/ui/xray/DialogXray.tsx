import * as React from 'react';
import { Button, Dialog, Field, Surface } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, scalePx, tones, useFit, type LayerDef, type SpotDef, planeStyle } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { DialogSpecimenCard, arrive } from './DialogSpecimens';
import { DialogCodePanel } from './DialogCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · DIALOG (three layers deep: the page, a dimming sheet, the dialog)
 *
 *   solid     the dialog's plate: a title, the field, two actions
 *   x-ray     the page lies flat on the floor; a thin see-through sheet floats over it; the dialog
 *             floats above that, near the top, standing on a wall of slices. Its top face is the
 *             real plate (DialogFace: the library's own markup and classes), laid out at the table's
 *             zoom and scaled by transform, so the dialog that lands on it is the one that was on the
 *             table. Flown in, every part starts on one plane, then the sheet and the dialog rise.
 *   card      the real dialog in a small window, handled (DialogSpecimens.tsx):
 *             Sheet    drag on the sheet: how much it dims the page
 *             Opening  pull it up and let go: how far it drops in from
 *             Focus    drag the focus ring: Tab stays inside; Escape closes it
 *             Place    drag it up or down: near the top, not the middle
 *             Shadow   lift it: how high it floats
 *             Layers   a switch per layer
 *   code      under the card: the React, CSS and SwiftUI that open exactly this dialog (DialogCode.tsx)
 *   face      a real dialog opens from a trigger, modally, in a portal over the page: the library
 *             has no inline form of it. DialogFace is its popup rendered still, with the popup's own
 *             classes (mu-dialog, dialog-frame, the title and actions parts), so the table object,
 *             the model's face, every specimen and the real dialog the last row opens are one plate.
 * ───────────────────────────────────────────────────────── */

const D = tokens.recipes.dialog.props as {
  scrim: { color: Record<string, string> };
  self: { top: string; 'enter-y': number; 'enter-scale': string; width: number };
};
const alphaOf = (c: string) => Number(c.match(/,\s*([\d.]+)\)\s*$/)?.[1] ?? 1);
/** The scrim's colour with its alpha set to how much it dims. */
export const withAlpha = (c: string, a: number) => c.replace(/,\s*[\d.]+\)\s*$/, `, ${Math.round(a * 100) / 100})`);

/** The recipe's values, which are also the tokens each handle catches on. */
export const DIM = alphaOf(D.scrim.color.bone);
export const TOP = parseFloat(D.self.top);
export const RISE = Math.abs(D.self['enter-y']);
export const FROM = Number(D.self['enter-scale']);
export const WIDTH = D.self.width;

/** The window the model shows, in points: a page wide enough for the dialog to sit in, and the top it sits near. */
const PW = 520, PH = 340;
const S = 1.5;
const WALL = 5;
const SHEET_Z = 18;
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(tokens.springs.object.duration * 1000 * 0.55);

type Spot = 'surface' | 'states' | 'press' | 'shape' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'surface', title: 'Sheet', word: 'Dimming the page' },
  { id: 'states', title: 'Opening', word: 'How it arrives' },
  { id: 'press', title: 'Focus', word: 'Staying inside' },
  { id: 'shape', title: 'Place', word: 'Near the top' },
  { id: 'shadow', title: 'Shadow', word: 'Floating high' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  surface: ['left', 0.2], shape: ['left', 0.48], shadow: ['left', 0.76],
  layers: ['right', 0.2], states: ['right', 0.48], press: ['right', 0.76],
};

export const LAYERS: LayerDef[] = [
  { name: 'Plate', why: 'A light plate, a little lighter at the top. The same stuff as a card, so a dialog feels like a card lifted off the page.' },
  { name: 'Inner glow', why: 'A soft light just inside the edge.' },
  { name: 'Top light', why: 'A bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A faint dark edge along the bottom right.' },
  { name: 'Rim', why: 'A very thin outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Mid shadow', why: 'A larger soft shadow.' },
  { name: 'Far shadow', why: 'A very big, very faint shadow. Together they lift the dialog well above the page.' },
];
/** The plate's shadows that are its own edges (inset light and shade, the rim); the rest it casts. */
const EDGES = 4;

/** Everything a dialog is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface DialogConfig {
  /** props: what it asks, the field's text and its name, the two actions */
  title: string; value: string; label: string; cancel: string; confirm: string;
  /** --mu-r-dialog-scrim-color's alpha (page-wide: the scrim is portalled to the body), --mu-r-dialog-self-top in vh,
   *  --mu-r-dialog-self-enter-y in points, the plate's height above the page and which of its layers are on */
  dim: number; top: number; rise: number; lift: number; on: boolean[];
}
export type Model = DialogConfig;
export const INITIAL: DialogConfig = { title: 'Rename canvas', value: 'Trip notes', label: 'Name', cancel: 'Cancel', confirm: 'Rename', dim: DIM, top: TOP, rise: RISE, lift: 1, on: LAYERS.map(() => true) };
/** The things inside the dialog that take focus, in Tab order. */
export const focusable = (m: DialogConfig) => [m.label, m.cancel, m.confirm];

const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);
/** The plate material's fill and shadows for a colorway, in recipe order (the surface recipe keeps each material as a state). */
export function plateLayers(colorway: Colorway) {
  const ls = (tokens.recipes.surface.layers as { part: string; prop: string; value: string; colorway?: string; state?: string }[])
    .filter((l) => l.part === 'self' && l.state === 'plate' && (!l.colorway || l.colorway === colorway));
  return { fill: ls.find((l) => l.prop === 'background')?.value ?? 'transparent', shadows: ls.filter((l) => l.prop === 'shadow').map((l) => l.value) };
}

/** What a config looks like: the sheet's colour and the plate's fill and shadow stack for the model's hand-built
 *  parts, and the variables that set the real dialog to it. Only what differs from the recipe is set, so a default
 *  config is the dialog exactly as it ships. `style` goes on the popup (its place, its drop, its plate); `page` is
 *  the scrim, which the library portals to the body, so it has no per-instance form and is set page-wide. */
export function dialogLook(m: DialogConfig, colorway: Colorway) {
  const plate = plateLayers(colorway);
  const fill = m.on[0] ? plate.fill : 'transparent';
  const layers = plate.shadows.map((s, i) => (m.on[i + 1] ? (i >= EDGES ? scalePx(s, m.lift) : s) : null)).filter(Boolean) as string[];
  const shadow = layers.join(', ') || 'none';
  const edges = plate.shadows.slice(0, EDGES).filter((_, i) => m.on[i + 1]).join(', ') || 'none';
  const scrim = withAlpha(D.scrim.color[colorway] ?? D.scrim.color.bone, m.dim);
  const style: Record<string, string> = {};
  if (m.top !== INITIAL.top) style['--mu-r-dialog-self-top'] = `${m.top}vh`;
  if (m.rise !== INITIAL.rise) style['--mu-r-dialog-self-enter-y'] = `${-m.rise}px`;
  if (!m.on[0]) style['--mu-r-surface-self-plate-background'] = fill;
  if (m.lift !== INITIAL.lift || !same(m.on.slice(1), INITIAL.on.slice(1))) style['--mu-r-surface-self-plate-shadow'] = shadow;
  const page: Record<string, string> = {};
  if (m.dim !== INITIAL.dim) page['--mu-r-dialog-scrim-color'] = scrim;
  return { colorway, plate: plate.fill, fill, shadows: plate.shadows, shadow, edges, scrim, style: style as React.CSSProperties, page };
}
export function useDialogLook(m: DialogConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => dialogLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useDialogLook>;

/** The dialog's plate, still: the popup as the library renders it (its classes, title part, field and actions),
 *  set to a config. The table object, the model's face and every specimen are this. */
export const DialogFace = React.forwardRef<HTMLElement, {
  m: DialogConfig; look: Look; style?: React.CSSProperties; className?: string;
  /** which thing inside is ringed as focused, when the x-ray shows focus */
  focusAt?: number; refs?: React.MutableRefObject<(HTMLElement | null)[]>; onPick?: (i: number) => void;
}>(function DialogFace({ m, look, style, className, focusAt, refs, onPick }, ref) {
  const at = (i: number) => (el: HTMLElement | null) => { if (refs) refs.current[i] = el; };
  const cls = (i: number) => (focusAt === i ? 'is-focus' : undefined);
  return (
    <Surface ref={ref} material="plate" radius="card" className={['mu-dialog dialog-frame outline-none xr-dlg-face', className].filter(Boolean).join(' ')}
      role="group" aria-label={m.title} style={{ ...look.style, ...style }}>
      <h2 className="mu-dialog-title type-title text-ink">{m.title}</h2>
      <Field size="regular" ref={at(0)} className={cls(0)} onClick={() => onPick?.(0)}><Field.Input defaultValue={m.value} aria-label={m.label} readOnly tabIndex={-1} /></Field>
      <Dialog.Actions>
        <Button ref={at(1) as React.Ref<HTMLButtonElement>} tabIndex={-1} className={cls(1)} onClick={() => onPick?.(1)}>{m.cancel}</Button>
        <Button ref={at(2) as React.Ref<HTMLButtonElement>} tabIndex={-1} cap="primary" className={cls(2)} onClick={() => onPick?.(2)}>{m.confirm}</Button>
      </Dialog.Actions>
    </Surface>
  );
});

/** The real dialog for a config: what the code under the card builds, opened modally. The scrim's colour is
 *  page-wide, so it goes on the root while this is open, the way the code's stylesheet sets it. */
function RealDialog({ m, look, open, onOpenChange }: { m: DialogConfig; look: Look; open: boolean; onOpenChange: (v: boolean) => void }) {
  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(look.page)) root.style.setProperty(k, v);
    return () => { for (const k of Object.keys(look.page)) root.style.removeProperty(k); };
  }, [open, look.page]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup aria-label={m.title} style={look.style} data-testid="dialog-xray-real">
        <Dialog.Title>{m.title}</Dialog.Title>
        <Field size="regular"><Field.Input defaultValue={m.value} aria-label={m.label} /></Field>
        <Dialog.Actions>
          <Button onClick={() => onOpenChange(false)}>{m.cancel}</Button>
          <Button cap="primary" onClick={() => onOpenChange(false)}>{m.confirm}</Button>
        </Dialog.Actions>
      </Dialog.Popup>
    </Dialog>
  );
}

export function DialogXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<DialogConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('surface');
  const [m, setM] = React.useState<DialogConfig>(() => ({ ...INITIAL, ...seed }));
  const [open, setOpen] = React.useState(true);
  const [cycle, setCycle] = React.useState(0);
  const [focusAt, setFocusAt] = React.useState(0);
  const [real, setReal] = React.useState(false);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<DialogConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useDialogLook(m);
  const bench = React.useRef<HTMLDivElement>(null);

  // the dialog's box, measured on an unseen copy at the object's own zoom (so fractions of a point survive)
  const measure = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState({ W: WIDTH, H: 0 });
  React.useLayoutEffect(() => {
    const el = measure.current; if (!el) return;
    const read = () => { const d = el.querySelector<HTMLElement>('.mu-dialog'); if (!d) return; const b = d.getBoundingClientRect(); setBox({ W: b.width / oz, H: b.height / oz }); };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    document.fonts?.ready.then(read);
    return () => ro.disconnect();
  }, [m, look, oz]);

  const flat = pose === 'flat';
  // the model closes up before it flies home: the dialog it lands as is open
  React.useEffect(() => { if (flat) setOpen(true); }, [flat]);
  const W = PW * S, H = PH * S, DW = box.W * S, DH = box.H * S, R = tokens.recipes.surface.props.radius.card * S;
  const dx = ((PW - box.W) / 2) * S, dy = ((PH * m.top) / 100) * S;
  const zDialog = 36 + m.lift * 24;
  const top = zDialog + WALL * 1.4;
  const exploded = spot === 'layers' && !flat;
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const reopen = React.useCallback(() => { setOpen(true); setCycle((n) => n + 1); setFocusAt(0); }, []);
  // the bench arrives the way the dialog does: from the drop above, on the surface spring
  const wrap = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (cycle) arrive(wrap.current, m.rise * S); }, [cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's face is the dialog laid out at the object's own zoom, then scaled: the same box, to the pixel.
  // The zoom scales its height above the floor too, so that is laid out in the zoomed frame (a table zoom under 1 would sink it into the wall)
  const face = (z: number) => planeStyle(z, S, oz);
  // landed flat it is the object as it is; risen, the face keeps the edges that are its own and casts the rest on the sheet
  const faceStyle: React.CSSProperties = flat ? {} : { ['--mu-r-surface-self-plate-shadow' as string]: look.edges };
  const rise = 'transform var(--spring-object-d) var(--spring-object), opacity var(--spring-object-d) var(--spring-object)';
  /** The shadows the plate casts, on the sheet: contact, near, mid and far, each read off the recipe's own
   *  offset, blur, spread and alpha, scaled by the height (a negative spread draws the blot in). */
  const casts = look.shadows.slice(EDGES).map((s, i) => {
    const [x, y, blur, spread] = s.split(/\s+/).slice(0, 4).map((v) => parseFloat(v) || 0);
    const k = m.lift * S;
    return { on: m.on[EDGES + 1 + i], x: x * k, y: y * k, blur: blur * k * 0.5, scale: Math.max(0.5, 1 + (2 * spread * k) / Math.min(DW, DH || DW)), a: alphaOf(s) * 1.6 };
  });

  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.12, H * 0.85, SHEET_Z],
    states: [dx + DW * 0.9, dy + 6, top],
    press: [dx + DW * 0.8, dy + DH * 0.8, top + 1],
    shape: [dx + 4, dy, top],
    shadow: [dx + DW * 0.5, dy + DH + 10, SHEET_Z + 1],
    layers: exploded ? [dx + DW * 0.9, dy + 8, 30 + (LAYERS.length - 1) * 14] : [dx + DW * 0.1, dy + DH * 0.9, top],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <span ref={measure} aria-hidden inert className="xr-measure" style={{ zoom: oz }}><DialogFace m={m} look={look} /></span>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 1.2, cursor: 'zoom-in' }}><DialogFace m={m} look={look} /></div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />
              {/* the page: a floor too (scenery the copy never lands on), its lines of text under the sheet */}
              <div className="xr-floor xr-dlg-page" style={{ width: W, height: H, borderRadius: 18 * S }}>
                <span className="xr-dlg-lines" style={{ padding: 24 * S, gap: 10 * S }}>{[0.8, 0.55, 0.7, 0.4, 0.65, 0.5].map((w, i) => <i key={i} style={{ width: `${w * 100}%`, height: 6 * S }} />)}</span>
              </div>

              {exploded
                ? <Exploded layers={LAYERS} on={m.on} fill={look.plate} shadows={look.shadows} x={dx} y={dy} w={DW} h={DH} r={R} z0={30} gap={14} focus={focus} scale={S} />
                : (
                  <div key={cycle} ref={wrap} className="xr-dlg-wrap">
                    {/* the sheet: a shade over the page (the copy never lands on it); it appears as the model opens */}
                    {open && <div className="xr-shadow xr-dlg-sheet" style={{ width: W, height: H, borderRadius: 18 * S, background: look.scrim, opacity: flat ? 0 : 1, transform: `translateZ(${flat ? 0.6 : SHEET_Z}px)` }} onClick={() => setOpen(false)} />}
                    {/* the shadows the dialog casts fall on the sheet, not the page */}
                    {open && casts.map((c, i) => c.on && (
                      <div key={i} className="xr-shadow" style={{ left: dx, top: dy, width: DW, height: DH, borderRadius: R, filter: `blur(${c.blur}px)`, opacity: flat ? 0 : c.a, transform: `translate(${c.x}px, ${c.y}px) translateZ(${SHEET_Z + 0.5 + i * 0.1}px) scale(${c.scale})` }} />
                    ))}
                    {open && (
                      <div className="xr-thumb" style={{ transform: `translate(${dx}px, ${dy}px)` }}>
                        {/* the plate's side wall: slices that rise from the sheet to the face */}
                        {Array.from({ length: WALL }, (_, i) => (
                          <div key={i} className="xr-slice" style={{ width: DW, height: DH, borderRadius: R, transition: rise, opacity: flat ? 0 : 1, transform: `translateZ(${flat ? 0 : zDialog + i * 1.4}px)`, background: i === 0 || !m.on[0] ? 'transparent' : t.wall }} />
                        ))}
                        {/* the top: the real plate. Only the picture: the specimen is the one to handle */}
                        <div className="xr-segface is-top" aria-hidden inert style={face(flat ? 1 : top)}>
                          <DialogFace m={m} look={look} style={faceStyle} focusAt={spot === 'press' && !flat ? focusAt : undefined} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {SPOTS.map((s) => {
                const [x, y, z] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, open, box, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Open the x-ray to see inside it'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => { setM((o) => ({ ...INITIAL, title: o.title, value: o.value, label: o.label, cancel: o.cancel, confirm: o.confirm })); reopen(); }}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <DialogSpecimenCard spot={spot} m={m} set={set} look={look} layers={LAYERS} focus={setFocus}
            open={open} setOpen={setOpen} focusAt={focusAt} setFocusAt={setFocusAt} replay={reopen} real={real} setReal={setReal} />
        </div>
      )}
      {xray && <DialogCodePanel config={m} />}
      <RealDialog m={m} look={look} open={real} onOpenChange={setReal} />
    </div></HintLayer>
  );
}
