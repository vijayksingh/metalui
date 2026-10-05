import type { CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────
 * THE WORDMARK: one enamel pill in two colours, after appliance lettering
 *
 *   the pill   a single glossy capsule: red enamel under METAL, meeting graphite under UI at a
 *              clean seam, one window highlight running along the whole top
 *   chrome     both words in polished chrome capitals, tracked wide, banded like a curved mirror:
 *              a bright top, a dark horizon at the middle, a lit lower edge, a hairline highlight
 *              over each letter and a short cast shadow under it
 *   rim        a faint light rim round the capsule, so it holds on a graphite page
 * Sized in em: set font-size to the cap height you want (12 in the masthead, 78 in the film).
 * One source for the site's logo, the home page and the launch film.
 * ───────────────────────────────────────────────────────── */

const CHROME: CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #dfe0e2 24%, #8f9196 46%, #f6f6f7 53%, #bcbec2 72%, #74767b 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 0.018em 0 rgba(255,255,255,.55)) drop-shadow(0 0.035em 0.02em rgba(0,0,0,.45))',
  fontWeight: 560,
  lineHeight: 1,
  position: 'relative',
};

const RED = 'linear-gradient(180deg, #e2362b 0%, #c41e17 55%, #9e140f 100%)';
const GRAPHITE = 'linear-gradient(180deg, #3a3a3e 0%, #232326 60%, #161618 100%)';

export const WORDMARK_LAYERS = [
  { id: 'fill', name: 'Enamel', why: 'Red and graphite gradients form the two halves of the capsule.' },
  { id: 'chrome', name: 'Chrome lettering', why: 'Light and dark bands across the letters make them look like polished metal.' },
  { id: 'highlight', name: 'Top highlight', why: 'One bright window reflection crosses both halves of the capsule.' },
  { id: 'shadow', name: 'Rim and shadows', why: 'The light rim separates the capsule from the page. The shadows give it weight.' },
] as const;
export type WordmarkLayers = Record<typeof WORDMARK_LAYERS[number]['id'], boolean>;
export const WORDMARK_ALL_LAYERS: WordmarkLayers = { fill: true, chrome: true, highlight: true, shadow: true };

/** One word's half of the pill, its tracking taken back after the last letter. */
function Half({ text, fill, track, left, right, layers }: { text: string; fill: string; track: number; left: number; right: number; layers: WordmarkLayers }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%', background: layers.fill ? fill : 'transparent', padding: `0 ${right - track}em 0 ${left}em` }}>
      <span style={{ ...CHROME, ...(!layers.chrome ? { backgroundImage: 'none', color: 'var(--ink)', filter: 'none' } : !layers.shadow ? { filter: 'none' } : {}), letterSpacing: `${track}em` }}>{text}</span>
    </span>
  );
}

export function Wordmark({ size = 13, style, className, layers = WORDMARK_ALL_LAYERS }: { size?: number; style?: CSSProperties; className?: string; layers?: WordmarkLayers }) {
  return (
    <span
      role="img"
      aria-label="MetalUI"
      data-wordmark
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'stretch',
        height: '1.62em',
        borderRadius: '999px',
        overflow: 'hidden',
        fontFamily: '"Geist Variable", "Geist", system-ui, sans-serif',
        fontSize: size,
        textTransform: 'uppercase',
        boxShadow: layers.shadow ? '0 0 0 0.045em rgba(255,255,255,.16), inset 0 0.02em 0 rgba(255,255,255,.35), inset 0 -0.09em 0.2em rgba(0,0,0,.3), 0 0.16em 0.34em rgba(90,20,14,.26), 0 0.03em 0.07em rgba(0,0,0,.2)' : 'none',
        ...style,
      }}
    >
      <Half text="Metal" fill={RED} track={0.42} left={0.62} right={0.44} layers={layers} />
      <Half text="UI" fill={GRAPHITE} track={0.3} left={0.4} right={0.58} layers={layers} />
      {/* One window highlight along the whole top, over both colours. */}
      {layers.highlight && <span aria-hidden style={{ position: 'absolute', left: '0.5em', right: '0.5em', top: '0.07em', height: '40%', borderRadius: '999px', background: 'linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,0))', pointerEvents: 'none' }} />}
    </span>
  );
}
