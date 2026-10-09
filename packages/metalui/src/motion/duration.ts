/** A duration token read as milliseconds. Tokens arrive as CSS times ("2.6s", ".12s", "900ms");
 *  a bare number is taken as milliseconds. Unset, unparsable or server-side: the fallback. */
export function cssMs(name: string, fallback: number, el?: Element | null): number {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(el ?? document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return value.endsWith('ms') ? n : value.endsWith('s') ? n * 1000 : n;
}
