'use client';

import * as React from 'react';
import { Menu } from '../menu/menu';
import { Button, type ButtonProps } from '../button/button';
import { SwapText } from '../../motion/swap';

/* ─────────────────────────────────────────────────────────
 * MACHINED BAR STORYBOARD
 *       rest   one raised bar; fixed engraved seams; square interior faces
 *        0ms   one key sinks 1px in press50; neighbours and seams stay still
 *     release  key returns on release spring; optional rocker returns on part
 *       open   split chevron stays sunk; turns180 on part while menu exists
 *       value  noninteractive display turns its digits on settle, no tab stop
 *       latch  Toggle keeps its own lamp and sunk face inside the same bar
 * Reduced: no rocker tilt; chevron snaps; readout crossfades.
 * All physical values are shared recipe tokens; no frame loop runs at rest.
 * ───────────────────────────────────────────────────────── */
const BAR = 'mu-button-group inline-flex items-stretch rounded-pill recipe-button button-group-bar text-ink';
const SEGMENT = 'inline-flex button-group-seam';
const CLIP = 'inline-flex items-stretch overflow-hidden rounded-pill';
const CHEVRON = 'size-button-group-chevron-glyph button-group-chevron reduced-motion:transition-none';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  'aria-label': string;
  cap?: 'standard' | 'primary';
  size?: 'default' | 'compact';
  disabled?: boolean;
  /** Optional two-key rocker; never apply to a readout or to more than two keys. */
  rocker?: boolean;
}

/** Related operations cut into one raised bar. Each control keeps its own tab stop. */
export function ButtonGroup({ cap = 'standard', size = 'default', disabled = false, rocker = false, children, className, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onBlur, onKeyDown, onKeyUp, ...props }: ButtonGroupProps) {
  const [rock, setRock] = React.useState<'left' | 'right' | undefined>();
  const items = React.Children.toArray(children);
  const rocks = rocker && items.length === 2 && !disabled;
  const tip = (target: EventTarget | null) => {
    if (!rocks || !(target instanceof Element)) return;
    const segment = target.closest('[data-segment]');
    const button = target.closest('button');
    if (!button) return;
    if (button?.disabled || button?.hasAttribute('data-disabled') || button?.getAttribute('aria-disabled') === 'true') return;
    setRock(segment?.getAttribute('data-segment') === '0' ? 'left' : 'right');
  };
  React.useEffect(() => { if (!rocks) setRock(undefined); }, [rocks]);
  const own = `${BAR} ${cap === 'primary' ? 'recipe-button-primary text-button-primary-ink' : size === 'compact' ? 'recipe-button-compact' : ''} ${rocks ? 'button-group-rocker' : ''}`;
  return <div role="group" data-cap={cap} data-size={size} data-disabled={disabled ? '' : undefined} data-rock={rock} className={className ? `${own} ${className}` : own} {...props}
    onPointerDown={(e) => { onPointerDown?.(e); if (!e.defaultPrevented && e.button === 0) tip(e.target); }}
    onPointerUp={(e) => { onPointerUp?.(e); setRock(undefined); }}
    onPointerLeave={(e) => { onPointerLeave?.(e); setRock(undefined); }}
    onPointerCancel={(e) => { onPointerCancel?.(e); setRock(undefined); }}
    onBlur={(e) => { onBlur?.(e); setRock(undefined); }}
    onKeyDown={(e) => { onKeyDown?.(e); if (!e.defaultPrevented && (e.key === ' ' || e.key === 'Enter')) tip(e.target); }}
    onKeyUp={(e) => { onKeyUp?.(e); setRock(undefined); }}>
    <span className={CLIP}>{items.map((child, index) => <span key={React.isValidElement(child) ? child.key ?? index : index} data-segment={index} className={SEGMENT}>
      {React.isValidElement<ButtonProps>(child) && child.type === Button ? React.cloneElement(child, { cap, size, disabled: disabled || child.props.disabled }) : React.isValidElement<{ disabled?: boolean }>(child) && disabled && child.type !== ButtonGroupReadout ? React.cloneElement(child, { disabled: true }) : child}
    </span>)}</span>
  </div>;
}

export interface ButtonGroupReadoutProps {
  value: string;
  'aria-label': string;
}
/** A display window, not a reset button. Put reset in a labelled action if needed. */
export function ButtonGroupReadout({ value, 'aria-label': label }: ButtonGroupReadoutProps) {
  return <output aria-label={label} className="inline-grid place-items-center px-button-pad type-meta tabular-nums text-ink2 recipe-well-field"><SwapText value={value} /></output>;
}

export interface SplitButtonProps {
  children: React.ReactElement<ButtonProps>;
  menu: React.ReactNode;
  menuLabel: string;
  heading?: string;
  disabled?: boolean;
}

/** The main action and its alternatives share one cap, divided by one seam. */
export function SplitButton({ children, menu, menuLabel, heading, disabled }: SplitButtonProps) {
  const [open, setOpen] = React.useState(false);
  const cap = children.props.cap === 'primary' ? 'primary' : 'standard';
  const size = children.props.size ?? 'default';
  const unavailable = disabled || children.props.disabled || children.props.state === 'waiting' || children.props.state === 'done';
  React.useEffect(() => { if (unavailable) setOpen(false); }, [unavailable]);
  return <ButtonGroup aria-label={menuLabel} cap={cap} size={size} disabled={disabled}>
    {children}
    <Menu heading={heading} align="end" open={open} onOpenChange={setOpen}
      trigger={<Button cap={cap} size={size} disabled={unavailable} aria-label={menuLabel} className="w-button-group-chevron-width px-0!">
        <span className="inline-flex"><svg aria-hidden viewBox="0 0 12 12" className={CHEVRON} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5 6 7.5l3-3" /></svg></span>
      </Button>}>
      {menu}
    </Menu>
  </ButtonGroup>;
}
