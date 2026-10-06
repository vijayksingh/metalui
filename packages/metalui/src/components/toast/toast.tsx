'use client';

import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { MorphIcon } from '../../icons/MorphIcon';
import type { MorphIconName } from '../../icons/morph.generated';
import { SwapText } from '../../motion/swap';
import { Icon } from '../../icons/Icon';
import { Kbd } from '../kbd/kbd';
import { useIsoLayoutEffect } from '../../motion/layout-effect';

/* ─────────────────────────────────────────────────────────
 * TOAST (object sheet) on Base UI Toast: a deck in depth, not a column
 *
 * rest      the newest toast in front; each older one a step back behind it:
 *           scale .95 per step, peeking 8 past the card in front on the side away
 *           from the screen edge (a bottom deck peeks upward), 20% dimmer, its
 *           words hidden; 3 drawn, the rest counted (+2) above the back card
 * arrive
 *     0ms   the new toast rises 8 from below, from .97 and opacity 0, into the
 *           front on the object spring (0.92 s); in the same frame every card
 *           behind moves back one step on the same spring; the fade is on settle
 * fan out   pointer on the deck, or Tab / F6 into it: the cards spread into a
 *           readable column, 8 apart, on the surface spring (0.5 s); every
 *           timer pauses (Base UI)
 * fold      the pointer or focus leaves: back into the deck on the surface spring;
 *           the timers resume
 * swipe     the card follows the pointer one to one (down or right); on release
 *           past 40 it leaves the way it was thrown on the release spring;
 *           short of it, it springs home; the next card comes forward
 * close     its close key, or Esc on the focused toast: it leaves on release,
 *           sinking 8; the next card comes forward on the object spring
 * repeat    the same result again adds no card: the front card presses to .96
 *           and springs back on the part spring, and counts (×2, ×3 …); its
 *           timer starts over
 * time out  undoable 5 s, plain 2.6 s, an error never
 * Only the front card is new, so only it is announced (the polite region).
 * Reduce Motion: no travel or scale; cards cross-fade into place (settle),
 * the press is only the count.
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
  /** An explicit state shape, such as synced/offline/sync-error; otherwise the kind owns it. */
  glyph?: MorphIconName;
  /** Let the host own Undo shortcuts instead. Default true; text editing always keeps its own Undo. */
  undoShortcut?: boolean;
  /** Override how long it stays, in ms (0: until dismissed). */
  timeout?: number;
}

/** What a toast carries besides its words: how many times it has been said in a row. */
interface ToastData { count: number; undo?: () => void; undoShortcut: boolean; glyph?: MorphIconName }

export interface ToastPromiseOptions<Value> {
  loading: ToastOptions;
  success: ToastOptions | ((value: Value) => ToastOptions);
  error: ToastOptions | ((error: unknown) => ToastOptions);
}

const cssValue = (name: string) => (typeof window === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim());
const ms = (name: string, fallback: number) => {
  const v = cssValue(name);
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
};
const count = (name: string, fallback: number) => Math.max(1, Math.round(parseFloat(cssValue(name))) || fallback);

/** One mapping serves new cards, retained updates and async results. */
const toastOptions = ({ title, sub, undo, tone = 'default', timeout, undoShortcut = true, glyph }: ToastOptions, count = 1) => ({
  title, description: sub, type: tone,
  timeout: timeout ?? (tone === 'error' ? 0 : undo ? ms('--mu-toast-undo-ms', 5000) : ms('--mu-toast-plain-ms', 2600)),
  actionProps: undo ? { onClick: undo } : undefined,
  data: { count, undo, undoShortcut, glyph } satisfies ToastData,
});

/** Shows action results under a ToastProvider. Updates retain the card, glyph and label drum. */
export function useToast() {
  const manager = Toast.useToastManager();
  const toasts = React.useRef(manager.toasts);
  toasts.current = manager.toasts;
  return React.useMemo(() => ({
    show(options: ToastOptions) {
      const { title, sub, tone = 'default' } = options;
      const front = toasts.current.find((t) => t.transitionStatus !== 'ending');
      const repeat = front && front.title === title && (front.description ?? undefined) === sub && front.type === tone;
      const times = repeat ? ((front.data as ToastData | undefined)?.count ?? 1) + 1 : 1;
      return manager.add<ToastData>({ id: repeat ? front.id : undefined, ...toastOptions(options, times) });
    },
    /** A complete replacement of one live card. Closing/missing cards remain dismissed. */
    update(id: string, options: ToastOptions): boolean {
      if (!toasts.current.some(t => t.id === id && t.transitionStatus !== 'ending')) return false;
      manager.update<ToastData>(id, toastOptions(options)); return true;
    },
    /** Base UI owns one loading card and updates its kind after this actual promise settles. */
    promise<Value>(work: Promise<Value>, options: ToastPromiseOptions<Value>): Promise<Value> {
      return manager.promise<Value, ToastData>(work, {
        loading: toastOptions({ ...options.loading, timeout: 0 }),
        success: value => toastOptions({ ...(typeof options.success === 'function' ? options.success(value) : options.success), tone: 'success' }),
        error: error => toastOptions({ ...(typeof options.error === 'function' ? options.error(error) : options.error), tone: 'error' }),
      });
    },
    dismiss: (id: string) => manager.close(id),
  }), [manager]);
}

/* Styled with the theme's utilities (the toast recipe): a glass pill in the colorway; DECK stacks the pills in
 * depth, fans them out, follows a swipe, and moves them in and out; the Undo cap presses by the material's travel. */
const VIEWPORT = 'mu-toast-viewport fixed inset-x-0 bottom-toast-bottom z-toast-z h-0 outline-none toast-deck-viewport';
const TOAST = 'mu-toast group/toast flex items-center gap-toast-gap min-h-toast-height pl-toast-pad-left pr-toast-pad-right not-has-[button]:pr-toast-pad-left rounded-pill whitespace-nowrap type-toast text-toast-ink recipe-toast backdrop-toast-blur reduce-transparency:opaque-frost';
const DECK = 'toast-deck transition-toast toast-bump outline-none focus-visible:toast-undo-focus touch-none select-none';
const CONTENT = 'mu-toast-content toast-content';
const TEXT = 'mu-toast-text inline-flex items-center gap-toast-text-gap';
const SUB = 'mu-toast-sub text-toast-sub-ink';
const COUNT = 'mu-toast-count text-toast-sub-ink tabular-nums';
const CHECK = 'mu-toast-check text-success';
const ERROR = 'mu-toast-error text-red';
const UNDO = 'mu-toast-undo inline-flex items-center gap-toast-undo-gap h-toast-undo-height pl-toast-undo-pad-left pr-toast-undo-pad-right border-0 rounded-pill type-toast-undo text-inherit recipe-toast-undo cursor-pointer transition-transform ease-release duration-release active:translate-y-press active:duration-toast-undo-press focus-visible:toast-undo-focus';
const CLOSE = 'mu-toast-close inline-grid place-items-center size-toast-close-size p-0 border-0 rounded-pill bg-transparent text-toast-close-ink cursor-pointer hover:recipe-toast-undo hover:text-toast-ink transition-transform ease-release duration-release active:translate-y-press active:duration-toast-undo-press focus-visible:toast-undo-focus';
const MORE = 'mu-toast-more toast-more type-meta text-toast-sub-ink recipe-toast-undo rounded-pill';
const KEY = 'text-toast-kbd-ink recipe-toast-kbd';

/** The toast's part classes, for stills of it outside the toast region (docs, previews). */
export const toastParts = { TOAST, TEXT, SUB, UNDO, KEY } as const;

/** The viewport, told when the deck folds: folding plays on the surface spring, like fanning out. */
const DeckViewport = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'> & { expanded: boolean; frontId?: string }>(function DeckViewport({ expanded, frontId, ...props }, forwardedRef) {
  const element = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => element.current!, []);
  useIsoLayoutEffect(() => {
    const viewport = element.current;
    const front = viewport?.querySelector<HTMLElement>('[data-front]');
    if (!viewport || !front) return;
    const measure = () => viewport.style.setProperty('--mu-toast-front-width', `${front.offsetWidth}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(front);
    return () => observer.disconnect();
  }, [frontId]);
  // The deck expands on hover and folds on mouseleave. Dismissing the card under the pointer removes
  // it, so the viewport may never get that mouseleave and would stay fanned out. While expanded, a
  // pointer anywhere outside the deck is handed to Base UI's own leave handler (which still waits for
  // a card that is animating out). Nothing listens while the deck is folded.
  const leave = React.useRef(props.onMouseLeave);
  leave.current = props.onMouseLeave;
  React.useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !(event.target instanceof Node) || element.current?.contains(event.target)) return;
      leave.current?.(event as unknown as React.MouseEvent<HTMLDivElement>);
    };
    document.addEventListener('pointermove', outside, { passive: true });
    document.addEventListener('pointerdown', outside, { passive: true });
    return () => { document.removeEventListener('pointermove', outside); document.removeEventListener('pointerdown', outside); };
  }, [expanded]);
  const [folding, setFolding] = React.useState(false);
  const was = React.useRef(expanded);
  // A layout effect, so data-folding lands in the same style change as the fold itself.
  useIsoLayoutEffect(() => {
    const fold = was.current && !expanded;
    was.current = expanded;
    if (!fold) return setFolding(false);
    setFolding(true);
    const t = window.setTimeout(() => setFolding(false), ms('--mu-spring-surface-d', 500));
    return () => window.clearTimeout(t);
  }, [expanded]);
  return <div {...props} ref={element} data-folding={folding ? '' : undefined} />;
});

function ToastList({ visible }: { visible: number }) {
  const manager = Toast.useToastManager();
  const { toasts } = manager;
  const live = toasts.filter((t) => t.transitionStatus !== 'ending');
  React.useEffect(() => {
    const undo = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key.toLowerCase() !== 'z' || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return;
      const focused = target instanceof Element ? target.closest<HTMLElement>('[data-toast-id]')?.dataset.toastId : undefined;
      const actionable = live.filter((toast) => { const data = toast.data as ToastData | undefined; return data?.undo && data.undoShortcut; });
      const toast = actionable.find((toast) => toast.id === focused) ?? actionable[0];
      if (!toast) return;
      event.preventDefault();
      (toast.data as ToastData).undo?.();
      manager.close(toast.id);
    };
    window.addEventListener('keydown', undo);
    return () => window.removeEventListener('keydown', undo);
  }, [manager, toasts]);
  const front = live[0];
  const frontCount = (front?.data as ToastData | undefined)?.count ?? 1;
  const more = Math.max(0, live.length - visible);
  const back = more > 0 ? live[visible - 1]?.id : undefined;
  return (
    <Toast.Portal>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-toast-announcement="">
        {front && <span key={front.id}>{front.title}{front.description ? ` · ${front.description}` : ''}{frontCount > 1 ? ` · ${frontCount} times` : ''}</span>}
      </span>
      <Toast.Viewport aria-live="off" className={VIEWPORT} render={(props, state) => <DeckViewport {...props} expanded={state.expanded} frontId={live[0]?.id} />}>
        {toasts.map((t) => {
          const times = (t.data as ToastData | undefined)?.count ?? 1;
          return (
            <Toast.Root key={t.id} toast={t} className={`${TOAST} ${DECK}`} aria-live="off" aria-atomic="true" data-type={t.type} data-toast-id={t.id} data-front={t.id === live[0]?.id ? '' : undefined} data-behind={t.id !== live[0]?.id ? '' : undefined} data-bump={times > 1 ? (times % 2 ? 'a' : 'b') : undefined}>
              <Toast.Content className={CONTENT}>
                <span className={TEXT}>
                  <MorphIcon name={(t.data as ToastData | undefined)?.glyph ?? (t.type === 'success' ? 'check' : t.type === 'error' ? 'sync-error' : 'info')} size={14}
                    className={t.type === 'success' ? CHECK : t.type === 'error' ? ERROR : 'text-toast-sub-ink'} />
                  <Toast.Title render={<span />}>{typeof t.title === 'string' ? <SwapText value={t.title} /> : t.title}</Toast.Title>
                  {t.description && <Toast.Description render={<span className={SUB} />}>· {t.description}</Toast.Description>}
                  {times > 1 && <span className={COUNT}>×{times}</span>}
                </span>
                {t.actionProps && (
                  <Toast.Action onClick={() => manager.close(t.id)} className={UNDO} aria-keyshortcuts={(t.data as ToastData | undefined)?.undoShortcut ? 'Meta+Z Control+Z' : undefined}>
                    Undo {(t.data as ToastData | undefined)?.undoShortcut && <Kbd surface="plain" className={KEY}>⌘Z</Kbd>}
                  </Toast.Action>
                )}
                <Toast.Close className={CLOSE} aria-label="Dismiss">
                  <Icon name="close" size={14} animate={false} />
                </Toast.Close>
              </Toast.Content>
              {t.id === back && <span aria-hidden className={MORE}>+{more}</span>}
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

/** Put once near the root: the toast deck at the bottom centre, newest in front. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // How many cards the deck draws is the recipe's; Base UI marks the rest limited (inert, not drawn).
  const [visible] = React.useState(() => count('--mu-r-toast-deck-visible', 3));
  return (
    <Toast.Provider limit={visible}>
      {children}
      <ToastList visible={visible} />
    </Toast.Provider>
  );
}
