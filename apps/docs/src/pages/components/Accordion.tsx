import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Accordion } from '@unlocalhosted/metalui';
import { type SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import { SPRING_NAMES, springVars } from '../../ui/springTuning';
import reactSource from '../../../../../packages/metalui/src/components/accordion/accordion.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/accordion/accordion.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * OPENING TUNER: the page's DialKit panel
 *
 *   grow     the spring the panel grows on
 *   close    the spring it leaves on
 * Springs are the system's classes; slow stretches every duration.
 * ───────────────────────────────────────────────────────── */

const SECTIONS = [
  { value: 'export', title: 'Export options', body: 'PNG at 2×, with the canvas background. SVG keeps text as text. PDF bundles every region as a page.' },
  { value: 'sharing', title: 'Sharing', body: 'Anyone with the link can view. Comments stay with the people you invite.' },
  { value: 'history', title: 'History', body: 'Every change is kept for 30 days in the past, where you can bring it back.' },
];

function Sections({ multiple }: { multiple?: boolean }) {
  return (
    <Accordion multiple={multiple} defaultValue={['export']}>
      {SECTIONS.map((s) => (
        <Accordion.Item key={s.value} value={s.value}>
          <Accordion.Trigger>{s.title}</Accordion.Trigger>
          <Accordion.Panel>{s.body}</Accordion.Panel>
        </Accordion.Item>
      ))}
      <Accordion.Item value="locked" disabled>
        <Accordion.Trigger>Billing (owners only)</Accordion.Trigger>
        <Accordion.Panel>Hidden.</Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

function OpeningTuner() {
  const d = useDialKit('Accordion opening', {
    grow: { type: 'select', options: SPRING_NAMES, default: 'settle' },
    close: { type: 'select', options: SPRING_NAMES, default: 'release' },
    slow: [1, 1, 10],
  });
  const vars = {
    ...springVars('settle', d.grow as SpringName, d.slow),
    ...springVars('release', d.close as SpringName, d.slow),
  } as React.CSSProperties;
  return (
    <div data-testid="accordion-opening-tuner" className="w-full max-w-[440px]" style={vars}>
      <Sections multiple />
    </div>
  );
}

export default function AccordionPage() {
  return (
    <ComponentPage
      title="Accordion"
      lede="Sections that open in place. The panel grows to its content on the settle spring while the shared chevron becomes a downward direction on settle; closing, the panel leaves on release."
      play={{ lede: 'Open and close sections, or Tab between headers and press Space.', caption: 'one at a time · a disabled section', node: (
        <div className="w-full max-w-[440px]"><Sections /></div>
      ) }}
      more={[{ id: 'opening', title: 'Tune the opening', lede: 'The Accordion opening panel swaps the grow and close springs and stretches the panel\'s time. The shared chevron uses the icon set\'s settle morph. Several sections can be open here.', node: <OpeningTuner /> }]}
      usage={`<Accordion defaultValue={['export']}>
  <Accordion.Item value="export">
    <Accordion.Trigger>Export options</Accordion.Trigger>
    <Accordion.Panel>PNG at 2×, with the canvas background.</Accordion.Panel>
  </Accordion.Item>
</Accordion>`}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'AC1', title: 'Grow, never bounce', body: 'The panel grows to its content without overshoot; the shared chevron morphs from right to down on settle.', origin: 'Ours' },
        { id: 'AC2', title: 'Leaving is quicker', body: 'Closing rides the release spring, faster than opening.', origin: 'Ours' },
        { id: 'AC3', title: 'Say what is inside', body: '"Export options", not "More".', origin: 'Ours' },
      ]}
    />
  );
}
