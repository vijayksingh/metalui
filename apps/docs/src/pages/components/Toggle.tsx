import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Toggle, ToggleGroup, RadioKeys, Button } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/toggle/toggle.tsx?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalToggle.swift?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/toggle/toggle.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * LATCH TUNER: the page's DialKit panel
 *
 *   catch    how far past the latch the press goes
 *   latch    where an on key rests, on the latch spring
 *   release  the spring an off key rises on
 * Springs are the system's classes; slow stretches every duration.
 * ───────────────────────────────────────────────────────── */

function LatchTuner() {
  const d = useDialKit('Toggle latch', {
    latch: { type: 'select', options: SPRING_NAMES, default: 'part' },
    release: { type: 'select', options: SPRING_NAMES, default: 'release' },
    catchDepth: [2, 0, 4],
    latchDepth: [1, 0, 3],
    slow: [1, 1, 10],
  });
  const vars = {
    ...springVars('part', d.latch as SpringName, d.slow),
    ...springVars('release', d.release as SpringName, d.slow),
    '--mu-r-toggle-self-catch': `${d.catchDepth}px`,
    '--mu-r-toggle-self-latch': `${d.latchDepth}px`,
  } as React.CSSProperties;
  return (
    <div data-testid="toggle-latch-tuner" className="flex justify-center" style={{ ...vars, zoom: 1.6 }}>
      <Toggle defaultPressed>Tuned grid</Toggle>
    </div>
  );
}

function TimeChoice() {
  const [submitted, setSubmitted] = React.useState('');
  return <form className="mu-stack gap-mu-related items-center" aria-label="Choose a time" onSubmit={(event) => {
    event.preventDefault();
    setSubmitted(String(new FormData(event.currentTarget).get('time')));
  }}>
    <RadioKeys name="time" defaultValue="10:00" required aria-label="Appointment time">
      <RadioKeys.Key value="10:00">10:00</RadioKeys.Key>
      <RadioKeys.Key value="11:00" disabled>11:00 · taken</RadioKeys.Key>
      <RadioKeys.Key value="12:00">12:00</RadioKeys.Key>
    </RadioKeys>
    <Button type="submit" size="compact">Confirm time</Button>
    <output aria-live="polite">{submitted ? `Time submitted: ${submitted}` : 'One chosen key stays latched.'}</output>
    <RadioKeys value="Lisbon" readOnly aria-label="Host city">
      <RadioKeys.Key value="Lisbon">Lisbon</RadioKeys.Key>
      <RadioKeys.Key value="Berlin">Berlin</RadioKeys.Key>
    </RadioKeys>
  </form>;
}

export default function TogglePage() {
  const [grid, setGrid] = React.useState(true);
  const [marks, setMarks] = React.useState<string[]>(['bold']);
  return (
    <ComponentPage
      title="Toggle"
      lede="A latching push button. Its lamp says it latches before you touch it. Press past the catch; let go and an on key settles at the latch with its lamp lit, an off key rises all the way."
      play={{ lede: 'Latch and unlatch them. In the row, arrows move between keys.', caption: 'a key · a row, several at once · disabled', node: (
        <div className="grid justify-items-center gap-20" style={{ zoom: 1.2 }}>
          <div className="flex gap-8">
            <Toggle pressed={grid} onPressedChange={setGrid}>Grid</Toggle>
            <Toggle>Snap</Toggle>
            <Toggle disabled>Rulers</Toggle>
          </div>
          <ToggleGroup multiple value={marks} onValueChange={(v) => setMarks(v as string[])} aria-label="Text marks">
            <Toggle value="bold">Bold</Toggle>
            <Toggle value="italic">Italic</Toggle>
            <Toggle value="underline">Underline</Toggle>
          </ToggleGroup>
        </div>
      ) }}
      more={[{ id: 'one-choice', title: 'One form choice', lede: 'A time slot stays chosen when pressed again. Arrows select the next free time; Tab leaves the group. The native form receives one value. Host city is read-only.', node: <TimeChoice /> }, { id: 'latch', title: 'Tune the latch', lede: 'The Toggle latch panel sets how far past the catch a press goes, where an on key rests, and the springs it rises on.', node: <LatchTuner /> }]}
      usage={`<Toggle pressed={grid} onPressedChange={setGrid}>Grid</Toggle>

<ToggleGroup multiple value={marks} onValueChange={setMarks} aria-label="Text marks">
  <Toggle value="bold">Bold</Toggle>
  <Toggle value="italic">Italic</Toggle>
</ToggleGroup>

<RadioKeys name="time" value={time} onValueChange={setTime} aria-label="Free times">
  <RadioKeys.Key value="10:00">10:00</RadioKeys.Key>
  <RadioKeys.Key value="12:00">12:00</RadioKeys.Key>
</RadioKeys>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'swift', label: 'SwiftUI', code: swiftSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'TG1', title: 'The lamp is the promise', body: 'An unlit lamp says the key latches before you press it.', origin: 'Latching push buttons' },
        { id: 'TG2', title: 'Past the catch, then the latch', body: 'A press goes deeper than where an on key rests, so letting go is felt.', origin: 'Ours' },
        { id: 'TG3', title: 'Name the mode', body: '"Grid", not "Show grid": the lamp already says whether it is on.', origin: 'Ours' },
      ]}
    />
  );
}
