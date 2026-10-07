import * as React from 'react';
import { LinkCard, type LinkPreview } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Callouts, Exploded, Glyph, capTop, tones, useFit, type LayerDef, type SpotDef, planeStyle } from './kit';
import { HintLayer } from '../edit';
import type { XrayViewProps } from '.';
import { HOSTS, LINK_TOKENS, LinkCardSpecimenCard, fontAt, frameRadius, hostOf, hrefFor, linkLook, tintFor } from './LinkCardSpecimens';
import { LinkCardCodePanel } from './LinkCardCode';
import { useColorway, type Colorway } from '../../app/colorway';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LINK CARD (a block: a glass face, a tinted screen, two chips and two lines of type)
 *
 *   solid     the real link card
 *   x-ray     a thick glass bezel on the gridded floor. Its top face is the real LinkCard, laid out at
 *             the table's zoom and scaled by transform, so its screen, glare, chips and type are the
 *             object's own. Under it, a wall of slices and the shadows it casts on the floor. Flown in,
 *             every part starts on one plane (the object that landed), then opens.
 *   card      the real link card, handled (LinkCardSpecimens): the frame's side sets its width,
 *             the glow steps through sites, the words set their size and spacing, the LINK tag
 *             its distance from the corner, the screen's corner its corners; layers switch
 *   code      under the card: the React, CSS and SwiftUI for exactly this config (LinkCardCode.tsx)
 *   preview   the card's title, image and icon are real props: carried from the table to the model
 *             and into the code as they are (the model grows to the preview's height). Nothing here
 *             fetches, so the handover never waits on a network; the table's card has no preview.
 * ───────────────────────────────────────────────────────── */

const LC = tokens.recipes['link-card'] as unknown as { props: { self: { width: number }; screen: { height: number; 'pad-y': number; 'pad-x': number }; host: { font: string }; path: { font: string }; preview: { height: number } } };
const P = LC.props;
const S = 2;
const WALL = 5;

type Spot = 'surface' | 'light' | 'type' | 'press' | 'shape' | 'layers';
const SPOTS: SpotDef<Spot>[] = [
  { id: 'surface', title: 'Bezel', word: 'The glass frame' },
  { id: 'light', title: 'Screen', word: 'A colour for each site' },
  { id: 'type', title: 'Type', word: 'Site and path' },
  { id: 'press', title: 'Open', word: 'The only button' },
  { id: 'shape', title: 'Shape', word: 'Corners that match' },
  { id: 'layers', title: 'Layers', word: 'What it is made of' },
];
const SIDE: Record<Spot, ['left' | 'right', number]> = {
  layers: ['left', 0.2], type: ['left', 0.48], surface: ['left', 0.76],
  light: ['right', 0.2], press: ['right', 0.48], shape: ['right', 0.76],
};

export const BEZEL: LayerDef[] = [
  { name: 'Glass', why: 'A glass frame, a little lighter at the top: pale on Bone, near-black on Graphite. A link is something that leads out of your page, so it looks like a small screen, not like paper.' },
  { name: 'Top edge', why: 'A thin bright line along the top edge of the glass.' },
  { name: 'Inner glow', why: 'A faint light just inside the edge.' },
  { name: 'Rim', why: 'A thin outline, a shade darker than the glass.' },
  { name: 'Contact', why: 'A small shadow right under the card.' },
  { name: 'Near shadow', why: 'A soft shadow, a bit bigger.' },
  { name: 'Far shadow', why: 'A big, soft shadow. The card stands up off the page like an object.' },
];
export const SCREEN: LayerDef[] = [
  { name: 'Tinted glow', why: 'A coloured glow from the top right corner, fading into the screen. The colour comes from the site\'s name, so the same site always gets the same colour.' },
  { name: 'Glare', why: 'A pale diagonal stripe with a sharp edge, like light caught on a phone screen. It says "this is glass".' },
  { name: 'Shade', why: 'The bottom of the screen gets a little deeper, so the text there stays easy to read.' },
];

/** Everything a link card is set to: its real props first, then what the x-ray lets you tune.
 *  One object, handed from the table to the x-ray and back; the code for it is read off it. */
export interface LinkCardConfig {
  /** props: where it goes (its site is read from it), and what the backend found there */
  href: string; preview?: LinkPreview | null;
  /** recipe values: the glare, the frame's width, whether its corners follow the screen's, the screen's corners, the tags' space from the corner */
  glare: boolean; pad: number; follow: boolean; screenR: number; inset: number;
  /** the words: the site's size and spacing, the path's */
  hostSize: number; hostTrack: number; pathSize: number; pathTrack: number;
  /** which layers are on: the frame's seven, the screen's three */
  bezel: boolean[]; screen: boolean[];
}
export type Model = LinkCardConfig;
export const INITIAL: LinkCardConfig = {
  href: hrefFor(HOSTS[0]), preview: null, glare: true, pad: LINK_TOKENS.pad, follow: true, screenR: LINK_TOKENS.screenR, inset: LINK_TOKENS.inset,
  hostSize: LINK_TOKENS.hostSize, hostTrack: LINK_TOKENS.hostTrack, pathSize: LINK_TOKENS.pathSize, pathTrack: LINK_TOKENS.pathTrack,
  bezel: BEZEL.map(() => true), screen: SCREEN.map(() => true),
};
/** How long the model takes to close up before it flies home: most of the object spring, past its overshoot. */
const SETTLE_MS = Math.round(tokens.springs.object.duration * 1000 * 0.55);
const hasTitle = (m: LinkCardConfig) => !!m.preview?.title?.trim();

/** The glass and the glare for a config in a colorway: one function for the model's hand-built parts and the variables. */
function layersOf(m: LinkCardConfig, L: ReturnType<typeof linkLook>) {
  const shadow = L.bezelSh.filter((_, i) => m.bezel[i + 1]);
  const glare = [m.screen[1] && m.glare ? L.glareBg[0] : null, m.screen[2] ? L.glareBg[1] : null].filter(Boolean).join(', ') || 'none';
  return { shadow, glare, shadowText: shadow.join(', ') || 'none', fill: m.bezel[0] ? L.bezelBg : 'transparent' };
}

/** What a config looks like: the fills and shadows for the model's hand-built parts, and the variables
 *  that set the real card to it. Only what differs from the recipe is set, so a default config is the
 *  card exactly as it ships, and the variables are the overrides its code needs. */
export function linkCardLook(m: LinkCardConfig, colorway: Colorway) {
  const L = linkLook(colorway);
  const now = layersOf(m, L), base = layersOf(INITIAL, L);
  const host = hostOf(m.href);
  const hue = tintFor(host, colorway);
  const frameR = frameRadius(m);
  const style: Record<string, string> = {};
  if (m.pad !== INITIAL.pad) style['--mu-r-glass-face-self-pad'] = `${m.pad}px`;
  if (frameR !== LINK_TOKENS.frameR) style['--mu-r-glass-face-self-radius'] = `${frameR}px`;
  if (m.screenR !== INITIAL.screenR) style['--mu-r-glass-face-screen-radius'] = `${m.screenR}px`;
  if (now.fill !== base.fill) style['--mu-r-glass-face-self-background'] = now.fill;
  if (now.shadowText !== base.shadowText) style['--mu-r-glass-face-self-shadow'] = now.shadowText;
  if (now.glare !== base.glare) style['--mu-r-glass-face-glare-background'] = now.glare;
  if (m.hostSize !== INITIAL.hostSize) style['--mu-r-link-card-host-font'] = fontAt(P.host.font, m.hostSize);
  if (m.hostTrack !== INITIAL.hostTrack) style['--mu-r-link-card-host-tracking'] = `${m.hostTrack}em`;
  if (m.pathSize !== INITIAL.pathSize) style['--mu-r-link-card-path-font'] = fontAt(P.path.font, m.pathSize);
  if (m.pathTrack !== INITIAL.pathTrack) style['--mu-r-link-card-path-tracking'] = `${m.pathTrack}em`;
  if (m.inset !== INITIAL.inset) style['--mu-r-link-card-chip-inset'] = `${m.inset}px`;
  if (!m.screen[0]) style['--mu-r-link-card-screen-background'] = L.noGlow;
  // the recipe's own tint is the first site's; every other site is tinted from its name, as the reference does
  if (host !== HOSTS[0]) style['--mu-self'] = hue;
  return {
    colorway, ...L, hue, frameR, fill: now.fill, shadow: now.shadow, glare: now.glare,
    screenFill: L.screenBg.replace('self', hue), wall: m.bezel[0] ? tones(colorway).wall : 'transparent',
    style: style as React.CSSProperties,
  };
}
export function useLinkCardLook(m: LinkCardConfig) {
  const { colorway } = useColorway();
  return React.useMemo(() => linkCardLook(m, colorway), [m, colorway]);
}
export type Look = ReturnType<typeof useLinkCardLook>;

export function LinkCardXray({ startOpen = false, seed, onSeed, pose = 'open', zoom: oz = 1 }: XrayViewProps<LinkCardConfig>) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('light');
  const [m, setM] = React.useState<LinkCardConfig>(() => ({ ...INITIAL, ...seed }));
  const [opened, setOpened] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<LinkCardConfig>) => setM((o) => ({ ...o, ...p })), []);
  // every change goes straight back to where the object came from
  const onSeedRef = React.useRef(onSeed); onSeedRef.current = onSeed;
  const seeded = React.useRef(m);
  React.useEffect(() => { if (seeded.current !== m) { seeded.current = m; onSeedRef.current?.(m); } }, [m]);
  const look = useLinkCardLook(m);
  const bench = React.useRef<HTMLDivElement>(null);

  // the card is 250 wide and as tall as its screen plus the frame on both sides, so its box is known; scaled for the model
  const Wp = P.self.width, SHp = hasTitle(m) ? P.preview.height : P.screen.height, Hp = SHp + m.pad * 2;
  const W = Wp * S, H = Hp * S, bezelR = look.frameR * S;
  const z = 3, top = capTop(z, WALL);
  const flat = pose === 'flat';
  const exploded = spot === 'layers' && !flat;
  const fit = useFit(bench, W, H, xray);
  const sx = m.pad * S, sy = m.pad * S, sw = (Wp - m.pad * 2) * S, sh = SHp * S, inset = m.inset * S;

  const current = SPOTS.find((x) => x.id === spot)!;
  // the model's face is the card laid out at the object's own zoom, then scaled: the same boxes, to the pixel
  const face = (zz: number) => planeStyle(zz, S, oz);
  // risen, the face keeps the edges that are its own (top edge, inner glow, rim); the shadows it casts go down on the floor
  const faceStyle = flat ? look.style : { ...look.style, ['--mu-r-glass-face-self-shadow' as string]: look.shadow.filter((_, i) => i < 3).join(', ') || 'none' };
  const rise = 'transform var(--spring-object-d) var(--spring-object)';

  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.04, H * 0.8, top],
    light: [sx + sw * 0.85, sy + 8, top + 1],
    type: [sx + P.screen['pad-x'] * S + 40, sy + sh - 30, top + 1],
    press: [sx + sw - inset - 30, sy + inset + 18, top + 1],
    shape: [W - bezelR * 0.3, H - bezelR * 0.3, top],
    layers: exploded ? [W * 0.2, H * 0.2, 3 + (BEZEL.length - 1) * 14] : [W * 0.06, H * 0.2, top],
  };

  return (
    <HintLayer><div className="xr" data-xray={xray || undefined} data-spot={xray ? spot : undefined}>
      <div className="xr-bench" ref={bench}>
        {!xray && <div className="xr-solid" onClick={() => setXray(true)}><div className="xr-solid-fit"><div style={{ zoom: 1.6, cursor: 'zoom-in' }}><LinkCard href={m.href} preview={m.preview} style={look.style} /></div></div></div>}

        {xray && (
          <div className="xr-scene is-fitted" style={{ width: W * fit, height: H * fit }} data-settle={SETTLE_MS}>
            <div className="xr-fit" style={{ width: W, height: H, transform: `scale(${fit})` }}><div className="xr-iso">
              <div className="xr-floor" />

              {exploded ? (
                <>
                  <Exploded layers={BEZEL} on={m.bezel} fill={look.bezelBg} shadows={look.bezelSh} w={W} h={H} r={bezelR} z0={3} gap={14} focus={focus} scale={S} />
                  <Exploded layers={SCREEN} on={m.screen} fill={look.screenFill} backgrounds={[look.screenFill, look.glareBg[0], look.glareBg[1]]} shadows={['none', 'none']} x={sx} y={sy} w={sw} h={sh} r={m.screenR * S} z0={3 + BEZEL.length * 14 + 10} gap={16} focus={focus} scale={S} />
                </>
              ) : (
                <>
                  {/* the shadows it casts on the floor: they appear as the model opens */}
                  {m.bezel[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR, transition: 'opacity .3s', filter: 'blur(18px)', opacity: flat ? 0 : 0.28, transform: 'translate(10px, 22px)' }} />}
                  {m.bezel[5] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR, transition: 'opacity .3s', filter: 'blur(8px)', opacity: flat ? 0 : 0.18, transform: 'translate(3px, 8px)' }} />}
                  {m.bezel[4] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR, transition: 'opacity .3s', filter: 'blur(2px)', opacity: flat ? 0 : 0.25 }} />}

                  {/* the frame's side wall: slices that rise from the floor to the face */}
                  <div className="xr-thumb">
                    {Array.from({ length: WALL }, (_, i) => (
                      <div key={i} className="xr-slice" style={{ width: W, height: H, borderRadius: bezelR, transition: rise, transform: `translateZ(${flat ? 0 : z + i * 1.4}px)`, background: i === 0 || flat ? 'transparent' : look.wall }} />
                    ))}
                  </div>

                  {/* the top: the real card */}
                  <div className="xr-segface is-top" aria-hidden inert style={face(flat ? 1 : top)}><LinkCard href={m.href} preview={m.preview} style={faceStyle} /></div>
                </>
              )}

              {SPOTS.map((s) => {
                const [x, y, zz] = anchors[s.id];
                return <i key={s.id} className="xr-anchor" data-spot={s.id} style={{ transform: `translate3d(${x}px, ${y}px, ${zz}px)` }} />;
              })}
            </div></div>
          </div>
        )}

        {xray && <Callouts bench={bench} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot} deps={[spot, m, fit]} />}
        <div className="xr-hint eng">{xray ? 'Pick an icon to learn about that part' : 'Try it, then open the x-ray'}</div>
        <div className="xr-actions">
          {xray && <button type="button" className="status" onClick={() => { setM((o) => ({ ...INITIAL, href: o.href, preview: o.preview })); setOpened(null); }}><span className="led off" />Reset</button>}
          <button type="button" className="status" onClick={() => setXray(!xray)}><span className={xray ? 'led' : 'led off'} />{xray ? 'Solid' : 'X-ray'}</button>
        </div>
      </div>

      {xray && (
        <div className="xr-card raised" key={spot}>
          <span className="eng xr-card-head"><Glyph id={spot} /> {current.title} · {current.word}</span>
          <LinkCardSpecimenCard spot={spot} m={m} set={set} focus={setFocus} look={look} opened={opened} setOpened={setOpened} />
        </div>
      )}
      {xray && <LinkCardCodePanel config={m} />}
    </div></HintLayer>
  );
}
