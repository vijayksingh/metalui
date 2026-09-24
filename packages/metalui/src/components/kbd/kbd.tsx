import * as React from 'react';
import './kbd.css';

/* KEYCAP (Kamui 04 §9). Static: a key is shown, never pressed. Glyphs only: ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓, letters. */

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** small (16) for a dense footer; default 20. */
  size?: 'default' | 'small';
  /** Where the cap sits: on a light surface (default), a graphite strip, or sunk into a toast's Undo. */
  surface?: 'default' | 'strip' | 'sunk';
  /** What assistive tech should say, when the glyph is not a word: "Command K". */
  label?: string;
}

const NAMES: Record<string, string> = { '⌘': 'Command', '⌥': 'Option', '⇧': 'Shift', '⌃': 'Control', '⎋': 'Escape', '↩': 'Return', '⌫': 'Delete', '↑': 'Up', '↓': 'Down', '←': 'Left', '→': 'Right' };

/** A key, on a small raised cap. */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd({ size = 'default', surface = 'default', label, className, children, ...props }, ref) {
  const text = typeof children === 'string' ? children : '';
  const spoken = label ?? (text && [...text].some((c) => NAMES[c]) ? [...text].map((c) => NAMES[c] ?? c).join(' ') : undefined);
  return (
    <kbd ref={ref} data-size={size} data-surface={surface} aria-label={spoken} className={['mu-kbd', 'mu-type-readout', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </kbd>
  );
});
