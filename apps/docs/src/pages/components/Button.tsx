import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Kbd, SwapText, type ButtonCap } from '@unlocalhosted/metalui';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/button/button.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/button/button.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalButton.swift?raw';
import { Bench, CopyPageButton, Rules, Section, SourceTabs, TokenTable } from '../../ui/doc';
import { Beat, LayerTrail, SlowSwitch, SpecStrip, Toggle } from '../../ui/beat';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { useColorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';

/* ─────────────────────────────────────────────────────────
 * BUTTON: the first page on the show-don't-tell template
 *
 *   head        title · one line · layer trail · spec strip       (reference, above the fold)
 *   hero        live button + DialKit  |  usage snippet           (reference, above the fold)
 *   details     1 the cap is an object   decision + toggle
 *               2 anatomy                layers peel apart
 *               3 the press is physics   replay vs 200ms ease, slow, live curve
 *               4 a changing label turns replay vs snap
 *               5 one signal cap         count the primaries
 *               6 one line, always       width scrub
 *   states · variants · colorways · keyboard · api · tokens · platforms · rules · related
 * ───────────────────────────────────────────────────────── */

const RECIPE = tokens.recipes.button;
const SPRING = tokens.springs.release as { stiffness: number; damping: number; half: string; near: string };
const CAPS: ButtonCap[] = ['standard', 'primary', 'destructive'];
const PRESSED: Partial<Record<ButtonCap, React.CSSProperties>> = {
  standard: { background: 'var(--mu-pressed-bg)', boxShadow: 'var(--mu-pressed-sh)' },
  primary: { background: 'var(--mu-primary-pressed-bg)', boxShadow: 'var(--mu-primary-pressed-sh)' },
  destructive: { background: 'var(--mu-destructive-pressed-bg)', boxShadow: 'var(--mu-destructive-pressed-sh)' },
};

const USAGE = {
  react: `import { Button } from '@unlocalhosted/metalui';

<Button cap="primary">New Canvas</Button>`,
  swift: `import MetalUI

MetalButton("New Canvas", cap: .primary) { create() }`,
};

export default function ButtonPage() {
  return (
    <>
      <Head />
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
      <Section id="platforms" title="Platforms" lede="The same Button three ways, plus the guide a coding agent reads.">
        <SourceTabs
          tabs={[
            { id: 'react', label: 'React', code: reactSource },
            { id: 'css', label: 'CSS', code: cssSource },
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
        <ul className="prose-body flex flex-col gap-6 text-ink2">
          <li><a className="text-ink underline decoration-dotted underline-offset-4" href="/components/segmented">Segmented</a>: for a latched choice rather than an action.</li>
          <li><a className="text-ink underline decoration-dotted underline-offset-4" href="/foundations/motion">Motion</a>: the release spring and the other six classes.</li>
          <li><a className="text-ink underline decoration-dotted underline-offset-4" href="/foundations/materials">Materials</a>: where the cap recipe comes from.</li>
        </ul>
      </Section>
    </>
  );
}

/* ───────────────────────── head ───────────────────────── */

function Head() {
  return (
    <header id="head" className="mb-40 flex flex-col gap-16">
      <div className="flex flex-wrap items-start justify-between gap-16">
        <h1 className="page-title text-ink">Button</h1>
        <CopyPageButton />
      </div>
      <p className="page-lede max-w-[62ch] text-ink2">A press-in pill. Held, it sinks one point and its shadow collapses into a well. Released, it springs back.</p>
      <LayerTrail
        down={[{ label: 'Materials · cap', to: '/foundations/materials' }, { label: 'Motion · release', to: '/foundations/motion' }]}
        here="Button"
        up={[{ label: 'Tool strip', to: '/components/tool-strip' }, { label: 'Past banner', to: '/components/past-banner' }, { label: 'Suggestion chip', to: '/components/suggestion-chip' }, { label: 'Toast', to: '/components/toast' }]}
      />
      <SpecStrip
        items={[
          { label: 'React', value: "import { Button }", href: '#hero', mono: true },
          { label: 'Swift', value: 'MetalButton', href: '#platforms', mono: true },
          { label: 'Props', value: '5', href: '#api' },
          { label: 'States', value: '5', href: '#states' },
          { label: 'Keys', value: '⏎ ␣', href: '#keyboard' },
          { label: 'Tokens', value: '12', href: '#tokens' },
        ]}
      />
    </header>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero() {
  const [lang, setLang] = React.useState<'react' | 'swift'>('react');
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
    <section id="hero" className="mb-64 grid scroll-mt-80 gap-16 md:grid-cols-[1.2fr_1fr]">
      <Bench caption={`Press it. Hold it. Let go.  ·  h${h} · pad ${pad} · icon ${iconSize} · travel ${d.press.travel}`}>
        <div style={vars}>
          <Button cap={d.content.cap as ButtonCap} disabled={d.content.disabled}>
            {d.content.icon !== 'none' && <Icon name={d.content.icon as IconName} size={iconSize} />}
            {d.content.label}
          </Button>
        </div>
      </Bench>
      <div className="flex flex-col gap-10">
        <Toggle label="Platform" value={lang} onChange={setLang} options={[{ value: 'react', label: 'React' }, { value: 'swift', label: 'SwiftUI' }]} />
        <pre className="material-well type-code overflow-x-auto rounded-card p-16 text-ink" hidden={lang !== 'react'}><code>{USAGE.react}</code></pre>
        <pre className="material-well type-code overflow-x-auto rounded-card p-16 text-ink" hidden={lang !== 'swift'}><code>{USAGE.swift}</code></pre>
        <p className="type-meta text-ink3">Padding follows the pill rule, h ÷ 2 − 1, so a taller button stays a pill.</p>
      </div>
    </section>
  );
}

/* ───────────────────────── 1 · the cap is an object ───────────────────────── */

function CapIsAnObject() {
  const [look, setLook] = React.useState<'flat' | 'recipe'>('flat');
  const flat: React.CSSProperties = { background: 'var(--mu-s)', boxShadow: 'none' };
  return (
    <Beat
      id="cap-is-an-object"
      title="The cap is an object"
      setup="Draw a button as a flat fill and it reads as a sticker on the page, not a thing you could press."
      controls={<Toggle label="Look" value={look} onChange={setLook} options={[{ value: 'flat', label: 'Flat fill' }, { value: 'recipe', label: 'Cap recipe' }]} />}
      caption="Switch between the flat fill and the recipe. Watch the bottom edge: light comes from above, so the cap has a lip and a shadow where it meets the page."
      cost="five shadow layers per colorway instead of none, kept identical on web and Swift by one recipe."
      code={{ label: 'tokens.json › recipes.button', code: JSON.stringify(RECIPE.layers.filter((l: { colorway?: string }) => l.colorway !== 'graphite'), null, 2) }}
    >
      <div className="flex items-center gap-24">
        <Button style={look === 'flat' ? flat : undefined}>Cancel</Button>
        <Button cap="primary" style={look === 'flat' ? { boxShadow: 'none' } : undefined}>Save</Button>
      </div>
    </Beat>
  );
}

/* ───────────────────────── 2 · anatomy ───────────────────────── */

const LAYER_NAMES = ['Inner glow', 'Top highlight', 'Rim', 'Contact shadow', 'Drop shadow'];

function Anatomy() {
  const { colorway } = useColorway();
  const [pinned, setPinned] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const open = pinned || hover;
  const layers = RECIPE.layers.filter((l: { part: string; colorway?: string }) => l.part === 'self' && l.colorway === colorway && !(l as { state?: string }).state) as { prop: string; value: string }[];
  const fill = layers.find((l) => l.prop === 'background')?.value;
  const shadows = layers.filter((l) => l.prop === 'shadow');
  const parts = [{ name: 'Fill', style: { background: fill } }, ...shadows.map((s, i) => ({ name: LAYER_NAMES[i] ?? `Layer ${i + 1}`, style: { background: 'transparent', boxShadow: s.value } }))];
  return (
    <Beat
      id="anatomy"
      title="Anatomy"
      setup={`${parts.length} layers make the cap. Each comes from the recipe, in this colorway.`}
      controls={<Toggle label="View" value={pinned ? 'apart' : 'together'} onChange={(v) => setPinned(v === 'apart')} options={[{ value: 'together', label: 'Assembled' }, { value: 'apart', label: 'Apart' }]} />}
      caption="Hover or focus the cap to peel its layers apart. Switch the colorway at the top of the page and the layers change with it."
    >
      <div
        tabIndex={0}
        aria-label="Button layers"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="relative grid h-[260px] w-full max-w-[560px] place-items-center outline-none"
      >
        {parts.map((p, i) => {
          const y = open ? (i - (parts.length - 1) / 2) * 40 : 0;
          return (
            <div key={p.name} className="absolute flex items-center gap-16" style={{ transform: `translateY(${y}px)`, transition: 'transform var(--mu-spring-settle-d) var(--mu-spring-settle)', zIndex: i === 0 ? 0 : 1 }}>
              <span className="type-label engraved w-[128px] shrink-0 text-right" style={{ opacity: open ? 1 : 0, transition: 'opacity var(--mu-r-button-self-fade)' }}>{p.name}</span>
              <span className="grid h-32 w-[112px] shrink-0 place-items-center rounded-pill" style={p.style}>
                {i === 0 && <span className="type-ui text-ink">Cancel</span>}
              </span>
              <span className="type-readout w-[240px] shrink-0 truncate text-ink3" style={{ opacity: open ? 1 : 0, transition: 'opacity var(--mu-r-button-self-fade)' }}>{i === 0 ? '--mu-btn-bg' : shadows[i - 1].value}</span>
            </div>
          );
        })}
      </div>
    </Beat>
  );
}

/* ───────────────────────── 3 · the press is physics ───────────────────────── */

function springCurve(k: number, c: number, ms = 400, step = 4) {
  // Step response of a unit mass: x'' = −k(x − 1) − c·x'
  let x = 0, v = 0;
  const pts: [number, number][] = [];
  const dt = step / 1000;
  for (let t = 0; t <= ms; t += step) {
    pts.push([t, x]);
    for (let s = 0; s < 8; s++) { const a = -k * (x - 1) - c * v; v += a * (dt / 8); x += v * (dt / 8); }
  }
  return pts;
}

function PressIsPhysics() {
  const [slow, setSlow] = React.useState(false);
  const naive = React.useRef<HTMLButtonElement>(null);
  const dot = React.useRef<SVGCircleElement>(null);
  const curve = React.useMemo(() => springCurve(SPRING.stiffness, SPRING.damping), []);
  const W = 280, H = 90, T = 400;
  const path = curve.map(([t, x], i) => `${i ? 'L' : 'M'}${((t / T) * W).toFixed(1)} ${(H - 10 - x * (H - 20)).toFixed(1)}`).join('');
  const trace = () => {
    const el = dot.current;
    if (!el) return;
    const start = performance.now();
    const len = T * (slow ? 4 : 1);
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / len);
      const [t, x] = curve[Math.min(curve.length - 1, Math.round(p * (curve.length - 1)))];
      el.setAttribute('cx', String((t / T) * W));
      el.setAttribute('cy', String(H - 10 - x * (H - 20)));
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
      controls={<SlowSwitch slow={slow} onChange={setSlow} />}
      caption="Click each one rapidly. The spring picks up from wherever the cap is; the keyframe starts over on every click."
      cost="a spring is a curve you sample from stiffness and damping, not a duration you type. It lives in one token."
    >
      <style>{`.naive-press{animation:naive-press 200ms ease}@keyframes naive-press{0%{transform:none}40%{transform:translateY(1px)}100%{transform:none}}.naive-cap:active{transform:none!important}`}</style>
      <div className="grid w-full grid-cols-1 items-center gap-24 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-16">
          <div className="flex items-center gap-16">
            <div className="flex flex-col items-center gap-8">
              <Button onPointerUp={trace}>Spring</Button>
              <span className="type-label engraved">release spring</span>
            </div>
            <div className="flex flex-col items-center gap-8">
              <Button ref={naive as never} className="naive-cap" onPointerDown={naivePress}>Keyframe</Button>
              <span className="type-label engraved">200ms ease</span>
            </div>
          </div>
        </div>
        <figure className="flex flex-col gap-6" aria-label="Release curve">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[320px]" aria-hidden>
            <path d={`M0 ${H - 10}H${W}`} stroke="var(--mu-rule)" fill="none" />
            <path d={`M0 10H${W}`} stroke="var(--mu-rule)" fill="none" strokeDasharray="2 3" />
            <path d={path} stroke="var(--mu-ink2)" strokeWidth="1.5" fill="none" />
            <circle ref={dot} cx="0" cy={H - 10} r="4" fill="var(--mu-green-deep)" />
          </svg>
          <span className="type-readout text-ink3">k {SPRING.stiffness} · c {SPRING.damping} · half {SPRING.half} · near {SPRING.near}</span>
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
  return (
    <Beat
      id="label-turns"
      title="A changing label turns"
      setup="Copy becoming Copied is one step on a drum, and the cap's width follows on a spring."
      slow={slow}
      controls={<SlowSwitch slow={slow} onChange={setSlow} />}
      caption="Press both. Watch the width: ours settles into the new word; the swapped one jumps and the text blinks."
      cost="one wrapper, SwapText, around any label that can change."
    >
      <div className="flex items-center gap-24">
        <div className="flex flex-col items-center gap-8">
          <Button onClick={() => flip(setA)}><Icon name={a ? 'check' : 'duplicate'} size={14} /><SwapText value={a ? 'Copied' : 'Copy'} /></Button>
          <span className="type-label engraved">SwapText</span>
        </div>
        <div className="flex flex-col items-center gap-8">
          <Button onClick={() => flip(setB)}><Icon name={b ? 'check' : 'duplicate'} size={14} />{b ? 'Copied' : 'Copy'}</Button>
          <span className="type-label engraved">replaced</span>
        </div>
      </div>
    </Beat>
  );
}

/* ───────────────────────── 5 · one signal cap ───────────────────────── */

function OneSignalCap() {
  const footers: { name: string; caps: [ButtonCap, string][] }[] = [
    { name: 'three signals', caps: [['primary', 'Cancel'], ['destructive', 'Discard'], ['primary', 'Save']] },
    { name: 'no signal', caps: [['standard', 'Cancel'], ['standard', 'Discard'], ['standard', 'Save']] },
    { name: 'one signal', caps: [['standard', 'Cancel'], ['standard', 'Discard'], ['primary', 'Save']] },
  ];
  return (
    <Beat
      id="one-signal-cap"
      title="One signal cap"
      setup="A footer with three loud buttons has no loud button. The dark cap only means something when it's alone."
      caption="Count the dark caps in each footer, then find where your eye lands first."
    >
      <div className="flex w-full flex-col gap-16">
        {footers.map((f) => (
          <div key={f.name} className="flex items-center justify-between gap-16">
            <span className="type-label engraved w-[104px]">{f.name}</span>
            <div className="flex gap-8">{f.caps.map(([cap, label]) => <Button key={label} cap={cap}>{label}</Button>)}</div>
          </div>
        ))}
      </div>
    </Beat>
  );
}

/* ───────────────────────── 6 · one line, always ───────────────────────── */

function OneLine() {
  const [w, setW] = React.useState(360);
  return (
    <Beat
      id="one-line"
      title="One line, always"
      setup="A pill that wraps stops being a pill. The label keeps to one line; if it doesn't fit, the label is too long."
      controls={<label className="type-meta flex items-center gap-10 text-ink2">Width <input type="range" min={140} max={420} value={w} onChange={(e) => setW(+e.target.value)} aria-label="Container width" /> <span className="type-readout w-[48px] text-ink">{w}pt</span></label>}
      caption="Drag the width down. The wrapping button turns into a lozenge; ours holds its shape and tells you to shorten the label."
    >
      <div className="flex w-full flex-col gap-20">
        <div className="flex items-center gap-16">
          <span className="type-label engraved w-[88px]">wraps</span>
          <div style={{ width: w }} className="border-l border-dashed border-[var(--mu-rule)] pl-8"><Button style={{ whiteSpace: 'normal', height: 'auto', minHeight: 32, paddingBlock: 6, textAlign: 'center' }}>Export all canvases as PDF</Button></div>
        </div>
        <div className="flex items-center gap-16">
          <span className="type-label engraved w-[88px]">ours</span>
          <div style={{ width: w }} className="border-l border-dashed border-[var(--mu-rule)] pl-8"><Button>Export all canvases as PDF</Button></div>
        </div>
      </div>
    </Beat>
  );
}

/* ───────────────────────── reference ───────────────────────── */

function States() {
  return (
    <Section id="states" title="States" lede="Each cap at rest, hover, focus, pressed and disabled. Pressed and focus are held here so you can study them.">
      <Bench tone="page" caption="standard · primary · destructive">
        <div className="grid grid-cols-[88px_repeat(5,auto)] items-center gap-x-20 gap-y-16">
          <span />
          {['Rest', 'Hover', 'Focus', 'Pressed', 'Disabled'].map((s) => <span key={s} className="type-label engraved text-center">{s}</span>)}
          {CAPS.map((cap) => (
            <React.Fragment key={cap}>
              <span className="type-label engraved">{cap}</span>
              <Button cap={cap}>Cancel</Button>
              <Button cap={cap} tabIndex={-1} style={cap === 'standard' ? { color: 'var(--mu-ink)' } : undefined}>Cancel</Button>
              <Button cap={cap} tabIndex={-1} style={{ outline: 'var(--mu-r-button-self-focus-width) solid var(--mu-focus)', outlineOffset: 'var(--mu-r-button-self-focus-offset)' }}>Cancel</Button>
              <Button cap={cap} tabIndex={-1} style={{ ...PRESSED[cap], transform: 'translateY(var(--mu-r-button-self-travel))' }}>Cancel</Button>
              <Button cap={cap} disabled>Cancel</Button>
            </React.Fragment>
          ))}
        </div>
      </Bench>
    </Section>
  );
}

function Variants() {
  return (
    <Section id="variants" title="Variants" lede="Compact is the canvas pill: 26 tall, raised lightly, quiet ink until hover. The link, graphite and strip caps set their own size for the surfaces they live on.">
      <Bench tone="page" caption="compact · with a glyph · with a key · primary · disabled">
        <div className="flex flex-wrap items-center gap-12">
          <Button size="compact">seed a sample day</Button>
          <Button size="compact"><Icon name="share" size={14} />Share</Button>
          <Button size="compact">lenses <Kbd size="small">⌘K</Kbd></Button>
          <Button size="compact" cap="primary">Keep</Button>
          <Button size="compact" disabled>Share</Button>
        </div>
      </Bench>
      <Bench caption="link · graphite · strip · strip-danger, each on its own surface" style={{ background: 'var(--mu-graphite-bg, var(--mu-ink))' }}>
        <div className="flex flex-wrap items-center gap-16">
          <Button cap="link">READ ALL</Button>
          <Button cap="graphite">Back to now</Button>
          <Button cap="strip">Summarise</Button>
          <Button cap="strip-danger">Send away</Button>
        </div>
      </Bench>
      <SwiftCapture name="button" maxWidth={360} />
    </Section>
  );
}

function Colorways() {
  const row = (
    <div className="flex flex-wrap items-center gap-10">
      {CAPS.map((c) => <Button key={c} cap={c}>{c === 'destructive' ? 'Discard' : c === 'primary' ? 'Save' : 'Cancel'}</Button>)}
      <Button size="compact">compact</Button>
    </div>
  );
  return (
    <Section id="colorways" title="Colorways" lede="The same recipe in Bone and Graphite. Graphite is not an inverted Bone: its light is dimmer and its shadows are deeper.">
      <div className="grid gap-16 md:grid-cols-2">
        {(['bone', 'graphite'] as const).map((cw) => (
          <div key={cw} data-mu-colorway={cw} className="flex flex-col gap-10 rounded-card p-24" style={{ background: cw === 'graphite' ? 'var(--mu-page-dark)' : 'var(--mu-page)' }}>
            <span className="type-label engraved">{cw}</span>
            {row}
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
    <Section id="keyboard" title="Keyboard" lede="Focus the button and use your own keyboard. The keys light as you press them.">
      <div className="grid gap-16 md:grid-cols-[1fr_1fr]">
        <Bench caption={`Activated ${count} ${count === 1 ? 'time' : 'times'}`}>
          <div className="flex flex-col items-center gap-20" onKeyDown={(e) => onKey(e, true)} onKeyUp={(e) => onKey(e, false)}>
            <Button onClick={() => setCount((n) => n + 1)}>Focus me</Button>
            <div className="flex gap-8" aria-hidden>
              {['Tab', 'Enter', 'Space'].map((k) => (
                <span key={k} style={down === k ? { transform: 'translateY(var(--mu-r-button-self-travel))', filter: 'brightness(.94)' } : undefined}><Kbd>{k === 'Enter' ? '⏎ Enter' : k === 'Space' ? '␣ Space' : '⇥ Tab'}</Kbd></span>
              ))}
            </div>
          </div>
        </Bench>
        <TokenTable
          head={['Key', 'Effect']}
          mono={[0]}
          rows={[
            ['Tab', 'Moves focus to the button. The focus ring shows only for keyboard focus (2 pt at a 2 pt offset).'],
            ['Enter', 'Activates on key down.'],
            ['Space', 'Activates on key up, like a native button.'],
            ['role', 'button. Its name is the label; an icon-only button needs aria-label.'],
            ['type="submit"', 'Submits its form.'],
          ]}
        />
      </div>
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
          ['render', 'Base UI render prop', '—', 'Render as a link or custom element; set nativeButton={false}.'],
        ]}
      />
      <p className="type-meta text-ink3">Swift: <code className="type-readout">MetalButton(_ title:, cap:, size:, action:)</code>. No slots: the children are the label and an optional leading icon.</p>
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
          ['--mu-spring-release', `k ${SPRING.stiffness} · c ${SPRING.damping}`, 'the way back up'],
        ]}
      />
    </Section>
  );
}
