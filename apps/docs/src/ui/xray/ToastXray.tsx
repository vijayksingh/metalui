import * as React from 'react';
import { Button, Kbd, ToastProvider, toastParts as T, useToast, type ToastTone } from '@unlocalhosted/metalui';
import { Icon, MorphIcon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { useColorway, type Colorway } from '../../app/colorway';
import { Callouts, Exploded, Glyph, Proof, recipeLayers, scalePx, tones, useFit, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { ToastSpecimenCard } from './ToastSpecimens';
import { ToastCodePanel } from './ToastCode';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOAST
 *
 *   solid     a toast: its kind's glyph, "Moved 3 blocks · undo it any time", an Undo cap with
 *             its ⌘Z key, and the quiet close key
 *   x-ray     a glass pill floating over the gridded floor on its own shadow; the Undo cap stands
 *             on the glass. The pill and the cap are the real toast itself, twice: a copy with its
 *             cap hidden floats at the pill's height, and a raised copy with everything but its cap
 *             turned off stands above it. Flown in, both start on one plane (the object that
 *             landed), then part.
 *   card      the real toast, handled (ToastSpecimens): pull it down to where it rises from,
 *             scrub how long it stays, turn the glyph through the kinds, widen the space before
 *             the detail, press Undo, drag either end for its spacing, lift it; switches for the
 *             detail, Undo, its key and each layer
 *   code      under the card: how this exact toast is raised, in React and SwiftUI, with the
 *             variables that set the recipe to what you tuned (ToastCode.tsx)
 *
 *   A toast is transient: raised by a call, drawn in a portal at the bottom, gone on its timer.
 *   What stands on the table, on the bench and in the card is a still of it, built from the
 *   library's own part classes and glyphs (toastParts), so it is the live card part for part;
 *   the code under the card is the call that raises the live one.
 * ───────────────────────────────────────────────────────── */

type Ink = { bone: string; graphite: string };
const R = tokens.recipes.toast as { props: { self: { height: number; 'pad-left': number; 'pad-right': number; gap: number; ink: Ink; rise: number; scale: string }; text: { gap: number }; undo: { height: number } } };
const P = R.props;
const STAYS = tokens.toast as { 'undo-ms': number; 'plain-ms': number };
const PRESS = parseFloat((tokens.motion as { press: { value: string } }).press.value);
const OBJECT = tokens.springs.object as { duration: number };
const S = 2.4;
/** The pill's and the cap's walls, in slices. */
const PILL_WALL = 3;
const CAP_WALL = 2;
/** The toast's words: what happened, then the detail. */
export const TITLE = 'Moved 3 blocks';
export const SUB = 'undo it any time';
export const TONES: ToastTone[] = ['default', 'success', 'error'];

export type Spot = 'states' | 'type' | 'press' | 'shape' | 'shadow' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'states', title: 'Timing', word: 'Coming and going' },
  { id: 'type', title: 'Type', word: 'What happened' },
  { id: 'press', title: 'Undo', word: 'The way back' },
  { id: 'shape', title: 'Shape', word: 'Size and spacing' },
  { id: 'shadow', title: 'Shadow', word: 'Floating' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  states: ['left', 0.2], type: ['left', 0.48], shape: ['left', 0.76],
  layers: ['right', 0.2], press: ['right', 0.48], shadow: ['right', 0.76],
};

export const PILL: LayerDef[] = [
  { name: 'Glass', why: 'A slightly see-through fill in the colorway. It is the same glass as the toolbar, so you know it belongs to the app, not to your page.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge.' },
  { name: 'Top light', why: 'A soft bright edge along the top left.' },
  { name: 'Bottom shade', why: 'A soft dark edge along the bottom right.' },
  { name: 'Rim', why: 'A thin dark outline.' },
  { name: 'Contact', why: 'A small shadow.' },
  { name: 'Near shadow', why: 'A bigger soft shadow.' },
  { name: 'Far shadow', why: 'A very big soft shadow. The toast floats over everything on the page.' },
];
// the cap's names differ from the pill's, so pointing at one lights only its own slice
export const UNDO: LayerDef[] = [
  { name: 'Cap fill', why: 'The Undo cap is lighter than the glass, so it stands out as the one thing you can press.' },
  { name: 'Cap top light', why: 'A thin bright line on top. It shows the cap is raised.' },
  { name: 'Cap rim', why: 'A thin dark outline around the cap.' },
];

/** Everything a toast is set to: the options of the call that raises it first, then what the x-ray
 *  lets you tune. One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface ToastConfig {
  /** the call's options: a detail after the dot, Undo, its ⌘Z key, the kind, and how long it stays (null: the kind's own) */
  sub: boolean; undo: boolean; key: boolean; tone: ToastTone; timeout: number | null;
  /** recipe values: --mu-r-toast-self-* and --mu-r-toast-text-gap */
  padL: number; padR: number; textGap: number; rise: number; scale: number;
  /** the pill's and the cap's shadow stacks, as a lift and which layers are on */
  lift: number; pill: boolean[]; cap: boolean[];
}
export type Model = ToastConfig;
export const INITIAL: ToastConfig = {
  sub: true, undo: true, key: true, tone: 'default', timeout: null,
  padL: P.self['pad-left'], padR: P.self['pad-right'], textGap: P.text.gap, rise: P.self.rise, scale: Number(P.self.scale),
  lift: 1, pill: PILL.map(() => true), cap: UNDO.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(OBJECT.duration * 1000 * 0.55);

/** How long a config's toast stays by its kind, in ms: an error never, with Undo longer than without. */
export const ownStay = (m: Pick<ToastConfig, 'tone' | 'undo'>) => (m.tone === 'error' ? 0 : m.undo ? STAYS['undo-ms'] : STAYS['plain-ms']);
const same = (a: boolean[], b: boolean[]) => a.every((v, i) => v === b[i]);

/** What a config looks like: the pill's and the cap's fill and shadows for the model's hand-built parts, and
 *  the variables that set the real toast to it. Only what differs from the recipe is set, so a default
 *  config is the toast exactly as it ships, and the variables are the overrides its code needs. */
export function toastLook(m: ToastConfig, colorway: Colorway) {
  const pill = recipeLayers('toast', 'self', colorway);
  const cap = recipeLayers('toast', 'undo', colorway);
  // the outer shadows (contact, near, far) follow the lift; the insets and the rim are the glass itself
  const outerFrom = pill.shadows.findIndex((v) => !v.startsWith('inset') && !/^0 0 0 /.test(v));
  const pillShadow = pill.shadows.map((v, i) => (!m.pill[i + 1] ? null : i >= outerFrom ? (m.lift > 0 ? scalePx(v, m.lift) : null) : v)).filter(Boolean).join(', ') || 'none';
  const capShadow = cap.shadows.filter((_, i) => m.cap[i + 1]).join(', ') || 'none';
  const look = {
    colorway, pillRaw: pill, capRaw: cap,
    pillFill: m.pill[0] ? pill.fill : 'transparent',
    capFill: m.cap[0] ? cap.fill : 'transparent',
    pillShadow, capShadow,
  };
  const style: Record<string, string> = {};
  if (m.padL !== INITIAL.padL) style['--mu-r-toast-self-pad-left'] = `${m.padL}px`;
  if (m.padR !== INITIAL.padR) style['--mu-r-toast-self-pad-right'] = `${m.padR}px`;
  if (m.textGap !== INITIAL.textGap) style['--mu-r-toast-text-gap'] = `${m.textGap}px`;
  if (m.rise !== INITIAL.rise) style['--mu-r-toast-self-rise'] = `${m.rise}px`;
  if (m.scale !== INITIAL.scale) style['--mu-r-toast-self-scale'] = String(m.scale);
  // a fill changes only with its own layer; a shadow stack with the lift or any of its layers
  if (!m.pill[0]) style['--mu-r-toast-self-background'] = look.pillFill;
  if (m.lift !== INITIAL.lift || !same(m.pill.slice(1), INITIAL.pill.slice(1))) style['--mu-r-toast-self-shadow'] = pillShadow;
  if (!m.cap[0]) style['--mu-r-toast-undo-background'] = look.capFill;
  if (!same(m.cap.slice(1), INITIAL.cap.slice(1))) style['--mu-r-toast-undo-shadow'] = capShadow;
  return { ...look, style: style as React.CSSProperties };
}
export function useToastLook(m: ToastConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => toastLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useToastLook>;

/** The toast set to a config, standing still: the object on the table, the model's faces, the specimen
 *  in every card. It is the live card part for part, from the library's own part classes and glyphs
 *  (toastParts); only the title is a plain span, because the live card's drum exists to turn words
 *  and at rest it is this. Its config reaches it the way a host sets the recipe: the variables. */
export const ToastObject = React.forwardRef<HTMLDivElement, {
  config: ToastConfig; style?: React.CSSProperties; className?: string;
  /** a handle laid in the space before the detail */
  gap?: React.ReactNode;
  /** a handle on the Undo cap */
  cap?: React.HTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> };
  /** the Undo cap held down */
  down?: boolean;
}>(function ToastObject({ config: m, style, className, gap, cap, down }, ref) {
  const look = useToastLook(m);
  const said = `${TITLE}${m.sub ? ` · ${SUB}` : ''}${m.undo ? ', with Undo' : ''}`;
  return (
    <div ref={ref} className={`${T.TOAST} ed-toast ${className ?? ''}`} role="img" aria-label={`Toast: ${said}`} data-type={m.tone} style={{ ...look.style, ...style }}>
      <div className={T.CONTENT}>
        <span className={T.TEXT}>
          <MorphIcon name={T.GLYPH[m.tone]} size={14} className={T.GLYPH_INK[m.tone]} />
          <span>{TITLE}</span>
          {m.sub && <span className={`${T.SUB} ed-toast-sub`}>{gap}· {SUB}</span>}
        </span>
        {m.undo && (
          <button type="button" tabIndex={-1} aria-hidden {...cap} className={`${T.UNDO} ed-toast-cap`} style={down ? { translate: `0 ${PRESS}px` } : undefined}>
            Undo {m.key && <Kbd surface="plain" className={T.KEY}>⌘Z</Kbd>}
          </button>
        )}
        <button type="button" tabIndex={-1} aria-hidden className={T.CLOSE}><Icon name="close" size={14} animate={false} /></button>
      </div>
    </div>
  );
});

/** The proof: a button that raises exactly this toast, through the library. */
function RealToast({ m }: { m: ToastConfig }) {
  const toast = useToast();
  return <Button onClick={() => toast.show({ title: TITLE, sub: m.sub ? SUB : undefined, undo: m.undo ? () => {} : undefined, undoShortcut: m.key, tone: m.tone, timeout: m.timeout ?? undefined })}>Show a real toast</Button>;
}

/** The real toast's box and its Undo cap's, in its own points, read off the model's top copy. */
interface Box { W: number; H: number; ux: number; uy: number; uw: number; uh: number }
const NO_BOX: Box = { W: 0, H: 0, ux: 0, uy: 0, uw: 0, uh: 0 };

export function ToastXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<ToastConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('states');
  const [m, setM] = React.useState<ToastConfig>(() => ({ ...INITIAL, ...seed }));
  const [focus, setFocus] = React.useState<string | null>(null);
  const [cycle, setCycle] = React.useState(0);
  const [held, setHeld] = React.useState(false); // the toast held where it rises from
  const [pressed, setPressed] = React.useState(false);
  const set = React.useCallback((p: Partial<ToastConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useToastLook(m);
  const exploded = spot === 'layers';
  const bench = React.useRef<HTMLDivElement>(null);
  const top = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box>(NO_BOX);
  React.useLayoutEffect(() => {
    const el = top.current; if (!el) return;
    const read = () => {
      if (!el.isConnected) return;
      const toast = el.querySelector<HTMLElement>('.mu-toast'), undo = toast?.querySelector<HTMLElement>('.mu-toast-undo');
      if (!toast) return;
      setBox({ W: toast.offsetWidth, H: toast.offsetHeight, ux: undo?.offsetLeft ?? 0, uy: undo?.offsetTop ?? 0, uw: undo?.offsetWidth ?? 0, uh: undo?.offsetHeight ?? 0 });
    };
    read();
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [xray, exploded, cycle, m.sub, m.undo, m.key, m.tone, m.padL, m.padR, m.textGap]);

  // geometry in points, then scaled
  const W = box.W * S, H = box.H * S;
  const ux = box.ux * S, uy = box.uy * S, uw = box.uw * S, uh = box.uh * S;
  const flat = pose === 'flat';
  // the pill floats: higher with the lift; the cap stands on it, and sinks when pressed
  const pillZ = 4 + m.lift * 18;
  const pillTop = pillZ + PILL_WALL * 1.4;
  const capZ = pressed ? 0.2 : 1.6;
  const capTop = pillTop + capZ + CAP_WALL * 1.4;
  const fit = useFit(bench, W, H, xray);
  const t = tones(look.colorway);
  const rise = 'transform var(--spring-object-d) var(--spring-object), opacity .25s';
  const sink = 'transform 50ms linear';

  const current = SPOTS.find((x) => x.id === spot)!;
  const still = (down?: boolean) => <ToastObject config={m} down={down} />;
  // the model's faces are the toast laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (z: number) => ({ transform: `translateZ(${z}px) scale(${S / oz})`, zoom: oz });
  const explodedCapZ = 4 + PILL.length * 14 + 10;

  const replay = () => setCycle((n) => n + 1);
  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 1.6, cursor: 'zoom-in' }}>{still()}</div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {!exploded && (
                // the whole body arrives together: held where it rises from, or playing the arrival
                <div key={cycle} className={cycle && !held ? 'xr-toastwrap ed-toast-benchin' : 'xr-toastwrap'} data-held={held ? '' : undefined}
                  style={{ ['--rise' as string]: `${m.rise * S}px`, ['--from' as string]: m.scale, transform: held ? `translate3d(0, ${m.rise * S}px, 0) scale(${m.scale})` : undefined }}>
                  {/* its shadow on the floor, softer and farther with the lift */}
                  {m.pill[7] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: H / 2, filter: `blur(${10 + m.lift * 10}px)`, opacity: flat ? 0 : 0.3, transform: `translate(${m.lift * 8}px, ${m.lift * 18}px)` }} />}
                  {/* the pill: its wall, then the real toast with its cap hidden. Flat, the top copy is the whole object
                      by itself, so the pill copy waits out of sight: its glass would paint twice through the top copy's clear parts */}
                  <div className="xr-thumb">
                    {Array.from({ length: PILL_WALL }, (_, i) => (
                      <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: H / 2, opacity: flat ? 0 : 1, transition: rise, transform: `translateZ(${flat ? 0 : pillZ + i * 1.4}px)`, background: i === 0 || !m.pill[0] ? 'transparent' : t.wall }} />
                    ))}
                    <div className="xr-segface is-well" aria-hidden inert style={{ ...face(flat ? 0.5 : pillTop), visibility: flat ? 'hidden' : undefined }}>{still()}</div>
                  </div>
                  {/* the cap: its wall stands on the glass, under the real cap */}
                  {m.undo && (
                    <div className="xr-thumb" style={{ transform: `translate(${ux}px, ${uy}px)` }}>
                      {Array.from({ length: CAP_WALL }, (_, i) => (
                        <div key={i} className="xr-slice" style={{ width: uw, height: uh, borderRadius: uh / 2, opacity: flat ? 0 : 1, transition: pressed ? sink : rise, transform: `translateZ(${flat ? 0 : pillTop + capZ + i * 1.4}px)`, background: i === 0 || !m.cap[0] ? 'transparent' : t.rim }} />
                      ))}
                    </div>
                  )}
                  {/* the top: the real toast, raised; once the pill has gone down, everything but its cap is turned off */}
                  <div ref={top} className={flat ? 'xr-segface is-top' : 'xr-segface is-top is-raised'} style={{ ...face(flat ? 1 : capTop), transition: pressed ? sink : undefined }}>{still(pressed)}</div>
                </div>
              )}

              {exploded && (
                <>
                  <Exploded layers={PILL} on={m.pill} fill={look.pillFill} shadows={look.pillRaw.shadows} w={W} h={H} r={H / 2} z0={4} gap={14} focus={focus} scale={S} />
                  {m.undo && <Exploded layers={UNDO} on={m.cap} fill={look.capFill} shadows={look.capRaw.shadows} x={ux} y={uy} w={uw} h={uh} r={uh / 2} z0={explodedCapZ} gap={14} focus={focus} scale={S} />}
                  {/* the top copy stays, out of sight, so the layers keep their measure */}
                  <div ref={top} className="xr-segface is-top" aria-hidden inert style={{ ...face(0), visibility: 'hidden' }}>{still()}</div>
                </>
              )}

              {SPOTS.map((s) => {
                const at: Record<Spot, [number, number, number]> = {
                  states: [W * 0.05, H * 0.5, pillTop],
                  type: [(m.padL + 40) * S, H * 0.5, pillTop + 1],
                  press: m.undo ? [ux + uw * 0.5, uy + uh * 0.4, capTop + 1] : [W * 0.9, H * 0.4, pillTop],
                  shape: [H * 0.15, H * 0.85, pillTop],
                  shadow: [W * 0.8, H + 24, 0],
                  layers: exploded ? [W * 0.3, H * 0.3, 4 + (PILL.length - 1) * 14] : [W * 0.97, H * 0.5, pillTop],
                };
                const [x, y, z] = at[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, box, fit, pressed]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => setM(INITIAL)}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <ToastSpecimenCard spot={spot} m={m} set={set} focus={setFocus} hold={setHeld} replay={replay} press={setPressed} look={look} />
          <Proof><ToastProvider><RealToast m={m} /></ToastProvider></Proof>
        </div>
      )}
      {xray && <ToastCodePanel config={m} />}
    </div></HintLayer>
  );
}
