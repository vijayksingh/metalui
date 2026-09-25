// The one light, as SVG filter recipes generated from tokens (gadgets.light, .materials,
// .surface, .hole, .tiers, .host). A body's alpha, blurred, is its height; its roughness is
// fractal noise added to that height; one distant light shades it (diffuse, plus specular for
// glossy materials); sparse flecks sit in the moulding; a cast shadow and a contact shadow
// put it on the ground. Every Part draws through these, so every gadget is lit the same way.
import { GADGETS, type GadgetMaterial } from './gadgets.generated';
import { pigment } from './color';

export type Tier = 'full' | 'lite' | 'flat';
export type Host = 'bone' | 'graphite';

export interface LightOptions {
  tier?: Tier;
  host?: Host;
  /** Increased contrast: heavier shadows (gadgets.host.contrast). */
  contrast?: boolean;
  /** A part standing on a body: smaller bevel and shadows (gadgets.part-scale). */
  part?: boolean;
  /** Workbench multipliers, 1 = the token. */
  tune?: Partial<Record<'bevel' | 'gloss' | 'grain' | 'flecks' | 'shadow', number>>;
}

const { light: LIGHT, surface: SURF, hole: HOLE, tiers: TIERS, host: HOST } = GADGETS;

/** The tier a gadget draws at, from its drawn size in CSS pixels. */
export const tierFor = (px: number): Tier => (px >= TIERS.full ? 'full' : px >= TIERS.lite ? 'lite' : 'flat');

const n = (x: number) => +x.toFixed(4);

/** An SVG <filter> that lights a shape cut from `material`. Empty for the flat tier. */
export function materialFilter(id: string, material: GadgetMaterial, o: LightOptions = {}): string {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone', t = o.tune ?? {};
  if (tier === 'flat') return '';
  const m = GADGETS.materials[material] as unknown as {
    bevel: number; surfaceScale: number; diffuse: number; gloss: readonly [number, number]; grain: readonly [number, number];
    grainDirection?: number; flecks: number; shadow: { cast: readonly number[]; contact: readonly number[] };
  };
  const full = tier === 'full';
  const bevel = m.bevel * (o.part ? GADGETS.partScale.bevel : 1) * (full ? 1 : TIERS.liteBevel) * (t.bevel ?? 1);
  const [gf, ga] = m.grain, grain = full ? ga * (t.grain ?? 1) : 0;
  const [ge, gs] = m.gloss, gloss = gs * (t.gloss ?? 1);
  const flecks = full ? Math.min(SURF.fleck.max, m.flecks * SURF.fleck.scale * (t.flecks ?? 1)) : 0;
  const dims = o.part ? GADGETS.partScale.shadow : 1;
  const alpha = HOST[host].shadow * (o.contrast ? HOST.contrast.shadow : 1) * (t.shadow ?? 1);
  const lightColor = LIGHT.color[host];
  const shadow = (name: string, [b, dx, dy, a]: readonly number[]) =>
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${n(b * dims)}" result="${name}B"/><feOffset in="${name}B" dx="${n(dx * dims)}" dy="${n(dy * dims)}" result="${name}O"/>` +
    `<feFlood flood-color="${LIGHT.shadowColor}" flood-opacity="${n(Math.min(1, a * alpha))}"/><feComposite in2="${name}O" operator="in" result="${name}"/>`;
  const freq = m.grainDirection !== undefined ? `${n(gf * SURF.directionalRatio)} ${gf}` : `${gf}`;
  const region = o.part ? 'x="-60%" y="-60%" width="240%" height="260%"' : 'x="-15%" y="-15%" width="130%" height="140%"';
  return `<filter id="${id}" ${region} color-interpolation-filters="sRGB" data-material="${material}" data-tier="${tier}">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${n(bevel)}" result="h0"/>` +
    (grain > 0
      ? `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${SURF.grainOctaves}" seed="${SURF.grainSeed}" result="tex"/><feComposite in="h0" in2="tex" operator="arithmetic" k2="1" k3="${n(grain)}" result="h"/>`
      : `<feComposite in="h0" in2="h0" operator="arithmetic" k2="1" result="h"/>`) +
    `<feDiffuseLighting in="h" surfaceScale="${m.surfaceScale}" diffuseConstant="${m.diffuse}" lighting-color="${lightColor}" result="light"><feDistantLight azimuth="${LIGHT.azimuth}" elevation="${LIGHT.elevation}"/></feDiffuseLighting>` +
    `<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="${LIGHT.litGain}" result="lit0"/>` +
    (gloss > 0
      ? `<feSpecularLighting in="h" surfaceScale="${m.surfaceScale}" specularConstant="${n(gloss)}" specularExponent="${Math.min(128, Math.max(1, ge))}" lighting-color="${lightColor}" result="sp"><feDistantLight azimuth="${LIGHT.azimuth}" elevation="${LIGHT.glossElevation}"/></feSpecularLighting>` +
        `<feComposite in="sp" in2="SourceAlpha" operator="in" result="spIn"/><feComposite in="lit0" in2="spIn" operator="arithmetic" k2="1" k3="1" result="lit"/>`
      : `<feComposite in="lit0" in2="lit0" operator="arithmetic" k2="1" result="lit"/>`) +
    `<feComposite in="lit" in2="SourceAlpha" operator="in" result="obj"/>` +
    (flecks > 0
      ? `<feTurbulence type="fractalNoise" baseFrequency="${SURF.fleck.frequency}" numOctaves="1" seed="${SURF.fleck.seed}" result="fn"/>` +
        `<feColorMatrix in="fn" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${SURF.fleck.gain} ${SURF.fleck.cut}" result="fl"/>` +
        `<feComposite in="fl" in2="SourceAlpha" operator="in" result="fl2"/><feComponentTransfer in="fl2" result="fleck"><feFuncA type="linear" slope="${n(flecks)}"/></feComponentTransfer>`
      : '') +
    shadow('cast', m.shadow.cast) + (full ? shadow('contact', m.shadow.contact) : '') +
    `<feMerge><feMergeNode in="cast"/>${full ? '<feMergeNode in="contact"/>' : ''}<feMergeNode in="obj"/>${flecks > 0 ? '<feMergeNode in="fleck"/>' : ''}</feMerge></filter>`;
}

/** A cut's wall: the top edge hides the light (the cut's own shadow, offset down-right, inside it). */
export function holeFilter(id: string): string {
  const [dx, dy] = HOLE.offset;
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${HOLE.blur}" result="b"/><feOffset in="b" dx="${dx}" dy="${dy}" result="o"/>` +
    `<feComposite in="SourceAlpha" in2="o" operator="out" result="rim"/><feFlood flood-color="#000" flood-opacity="${HOLE.alpha}"/>` +
    `<feComposite in2="rim" operator="in" result="sh"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/></feMerge></filter>`;
}

const stop = (offset: number, L: number, C: number, H: number) => {
  const p = pigment(L, C, H);
  return `<stop offset="${offset}" stop-color="${p.srgb}" style="stop-color: ${p.p3}"/>`;
};

/**
 * The body's fill: one pigment (L, C, H) as the one light spreads it — a touch lighter and cooler
 * at the top, darker and warmer at the bottom. A translucent material lets light through, so its
 * core glows. On a dark host, very bright bodies step down so they do not glare.
 */
export function bodyFill(id: string, material: GadgetMaterial, L: number, C: number, H: number, host: Host = 'bone'): string {
  const g = HOST.graphite;
  if (host === 'graphite' && L > g.brightLAbove) L -= g.brightLDrop;
  const tr = (GADGETS.materials[material] as { translucency: number }).translucency;
  const core = SURF.translucentCore;
  if (tr >= core.scatter[0] && tr <= core.scatter[1]) {
    return `<radialGradient id="${id}" cx=".5" cy=".58" r=".62">${stop(0, L + core.L * tr, C * 0.9, H + core.H * tr)}${stop(0.55, L, C, H)}${stop(1, L + core.edgeL, C * 1.05, H - 6)}</radialGradient>`;
  }
  return `<linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1">${stop(0, L + 0.03, C * 0.9, H - 6)}${stop(1, L - 0.035, C * 1.08, H + 6)}</linearGradient>`;
}
