import * as React from 'react';
import { DialRoot, useDialKitController } from 'dialkit';
import { Button, Kbd, Slider, SwapText, type ButtonCap, type ButtonState } from '@unlocalhosted/metalui';
import { DuplicateIcon, Icon, MorphIcon, PenIcon, PlusIcon, ShareIcon, TrashIcon, type IconName } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/button/button.tsx?raw';
import agentGuide from '../../../../../packages/metalui/src/components/button/button.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalButton.swift?raw';
import { C, CodeScreen, PageHeader, Rules, Section, SourceTabs, Stage, Tag, TokenTable } from '../../ui/doc';
import { Beat, Compare, LayerTrail, SlowSwitch, SpecLine } from '../../ui/beat';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { ButtonXray, BUTTON_XRAY_INITIAL, type ButtonXrayModel } from '../../ui/xray/ButtonXray';
import { ButtonSmartControls } from './ButtonSmartControls';
import { useColorway } from '../../app/colorway';
import { SaveGlyph } from '../../ui/async/SaveGlyph';
import { useCopyFeedback } from '../../lib/useCopyFeedback';
import { tokens } from '../../lib/tokens';
import './button-workbench.css';

/* ─────────────────────────────────────────────────────────
 * BUTTON: the component template (DOCS_ARCHITECTURE §3.1, §7)
 *
 *   head        title · one line · layer trail · spec line
 *   hero        the live button (DialKit) · the usage snippet on the code screen
 *   details     1 the cap is an object     flat and recipe, side by side, magnified
 *               2 anatomy                  the layers as an equation: fill + … = cap
 *               3 the press is physics     both curves drawn at rest; press to trace
 *               4 a changing label turns   width over time drawn at rest: a spring, a step
 *               5 an action names itself   glyph + verb on actions, words alone on choices
 *               6 one signal cap           three footers, count the dark caps
 *               7 one line, always         starts narrow: the wrapped one is already broken
 *   states · variants · colorways · keyboard · api · tokens · platforms · rules · related
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.button;
type Spring = { stiffness: number; damping: number; half: string; near: string };
const RELEASE = tokens.springs.release as Spring;
const SETTLE = tokens.springs.settle as Spring;
const CAPS: ButtonCap[] = ['standard', 'primary', 'destructive'];
const PRESSED: Partial<Record<ButtonCap, string>> = {
  standard: 'recipe-button-pressed',
  primary: 'recipe-button-primary-pressed',
  destructive: 'recipe-button-destructive-pressed',
};

const USAGE = [
  { id: 'react', label: 'React', file: 'app.tsx', lang: 'tsx' as const, code: `import { Button } from '@unlocalhosted/metalui';\n\n<Button cap="primary">New Canvas</Button>` },
  { id: 'swift', label: 'SwiftUI', file: 'ContentView.swift', lang: 'swift' as const, code: `import MetalUI\n\nMetalButton("New Canvas", cap: .primary) { create() }` },
];

export default function ButtonPage() {
  return (
    <>
      <PageHeader title="Button" lede="A pill-shaped button. When you hold it, it moves down one point and its shadow gets smaller. When you let go, it springs back.">
        <LayerTrail
          down={[{ label: 'the cap recipe', to: '/foundations/materials' }, { label: 'the release spring', to: '/foundations/motion' }]}
          here="Button"
          up={[{ label: 'Tool strip', to: '/components/tool-strip' }, { label: 'Past banner', to: '/components/past-banner' }, { label: 'Suggestion chip', to: '/components/suggestion-chip' }, { label: 'Toast', to: '/components/toast' }]}
        />
        <SpecLine
          items={[
            { label: 'React', value: 'import { Button }', href: '#hero', mono: true },
            { label: 'Swift', value: 'MetalButton', href: '#platforms', mono: true },
            { label: 'Props', value: '7', href: '#api' },
            { label: 'States', value: '5', href: '#states' },
            { label: 'Tokens', value: '12', href: '#tokens' },
          ]}
        />
      </PageHeader>
      <Hero />
      <Section id="details" title="Details">
        <div className="flex flex-col gap-56">
          <CapIsAnObject />
          <Anatomy />
          <PressIsPhysics />
          <LabelTurns />
          <ActionNamesItself />
          <OneSignalCap />
          <OneLine />
        </div>
      </Section>
      <Waiting />
      <States />
      <Variants />
      <Colorways />
      <Keyboard />
      <Api />
      <Tokens />
      <Section id="platforms" title="Platforms" lede="The same Button in React and SwiftUI, plus the guide a coding agent reads.">
        <SourceTabs
          tabs={[
            { id: 'react', label: 'React', code: reactSource },
            { id: 'swift', label: 'SwiftUI', code: swiftSource },
            { id: 'agent', label: 'Agent guide', code: agentGuide },
          ]}
        />
      </Section>
      <Section id="rules" title="Rules">
        <Rules
          rules={[
            { id: 'B1', title: 'One signal cap per group', body: 'Everything else is standard. Destructive is only for removing or discarding data. Shown in “One signal cap”.' },
            { id: 'B2', title: 'An action names itself with a glyph and a verb', body: 'Share, Export, Duplicate, Delete pass their glyph as icon; the cap sizes it (16, compact 14) and plays its act from the whole button. Plain choices (Cancel, Done) stay words only. Shown in “An action names itself”.' },
            { id: 'B3', title: 'The press is feedback, not a result', body: 'Show the real outcome: a toast, a state change or an error. Never let the animation stand in for success.' },
            { id: 'B4', title: 'A state change morphs, never swaps', body: 'Copy → Copied, Pin → Unpin: the glyph morphs with MorphIcon and the label turns with SwapText, together. The width springs to the new label. Shown in “A changing label turns”.' },
            { id: 'B5', title: 'The label is a short verb', body: 'One line, always. If it does not fit, the label is too long; the button never wraps. Shown in “One line, always”.' },
          ]}
        />
      </Section>
      <Section id="related" title="Related">
        <ul className="type-doc-prose flex max-w-measure flex-col gap-6 text-ink2">
          <li><a className="text-ink underline decoration-rule" href="/components/switcher">Switcher</a>: for a latched choice rather than an action.</li>
          <li><a className="text-ink underline decoration-rule" href="/foundations/motion">Motion</a>: the release spring and the other six classes.</li>
          <li><a className="text-ink underline decoration-rule" href="/foundations/materials">Materials</a>: where the cap recipe comes from.</li>
        </ul>
      </Section>
    </>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  const { colorway } = useColorway();
  const dial = useDialKitController('Button workbench', {
    content: {
      label: 'New Canvas',
      cap: { type: 'select', options: CAPS, default: 'primary' },
      icon: { type: 'select', options: ['none', 'share', 'duplicate', 'send-away', 'check'], default: 'none' },
      disabled: false,
    },
    shape: {
      height: [BUTTON_XRAY_INITIAL.h, 20, 48, 2],
      automaticPadding: BUTTON_XRAY_INITIAL.padAuto,
      padding: [BUTTON_XRAY_INITIAL.pad, 2, 32, 1],
      corners: [BUTTON_XRAY_INITIAL.corners, 0, 1, 0.05],
    },
    light: { direction: [0, -90, 90, 5], strength: [1, 0, 1.5, 0.05] },
    type: {
      size: [12.5, 10, 16, 0.5],
      weight: { type: 'select', options: ['400', '500', '600'], default: '500' },
      tracking: [-0.005, -0.03, 0.06, 0.005],
      opticalCenter: true,
    },
    shadow: { lift: [1, 0, 3, 0.1] },
    press: { travel: [1, 0, 3, 0.5] },
    layers: { fill: true, innerGlow: true, topLight: true, rim: true, contact: true, drop: true },
  });
  const d = dial.values;
  const model: ButtonXrayModel = {
    h: d.shape.height, padAuto: d.shape.automaticPadding, pad: d.shape.padding, corners: d.shape.corners,
    lightDeg: d.light.direction, lightK: d.light.strength,
    size: d.type.size, weight: Number(d.type.weight), track: d.type.tracking, optical: d.type.opticalCenter,
    lift: d.shadow.lift,
    on: [d.layers.fill, d.layers.innerGlow, d.layers.topLight, d.layers.rim, d.layers.contact, d.layers.drop],
  };
  const setModel = (patch: Partial<ButtonXrayModel>) => {
    const paths: Record<string, string> = {
      h: 'shape.height', padAuto: 'shape.automaticPadding', pad: 'shape.padding', corners: 'shape.corners',
      lightDeg: 'light.direction', lightK: 'light.strength', size: 'type.size', weight: 'type.weight',
      track: 'type.tracking', optical: 'type.opticalCenter', lift: 'shadow.lift',
    };
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'on') {
        ['fill', 'innerGlow', 'topLight', 'rim', 'contact', 'drop'].forEach((name, index) => dial.setValue(`layers.${name}`, (value as boolean[])[index]));
      } else {
        dial.setValue(paths[key], key === 'weight' ? String(value) : value as string | number | boolean);
      }
    }
  };
  const setContent = (key: 'label' | 'cap' | 'icon' | 'disabled', value: string | boolean) => dial.setValue(`content.${key}`, value);
  return (
    <section id="hero" className="flex scroll-mt-80 flex-col gap-24">
      <div id="x-ray" className="button-workbench" data-md="skip">
        <ButtonXray
          label={d.content.label} cap={d.content.cap as ButtonCap} icon={d.content.icon as IconName | 'none'}
          disabled={d.content.disabled} travel={d.press.travel} model={model} setModel={setModel} onReset={dial.resetValues}
        />
        <div className="button-workbench-controls">
          <div className="button-workbench-controls-head">
            <div><span className="eng">Customize</span><p>Drag the object and its parts. Changes follow into X-ray.</p></div>
            <button type="button" className="status" onClick={dial.resetValues}>Reset</button>
          </div>
          <ButtonSmartControls
            model={model} setModel={setModel}
            content={{ label: d.content.label, cap: d.content.cap as ButtonCap, icon: d.content.icon as IconName | 'none', disabled: d.content.disabled }}
            setContent={setContent} travel={d.press.travel} setTravel={(value) => dial.setValue('press.travel', value)}
          />
          <details className="bw-advanced"><summary>Precise values and presets</summary><DialRoot mode="inline" theme={colorway === 'graphite' ? 'dark' : 'light'} productionEnabled /></details>
        </div>
      </div>
      <CodeScreen tabs={USAGE} />
    </section>
  );
}

/* ───────────────────────── 1 · the cap is an object ───────────────────────── */

function CapIsAnObject() {
  return (
    <Beat
      id="cap-is-an-object"
      title="The cap is an object"
      setup="Drawn as a flat fill, a button reads as a sticker on the page, not a thing you could press."
      caption="Look at the edges. Ours has a bright line on top and a soft shadow underneath. The flat one has neither."
      cost="five shadow layers per colorway instead of none, kept identical on web and Swift by one recipe."
      code={{ label: 'tokens.json › recipes.button', lang: 'json', code: JSON.stringify(RECIPE.layers.filter((l: { colorway?: string; state?: string }) => l.colorway === 'bone' && !l.state), null, 2) }}
    >
      <Compare
        zoom={1.6}
        items={[
          { label: 'flat fill', node: <Button tabIndex={-1} className="bg-s! shadow-none!">Cancel</Button> },
          { label: 'cap recipe', lit: true, node: <Button tabIndex={-1}>Cancel</Button> },
        ]}
      />
    </Beat>
  );
}

/* ───────────────────────── 2 · anatomy ───────────────────────── */

const LAYER_NAMES = ['Inner glow', 'Top light', 'Rim', 'Contact', 'Drop'];

function Anatomy() {
  const { colorway } = useColorway();
  const [hot, setHot] = React.useState<number | null>(null);
  const layers = RECIPE.layers.filter((l: { part: string; colorway?: string; state?: string }) => l.part === 'self' && l.colorway === colorway && !l.state) as { prop: string; value: string }[];
  const fill = layers.find((l) => l.prop === 'background')?.value;
  const shadows = layers.filter((l) => l.prop === 'shadow');
  const parts = [
    { name: 'Fill', style: { background: fill } as React.CSSProperties },
    // Each shadow alone, on a neutral base so a white highlight reads as clearly as a dark shadow.
    ...shadows.map((sh, i) => ({ name: LAYER_NAMES[i] ?? `Layer ${i + 1}`, style: { boxShadow: sh.value } as React.CSSProperties })),
  ];
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  return (
    <Beat
      id="anatomy"
      title="Anatomy"
      setup={`${words[parts.length] ?? parts.length} layers make the cap, each taken from the recipe in the colorway you are reading in.`}
      caption="Each layer on its own, at twice the size. Together they make the button. Hover a layer to find it in the button."
    >
      <div className="flex flex-col items-center gap-24 sm:flex-row sm:gap-20">
        <div className="grid grid-cols-2 gap-x-28 gap-y-20 sm:grid-cols-3">
          {parts.map((p, i) => (
            <button
              key={p.name}
              type="button"
              aria-label={`${p.name} layer`}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              className="relative flex cursor-default flex-col items-center gap-10 rounded-row p-2"
            >
              {i > 0 && <span aria-hidden className="type-doc-subheading absolute -left-20 top-22 text-ink3">+</span>}
              <span className={['block h-32 w-44 rounded-pill', i === 0 ? '' : 'bg-s-lo'].join(' ')} style={{ ...p.style, zoom: 2, opacity: hot === null || hot === i ? 1 : 0.3, transition: 'opacity var(--mu-r-button-self-fade)' }} />
              <span className="type-doc-caption text-ink3">{p.name}</span>
            </button>
          ))}
        </div>
        <span aria-hidden className="type-doc-heading text-ink3 sm:pb-28">=</span>
        <div className="flex flex-col items-center gap-10 p-2">
          <span className="relative block" style={{ zoom: 2 }}>
            <Button tabIndex={-1} className="w-56 px-0!">Save</Button>
            {hot !== null && <span className="pointer-events-none absolute inset-0 rounded-pill outline-1 outline-offset-1 outline-green-deep" style={parts[hot].style} />}
          </span>
          <span className="type-doc-caption text-ink">Cap</span>
        </div>
      </div>
    </Beat>
  );
}

/* ───────────────────────── 3 · the press is physics ───────────────────────── */

/** Step response of a unit mass: x'' = −k(x − 1) − c·x', sampled every `step` ms. */
function springCurve(k: number, c: number, ms = 400, step = 4) {
  let x = 0, v = 0;
  const pts: [number, number][] = [];
  const dt = step / 1000;
  for (let t = 0; t <= ms; t += step) {
    pts.push([t, x]);
    for (let s = 0; s < 8; s++) { const a = -k * (x - 1) - c * v; v += a * (dt / 8); x += v * (dt / 8); }
  }
  return pts;
}
/** CSS `ease` over `d` ms, as the same kind of samples (cubic-bezier .25 .1 .25 1). */
function easeCurve(d: number, ms = 400, step = 4) {
  const bez = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  const pts: [number, number][] = [];
  for (let t = 0; t <= ms; t += step) {
    const p = Math.min(1, t / d);
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (bez(m, 0.25, 0.25) < p) lo = m; else hi = m; }
    pts.push([t, bez(lo, 0.1, 1)]);
  }
  return pts;
}

function Plot({ curves, W = 320, H = 96, T = 400, dotRef }: { curves: { pts: [number, number][]; dashed?: boolean; label: string }[]; W?: number; H?: number; T?: number; dotRef?: React.Ref<SVGCircleElement> }) {
  const y = (x: number) => H - 14 - x * (H - 30);
  const d = (pts: [number, number][]) => pts.map(([t, x], i) => `${i ? 'L' : 'M'}${((t / T) * W).toFixed(1)} ${y(x).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-320 overflow-visible" aria-hidden>
      <path d={`M0 ${y(0)}H${W}`} className="stroke-rule" fill="none" />
      <path d={`M0 ${y(1)}H${W}`} className="stroke-rule" strokeDasharray="2 3" fill="none" />
      {curves.map((c) => (
        <path key={c.label} d={d(c.pts)} className={c.dashed ? 'stroke-ink3' : 'stroke-ink'} strokeWidth="1.5" strokeDasharray={c.dashed ? '4 3' : undefined} fill="none" />
      ))}
      {dotRef && <circle ref={dotRef} cx="0" cy={y(0)} r="4" className="fill-green-deep" />}
    </svg>
  );
}

function PressIsPhysics() {
  const [slow, setSlow] = React.useState(false);
  const naive = React.useRef<HTMLButtonElement>(null);
  const dot = React.useRef<SVGCircleElement>(null);
  const spring = React.useMemo(() => springCurve(RELEASE.stiffness, RELEASE.damping), []);
  const ease = React.useMemo(() => easeCurve(200), []);
  const W = 320, H = 96, T = 400;
  const trace = () => {
    const el = dot.current;
    if (!el) return;
    const start = performance.now();
    const len = T * (slow ? 4 : 1);
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / len);
      const [t, x] = spring[Math.min(spring.length - 1, Math.round(p * (spring.length - 1)))];
      el.setAttribute('cx', String((t / T) * W));
      el.setAttribute('cy', String(H - 14 - x * (H - 30)));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const naivePress = () => {
    const el = naive.current;
    if (!el) return;
    el.classList.remove('naive-press');
    void el.offsetWidth;
    el.classList.add('naive-press');
  };
  return (
    <Beat
      id="press-is-physics"
      title="The press is physics"
      setup="Held, the cap travels one point in 50 ms and its shadow collapses into a well. Released, it rides the release spring back."
      slow={slow}
      bar={<><SlowSwitch slow={slow} onChange={setSlow} /><span className="type-readout pr-4 text-ink3">k {RELEASE.stiffness} · c {RELEASE.damping} · half {RELEASE.half}</span></>}
      caption="The spring starts fast and slows down at the end. The 200 ms animation always has the same shape. Click both buttons quickly: the spring continues from where it is, the other one starts over."
      cost="a spring is a curve you sample from stiffness and damping, not a duration you type. It lives in one token."
    >
      <style>{`.naive-press{animation:naive-press 200ms ease}@keyframes naive-press{0%{transform:none}40%{transform:translateY(1px)}100%{transform:none}}.naive-cap:active{transform:none!important}`}</style>
      <div className="grid w-full grid-cols-1 items-center gap-32 sm:grid-cols-[auto_1fr]">
        <div className="flex items-start justify-center gap-24">
          <div className="flex flex-col items-center gap-12">
            <Tag tone="lit">release spring</Tag>
            <Button onPointerUp={trace}>Spring</Button>
          </div>
          <div className="flex flex-col items-center gap-12">
            <Tag>200ms ease</Tag>
            <Button ref={naive as never} className="naive-cap" onPointerDown={naivePress}>Keyframe</Button>
          </div>
        </div>
        <figure className="flex flex-col items-center gap-8" aria-label="Release curve against a 200 ms ease">
          <Plot W={W} H={H} T={T} dotRef={dot} curves={[{ pts: ease, dashed: true, label: 'ease' }, { pts: spring, label: 'spring' }]} />
          <span className="type-doc-caption flex gap-16 text-ink3">
            <span className="flex items-center gap-6"><span className="h-2 w-14 bg-ink" />spring</span>
            <span className="flex items-center gap-6"><span className="h-0 w-14 border-t-2 border-dashed border-ink3" />ease</span>
            <span>0 → 400 ms</span>
          </span>
        </figure>
      </div>
    </Beat>
  );
}

/* ───────────────────────── 4 · a changing label turns ───────────────────────── */

function LabelTurns() {
  const [slow, setSlow] = React.useState(false);
  const text = 'Soft Hardware: a changing label turns.';
  const a = useCopyFeedback(text, slow ? 4800 : 1600);
  const b = useCopyFeedback(text, slow ? 4800 : 1600);
  const word = (state: string) => state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy';
  const settle = React.useMemo(() => springCurve(SETTLE.stiffness, SETTLE.damping), []);
  const step = React.useMemo(() => settle.map(([t]) => [t, t < 8 ? 0 : 1] as [number, number]), [settle]);
  return (
    <Beat
      id="label-turns"
      title="A changing label turns"
      setup="Copy becoming Copied is one step on a drum, its glyph morphs from copy into check after the clipboard write succeeds, and the cap's width follows on the settle spring."
      slow={slow}
      bar={<SlowSwitch slow={slow} onChange={setSlow} />}
      caption="Press both buttons and watch the glyph and the width. Ours becomes the tick and grows smoothly to fit the new word. The other one swaps its glyph and jumps."
      cost="two wrappers: MorphIcon for the glyph and SwapText for the label."
    >
      <div className="grid w-full grid-cols-1 gap-y-32 sm:grid-cols-2 sm:divide-x sm:divide-rule">
        {[
          { tag: 'SwapText', lit: true, pts: settle, node: <Button onClick={() => a.copy(() => navigator.clipboard.writeText(text))} icon={<MorphIcon name={a.state === 'copied' ? 'check' : 'copy'} />}><span aria-live="polite"><SwapText value={word(a.state)} /></span></Button> },
          { tag: 'replaced', lit: false, pts: step, node: <Button onClick={() => b.copy(() => navigator.clipboard.writeText(text))} icon={<Icon name={b.state === 'copied' ? 'check' : 'copy'} />}><span aria-live="polite">{word(b.state)}</span></Button> },
        ].map((v) => (
          <div key={v.tag} className="flex flex-col items-center gap-16 px-16">
            <Tag tone={v.lit ? 'lit' : 'quiet'}>{v.tag}</Tag>
            <div className="flex h-32 items-center">{v.node}</div>
            <div className="flex w-full max-w-200 flex-col gap-4">
              <Plot W={200} H={56} T={400} curves={[{ pts: v.pts, label: v.tag }]} />
              <span className="type-doc-caption flex justify-between text-ink3"><span>width, Copy</span><span>Copied</span></span>
            </div>
          </div>
        ))}
      </div>
    </Beat>
  );
}

/* ───────────────────────── 5 · an action names itself ───────────────────────── */

function ActionNamesItself() {
  const [done, setDone] = React.useState<string | null>(null);
  const act = (verb: string) => () => setDone(verb);
  return (
    <Beat
      id="action-names-itself"
      title="An action names itself"
      setup="A button that does something leads with the glyph of what it does, then the verb. A plain choice is words alone: it does nothing but answer."
      caption={done ? `${done}: the button did it. Hover the actions and each glyph plays its own act; the choices stay still.` : 'Hover or press the actions: each glyph plays its own act, because the button is its trigger. The choices have no glyph.'}
      cost="one prop, icon. The cap sizes the glyph, so nothing is hand-sized."
      code={{ label: 'app.tsx', lang: 'tsx', code: `import { ShareIcon, TrashIcon } from '@unlocalhosted/metalui/icons';\n\n<Button icon={<ShareIcon />}>Share</Button>\n<Button cap="destructive" icon={<TrashIcon />}>Delete</Button>\n<Button>Cancel</Button>` }}
    >
      <div className="flex w-full flex-col divide-y divide-rule" data-testid="button-actions">
        <div className="flex flex-wrap items-center justify-between gap-12 pb-14">
          <Tag tone="lit">actions</Tag>
          <div className="flex flex-wrap gap-8">
            <Button icon={<PlusIcon />} onClick={act('New canvas')}>New Canvas</Button>
            <Button icon={<ShareIcon />} onClick={act('Share')}>Share</Button>
            <Button icon={<ShareIcon />} onClick={act('Export')}>Export</Button>
            <Button icon={<DuplicateIcon />} onClick={act('Duplicate')}>Duplicate</Button>
            <Button icon={<PenIcon />} onClick={act('Rename')}>Rename</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-12 pt-14">
          <Tag tone="quiet">a dialog footer</Tag>
          <div className="flex flex-wrap gap-8">
            <Button onClick={() => setDone(null)}>Cancel</Button>
            <Button cap="destructive" icon={<TrashIcon />} onClick={act('Delete')}>Delete</Button>
          </div>
        </div>
      </div>
    </Beat>
  );
}

/* ───────────────────────── 6 · one signal cap ───────────────────────── */

function OneSignalCap() {
  const footers: { name: string; lit?: boolean; caps: [ButtonCap, string][] }[] = [
    { name: 'three signals', caps: [['primary', 'Cancel'], ['destructive', 'Discard'], ['primary', 'Save']] },
    { name: 'no signal', caps: [['standard', 'Cancel'], ['standard', 'Discard'], ['standard', 'Save']] },
    { name: 'one signal', lit: true, caps: [['standard', 'Cancel'], ['standard', 'Discard'], ['primary', 'Save']] },
  ];
  return (
    <Beat
      id="one-signal-cap"
      title="One signal cap"
      setup="A footer with three loud buttons has no loud button. The dark cap only means something when it is alone."
      caption="Count the dark buttons in each row. See which one you look at first."
    >
      <div className="flex w-full flex-col divide-y divide-rule">
        {footers.map((f) => (
          <div key={f.name} className="flex flex-wrap items-center justify-between gap-12 py-14 first:pt-0 last:pb-0">
            <Tag tone={f.lit ? 'lit' : 'quiet'}>{f.name}</Tag>
            <div className="flex gap-8">{f.caps.map(([cap, label]) => <Button key={label} tabIndex={-1} cap={cap}>{label}</Button>)}</div>
          </div>
        ))}
      </div>
    </Beat>
  );
}

/* ───────────────────────── 7 · one line, always ───────────────────────── */

function OneLine() {
  const [w, setW] = React.useState(180);
  return (
    <Beat
      id="one-line"
      title="One line, always"
      setup="A pill that wraps stops being a pill. The label keeps to one line; if it does not fit, the label is too long."
      bar={
        <div className="flex w-full items-center gap-12 px-4">
          <span className="type-doc-caption text-ink2">Width</span>
          <Slider.Root value={w} min={140} max={360} onValueChange={setW} className="flex-1">
            <Slider.Track />
            <Slider.Knob aria-label="Container width" getAriaValueText={(_, v) => `${v} points`} />
          </Slider.Root>
          <span className="type-readout w-40 text-right text-ink">{w}</span>
        </div>
      }
      caption="At this width the other button wraps onto two lines. Ours stays on one line. Drag the width to compare."
    >
      <div className="flex w-full flex-col gap-20">
        {[
          { tag: 'wraps', lit: false, node: <Button tabIndex={-1} icon={<Icon name="download" />} className="h-auto! min-h-32 whitespace-normal! py-6 text-center">Export all canvases as PDF</Button> },
          { tag: 'one line', lit: true, node: <Button tabIndex={-1} icon={<Icon name="download" />}>Export all canvases as PDF</Button> },
        ].map((r) => (
          <div key={r.tag} className="flex items-center gap-16">
            <span className="w-72 shrink-0"><Tag tone={r.lit ? 'lit' : 'quiet'}>{r.tag}</Tag></span>
            <div style={{ width: w }} className="border-x border-dashed border-rule px-8">{r.node}</div>
          </div>
        ))}
      </div>
    </Beat>
  );
}

/* ───────────────────────── reference ───────────────────────── */

const STATES = ['Rest', 'Hover', 'Focus', 'Pressed', 'Disabled'];

function States() {
  return (
    <Section id="states" title="States" lede="Every button at rest, hover, focus, pressed and disabled. Hover, focus and pressed are frozen here so you can look at them.">
      <Stage>
        <div className="-mx-8 w-full overflow-x-auto px-8">
          <div className="mx-auto grid w-max grid-cols-[88px_repeat(5,auto)] items-center gap-x-16 gap-y-16">
            <span />
            {STATES.map((s) => <span key={s} className="type-doc-caption text-center text-ink3">{s}</span>)}
            {CAPS.map((cap) => (
              <div key={cap} className="contents">
                <span className="type-doc-caption text-ink3">{cap}</span>
                <Button tabIndex={-1} cap={cap}>Cancel</Button>
                <Button tabIndex={-1} cap={cap} className={cap === 'standard' ? 'text-ink!' : 'brightness-110'}>Cancel</Button>
                <Button tabIndex={-1} cap={cap} className="outline-2 outline-offset-2 outline-green-deep">Cancel</Button>
                <Button tabIndex={-1} cap={cap} className={`${PRESSED[cap]} translate-y-button-travel`}>Cancel</Button>
                <Button tabIndex={-1} cap={cap} disabled>Cancel</Button>
              </div>
            ))}
          </div>
        </div>
      </Stage>
    </Section>
  );
}

function Variants() {
  return (
    <Section id="variants" title="Variants" lede="Compact is the small 26 point button used on the canvas. Its text is lighter until you hover. Link, graphite and strip buttons are sized for the places they are used.">
      <Stage caption="Compact, with a glyph, with a key, primary and disabled.">
        <div className="flex flex-wrap items-center justify-center gap-10">
          <Button size="compact">seed a sample day</Button>
          <Button size="compact" icon={<ShareIcon />}>Share</Button>
          <Button size="compact">lenses <Kbd size="small">⌘K</Kbd></Button>
          <Button size="compact" cap="primary" icon={<Icon name="pin" />}>Keep</Button>
          <Button size="compact" cap="destructive" icon={<TrashIcon />}>Delete</Button>
          <Button size="compact" disabled icon={<ShareIcon />}>Share</Button>
        </div>
      </Stage>
      <Stage tone="dark" caption="Link, graphite, strip and strip-danger, each on the dark surface it belongs to.">
        <div className="flex flex-wrap items-center justify-center gap-14">
          <Button cap="link" icon={<Icon name="document" />}>READ ALL</Button>
          <Button cap="graphite" icon={<Icon name="clock" />}>Back to now</Button>
          <Button cap="strip" icon={<Icon name="tidy" />}>Summarise</Button>
          <Button cap="strip-danger" icon={<Icon name="send-away" />}>Send away</Button>
        </div>
      </Stage>
      <SwiftCapture name="button" maxWidth={360} />
    </Section>
  );
}

function Colorways() {
  return (
    <Section id="colorways" title="Colorways" lede="The same button in Bone and Graphite. Graphite is not just Bone flipped. Its light is dimmer and its shadows are darker.">
      <div className="grid gap-12 sm:grid-cols-2 lg:-mx-60">
        {(['bone', 'graphite'] as const).map((cw) => (
          <div key={cw} data-mu-colorway={cw} className="material-stage flex flex-col items-center gap-16 rounded-plate px-16 py-28">
            <Tag>{cw === 'bone' ? 'Bone' : 'Graphite'}</Tag>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {CAPS.map((c) => <Button key={c} tabIndex={-1} cap={c}>{c === 'destructive' ? 'Discard' : c === 'primary' ? 'Save' : 'Cancel'}</Button>)}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Keyboard() {
  const [down, setDown] = React.useState<string | null>(null);
  const [count, setCount] = React.useState(0);
  const onKey = (e: React.KeyboardEvent, isDown: boolean) => {
    const k = e.key === ' ' ? 'Space' : e.key;
    if (['Tab', 'Enter', 'Space'].includes(k)) setDown(isDown ? k : null);
  };
  return (
    <Section id="keyboard" title="Keyboard" lede="Focus the button and use your keyboard. The keys light up as you press them.">
      <Stage caption={`Activated ${count} ${count === 1 ? 'time' : 'times'}.`}>
        <div className="flex flex-col items-center gap-20" onKeyDown={(e) => onKey(e, true)} onKeyUp={(e) => onKey(e, false)}>
          <Button onClick={() => setCount((n) => n + 1)}>Focus me</Button>
          <div className="flex gap-8" aria-hidden>
            {['Tab', 'Enter', 'Space'].map((k) => (
              <span key={k} className={down === k ? 'translate-y-button-travel brightness-95' : ''}><Kbd>{k === 'Enter' ? '⏎ Enter' : k === 'Space' ? '␣ Space' : '⇥ Tab'}</Kbd></span>
            ))}
          </div>
        </div>
      </Stage>
      <TokenTable
        head={['Key', 'Effect']}
        mono={[0]}
        rows={[
          ['Tab', 'Moves focus to the button. The ring shows for keyboard focus only, 2 pt at a 2 pt offset.'],
          ['Enter', 'Activates on key down.'],
          ['Space', 'Activates on key up, like a native button.'],
          ['role', 'button. Its name is the label; an icon-only button needs aria-label.'],
          ['type="submit"', 'Submits its form.'],
        ]}
      />
    </Section>
  );
}

function Api() {
  return (
    <Section id="api" title="API">
      <TokenTable
        head={['Prop', 'Type', 'Default', 'Notes']}
        mono={[0, 1, 2]}
        rows={[
          ['cap', "'standard' | 'primary' | 'destructive' | 'link' | 'graphite' | 'strip' | 'strip-danger'", "'standard'", 'At most one primary or destructive per group. link, graphite and strip caps set their own size.'],
          ['size', "'default' | 'compact'", "'default'", 'default is 32 tall; compact is 26 (the canvas pill).'],
          ['icon', 'ReactNode', '–', 'The action’s glyph, before the label, sized by the cap (16, compact 14). A MorphIcon here morphs when the control changes meaning. Plain choices have none.'],
          ['state', 'idle | waiting | done | error', '–', 'Host owns async work. Reserves label and glyph width; waiting and done refuse repeated actions.'],
          ['waitingLabel / doneLabel / errorLabel', 'string', 'Working… / Done / Try again', 'Labels turn on the drum. Pass MorphIcon for semantic result glyphs.'],
          ['showDelay / minVisible', 'number (ms)', '400 / 300', 'Fast work skips the wait face. Once shown, the arc stays at least 300ms.'],
          ['hold', 'boolean | number', 'false', 'Destructive cap only: hold pointer, Space or Enter for 800ms (or custom milliseconds). Release, blur or Escape cancels. Use false for a single press; irreversible loss belongs inside AlertDialog.'],
          ['disabled', 'boolean', 'false', 'Renders at 40% and skips icon motion. From Base UI.'],
          ['focusableWhenDisabled', 'boolean', 'false', 'Keeps a disabled button in the tab order. From Base UI.'],
          ['render', 'Base UI render prop', '–', 'Render as a link or custom element; set nativeButton={false}.'],
        ]}
      />
      <p className="type-doc-caption text-ink3">Swift: <C>MetalButton(_ title:, icon:, cap:, size:, action:)</C>, where <C>icon</C> is a <C>MetalIconName</C>; or the <C>icon:</C> view builder for any other glyph.</p>
    </Section>
  );
}

function Tokens() {
  const p = RECIPE.props.self as Record<string, string | number>;
  return (
    <Section id="tokens" title="Tokens" lede="All the values the button uses. Change one in tokens.json and both React and SwiftUI update.">
      <TokenTable
        head={['Token', 'Value', 'Used for']}
        rows={[
          ['--mu-r-button-self-height', `${p.height}`, 'height'],
          ['--mu-r-button-self-pad', `${p.pad}`, 'side padding (h ÷ 2 − 1)'],
          ['--mu-r-button-self-gap', `${p.gap}`, 'icon to label'],
          ['--mu-r-button-self-glyph', `${p.glyph}`, 'icon size'],
          ['--mu-r-button-self-travel', `${p.travel}`, 'press travel'],
          ['--mu-r-button-self-press', `${p.press}`, 'down, linear'],
          ['--mu-r-button-self-fade', `${p.fade}`, 'fill and shadow cross-fade'],
          ['--mu-r-button-self-focus-width', `${p['focus-width']}`, 'focus ring'],
          ['--mu-r-button-self-focus-offset', `${p['focus-offset']}`, 'focus ring offset'],
          ['--mu-r-button-self-disabled', `${p.disabled}`, 'disabled opacity'],
          ['--mu-btn-bg · --mu-btn-sh', 'recipe', 'the cap, per colorway'],
          ['--mu-spring-release', `k ${RELEASE.stiffness} · c ${RELEASE.damping}`, 'the way back up'],
        ]}
      />
    </Section>
  );
}


/* WAITING STORYBOARD
 * 0ms: the host starts one request, busy/refusal immediately; cap keeps its original face.
 * 400ms: glyph slot becomes a current-ink arc, label drum turns, cap stays sunk.
 * result: host commits its data; visible wait completes its 300ms minimum, then result lands.
 * error: Try again and sync-error retain the same footprint and permit a fresh request.
 * reduced: still semantic result + opacity drum; the arc breathes without rotation.
 */
function Waiting() {
  const controller = useDialKitController('Button · waiting', {
    duration: [900, 100, 3000],
    showDelay: [400, 0, 1000],
    minVisible: [300, 0, 1000],
    fail: false as boolean,
  });
  const dial = controller.values;
  const [state, setState] = React.useState<ButtonState>('idle');
  const [requests, setRequests] = React.useState(0);
  const task = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(task.current), []);
  const save = () => {
    setRequests((n) => n + 1);
    setState('waiting');
    task.current = setTimeout(() => setState(dial.fail ? 'error' : 'done'), dial.duration);
  };
  return <Section id="waiting" title="The wait lives in the key" lede="The host starts the request and tells the key when it lands. Fast work goes straight to the result; a longer wait uses the same glyph slot and keeps the key sunk.">
    <Stage>
      <div className="mu-stack items-center gap-mu-related">
        <Button cap="primary" state={state} waitingLabel="Saving…" doneLabel="Saved" errorLabel="Try again" showDelay={dial.showDelay} minVisible={dial.minVisible} onClick={save}
          icon={<SaveGlyph state={state} />}>Save</Button>
        <p className="type-doc-caption text-ink2" data-testid="save-requests">{requests} {requests === 1 ? 'request' : 'requests'}</p>
        <div className="mu-cluster gap-mu-related" aria-label="Request examples">
          {[['Quick save', 100, false], ['Slow save', 1800, false], ['Failed save', 900, true], ['Brief wait', 500, false]].map(([name, duration, fail]) => <Button key={String(name)} size="compact" onClick={() => { clearTimeout(task.current); setState('idle'); controller.setValues({ duration: Number(duration), fail: Boolean(fail) }); }}>{String(name)}</Button>)}
        </div>
        <Button size="compact" onClick={() => { clearTimeout(task.current); setState('idle'); }}>Reset example</Button>
      </div>
    </Stage>
    <CodeScreen tabs={[{ id: 'react', label: 'React', lang: 'tsx', file: 'save.tsx', code: `<Button state={state} cap="primary"
  waitingLabel="Saving…" doneLabel="Saved"
  icon={<MorphIcon name={state === 'done' ? 'check' :
    state === 'error' ? 'sync-error' : 'save'} />}
  onClick={save}>Save</Button>` }]} />
    <p className="type-doc-caption text-ink2">Waiting and done refuse another press and keep focus. An error accepts a retry. The label and glyph reserve their widest configured footprint; give this key its final host width from the start. The host must commit the real result before setting done and must reset to idle for a new action. Hidden and offscreen arcs pause; reduced motion keeps a breathing arc. Tune the timing and failure in DialKit.</p>
  </Section>;
}
