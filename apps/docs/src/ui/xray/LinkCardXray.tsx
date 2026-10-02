import * as React from 'react';
import { LinkCard } from '@unlocalhosted/metalui';
import { tokens } from '../../lib/tokens';
import { Exploded, IsoCap, XrayFrame, capTop, scalePx, tones, type LayerDef, type SpotDef } from './kit';
import { HintLayer } from '../edit';
import { HOSTS, LINK_TOKENS, LinkCardSpecimenCard, frameRadius, linkLook, tintFor } from './LinkCardSpecimens';
import { useColorway } from '../../app/colorway';

/* ─────────────────────────────────────────────────────────
 * X-RAY · LINK CARD (a block: a glass face, a tinted screen, two chips and two lines of type)
 *
 *   solid     a link card
 *   x-ray     a glass bezel standing on the page, a screen set into it, the screen's glow
 *             tinted by the website's name, the LINK tag and the OPEN chip on the glass
 *   card      the real link card, handled (LinkCardSpecimens): the frame's side sets its width,
 *             the glow steps through sites, the words set their size and spacing, the LINK tag
 *             its distance from the corner, the screen's corner its corners; layers switch
 * ───────────────────────────────────────────────────────── */

const LC = tokens.recipes['link-card'] as { props: { self: { width: number }; screen: { height: number; 'pad-y': number; 'pad-x': number } } };
const P = LC.props;
const S = 2;

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

export interface Model {
  host: string; glare: boolean; pad: number; follow: boolean; screenR: number; inset: number;
  hostSize: number; hostTrack: number; pathSize: number; pathTrack: number;
  bezel: boolean[]; screen: boolean[];
}
const INITIAL: Model = {
  host: HOSTS[0], glare: true, pad: LINK_TOKENS.pad, follow: true, screenR: LINK_TOKENS.screenR, inset: LINK_TOKENS.inset,
  hostSize: LINK_TOKENS.hostSize, hostTrack: LINK_TOKENS.hostTrack, pathSize: LINK_TOKENS.pathSize, pathTrack: LINK_TOKENS.pathTrack,
  bezel: BEZEL.map(() => true), screen: SCREEN.map(() => true),
};

export function LinkCardXray({ startOpen = false }: { startOpen?: boolean }) {
  const [xray, setXray] = React.useState(startOpen);
  const [spot, setSpot] = React.useState<Spot>('light');
  const [m, setM] = React.useState<Model>(INITIAL);
  const [opened, setOpened] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<string | null>(null);
  const set = React.useCallback((p: Partial<Model>) => setM((o) => ({ ...o, ...p })), []);

  const { colorway } = useColorway();
  const { bezelBg: BEZEL_BG, bezelSh: BEZEL_SH, glareBg: GLARE_BG, glareSh: GLARE_SH, screenBg: SCREEN_BG, noGlow, hostInk, pathInk } = linkLook(colorway);
  const hue = tintFor(m.host, colorway);
  const Wp = P.self.width, SHp = P.screen.height, Hp = SHp + m.pad * 2;
  const W = Wp * S, H = Hp * S;
  const bezelR = frameRadius(m);
  const z = 3, top = capTop(z, 5);
  const exploded = spot === 'layers';
  const screenBg = [
    ...(m.screen[1] && m.glare ? [GLARE_BG[0]] : []),
    ...(m.screen[2] ? [GLARE_BG[1]] : []),
    m.screen[0] ? SCREEN_BG.replace('self', hue) : noGlow,
  ].join(', ');
  const bezelShadow = scalePx(BEZEL_SH.slice(0, 4).filter((_, i) => m.bezel[i + 1]).join(', ') || 'none', S);
  const sx = m.pad * S, sy = m.pad * S, sw = (Wp - m.pad * 2) * S, sh = SHp * S;
  const inset = m.inset * S;

  const screen = (
    <div className="xr-face is-flat xr-linkscreen" style={{ left: sx, top: sy, width: sw, height: sh, borderRadius: m.screenR * S, transform: `translateZ(${top + 0.5}px)`, background: screenBg, boxShadow: scalePx(GLARE_SH.join(', '), S), padding: `${P.screen['pad-y'] * S}px ${P.screen['pad-x'] * S}px` }}>
      <span className="xr-linkchip" style={{ left: inset, top: inset, fontSize: 9 * S, gap: 5 * S, height: 18 * S, padding: `0 ${7 * S}px`, borderRadius: 7 * S }}><i style={{ width: 5 * S, height: 5 * S }} />LINK</span>
      <span className={spot === 'press' ? 'xr-linkchip is-action is-lit' : 'xr-linkchip is-action'} onClick={() => setOpened(m.host)} style={{ right: inset, top: inset, fontSize: 9 * S, height: 18 * S, padding: `0 ${7 * S}px`, borderRadius: 7 * S }}>OPEN</span>
      <b style={{ font: `620 ${m.hostSize * S}px/1.2 var(--sans)`, letterSpacing: `${m.hostTrack}em`, color: hostInk }}>{m.host}</b>
      <span style={{ font: `400 ${m.pathSize * S}px/1.4 var(--mono)`, letterSpacing: `${m.pathTrack}em`, color: pathInk }}>/NIGHT-MARKET</span>
    </div>
  );

  const scene = exploded ? (
    <>
      <Exploded layers={BEZEL} on={m.bezel} fill={BEZEL_BG} shadows={BEZEL_SH} w={W} h={H} r={bezelR * S} z0={3} gap={14} focus={focus} scale={S} />
      <Exploded layers={SCREEN} on={m.screen} fill={SCREEN_BG.replace('self', hue)} backgrounds={[SCREEN_BG.replace('self', hue), GLARE_BG[0], GLARE_BG[1]]} shadows={['none', 'none']} x={sx} y={sy} w={sw} h={sh} r={m.screenR * S} z0={3 + BEZEL.length * 14 + 10} gap={16} focus={focus} scale={S} />
    </>
  ) : (
    <>
      {m.bezel[6] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR * S, filter: 'blur(18px)', opacity: 0.28, transform: 'translate(10px, 22px)' }} />}
      {m.bezel[4] && <div className="xr-shadow" style={{ width: W, height: H, borderRadius: bezelR * S, filter: 'blur(2px)', opacity: 0.25 }} />}
      <IsoCap w={W} h={H} r={bezelR * S} z={z} wall={5} fill={m.bezel[0] ? BEZEL_BG : 'transparent'} shadow={bezelShadow} wallTone={tones(colorway).wall} />
      {screen}
    </>
  );

  const anchors: Record<Spot, [number, number, number]> = {
    surface: [W * 0.04, H * 0.8, top],
    light: [sx + sw * 0.85, sy + 8, top + 1],
    type: [sx + P.screen['pad-x'] * S + 40, sy + sh - 30, top + 1],
    press: [sx + sw - inset - 30, sy + inset + 18, top + 1],
    shape: [W - bezelR * S * 0.3, H - bezelR * S * 0.3, top],
    layers: exploded ? [W * 0.2, H * 0.2, 3 + (BEZEL.length - 1) * 14] : [W * 0.06, H * 0.2, top],
  };

  const card = <LinkCardSpecimenCard spot={spot} m={m} set={set} focus={setFocus} opened={opened} setOpened={setOpened} />;

  return (
    <HintLayer><XrayFrame
      xray={xray} setXray={setXray} spots={SPOTS} side={SIDE} spot={spot} setSpot={setSpot}
      solid={<div style={{ zoom: 1.6 }}><LinkCard href="https://lanterns.photo/night-market" /></div>}
      W={W} H={H} scene={scene} anchors={anchors}
      hint={spot === 'press' ? 'Click OPEN on the model' : undefined}
      onReset={() => { setM(INITIAL); setOpened(null); }} deps={[spot, m]}
      card={card}
    /></HintLayer>
  );
}
