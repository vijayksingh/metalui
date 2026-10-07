import * as React from 'react';
import { createPortal } from 'react-dom';
import { ButtonXray } from './ButtonXray';
import { CheckboxXray } from './CheckboxXray';
import { ChipXray } from './ChipXray';
import { DialogXray } from './DialogXray';
import { FieldXray, type FieldConfig } from './FieldXray';
import { FolderXray } from './FolderXray';
import { IconButtonXray } from './IconButtonXray';
import { KbdXray, type KbdConfig } from './KbdXray';
import { LinkCardXray, type LinkCardConfig } from './LinkCardXray';
import { MenuXray } from './MenuXray';
import { PaletteXray } from './PaletteXray';
import { SwitcherXray, type SwitcherConfig } from './SwitcherXray';
import { SwitchXray } from './SwitchXray';
import { SliderXray } from './SliderXray';
import { StatusXray, type StatusConfig } from './StatusXray';
import { SwatchXray, type SwatchConfig } from './SwatchXray';
import { ToastXray } from './ToastXray';
import { ToolbarXray } from './ToolbarXray';
import { TooltipXray } from './TooltipXray';
import { WordmarkXray } from './WordmarkXray';

/** What the home table's button says; its x-ray lands on a model of the same button. */
export const BUTTON_LABEL = 'Get started';

/* ─────────────────────────────────────────────────────────
 * THE HANDOVER
 *
 *   seed   an x-ray's config: one object with everything the component is set to, from its
 *          real props (the value picked, the size) to the tunables the x-ray lets you handle
 *          (padding, depth, the spring, which layers are on). The table object hands its
 *          config to the x-ray as it opens, the x-ray starts from exactly that, and hands
 *          every change straight back, so the object on the table is what you left it when
 *          it flies home. A docs page opens an x-ray with no seed: the kind's defaults.
 *   pose   flown in, the model lands flat (every part on one plane, the object itself) and
 *          only then opens up; before it flies home it closes up again. With no flight the
 *          model is open from the start.
 * ───────────────────────────────────────────────────────── */
export interface XraySeeds { switcher: SwitcherConfig; swatch: SwatchConfig; status: StatusConfig; field: FieldConfig; link: LinkCardConfig; kbd: KbdConfig }
export type XraySeed<K extends XrayKind> = K extends keyof XraySeeds ? XraySeeds[K] : never;
export type XrayPose = 'flat' | 'open';
export interface XrayViewProps<S = never> { startOpen?: boolean; seed?: Partial<S>; onSeed?: (seed: S) => void; pose?: XrayPose; /** the object's zoom where it came from: its face is laid out at it */ zoom?: number }
/** The x-ray handing its config back, by kind. */
export type XrayReseed = <K extends XrayKind>(kind: K, seed: XraySeed<K>) => void;

/* Every x-ray, by the name the floating table and the overlays use. */
export const XRAYS = {
  wordmark: { title: 'MetalUI wordmark', View: WordmarkXray },
  // the table's button is a primary one, so its x-ray is too: it lands on a model of itself, same label
  button: { title: 'Button', View: (p: { startOpen?: boolean }) => <ButtonXray startOpen={p.startOpen} cap="primary" label={BUTTON_LABEL} /> },
  switcher: { title: 'Switcher', View: SwitcherXray },
  switch: { title: 'Switch', View: SwitchXray },
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
  folder: { title: 'Folder', View: FolderXray },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<string, { title: string; View: React.ComponentType<XrayViewProps<any>> }>;

export type XrayKind = keyof typeof XRAYS;

/** The x-ray overlay: a sheet over a blurred page; click outside or press Escape to close.
 *  `from` names the floating object it opened from; flown in (useXrayFlight), the card
 *  composes around the object as it lands on the model. */
export function XrayOverlay<K extends XrayKind>({ kind, from, seed, pose, zoom, onSeed, onClose }: { kind: K; from?: string; seed?: Partial<XraySeed<K>>; pose?: XrayPose; zoom?: number; onSeed?: XrayReseed; onClose: () => void }) {
  const { title } = XRAYS[kind];
  const View = XRAYS[kind].View as React.ComponentType<XrayViewProps<XraySeed<K>>>;
  // flown in: the flight is the entrance, so the sheet skips its rise and the model its tilt (read once, at mount)
  const [flown] = React.useState(() => from !== undefined && document.documentElement.dataset.flight === 'open');
  return createPortal(
    <div className={flown ? 'xr-overlay is-flown' : 'xr-overlay'} role="dialog" aria-modal="true" aria-label={`${title}, x-ray`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="xr-sheet"><View startOpen seed={seed} onSeed={(s) => onSeed?.(kind, s)} pose={pose} zoom={zoom} /></div>
    </div>,
    document.body,
  );
}
