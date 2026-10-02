'use client';

import * as React from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Surface } from '../surface/surface';
import { Button, type ButtonProps } from '../button/button';
import { refuse } from '../../motion/refuse';

/* ─────────────────────────────────────────────────────────
 * ALERT DIALOG, a question that must be answered, on Base UI AlertDialog
 *
 *   open      the scrim fades and the plate rises a step on the surface spring (the dialog's
 *             own motion); focus starts on Cancel, the safe answer
 *   outside   a click on the scrim does not close it: the plate shakes once on the refusal
 *             spring, one nest (6) aside, ringing out against where it stands
 *   answer    Cancel or Esc closes with nothing done; the confirm button runs the thing and closes
 *   close     the plate leaves on the release spring; focus returns to what opened it
 * Reduce Motion: no shake (the refusal travel is zero); the rise is a crossfade.
 * The plate, scrim and layout are the dialog recipe's; this adds only the refusal and the answers.
 * Slots: AlertDialog.Root, Popup, Title, Description, Actions, Cancel, Confirm.
 * ───────────────────────────────────────────────────────── */

const SCRIM = 'mu-alert-dialog-scrim fixed inset-0 z-dialog-scrim-z bg-dialog-scrim-color backdrop-dialog-scrim-blur reduce-transparency:bg-dialog-scrim-opaque reduce-transparency:backdrop-blur-none transition-opacity ease-surface duration-surface data-starting-style:opacity-0 data-ending-style:opacity-0';
const POPUP = 'mu-alert-dialog mu-dialog dialog-frame fixed z-dialog-scrim-z dialog-top left-1/2 -translate-x-1/2 outline-none transition-dialog data-starting-style:dialog-enter data-ending-style:dialog-enter data-ending-style:duration-release data-ending-style:ease-release';
const DESCRIPTION = 'mu-alert-dialog-description alert-dialog-description type-body text-ink2';

interface Ctx { cancel: React.RefObject<HTMLButtonElement | null>; popup: React.RefObject<HTMLDivElement | null> }
const AlertCtx = React.createContext<Ctx | null>(null);

export interface AlertDialogRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Root({ open, onOpenChange, children }: AlertDialogRootProps) {
  const cancel = React.useRef<HTMLButtonElement>(null);
  const popup = React.useRef<HTMLDivElement>(null);
  return (
    <AlertCtx.Provider value={{ cancel, popup }}>
      <BaseAlertDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
        <BaseAlertDialog.Portal>
          <BaseAlertDialog.Backdrop className={SCRIM} onPointerDown={() => refuse(popup.current)} />
          {children}
        </BaseAlertDialog.Portal>
      </BaseAlertDialog.Root>
    </AlertCtx.Provider>
  );
}

export interface AlertDialogPopupProps extends Omit<BaseAlertDialog.Popup.Props, 'render' | 'className'> { className?: string }

function Popup({ className, children, ...props }: AlertDialogPopupProps) {
  const ctx = React.useContext(AlertCtx)!;
  return (
    <BaseAlertDialog.Popup ref={ctx.popup} initialFocus={ctx.cancel} {...props} className={className ? `${POPUP} ${className}` : POPUP} render={<Surface material="plate" radius="card" />}>
      {children}
    </BaseAlertDialog.Popup>
  );
}

/** The question, in the title role: "Delete 3 regions?" */
function Title({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <BaseAlertDialog.Title {...props} className={className ? `mu-dialog-title type-title text-ink ${className}` : 'mu-dialog-title type-title text-ink'} />;
}

/** What happens if you say yes: "Their notes move to the past for 30 days." */
function Description({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <BaseAlertDialog.Description {...props} className={className ? `${DESCRIPTION} ${className}` : DESCRIPTION} />;
}

function Actions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={className ? `mu-dialog-actions dialog-actions ${className}` : 'mu-dialog-actions dialog-actions'} />;
}

/** The safe answer: closes with nothing done. Focus starts here. */
function Cancel({ children = 'Cancel' }: { children?: React.ReactNode }) {
  const ctx = React.useContext(AlertCtx)!;
  return <BaseAlertDialog.Close ref={ctx.cancel} render={<Button />}>{children}</BaseAlertDialog.Close>;
}

export interface AlertDialogConfirmProps {
  children: React.ReactNode;
  onClick: () => void;
  /** destructive (the default) for a loss; primary for a weighty but safe yes. */
  tone?: 'destructive' | 'primary';
  /** Hold only for irreversible loss. Undoable deletes stay ordinary presses. */
  hold?: ButtonProps['hold'];
  icon?: React.ReactNode;
}

/** The answer that does the thing, last; it closes after it runs. */
function Confirm({ children, onClick, tone = 'destructive', hold = false, icon }: AlertDialogConfirmProps) {
  return <BaseAlertDialog.Close render={<Button cap={tone} hold={hold} icon={icon} />} onClick={onClick}>{children}</BaseAlertDialog.Close>;
}

export const AlertDialog = Object.assign(Root, { Popup, Title, Description, Actions, Cancel, Confirm, Root });
