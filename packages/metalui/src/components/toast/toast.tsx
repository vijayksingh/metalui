'use client';

import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { Kbd } from '../kbd/kbd';
import './toast.css';

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

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="mu-toast-viewport">
        {toasts.map((t) => (
          <Toast.Root key={t.id} toast={t} className="mu-toast" data-type={t.type}>
            <span className="mu-toast-text">
              {t.type === 'success' && <span aria-hidden className="mu-toast-check">✓</span>}
              <Toast.Title render={<span />}>{t.title}</Toast.Title>
              {t.description && <Toast.Description render={<span className="mu-toast-sub" />}>· {t.description}</Toast.Description>}
            </span>
            {t.actionProps && (
              <Toast.Action className="mu-toast-undo" aria-keyshortcuts="Meta+Z">
                Undo <Kbd surface="sunk">⌘Z</Kbd>
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
