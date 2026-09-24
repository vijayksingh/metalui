import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, SlidingIndicator, SwapText } from '@unlocalhosted/metalui';
import { MorphIcon, type MorphIconName } from '@unlocalhosted/metalui/icons';
import { tokens } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, TokenTable } from '../../ui/doc';

/* ─────────────────────────────────────────────────────────
 * TRANSITIONS: how Soft Hardware changes state
 *
 * Live recipes (slow motion in the dial panel scales every spring on this page):
 *   T1  the drum        SwapText + SwapIcon   face turns one step (4), focus 2; both faces
 *                                            ride settle from the same frame: they sum to 1
 *   T2  footprint       SwapText              width on settle; grows first, shrinks after settle-half
 *   T3  selection glide SlidingIndicator      part spring in a track, settle when free
 * Other recipes are patterns each component applies; their specimens live on Motion.
 * ───────────────────────────────────────────────────────── */

const SP = tokens.springs;
const sec = (v: string) => parseFloat(v) / 1000;

const LABELS: { key: string; label: string; glyph: MorphIconName }[] = [
  { key: 'save', label: 'Pin', glyph: 'pin' },
  { key: 'saving', label: 'Pinning to Today…', glyph: 'synced' },
  { key: 'saved', label: 'Pinned', glyph: 'check' },
];
const STATUS: { key: string; label: string; glyph: MorphIconName }[] = [
  { key: 'synced', label: 'Synced', glyph: 'synced' },
  { key: 'offline', label: 'Offline', glyph: 'offline' },
  { key: 'error', label: 'Sync error', glyph: 'sync-error' },
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
  ['T1 · The drum', 'A control’s face changes: label, digits, an authored icon', 'The face turns one step (4) and defocuses half of it (2). The drum is one object: both faces ride the settle spring from the same frame, so what leaves and what arrives always add up to one whole face. A wire icon from the set does not ride the drum: it morphs (T11). A solid character glyph (the keeper) is not in the morph family and does ride it.', 'SwapText · SwapIcon'],
  ['T2 · Footprint', 'A control grows or shrinks to new content', 'Width on settle. Growing: the surface makes room as the drum turns. Shrinking: waits until the old face is half turned away (settle half, 83ms).', 'SwapText'],
  ['T3 · Selection glide', 'One of a set becomes selected', 'The selection is a part that travels. In a track with ends: part spring, may overshoot against the stop. Free travel (lists, navigation): settle. Placed without motion on first paint.', 'SlidingIndicator'],
  ['T4 · Press', 'A cap is pressed', 'Down the cap’s depth (1) in 50ms linear; the shadow collapses into a well. Back on release. Kept under reduced motion.', 'Button'],
  ['T5 · Lift', 'An object is hovered or picked up', 'Rises one step (4) on the object spring; the ambient shadow grows with it. Lands with a small overshoot: the table is its stop.', 'Pattern'],
  ['T6 · Rise', 'A menu, popover, palette or tooltip opens', 'Rises one nest (6) from its trigger, from one nest smaller than itself, on the surface spring; its shadow grows from the trigger’s contact to the floating ambient. Closes on release, back the way it came.', 'Pattern'],
  ['T7 · Panel', 'A drawer or panel enters a region', 'Travels its own extent from its edge on the surface spring, content already inside. Leaves on release the same way.', 'Pattern'],
  ['T8 · View change', 'A panel changes view (tabs, steps)', 'Two steps (8) toward the new view, focus 4, overlapping like the drum; the container height settles.', 'Pattern'],
  ['T9 · Arrive and leave', 'Rows, toasts, badges', 'Rise one nest from below on settle; leave on release the way they came. Several items: each starts as the one before is half gone (release half).', 'Pattern'],
  ['T10 · Refusal', 'Invalid input, a wrong code', 'Released one nest aside on the refusal spring (k900 c12): it rings against the nest walls about three times and dies out. Once, never a loop.', 'Pattern'],
  ['T11 · Glyph morph', 'A control’s icon changes: paste → check, synced → offline, zoom in → zoom out', 'The icon becomes the next one on settle, every part from the same frame. Parts pair by least energy and ride a carriage (rigid turn, scale and travel, bending only what they must); beads draw out into wires; rings open where they meet their new ends and tint follows the area; clearances travel with the parts that cast them. A part the next icon lacks tucks behind a body or gathers into a staying wire; one it gains emerges or buds. A mirror pair turns over. Nothing fades. Every plan carries a strain: under 1 it reads as one object (docs/MORPH.md).', 'MorphIcon'],
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
      drum: {
        _collapsed: true,
        turn: [4, 0, 16, 1],
        focus: [2, 0, 8, 0.5],
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

  // Slow motion stretches every spring on this page; the curves stay the same shape.
  const k = d.slowMotion;
  const vars = {
    '--mu-swap-spring': `${SP.settle.duration * k}s var(--mu-spring-settle)`,
    '--mu-swap-shrink-delay': `${sec(SP.settle.half) * 1000 * k}ms`,
    '--mu-swap-turn': `${d.drum.turn}px`,
    '--mu-swap-focus': `${d.drum.focus}px`,
    '--mu-spring-release-d': `${SP.release.duration * k}s`,
    '--mu-spring-settle-d': `${SP.settle.duration * k}s`,
    '--mu-spring-part-d': `${SP.part.duration * k}s`,
  } as React.CSSProperties;

  const label = LABELS[labelAt];
  const status = STATUS[statusAt];

  return (
    <div style={vars}>
      <PageHeader
        title="Transitions"
        lede="How Soft Hardware changes state. A control is an object, so it never snaps: its face turns, its footprint settles, its selection travels, surfaces rise from what opened them. Each recipe names its mass class and its distance on the grid; the timing follows from the physics on the Motion page."
      />

      <Section title="T1, T2, T11 · The drum, the footprint and the glyph" lede="A control’s face sits on a drum. When it changes, the face turns one step: the old face turns up and out of focus while the new one turns up into focus. The drum is one object, so both ride one spring from the same frame and always add up to one whole face; the footprint settles to the new face. Both icons morph into the next one while the label turns. Press either; turn up slow motion to watch.">
        <Bench caption={`turn ${d.drum.turn} · focus ${d.drum.focus} · settle spring ${(SP.settle.duration * k).toFixed(2)}s · both faces sum to 1`}>
          <div className="flex flex-wrap items-center justify-center gap-24">
            <Button cap="primary" onClick={() => setLabelAt((i) => (i + 1) % LABELS.length)}>
              <MorphIcon name={label.glyph} size={14} />
              <span aria-live="polite"><SwapText value={label.label} /></span>
            </Button>
            <button
              type="button"
              onClick={() => setStatusAt((i) => (i + 1) % STATUS.length)}
              className="material-cap inline-flex h-32 cursor-pointer items-center gap-6 rounded-pill pl-9 pr-15 text-ink"
            >
              <MorphIcon name={status.glyph} size={16} />
              <span className="type-label"><SwapText value={status.label} /></span>
            </button>
          </div>
        </Bench>
      </Section>

      <Section title="T3 · Selection glide" lede="The selection is a part that travels; it never teleports. Riding a track with ends, like this segmented control, it may overshoot a little against the stop. Traveling freely, like this site’s navigation, it settles.">
        <Bench caption={`segmented · part spring · ${(SP.part.duration * k).toFixed(2)}s`}>
          <Segmented value={layout} onChange={setLayout} />
        </Bench>
      </Section>

      <Section title="Recipes" lede="Every state change in MetalUI is one of these. Built recipes ship as primitives; the rest are applied by each component as it is built, and their specimens are on the Motion page.">
        <TokenTable head={['Recipe', 'When', 'Motion', 'Ships as']} rows={RECIPES} mono={[0]} />
      </Section>

      <Section title="Choosing a recipe">
        <Rules
          rules={[
            { id: 'C1', title: 'Did the face change, or the object?', body: 'Same control, new label, icon or number: the drum (T1), with the footprint (T2) if its size changes. A different object appearing: rise (T6), panel (T7) or arrive (T9).' },
            { id: 'C2', title: 'Did something become selected?', body: 'One of a set: the selection glides (T3). Never recolor the old and new items in place without the travel.' },
            { id: 'C3', title: 'Was it touched?', body: 'Pressed: the press (T4). Hovered and liftable: the lift (T5). Refused: the refusal (T10).' },
            { id: 'C4', title: 'Is it done a hundred times a day?', body: 'Then no recipe: it changes instantly (Motion M6).' },
          ]}
        />
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'R1', title: 'Nothing snaps', body: 'A label, size, icon, selection or surface never changes in one frame. If it changes, it uses a recipe.', origin: 'Ours · principle P7' },
            { id: 'R2', title: 'The window is never empty', body: 'Outgoing and incoming overlap; defocus blends them into one change. In the drum both faces ride one spring from the same frame, so their visibility sums to exactly one at every instant. A gap between leaving and arriving reads as a blink.', origin: 'Ours · the drum; crossfade-with-blur adapted from Animations on the Web' },
            { id: 'R3', title: 'Things that leave ride release', body: 'A row, toast or closing surface leaves on the release spring, which is stiffer than settle, so departures are quicker by construction: half gone in 71ms while arrivals are half in at 83ms. A drum is the exception: it is one object, so both faces turn on one spring.', origin: 'Ours · derived from the springs' },
            { id: 'R4', title: 'The surface makes room first', body: 'Growing: the footprint moves before the face lands. Shrinking: the old face leaves before the footprint closes. Words never spill outside their object.', origin: 'Adapted · beUI (layout continuity)' },
            { id: 'R5', title: 'Nothing comes from nothing', body: 'A surface rises from one nest smaller than itself, one nest from its trigger, never from zero size or from thin air. It leaves the way it came.', origin: 'Ours · distances from the grid; principle from Animations on the Web' },
            { id: 'R6', title: 'The light never moves', body: 'Every recipe that changes elevation changes the shadow with it: rise grows contact into ambient, press collapses into a well, lift grows the ambient.', origin: 'Ours' },
            { id: 'R7', title: 'Composite first', body: 'Animate transform, opacity and filter. The one exception is a small control’s footprint, whose width settles because scaling would distort its material.', origin: 'Ours · exception; rule from Animations on the Web' },
            { id: 'R8', title: 'One entrance per object', body: 'A panel or surface arrives with its content already in place; nothing trickles in after it lands.', origin: 'Adapted · Animations on the Web' },
          ]}
        />
      </Section>

      <Section title="Where this comes from" lede="MetalUI’s motion is its own, derived from the Soft Hardware object sheet. These references shaped how it is organised and are credited where a rule is adapted from them.">
        <Rules
          rules={[
            { id: 'Ours', title: 'What is Soft Hardware’s', body: 'Mass classes and their springs (from the object sheet), fades riding springs, bounce needing a stop, the light staying put, distances derived from the grid and the nest, the drum, and the rise from a trigger with its shadow growing.' },
            { id: 'Ref 1', title: 'transitions.dev, by Jakub Antalik', body: 'The idea of a small, closed set of named state-change recipes that agents can apply by name.' },
            { id: 'Ref 2', title: 'beUI motion guide', body: 'Layout continuity: the surface changes first, the content follows.' },
            { id: 'Ref 3', title: 'Animations on the Web, by Emil Kowalski', body: 'Frequency, crossfades blended with blur, origin-aware motion, interruptibility and reduced motion that keeps meaning.' },
          ]}
        />
      </Section>
    </div>
  );
}
