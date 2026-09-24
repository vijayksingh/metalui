import * as React from 'react';

/* KEYCAP (the reference design's kbd). Static: a key is shown, never pressed. Glyphs only: ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓, letters. */

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** small (16) for a dense footer; default 18. */
  size?: 'default' | 'small';
  /** Where the cap sits: on a light surface (default), a graphite strip, sunk, or plain (the host paints it). */
  surface?: 'default' | 'strip' | 'sunk' | 'plain';
  /** What assistive tech should say, when the glyph is not a word: "Command K". */
  label?: string;
}

const NAMES: Record<string, string> = { '⌘': 'Command', '⌥': 'Option', '⇧': 'Shift', '⌃': 'Control', '⎋': 'Escape', '↩': 'Return', '⌫': 'Delete', '↑': 'Up', '↓': 'Down', '←': 'Left', '→': 'Right' };

/* Styled with the theme's utilities (the kbd recipe). A cap after a cap sits the recipe's gap away. */
const FRAME = 'mu-kbd box-border inline-flex items-center justify-center whitespace-nowrap align-middle type-kbd [.mu-kbd+&]:ml-kbd-gap';
const SIZES = {
  default: 'min-w-kbd-min h-kbd-height px-kbd-pad',
  small: 'min-w-kbd-small-min h-kbd-small-height px-kbd-small-pad',
};
const RADII = {
  default: 'rounded-kbd-radius',
  small: 'rounded-kbd-small-radius',
};
const SURFACES = {
  default: 'text-ink2 recipe-kbd',
  strip: 'text-kbd-strip-ink recipe-kbd-strip',
  sunk: 'text-kbd-sunk-ink recipe-kbd-sunk',
  plain: '',
};

/** A key, on a small raised cap. */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd({ size = 'default', surface = 'default', label, className, children, ...props }, ref) {
  const text = typeof children === 'string' ? children : '';
  const spoken = label ?? (text && [...text].some((c) => NAMES[c]) ? [...text].map((c) => NAMES[c] ?? c).join(' ') : undefined);
  return (
    <kbd ref={ref} data-size={size} data-surface={surface} aria-label={spoken} className={`${FRAME} ${SIZES[size]} ${surface === 'sunk' ? 'rounded-pill' : RADII[size]} ${SURFACES[surface]}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </kbd>
  );
});
