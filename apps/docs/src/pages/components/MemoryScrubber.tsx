import * as React from 'react';
import { MemoryScrubber } from '@unlocalhosted/metalui';
import { ClockIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/blocks/time-scrubber/time-scrubber.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/blocks/time-scrubber/time-scrubber.css?raw';
import agentGuide from '../../../../../packages/metalui/src/blocks/time-scrubber/time-scrubber.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalMemoryScrubber.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const DAY = 86400000;

export default function MemoryScrubberPage() {
  // A fixed week so the page reads the same every day: six days ago at midnight to now.
  const [end] = React.useState(() => Date.now());
  const start = React.useMemo(() => { const d = new Date(end - 6 * DAY); d.setHours(0, 0, 0, 0); return d.getTime(); }, [end]);
  const marks = React.useMemo(() => Array.from({ length: 26 }, (_, i) => start + ((i * 7919) % 97) / 97 * (end - start)), [start, end]);
  const [t, setT] = React.useState<number | null>(null);
  return (
    <>
      <PageHeader
        title="Memory scrubber"
        lede="Time is a dimension of the surface, like x and y. Drag the knurled knob back and the canvas shows what existed then; step with the arrow keys, an hour at a time, a day with Shift. NOW returns to the present. Built on Base UI Slider."
      />
      <Section title="Playground" lede="Drag, click the track, or focus the knob and use ← → and ⇧ ← →. Near the right end it snaps to now.">
        <Bench caption={t == null ? 'now' : new Date(t).toString().slice(0, 21)} className="min-h-[180px]">
          <div className={t == null ? '' : '[filter:sepia(.12)_saturate(.85)]'}>
            <MemoryScrubber start={start} end={end} value={t} onValueChange={setT} marks={marks} glyph={<ClockIcon size={10} />} />
          </div>
        </Bench>
        <SwiftCapture name="memory-scrubber" maxWidth={620} />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'M1', title: 'Scrubbing only looks', body: 'It changes nothing; ⎋ or NOW returns to the present.', origin: 'reference brief' },
          { id: 'M2', title: 'A drag follows, a jump springs', body: 'Under the pointer the knob is exact; a click or a key moves it on the part spring.', origin: 'reference brief' },
          { id: 'M3', title: 'The scrubber keeps its arrows', body: 'While the knob has focus, arrows are time, never a selection nudge.', origin: 'reference brief' },
        ]} />
      </Section>
    </>
  );
}
