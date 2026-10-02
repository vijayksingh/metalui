import * as React from 'react';
import { useDialKit } from 'dialkit';
import { RadioGroup, Radio } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/radio/radio.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/radio/radio.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * LATCH TUNER: the page's DialKit panel
 *
 *   press    the well goes dark (press time, linear)
 *   release  the new pip latches in on the latch spring;
 *            the old pip drops out on the drop spring, same frame
 * Springs are the system's mass classes, never free numbers; slow
 * stretches every duration so the interlock can be read by eye.
 * ───────────────────────────────────────────────────────── */

const OPTIONS = ['png', 'svg', 'pdf'] as const;

function LatchTuner() {
  const d = useDialKit('Radio latch', {
    latch: { type: 'select', options: SPRING_NAMES, default: 'part' },
    drop: { type: 'select', options: SPRING_NAMES, default: 'release' },
    press: [50, 0, 200],
    fade: [160, 0, 400],
    pip: [6, 4, 10],
    slow: [1, 1, 10],
    flip: { type: 'action', label: 'Flip the choice' },
  }, {
    onAction: (action) => { if (action === 'flip') setValue((v) => OPTIONS[(OPTIONS.indexOf(v) + 1) % OPTIONS.length]); },
  });
  const [value, setValue] = React.useState<(typeof OPTIONS)[number]>('svg');
  const latch = d.latch as SpringName;
  const drop = d.drop as SpringName;
  const vars = {
    ...springVars('part', latch, d.slow),
    ...springVars('release', drop, d.slow),
    '--mu-r-radio-self-press': `${d.press * d.slow}ms`,
    '--mu-r-radio-self-fade': `${d.fade * d.slow}ms`,
    '--mu-r-radio-pip-size': `${d.pip}px`,
  } as React.CSSProperties;
  return (
    <div data-testid="radio-latch-tuner" style={{ ...vars, zoom: 2 }}>
      <RadioGroup aria-label="Tuned export format" orientation="horizontal" value={value} onValueChange={(v) => setValue(v as (typeof OPTIONS)[number])}>
        {OPTIONS.map((o) => <Radio key={o} value={o}>{o.toUpperCase()}</Radio>)}
      </RadioGroup>
    </div>
  );
}

export default function RadioPage() {
  const [format, setFormat] = React.useState('svg');
  return (
    <ComponentPage
      title="Radio group"
      lede="One choice from a short list. Press an option and its well goes dark at once; let go and a pip latches in on a spring while the old choice's pip drops out, like the interlocked preset buttons on an old radio."
      play={{ lede: 'Press and hold one, then let go. Or Tab in and use the arrow keys.', caption: 'vertical · horizontal · disabled option', node: (
        <div className="flex flex-wrap items-start gap-40" style={{ zoom: 1.4 }}>
          <RadioGroup aria-label="Export format" value={format} onValueChange={(v) => setFormat(v as string)}>
            <Radio value="png">PNG</Radio>
            <Radio value="svg">SVG</Radio>
            <Radio value="pdf">PDF</Radio>
          </RadioGroup>
          <RadioGroup aria-label="Grid" orientation="horizontal" defaultValue="dots">
            <Radio value="dots">Dots</Radio>
            <Radio value="lines">Lines</Radio>
            <Radio value="none" disabled>None</Radio>
          </RadioGroup>
        </div>
      ) }}
      more={[{ id: 'latch', title: 'Tune the latch', lede: 'The Radio latch panel swaps the spring classes and stretches time. Flip the choice and watch one pip land as the other lets go.', node: <LatchTuner /> }]}
      usage={`<RadioGroup aria-label="Export format" value={format} onValueChange={setFormat}>
  <Radio value="png">PNG</Radio>
  <Radio value="svg">SVG</Radio>
  <Radio value="pdf">PDF</Radio>
</RadioGroup>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'RD1', title: 'Every option is in view', body: 'If the options do not fit on screen together, it is a select.', origin: 'Ours' },
        { id: 'RD2', title: 'The press points at the result', body: 'The well goes dark on press; the pip latches only on release, so dragging off cancels without a change.', origin: 'Ours' },
        { id: 'RD3', title: 'One holds, one lets go', body: 'The new pip springs in and the old one drops out in the same frame: an interlock, never a pip sliding between wells.', origin: 'Preset buttons' },
        { id: 'RD4', title: 'A held choice stays findable', body: 'A disabled checked option stays reachable by Tab so its value and reason can be heard. Unchecked disabled options are skipped. Use aria-describedby for the reason; the held choice cannot change.', origin: 'Base UI' },
      ]}
    />
  );
}
