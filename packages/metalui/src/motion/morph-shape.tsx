'use client';

import * as React from 'react';
import { flushSync } from 'react-dom';

/* ─────────────────────────────────────────────────────────
 * MORPH SHAPE, one shape, many states (docs/ONE-SHAPE.md)
 *
 * Wrap the one shape whose contents change (a capsule that opens into a panel, a cap that opens
 * into a tray). Change its state with morphTo():
 *
 *     0 ms   the body's outline travels from the old box to the new on the surface spring
 *            (closing: the release spring), painted in its material, corners true
 *     0 ms   the leaving contents fade on the release spring; they do not travel
 *     0 ms   the arriving contents rise one nest from the edge the body grows from, at the
 *            popover's enter scale, on the surface spring (a MetalUI surface arriving)
 *            a part in both states (MorphPart) travels with the body instead
 *   ~500 ms  rest: the real element is back, nothing runs
 * An interrupt skips the running morph and starts from the state on screen. Travel scales by
 * --mu-travel-surface, so Reduce Motion leaves only the fades. Without View Transitions the
 * state simply changes.
 *
 * Built on the platform's View Transitions directly: every shape carries its transition name and
 * class at all times, and morphTo starts the transition and commits the change inside it with
 * flushSync. Nothing waits on another render, and no other render can cancel a morph.
 * ───────────────────────────────────────────────────────── */

export type MorphMaterial = 'graphite-deep' | 'tool' | 'pop';
export type MorphKind = 'open' | 'close';

type Running = { finished: Promise<void>; skipTransition(): void };
type Transitioning = Document & {
  startViewTransition?: (o: { update: () => void; types?: string[] }) => Running;
  activeViewTransition?: Running | null;
};

/** Change a shape's state as a morph: finishes a running one, then commits the change inside a new one. */
export function morphTo(update: () => void, kind?: MorphKind) {
  const doc = typeof document !== 'undefined' ? (document as Transitioning) : null;
  if (!doc?.startViewTransition) { update(); return; }
  doc.activeViewTransition?.skipTransition();
  doc.startViewTransition({ update: () => flushSync(update), types: kind ? [kind] : [] });
}

/** Run after the morph in flight lands (or now, if none): focus into new contents, a tooltip, a measure. */
export function afterMorph(fn: () => void) {
  const running = typeof document !== 'undefined' ? (document as Transitioning).activeViewTransition : undefined;
  if (running) running.finished.finally(fn);
  else fn();
}

/**
 * Give focus back to a morph's trigger once it lands, unless something else has taken focus since
 * (a dialog the morph opened, a control the person moved to): focus left on nothing is the only
 * focus that is ours to place.
 */
export function returnFocusAfterMorph(el: () => HTMLElement | null | undefined) {
  afterMorph(() => {
    const now = typeof document !== 'undefined' ? document.activeElement : null;
    if (!now || now === document.body) el()?.focus({ preventScroll: true });
  });
}

const css = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '');

export interface MorphShapeProps {
  /** The one element that is the shape (it paints its own surface at rest). */
  children: React.ReactElement;
  /** The shape's material, painted on its outline while it travels. */
  material: MorphMaterial;
  /** The edge the body grows from, where the contents stay pinned: top (drops down) or left (opens sideways). */
  from?: 'top' | 'left';
  /** A name shared by the closed and open elements when they are different elements (render one at a time). */
  name?: string;
}

/**
 * The body and its contents, named for the platform's view transitions. The child is the body; its
 * own children are the contents, wrapped once so they change as one (whatever replaces them, a
 * second page included). The body gets `view-transition-group: contain` so the contents' group
 * nests inside it and is clipped by the travelling outline.
 */
export function MorphShape({ children, material, from = 'top', name }: MorphShapeProps) {
  const id = css(React.useId());
  const body = name ? css(name) : `mu-${id}-body`;
  const child = children as React.ReactElement<{ style?: React.CSSProperties; children?: React.ReactNode }>;
  const contents = (
    <span className="mu-morph-contents" style={{ viewTransitionName: `mu-${id}-contents`, viewTransitionClass: `mu-morph-contents mu-morph-from-${from}` } as React.CSSProperties}>
      {child.props.children}
    </span>
  );
  return React.cloneElement(child, {
    style: { ...child.props.style, viewTransitionName: body, viewTransitionClass: `mu-morph-body mu-morph-${material}`, viewTransitionGroup: 'contain' } as React.CSSProperties,
  }, contents);
}

/**
 * A part that is in both states (the capsule's own row inside its panel, the cells beside a tray):
 * it travels with its own group on the body's spring instead of changing with the contents.
 */
export function MorphPart({ name, children }: { name: string; children: React.ReactElement }) {
  const child = children as React.ReactElement<{ style?: React.CSSProperties }>;
  return React.cloneElement(child, {
    style: { ...child.props.style, viewTransitionName: `mu-${css(name)}`, viewTransitionClass: 'mu-morph-part' } as React.CSSProperties,
  });
}
