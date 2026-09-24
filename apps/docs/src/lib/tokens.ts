import tokens from '../../../../tokens/tokens.json';

export { tokens };
export const F = tokens.foundations;
export type TypeRole = keyof typeof F.type;
export const TYPE_ROLES = Object.keys(F.type) as TypeRole[];

// ---------- color math (WCAG 2.x relative luminance) ----------
export type RGB = [number, number, number];

export function parseColor(input: string): { rgb: RGB; alpha: number } {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB, alpha: 1 };
  }
  const fn = s.match(/^rgba?\(([^)]*)\)$/);
  if (fn) {
    const p = fn[1].split(',').map((x) => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], alpha: p[3] ?? 1 };
  }
  throw new Error(`Unsupported color: ${input}`);
}

/** Composites a possibly translucent color over an opaque background. */
export function over(fg: string, bg: string): RGB {
  const f = parseColor(fg), b = parseColor(bg);
  return f.rgb.map((v, i) => v * f.alpha + b.rgb[i] * (1 - f.alpha)) as RGB;
}

function luminance([r, g, b]: RGB) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(fg: string, bg: string) {
  const a = luminance(over(fg, bg)), b = luminance(parseColor(bg).rgb);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** The worst (lowest) contrast of `fg` across the surfaces it can sit on. */
export function worstContrast(fg: string, surfaces: string[]) {
  return Math.min(...surfaces.map((s) => contrast(fg, s)));
}

export const toHex = ([r, g, b]: RGB) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

// ---------- springs ----------
/** Settle time (s) of a damped spring to within 0.1%, mass 1. */
export function settleTime(stiffness: number, damping: number, mass = 1) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta >= 1) return 6.9 / (w0 * zeta); // overdamped approximation
  return Math.log(1000 / Math.sqrt(1 - zeta * zeta)) / (zeta * w0);
}

export function dampingRatio(stiffness: number, damping: number, mass = 1) {
  return damping / (2 * Math.sqrt(stiffness * mass));
}
