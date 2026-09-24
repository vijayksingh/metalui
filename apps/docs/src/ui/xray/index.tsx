import type * as React from 'react';
import { ButtonXray } from './ButtonXray';
import { CheckboxXray } from './CheckboxXray';
import { ChipXray } from './ChipXray';
import { DialogXray } from './DialogXray';
import { FieldXray } from './FieldXray';
import { IconButtonXray } from './IconButtonXray';
import { KbdXray } from './KbdXray';
import { MenuXray } from './MenuXray';
import { PaletteXray } from './PaletteXray';
import { SegmentedXray } from './SegmentedXray';
import { SliderXray } from './SliderXray';
import { StatusXray } from './StatusXray';
import { SwatchXray } from './SwatchXray';
import { ToastXray } from './ToastXray';
import { ToolbarXray } from './ToolbarXray';
import { TooltipXray } from './TooltipXray';

/* Every x-ray, by the name the floating table and the overlays use. */
export const XRAYS = {
  button: { title: 'Button', View: ButtonXray },
  segmented: { title: 'Segmented control', View: SegmentedXray },
  kbd: { title: 'Keycap', View: KbdXray },
  swatch: { title: 'Swatch', View: SwatchXray },
  checkbox: { title: 'Checkbox', View: CheckboxXray },
  slider: { title: 'Slider', View: SliderXray },
  'icon-button': { title: 'Icon button', View: IconButtonXray },
  chip: { title: 'Suggestion chip', View: ChipXray },
  field: { title: 'Field', View: FieldXray },
  status: { title: 'Status badge', View: StatusXray },
  toolbar: { title: 'Toolbar', View: ToolbarXray },
  tooltip: { title: 'Tooltip', View: TooltipXray },
  toast: { title: 'Toast', View: ToastXray },
  menu: { title: 'Menu', View: MenuXray },
  dialog: { title: 'Dialog', View: DialogXray },
  palette: { title: 'Command palette', View: PaletteXray },
} satisfies Record<string, { title: string; View: React.ComponentType<{ startOpen?: boolean }> }>;

export type XrayKind = keyof typeof XRAYS;

/** The x-ray overlay: a sheet over a blurred page; click outside or press Escape to close. */
export function XrayOverlay({ kind, onClose }: { kind: XrayKind; onClose: () => void }) {
  const { title, View } = XRAYS[kind];
  return (
    <div className="xr-overlay" role="dialog" aria-modal="true" aria-label={`${title}, x-ray`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="xr-sheet"><View startOpen /></div>
    </div>
  );
}
