'use client';

import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { usePortalColorway } from '../../theme/portal-colorway';

/* ─────────────────────────────────────────────────────────
 * POPOVER, a small panel that comes out of its trigger, on Base UI Popover
 *
 *    0 ms   the trigger is pressed; the plate appears one nest (6) back toward the trigger,
 *           at 0.97, grown from the trigger's side (transform-origin), transparent
 *   ~0 ms   it rises into place and fades in together on the surface spring (no overshoot)
 *  ~290 ms  near rest; focus is in the plate (the first field, or the plate itself)
 *   close   Esc, click outside, a Close part, or the trigger again: it fades out on the
 *           release spring and does not travel back; focus returns to the trigger
 * Reduce Motion: a crossfade (the surface travel is zero).
 * The plate is the menu's frosted plate; the popover recipe adds padding, width, text and motion.
 * Slots: Popover.Root, Popover.Trigger, Popover.Content, Popover.Title, Popover.Description, Popover.Close.
 * ───────────────────────────────────────────────────────── */

const POSITIONER = 'mu-popover-positioner z-menu-z';
const PLATE = [
  'mu-popover box-border min-w-popover-min-width max-w-popover-max-width p-popover-pad rounded-popover-radius outline-none',
  'recipe-menu backdrop-menu-blur reduce-transparency:opaque-frost',
  'popover-origin transition-popover data-starting-style:popover-away data-ending-style:popover-gone',
].join(' ');
const TITLE = 'mu-popover-title m-0 type-title text-ink';
const DESCRIPTION = 'mu-popover-description m-0 mt-popover-gap type-body text-ink2';
const BODY = 'mu-popover-body mt-popover-body-gap';

/** The popover's plate, title and description looks, for other plates that rise from a trigger. */
export const popoverParts = { PLATE, TITLE, DESCRIPTION } as const;

function offset() {
  if (typeof window === 'undefined') return 6;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-r-popover-self-offset')) || 6;
}

export type PopoverRootProps = BasePopover.Root.Props;

const AnchorContext = React.createContext<{
  anchor: Element | null;
  setAnchor: (element: Element | null) => void;
} | null>(null);

function Root({ onOpenChange, ...props }: PopoverRootProps) {
  const [anchor, setAnchor] = React.useState<Element | null>(null);
  const registerAnchor = React.useCallback((element: Element | null) => {
    if (element) setAnchor(current => current ?? element);
  }, []);
  const context = React.useMemo(() => ({ anchor, setAnchor: registerAnchor }), [anchor, registerAnchor]);
  return <AnchorContext.Provider value={context}>
    <BasePopover.Root {...props} onOpenChange={(open, details) => {
      // Base UI identifies the active trigger, including roots with several triggers.
      if (open && details.trigger) setAnchor(details.trigger);
      onOpenChange?.(open, details);
    }} />
  </AnchorContext.Provider>;
}

export interface PopoverTriggerProps extends Omit<BasePopover.Trigger.Props, 'render'> {
  /** The control that opens it (a Button, an icon button). It must accept a ref and props. */
  children: React.ReactElement;
}

const Trigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(function PopoverTrigger({ children, ...props }, forwardedRef) {
  const context = React.useContext(AnchorContext);
  const inner = React.useRef<HTMLElement | null>(null);
  const setAnchor = context?.setAnchor;
  const ref = React.useCallback((element: HTMLElement | null) => {
    inner.current = element;
    if (element) setAnchor?.(element);
  }, [setAnchor]);
  React.useImperativeHandle(forwardedRef, () => inner.current!);
  return <BasePopover.Trigger render={children} {...props} ref={ref} />;
});

export interface PopoverContentProps extends Omit<BasePopover.Popup.Props, 'className'> {
  side?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  /** Direct anchor for an existing input or editable cue, without another trigger control. */
  anchor?: BasePopover.Positioner.Props['anchor'];
}

/** The plate: portalled and placed beside its trigger. */
const Content = React.forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent({ side = 'bottom', align = 'center', className, anchor, ...props }, ref) {
  const context = React.useContext(AnchorContext);
  const resolved = typeof anchor === 'function' ? anchor() : anchor && 'current' in anchor ? anchor.current : anchor;
  const element = resolved && 'nodeType' in resolved ? resolved as Element : resolved && 'contextElement' in resolved ? resolved.contextElement : null;
  const colorway = usePortalColorway(element ?? context?.anchor);
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner anchor={anchor} data-mu-colorway={colorway} className={POSITIONER} side={side} align={align} sideOffset={offset()} collisionPadding={8}>
        <BasePopover.Popup ref={ref} className={className ? `${PLATE} ${className}` : PLATE} {...props} />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
});

function Title({ className, ...props }: BasePopover.Title.Props & { className?: string }) {
  return <BasePopover.Title className={className ? `${TITLE} ${className}` : TITLE} {...props} />;
}

function Description({ className, ...props }: BasePopover.Description.Props & { className?: string }) {
  return <BasePopover.Description className={className ? `${DESCRIPTION} ${className}` : DESCRIPTION} {...props} />;
}

/** The task's own content under the title: fields, a swatch row, actions. */
function Body({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className ? `${BODY} ${className}` : BODY} {...props} />;
}

function Close(props: BasePopover.Close.Props) {
  return <BasePopover.Close {...props} />;
}

export const Popover = Object.assign(Root, { Root, Trigger, Content, Title, Description, Body, Close });
