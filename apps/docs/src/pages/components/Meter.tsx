import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Meter } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/meter/meter.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalMeter.swift?raw';
import { SwiftCapture } from '../../ui/SwiftCapture';
import agentSource from '../../../../../packages/metalui/src/components/meter/meter.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * SWEEP TUNER: the page's DialKit panel
 *
 *   stagger  the time between one segment and the next
 *   fade     how long a lamp takes to light or go dark
 *   jump     the level jumps between low and high to show the sweep both ways
 * ───────────────────────────────────────────────────────── */

function SweepTuner() {
  const [high, setHigh] = React.useState(false);
  const d = useDialKit('Meter sweep', {
    stagger: [16, 0, 80],
    fade: [90, 0, 400],
    segments: [16, 6, 32],
    jump: { type: 'action', label: 'Jump the level' },
  }, {
    onAction: (action) => { if (action === 'jump') setHigh((h) => !h); },
  });
  const vars = {
    '--mu-r-meter-lamp-stagger': `${d.stagger}ms`,
    '--mu-r-meter-lamp-fade': `${d.fade}ms`,
  } as React.CSSProperties;
  return (
    <div data-testid="meter-sweep-tuner" className="w-full max-w-[420px]" style={vars}>
      <Meter label="Tuned level" value={high ? 95 : 20} segments={Math.round(d.segments)} showValue />
    </div>
  );
}

export default function MeterPage() {
  const [used, setUsed] = React.useState(42);
  return (
    <ComponentPage
      title="Meter"
      lede="A level in a range, as a row of lamps. Each lamp's colour is printed by where it sits: green, then amber, then red. When the level changes it sweeps lamp by lamp from where it was."
      play={{ lede: 'Add and free space and watch the level sweep up and down.', caption: 'storage · battery · signal', node: (
        <div className="grid w-full max-w-[420px] gap-24">
          <Meter label="Storage" value={used} showValue />
          <Meter label="Battery" value={18} bad="low" showValue />
          <Meter label="Signal" value={3} max={5} segments={5} format={{ maximumFractionDigits: 0 }} />
          <div className="flex gap-8">
            <Button onClick={() => setUsed((u) => Math.min(100, u + 25))}>Add 25 GB</Button>
            <Button onClick={() => setUsed((u) => Math.max(0, u - 25))}>Free 25 GB</Button>
          </div>
        </div>
      ) }}
      more={[{ id: 'native', title: 'SwiftUI twin', node: <SwiftCapture name="meter" /> }, { id: 'sweep', title: 'Tune the sweep', lede: 'The Meter sweep panel sets the time between segments, each lamp\'s fade and the segment count. Jump the level to see it sweep both ways.', node: <SweepTuner /> }]}
      usage={`<Meter label="Storage" value={42} showValue />
<Meter label="Battery" value={18} bad="low" showValue />`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
      ]}
      rules={[
        { id: 'ME1', title: 'Colour is printed, not computed', body: 'A lamp\'s colour comes from where it sits, like the scale on a level meter.', origin: 'Level meters' },
        { id: 'ME2', title: 'The sweep shows the way', body: 'Rising lights upward from the old edge; falling darkens downward.', origin: 'Ours' },
        { id: 'ME3', title: 'Measure, never count down', body: 'A task\'s progress is a progress bar.', origin: 'Ours' },
      ]}
    />
  );
}
