// Machado et al. full-severity matrices (author's thesis, appendix A).
// SVG feColorMatrix uses linearRGB, matching the measurement report's linear-light calculation.
export const STATUS_VISION = {
  normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  deuteranopia: [.367322, .860646, -.227968, .280085, .672501, .047413, -.011820, .042940, .968881],
  protanopia: [.152286, 1.052583, -.204868, .114503, .786281, .099216, -.003882, -.048116, 1.051998],
} as const;
export function linearRGB(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
}
export function simulate(rgb: number[], matrix: readonly number[]) {
  return [0, 1, 2].map((row) => Math.max(0, Math.min(1, rgb.reduce((sum, v, col) => sum + v * matrix[row * 3 + col], 0))));
}
export function oklab(rgb: number[]) {
  const [l, m, s] = [
    [.4122214708, .5363325363, .0514459929], [.2119034982, .6806995451, .1073969566], [.0883024619, .2817188376, .6299787005],
  ].map((row) => Math.cbrt(rgb.reduce((sum, v, i) => sum + v * row[i], 0)));
  return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
}
export function contrast(a: string, b: string) {
  const luminance = (h: string) => linearRGB(h).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const pair = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (pair[0] + .05) / (pair[1] + .05);
}
export function filterMatrix(matrix: readonly number[]) {
  return [0, 1, 2].map((row) => `${matrix.slice(row * 3, row * 3 + 3).join(' ')} 0 0`).join(' ') + ' 0 0 0 1 0';
}
