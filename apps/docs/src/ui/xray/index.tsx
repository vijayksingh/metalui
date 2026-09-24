import type * as React from 'react';
import { ButtonXray } from './ButtonXray';
import { CheckboxXray } from './CheckboxXray';
import { KbdXray } from './KbdXray';
import { SegmentedXray } from './SegmentedXray';
import { SwatchXray } from './SwatchXray';

/* Every x-ray, by the name the floating table and the overlays use. */
export const XRAYS = {
  button: { title: 'Button', View: ButtonXray },
  segmented: { title: 'Segmented control', View: SegmentedXray },
  kbd: { title: 'Keycap', View: KbdXray },
  swatch: { title: 'Swatch', View: SwatchXray },
  checkbox: { title: 'Checkbox', View: CheckboxXray },
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
