'use client';

import * as React from 'react';
import { ViewTransition, addTransitionType, startTransition } from 'react';

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
 * ───────────────────────────────────────────────────────── */

export type MorphMaterial = 'graphite-deep' | 'tool' | 'pop';
export type MorphKind = 'open' | 'close';

/** Change a shape's state as a morph: skips a running one, then runs the update in a transition. */
export function morphTo(update: () => void, kind?: MorphKind) {
  if (typeof document !== 'undefined') (document as Document & { activeViewTransition?: { skipTransition(): void } }).activeViewTransition?.skipTransition();
  startTransition(() => {
    if (kind) addTransitionType(kind);
    update();
  });
}

export interface MorphShapeProps {
  /** The one element that is the shape (it paints its own surface at rest). */
  children: React.ReactElement;
  /** The shape's material, painted on its outline while it travels. */
  material: MorphMaterial;
  /** The edge the body grows from, where the contents stay pinned: top (drops down) or left (opens sideways). */
  from?: 'top' | 'left';
  /** A shared name, when the closed and open states are different elements (render one at a time). */
  name?: string;
}

/**
 * The body and contents boundaries around one shape. The child is the body; its own children are
 * the contents. The body gets `view-transition-group: contain` so the contents' group nests inside
 * it and is clipped by the travelling outline.
 */
export function MorphShape({ children, material, from = 'top', name }: MorphShapeProps) {
  const body = { open: `mu-morph-body mu-morph-${material}`, close: `mu-morph-body mu-morph-closing mu-morph-${material}`, default: `mu-morph-body mu-morph-${material}` };
  const content = `mu-morph-contents mu-morph-from-${from}`;
  const child = children as React.ReactElement<{ style?: React.CSSProperties; children?: React.ReactNode }>;
  const inner = (
    <ViewTransition update={content} enter={content} exit={content}>
      <span className="mu-morph-contents">{child.props.children}</span>
    </ViewTransition>
  );
  const shape = React.cloneElement(child, { style: { ...child.props.style, viewTransitionGroup: 'contain' } as React.CSSProperties }, inner);
  return name
    ? <ViewTransition name={name} share={body} update={body}>{shape}</ViewTransition>
    : <ViewTransition update={body}>{shape}</ViewTransition>;
}

/**
 * A part that is in both states (the capsule's own row inside its panel): it travels with its own
 * group on the body's spring instead of dissolving with the content, so it never ghosts.
 * The name must be unique on the page (useId).
 */
export function MorphPart({ name, children }: { name: string; children: React.ReactElement }) {
  return <ViewTransition name={name} update="mu-morph-part" share="mu-morph-part">{children}</ViewTransition>;
}
