'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Surface, type SurfaceMaterial, type SurfaceRadius } from '../surface/surface';

/* DIALOG: a modal layer on Base UI Dialog. A scrim behind a surface near the top of the viewport;
 * it rises a step on the surface spring and closes on release. Focus stays inside; Escape and a
 * click outside close it. It owns its layout (width, padding, gaps), so callers only fill it.
 * Slots: Dialog.Root, Dialog.Popup, Dialog.Title, Dialog.Actions. */

/* Styled with the theme's utilities (the dialog recipe): the scrim fades and the popup rises a step on
 * the surface spring, and leaves on release. */
const SCRIM = 'mu-dialog-scrim fixed inset-0 z-dialog-scrim-z bg-dialog-scrim-color transition-opacity ease-surface duration-surface data-starting-style:opacity-0 data-ending-style:opacity-0';
const POPUP = 'mu-dialog dialog-frame fixed z-dialog-scrim-z dialog-top left-1/2 -translate-x-1/2 outline-none transition-dialog data-starting-style:dialog-enter data-ending-style:dialog-enter data-ending-style:duration-release data-ending-style:ease-release';

export interface DialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Root({ open, onOpenChange, children }: DialogRootProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={SCRIM} />
        {children}
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export interface DialogPopupProps extends React.HTMLAttributes<HTMLDivElement> {
  material?: SurfaceMaterial;
  radius?: SurfaceRadius;
  'aria-label'?: string;
}

function Popup({ material = 'plate', radius = 'card', className, children, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Popup {...props} className={className ? `${POPUP} ${className}` : POPUP} render={<Surface material={material} radius={radius} />}>
      {children}
    </BaseDialog.Popup>
  );
}

/** What the dialog is for, in the title role; it names the dialog for assistive tech. */
function Title({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <BaseDialog.Title {...props} className={className ? `mu-dialog-title type-title text-ink ${className}` : 'mu-dialog-title type-title text-ink'} />;
}

/** The buttons, at the end: the one that does the thing last. */
function Actions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={className ? `mu-dialog-actions dialog-actions ${className}` : 'mu-dialog-actions dialog-actions'} />;
}

export const Dialog = Object.assign(Root, { Root, Popup, Title, Actions });
