'use client';

import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import type { Ref } from 'react';

/* ─────────────────────────────────────────────────────────
 * SCROLL AREA, a region that scrolls with the system's own scrollbar, on Base UI ScrollArea
 *
 *   rest      no bar; content fades out at an edge only when there is more beyond it
 *   show      scrolling, or the pointer over the region: the bar fades in on the settle spring; the edge fades grow as you move away
 *             from an edge and shrink as you reach it
 *   stop      600 ms later the bar fades out on the release spring
 *   reach     the pointer on the bar itself widens the thumb from 4 to 8 on the part spring
 *   keys      the viewport takes focus: arrows, Page Up/Down, Home and End scroll it
 * Reduce Motion: the thumb's width snaps; the fades stay (they are not travel).
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-scroll-area relative min-h-0 overflow-hidden';
const VIEWPORT = 'mu-scroll-area-viewport scroll-area-fill overscroll-contain outline-none focus-visible:focus-ring-flush scroll-area-fade';
const BAR = 'mu-scroll-area-bar absolute top-0 end-0 bottom-0 flex justify-center p-scroll-area-bar-inset data-[orientation=vertical]:w-scroll-area-bar-size scroll-area-bar';
const THUMB = 'mu-scroll-area-thumb scroll-area-thumb reduced-motion:transition-none';

export interface ScrollAreaProps extends Omit<BaseScrollArea.Root.Props, 'className' | 'onScroll'> {
  className?: string;
  /** The scrollable viewport. Use it to scroll, focus, or read its current offset. The normal ref still points to the root. */
  viewportRef?: Ref<HTMLDivElement>;
  /** Fires on the scrollable viewport, including keyboard and programmatic scrolling. */
  onScroll?: BaseScrollArea.Viewport.Props['onScroll'];
  /** Name the region for assistive tech when it is a landmark of its own. */
  'aria-label'?: string;
}

/** A region that scrolls vertically with the system's scrollbar. Give it a height (or max-height). */
export function ScrollArea({ className, children, viewportRef, onScroll, 'aria-label': label, ...props }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root className={className ? `${ROOT} ${className}` : ROOT} {...props}>
      <BaseScrollArea.Viewport ref={viewportRef} onScroll={onScroll} className={VIEWPORT} tabIndex={0} aria-label={label} role={label ? 'region' : undefined}>
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar orientation="vertical" className={BAR}>
        <BaseScrollArea.Thumb className={THUMB} />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  );
}
