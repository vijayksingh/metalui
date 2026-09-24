import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Cue, CueInferred, CueLife, CueUrgency, CueUrl, Dimple, SlidingIndicator } from '@unlocalhosted/metalui';
import { LinkIcon } from '@unlocalhosted/metalui/icons';
import { LifeCoffeeIcon, LifeCalmIcon } from '@unlocalhosted/metalui/icons/life';
import reactSource from '../../../../../packages/metalui/src/components/mark/mark.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/mark/mark.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalCue.swift?raw';
import { Bench, Code, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const TABS = [
  { id: 'react', label: 'React', code: reactSource },
  { id: 'css', label: 'CSS', code: cssSource },
  { id: 'swift', label: 'SwiftUI', code: swiftSource },
  { id: 'agent', label: 'Agent guide', code: agentGuide },
] as const;

/** A line with every in-flow cue, or the same words plain: the two must measure the same. */
function Line({ cues }: { cues: boolean }) {
  const C = ({ kind, resolved, color, children }: React.ComponentProps<typeof Cue>) =>
    cues ? <Cue kind={kind} resolved={resolved} color={color}>{children}</Cue> : <span>{children}</span>;
  return (
    <span data-testid={cues ? 'line-cued' : 'line-plain'} className="type-content whitespace-nowrap text-ink">
      Send <C kind="tag">#poster</C> <C kind="date" resolved="TUE 30 SEP · 16:00">tomorrow 4pm</C>, <C kind="duration" resolved="1 H 30 · 90 MIN">1h30</C> for <C kind="amount" resolved="$40.00">$40</C>, slept <C kind="measurement" resolved="SLEEP · 6 H">6h</C>, in <C kind="hex" color="#FF6B3D">#FF6B3D</C> via <C kind="derived-tag">#studio</C>
    </span>
  );
}

export default function CueFamilyPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]['id']>('react');
  const [done, setDone] = React.useState(false);
  const [ghostDone, setGhostDone] = React.useState(false);
  const d = useDialKit('Cue family', {
    cues: true,
    doing: false,
    urgent: true,
    writing: false,
  });
  const code = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <PageHeader
        title="Cue family"
        lede="Recognition made visible. A cue is a rendering attribute on the text, never a change to it: dates, durations, amounts, measurements, tags and colours are marked in place with the same advance as the plain words, so a cue appearing mid-word never moves a letter. Around the text: the dimple for a task, the ghost dimple for a task the model inferred, the urgency LED, the URL host pill, the inferred pill and the one trailing life glyph."
      />

      <Section title="On a block" lede="Hover a cue to see the value it resolved to. Tick the dimple. Turn writing on in the dial panel: the display-only cues (the URL pill, the inferred pill, the life glyph, the margin objects) step aside and the raw text shows, while the in-flow cues stay exactly where they were.">
        <Bench caption={`${d.writing ? 'writing' : 'at rest'} · cues ${d.cues ? 'on' : 'off'}`} className="min-h-[280px]">
          <div className="mu-icon-trigger flex flex-col gap-8 pl-40" data-testid="cue-block">
            <div className="relative">
              {!d.writing && d.urgent && !done && <CueUrgency className="absolute -left-35 top-8" />}
              {!d.writing && (
                <Dimple
                  className="absolute -left-25 top-[2.5px]"
                  checked={done}
                  doing={d.doing}
                  onCheckedChange={(v) => setDone(v)}
                  aria-label="Send the poster"
                />
              )}
              <span className="type-content text-ink">
                {d.writing && <span className="type-readout inline-block w-25 -ml-25 text-ink3">[{done ? 'x' : ' '}] </span>}
                <span className={done ? 'text-ink3 line-through decoration-[rgba(0,0,0,.25)]' : ''}>Send the poster to Sam</span>
                {!d.writing && <CueInferred resolved="FRI 3 OCT · RECOGNIZER 0.82">fri</CueInferred>}
              </span>
            </div>
            <Line cues={d.cues} />
            <span className="type-content text-ink">
              moodboard {d.writing ? <span className="text-[var(--mu-cue-url-ink)]">https://figma.com/file/poster</span> : <CueUrl host="figma.com" href="https://figma.com" glyph={<LinkIcon size={11} />} />}
              {!d.writing && <CueLife><LifeCoffeeIcon size={16} /></CueLife>}
            </span>
            <div className="relative">
              {!d.writing && <Dimple ghost className="absolute -left-27 top-[3.5px]" checked={ghostDone} onCheckedChange={(v) => setGhostDone(v)} aria-label="Call the printer (inferred task)" />}
              <span className="type-content text-ink">call the printer about paper</span>
              {!d.writing && <CueLife><LifeCalmIcon size={16} /></CueLife>}
            </div>
          </div>
        </Bench>
        <Bench tone="page" caption="Metric neutrality · the same words with every cue and without · width delta measured live">
          <MetricProof />
        </Bench>
      </Section>

      <Section title="The dimple" lede="A task's checkbox on Base UI Checkbox: rest, hover, checked (the tick draws on in 220 ms after 40 ms, an ease-out, not a spring), doing (announced as mixed), ghost, and disabled.">
        <Bench tone="page" caption="rest · checked · doing · ghost · disabled">
          <div className="flex items-center gap-40">
            <figure className="flex flex-col items-center gap-10"><Dimple aria-label="rest" /><figcaption className="type-label engraved">rest</figcaption></figure>
            <figure className="flex flex-col items-center gap-10"><Dimple defaultChecked aria-label="checked" /><figcaption className="type-label engraved">checked</figcaption></figure>
            <figure className="flex flex-col items-center gap-10"><Dimple doing aria-label="doing" /><figcaption className="type-label engraved">doing</figcaption></figure>
            <figure className="flex flex-col items-center gap-10"><Dimple ghost aria-label="ghost" /><figcaption className="type-label engraved">ghost</figcaption></figure>
            <figure className="flex flex-col items-center gap-10"><Dimple disabled aria-label="disabled" /><figcaption className="type-label engraved">disabled</figcaption></figure>
            <figure className="flex flex-col items-center gap-10"><CueUrgency /><figcaption className="type-label engraved">urgency</figcaption></figure>
          </div>
        </Bench>
      </Section>

      <Section title="SwiftUI" lede="MetalDimple, Text.metalCue, MetalCueTag, MetalCueURLPill, MetalCueInferred, MetalCueUrgency and MetalCueLife from the same tokens. In a TextKit editor the host draws the in-flow cues itself from MetalCue.">
        <SwiftCapture name="cue" />
      </Section>

      <Section title="Source" lede="The family three ways, plus the guide your coding agent reads.">
        <div className="flex flex-col gap-12">
          <div role="tablist" aria-label="Source" data-md="skip" className="material-well relative inline-flex w-fit rounded-pill p-2">
            <SlidingIndicator className="material-thumb rounded-pill" />
            {TABS.map((t) => (
              <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={['type-ui relative z-10 h-28 cursor-pointer rounded-pill px-13 transition-colors duration-150', tab === t.id ? 'text-ink' : 'text-ink2 hover:text-ink'].join(' ')}>
                {t.label}
              </button>
            ))}
          </div>
          <Code label={code.label} code={code.code} />
        </div>
      </Section>

      <Section title="API">
        <TokenTable
          head={['Component', 'Props', 'Notes']}
          rows={[
            ['Cue', "kind, resolved?, color?, swatch?", 'date · duration · amount · measurement · tag · derived-tag · hex. Metric-neutral.'],
            ['CueUrl', 'host, glyph, href', 'At rest only; while writing show the raw URL.'],
            ['CueInferred', 'resolved?', 'A value read by the model that is not in the text.'],
            ['Dimple', 'checked, onCheckedChange, doing?, ghost?, disabled?', 'Base UI Checkbox. The host writes [x] into the text on tick.'],
            ['CueUrgency', '–', 'An open task due soon.'],
            ['CueLife', 'children (a Life*Icon at 16)', 'One per block, trailing; never while writing.'],
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'Q1', title: 'A cue never moves a letter', body: 'Every in-flow cue has the same advance as the plain words (width delta 0.00 pt). A tag’s padding is paid back by an equal negative margin; underlines sit below the baseline.', origin: 'the brief, DS-31' },
            { id: 'Q2', title: 'Applying a cue never rewrites text', body: 'Text changes only when the person acts: ticking a dimple writes [x], accepting a chip, dropping into a region. Each is undoable.', origin: 'the brief' },
            { id: 'Q3', title: 'Quiet', body: 'No toast, badge or sound for recognition. Tags are ink2, derived tags ink3; no hue for kinds.', origin: 'the brief' },
            { id: 'Q4', title: 'Hidden confidence is a bug', body: 'An inferred value says where it came from in its chip: RECOGNIZER 0.82, RULE, YOU.', origin: 'the brief' },
          ]}
        />
      </Section>
    </>
  );
}

function MetricProof() {
  const [delta, setDelta] = React.useState<number | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const a = el.querySelector('[data-testid="line-cued"]') as HTMLElement, b = el.querySelector('[data-testid="line-plain"]') as HTMLElement;
      setDelta(Math.abs(a.getBoundingClientRect().width - b.getBoundingClientRect().width));
    };
    measure();
    document.fonts.ready.then(measure);
  }, []);
  return (
    <div ref={ref} className="flex flex-col items-start gap-8" data-testid="metric-proof">
      <Line cues />
      <Line cues={false} />
      <span className="type-readout text-ink2">width delta {delta == null ? '…' : delta.toFixed(2)} pt</span>
    </div>
  );
}
