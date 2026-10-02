import * as React from 'react';
import { useDialKit } from 'dialkit';
import { NumberField } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/number-field/number-field.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/number-field/number-field.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * DRUM TUNER: the page's DialKit panel
 *
 *   turn     the drum's spring and its travel (one grid step)
 *   refusal  the spring of the shake past a limit
 * Springs are the system's classes; slow stretches every duration.
 * ───────────────────────────────────────────────────────── */

function DrumTuner() {
  const [value, setValue] = React.useState<number | null>(3);
  const d = useDialKit('Number drum', {
    turn: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    refusal: { type: 'select', options: SPRING_NAMES, default: 'refusal' },
    travel: [4, 0, 12],
    slow: [1, 1, 10],
    up: { type: 'action', label: 'Step up' },
    down: { type: 'action', label: 'Step down' },
  }, {
    onAction: (action) => {
      const key = action === 'up' ? 'ArrowUp' : action === 'down' ? 'ArrowDown' : null;
      const input = document.querySelector<HTMLInputElement>('[data-testid=number-drum-tuner] input');
      if (key && input) { input.focus(); input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); }
    },
  });
  const vars = {
    ...springVars('settle', d.turn as SpringName, d.slow),
    ...springVars('refusal', d.refusal as SpringName, d.slow),
    '--mu-motion-step': `${d.travel}px`,
  } as React.CSSProperties;
  return (
    <div data-testid="number-drum-tuner" className="flex justify-center" style={{ ...vars, zoom: 1.6 }}>
      <NumberField label="Tuned copies" value={value} onValueChange={setValue} min={1} max={9} />
    </div>
  );
}

export default function NumberFieldPage() {
  const [copies, setCopies] = React.useState<number | null>(2);
  return (
    <ComponentPage
      title="Number field"
      lede="A number you step, scrub or type. Each step turns the value one drum step: plus rolls up, minus rolls down. Drag the label to scrub; press an arrow past the limit and only the digits shake."
      play={{ lede: 'Press the keycaps, hold them, use ↑ ↓, or drag the label sideways.', caption: 'copies 1–20 · columns 1–12 · disabled · invalid', node: (
        <div className="flex flex-wrap items-end justify-center gap-32" style={{ zoom: 1.3 }}>
          <NumberField label="Copies" value={copies} onValueChange={setCopies} min={1} max={20} />
          <NumberField label="Columns" defaultValue={12} min={1} max={12} />
          <NumberField label="Locked" defaultValue={4} disabled />
          <NumberField label="Seats" defaultValue={0} min={0} max={8} invalid />
        </div>
      ) }}
      more={[{ id: 'drum', title: 'Tune the drum', lede: 'The Number drum panel swaps the drum and refusal springs, sets the drum\'s travel, and stretches time. Step up to 9 and past it.', node: <DrumTuner /> }]}
      usage={`<NumberField label="Copies" value={copies} onValueChange={setCopies} min={1} max={20} />`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'NF4', title: 'One step glyph', body: 'Decrease and increase use the shared minus and plus glyphs. Their accessible names and repeat behavior stay with the control.', origin: 'The icon set' },
        { id: 'NF1', title: 'The drum turns the way the number went', body: 'Up for more, down for less, one grid step on the settle spring.', origin: 'Ours' },
        { id: 'NF2', title: 'Give it a range', body: 'At a limit the keycap disables; an arrow past it shakes only the digits.', origin: 'Ours' },
        { id: 'NF3', title: 'Typing is plain', body: 'No drum while typing; it formats and commits on blur.', origin: 'Ours' },
      ]}
    />
  );
}
