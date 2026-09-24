'use client';

import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { Kbd } from '../kbd/kbd';

/* ─────────────────────────────────────────────────────────
 * TOAST (object sheet) on Base UI Toast
 *   show     one at a time; arrives one nest from below from .97 on settle
 *   undo     a cap with ⌘Z; the toast stays 5 s (plain 2.6 s); errors stay until resolved
 *   leave    on release, the way it came (a crossfade under Reduce Motion)
 * Toasts are for a person's own actions with Undo, never for recognition.
 * ───────────────────────────────────────────────────────── */

export type ToastTone = 'default' | 'success' | 'error';

export interface ToastOptions {
  /** What happened, as the person would say it: "Moved 3 blocks", "Pinned as a live region". */
  title: string;
  /** A short detail after a middle dot: "it updates as you write". */
  sub?: string;
  /** Undo the action. Adds the Undo cap and keeps the toast 5 s. */
  undo?: () => void;
  /** success carries its check; error stays until resolved. */
  tone?: ToastTone;
  /** Override how long it stays, in ms (0: until dismissed). */
  timeout?: number;
}

const ms = (name: string, fallback: number) =>
  typeof window === 'undefined' ? fallback : parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;

/** Shows toasts. Call show() from anywhere under a ToastProvider. */
export function useToast() {
  const manager = Toast.useToastManager();
  return React.useMemo(() => ({
    show({ title, sub, undo, tone = 'default', timeout }: ToastOptions) {
      return manager.add({
        title,
        description: sub,
        type: tone,
        timeout: timeout ?? (tone === 'error' ? 0 : undo ? ms('--mu-toast-undo-ms', 5000) : ms('--mu-toast-plain-ms', 2600)),
        actionProps: undo ? { onClick: undo } : undefined,
      });
    },
    dismiss: (id: string) => manager.close(id),
  }), [manager]);
}

/* Styled with the theme's utilities (the toast recipe): a graphite glass pill that rises one nest from
 * below on settle and leaves the way it came on release; the Undo cap presses by the material's travel. */
const VIEWPORT = 'mu-toast-viewport fixed left-1/2 bottom-toast-bottom z-toast-z -translate-x-1/2 flex flex-col items-center outline-none';
const TOAST = 'mu-toast group/toast flex items-center gap-toast-gap h-toast-height pl-toast-pad-left pr-toast-pad-right not-has-[.mu-toast-undo]:pr-toast-pad-left rounded-pill whitespace-nowrap type-toast text-toast-ink recipe-toast backdrop-toast-blur transition-toast data-starting-style:toast-enter data-ending-style:toast-leave reduce-transparency:opaque-frost-graphite';
const TEXT = 'mu-toast-text inline-flex items-center gap-toast-text-gap';
const SUB = 'mu-toast-sub text-toast-sub-ink';
const CHECK = 'mu-toast-check text-success';
const UNDO = 'mu-toast-undo inline-flex items-center gap-toast-undo-gap h-toast-undo-height pl-toast-undo-pad-left pr-toast-undo-pad-right border-0 rounded-pill type-toast-undo text-inherit recipe-toast-undo cursor-pointer transition-transform ease-release duration-release active:translate-y-press active:duration-toast-undo-press focus-visible:toast-undo-focus';
const KEY = 'text-toast-kbd-ink recipe-toast-kbd';

/** The toast's part classes, for stills of it outside the toast region (docs, previews). */
export const toastParts = { TOAST, TEXT, SUB, UNDO, KEY } as const;

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className={VIEWPORT}>
        {toasts.map((t) => (
          <Toast.Root key={t.id} toast={t} className={TOAST} data-type={t.type}>
            <span className={TEXT}>
              {t.type === 'success' && <span aria-hidden className={CHECK}>✓</span>}
              <Toast.Title render={<span />}>{t.title}</Toast.Title>
              {t.description && <Toast.Description render={<span className={SUB} />}>· {t.description}</Toast.Description>}
            </span>
            {t.actionProps && (
              <Toast.Action className={UNDO} aria-keyshortcuts="Meta+Z">
                Undo <Kbd surface="plain" className={KEY}>⌘Z</Kbd>
              </Toast.Action>
            )}
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** Put once near the root: the toast region at the bottom centre, one toast at a time. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider limit={1}>
      {children}
      <ToastList />
    </Toast.Provider>
  );
}
