import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Popover } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/popover/popover.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/popover/popover.agent.md?raw';
import { RenameDemo } from '../../ui/rename/RenameDemo';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * RISE TUNER: the page's DialKit panel
 *
 *   open    the plate rises from its trigger by the reach, on the open spring
 *   close   it fades out on the close spring, no travel back
 * Springs are the system's classes; slow stretches every duration.
 * ───────────────────────────────────────────────────────── */

const SIDES = ['bottom', 'top', 'right', 'left'] as const;

function RiseTuner() {
  const d = useDialKit('Popover rise', {
    open: { type: 'select', options: SPRING_NAMES, default: 'surface' },
    close: { type: 'select', options: SPRING_NAMES, default: 'release' },
    side: { type: 'select', options: [...SIDES], default: 'bottom' },
    reach: [6, 0, 24],
    scale: [0.97, 0.8, 1],
    slow: [1, 1, 10],
  });
  const o = d.open as SpringName;
  const c = d.close as SpringName;
  const vars = {
    ...springVars('surface', o, d.slow),
    ...springVars('release', c, d.slow),
    '--mu-motion-nest': `${d.reach}px`,
    '--mu-r-popover-self-enter-scale': String(d.scale),
  } as React.CSSProperties;
  return (
    <div data-testid="popover-rise-tuner" className="flex min-h-[260px] items-center justify-center">
      <RenameDemo label="Tuned region name" panelStyle={vars} side={d.side as (typeof SIDES)[number]} testId="rename-tuned" />
    </div>
  );
}

function ScopedPopover() {
  const [colorway, setColorway] = React.useState<'bone' | 'graphite'>('graphite');
  return <div data-testid="scoped-popover" data-mu-colorway={colorway} className="mu-stack gap-mu-related p-mu-space-4 rounded-mu-space-3 recipe-surface overflow-hidden">
    <Popover>
      <Popover.Trigger><Button>Scoped panel</Button></Popover.Trigger>
      <div data-mu-colorway="bone"><Popover.Trigger><Button>Nested bone panel</Button></Popover.Trigger></div>
      <Popover.Content>
        <Popover.Title>Host colorway</Popover.Title>
        <Popover.Description>The active trigger supplies this panel’s colorway.</Popover.Description>
        <Popover.Body>
          <Button onClick={() => setColorway(colorway === 'graphite' ? 'bone' : 'graphite')}>Change host colorway</Button>
        </Popover.Body>
      </Popover.Content>
    </Popover>
  </div>;
}

export default function PopoverPage() {
  return (
    <ComponentPage
      title="Popover"
      lede="A small panel that comes out of its trigger. It rises one nest from the trigger's side on the surface spring and fades in; closing, it fades where it is and does not travel back."
      play={{ lede: 'Open it, rename, or press Esc. Try Taken to see validation.', caption: 'selected name · pen confirm · waiting · check result · Undo', node: (
        <div className="flex min-h-[240px] items-start justify-center pt-24">
          <RenameDemo />
        </div>
      ) }}
      more={[{ id: 'rise', title: 'Tune the rise', lede: 'The Popover rise panel swaps the open and close springs, the side, the reach and the starting scale, and stretches time.', node: <RiseTuner /> }, { id: 'portal', title: 'A scoped host', lede: 'A panel keeps the active trigger’s nearest colorway and follows live changes. It stays outside clipped parents. Native popovers inherit their SwiftUI environment.', node: <ScopedPopover /> }]}
      usage={`<Popover>
  <Popover.Trigger><Button>Rename…</Button></Popover.Trigger>
  <Popover.Content>
    <Popover.Title>Rename region</Popover.Title>
    <Popover.Description>The name shows on its edge and in search.</Popover.Description>
    <Popover.Body>…</Popover.Body>
  </Popover.Content>
</Popover>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'PO1', title: 'It comes from its trigger', body: 'It grows from the trigger\'s side and rises one nest away from it, so you can see where it came from.', origin: 'Ours' },
        { id: 'PO2', title: 'Leaving is quieter than arriving', body: 'It fades on the release spring where it stands; it never flies back into the trigger.', origin: 'Ours' },
        { id: 'PO3', title: 'Small, or it is a dialog', body: 'A title, a line, a few controls. Anything that scrolls or must be answered first is a dialog.', origin: 'Ours' },
      ]}
    />
  );
}
