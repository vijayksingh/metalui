import * as React from 'react';
import { createPortal } from 'react-dom';
import { ButtonXray } from './ButtonXray';
import { CheckboxXray } from './CheckboxXray';
import { ChipXray } from './ChipXray';
import { DialogXray } from './DialogXray';
import { FieldXray } from './FieldXray';
import { IconButtonXray } from './IconButtonXray';
import { KbdXray } from './KbdXray';
import { LinkCardXray } from './LinkCardXray';
import { MenuXray } from './MenuXray';
import { PaletteXray } from './PaletteXray';
import { SwitcherXray } from './SwitcherXray';
import { SliderXray } from './SliderXray';
import { StatusXray } from './StatusXray';
import { SwatchXray } from './SwatchXray';
import { ToastXray } from './ToastXray';
import { ToolbarXray } from './ToolbarXray';
import { TooltipXray } from './TooltipXray';

/* Every x-ray, by the name the floating table and the overlays use. */
export const XRAYS = {
  // the table's New Canvas is a primary button, so its x-ray is too: it lands on a model of itself
  button: { title: 'Button', View: (p: { startOpen?: boolean }) => <ButtonXray {...p} cap="primary" /> },
  switcher: { title: 'Switcher', View: SwitcherXray },
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
  link: { title: 'Link card', View: LinkCardXray },
} satisfies Record<string, { title: string; View: React.ComponentType<{ startOpen?: boolean }> }>;

export type XrayKind = keyof typeof XRAYS;

/** The x-ray overlay: a sheet over a blurred page; click outside or press Escape to close.
 *  `from` names the floating object it opened from; flown in (useXrayFlight), the card
 *  composes around the object as it lands on the model. */
export function XrayOverlay({ kind, from, onClose }: { kind: XrayKind; from?: string; onClose: () => void }) {
  const { title, View } = XRAYS[kind];
  // flown in: the flight is the entrance, so the sheet skips its rise and the model its tilt (read once, at mount)
  const [flown] = React.useState(() => from !== undefined && document.documentElement.dataset.flight === 'open');
  return createPortal(
    <div className={flown ? 'xr-overlay is-flown' : 'xr-overlay'} role="dialog" aria-modal="true" aria-label={`${title}, x-ray`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="xr-sheet"><View startOpen /></div>
    </div>,
    document.body,
  );
}
