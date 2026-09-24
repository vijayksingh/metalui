import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Kbd, Slider, SwapText, type ButtonCap } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/button/button.tsx?raw';
import agentGuide from '../../../../../packages/metalui/src/components/button/button.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalButton.swift?raw';
import { C, CodeScreen, PageHeader, Rules, Section, SourceTabs, Stage, Tag, TokenTable } from '../../ui/doc';
import { Beat, Compare, LayerTrail, SlowSwitch, SpecLine } from '../../ui/beat';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { useColorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * BUTTON: the component template (DOCS_ARCHITECTURE §3.1, §7)
 *
 *   head        title · one line · layer trail · spec line
 *   hero        the live button (DialKit) · the usage snippet on the code screen
 *   details     1 the cap is an object     flat and recipe, side by side, magnified
 *               2 anatomy                  the layers as an equation: fill + … = cap
 *               3 the press is physics     both curves drawn at rest; press to trace
 *               4 a changing label turns   width over time drawn at rest: a spring, a step
 *               5 one signal cap           three footers, count the dark caps
 *               6 one line, always         starts narrow: the wrapped one is already broken
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
      <PageHeader title="Button" lede="A press-in pill. Held, it sinks one point and its shadow collapses into a well. Released, it springs back.">
        <LayerTrail
          down={[{ label: 'the cap recipe', to: '/foundations/materials' }, { label: 'the release spring', to: '/foundations/motion' }]}
          here="Button"
          up={[{ label: 'Tool strip', to: '/components/tool-strip' }, { label: 'Past banner', to: '/components/past-banner' }, { label: 'Suggestion chip', to: '/components/suggestion-chip' }, { label: 'Toast', to: '/components/toast' }]}
        />
        <SpecLine
          items={[
            { label: 'React', value: 'import { Button }', href: '#hero', mono: true },
            { label: 'Swift', value: 'MetalButton', href: '#platforms', mono: true },
            { label: 'Props', value: '5', href: '#api' },
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
          <OneSignalCap />
          <OneLine />
        </div>
      </Section>
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
            { id: 'B2', title: 'Icons lead, at the control’s icon size', body: '14 in a 32 button. The button is the icon’s trigger, so its hover pose and press play from the whole button.' },
            { id: 'B3', title: 'The press is feedback, not a result', body: 'Show the real outcome: a toast, a state change or an error. Never let the animation stand in for success.' },
            { id: 'B4', title: 'Changing labels turn', body: 'Copy → Copied, Save → Saving… → Saved: wrap the label in SwapText. The width springs to the new label. Shown in “A changing label turns”.' },
            { id: 'B5', title: 'The label is a short verb', body: 'One line, always. If it does not fit, the label is too long; the button never wraps. Shown in “One line, always”.' },
          ]}
        />
      </Section>
      <Section id="related" title="Related">
        <ul className="type-doc-prose flex max-w-measure flex-col gap-6 text-ink2">
          <li><a className="text-ink underline decoration-rule" href="/components/segmented">Segmented</a>: for a latched choice rather than an action.</li>
          <li><a className="text-ink underline decoration-rule" href="/foundations/motion">Motion</a>: the release spring and the other six classes.</li>
          <li><a className="text-ink underline decoration-rule" href="/foundations/materials">Materials</a>: where the cap recipe comes from.</li>
        </ul>
      </Section>
    </>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  const d = useDialKit('Button', {
    content: {
      label: 'New Canvas',
      cap: { type: 'select', options: CAPS, default: 'primary' },
      icon: { type: 'select', options: ['none', 'share', 'duplicate', 'send-away', 'check'], default: 'none' },
      disabled: false,
    },
    geometry: { height: [32, 20, 44, 4] },
    press: { travel: [1, 0, 3, 0.5] },
  });
  const h = d.geometry.height;
  const iconSize = h <= 24 ? 12 : h <= 32 ? 14 : h <= 40 ? 16 : 20;
  const pad = h / 2 - 1;
  const vars = { '--mu-r-button-self-height': `${h}px`, '--mu-r-button-self-pad': `${pad}px`, '--mu-r-button-self-travel': `${d.press.travel}px` } as React.CSSProperties;
  return (
    <section id="hero" className="flex scroll-mt-80 flex-col gap-24">
      <Stage
        caption={<>Press it and hold. Height {h}, padding {pad} (half the height, less one, so it stays a pill), travel {d.press.travel} pt. Tune it in the panel at the bottom right.</>}
      >
        <div style={vars} className="flex items-center gap-12">
          <Button cap={d.content.cap as ButtonCap} disabled={d.content.disabled}>
            {d.content.icon !== 'none' && <Icon name={d.content.icon as IconName} size={iconSize} />}
            {d.content.label}
          </Button>
        </div>
      </Stage>
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
      caption="Compare the edges. The recipe has a lit lip along the top and a soft shadow where it meets the page; the flat fill has neither."
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
      caption="Each layer alone, at twice the size, adds up to the cap. Hover a layer to find it in the finished cap; switch the colorway and every layer changes with it."
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
      caption="Compare the curves: the spring leaves fast and eases into place; the 200 ms ease is a fixed shape. Click each button rapidly: the spring picks up from wherever the cap is, the keyframe starts over."
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
  const [a, setA] = React.useState(false);
  const [b, setB] = React.useState(false);
  const flip = (set: (v: boolean) => void) => { set(true); window.setTimeout(() => set(false), slow ? 4800 : 1600); };
  const settle = React.useMemo(() => springCurve(SETTLE.stiffness, SETTLE.damping), []);
  const step = React.useMemo(() => settle.map(([t]) => [t, t < 8 ? 0 : 1] as [number, number]), [settle]);
  return (
    <Beat
      id="label-turns"
      title="A changing label turns"
      setup="Copy becoming Copied is one step on a drum, and the cap's width follows on the settle spring."
      slow={slow}
      bar={<SlowSwitch slow={slow} onChange={setSlow} />}
      caption="Compare the width over time under each button: ours grows into the new word, the replaced label jumps in one frame. Press both to see it."
      cost="one wrapper, SwapText, around any label that can change."
    >
      <div className="grid w-full grid-cols-1 gap-y-32 sm:grid-cols-2 sm:divide-x sm:divide-rule">
        {[
          { tag: 'SwapText', lit: true, pts: settle, node: <Button onClick={() => flip(setA)}><Icon name={a ? 'check' : 'duplicate'} size={14} /><SwapText value={a ? 'Copied' : 'Copy'} /></Button> },
          { tag: 'replaced', lit: false, pts: step, node: <Button onClick={() => flip(setB)}><Icon name={b ? 'check' : 'duplicate'} size={14} />{b ? 'Copied' : 'Copy'}</Button> },
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

/* ───────────────────────── 5 · one signal cap ───────────────────────── */

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
      caption="Count the dark caps in each footer, then notice where your eye lands first."
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

/* ───────────────────────── 6 · one line, always ───────────────────────── */

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
      caption="Compare the two at this width: the wrapped one is a lozenge with two lines. Drag the width up and it heals; ours never changed shape."
    >
      <div className="flex w-full flex-col gap-20">
        {[
          { tag: 'wraps', lit: false, node: <Button tabIndex={-1} className="h-auto! min-h-32 whitespace-normal! py-6 text-center">Export all canvases as PDF</Button> },
          { tag: 'one line', lit: true, node: <Button tabIndex={-1}>Export all canvases as PDF</Button> },
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
    <Section id="states" title="States" lede="Each cap at rest, hover, focus, pressed and disabled. Hover, focus and pressed are held so you can study them.">
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
    <Section id="variants" title="Variants" lede="Compact is the canvas pill: 26 tall, raised lightly, quiet ink until hover. The link, graphite and strip caps set their own size for the surfaces they live on.">
      <Stage caption="Compact, with a glyph, with a key, primary and disabled.">
        <div className="flex flex-wrap items-center justify-center gap-10">
          <Button size="compact">seed a sample day</Button>
          <Button size="compact"><Icon name="share" size={12} />Share</Button>
          <Button size="compact">lenses <Kbd size="small">⌘K</Kbd></Button>
          <Button size="compact" cap="primary">Keep</Button>
          <Button size="compact" disabled>Share</Button>
        </div>
      </Stage>
      <Stage tone="dark" caption="Link, graphite, strip and strip-danger, each on the dark surface it belongs to.">
        <div className="flex flex-wrap items-center justify-center gap-14">
          <Button cap="link">READ ALL</Button>
          <Button cap="graphite">Back to now</Button>
          <Button cap="strip">Summarise</Button>
          <Button cap="strip-danger">Send away</Button>
        </div>
      </Stage>
      <SwiftCapture name="button" maxWidth={360} />
    </Section>
  );
}

function Colorways() {
  return (
    <Section id="colorways" title="Colorways" lede="The same recipe in Bone and Graphite. Graphite is not an inverted Bone: its light is dimmer and its shadows are deeper.">
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
    <Section id="keyboard" title="Keyboard" lede="Focus the button and use your own keyboard; the keys light as you press them.">
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
          ['disabled', 'boolean', 'false', 'Renders at 40% and skips icon motion. From Base UI.'],
          ['focusableWhenDisabled', 'boolean', 'false', 'Keeps a disabled button in the tab order. From Base UI.'],
          ['render', 'Base UI render prop', '–', 'Render as a link or custom element; set nativeButton={false}.'],
        ]}
      />
      <p className="type-doc-caption text-ink3">Swift: <C>MetalButton(_ title:, cap:, size:, action:)</C>. No slots: the children are the label and an optional leading icon.</p>
    </Section>
  );
}

function Tokens() {
  const p = RECIPE.props.self as Record<string, string | number>;
  return (
    <Section id="tokens" title="Tokens" lede="Everything the button reads. Change a value in tokens.json and both platforms follow.">
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
