// Generated from tokens/tokens.json. Do not edit.
export const MARK_GLYPH_SIZE = 14;
export const TAG_PALETTE = ["var(--mu-blue)","var(--mu-orange)","var(--mu-gold)","var(--mu-green-deep)"] as const;
export function tagIdentity(text: string): number {
  let hash = 0;
  for (const scalar of text.normalize('NFC')) hash = (Math.imul(hash, 31) ^ scalar.codePointAt(0)!) >>> 0;
  return hash % TAG_PALETTE.length;
}
export function tagColor(text: string): string { return TAG_PALETTE[tagIdentity(text)]; }
