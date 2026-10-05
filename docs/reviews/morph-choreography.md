# Morph choreography review

A design critique of every icon morph a product really switches between, frame by frame, against the engine's own rules (`docs/MORPH.md` E1–E10). Captures: `docs/captures/review/morph-polish/before/` (one filmstrip per ordered pair: eleven even steps, then the frames at 0–440 ms on the settle spring; `plans.txt` is every plan's tracks, moves, carriages and crossings). After-captures for each fix land in `docs/captures/review/morph-polish/after/`.

## Context

A morph is what a person sees in the quarter second after pressing a control whose glyph is its state: send → stop, show → hide, play → pause, add → remove, collapse → expand, paste → pasted. The person is not watching the icon; they are confirming that the press took. So a morph has one job: read as *the same object changing*, with nothing popping, nothing crossing, nothing growing a wart. Strain is the engine's number for that; the eye is the judge.

## First impressions

The engine's core is right. Pairs that share a skeleton (synced ↔ offline, zoom in ↔ out, undo ↔ redo, the chevron's turns) are already excellent: one rigid object, one spring, the satellite drops into its socket, the arrow turns over edge-on. The failures are not in the carriages; they are at the edges of E7 (what a lone part does) and they are concentrated in exactly the pairs a product uses. Two of the nine control pairs on `/icons/morph` show a part vanishing or appearing in one frame, which is the one thing the language forbids (C10). A third grows a nub out of a triangle. Those three are what "not well choreographed" means here; the rest is honest transformation.

## Findings, ranked by how much each hurts a real control

### 1. A mark on a body's face pops instead of moving (engine, E7 tuck/emerge) — plus ↔ minus, sidebar ↔ sidebar-collapsed, info ↔ warning, lock ↔ warning

**What the eye sees.** plus → minus (strain 0.10): the upright is gone in the first frame; the tile and bar then sit still for 440 ms. minus → plus: nothing happens for 440 ms, then the upright is there. sidebar-collapsed → sidebar (0.32): the rail slides right, then the three rail marks pop in on the last frame. info → warning (0.85): the dot of the exclamation mark appears only when the morph settles. lock → warning: the same dot is hidden all the way (it happens to coincide with the keyhole slot gathering into the same point, so the pop is masked by luck).

**Why.** E7 lets a lone part *tuck* behind a body that can hide it, and hides it with a `behind` mask: the body's whole area, widened by the clearance r. The planner checks that the part *fits* behind the body at the hidden end, but never that it is *visible* at the other end. A mark drawn on a tinted card (the plus upright on its tile, the rail marks on the window, the warning dot inside its triangle) is inside the body's area at both ends, so the mask hides it from the first frame (leaving) or until the last (arriving). The move "slides behind" never happens; the part is simply switched off.

**Fix (engine).** A tuck or emerge is only a tuck or emerge if the part is visible at its visible end: outside the body's outline (widened by r) where it starts (leaving) or where it ends (arriving). Otherwise it is not behind anything and falls through to E7's other clause: it gathers into (buds from) the nearest staying wire. For plus that is the crossbar, which is the plus act's own story (the upright driven into the bar); for the sidebar it is the rail; for warning it is the exclamation bar. One rule, several pairs, so it is an engine change and every pair is re-checked.

### 2. A lone ring buds as a wart from a non-boxy body (engine, E7 `TUCK_BOXY`) — play ↔ pause, play ↔ stop

**What the eye sees.** play → pause (1.89): the triangle squashes leftward into the first bar while a blob sprouts from its slanted edge at 40 %, swells into the second bar and drifts right. pause → play: the right bar shrinks into a nub on the growing triangle. play → stop (1.88): the pad buds from the triangle's left edge as a small loop that inflates. All three read as a growth, not a transport control.

**Why.** The second bar could *emerge from behind* the tinted triangle (it fits inside it at half size), but `hideBehind` rejects any body whose area is under 60 % of its bounding box. That test exists to reject the chord of a bent open wire, which is not a body. A closed, tinted triangle is a body regardless of its boxiness (its outline is real, not a chord), so the test is misapplied.

**Fix (engine).** Apply the boxiness test only to bodies that are open wires at that end (chord-closed outlines). A closed ring that is tinted, solid or casts depth is a body as drawn. Then the second bar emerges from inside the shrinking triangle and the pad emerges from inside the triangle growing into the case: the thing that was behind comes out. Strain barely moves (lone share halves for tucks), but the picture does.

### 3. A diagonal crease curls into a hook to become a ring (icon + E4) — send ↔ stop

**What the eye sees.** send → stop (1.29): the plane's crease (an open diagonal wire) *closes* into the pad ring. From 30 % to 70 % it is a hook curling inside a kinked pentagon: the ring opens at the point nearest the crease's ends, so the wire has to grow round three sides of a square while travelling 6 u.

**Why.** E4 offers *press flat / unfold* (a loop pressed flat into a wire) when it moves less than opening, but never for a body, and the engine counts any tinted part as a body. The stop pad is a tinted *mark*, not the glyph's body (K2: the body is the case). Unfolding the crease into the pad is the plane's true story (a fold opens into a square) and would travel less.

**Fix (engine, narrow).** Let E4's "never for a body" mean the grammar's body: the glyph's largest part, a solid, or a part that casts depth. A small tinted mark may press flat or unfold, with its tint draining or filling as its area goes (which E4 already describes). To be evaluated on the filmstrip; if the unfold reads worse than the hook, leave it and record the pair as honest at 1.29.

### 4. The moon's inner arc rides out of the disc as a stub (icon-level) — sun ↔ moon

**What the eye sees.** sun → moon (1.64): the eight rays tuck into the disc cleanly, but the right ray carries into the moon's inner arc (73° turn, scale 3.9) and from 30 % to 50 % sticks out of the disc's right side like a handle before the disc catches up with it.

**Why.** Least-energy pairing: the ray is the only mark the arc can pair with, and its carriage path runs outside the growing body. The moon's inner arc is a mark that only makes sense once the body is a crescent.

**Fix (icon).** Draw the moon so its inner arc starts inside the sun's disc radius (or let the arc emerge from behind the body: it fits inside the disc at half size once finding 2 lands, but the pairing still prefers the ray). Not a control pair on the docs page; a common theme toggle. Left as a recorded icon-level follow-up.

### 5. The × draws out of the middle and right beads, crossing (icon-level) — more ↔ close

**What the eye sees.** more → close (1.78): the middle and right beads draw out into the two diagonals while the left bead gathers; at 20–40 % the strokes cross each other and read as a squiggle.

**Why.** Both diagonals of × are centred at (12, 12); the assignment pairs the middle bead (travel 3.4) and right bead (7.1) rather than the symmetric left + right (7.1 + 7.1). The crossing is in the pairing, not the carriage.

**Fix.** None inside the rules without preferring symmetry over energy. Recorded; the pair is honest at 1.78.

### 6. Check is out of budget from everything (grammar-level) — paste → check 2.27, copy → check 3.25, save → check 3.71, download → check 2.84, upload → check 2.75, retry → check 2.10, bell → check 2.34, link → check 2.39

**What the eye sees.** The body opens or sags into the check while every other part gathers into it: a clipboard melting, two cards collapsing. Honest, but visibly a replacement by other means.

**Why.** `docs/ICON-GRAMMAR.md` §6 already says it: check is 19 units with no body; every pair into it is mostly lone material. Material mismatch is the strongest predictor of strain (r 0.64).

**Fix.** The fallback ladder, not choreography: either give check a body (K2) or declare these as drum pairs (`SwapIcon`) in the guides. paste ↔ check is on the controls bench today above the budget it prints beside it. Out of scope for this pass; recorded for the owner.

## Pairs that are fine

synced ↔ offline (.27), offline ↔ sync-error (.71), synced ↔ sync-error (.48), zoom-in ↔ zoom-out (.20), search ↔ zoom-in (.62), undo ↔ redo (.50, turn), download ↔ upload (.50, turn), chevron 0 ↔ 180 (turn, edge-on at the half) and 0 ↔ 90 (one rigid quarter turn), eye ↔ eye-off (.94: the shutter buds from the iris and grows across the lens; its clearance opens with it), note ↔ trash (1.09), board ↔ pin (1.51), group ↔ ungroup (1.87), pause ↔ stop (1.17). Of these, eye ↔ eye-off could stand out more (a wipe from one corner rather than a bud from the centre) but it is within the language and reads correctly.

## Decisions taken in phase 2

### Fix 1 · a tuck needs a view (E7) — landed

Storyboard, plus → minus (settle k380 c36, one spring; p is spring progress):

```
    0ms   tile and crossbar hold still; the upright starts sinking into the bar's centre
  ~60ms   p .35: upright is half its height, both ends closing on (12, 12)
 ~110ms   p .67: upright is a point at the bar's weight, inside the bar — gone, not switched off
  440ms   rest: the authored minus
```

minus → plus is the same film backwards: nothing moves until p ⅓, then the upright grows out of the bar's centre both ways and is full at rest. sidebar-collapsed → sidebar: the rail slides right from frame 0 and its three marks bud out of the rail from p ⅓, sliding left to their stops. info → warning: the i's dot sinks into the bar while the body squares into the triangle; the warning dot grows out of the bar's foot from p ⅓.

Change: `hideBehind` rejects a body that already covers more than half of the part at the part's visible end (outline widened by the clearance r), so the part gathers or buds instead. Engine-wide: 1392 of 6006 ordered pairs re-plan (moves change in 1252); mean strain 1.757 → 1.765 and pairs under 1 go 570 → 578. The rises are honest: every pair that rose was hiding a pop (a part switched off behind a body at one end), and a bud or gather is priced as lone material where a tuck was priced at half. The largest rises (seed ↔ ellipse 1.37 → 2.63, bell ↔ coin 1.25 → 2.22, board ↔ stop .76 → 1.60) are not product pairs; their before-filmstrips show the hidden part appearing in the last frame.

Control pairs: plus ↔ minus .10 → .23, sidebar ↔ sidebar-collapsed .32 → .16 (the marks now travel less than a tuck to the window's centre), info ↔ warning .85/.76 → .76, lock ↔ warning .87 → .91.

### Fix 2 · a closed ring is a body as drawn (E7) — landed

Storyboard, play → pause:

```
    0ms   the triangle starts shrinking leftward into the first stop (carry, scale .82, 3 u of travel);
          the second stop is inside it, hidden by the triangle's own area plus a 1 u clearance
  ~55ms   p ⅓: the second stop starts sliding right out of the triangle, its top and bottom ends
          showing past the slanted edges first, the middle still covered
 ~120ms   p .7: the triangle is nearly a bar; the second stop is clear of it, whole
  440ms   rest: two stops
```

pause → play: the second stop slides back into the growing triangle and is covered by p ⅔. play → stop keeps its bud: the pad ends on the case's face, so by fix 1 it cannot emerge (it would be hidden at rest) and it buds from the triangle's edge instead; recorded as honest at 1.88.

Change: the 60 % boxiness test in `hideBehind` applies only to an open wire's chord-closed outline; a closed ring that is tinted, solid or casts depth is a body regardless of its shape. Engine-wide: 570 pairs re-plan; mean strain 1.765 → 1.759, pairs under 1 578 → 572. play ↔ pause 1.89 → 1.31, spark ↔ pause 1.97 → 1.33, play ↔ copy 2.53 → 1.37; rises are tucks that now travel to a body's centre instead of gathering into a nearer wire (select ↔ send-away 1.29 → 1.82, eraser ↔ share 1.59 → 1.95), and their filmstrips read fine (a bead slips behind the cursor; the eraser's band slides behind the tray).

The docs' filmstrip list gains play ↔ pause, since it is a control pair on the same page; the slice reads that row's strain and moves.
