import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Slider, Surface, type SliderSize } from '@unlocalhosted/metalui';
import { ZoomInIcon, ZoomOutIcon, VolumeIcon, BrightnessIcon } from '@unlocalhosted/metalui/icons';
import { SliderXray } from '../../ui/xray/SliderXray';
import { SPRING_NAMES, springVars, clampSpringCurve } from '../../ui/springTuning';
import type { SpringName } from '../../../../../packages/metalui/src/motion/springs.generated';
import reactSource from '../../../../../packages/metalui/src/components/slider/slider.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSlider.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/slider/slider.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* ─────────────────────────────────────────────────────────
 * SLIDER PAGE · real sliders on a plain plate (never on the dotted stage, so labels stay clear)
 *
 *   playground   a zoom slider: glyphs at the ends, the value beside it on the drum
 *   sizes        compact, regular and large: groove and knob together
 *   scale        notches at every step and labelled ticks, all on the knob's travel
 *   width        full width of its container by default, or a set width
 *   states       hover lifts the knob, pressing presses it, a key past an end is refused; disabled
 *   tune         a DialKit panel: size, width, glyphs, value, scale and the jump's spring
 * ───────────────────────────────────────────────────────── */

const PLATE = 'box-border flex w-full flex-col gap-20 px-28 py-24';
const plate = (width: number): React.CSSProperties => ({ width, maxWidth: '100%' });
const ROW = 'grid grid-cols-[72px_1fr] items-center gap-16 max-[520px]:grid-cols-1 max-[520px]:gap-8';
const NAME = 'type-meta text-ink2';
/** A row whose slider has ticks under it: the name lines up with the groove, not the ticks. */
const ROW_TOP = `${ROW} items-start`;
const NAME_TOP = `${NAME} flex h-[22px] items-center`;

const percent = (v: number) => `${v}%`;

/** Zoom, as a canvas would offer it: a quarter to double, in fives. */
function Zoom({ size, width }: { size?: SliderSize; width?: number | string }) {
  const [zoom, setZoom] = React.useState(100);
  return (
    <Slider
      aria-label="Zoom"
      value={zoom}
      min={25}
      max={200}
      step={5}
      largeStep={25}
      onValueChange={setZoom}
      size={size}
      width={width}
      startIcon={<ZoomOutIcon />}
      endIcon={<ZoomInIcon />}
      showValue
      format={percent}
    />
  );
}

function Sizes() {
  const [v, setV] = React.useState({ compact: 30, regular: 50, large: 70 });
  return (
    <Surface material="raise" radius="card" className={PLATE} style={plate(520)}>
      {(['compact', 'regular', 'large'] as const).map((size) => (
        <div key={size} className={ROW}>
          <span className={NAME}>{size}</span>
          <Slider aria-label={`Brightness, ${size}`} size={size} value={v[size]} min={0} max={100} onValueChange={(n) => setV((o) => ({ ...o, [size]: n }))} startIcon={<BrightnessIcon />} endIcon={<BrightnessIcon />} showValue format={percent} />
        </div>
      ))}
    </Surface>
  );
}

const QUALITY = ['Draft', 'Low', 'Fair', 'Good', 'High', 'Best'];

function Scale() {
  const [q, setQ] = React.useState(3);
  const [t, setT] = React.useState(20);
  return (
    <Surface material="raise" radius="card" className={PLATE} style={plate(520)}>
      <div className={ROW_TOP}>
        <span className={NAME_TOP}>Quality</span>
        <Slider aria-label="Export quality" value={q} min={0} max={5} step={1} largeStep={1} onValueChange={setQ} marks={[1, 2, 3, 4]} ticks={[0, 5].map((n) => ({ value: n, label: QUALITY[n] }))} format={(n) => QUALITY[n]} detents valueBubble showValue />
      </div>
      <div className={ROW_TOP}>
        <span className={NAME_TOP}>Warmth</span>
        <Slider aria-label="Warmth" value={t} min={0} max={40} step={1} largeStep={5} onValueChange={setT} ticks={[0, 10, 20, 30, 40].map((n) => ({ value: n, label: `${n}°` }))} format={(n) => `${n}°`} />
      </div>
    </Surface>
  );
}

function Widths() {
  const [a, setA] = React.useState(60);
  const [b, setB] = React.useState(60);
  return (
    <Surface material="raise" radius="card" className={PLATE} style={plate(520)}>
      <div className={ROW}>
        <span className={NAME}>full</span>
        <Slider aria-label="Volume, full width" value={a} min={0} max={100} onValueChange={setA} startIcon={<VolumeIcon />} endIcon={<VolumeIcon />} />
      </div>
      <div className={ROW}>
        <span className={NAME}>width 200</span>
        <Slider aria-label="Volume, 200 wide" width={200} value={b} min={0} max={100} onValueChange={setB} startIcon={<VolumeIcon />} endIcon={<VolumeIcon />} />
      </div>
    </Surface>
  );
}

function Kinds() {
  const [range, setRange] = React.useState<readonly number[]>([25, 75]);
  const [balance, setBalance] = React.useState(0);
  return <Surface material="raise" radius="card" className={PLATE} style={plate(520)} data-testid="slider-kinds">
    <div className={ROW}><span className={NAME}>Range</span><Slider value={range} onValueChange={setRange} aria-label="Exposure" thumbs={[{ label: 'Exposure, lower' }, { label: 'Exposure, upper' }]} step={5} largeStep={25} minStepsBetweenValues={2} showValue valueBubble format={percent} /></div>
    <div className={ROW}><span className={NAME}>Uncontrolled</span><Slider defaultValue={[20, 80]} aria-label="Uncontrolled range" showValue format={percent} /></div>
    <div className={ROW}><span className={NAME}>Fixed lower</span><Slider defaultValue={[30, 70]} aria-label="Fixed range" thumbs={[{ label: 'Fixed lower', disabled: true }, { label: 'Movable upper' }]} minStepsBetweenValues={5} showValue format={percent} /></div>
    <div className={ROW}><span className={NAME}>Balance</span><Slider value={balance} onValueChange={setBalance} min={-100} max={100} aria-label="Balance" centered tone="neutral" knobIcon={<VolumeIcon />} showValue valueBubble format={n => n === 0 ? 'Centre' : `${Math.abs(n)}${n < 0 ? ' L' : ' R'}`} /></div>
    <div className={ROW}><span className={NAME}>Right to left</span><Slider dir="rtl" defaultValue={50} aria-label="RTL amount" tone="neutral" showValue ticks={[0, 50, 100].map(value => ({ value, label: value }))} /></div>
    <div className={ROW}><span className={NAME}>Vertical</span><Slider defaultValue={40} orientation="vertical" height={240} width={72} aria-label="Vertical level" startIcon={<VolumeIcon />} endIcon={<VolumeIcon />} showValue valueBubble ticks={[0, 50, 100].map(value => ({ value, label: `${value}%` }))} format={percent} /></div>
  </Surface>;
}

function States() {
  const [a, setA] = React.useState(100);
  return (
    <Surface material="raise" radius="card" className={PLATE} style={plate(520)}>
      <div className={ROW}>
        <span className={NAME}>at the end</span>
        <Slider aria-label="Volume, at the end" value={a} min={0} max={100} onValueChange={setA} showValue format={percent} />
      </div>
      <div className={ROW}>
        <span className={NAME}>disabled</span>
        <Slider aria-label="Volume, disabled" disabled value={35} min={0} max={100} onValueChange={() => undefined} showValue format={percent} />
      </div>
    </Surface>
  );
}

/** The DialKit panel: every choice the slider really has, and the jump's spring. */
function Tuner() {
  const d = useDialKit('Slider', {
    size: { type: 'select', options: ['compact', 'regular', 'large'], default: 'regular' },
    width: [360, 160, 640],
    icons: true,
    value: true,
    marks: false,
    ticks: true,
    range: false,
    orientation: { type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' },
    neutral: false,
    centered: false,
    bubble: false,
    detents: false,
    knobGlyph: false,
    jump: { type: 'select', options: SPRING_NAMES, default: 'part' },
    slow: [1, 1, 10],
  });
  const [v, setV] = React.useState<readonly number[]>([20, 40]);
  const host = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (host.current) host.current.style.setProperty('--mu-spring-part-clamped', clampSpringCurve(getComputedStyle(host.current).getPropertyValue('--mu-spring-part')));
  }, [d.jump]);
  return (
    <div ref={host} data-testid="slider-tuner" style={springVars('part', d.jump as SpringName, d.slow) as React.CSSProperties}>
      <Surface material="raise" radius="card" className={PLATE} style={plate(d.width + 56)}>
        <Slider
          aria-label="Tuned"
          value={d.range ? v : v[1]}
          min={0}
          max={100}
          largeStep={10}
          onValueChange={next => setV(Array.isArray(next) ? next : [v[0], next as number])}
          orientation={d.orientation as 'horizontal' | 'vertical'}
          height={d.orientation === 'vertical' ? 240 : undefined}
          width={d.orientation === 'vertical' ? 72 : undefined}
          tone={d.neutral ? 'neutral' : 'green'}
          centered={d.centered}
          valueBubble={d.bubble}
          detents={d.detents}
          knobIcon={d.knobGlyph ? <BrightnessIcon /> : undefined}
          size={d.size as SliderSize}
          startIcon={d.icons ? <ZoomOutIcon /> : undefined}
          endIcon={d.icons ? <ZoomInIcon /> : undefined}
          showValue={d.value}
          format={percent}
          marks={d.marks ? [10, 20, 30, 40, 50, 60, 70, 80, 90] : undefined}
          ticks={d.ticks ? [0, 25, 50, 75, 100].map((n) => ({ value: n, label: n })) : undefined}
        />
      </Surface>
    </div>
  );
}

export default function SliderPage() {
  return (
    <ComponentPage
      title="Slider"
      lede="A metal knob in a long groove, with a green fill up to the knob. Click the groove and the knob jumps there on a spring; drag it and it follows your finger. The knob never leaves the groove."
      play={{ lede: "Click anywhere on the groove, drag the knob, or use the arrow keys (Shift for bigger steps). At either end its glyph plays.", node: (
        <Surface material="raise" radius="card" className={PLATE} style={plate(460)}>
          <Zoom />
        </Surface>
      ) }}
      more={[
        { id: 'sizes', title: 'Sizes', lede: 'Compact, regular and large set the groove and the knob together. Regular is the default.', node: <Sizes /> },
        { id: 'scale', title: 'Marks and ticks', lede: 'Marks are notches in the groove at steps or events; ticks carry a label. Both sit on the knob\'s travel, so the knob lands exactly on them.', node: <Scale /> },
        { id: 'kinds', title: 'Ranges, balance and vertical travel', lede: 'Each range knob has its own name and bound; minStepsBetweenValues keeps them apart. A centred fill grows from the middle. A vertical host gives the same travel a height. Detents catch once per accepted value; the value bubble appears while dragging or using keys.', node: <Kinds /> },
        { id: 'states', title: 'States', lede: 'Point at the groove and the knob lifts; press or drag and it presses down. Focus the top slider and push → past the end: it will not go, and says so with a small nudge. A disabled slider dims and takes no pointer or keys.', node: <States /> },
        { id: 'width', title: 'Width', lede: 'A slider fills its container. Give it a width when it sits beside other controls.', node: <Widths /> },
        { id: 'tune', title: 'Tune it', lede: 'The Slider panel steps through its sizes and parts, sets the width, and swaps the spring a jump rides (drag never springs).', node: <Tuner /> },
      ]}
      xray={<SliderXray />}
      capture="slider"
      usage={`const [zoom, setZoom] = React.useState(100);

<Slider
  aria-label="Zoom"
  value={zoom} min={25} max={200} step={5}
  onValueChange={setZoom}
  startIcon={<ZoomOutIcon />} endIcon={<ZoomInIcon />}
  showValue format={(v) => \`\${v}%\`}
/>`}
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'swift', label: "SwiftUI", code: swiftSource },
        { id: 'agent', label: "Agent guide", code: agentSource },
      ]}
      rules={[
        { id: "SL1", title: "A jump springs, a drag does not", body: "When you drag, your hand is already moving the knob, so a spring would only lag behind it.", origin: 'Ours' },
        { id: "SL2", title: "Marks mean something", body: "A notch in the groove is a step or an event, and a tick has a label. Never scatter them for texture: the knob is what you look at.", origin: 'Ours' },
        { id: "SL3", title: "Say the value in words", body: "Give the knob a value text a person would say, like a date and a time, or a format like 40%.", origin: 'Ours' },
        { id: "SL4", title: "Labels you can read", body: "Tick labels are plain small type at ink2 on a plain surface, never engraved type on a busy backdrop.", origin: 'Ours' },
        { id: "SL5", title: "The groove holds the knob", body: "The knob travels inside the groove. Its part spring clips progress at the physical stops, preserving the authored timing. Native geometry clamps every interpolated frame too.", origin: 'Ours' },
      ]}
    />
  );
}
