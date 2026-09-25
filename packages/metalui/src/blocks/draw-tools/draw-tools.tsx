'use client';

import * as React from 'react';
import { Toolbar, ToolButton, ToolbarSeparator } from '../../components/toolbar/toolbar';
import { InkPicks, WidthPicks, type Ink, type InkWidth } from '../../components/draw-picks/draw-picks';
import { DrawIcon, PenIcon, MarkerIcon, LineIcon, ArrowIcon, RectangleIcon, EllipseIcon, EraserIcon } from '../../icons/components.generated';

/* ─────────────────────────────────────────────────────────
 * DRAW TOOLS: the drawing group of the toolbar (DRAWING.md DR-01, DR-06)
 *   Toolbar › ToolButton × 8 (one latched, with its LED) | InkPicks × 5 | WidthPicks × 3
 *
 * Keys: P pen, N pencil, M marker, L line, A arrow, R rectangle, O ellipse, E eraser.
 * The eraser has no ink or width, so those picks rest at 40 % while it is latched.
 * The host remembers the last ink and width per tool.
 * ───────────────────────────────────────────────────────── */

export type DrawTool = 'pen' | 'pencil' | 'marker' | 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'eraser';

export const DRAW_TOOLS: { value: DrawTool; label: string; shortcut: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { value: 'pen', label: 'Pen', shortcut: 'P', Icon: PenIcon },
  { value: 'pencil', label: 'Pencil', shortcut: 'N', Icon: DrawIcon },
  { value: 'marker', label: 'Marker', shortcut: 'M', Icon: MarkerIcon },
  { value: 'line', label: 'Line', shortcut: 'L', Icon: LineIcon },
  { value: 'arrow', label: 'Arrow', shortcut: 'A', Icon: ArrowIcon },
  { value: 'rectangle', label: 'Rectangle', shortcut: 'R', Icon: RectangleIcon },
  { value: 'ellipse', label: 'Ellipse', shortcut: 'O', Icon: EllipseIcon },
  { value: 'eraser', label: 'Eraser', shortcut: 'E', Icon: EraserIcon },
];

export interface DrawToolsProps {
  /** The latched tool, or null when none is. */
  tool: DrawTool | null;
  onToolChange: (tool: DrawTool | null) => void;
  ink: Ink;
  onInkChange: (ink: Ink) => void;
  width: InkWidth;
  onWidthChange: (width: InkWidth) => void;
  variant?: 'frost' | 'graphite';
  className?: string;
}

/** The drawing tools with their inks and widths, in one strip. */
export function DrawTools({ tool, onToolChange, ink, onInkChange, width, onWidthChange, variant = 'frost', className }: DrawToolsProps) {
  const noInk = tool === 'eraser';
  return (
    <Toolbar variant={variant} aria-label="Drawing" className={className}>
      {DRAW_TOOLS.map(({ value, label, shortcut, Icon }) => (
        <ToolButton
          key={value}
          label={label}
          shortcut={shortcut}
          icon={<Icon size={16} />}
          pressed={tool === value}
          onPressedChange={(p) => onToolChange(p ? value : null)}
        />
      ))}
      <ToolbarSeparator />
      <InkPicks value={ink} onValueChange={onInkChange} disabled={noInk} />
      <ToolbarSeparator />
      <WidthPicks value={width} onValueChange={onWidthChange} ink={ink} disabled={noInk} />
    </Toolbar>
  );
}
