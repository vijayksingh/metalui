# Backlog

Feedback, bugs and performance notes to work on later. The owner's word is in the first line of each entry; the rest is what a good library ships for it. Take entries one at a time, component by component.

## Calendar and Date picker

Owner: "no select date range; add option for min legit date, option for max legit date, and like everything which should be there for date." (2026-09-30)

- [x] **Range selection**: `mode="range"`, `{ start, end }` value; the thumb stretches across the range, with ends and a hover preview of the range before the second click; `minDays` / `maxDays`.
- [x] **Min and max on the page**: `Calendar` already takes `min` / `max` (out-of-range days disabled, month steps stop), but the docs page doesn't show them and `DatePicker` does not pass them through. Wire them through, demo them, and let the DialKit set them.
- [x] **Unavailable days**: `isDateUnavailable(date)` (weekends, booked days), distinct from out of range, and said to assistive tech.
- [x] **Multiple days**: `mode="multiple"`.
- [x] **Week start** (`weekStartsOn`) beyond the locale default; **week numbers**.
- [x] **More than one month** side by side (`months={2}`, for ranges).
- [x] **Jump to a month or year**: the title opens a month/year picker (birthdays, far dates).
- [x] **Controlled month**: `month` / `onMonthChange` keep displayed month separate from selection and focus. Uncontrolled calendars reveal changed values; controlled hosts can accept, defer or reject month requests without losing keyboard access.
- [x] **Marked days**: a dot or LED for days with something on them (events).
- [x] **Date picker**: typed entry (segments, locale aware), a clear button, Today, presets for ranges ("Last 7 days"), `required`, `name` (a hidden input for forms), `readOnly`, and it works inside `FormField`.
- [x] **Date and time**: single DatePicker adds localized time and an IANA zone. Zone changes preserve the instant; DST gaps refuse typed/selected values and overlaps use the first occurrence. Swift MetalDatePicker mirrors date/time entry and zone display.
- [x] **Clipped-pill investigation**: inspected the Calendar playground at 390px and 1280px in Bone and Graphite, including visible control bounds and captured pages. No plate crossed the left viewport edge. The page composes only local benches; the DialKit launcher is at the bottom right and SwapText measurement spans are hidden. The original screenshot is unavailable, so its object cannot be identified; the reported state did not reproduce in these checks. Evidence: `e2e/calendar-selection.spec.ts` and `docs/captures/web/calendar-page-left-edge-*.png`.

## Checkbox (and Checkbox group)

Owner: "the tick animation is boring, it just makes it appear; it should make the glyph run the tick action." (2026-09-30)

- [x] **Draw the tick as a stroke.** Now the tick is a rotated CSS border box revealed by a `clip-path` wipe (`checkbox-tick`, keyframes `mu-checkbox-tick`), so it fades or wipes in as a whole shape. Make it an SVG path drawn by `stroke-dashoffset` along the pen's route: the short stroke down into the corner, a beat of pace change at the corner, then the long stroke up and out, with a slight overshoot at the tail on the part spring. Use the icon set's check geometry (`icons.mjs`, one source) and its motion format (timelines as data, one act per trigger), not a held CSS pose.
- [x] **Unticking runs it backwards**: the tick withdraws from the tail toward the corner before the key goes light, rather than vanishing.
- [x] **Mixed (the parent's half)**: the dash draws from left to right the same way; mixed to ticked morphs the dash into the tick instead of swapping.
- [x] **The group cascade** keeps its stagger, with each child's tick drawing in turn.
- [x] Reduce Motion: the tick appears whole and at once. Keep SwiftUI in step (`trim(from:to:)` on the same path).
- [ ] Anything else that draws a tick uses the same drawing: the menu's checkbox item, the select's chosen row, and the table's select column (it uses Checkbox already).

## Destructive confirm: hold to delete (Alert dialog, Button)

Owner, on the Alert dialog's "Delete regions" button: "this should have motion like hold to delete, and proper icon animation." (2026-09-30)

- [x] **Hold to confirm** as a Button behaviour (`hold` on a destructive cap, e.g. `<Button cap="destructive" hold>`), used by `AlertDialog.Confirm` for irreversible acts:
  - press: the cap presses as now, and a darker red fill runs across it from the leading edge over the hold time (a token, about 800 ms, linear, so it reads as time and not as a spring);
  - let go early: the fill drains back on the release spring, and nothing happens; a short line under the actions says "Hold to delete" the first time;
  - complete: the fill reaches the end, the cap gives one small settle (object spring), and the act fires; then the dialog closes;
  - keyboard: holding Space or Enter fills it the same way; a single tap only shows the hint.
- [x] **The trash glyph acts**: the cap leads with the trash icon; while held, its lid lifts a little in step with the fill; at complete, the lid drops shut (a short timeline in the icon set's motion format, from `icons.mjs`, not a CSS pose).
- [x] **Accessibility**: say the hold in the button's name or description ("Delete regions, hold to confirm"); announce the progress sparingly; WCAG 2.5.7 needs a single-pointer path; for pointers that can't hold, offer a setting or `hold={false}`, and the alert dialog's question still guards the act.
- [x] Reduce Motion: the fill still shows the time passing (it is information), with no settle bounce and no lid travel.
- [x] SwiftUI in step (a long-press gesture with the same fill and timing).
- [x] Decide where it applies: irreversible deletes only; a delete that goes to the past (undoable) stays a plain press.

## Button group and Split button: redesign

Owner: "these groups look ugly, we need to find a good UX; rounded corners inside a button group don't make sense; it doesn't have the feeling of metal." (2026-09-30)

What's wrong now: each segment is its own rounded cap (inner radius `button-group-key-radius`) sitting in a sunk switch tray, so the group reads as loose pills in a trough, not one part. The 100 % readout is dressed as a key though it can't be pressed. The split button's dark cap and light chevron are two different objects pushed together.

Direction (research and sketch before building; interface-craft storyboard first):

- [x] **One machined bar.** The group is a single raised cap with the outer pill radius only; segments are divided by an engraved seam (a hairline groove: a dark line with a light edge beside it), with square inner edges. Reference: segments cut from one block (hardware rockers, console transport keys, Braun and Teenage Engineering panels).
- [x] **Pressing a segment** sinks only that segment inside the bar (its own shading goes to the pressed look, travels its 1 px); the seams and the rest of the bar stay put, so it feels like one part with several keys.
- [x] **Readouts are windows, not keys**: a value between steppers (the zoom's 100 %) is a sunk, engraved display window in the bar, with tabular figures and the drum when it changes.
- [x] **Pairs as a rocker (explore)**: Undo / Redo, − / + as one rocker cap that tips toward the pressed end (a small rotation about the centre on the part spring), with a single seam in the middle.
- [x] **Split button**: one bar in one material (the primary's dark for both parts), the chevron segment behind a seam; opening the menu keeps the chevron segment pressed while it's open.
- [x] **Latched groups** (a toggle group) share the look: the latched segment stays sunk with its lamp.
- [x] Every state per segment: rest, hover (lift the segment's light, not the bar), pressed, focus (ring on the segment, inside the bar's shape), disabled (per segment and whole), and the bar in both colorways and at compact size.
- [x] Swift in step; update the Button group docs page, the agent guide and the captures.

## Icons on actions, and morphs on changes (library-wide)

Owner: "for each button which causes some action, couple it with a semantic icon; we have morphing icons which we aren't using anywhere. Find all the relevant actions and semantic changes where we can apply these icons." (2026-09-30)

Audit (2026-09-30): the icon set has 47 product glyphs. Each plays its act when its trigger (`.mu-icon-trigger`, which every Button carries) is hovered or pressed, so an icon in a button already moves. `MorphIcon` morphs any glyph into any other, but no component uses it; only the docs' Icons, Transitions and MorphGlyphs pages do. 16 components draw their own inline SVG or text glyph instead of using the set.

Rules to adopt first (one layer, in the Button foundation and agent guides):

- [x] **An action names itself with a glyph and a verb** (done: `Button` `icon` prop; link, graphite and strip caps still lack a glyph size token): a button that does something (save, share, export, delete, send, attach, copy, new) leads with its glyph. A plain choice (Cancel, Done, Close as a word) stays words only. `Button` gets a documented `icon` slot (leading, sized by the cap), not ad hoc children.
- [ ] **A state change morphs, never swaps**: when the same control's meaning changes (copy → copied, pin → unpin, collapse → expand), its glyph morphs with `MorphIcon` on the settle spring, and its label turns on the drum (`SwapText`) together.
- [ ] **No hand-drawn glyphs in components**: chevrons, arrows, ticks, plus and minus come from the set (one source).

### A. Action buttons that should carry a glyph (existing glyph in brackets)

- Delete / Delete regions / Send away (`trash`, `send-away`): Alert dialog, Dialog, Card menu
- Share (`share`), Export / Export PDF / Download (`document` → a `download` glyph, see D), Copy (`paste` → `check`), Paste (`paste`)
- New note / New canvas / Comment / Attach files / Attach a file (`note`, `board`, `plus`, `document`)
- Rename / Rename… / Rename canvas… (`pen`), Duplicate (`duplicate`), Pin (`pin`), Tag (`tag`), Group / Ungroup (`group`, `ungroup`)
- Undo / Redo (`undo`, `redo`), Zoom in / out / fit (`zoom-in`, `zoom-out`, `fit`), Search (`search`)
- Save / Save region (a `save` glyph, see D), Try again (`sync-error` → `synced`), Back to now (`clock`), Restore… (`undo`)
- Summarise, Gather, Tidy, Lift subject, Keep (`tidy`, `layout`, `capture`, `pin`)
- Close in dialogs, sheets, popovers, toasts and the attachment's remove (`close`)

### B. State changes that should morph (A → B)

- **Copy → Copied** (`paste` → `check`, back after the pause): the docs' Copy page and code blocks, and a documented copy-button pattern.
- **Sync state** (`synced` ↔ `offline` ↔ `sync-error`): Status, Toast, and the Attachment's upload (uploading → done `check`, failed `sync-error`, retry → `synced`).
- **Save** (idle → saving (Spinner) → saved `check`): the Button's "saving" demo.
- **Pin ↔ Unpin**, **Group ↔ Ungroup**, **Zoom in ↔ Zoom out** at a limit: menus and toolbars where one key flips.
- **Sidebar Toggle** (collapse ↔ expand) and **Split pane** collapse: a `layout` glyph whose panel part slides; today the caller passes a static icon.
- **Accordion, Select, Combobox, Navigation menu, Menubar** open ↔ closed: the chevron (see D) turns as a morph of one glyph, not a CSS rotation of a drawn one.
- **Checkbox / Menu check item**: the tick draws (see the Checkbox entry); mixed → ticked morphs dash → tick.
- **Drop zone**: the well's glyph morphs `document` → `check` when files land, and to `close` while refusing.
- **Toast** kinds (info → success → error) when one toast updates in place (a promise toast).
- **Theme switch** (Bone ↔ Graphite) and the **Motion** switch in the docs header, if they get glyphs (see D).
- **Table sort**: `arrow` up ↔ down as a morph instead of the rotated hand-drawn arrow.

### C. Hand-drawn glyphs to replace with the set

- [x] pagination: shared quarter-turned chevrons in React and Swift, end keys disabled and reduced motion still.
- [ ] calendar (3)
- [x] navigation-menu: shared chevron morph follows Base UI open state; CSS rotation removed.
- [x] accordion
- [ ] attachment
- [ ] combobox
- [ ] select
- [ ] table
- [ ] breadcrumbs
- [ ] button-group (split chevron)
- [ ] folder
- [ ] number-field (− and + as text)
- [ ] fan (‹ as text)
- [ ] link (↗ as text)

Leave the drawings that aren't glyphs: sparkline, connector, snap-guides, line-handles, brush-cursor, dot-display, perfect-preview.

### D. Glyphs the set lacks (design each in `icons.mjs`, with its act and morph partners)

- [x] `chevron` (one glyph; `turn` prop on Icon and MorphIcon), `minus` (done)
- [x] `save`, `download`, `upload`, `send`, `copy` (distinct from paste), `external` (the link's arrow): authored acts, 16/24px references, React/Swift/custom symbols and reduced-motion proof.
- [x] `settings`, `filter`, `sort`, `eye` / `eye-off` (a password field), `lock`: fixed enclosures, authored part acts and 16/24px reference family.
- [x] `info`, `warning` (toast and alert kinds), `sun` / `moon` (colorway), `sidebar` (the rail toggle): fixed silhouettes with inset-part acts, native symbols and 16/24px reference family.

- [x] Block actions: `stop`, `attach`, `retry`, `person`, `bell`, `palette`: authored single-contact acts, semantic 16/24px references and native symbols.

- [x] Signal levels: `volume`, `brightness`: fixed speaker/lamp enclosures, authored level parts and native symbols.

Order of work: the rules and `Button`'s icon slot → D's `chevron` and `minus` → C (component by component) → B's morphs (copy first, it's everywhere) → A in the docs pages.

## Fan (the canvas tool bar)

Owner, on the Fan page: "why are the tray things labels, fix them, make relevant icons"; "instead of showing this tall thing maybe show a grid of 3 × 3"; "what is this ink thing". (2026-09-30)

- [ ] **Tray actions are glyph keys, not worded buttons.** The text and image trays hold compact `Button`s with words (Tasks, Summarise, Gather, Region, Export, Send away; Lift subject, Copy). Add `Fan.Action` (a graphite key with the action's glyph; its name in a tooltip and as its accessible name; the glyph plays its act on hover and press) and use it on the page. Glyphs: Tasks `task`, Summarise `document`, Gather `group`, Region `region`, Export `share` (or a new `download`), Send away `send-away`, Lift subject `capture`, Copy `duplicate` (or a new `copy`).
- [ ] **The fold key is a text "‹"**: use a glyph from the set (a `chevron`, see the icons entry), or morph the tray's own cap glyph into `close` while open. Swift's `MetalFanTray` has the same "‹".
- [ ] **The tool picker is a tower**: 11 tools fan straight up into a column taller than the page. Lay the choices out as a grid (3 × 3, or 4 × 3) that unfolds from the cap: each key travels from behind the cap to its cell on the part spring, staggered by distance from the cap; arrows move in two dimensions; group related tools (select / text / region; pen, marker, pencil; line, arrow, rectangle, ellipse; eraser). Keep "nothing hides in a menu".
- [ ] **The Ink tray doesn't explain itself**: "Ink" as a worded label cap, a bead that only shows the current ink, five colour beads and three width dots with no names, and a "‹". Rework it: the label cap says what the bar is about with a glyph (not a word in a cap), the colours and widths are two named groups (tooltips and accessible names: "Ink: red", "Width: fine"), the chosen ink and width read as latched, and the widths show as strokes of that width in the chosen ink rather than bare dots.
- [ ] The "Pretend selection" switcher sits right on top of the fanned picker; give the demo room, or move the switcher beside the bar.
- [ ] Update the Fan agent guide, Swift and the captures with each change.

## Link: more states

Owner, on the Link page: "add different states to links." (2026-09-30)

Now: rest (engraved hairline underline), hover (underline darkens), pressed (dims), focus (green ring), external (a text "↗" that nudges). The hover is too quiet to notice, and the page shows no state but rest.

- [ ] **Hover you can see**: the underline draws thicker from the side the pointer entered, or rises to meet the baseline (settle spring), with a faint tint behind the words; not only a colour change.
- [ ] **Pressed**: the words sink one step (press travel) as well as dimming, the same press language as a button.
- [ ] **Visited**: a quieter underline (ink3) for `:visited`, opt-in (`visited` on the Link, off by default in apps, on in documents).
- [ ] **Current** (`aria-current="page"`): no underline and full ink, so a link to where you are reads as "here" (breadcrumbs and nav use it).
- [ ] **Disabled / unavailable**: `aria-disabled`, ink3, no underline, no pointer; says why in a tooltip when given.
- [ ] **Loading** (a link that navigates in-app and waits): the underline runs like a progress line until the route arrives.
- [ ] **External**: the "↗" becomes the set's `external` glyph (see the icons entry) with its act on hover, instead of a text character.
- [ ] **Download** (`download` attribute): the `download` glyph and the file size after it ("Tram map.pdf · 2.4 MB").
- [ ] **Kinds**: `quiet` (no underline until hover, for dense lists and tables, only where the context already says "these are links") and `standalone` (a link on its own line with a trailing arrow).
- [ ] **Show every state on the page**: a states strip (rest, hover, pressed, focus, visited, current, disabled, external, download), in both colorways, plus the x-ray card for handling it.
- [ ] Keep the underline in every state except current and disabled (colour alone never marks a link); Swift in step.

## Popover: the Rename action

Owner, on the Popover page's "Rename" button: "same, add better semantic action." (2026-09-30)

- [ ] **The confirm names itself with a glyph**: "Rename" leads with `pen` (its act plays on hover and press), the same rule as the icons entry.
- [ ] **It behaves like a rename**: the field opens with the name selected (the extension kept out of the selection for a file); Enter renames, Escape cancels; Rename is disabled while the name is empty or unchanged; an invalid name (taken, too long) shows the invalid ring and says why under the field instead of closing.
- [ ] **Done shows it's done**: on Rename the glyph morphs `pen` → `check` and the label turns "Renamed" on the drum, then the popover closes after a beat; offer undo in a toast: "Renamed to Lisbon · Undo".
- [ ] **Saving**: when the rename is async, the key shows the spinner and the field locks until it lands; a failure morphs to `sync-error` with Try again.
- [ ] Apply the same pattern to Dialog's "Rename canvas…" and to every confirm that commits a small edit (Save region, Tag, Comment).

## Progress: more variations, and Reset

Owner, on the Progress page: "few more variations for reset." (2026-09-30) The page shows one known bar, one unknown bar, and worded "Run export" / "Reset" buttons.

- [ ] **Reset reads as reset**: the key leads with `undo` (or a new `reset` glyph); the fill drains back to empty on the release spring, not a jump; the value turns back to 0 % on the drum. "Run export" leads with its glyph, and while running it becomes "Cancel" (the glyph morphs to `close`).
- [ ] **End states**: complete (the fill finishes, then the head morphs to `check` and says "Exported"), failed (the fill stops where it was in the invalid ink, `sync-error`, Try again), paused (the fill holds and dims; Resume), cancelled (drains back).
- [ ] **Shapes**: a slim bar with no head (under a toolbar or a card's edge), a ring (circular, for a key or an avatar), a segmented bar for known steps ("Step 2 of 4"), and a buffered bar (a lighter second fill ahead, for media).
- [ ] **Detail**: time left or items done in the head ("8 of 12 · about 20 s"), `tabular-nums`, and the value turning on the drum.
- [ ] **Sizes**: compact and regular, to sit in a row, a toast or a dialog.
- [ ] Show them on the page as a states strip with a DialKit panel to scrub the value and flip the state; Swift in step.

## Slider: redesign

Owner, on the Slider page: "the knob goes out of bounds, which breaks it; allow changing icons and width, and improve it overall; the labels are unreadable, the colour gets muddled in the background; it has to be designed better." (2026-09-30)

What's wrong now:
- The knob's centre travels to the groove's very ends, so at 0 and 100 half the knob hangs past the groove. The tick row is inset (`slider-track-inset`) but the fill and groove are not, so the ticks, the fill end and the knob don't line up.
- The tick labels are the engraved `eng` type in ink3, small and spaced, on the dotted stage, so they blur into the background. The loose marks (15, 40, 62, 90) sit on the fill, sit apart from the ticks, and read as noise.
- The pale green fill against the pale groove has little contrast in bone.

Direction:
- [x] **Bounds**: the knob stays inside the groove. Its travel is the groove minus the knob (the fill runs to the knob's centre), so at 0 and 100 the knob sits flush with the rounded ends. Ticks and labels use the same travel so the knob, fill end and tick line up at every value. Check it in Swift too (`MetalSlider`), which must follow the same geometry.
- [x] **Readable scale**: labels in the meta type at ink2 (not engraved ink3), with enough size and a plate or clear space so the dotted stage never runs through them. Ticks only where there are labels or steps; drop the loose marks, or make marks a documented prop that draws them as notches in the groove.
- [x] **Contrast**: a fill that reads in both colorways (the switch-on green at full strength, or ink for a neutral slider); the groove's edge clear against the surface.
- [x] **Icons at the ends**: `startIcon` / `endIcon` (volume low / high, dim / bright), the glyphs from the set, playing their acts at the limits; and an optional glyph in or beside the knob.
- [x] **Sizes and width**: `size` (compact, regular, large: groove thickness and knob size together) and a `width` / full-width option, all from the slider recipe.
- [x] **Value**: an optional value readout (beside it, or a bubble over the knob while dragging) with the drum; a formatter (%, units).
- [ ] **More kinds** (see follow-ups): a range (two knobs), a vertical slider, a stepped slider that clicks into detents (part spring), and a centred slider (fill grows from the middle, for balance or offsets).
- [x] **Every state**: rest, hover (the knob lifts), dragging (the knob presses, the fill follows 1:1), focus, disabled, and at the limits (a small refusal nudge when you push past an end).
- [x] Redo the page: examples for each kind, a DialKit panel, the x-ray card; captures in both colorways.
- [ ] **Follow-ups**: range (two knobs), vertical, stepped detents, centred; a neutral ink fill; a value bubble over the knob while dragging; volume / brightness glyphs (the set has none; the demo uses zoom); RTL refusal direction; Swift drum for the readout. `e2e/slider.spec.ts` "knob stays inside the groove … graphite" failed once under a full parallel run and passed alone twice: make it robust.

## Spinner: rethink as waiting, by where it happens

Owner, on the Spinner page: "again very bad implementation, think again; think of the various states this could happen in: conveyed on a large item vs a small item vs on an action, and all those things." (2026-09-30)

Now: a sunk ring with a green arc, in two sizes, floating on its own above two worded buttons ("Quick save", "Slow save") that don't show the spinner in themselves. It reads as a loose widget, not as something waiting.

Rethink it as one waiting language, placed where the wait is (research first: how Apple, Linear, Vercel and Teenage Engineering show waiting; storyboard each placement):

- [x] **On an action (a button, a key)**: the glyph itself becomes the wait (the icon morphs into a small arc, or its act loops quietly) while the label turns on the drum ("Save" → "Saving…" → "Saved" with `check`); the key keeps its width and stays pressed-looking; a second press is refused. Short waits under the show delay show nothing, then just the result.
- [ ] **On a small item (a row, a chip, an attachment, an avatar)**: a small ring in the item's glyph slot or at its trailing edge, sized to the text; the item dims a little and can't be acted on; done → the ring morphs to `check` and fades.
- [ ] **On a large item (a card, an image, a panel, a region)**: not a spinner in the middle: the item's own shape waits (a skeleton or a slow sheen across its surface, or a lit edge that travels around its border), with the words of what's happening ("Lifting the subject…"); progress when it's known.
- [ ] **In a field** (search, combobox, validation): a small ring in the trailing slot, replacing the clear key while it works.
- [ ] **For the whole place** (a page or view loading): skeletons of what will arrive, not a spinner; a thin top bar for route changes.
- [ ] **Background work** (syncing, uploading while you keep working): the status LED breathes (the lamp gesture), and nothing blocks.
- [ ] **Known vs unknown**: switch to Progress as soon as the amount is known (ring fills rather than spins).
- [ ] **Timing rules**: a show delay (nothing for fast work), a minimum time on screen once shown (no flash), then the result (`check`, or `sync-error` with Try again); long waits say more after a while ("Still exporting…").
- [ ] **Accessibility and motion**: `aria-busy` on the waiting thing, a polite status only at start and end; Reduce Motion: no spin, a slow pulse of the arc or the words only.
- [ ] **Sizes and inks**: sized from the host (button glyph, row glyph, field glyph), in the host's ink (white on a primary key), not a fixed green arc on a sunk well.
- [ ] Redo the page as placements, each a real host (a saving button, an uploading row, a loading card, a searching field, a syncing status), with a DialKit panel for the timing; Swift in step.

## Status: LEDs and badges get lost on the page

Owner, on the Status page: "these appear way too muddled on the page a lot of the time, especially if someone is using them in transparent mode." (2026-09-30)

What's wrong now:
- The LEDs are 6-ish px beads in pastel inks; on the bone surface (and on frosted or transparent surfaces) their colour and the page mix, and waiting (amber) vs failed (red) are hard to tell apart at that size.
- The captions and badge words are the engraved label type in ink3, spaced wide, so they fade into the dotted stage; the badge plate is a near-white pill on a near-white page, held only by its shadow.
- Colour alone tells the states apart (live vs waiting vs failed).
- The Swift capture doesn't match the web: it says "Recognizer" where the web says "Sync", and its label font falls back to a serif monospace.

Direction:
- [ ] **An LED reads on any ground**: a dark bezel ring (the LED sits in a small sunk socket) so the lamp has its own backdrop on light, dark, frosted and transparent surfaces; a lit lamp glows (a soft halo in its ink), an off lamp is a dull socket. Size up to 8 at default.
- [ ] **Stronger, separable inks**: deeper, more saturated lamp inks tuned per colorway so live / waiting / failed / link read at a glance and for colour-blind people (check with simulated deuteranopia and protanopia).
- [ ] **Not colour alone**: each state also differs in gesture (live steady, waiting breathing, failed a double blink, off dark) and the badge says the state in words.
- [ ] **Badges hold their own ground**: the badge plate gets a defined edge (hairline plus shadow), and on transparent or frosted parents it switches to an opaque plate (`reduce-transparency` and a `solid` option); labels in ink2 at a readable size, not ink3 engraved.
- [ ] **Transparent mode**: define it and test it: the status parts over frost, over images, and over the dark graphite colorway, in the captures.
- [ ] **Tones**: a quiet badge (LED and words, no plate) for dense places, and a strong one (tinted plate in the state's ink) for alerts.
- [ ] Make the Swift twin match the web example (same words, the label font from the tokens) and recapture it.

## Toast: stack in depth

Owner, on the Toast page: "the stacking in toast is vertical; it should be 3D, it should appear to go behind." (2026-09-30) Now each new toast takes a full row above the last, so five identical toasts make a tall column covering the page.

- [x] **A deck, not a column**: the newest toast sits in front; older ones step back behind it, each a little smaller (scale ~0.95 per step), a little higher (a peek of ~8 at the top edge), and a little dimmer, so they read as cards going behind. Show at most three; the rest are counted, not drawn.
- [x] **Arrival pushes the deck back**: a new toast rises into the front (T6) on the object spring while every card behind moves back one step on the same spring, together, from the same frame.
- [x] **Hover or focus fans it out**: pointing at the deck (or Tab into it) spreads the cards into a readable column on the surface spring and pauses their timers; leaving folds them back into the deck.
- [x] **Dismiss**: swipe a front toast away (it follows the pointer, then leaves on release) or its close key; the next card comes forward.
- [x] **Repeats merge**: the same message again doesn't add a card: the front toast bumps (a small press) and shows a count ("×5").
- [x] **Reading and focus**: only the front card is read out (polite status); the deck is one landmark; F6 or a shortcut reaches it. Reduce Motion: cards cross-fade into place, no travel or scale.
- [x] **Placement**: the deck grows toward the screen edge it sits on (bottom stack peeks upward, top stack downward); tokens for step scale, peek, depth and visible count; Swift in step.
- [x] **Toast deck follow-ups**: folded cards share the front card’s measured width and recover their own width when expanded; +N is tucked into the back edge. React and Swift show shared success/error glyphs. Native Tab focus fans out and pauses timers, leaving folds it; real-window proof lives in `e2e/native/run-toast-focus-proof.py`.

## Tool strip: adapt to what was clicked

Owner, on the Tool strip's Swift capture: "this tool strip is static; it should be dynamic, adaptable to the node it's clicked on." (2026-09-30)

Now: `ToolStrip` takes a fixed `items` list (Tasks, Summarise, Gather, Region, Export | Send away); the page shows one set of worded verbs whatever is selected, and it doesn't place itself.

- [x] **Verbs come from the selection**: the strip asks what's selected and shows the verbs that apply: a text block (Tasks, Summarise, Region), an image (Lift subject, Copy, Crop), a link (Open, Copy link), a mix of kinds (only the verbs they share: Gather, Export, Send away), one item vs many (Rename only for one). An API like `verbsFor(selection)` or per-kind verb sets merged by intersection, with the order kept stable so muscle memory holds.
- [x] **Changing the selection morphs the strip**: when the verbs change, the strip's width settles on the settle spring, leaving verbs fade out, new ones fade in, and kept verbs stay in place (no jump); glyphs rather than words (the icons entry), names in tooltips.
- [x] **It places itself at the node**: anchored to the selection's bounds (above it, or below when there's no room; follows when the canvas pans or zooms; flips at screen edges), rising from the selection on the part spring as now.
- [x] **Overflow**: when the verbs don't fit, the rest go into a More key (`more`) at the end, before the destructive verb.
- [x] **States**: disabled verbs say why in the tooltip; a verb in progress shows the waiting language (the spinner entry) in its key; the destructive verb stays last, apart, and uses hold-to-confirm when irreversible.
- [x] Redo the page with a small canvas where clicking a text block, an image, a link or several shows the strip adapting; Swift twin in step and recaptured.

## Cues (the in-text semantic marks): meaning, tags, motion, delight

Owner, on the Cue family page: "the icons are treated as secondary and a lot of the time don't signify what they relate to; #tag feels a bit weird; the other semantic chunks are okay but we need better UX for that semantic distinction, and better motion; this kind of intelligent stuff should delight the user and add a feeling of whimsy." (2026-09-30)

What's wrong now:
- The trailing life glyphs (the cup after "moodboard", the wave after "call the printer") sit after a middle dot in ink3, small and far from the words they explain, so they read as decoration; nothing says what they stand for (the mood? the kind of task?).
- `#poster` and `#studio` are grey pills that look like disabled chips or code, not like tags; two tag looks exist (filled and outlined).
- The kinds (date, duration, amount, sleep, colour, tag, link) differ only by underline style and colour, and several are close (dotted green vs solid green vs grey).
- Recognising a chunk has no moment: marks are simply there.

Direction:
- [ ] **Glyphs say what they mean and sit where they belong**: a glyph attaches to the chunk it explains (a clock at "tomorrow 4pm", a coin at "$40", a moon at "slept 6h", a swatch of the actual colour at "#FF6B3D"), at full ink next to the words, with its name in a tooltip ("A meal · breakfast?"). The trailing "· glyph" pattern is for the whole line's kind only, and gets a label on hover.
- [ ] **One grammar of kinds**: time (date, duration) → an engraved underline plus a clock glyph; money → a coin and tabular figures; body (sleep, steps) → a moon or a step; colour → a live swatch; link → the link chip; person → a small avatar. Each kind is one look, documented on the page as a legend.
- [ ] **Tags as tags**: `#tag` becomes a small raised tab with a punched hole (a luggage tag), the hash kept as a quiet mark; the tag's colour is its own (stable hash to a palette); one look everywhere. Typing `#` shows the tags you've used.
- [ ] **A moment of recognition (motion first)**: when a chunk is recognised as you type, its underline draws in from left to right (settle spring) and its glyph pops in beside it with a tiny overshoot (object spring); colour chunks bloom their swatch; money flips its figures on the drum into the formatted amount; dates show their resolved day as a chip that slides up and settles. Once, on recognition, never looping; nothing while the caret is still inside the word.
- [ ] **Whimsy, with restraint**: a glyph's own act plays on first recognition (the cup steams once, the moon tilts, the coin spins a quarter turn); rare, short, and off under Reduce Motion; a tiny sparkle when an inferred cue is confirmed.
- [ ] **Inferred vs confirmed**: inferred cues (the "FRI" chip at 0.82) read as a suggestion (dashed, ink2) until confirmed by a click or Tab; confirming stamps them solid with a small press.
- [ ] **Raw vs cued**: the toggle between raw text and cues keeps every chunk exactly in place (already a rule); add the glyphs fading, not jumping.
- [ ] Redo the page with a legend of kinds, a live typing demo that shows recognition, and the DialKit for the motion; Swift in step.

## Lasso demo: buggy selection and an unreliable trigger

Owner, on the Lasso page: "this demo is very buggy; applying the lasso keeps applying the selected state across the component; the trigger for the lasso was very unreliable." (2026-09-30)

Causes found in `apps/docs/src/ui/SnapCanvas.tsx`:
- **Native text selection runs with the lasso**: nothing stops the browser's own selection, so dragging paints the green text highlight over the notes' words and the size readouts ("call the printer", "150 × 64") on top of the lasso's selection. That's the "selected state across the component". Fix: `select-none` on the canvas and `preventDefault` on the lasso's pointerdown.
- **The trigger only fires on the world element itself** (`e.target !== e.currentTarget` in `worldDown`): pressing on the guides layer, on the canvas outside the scaled world (at 50 % most of the canvas), or on any child starts nothing. Fix: start from the canvas (`snap-canvas`), and treat any press that isn't on a note as empty space.
- **A drag that starts on a note moves the note** (right), but there's no feedback telling you where empty space is; the cursor should be a crosshair over empty space and a grab over notes.
- The selection frames and the size readouts both show for picked notes, so after a lasso the canvas is busy with readouts that belong to resizing; show the frame only.
- A click on empty space clears the selection (right), but Escape doesn't; add it, and Shift-lasso to add to the selection.

- [x] Fix the above in the demo, then check the Lasso instrument itself (`packages/metalui/src/components/lasso`) for the same assumptions and document the rules in its agent guide (empty-space start, no text selection, modifier keys).
- [x] An e2e slice that draws a lasso from several starting points (on the guides, outside the world at 50 %, next to a note) and asserts that no text gets selected (`getSelection().toString() === ''`).

## Cues you can operate: the interface molds inside the text

Owner, on the Provenance tooltip page ("Send #poster tomorrow 4pm, slept 6h in #done by #coffee"): "these should let the user interact and change them: slide up and down to change the number or unit; #done can rotate through its enum states; tomorrow → yesterday, today, then show dates; find opportunities where the interface molds inside the text itself." (2026-09-30)

Where it belongs: a recognised cue becomes a **component** (a control you operate, `docs/COMPOSITION.md`), living inline in text; the scrub feedback that shows only while you drag is an **instrument**. It builds on the Cue family and replaces nothing: at rest the text reads exactly as now.

- [ ] **Numbers scrub**: press and drag up / down on "6h", "1h30", "$40" to change the value (a pixel step per unit, Shift for bigger steps, Alt for finer); the digits turn on the drum; a tiny engraved scale appears beside the value only while dragging; arrow keys when focused. Units cycle with a horizontal drag or a key (h ↔ min, $ ↔ €), converting the value.
- [ ] **Enums rotate**: "#done" turns through its states (todo → doing → done → dropped) like a drum or a rotary switch: scroll, drag, or Space to step; the next state peeks above and below while held; its colour and glyph follow the state.
- [ ] **Relative dates slide**: "tomorrow" steps through yesterday / today / tomorrow / the weekdays, then real dates ("Fri 3 Oct"); the resolved date chip rides along; a long press opens the Calendar in a popover anchored to the words, and the chosen day writes back as words ("next Friday") when it can.
- [ ] **Times and durations**: "4pm" scrubs in 15-minute detents (part spring clicks, the haptic tick on a trackpad); "1h30" in 5-minute steps.
- [ ] **Colours**: "#FF6B3D" opens a swatch well; dragging on it shifts hue, with the text rewriting live.
- [ ] **Tags and people**: a tag cycles through your recent tags on scroll; a person's name opens a small picker.
- [ ] **The text stays the source**: every change rewrites the words in place (undoable as one step per gesture), the caret and layout never jump, and the line keeps its width through the change (the drum's footprint rule).
- [ ] **Affordance without clutter**: nothing shows at rest; on hover a cue's underline thickens and the cursor says it can move (ns-resize for numbers, a rotate cursor for enums); first-time hint in a tooltip ("Drag to change").
- [ ] **Accessibility**: each operable cue is a `spinbutton` (numbers, dates) or a listbox-like picker (enums) with a name ("Sleep, 6 hours"); keyboard does everything the pointer does. Reduce Motion: values change without the drum's travel.
- [ ] **Survey first**: go through every recognised kind (date, time, duration, amount, measurement, colour, tag, derived tag, link, person) and list what "changing it in place" means for each, before building; then build one kind at a time (numbers first).

## Snap guides: no haptic on the web

Owner, on the Snap guides page: "dragging on web doesn't trigger haptic feedback." (2026-09-30)

Facts: browsers expose no trackpad haptics on a Mac, and iOS Safari has no vibration API; `navigator.vibrate` works on Android only. The docs demo only counts taps ("haptic taps · 8 … the browser cannot") and doesn't even call `navigator.vibrate` where it exists. The Snap guides agent guide says: "Never replace a haptic with a sound or a flash."

- [x] **Call what exists** (done: `haptic()` and `setHapticBridge` in motion/haptic.ts; Snap guides only so far; the iOS switch path is untested on a real iPhone): a shared `haptic('alignment' | 'detent' | 'refusal')` helper in the motion layer: `navigator.vibrate` with a short pattern on Android; the iOS Safari (17.4+) trick of toggling a hidden `<input type="checkbox" switch>`, which plays the system tick, behind feature detection; a no-op elsewhere. Snap guides, Split pane detents, Slider detents and the operable cues (the entry above) all use it, once per catch.
- [ ] **In the Mac app**: the SwiftUI side already performs the alignment haptic; document how a web view host (Electron, Tauri, a WKWebView) bridges `haptic()` to `NSHapticFeedbackManager`, and ship that bridge as an optional hook.
- [ ] **Decide the fallback rule with the owner**: the guide forbids a sound or flash in place of a haptic. If the web should still *feel* the catch, the candidate is the line's own catch motion (the guide lighting with a tiny overshoot), which is already there, not a new sound. Record the decision in the guide.
- [x] Make the demo honest and useful: it calls `haptic()`, says which path this browser took ("vibrated", "iOS tick", "no haptics here"), and keeps the tap count.

## Library gaps found by building blocks

Building real screens shows what the components lack. Each was worked around inside the block; fix it in the library, then remove the workaround.

- [x] **Button**: compact primary/destructive now share compact dimensions. Previously `cap="primary"` ignored `size="compact"` (the AI composer's send key is 32 tall beside a 28 Select).
- [x] **ScrollArea**: typed `viewportRef` / `onScroll` expose the Base UI viewport while preserving the root ref. The AI composer uses this API instead of a class query; docs demonstrate imperative, keyboard and wheel scrolling.
- [x] **Icons available**: `send`, `stop`, `attach`, `retry` now have authored acts, native symbols and 16/24px references. Composer wiring remains part of the block migration below.
- [x] **Motion**: exported `motionReduced(element)` and reactive `useReducedMotion(element)` combine OS and scoped site preferences, update live, and are SSR safe. Blocks use the shared helper instead of token-reading copies.
- [x] **Tooltip Escape**: use Base UI's `allowPropagation()` on its Escape close request, so surrounding panels dismiss on the first keypress. Share panel uses ordinary bubbling; nested popover focus-return e2e covers both colorways.
- [x] **DropZone compact**: title and drum shrink and truncate before the choose-files text; full input name and picking remain accessible. Narrow-host docs, both colorways, reduced motion and Swift compact layout covered.
- [x] **Attachment**: error text owns its line with retry below, plates fill their host width, and `onLeaveStart` lets the list capture neighboring bounds before shared row removal. React/Swift use shared materials, remove callbacks, and immediate reduced-motion removal.
- [x] **A shared row-leave helper**: `leaveRow(element, onLeft, { onStart })` uses scoped release/nest tokens, suppresses repeated completion and cancels on cleanup. Row removal is immediate under OS or site Reduce Motion, including changes mid-leave; pressed-cap release feedback keeps its existing policy. Motion docs demonstrate removal and cancellation in both colorways.
- [x] **Switch**: optional visible `label` uses a native associated hit area. Blocks use associated labels instead of manual toggle handlers. Swift `showsLabel` keeps labels operable too; disabled and keyboard behavior covered.
- [x] **Calendar adjacent-month pointer selection**: focus leaves the day mounted until click; selection turns the month and keeps focus. Removed the availability picker's mouse-down workaround; both colorways and reduced motion covered by e2e.
- [x] **Calendar follows a changed controlled `value` into another month** unless the host controls `month`. Recreating the same day preserves browsing; removed the availability picker remount workaround.
- [x] **Calendar unavailable predicate**: `isDateUnavailable` announces its reason and refuses selection. Availability picker uses it for days without free times; scoped aria-label CSS removed.
- [ ] **Toggle has no radio-group form** (one latched key of several, like time slots); the library doesn't export Toggle's classes, so the block copies them. Add a `ToggleGroup` single-choice mode or a `RadioKeys`.
- [x] **Button has no waiting or done state** (see the Spinner entry: the wait lives in the key); blocks hold the key down and mark it `aria-disabled` by hand.
- [x] **Toast Undo shortcut**: ⌘Z / Ctrl+Z targets the focused undoable toast or the latest live undoable change and dismisses it. Text editing and prevented events retain their own Undo; `undoShortcut: false` lets the host own it. Native bindings also reach folded cards, with keyboard integration proof.
- [x] **ToolStrip** now accepts icons, menu children with controlled triggers and a leading count; the task inbox composes the shared strip. Selection intersections, anchored placement and overflow are covered in the Tool strip entry above.
- [x] **Button strip / graphite / link caps size an `icon` at compact 14** (noted with the icon slot); blocks pass `size-16`.
- [x] **Person / assign glyph available**: `person` reads as a portrait with a fixed shoulder enclosure and seated head, distinct from `me`. Assignment wiring remains part of the block migration below.
- [x] **Icon: `act` sequence plays a glyph's act on demand in React and Swift** for results; the inbox no longer dispatches a synthetic click.
- [x] **AlertDialog.Popup** forwards typed Base UI `initialFocus` / `finalFocus`.
- [x] **Avatar**: accessible label independent of initials (`aria-label`, also per group member; Swift `accessibilityLabel`). An empty label makes the disc decorative.
- [ ] **Row**: no selected / opened state for a list row; blocks borrow the option rail classes.
- [ ] **Task inbox polish**: while selecting, the selection box (14) and the completion box (16) sit side by side and look alike; make completion a distinct task dimple or a status glyph, or show selection only as the row's plate.
- [x] **Block glyph inventory available**: `person`, `bell`, `palette`, `save`, `send`, `stop`, `attach`, `retry`, `download`, `upload` all ship with semantic authored acts, web/Swift/native outputs and 16/24px references. Replacing the settings/composer/assignment usages remains the block migration below.
- [x] **Sidebar glyphs**: inert icon wrappers remove extra Chrome Tab stops in both expanded and collapsed rails; the enclosing link or toggle remains the icon trigger.
- [x] **Textarea size and counter**: regular/compact match Field’s UI type; large preserves prose. `counterThreshold` controls each instance, with omitted values read from the local recipe. Settings Bio uses size and an always-visible counter instead of copied CSS. Swift mirrors size/count policy; full native rendering remains explicitly WIP.
- [x] **Portalled popup colorways**: Select, Menu/ContextMenu and Popover copy the active anchor’s nearest colorway, follow live ancestor changes, and remain outside clipped hosts. Shared `usePortalColorway` keeps the policy in one place. Keyboard selection, focus return, both colorways and reduced motion covered.
- [x] **Vertical Tabs**: Base UI orientation controls axis-aware arrows and active-panel focus. Track and thumb reuse Switcher materials; panels drift on the matching axis. Swift has matching orientation. Settings uses real Tabs instead of Sidebar and local panel animation.
- [x] **RadioGroup disabled**: keep the checked option reachable to explain the held choice, following Base UI; skip unchecked disabled options. Guide and page require an `aria-describedby` reason. Settings keyboard e2e covers the held choice.
- [x] **Named block containers**: all six block roots use `@container/block`; whole-block variants use `/block`, and Settings fields use their intentional `/panel` scope. The block Usage guide and CSS system explain the rule. Integration checks insert nearer anonymous containers and vary the outer block width.
- [x] **AI composer thread edge**: the scroll viewport and its fade begin one related gap below the Assistant header. The first message keeps its own top padding; scrolling content no longer runs directly into the fixed title. Both colorways and reduced motion covered.

## SwiftUI on iOS

Completed 2026-10-02. `swift build` passes on macOS; `xcodebuild -scheme MetalUI -destination 'generic/platform=iOS Simulator'` builds arm64 and x86_64 with the package's iOS 17 minimum. An iOS 17.5 smoke app loads the custom symbols, renders the field/brush recipes, presents the palette with its keyboard, and handles the Fan on a native touch surface. Platform-specific adapters stay guarded; the geometry, material recipes, and motion tokens stay shared.

- [x] **Icons** (`Icons/MetalIcon.swift`): existing UIKit symbol loading and alignment-inset measurement verified in the iOS 17.5 app; UIImage's y-down centre delta is used without AppKit's y inversion.
- [x] **Fonts** (`Foundation/MetalFonts.swift`): system/mono faces and weight interpolation use NSFont or UIFont through a private platform alias. Core Text registration and variation axes stay shared.
- [x] **Fan** (`Components/MetalFan.swift`): UIKit observes taps outside the bar and its expanded options without consuming host gestures. Escape/arrows use iOS key presses; AppKit window monitoring stays macOS-only.
- [x] **Slider** (`Components/MetalSlider.swift`): AppKit cursor operations stay guarded; iOS uses FocusState and the same drag/keyboard/value geometry.
- [x] **Brush cursor** (`Components/MetalBrushCursor.swift`): UIKit renders the same token recipe into a canvas overlay (`view`) instead of setting a pointer cursor; its coordinate transform preserves the macOS drawing orientation.
- [x] **Spatial field** (`Components/MetalSpatialFieldView.swift`): existing platform-neutral Canvas and shared geometry sampler verified on iOS; AppKit's native adapter remains guarded.
- [x] **Snap guides** (`Components/MetalSnapGuides.swift`): iOS sensory alignment feedback fires only for newly engaged guide lines; AppKit keeps native alignment feedback.
- [x] **Command palette** (`Components/MetalCommandPalette.swift`): iOS uses its presentation container height and fits the available width; macOS keeps its screen/focus APIs. The Region rename field also uses iOS Escape handling instead of a macOS-only exit command.
- [x] Add the iOS Simulator build to `.github/workflows/ci.yml`, restore `.iOS(.v17)` in `Package.swift`, and restore iOS 17 in the README and generated agent guide.
