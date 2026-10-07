'use client';

import * as React from 'react';
import { ViewTransition, addTransitionType, startTransition } from 'react';

/* ─────────────────────────────────────────────────────────
 * MORPH SHAPE, one shape, many states (docs/ONE-SHAPE.md)
 *
 * Wrap the one shape whose content changes (a capsule that opens into a panel, a trigger that
 * becomes its popover). Change its state with morphTo():
 *
 *     0 ms   the shell's outline starts travelling from the old box to the new on the surface
 *            spring (close: the release spring), painted with its material, corners true
 *     0 ms   the old content dissolves out (dissolve-out) and shrinks to reveal-scale
 *    ~0 ms   the new content dissolves in (dissolve-in) from reveal-scale, pinned to the top
 *   ~500 ms  rest: the real element is back, nothing runs
 * An interrupt skips the running morph and starts from the state on screen.
 * Reduce Motion: no travel, a cross-dissolve. Without View Transitions the state just changes.
 * ───────────────────────────────────────────────────────── */

export type MorphMaterial = 'graphite-deep' | 'raise' | 'pop';
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
  /** Where the content is pinned while it changes: top (a shape that drops down) or centre. */
  anchor?: 'top' | 'center';
  /** A shared name, when the closed and open states are different elements (render one at a time). */
  name?: string;
}

/**
 * The shell and content boundaries around one shape. The child is the shell; its own children are
 * the content. Give the shell `view-transition-group: contain` (MorphShape does) so the content's
 * group nests inside it and is clipped by the travelling outline.
 */
export function MorphShape({ children, material, anchor = 'top', name }: MorphShapeProps) {
  const shell = { open: `mu-vt-shell mu-vt-${material}`, close: `mu-vt-shell mu-vt-close mu-vt-${material}`, default: `mu-vt-shell mu-vt-${material}` };
  const content = anchor === 'top' ? 'mu-vt-reveal mu-vt-top' : 'mu-vt-reveal';
  const child = children as React.ReactElement<{ style?: React.CSSProperties; children?: React.ReactNode }>;
  const inner = (
    <ViewTransition update={content} enter={content} exit={content}>
      <span className="mu-morph-shape-content">{child.props.children}</span>
    </ViewTransition>
  );
  const shape = React.cloneElement(child, { style: { ...child.props.style, viewTransitionGroup: 'contain' } as React.CSSProperties }, inner);
  return name
    ? <ViewTransition name={name} share={shell} update={shell}>{shape}</ViewTransition>
    : <ViewTransition update={shell}>{shape}</ViewTransition>;
}

/**
 * A part that is in both states (the capsule's own row inside its panel): it travels with its own
 * group on the shell's spring instead of dissolving with the content, so it never ghosts.
 * The name must be unique on the page (useId).
 */
export function MorphPart({ name, children }: { name: string; children: React.ReactElement }) {
  return <ViewTransition name={name} update="mu-vt-part" share="mu-vt-part">{children}</ViewTransition>;
}
