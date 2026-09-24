import * as React from 'react';
import { MemoryScrubber, PastBanner } from '@unlocalhosted/metalui';
import { ClockIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/past-banner/past-banner.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/past-banner/past-banner.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/past-banner/past-banner.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalPastBanner.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const DAY = 86400000;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmt = (t: number) => { const d = new Date(t); return `viewing ${WD[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

export default function PastBannerPage() {
  const [end] = React.useState(() => Date.now());
  const start = React.useMemo(() => { const d = new Date(end - 6 * DAY); d.setHours(0, 0, 0, 0); return d.getTime(); }, [end]);
  const [t, setT] = React.useState<number | null>(end - 2.3 * DAY);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setT(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <PageHeader title="Past banner" lede="While the canvas is scrubbed into the past, a graphite pill at the top says so, names the moment, and brings you back. It is the only chrome that changes in the past." />
      <Section title="With the scrubber" lede="Drag the scrubber back: the banner drops in one nest on the surface spring. Back to Now, NOW or ⎋ return; the banner leaves.">
        <Bench caption={t == null ? 'now · no banner' : fmt(t)} className="min-h-[240px] flex-col gap-40">
          <div className="h-34">{t != null && <PastBanner moment={fmt(t)} onBack={() => setT(null)} />}</div>
          <MemoryScrubber start={start} end={end} value={t} onValueChange={setT} glyph={<ClockIcon size={10} />} />
        </Bench>
        <SwiftCapture name="past-banner" maxWidth={560} />
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
          { id: 'P1', title: 'Only in the past', body: 'The banner exists only while a past moment is viewed; nothing else in the chrome changes.', origin: 'Kamui 03 §9' },
          { id: 'P2', title: '⎋ is Back to Now', body: 'The cap shows the key; the host listens for it.', origin: 'Kamui 04 §13' },
        ]} />
      </Section>
    </>
  );
}
