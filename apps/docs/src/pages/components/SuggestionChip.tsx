import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Dimple, SuggestionChip } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/suggestion-chip/suggestion-chip.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/blocks/suggestion-chip/suggestion-chip.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Blocks/MetalSuggestionChip.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { ChipXray } from '../../ui/xray/ChipXray';

const QUESTIONS = ['Task?', 'Date friday?', 'Track as sleep?', 'Move to Done?'];

/** A block with one middle-confidence question. Accept makes it a task; dismiss stores the correction. */
function Block({ label, confidence }: { label: string; confidence: number }) {
  const [state, setState] = React.useState<'asking' | 'accepted' | 'dismissed'>('asking');
  React.useEffect(() => setState('asking'), [label, confidence]);
  return (
    <div className="flex flex-col items-center gap-24">
      <div className="mu-icon-trigger relative inline-flex items-center gap-10 rounded-plate px-14 py-10" data-testid="sugg-block">
        {state === 'accepted' && <Dimple className="absolute -left-12 top-[12.5px]" aria-label="call the printer" />}
        <span className="type-content text-ink">call the printer about paper</span>
        {state === 'asking' && (
          <SuggestionChip label={label} confidence={confidence} onAccept={() => setState('accepted')} onDismiss={() => setState('dismissed')} />
        )}
      </div>
      <span className="type-readout text-ink2" aria-live="polite">
        {state === 'asking' ? 'asking · hover the block' : state === 'accepted' ? 'accepted · wrote [ ] into the text' : 'dismissed · never asked again for this text'}
      </span>
    </div>
  );
}

export default function SuggestionChipPage() {
  const d = useDialKit('Suggestion chip', {
    question: { type: 'select', options: QUESTIONS, default: 'Task?' },
    confidence: [0.72, 0.6, 0.84, 0.01],
    replay: { type: 'action', label: 'Ask again' },
  }, { onAction: () => setNonce((n) => n + 1) });
  const [nonce, setNonce] = React.useState(0);

  return (
    <>
      <PageHeader
        title="Suggestion chip"
        lede="One question the recognizer asks at middle confidence, beside its block: the question, the confidence, and accept and dismiss. It stays faint until the block is hovered, so the person decides and the chip never shouts. At most one per block, and only for cues that change behaviour."
      />

      <Section title="Playground" lede="Hover the block to bring the chip up. Accept, and the block becomes a task; dismiss, and it is never asked again. Dials: the question, the confidence, and Ask again.">
        <Bench caption={`${d.question} · ${d.confidence.toFixed(2)} · settle in from 3 above`} className="min-h-[220px]">
          <Block key={nonce} label={d.question} confidence={d.confidence} />
        </Bench>
      </Section>

      <Section id="x-ray" title="X-ray" lede="See what the chip is made of. Click an icon to learn about one part and change it.">
        <ChipXray />
      </Section>

      <Section title="States">
        <Bench tone="page" caption="rest (.62) · block hovered (1)">
          <div className="flex flex-wrap items-center gap-40">
            <figure className="flex flex-col items-center gap-10"><SuggestionChip label="Task?" confidence={0.72} onAccept={() => {}} onDismiss={() => {}} /><figcaption className="type-label engraved">rest</figcaption></figure>
            <figure className="flex flex-col items-center gap-10"><SuggestionChip hostHovered label="Track as sleep?" confidence={0.64} onAccept={() => {}} onDismiss={() => {}} /><figcaption className="type-label engraved">hovered</figcaption></figure>
          </div>
        </Bench>
      </Section>

      <Section title="SwiftUI" lede="MetalSuggestionChip from the same tokens: rest and hovered.">
        <SwiftCapture name="suggestion-chip" />
      </Section>

      <Section title="Confidence routing" lede="The thresholds decide whether a chip appears at all (the reference brief). They are the recognizer's, not props.">
        <TokenTable
          head={['Outcome', 'Nouls p', 'Choices', 'Life glyph', 'Lens', 'The surface']}
          mono={[0, 1, 2]}
          rows={[
            ['Apply', 'p ≥ .85', '≥ .70', 'Layer 1 or ≥ .85', 'p ≥ .5', 'the cue appears quietly, provenance on hover'],
            ['Suggest', '.60 – .85', '.40 – .70', 'engraving only', '.3 – .5 at .5', 'one suggestion chip'],
            ['Nothing', 'p < .60', '< .40', '< .40', '< .3', 'no change'],
          ]}
        />
      </Section>

      <Section title="Source" lede="The chip three ways, plus the guide your coding agent reads.">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'One question, only when it changes behaviour', body: 'Task, measurement, date, region. Never a kind or a glyph; never two chips on one block.', origin: 'reference brief' },
            { id: 'G2', title: 'Faint until asked', body: 'At .62 until its block is hovered or the chip has focus.', origin: 'reference design' },
            { id: 'G3', title: 'Accepting finishes first', body: 'The block is finished, then the answer applies with Undo. A dismissal is stored for the exact text and never asked again.', origin: 'reference brief' },
            { id: 'G4', title: 'Confidence is always printed', body: 'Hidden confidence is a bug.', origin: 'reference brief' },
          ]}
        />
      </Section>
    </>
  );
}
