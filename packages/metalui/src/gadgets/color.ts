// OKLCH → sRGB and Display P3 for gadget pigments. A body's colour is chosen in OKLCH
// (lightness, chroma, hue) so that lightness means the same thing at every hue; out-of-gamut
// colours keep their lightness and hue and lose chroma (bisection), never the other way round.

export interface Pigment {
  /** '#rrggbb', the sRGB fallback. */
  srgb: string;
  /** 'color(display-p3 r g b)', for wide-gamut screens. */
  p3: string;
  /** Display P3 components, gamma-encoded, 0–1 (SwiftUI's Color(.displayP3, …) takes these). */
  p3Components: [number, number, number];
}

type Vec3 = [number, number, number];

function oklabToLms(L: number, a: number, b: number): Vec3 {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  return [l ** 3, m ** 3, s ** 3];
}

function linearSrgb(L: number, C: number, H: number): Vec3 {
  const h = (H * Math.PI) / 180, [l, m, s] = oklabToLms(L, C * Math.cos(h), C * Math.sin(h));
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// Linear sRGB → linear Display P3 (both D65).
function srgbToP3([r, g, b]: Vec3): Vec3 {
  return [
    0.8224621 * r + 0.177538 * g + 0.0000001 * b,
    0.0331941 * r + 0.9668058 * g + 0.0000001 * b,
    0.0170827 * r + 0.0723974 * g + 0.9105199 * b,
  ];
}

const inside = (v: Vec3) => v.every((c) => c >= -1e-5 && c <= 1 + 1e-5);
const gamma = (c: number) => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };

/** The largest chroma ≤ C at this lightness and hue that the target gamut holds. */
function fit(L: number, C: number, H: number, test: (v: Vec3) => boolean): number {
  if (test(linearSrgb(L, C, H))) return C;
  let lo = 0, hi = C;
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (test(linearSrgb(L, mid, H))) lo = mid; else hi = mid; }
  return lo;
}

/** A pigment from OKLCH (L 0–1, C ≥ 0, H in degrees). */
export function pigment(L: number, C: number, H: number): Pigment {
  L = Math.min(1, Math.max(0, L));
  H = ((H % 360) + 360) % 360;
  const cs = fit(L, Math.max(0, C), H, inside);
  const cp = fit(L, Math.max(0, C), H, (v) => inside(srgbToP3(v)));
  const s = linearSrgb(L, cs, H).map(gamma);
  const p = srgbToP3(linearSrgb(L, cp, H));
  const hex = '#' + s.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
  const pg = p.map(gamma) as Vec3;
  return { srgb: hex, p3: `color(display-p3 ${pg.map((c) => c.toFixed(4)).join(' ')})`, p3Components: pg };
}

/** OKLab distance (ΔE_OK) between two OKLCH colours. */
export function deltaE(a: Vec3, b: Vec3): number {
  const lab = ([L, C, H]: Vec3) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
  const [x, y] = [lab(a), lab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}
