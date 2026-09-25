> **Superseded (2026-09-25).** These packets were written for the old hover-pose model. Icon motion now follows `docs/ICON-MOTION.md`: one act per icon, as data. The eight icons here, close and plus above all (axial shrink and grow is not an action), are redone under it.

# Icon motion storyboard: meaning before motion

The product set's motion is the icon's own verb played on its own parts (ICON-GRAMMAR K10). Most icons already do that: the trash lid lifts on its hinge, the layout tiles swap, the eraser rubs out a scribble. This pass is about the ones that don't. Their hover or press is a generic performance, a turn, a swell or a lift, that says nothing about the job, and in two cases says the opposite.

Each concept packet below answers the same questions before any geometry changes: what the user is doing, what changes (before, transition, after), what must hold on every frame, what the motion is evidence of, the nearest wrong reading, and what it must not become. The motion ships only if the icon still reads with the label off, with motion off (the rest glyph doesn't change), and at 16 px.

Out of scope for this pass: the drawing tools (pen to eraser, done in `8decfec` and `47a234f`) and the six hero glyphs (send-away, note, group, draw, link and the mascot), whose motion is hand-ported to SwiftUI shapes and changes only with its Swift twin.

## The rejections

| Icon | Today | Why it goes |
|---|---|---|
| plus (New) | hover turns the plus a quarter | Halfway through, at 45°, a plus **is** the close glyph. Hovering New shows "Close" for a frame. A quarter turn also ends where it started, so the motion is evidence of nothing. |
| zoom-in | hover turns the plus a quarter | Same crossing through ×, and it's inside a lens, so it reads as "clear search". |
| close | hover turns a quarter and softens | A quarter turn of an × ends as the same ×. It reads as a spinner, not a dismissal. |
| check | hover lifts the tick | A lift is a hover highlight any icon could do. Nothing about agreement or completion. |
| task | hover lifts the tick, press redraws only the tick | Same lift. On press, the item doesn't take part in being done. |
| more | dots swell together | A swell is emphasis. An ellipsis means "it continues", and nothing continues. |
| clock | the whole hand wire turns 60° | Both hands turn as one rigid piece, so the face shows a time no clock can show. Time isn't passing, a shape is rotating. |
| sync-error | the ! nudges up | A nudge is emphasis. It doesn't show what failed: the orbit that should turn. |

## Concept packets

### 1. check · Check

- **Outcome.** Confirm: yes, this is right. Call sites: confirm buttons, the done state of a step.
- **Verb, object.** Agree to it. Before: an open question. After: settled.
- **Invariant.** The tick keeps its two legs and its vertex on the baseline. It never leaves its footprint.
- **Actors.** The tick is the agent. The vertex (9.5, 16.7) is the pivot, where a pen changes direction.
- **Hover: a nod.** The tick dips about its vertex, rises a little past rest and settles: a single nod, yes. It's a one-shot on entering hover, not a held pose, because agreeing is an act, not a posture.
- **Press: the stroke is made.** The tick redraws from its short leg (unchanged), and now lands with weight: the stroke is 0.4 heavier where it finishes, then eases back. A pen that means it.
- **Nearest neighbour rejected.** A bounce up (reads as "hover"). A scale pulse (reads as "notification").
- **Forbidden.** Sparkles, confetti, a circle around it. Check is quiet.

```
HOVER   0ms  tick at rest
       140ms dips 7° about the vertex
       320ms rises 3° past rest
       520ms settles
PRESS   0ms  stroke gone (trim 0)
       300ms drawn to the tip, stroke 1.7 → 2.1 at the finish
       420ms stroke back to 1.7
```

### 2. task · Task

- **Outcome.** Mark an item done. The tick belongs to the item.
- **Verb, object.** Complete the item. Before: open box. After: ticked box.
- **Invariant.** The box never moves off its keyline. The tick stays inside the box.
- **Actors.** The finger presses the box, and the box acknowledges with the tick.
- **Hover.** The same nod as check, smaller, inside the box.
- **Press: pressed into done.** The box presses in (scale 0.94) like a physical checkbox. As it comes back up, the tick draws in. The tick is the result of the press, so it starts after the press bottoms out (80 ms).
- **Nearest neighbour rejected.** Only the tick moving (the item plays no part in completion).

```
PRESS   0ms  box presses in, scale 1 → .94
       120ms box rising; tick starts drawing (80ms delay)
       380ms tick fully drawn, box at rest
```

### 3. close · Close

- **Outcome.** Dismiss a surface: a dialog, a panel, a toast.
- **Verb, object.** Put the surface away. Before: open. After: gone.
- **Invariant.** Always an ×: two strokes crossing at the centre, at 45°.
- **Actors.** Both arms draw toward the crossing, the point where the surface will collapse.
- **Hover: ready.** The arms pull in toward the centre (scale 0.86), holding tension. It's a held pose: a surface poised to fold up.
- **Press: folds away.** The × collapses into its centre (scale 0.3) and springs back out to the hover pose. The thing it closes goes the same way.
- **Nearest neighbour rejected.** A rotation (identity for an ×, reads as loading). A shake (reads as error).

```
HOVER   0ms  arms at full length
       460ms arms at .86 (spring)
PRESS   0ms  from hover pose
       130ms collapsed to .3 at the crossing
       340ms back out to .86 with a small overshoot
```

### 4. plus · New

- **Outcome.** Create a new block.
- **Verb, object.** Make one. Before: nothing. After: a new thing.
- **Invariant.** The plus stays upright: never at 45°. The tile keeps its keyline.
- **Actors.** The plus grows out from the centre of the tile, the way the new thing will appear.
- **Hover: about to be made.** The arms extend out from the centre (scale 1.22) while the tile holds still. It's a held pose.
- **Press: made.** The tile presses in (0.92) and the plus is squeezed with it (1.22 → 0.9). As the tile comes back, the plus pops past its hover length (1.34) and settles: the new thing arrives.
- **Nearest neighbour rejected.** A quarter turn (passes through ×, see above).

```
HOVER   0ms  arms at 1
       460ms arms at 1.22 (spring)
PRESS   0ms  tile 1 → .92, arms 1.22 → .9
       130ms bottom of the press
       230ms arms pop to 1.34, tile back to 1
       360ms arms settle to 1.22
```

### 5. zoom-in · Zoom In

- **Outcome.** Magnify the canvas.
- **Verb, object.** Make it bigger. Before: small. After: large.
- **Invariant.** The plus stays upright and centred in the lens. The handle never moves relative to the lens.
- **Actors.** The lens is the instrument; the plus is what's seen through it. The plus grows more than the lens does, as a magnified thing does.
- **Hover: magnified.** The lens swells a little (1.04). The plus inside it grows more (1.24), so the view is bigger than the glass.
- **Press: one step in.** The lens pulses to 1.14 and settles back to its hover pose (kept from today). The plus rides with it.
- **Nearest neighbour rejected.** A quarter turn of the plus (passes through ×, reads as "clear").
- **zoom-out** already means what it does (the minus narrows, the lens recedes) and stays as it is.

### 6. more · More

- **Outcome.** Open the overflow menu: there are more options.
- **Verb, object.** Continue. The ellipsis says "and so on".
- **Invariant.** Three dots on one line, at the same pitch.
- **Actors.** Each dot in turn, left to right, the direction reading continues.
- **Hover: it goes on.** A wave travels through the dots: each rises 1.2, swells 1.15 and comes back, 70 ms apart. A one-shot on entering hover.
- **Press: unfold from one point.** The outer dots gather to the centre and part again (kept from today). The menu opens from a single point.
- **Nearest neighbour rejected.** All three swelling at once (emphasis, not continuation). A looping typing indicator (it would say "someone is writing").

```
HOVER   0ms  dot 1 rises
        70ms dot 2 rises
       140ms dot 3 rises
       560ms all at rest
```

### 7. clock · Time

- **Outcome.** Time: history, scheduling, "when".
- **Verb, object.** Time passes.
- **Invariant.** A real clock: the minute hand is long and points up at rest, and the hour hand is short. Their angles always keep the 12:1 ratio.
- **Actors.** Two hands, split out of today's single wire: minute (12, 12 → 12, 7.4) and hour (12, 12 → 15.2, 14).
- **Hover: an hour passes.** The minute hand sweeps a full turn while the hour hand moves one hour on (30°). It's held, so the hour stays advanced while hovered. On leave, both hands wind back.
- **Press: a minute ticks.** The minute hand steps forward 6° and settles with a small recoil: the tick of a mechanical hand.
- **Nearest neighbour rejected.** Rotating both hands as one rigid shape (no clock can do that).

```
HOVER   0ms  hands at rest
       900ms minute +360°, hour +30° (soft settle)
PRESS   0ms  from the current pose
        90ms minute +8°
       300ms recoil to +6°, settle
```

### 8. sync-error · Sync Error

- **Outcome.** Sync failed: something needs attention.
- **Verb, object.** The sync tries to turn and can't.
- **Invariant.** The orbit's gap stays where Synced keeps it. The ! stays upright.
- **Actors.** The orbit is what should turn, and it's jammed. The ! is the result.
- **Hover: it catches.** The orbit starts to turn (18°), catches, and snaps back with a recoil. The ! rises as the orbit catches. A one-shot on entering hover. It's the synced icon's own hover motion, failing.
- **Press: shivers.** The orbit shivers once (kept from today).
- **Nearest neighbour rejected.** Only the ! moving (says "alert", not "sync failed").

```
HOVER   0ms  orbit at rest
       260ms orbit turned 18° (ease in, trying)
       330ms caught: snaps back to −4°
       560ms settles at 0; ! lifts .5 at 330ms, settles by 560ms
```

## Order of work

One icon at a time, each verified in the running docs site (bone and graphite, reduced motion) before the next:

1. check
2. task
3. close
4. plus
5. zoom-in
6. more
7. clock
8. sync-error

SwiftUI: these eight aren't hero shapes, so they play SF Symbol effects (`MetalIconMotion.resolve`). Close's `.tilt(90°)` is the rotation this pass removes, so it becomes the same bounce-down as its press. The others keep their effects.
