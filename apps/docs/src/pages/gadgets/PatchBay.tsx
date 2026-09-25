import * as React from 'react';
import { Button, Segmented, Switch } from '@unlocalhosted/metalui';
import { Gadget, renderGadgetSvg, validateGadget, type GadgetSpec, type Problem } from '@unlocalhosted/metalui/gadgets';
import { createSound } from '@unlocalhosted/metalui/sound';
import patchBay from '../../../../../packages/metalui/src/gadgets/fixtures/patch-bay.gadget.json';
import drawSource from '../../../../../packages/metalui/src/gadgets/draw.ts?raw';
import gadgetSource from '../../../../../packages/metalui/src/gadgets/Gadget.tsx?raw';
import agentGuide from '../../../../../packages/metalui/src/gadgets/patch-bay/patch-bay.agent.md?raw';
import { Bench, Code, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';

const SPEC = patchBay as unknown as GadgetSpec;
const STATES = Object.keys(SPEC.states);
type Json = Record<string, unknown>;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

// Remixes of the patch bay: each is only a change to the spec, and the renderer draws the new gadget.
const REMIXES: Record<string, { label: string; edit: (s: Json) => void }> = {
  original: { label: 'The patch bay', edit: () => {} },
  clay: { label: 'Cast it in clay', edit: (s) => { s.material = 'clay'; } },
  calm: { label: 'Make it calm', edit: (s) => { s.feel = { v: 0.6, a: 0.2, w: 0.6 }; } },
  swap: { label: 'Touch the other plug', edit: (s) => { for (const p of s.parts as Json[]) { if (p.id === 'plugA') delete p.material; if (p.id === 'plugB') p.material = 'accent'; } } },
  slack: { label: 'A slacker cord', edit: (s) => { for (const p of s.parts as Json[]) if (p.id === 'cable') (p.params as Json).sag = 80; } },
  lamp: { label: 'Move the lamp', edit: (s) => { for (const p of s.parts as Json[]) { if (p.id === 'lamp') p.at = [87, 78]; if (p.id === 'beeper') { p.at = [300, 310]; (p.params as Json).slots = 3; } } } },
};

function Compose({ sound }: { sound: ReturnType<typeof createSound> }) {
  const [pick, setPick] = React.useState('original');
  const [text, setText] = React.useState(() => JSON.stringify(SPEC, null, 2));
  const [state, setState] = React.useState('connected');
  const result = React.useMemo(() => {
    try { return { parsed: true as const, v: validateGadget(JSON.parse(text)) }; } catch (e) { return { parsed: false as const, error: (e as Error).message }; }
  }, [text]);
  const problems: Problem[] = result.parsed && !result.v.ok ? result.v.problems : [];
  const spec = result.parsed && result.v.ok ? result.v.spec : null;
  const remix = (k: string) => { const s = clone(SPEC) as unknown as Json; REMIXES[k].edit(s); setPick(k); setText(JSON.stringify(s, null, 2)); };
  return (
    <div className="grid w-full gap-16 lg:grid-cols-2" data-testid="compose">
      <div className="flex min-w-0 flex-col gap-10">
        <div className="flex flex-wrap gap-8">
          {Object.entries(REMIXES).map(([k, r]) => <Button key={k} onClick={() => remix(k)} aria-pressed={pick === k} data-remix={k}>{r.label}</Button>)}
        </div>
        <textarea aria-label="Gadget spec" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)}
          className="type-code h-[420px] w-full resize-y rounded-plate border-0 p-12 text-ink outline-none recipe-well-field focus-visible:focus-ring" />
      </div>
      <div className="flex min-w-0 flex-col items-center gap-12" aria-live="polite">
        {spec ? (
          <>
            <Gadget spec={spec} state={state} sound={sound} size={260} data-testid="compose-gadget" />
            <Segmented aria-label="Composed gadget state" value={state} onValueChange={setState} options={Object.keys(spec.states).map((s) => ({ value: s, label: s }))} />
          </>
        ) : !result.parsed ? (
          <p className="type-ui text-red" data-result="parse">This is not JSON yet: {result.error}</p>
        ) : (
          <div className="flex w-full flex-col gap-8" data-result="problems">
            <p className="type-ui text-ink">{problems.length} {problems.length === 1 ? 'problem' : 'problems'}; the gadget draws again when they are fixed:</p>
            <ul className="m-0 flex list-none flex-col gap-8 p-0">
              {problems.map((p, i) => (
                <li key={i} data-code={p.code} className="rounded-row recipe-well-field p-10">
                  <div className="flex flex-wrap items-baseline gap-8"><span className="type-readout text-ink">{p.code}</span><span className="type-readout text-ink3">{p.path}</span></div>
                  <div className="type-ui text-ink2">{p.message}</div>
                  {p.fix && <div className="type-ui text-ink3">→ {p.fix}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatchBayPage() {
  const sound = React.useMemo(() => createSound(), []);
  const [soundOn, setSoundOn] = React.useState(false);
  const [state, setState] = React.useState('connected');
  const [act, setAct] = React.useState(0);
  const staticSvg = React.useMemo(() => renderGadgetSvg(SPEC, { state: 'failed', size: 96 }), []);
  return (
    <>
      <PageHeader
        title="Patch bay"
        lede="A gadget for sync: two jacks in a stone slab, a rubber cord between their plugs, a lamp and a beeper. Nothing here is drawn by hand. The page hands a spec to the gadget renderer, which lays out the Parts, colours them from the job and feel, and runs the seat mechanism on them."
      />
      <Section title="States" lede="Pick a state. Parts spring to its poses, the lamp relights, and the beeper gives its news. Done plays the seat act: the plug lifts, hangs and clicks home, and its cord swings after it. Failed pulls the plug out and lays it aside.">
        <Bench caption={`patch-bay · link, world · feel .7 .8 .4 → stone · ${state}`}>
          <div className="flex w-full flex-wrap items-center gap-24">
            <Gadget spec={SPEC} state={state} act={act} sound={sound} size={280} data-testid="bay" />
            <div className="flex flex-col gap-12">
              <Segmented aria-label="State" value={state} onValueChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
              <div className="flex flex-wrap items-center gap-12">
                <Button onClick={() => setAct((n) => n + 1)} data-testid="bay-act">Act</Button>
                <label className="flex items-center gap-12 type-ui text-ink">
                  <Switch aria-label="Sound" checked={soundOn} onCheckedChange={async (n) => { if (n) await sound.enable(); else sound.disable(); setSoundOn(n); }} />Sound
                </label>
              </div>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Every state" lede="The same spec in each of its five states, drawn still.">
        <Bench caption="rest · connected · syncing · done · failed">
          <div className="flex flex-wrap items-end gap-20" data-testid="bay-states">
            {STATES.map((s) => (
              <figure key={s} className="m-0 flex flex-col items-center gap-6">
                <Gadget spec={SPEC} state={s} size={128} />
                <figcaption className="type-label engraved">{s}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
      </Section>
      <Section title="Detail by size" lede="Big, it has lit materials, grain and shaded cuts. Small, the filters drop away until, below 48 px, it draws with none.">
        <Bench caption="160 · 96 · 64 · 32 px">
          <div className="flex flex-wrap items-end gap-20" data-testid="bay-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Gadget spec={SPEC} state="connected" size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Compose it" lede="The patch bay is only this spec. Remix it, or edit it by hand: the renderer draws whatever valid gadget you write, and says what's wrong with one that isn't. An assistant or an engine composes gadgets the same way.">
        <Bench caption="validateGadget → drawGadget → the seat player">
          <Compose sound={sound} />
        </Bench>
      </Section>
      <Section title="Without a browser" lede="renderGadgetSvg draws the same gadget as one string, for a server, an email or an app icon. This is the failed state at 96 px.">
        <Bench caption="renderGadgetSvg(spec, { state: 'failed', size: 96 })">
          <div data-testid="bay-static" dangerouslySetInnerHTML={{ __html: staticSvg }} />
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'G1', title: 'Never a control', body: 'A gadget has no focus and no pointer of its own. To operate one, wrap it in a Button and drive its state and act.' },
            { id: 'G2', title: 'Only a change of state is news', body: 'The beeper speaks on entering done or failed, never at rest and never on a plain act.' },
            { id: 'G3', title: 'Composed, never drawn', body: 'A new gadget is a new spec. Change the spec, not the drawing; the Parts, the colours and the physics come with it.' },
          ]}
        />
      </Section>
      <Section title="The spec">
        <Code code={JSON.stringify(SPEC, null, 2)} label="patch-bay.gadget.json" lang="json" />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'gadget', label: 'Gadget', code: gadgetSource },
          { id: 'draw', label: 'Renderer', code: drawSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
