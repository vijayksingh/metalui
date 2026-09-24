'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Surface, type SurfaceMaterial, type SurfaceRadius } from '../surface/surface';
import './dialog.css';

/* DIALOG: a modal layer on Base UI Dialog. A scrim behind a surface near the top of the viewport;
 * it rises a step on the surface spring and closes on release. Focus stays inside; Escape and a
 * click outside close it. Slots: Dialog.Root, Dialog.Popup. */

export interface DialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Root({ open, onOpenChange, children }: DialogRootProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="mu-dialog-scrim" />
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
    <BaseDialog.Popup className={className ? `mu-dialog ${className}` : 'mu-dialog'} aria-label={props['aria-label']} render={<Surface material={material} radius={radius} />}>
      {children}
    </BaseDialog.Popup>
  );
}

export const Dialog = Object.assign(Root, { Root, Popup });
