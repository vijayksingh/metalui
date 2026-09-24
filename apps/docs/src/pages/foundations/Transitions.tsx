import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, SlidingIndicator, SwapIcon, SwapText } from '@unlocalhosted/metalui';
import { CheckIcon, NoteIcon, OfflineIcon, SyncErrorIcon, SyncedIcon } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';

/* ─────────────────────────────────────────────────────────
 * TRANSITIONS GUIDE
 *
 * Live recipes (replay any of them; slow motion in the dial panel):
 *   T1  text swap        SwapText       overlap: out 150 in-out, in 250 out
 *   T2  icon swap        SwapIcon       through scale 0.25 + blur 2, 250
 *   T3  footprint        SwapText       width on the morph spring
 *   T5  sliding select   SlidingIndicator  ui spring (short) / morph (long)
 * Slow motion multiplies every duration and spring on this page only.
 * ───────────────────────────────────────────────────────── */

const M = tokens.motion;
const ms = (v: string) => parseFloat(v);

const LABELS = [
  { key: 'save', label: 'Save', icon: <NoteIcon size={14} /> },
  { key: 'saving', label: 'Saving to Today…', icon: <SyncedIcon size={14} /> },
  { key: 'saved', label: 'Saved', icon: <CheckIcon size={14} /> },
];
const STATUS = [
  { key: 'synced', label: 'Synced', icon: <SyncedIcon size={16} /> },
  { key: 'offline', label: 'Offline', icon: <OfflineIcon size={16} /> },
  { key: 'error', label: 'Sync error', icon: <SyncErrorIcon size={16} /> },
];
const LAYOUTS = ['Free', 'Timeline', 'Grouped'];

/** A 28-tall segmented track, a pill of pills (text-first padding h/2 − 1). */
function Segmented({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Layout" className="material-well relative inline-flex rounded-pill p-3">
      <SlidingIndicator className="material-thumb rounded-pill" />
      {LAYOUTS.map((l, i) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={['type-ui relative z-10 h-28 min-w-[88px] cursor-pointer rounded-pill px-13 transition-colors duration-150', value === i ? 'text-ink' : 'text-ink2 hover:text-ink'].join(' ')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

const RECIPES: React.ReactNode[][] = [
  ['T1 · Text swap', 'A label or short text changes in place', 'Overlapping crossfade. Out: quick 150, in-out, 4 up, blur 2. In: fast 250, out, from 4 below, blur 2. Never a blank frame.', 'SwapText'],
  ['T2 · Icon swap', 'Two icons share a slot', 'Both at once: out shrinks to 0.25, in grows from 0.25, blur 2, fast 250, in-out.', 'SwapIcon'],
  ['T3 · Footprint', 'A control grows or shrinks to new content', 'Morph spring (k380 c36, no overshoot). Growing: the surface moves first. Shrinking: waits micro 80 so the old content has left.', 'SwapText'],
  ['T4 · Number change', 'A count or value updates', 'Digits roll 4 in the direction of change with blur 2, fast 250; tabular figures so nothing shifts.', 'Pattern'],
  ['T5 · Selection glide', 'One of a set becomes selected', 'The thumb glides to the new item. Short hops: ui spring. Long travel (lists, navigation): morph spring. Never animate on first paint.', 'SlidingIndicator'],
  ['T6 · Open from trigger', 'Menu, popover, select, tooltip', 'Scale from 0.97 (tooltip 0.98) + opacity, origin at the trigger (Base UI --transform-origin). In fast 250, out quick 150 to 0.99.', 'Pattern'],
  ['T7 · Modal', 'A dialog over the page', 'Scale from 0.96 + opacity, centered origin. In fast 250, out quick 150. Backdrop fades on the same clock.', 'Pattern'],
  ['T8 · Panel', 'A drawer or panel slides into a region', 'Travel from its edge, in slow 400 on ease-out, out medium 350. The content is already in place; nothing trickles in after.', 'Pattern'],
  ['T9 · Content swap', 'A panel changes view (tabs, steps)', 'Overlapping crossfade with 8 of travel toward the new view and blur 3; the container height springs on morph.', 'Pattern'],
  ['T10 · Enter and leave', 'Toasts, badges, rows appearing', 'Rise 8 from below with opacity and blur 2 in fast 250; leave in quick 150 the same way they came. Never from scale 0.', 'Pattern'],
  ['T11 · Press', 'Any cap is pressed', 'Down 1 point in 50ms linear, the shadow collapses; release on the press spring. Kept under reduced motion.', 'Button'],
  ['T12 · Refusal', 'Invalid input, wrong code', 'Horizontal shake: 6 px segments, micro 80 each, 3 cycles. Once; never on a loop.', 'Pattern'],
];

export default function Transitions() {
  const [labelAt, setLabelAt] = React.useState(0);
  const [statusAt, setStatusAt] = React.useState(0);
  const [layout, setLayout] = React.useState(0);
  const d = useDialKit(
    'Transitions',
    {
      slowMotion: [1, 1, 8, 0.5],
      replay: { type: 'action', label: 'Step every demo' },
      swap: {
        _collapsed: true,
        out: [150, 40, 400, 10],
        in: [250, 60, 600, 10],
        travel: [4, 0, 16, 1],
        blur: [2, 0, 8, 0.5],
        iconScale: [0.25, 0, 1, 0.05],
      },
    },
    {
      onAction: (a) => {
        if (a !== 'replay') return;
        setLabelAt((i) => (i + 1) % LABELS.length);
        setStatusAt((i) => (i + 1) % STATUS.length);
        setLayout((i) => (i + 1) % LAYOUTS.length);
      },
    },
  );

  // Slow motion scales every clock on this page; the swap dials tune the recipe itself.
  const k = d.slowMotion;
  const vars = {
    '--mu-swap-out': `${d.swap.out * k}ms`,
    '--mu-swap-in': `${d.swap.in * k}ms`,
    '--mu-swap-icon': `${ms(M.duration.fast.value) * k}ms`,
    '--mu-swap-shrink-delay': `${ms(M.duration.micro.value) * k}ms`,
    '--mu-swap-travel': `${d.swap.travel}px`,
    '--mu-swap-blur': `${d.swap.blur}px`,
    '--mu-swap-icon-scale': d.swap.iconScale,
    '--mu-spring-morph-d': `${tokens.springs.morph.duration * k}s`,
    '--mu-spring-ui-d': `${tokens.springs.ui.duration * k}s`,
  } as React.CSSProperties;

  const label = LABELS[labelAt];
  const status = STATUS[statusAt];

  return (
    <div style={vars}>
      <PageHeader
        title="Transitions"
        lede="How things change state. Every change is continuous: a control keeps its identity while its content, size or selection moves to the new state. The recipes below are the only ways MetalUI moves between states, and every value comes from one motion scale."
      />

      <Section title="Before anything moves" lede="Answer these in order. Most motion decisions are made here, before a duration is chosen.">
        <Rules
          rules={[
            { id: 'Q1', title: 'How often is it seen?', body: 'A hundred times a day (keyboard shortcuts, list arrowing, the command palette toggle): no animation. Tens of times (hover, selection): short and quiet. Occasionally (menus, dialogs, toasts): the standard recipes. Rarely (first run, success): room for delight.' },
            { id: 'Q2', title: 'What does it explain?', body: 'Where something came from, that input was heard, what changed, or that nothing jumped. If the answer is “it looks nice”, it does not move.' },
            { id: 'Q3', title: 'What is the physics?', body: 'Entering: ease-out. Already on screen and moving: ease-in-out. Objects, thumbs and footprints: springs. Constant motion only: linear. Never ease-in.' },
            { id: 'Q4', title: 'What remains under reduced motion?', body: 'Meaning stays, movement goes: crossfades and color changes remain, travel, scale, blur and overshoot are removed. Press travel stays, because it is feedback.' },
          ]}
        />
      </Section>

      <Section title="T1–T3 · Text, icon and footprint" lede="The label crossfades with a small drift and blur, so the two states read as one change; the icon crosses through a small scale; the button's width springs to the new label. Press the button, or step every demo from the dial panel. Turn up slow motion to see the overlap.">
        <Bench caption={`out ${Math.round(d.swap.out * k)}ms · in ${Math.round(d.swap.in * k)}ms · travel ${d.swap.travel} · blur ${d.swap.blur} · morph ${(tokens.springs.morph.duration * k).toFixed(2)}s`}>
          <div className="flex flex-wrap items-center justify-center gap-24">
            <Button cap="primary" onClick={() => setLabelAt((i) => (i + 1) % LABELS.length)}>
              <SwapIcon swapKey={label.key}>{label.icon}</SwapIcon>
              <span aria-live="polite"><SwapText value={label.label} /></span>
            </Button>
            <button
              type="button"
              onClick={() => setStatusAt((i) => (i + 1) % STATUS.length)}
              className="material-cap inline-flex h-32 cursor-pointer items-center gap-6 rounded-pill pl-9 pr-15 text-ink"
            >
              <SwapIcon swapKey={status.key}>{status.icon}</SwapIcon>
              <span className="type-label"><SwapText value={status.label} /></span>
            </button>
          </div>
        </Bench>
      </Section>

      <Section title="T5 · Selection glide" lede="The selection is an object that travels; it never teleports. Short hops use the ui spring and its slight overshoot, as on the object sheet. Long travel, such as this site's navigation, uses the morph spring so it never wobbles.">
        <Bench caption={`Segmented · ui spring · ${(tokens.springs.ui.duration * k).toFixed(2)}s`}>
          <Segmented value={layout} onChange={setLayout} />
        </Bench>
      </Section>

      <Section title="Recipes" lede="Every state change in MetalUI uses one of these. Built recipes ship as primitives; patterns are applied by each component as it is built.">
        <TokenTable head={['Recipe', 'When', 'Motion', 'Ships as']} rows={RECIPES} mono={[0]} />
      </Section>

      <Section title="The motion scale" lede="Pick a value by what the motion is doing, not by the number. A 300ms modal close is still quick (150).">
        <TokenTable
          head={['Duration', 'Value', 'Used for']}
          rows={Object.entries(M.duration).map(([name, t]) => [`--mu-duration-${name}`, t.value, t.use])}
        />
        <TokenTable
          head={['Ease', 'Value', 'Used for']}
          rows={Object.entries(M.ease).map(([name, t]) => [`--mu-ease-${name}`, t.value, t.use])}
        />
        <TokenTable
          head={['Distance · scale · blur', 'Value', 'Used for']}
          rows={[
            ...Object.entries(M.distance).map(([name, t]) => [`--mu-distance-${name}`, t.value, t.use]),
            ...Object.entries(M.scale).map(([name, t]) => [`--mu-scale-${name}`, t.value, t.use]),
            ...Object.entries(M.blur).map(([name, t]) => [`--mu-blur-${name}`, t.value, t.use]),
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'R1', title: 'Nothing snaps', body: 'A label, size, icon or selection never changes in one frame. If it changes, it uses a recipe.' },
            { id: 'R2', title: 'Overlap, never a gap', body: 'The outgoing and incoming states cross; the slot is never empty. A light blur (2) blends the two into one perceived change.' },
            { id: 'R3', title: 'Leaving is quicker and quieter than arriving', body: 'Exits run quick (150) on ease-in-out; entries run fast (250) on ease-out. The user has already moved on.' },
            { id: 'R4', title: 'Surfaces make room before content arrives', body: 'When something grows, the surface moves first. When it shrinks, the content leaves first. Words never spill outside their surface.' },
            { id: 'R5', title: 'Nothing appears from nothing', body: 'Surfaces enter from 0.96–0.98 scale, not 0. The icon swap is the one exception: from 0.25, always with blur, inside a fixed slot.' },
            { id: 'R6', title: 'Origin is where it came from', body: 'Menus and popovers grow from their trigger; modals from the center. A thing leaves the way it came.' },
            { id: 'R7', title: 'Interruptible by construction', body: 'State changes use transitions and springs, which start from where the object is. Keyframes are for one-shot gestures only, like an icon’s press.' },
            { id: 'R8', title: 'Composite first', body: 'Animate transform, opacity and filter. The one exception is a small control’s footprint, which springs its width because scaling would distort its material.' },
            { id: 'R9', title: 'One entrance per container', body: 'A panel arrives with its content already in place. No trickling children after the surface lands.' },
            { id: 'R10', title: 'Bounce shrinks as distance grows', body: 'Small, short moves may overshoot a little (ui spring); long travel and resizing do not (morph spring).' },
          ]}
        />
      </Section>
    </div>
  );
}
