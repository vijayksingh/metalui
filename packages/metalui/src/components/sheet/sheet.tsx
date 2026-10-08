'use client';

import * as React from 'react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { Surface } from '../surface/surface';

/* ─────────────────────────────────────────────────────────
 * SHEET, a panel that slides in from an edge, on Base UI Drawer
 *
 *   open      the scrim fades; the sheet slides its whole size in from its edge on the surface
 *             spring (no stop, no overshoot); focus moves into it
 *   drag      it follows the finger one to one (right: sideways; bottom: down)
 *   let go    past the threshold it leaves on the release spring, a harder flick sooner;
 *             short of it, it settles home on the settle spring
 *   close     Esc, the scrim, or a Close part: it leaves on the release spring; focus returns
 * Reduce Motion: it fades, with no slide.
 * The plate and scrim are the dialog's; the sheet recipe adds the edge, the grip and the motion.
 * Slots: Sheet.Root, Sheet.Trigger, Sheet.Popup, Sheet.Title, Sheet.Description, Sheet.Close.
 * ───────────────────────────────────────────────────────── */

type Side = 'right' | 'bottom';
const SideCtx = React.createContext<Side>('right');

const SCRIM = 'mu-sheet-scrim fixed inset-0 z-dialog-scrim-z bg-dialog-scrim-color backdrop-dialog-scrim-blur reduce-transparency:bg-dialog-scrim-opaque reduce-transparency:backdrop-blur-none transition-opacity ease-surface duration-surface data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:ease-release data-ending-style:duration-release';
const VIEWPORT = 'mu-sheet-viewport fixed inset-0 z-dialog-scrim-z pointer-events-none';
const POPUP = {
  right: 'mu-sheet pointer-events-auto fixed top-0 right-0 bottom-0 box-border flex flex-col gap-sheet-gap sheet-width p-sheet-pad rounded-l-sheet-radius outline-none overflow-y-auto overscroll-contain sheet-motion',
  bottom: 'mu-sheet pointer-events-auto fixed inset-x-0 bottom-0 box-border flex flex-col gap-sheet-gap sheet-max-height p-sheet-pad pt-0 rounded-t-sheet-radius outline-none overflow-y-auto overscroll-contain sheet-motion',
};
const GRIP = 'mu-sheet-grip self-center mt-sheet-grip-gap w-sheet-grip-width h-sheet-grip-height rounded-pill recipe-switch';

export interface SheetRootProps extends Omit<BaseDrawer.Root.Props, 'swipeDirection'> {
  /** The edge it comes from: right (an inspector, the default) or bottom (a phone sheet). */
  side?: Side;
}

function Root({ side = 'right', children, ...props }: SheetRootProps) {
  return (
    <SideCtx.Provider value={side}>
      <BaseDrawer.Root swipeDirection={side === 'right' ? 'right' : 'down'} {...props}>{children}</BaseDrawer.Root>
    </SideCtx.Provider>
  );
}

function Trigger(props: BaseDrawer.Trigger.Props) {
  return <BaseDrawer.Trigger {...props} />;
}

/** The sheet itself, with its scrim: title, description and content inside. */
function Popup({ className, children, ...props }: BaseDrawer.Popup.Props & { className?: string }) {
  const side = React.useContext(SideCtx);
  const own = POPUP[side];
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className={SCRIM} />
      <BaseDrawer.Viewport className={VIEWPORT}>
        <BaseDrawer.Popup data-side={side} {...props} className={className ? `${own} ${className}` : own} render={<Surface material="plate" />}>
          {side === 'bottom' && <span aria-hidden className={GRIP} />}
          {children}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

function Title({ className, ...props }: BaseDrawer.Title.Props & { className?: string }) {
  return <BaseDrawer.Title className={className ? `mu-sheet-title m-0 type-title text-ink ${className}` : 'mu-sheet-title m-0 type-title text-ink'} {...props} />;
}

function Description({ className, ...props }: BaseDrawer.Description.Props & { className?: string }) {
  return <BaseDrawer.Description className={className ? `mu-sheet-description m-0 type-body text-ink2 ${className}` : 'mu-sheet-description m-0 type-body text-ink2'} {...props} />;
}

function Close(props: BaseDrawer.Close.Props) {
  return <BaseDrawer.Close {...props} />;
}

export const Sheet = Object.assign(Root, { Trigger, Popup, Title, Description, Close, Root });
