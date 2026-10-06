# Changelog

All notable changes to `@unlocalhosted/metalui`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/) (while the package is `0.x`, a minor version may change behaviour, and every such change is listed under **Changed**).

## Unreleased

## 0.4.1 - 2026-10-06

### Fixed

- **SwiftUI builds again on Xcode 16 (Swift 6.1).** 0.4.0 compiled only with Swift 6.4, so `swift build` and the iOS Simulator build failed on Xcode 16.4, CI's macOS runner included. Four expressions that newer compilers resolve implicitly are now explicit: `MetalButton`'s width conversion, two `Double`/`CGFloat` mixes in `MetalSlider`'s marks and ticks, `MetalStatus`'s lamp diameter, and `MetalEnumCue`'s body, which is split so the type-checker solves it in parts. Nothing changes on screen. Verified with `swift build` and the iOS Simulator build on Xcode 16.4.

## 0.4.0 - 2026-10-06

### Added

- **SwiftUI on iOS 17.** `Package.swift` now declares `.macOS(.v14), .iOS(.v17)`, and CI builds both macOS and the iOS Simulator. The AppKit-only parts got UIKit twins: icons, fonts, the Fan (closes on a tap outside, keys from a hardware keyboard), Slider, the brush cursor (drawn into the canvas, since iOS has no pointer cursor), snap guides (system selection feedback), the command palette (sized from its container) and ToolStrip arrow keys. `MetalHaptic` plays through UIKit feedback generators on iOS. `MetalHapticWebViewBridge` is macOS only.
- **30 new glyphs**, all morphable with `MorphIcon` and shipped as custom SF Symbols for `MetalIcon`. Transfer and record: `copy`, `save`, `download`, `upload`, `send`, `external`. Adjustment and visibility: `settings`, `filter`, `sort`, `eye`, `eye-off`, `lock`. Status and environment: `info`, `warning`, `sun`, `moon`, `sidebar`. Action and identity: `stop`, `attach`, `retry`, `person`, `bell`, `palette`. Levels: `volume`, `brightness`. Playback: `play`, `pause`. And `coin` (an amount of money), `spark` (a finished edit, played once) and `sidebar-collapsed` (the sidebar folded to its rail, so `sidebar` ↔ `sidebar-collapsed` morphs). The set grows from 49 to 79 glyphs.
- **Morphing in SwiftUI**: `MetalMorphIcon` (and `MetalMorphTurn`) is the same morph as React's `MorphIcon`. It runs the web planner itself (bundled as `MetalMorph.generated.js`), so both platforms take the same path from one glyph to the next. It plans only when the meaning or turn changes, and it stays still under Reduce Motion, while disabled and while the scene is inactive.
- `act` on `Icon` (React) and `act:` on `MetalIcon`: increase it after a host result to play the glyph's act once. A trigger that arrives during an act is ignored.
- **Hold to confirm** on `Button`: `hold` (`true` for 800 ms, or a number of milliseconds) on the destructive and strip-danger caps. Pointer, Space and Enter share one clock. Letting go early, leaving the cap, blur, Escape or a hidden tab cancels, and the action never runs. A short tap shows "Hold to confirm". A darker red fill grows across the cap, and the trash glyph's lid opens during the hold and closes on confirmation. `AlertDialog.Confirm` takes `hold` and `icon`. SwiftUI: `MetalButton(..., hold: true)`, with long press, held Space or Return, and an accessible Confirm action.
- **Async actions in the key**: `Button` `state` (`'idle' | 'waiting' | 'done' | 'error'`, type `ButtonState`) with `waitingLabel`, `doneLabel` and `errorLabel`. The key keeps room for its glyph and its widest label, so its width never changes. The waiting arc appears after `showDelay` (400 ms) and stays for at least `minVisible` (300 ms). The key refuses repeat presses while waiting or done, and announces start and result once through a polite status outside the busy key. `iconOnly` makes a square glyph key that still shows the wait and the result. SwiftUI: `MetalButton(..., state:, waitingLabel:, doneLabel:, errorLabel:, iconOnly:)` and `MetalButtonState`.
- **A shared waiting foundation**: tokens `--mu-waiting-show-delay` (400 ms), `--mu-waiting-minimum-visible` (300 ms) and `--mu-waiting-long-after` (10 s), plus the `useWaiting(state, ref, timing)` hook, which returns `phase` and `long`. `Spinner` adds `active` (stay mounted and switch it), `announce`, a numeric `size` (a host's glyph diameter), `showDelay` and `minVisible`. SwiftUI: `MetalWaiting`, `MetalWaitingPresentation`, `MetalWaitingShape`, and `MetalSpinner(diameter:)`.
- **Calendar ranges and eligibility**: `mode` (`single`, `range`, `multiple`, typed `CalendarMode`, `DateRange` and `CalendarValue`), inclusive `minDays` and `maxDays`, `isDateUnavailable` with `unavailableLabel` (unavailable days can still be focused but not chosen), `weekStartsOn`, ISO `weekNumbers`, `months={2}`, `markedDays`, `readOnly`, a controlled displayed `month` with `onMonthChange`, and `today`. The title opens a month and year picker. SwiftUI: `MetalCalendar` with `selection:`, `range:` (`MetalDateRange`) or `dates:`, plus `.calendarMonths`, `.calendarLocale(_:weekStartsOn:weekNumbers:)`, `.calendarUnavailable`, `.calendarMarks`, `.calendarReadOnly` and `.calendarTimeZone`.
- **Date picker forms and time zones**: `DatePicker` takes `name` (submits `YYYY-MM-DD`, `start/end` or a comma-separated list), `required`, `readOnly`, `presets` (`DatePickerPreset`), Clear and Today. It also takes `showTime` with `timeZone`, `defaultTimeZone`, `onTimeZoneChange` and `timeZones`: the value is then an instant, and a wall-clock time that falls in a DST gap is refused. `FormField` labels, descriptions and errors reach the typed segments. SwiftUI: `MetalDatePicker` with the same contracts.
- **Slider ranges, vertical sliders and detents**: an array `value` or `defaultValue` draws a range, with `minStepsBetweenValues` and `thumbs` (a name and a disabled flag per knob). Also `orientation="vertical"` with `height`, `centered`, `tone="neutral"`, `detents` (one haptic catch per accepted step), `valueBubble` and `knobIcon`. Page Up and Page Down take large steps, and arrows follow RTL. `onValueChange` also receives Base UI's change details. SwiftUI: `values:`, `minStepsBetweenValues:`, `thumbLabels:`, `disabledThumbs:`, `orientation:`, `centered:`, `tone:`, `detents:`, `valueBubble:` and `knobIcon:`.
- **Radio keys** (`RadioKeys`, with `RadioKeys.Key`, `RadioKeysProps` and `RadioKeyProps`): one form value chosen from latching caps, such as time slots. It is a real radio group with one Tab stop and a hidden native input for `name`, and it takes `required` and `readOnly`. SwiftUI: `MetalRadioKeys`. `ToggleGroup joined` sets toggles in the machined Button group bar.
- Button group: `ButtonGroup` takes `cap` (`standard`, `primary`), `size`, `disabled` (passed to every key) and `rocker`, an optional tilt for exactly two keys. `ButtonGroupReadout` is a value window that is never a tab stop, for a zoom level between two keys. SwiftUI: `MetalButtonGroupReadout`, `MetalButtonGroupToggle` and `MetalSplitButton`.
- **Progress states and shapes**: `state` (`idle`, `running`, `paused`, `failed`, `cancelled`, `complete`; type `ProgressState`), `shape` (`bar`, `slim`, `ring`, `segmented`, `buffered`; type `ProgressShape`), `size` (`compact`, `regular`), `segments`, `buffer`, `detail` and `completeLabel`. Failed shows `sync-error` and complete shows `check` once the fill has finished. SwiftUI: `MetalProgress(..., state:, shape:, size:, steps:, buffer:, detail:, completeLabel:, showValue:)`.
- **Toast results that stay on one card**: `toast.update(id, options)` replaces a live card in place, and `toast.promise(work, { loading, success, error })` (`ToastPromiseOptions`) holds one loading card until the work settles. `glyph` sets a state shape such as `synced`, `offline` or `sync-error`, and `undoShortcut: false` leaves ⌘Z to the host. SwiftUI: `deck.show(_:)` now returns the card's id, plus `deck.update(_:_:)`, `deck.promise(...)`, and `glyph:`, `timeout:` and `undoShortcut:` on `MetalToastModel`.
- **Cues you operate inside the text**: `ColourCue` (hue), `NumericCue` (a quantity with units, scrub and keyboard steps), `EnumCue` (a host's finite states), `DateCue` (a civil day, with `relativeDateWords`), `TagCue` (recent tags, and `TagCue.Picker` for a half-typed `#`), `PersonCue` (known names) and `LinkCue` (edit the written URL; the link stays a real link). Each one edits the source words only after a deliberate gesture, records one Undo per gesture, cancels on Escape, and reserves its widest face so neighbouring words never move. `CueDocument` and `useCueDocument` (`CueSelection`, `CueSourceRange`, `CueDocumentSnapshot`) keep the source text, its UTF-16 selection and its history. SwiftUI: `MetalColourCue`, `MetalNumericCue`, `MetalEnumCue`, `MetalDateCue`, `MetalTagCue`, `MetalTagCuePicker`, `MetalPersonCue`, `MetalLinkCue` and `MetalCueDocument`.
- Mark: `MarkLine` (`presentation="semantic" | "reading"`) sets a sentence of cues on one baseline with room for meaning glyphs. `Mark` takes `meaning` (`time`, `money`, `sleep`, `steps`, `colour`, `person`), `meaningLabel`, `meaningGlyph`, `raw`, `recognition` (plays the recognition once per identity), `formatted` and `inferred`. `tagColor` and `tagIdentity` give a tag its stable colour. SwiftUI: `MetalCueText`, `MetalCueInferred(confirmed:onConfirm:)` and `.metalCuePresentation(.documentLine)`. `ProvenanceTooltip` takes `disabled` (SwiftUI `enabled:`) to stay shut while a cue is being operated.
- **Rename editor** (`RenameEditor`, `MetalRenameEditor`): the name field and its confirm key, for a popover or dialog. It selects the basename without the extension, validates, locks while saving, keeps a failure for retry, and passes the original name to `onRenamed(name, original)` for Undo. `MetalDialog` takes `dismissible:` and draws no empty footer when it has no actions.
- `MenuCheckboxItem` (`MenuCheckboxItemProps`): a menu row that ticks with the checkbox's pen, with `indeterminate` and `closeOnClick` (false by default). SwiftUI: `MetalMenuItem(..., checked:, indeterminate:, closeOnSelect:)`.
- Status badge: `tone` (`default`, `quiet`, `strong`; type `StatusTone`), `surface` (`solid`, `transparent`, `frosted`; type `StatusSurface`), `solid`, `gesture`, and `glyph` (`synced`, `offline` or `sync-error` in place of the lamp, morphing as the words change). SwiftUI `MetalStatusBadge` matches.
- Link: `visited`, `disabled` with `disabledReason` (still focusable, so the reason can be read), `loading` (a sweep under the words while a route loads), `download` with `fileSize`, `kind` (`inline`, `quiet`, `standalone`) and `aria-current="page"`. SwiftUI: `MetalLink(..., external:, visited:, current:, disabled:, disabledReason:, loading:, download:, fileSize:, kind:, action:)`.
- Fan: `Fan.Action` (a glyph key with a tooltip), `Fan.Ink` and `Fan.Width` (named groups of inks and stroke widths), and `label` on `Fan.Label`, so a glyph can name the context. SwiftUI: `MetalFanAction`, `MetalFanInk`, `MetalFanWidth` and `MetalFanLabel(_:icon:)`.
- Tool strip: `selection` and `verbSets` with `verbsFor` (`ToolStripSelection`, `ToolStripVerbSets`) offer only the verbs shared by every selected kind. `anchor` and `boundary` place the strip above a selection and flip or shift it at the edges. `maxVisible` folds extra verbs into More while keeping the destructive verb visible. Items take `icon`, `menu`, `disabledReason`, `busy` and `irreversible` (hold to confirm). SwiftUI: `metalVerbsFor`, `MetalToolStripSelection`, and `anchor:`, `viewport:` and `maxVisible:`.
- Attachment: `uploadState` (`AttachmentUploadState`) shows an explicit complete or failed receipt, and its glyph morphs between upload, check and sync-error. The host decides completion; reaching 100 % never implies success. `onLeaveStart` fires before the removal motion. SwiftUI: `uploadState:` and `onLeaveStart:`.
- Drop zone: `glyph` (`document` by default, or `image`) morphs to `check` on receipt and `close` on refusal, then returns after 1.6 s. SwiftUI `MetalDropZone` adds `icon:`, `maxSize:`, `multiple:`, `compact:` and `onRefused:` (`MetalDropRefusal`).
- Tabs: `orientation="vertical"` for settings panels, and `aria-describedby` per item. SwiftUI: `orientation: .vertical`.
- Textarea: `size` (`regular` and `compact` use Field's UI type; `large`, the default, keeps prose type) and `counterThreshold`. SwiftUI: `size:` and `counterThreshold:`.
- Row: `selected` (a persistent selected plate, with `aria-selected` for row, option, treeitem and tab roles) and `opened` (a leading rail for the row whose detail is open). SwiftUI: `selected:` and `opened:`.
- Checkbox: `mixed`, for a select-all with some children checked.
- Switch: `label` renders visible words that toggle it too. SwiftUI: `showsLabel: true`.
- Avatar: `aria-label` (also on each `AvatarGroup` entry) names the person independently of the initials; `""` hides it from assistive tech. SwiftUI: `accessibilityLabel:`.
- Scroll area: `viewportRef` for the scrollable element, and `onScroll` now listens on the viewport, so wheel, keyboard and programmatic scrolling all reach it.
- Popover: `Popover.Content` takes `anchor`, to open from an existing input without a wrapper button. `AlertDialog.Popup` passes on Base UI's `initialFocus` and `finalFocus`.
- Combobox: `defaultOpen`, `autoFocus` and `renderItem`.
- Tooltip: `onOpenChange`.
- Sidebar: `Sidebar.Toggle` draws the `sidebar` / `sidebar-collapsed` morph by default (`icon` is optional now). SwiftUI: `MetalSidebarToggle(collapsed:)`.
- Meter (SwiftUI): `showValue:`, `valueText:`, `warn:`, `danger:` and `bad:`, matching React.
- **Layout foundations**: `--mu-space-0` … `--mu-space-80`, `--mu-layout-gap-related` (12), `--mu-layout-gap-group` (24), `--mu-layout-gap-section` (48), `--mu-layout-column-min` (240) and a line height for every type role (`--mu-type-*-line`). Tailwind gets `mu-stack`, `mu-cluster` and `mu-auto-grid`, the `*-mu-space-N` steps and `gap-mu-related`, `gap-mu-group` and `gap-mu-section`. SwiftUI: `MetalLayout`.
- Motion helpers: `motionReduced(element)` and `useReducedMotion(element)` read the OS preference and MetalUI's scoped switch (`data-mu-motion="reduce"` or `.rm` on an ancestor). `leaveRow(element, onLeft, { onStart })` makes a row leave one nest down and can be cancelled. SwiftUI: `.metalReduceMotion()` reduces motion for a subtree and adds to the system setting, and `MetalMotionPreference` reads both.
- Colorway across portals: `usePortalColorway(anchor)` copies the nearest `data-mu-colorway` onto a portalled popup and follows live changes.
- Haptics in a Mac web view: `connectWebKitHaptics()` routes `haptic()` to the new SwiftUI `MetalHapticWebViewBridge` (macOS) on a `WKWebView`. `setHapticBridge` now returns a cleanup function that never removes a newer host's bridge. SwiftUI: `MetalHaptic` (`.alignment`, `.detent`, `.refusal`).
- shadcn registry: items for every new component (the seven cues, `rename-editor`), plus shared `morph-icons`, `tick-glyph`, `colorway`, `cue-document` and `life-icons` items that components now depend on.

### Changed

- **Status lamps are re-cut.** An `Led` is now an 8 lens in an opaque dark socket (10 overall; small is 6 in 8). It was a bare 5 or 4 dot. Every lit kind has the same soft halo in new per-colorway inks (`--mu-r-status-ink-*`, measured in `docs/STATUS-COLORS.md`). Status badge words are 12 px sans at 0.01em; they were 9.5 px mono at 0.1em. Meter segments sit in the same socket inside their existing footprint. SwiftUI follows.
- **Lamps behave by default.** `waiting` now breathes and `failed` double-blinks once unless you pass `gesture`; `off` always stays dark. In 0.3.3 every lamp held steady. Pass `gesture="steady"` when amber names a static fact (Avatar presence already does). Looping lamps pause off screen, in a hidden tab, and inside a hidden hover engraving. `MetalLED` matches.
- **Button group is one machined bar.** There used to be separate caps in a sunk tray. Now one raised cap is cut by engraved seams, with square inner faces and only the outer ends rounded; one key sinks and its neighbours stay still. A `ButtonGroup` now applies its own `cap`, `size` and `disabled` to the `Button`s inside it, so a `cap` set on a child is replaced (use `cap="primary"` on the group). `SplitButton` takes its cap and size from its main Button, and its chevron morphs down ↔ up instead of rotating. `MetalButtonGroup` is no longer a placeholder.
- **Controls use the shared glyphs in place of their own drawings.** Accordion, Select, Navigation menu, Split button and Calendar navigation use the shared `chevron`, and a state change now morphs on the settle spring instead of rotating on the part spring. Table sorts with `arrow`. Breadcrumb separators are `chevron`, and the fold key is `more` instead of "…". Pagination uses `chevron`, Combobox clear and Attachment remove use `close`, and Number field steps use `minus` and `plus`. External links and Link card's OPEN use `external`; Link card's OPEN loses its "↗". Past banner and Time scrubber show `clock` on their return key, and Suggestion chip uses `check` and `close`. The chosen row in a Select list is now marked with the checkbox's tick pen, not a green LED.
- **Toast**: each card shows its kind's glyph (`info` for default and loading, `check`, `sync-error`), which morphs as its title turns on the drum. ⌘Z or Ctrl+Z anywhere outside a text field now runs the focused card's Undo, or else the newest one's, and dismisses it; set `undoShortcut: false` to keep the shortcut yourself. Pressing Undo now also dismisses the card. Folded cards share the front card's width, the `+N` count sits in the back card's edge, and one polite status reads the front card. The SwiftUI deck has the same shortcut and folding.
- **Tags look like tags.** A `tag` Mark is a raised tab with a punched hole, in full ink with a stable tint from its name (`tagColor`). It was an ink2 soft pill. A derived tag is dashed until a host confirms it.
- **Spinner** takes the host's ink and glyph size: no sunk well and no fixed green arc. It is a `status` only while it shows. `MetalSpinner` follows and is no longer a placeholder.
- **Date picker**: the field now shows the browser's typed date segments plus a calendar key, not one button showing the formatted date (`editable={false}` restores the button face). `onValueChange` now passes `null` when the field is cleared. The callback is typed by `mode` (`CalendarValue`).
- Attachment fills its host's column; the 240–360 width clamp is gone. Its status line leads with a glyph, and a failure puts Try again on its own line, so the plate grows. `MetalAttachment` is no longer a placeholder.
- Drop zone always shows its glyph well (`document` by default). Before, the well appeared only when you passed `icon`. `MetalDropZone` is no longer a placeholder.
- Link: the hairline grows thicker on hover from the side the pointer entered, a faint row tint appears, and a press sinks the words. The external mark is the 14 `external` glyph instead of a 0.72em arrow. `MetalLink` now renders these states.
- Fan: the picker unfolds as a grouped grid of three columns that arrows move through in two dimensions. A tray wraps on narrow hosts, and its width change scales the material instead of animating `width`.
- SwiftUI `MetalCalendar` draws MetalUI's own six-row grid instead of the system graphical `DatePicker`. `MetalProgress`, `MetalMeter` and `MetalToggle` render MetalUI materials, and `MetalNumberField` uses MetalUI step keys instead of the system `Stepper`. None of these are placeholders any more, so their native look changes.
- Motion that JavaScript drives now follows reduced motion set on a scope, live, and not only the OS setting: icon acts, `MorphIcon`, `Led`, `Spinner`, Slider jumps and `leaveRow`. The scope is `data-mu-motion="reduce"` or `.rm` on any ancestor. The Skeleton sheen also stops under `.rm`.
- shadcn registry: the `tokens` item and all six blocks now require `@unlocalhosted/metalui@^0.4.0` (they required `^0.3.3` and `^0.3.0`, which on 0.x exclude 0.4.0, so `shadcn add` would have installed 0.3.x under components that need the new tokens).

### Removed

- CSS variables `--mu-r-status-led-*` (use `--mu-r-status-lamp-*`, `--mu-r-status-socket-*` and `--mu-r-status-ink-*`) and `--mu-r-select-led-size` and `--mu-r-select-led-slot` (now `--mu-r-select-mark-glyph` and `--mu-r-select-mark-slot`). Also the theme names `--spacing-status-led-size`, `--spacing-status-led-size-small`, `--spacing-select-led-size` and `--spacing-select-led-slot`, and the `tokens.json` keys `recipes.status.props.led` and `recipes.select.props.led`.
- Tailwind utilities `accordion-chevron`, `button-group-chevron`, `navigation-menu-chevron`, `select-led`, `select-led-slot` and `duration-spinner-delay`. The chevrons now morph through `MorphIcon`, and the spinner's delay is the waiting foundation's.

### Fixed

- Glyph morphs choose cleaner paths, on both platforms, because SwiftUI runs the same planner:
  - A part that a tinted body already covers now gathers into a wire that stays, instead of switching off. The plus's upright no longer vanishes on the first frame of plus → minus, and the sidebar's rail marks and the warning dot no longer pop in at rest.
  - A closed ring hides a lone part whatever its shape, so in play → pause the second bar slides out from behind the shrinking triangle instead of budding from its edge.
  - A small tinted mark may now fold flat, so send → stop no longer hooks through the middle.
  - On React, a `MorphIcon` under reduced motion changes its glyph in the same render, so `data-glyph` no longer names the new icon for one frame while the old one is still drawn.
- `--mu-spring-chrome` was `linear(NaN, …)` in 0.3.3, so anything eased with it had no valid curve. It is now sampled correctly.
- Importing one component no longer bundles every other component's recipe data: the package keeps an entry chunk per component.
- Select lists, Menu and ContextMenu popups, and Popovers keep the colorway set on the element that opened them (a nearby `data-mu-colorway`), including when it changes while they are open. Before, they took the document's colorway.
- An Escape that closes a Tooltip now reaches the panel around it, so a surrounding popover or sheet closes on the first Escape.
- Compact `primary` and `destructive` Buttons are now compact (26 tall). The `link`, `graphite` and `strip` caps size their glyph at 14.
- Calendar keeps the displayed month separate from day focus. Focusing a day of a neighbouring month no longer swaps its button, and recreating a `Date` for the same day keeps the month being browsed.
- Sidebar item glyphs no longer add tab stops in Chrome.
- A compact Drop zone truncates its title inside a narrow host instead of overflowing.
- Checkbox, Select and menu ticks settle to their full stroke under reduced motion.
- `ProvenanceTooltip` adds its source to the cue's own `aria-description` instead of replacing it.
- SwiftUI: icons stop playing while disabled or while the scene is inactive. `MetalNumberField`'s step keys have their own names and repeat while held.
- shadcn registry: components that use `MorphIcon` now install it (`morph-icons`), and `suggestion-chip` lists its icons dependency. Installed blocks name their container queries (`@container/block`), so a nested container no longer changes their layout. The AI composer's scroll fade no longer covers its title.

## 0.3.3 - 2026-10-01

### Added

- `@unlocalhosted/metalui/styles.unlayered.css`: `styles.css` without cascade layers, for Tailwind v3 apps (their PostCSS plugin rejects `@layer` rules it has no `@tailwind` directive for, so `styles.css` failed their build). Same rules in the same order; verified in a Vite + Tailwind 3.4 app: styled, interactive, and the host's own `p-4` still 16px.

### Changed

- **Tertiary text and engraved labels now meet WCAG AA (4.5:1) in both colorways.** `ink3` was 2.5:1 on Bone and 3.1 to 4.3:1 on Graphite, and `engrave` 2.7:1 and 3.3 to 3.6:1. Bone `ink3` is now `#6C6C6F` (was `#9A9A9D`), Graphite `ink3` `#939397` (was `#77777B`), and `engrave` is `rgba(40,38,32,.65)` on Bone (was .46) and `rgba(255,255,255,.49)` on Graphite (was .38). Placeholders, captions, hints, counts, tags and engraved labels read a little firmer; ink and ink2 are unchanged. SwiftUI tokens follow.
- The mini icon button (the accept and reject marks inside chips) has a 24 × 24 hit area (WCAG 2.5.8); it looks the same.
- SwiftUI package: `Package.swift` declares macOS 14 only. It listed iOS 17, but eight files use AppKit and the package does not build for iOS; the README, agent guide and `docs/BACKLOG.md` ("SwiftUI on iOS") say so, with the file-by-file port list.

### Fixed

- The npm tarball no longer contains `dist/index.css`, an unreferenced duplicate of `icons.css` (13 kB smaller packed). Nothing imported it; import `icons.css` for icons as before.
- The landing page has a `<main>` landmark and one (visually hidden) `<h1>` once it renders, so it has a heading structure for assistive technology.
## 0.3.2 - 2026-10-01

### Fixed

- TypeScript projects on the legacy `moduleResolution: "node"` can now import `@unlocalhosted/metalui/icons`, `/icons/life` and `/sound` with types (`typesVersions`). CI runs `publint` and are-the-types-wrong on every change.
- Server rendering on React 18 no longer logs `useLayoutEffect does nothing on the server` (25 warnings for Calendar, Checkbox, Combobox and others): components use one shared `useIsoLayoutEffect`, a layout effect in the browser and a plain effect on the server. The shadcn `motion` item includes it.

## 0.3.1 - 2026-10-01

### Fixed

- `theme.css` no longer redefines `--spacing`, `--font-sans` or `--font-mono`. Importing it into an app with its own Tailwind (the shadcn route) used to set the spacing scale to 1px per step, shrinking that app's `p-4`, `gap-2` and `h-10` to a quarter of their size, and to replace its fonts. It now adds names of its own only, so the host's layout and fonts are untouched. `check:host-safe` keeps it that way. The `styles.css` build is unchanged.
- shadcn registry: the `tokens` item imports `tokens.css` and `theme.css` from `@unlocalhosted/metalui` instead of a copied path that Next.js could not resolve; it works in Vite and Next.js (`app/` and `src/app/`) with no edits.
- `Icon` is marked `'use client'` in source, so a copy of it works as a Next.js client component.

## 0.3.0 - 2026-10-01

### Added

- **Blocks in the shadcn registry**: Settings, Studio week, Task inbox, Share panel, AI composer and Availability picker install with `npx shadcn@latest add https://metalui.dev/r/block-<name>.json`, into `components/metalui/screens/<name>/`; they need this package installed.
- **Radio group** (`RadioGroup`, `Radio`): one choice from a short list; the pressed well darkens, releasing latches a pip in while the old one drops out.
- **Textarea** (`Textarea`): grows with what is written between `minRows` and `maxRows`; with `maxLength`, a counter appears near the limit and refuses writing past it.
- **Popover** (`Popover`): a small panel that rises out of its trigger; `Title`, `Description`, `Body`, `Close` slots.
- **Alert dialog** (`AlertDialog`): a question that must be answered; focus starts on Cancel, a click outside is refused.
- **Progress** (`Progress`) and **Spinner** (`Spinner`): a task's progress, known or unknown; steady work that shows only after a beat.
- **Number field** (`NumberField`): step, scrub or type a number; the value turns like a counter drum.
- **Toggle** and **Toggle group** (`Toggle`, `ToggleGroup`): latching push buttons with a lamp.
- **Accordion** (`Accordion`): sections that open in place.
- **Meter** (`Meter`): a level in a range as lit segments, coloured by position (`bad="low"` for a battery).
- **Sheet** (`Sheet`): a panel from the right or bottom edge that follows a drag.
- **Scroll area** (`ScrollArea`): the system's own scrollbar and edge fades.
- **Checkbox group** (`CheckboxGroup`): choices with an optional parent that ticks them in a cascade.
- **Combobox** (`Combobox`): type to find one of many.
- **Form field**, **Fieldset** and **Form** (`FormField`, `Fieldset`, `Form`): labels, descriptions and errors tied to any control; invalid and disabled reach every control inside; `Form` validates on submit and focuses the first field not accepted.
- **Field** sizes `regular` (32) and `compact` (28) for forms, with a visible focus ring; `invalid` and `disabled` on `Field`.
- `invalid` on `Combobox` and `NumberField`; `size` on `Combobox`.
- Checkbox has a pressed state; checkbox group rows press from anywhere on the row.
- A foundation for invalid: `--mu-invalid` per colorway, `--mu-invalid-width`, and the `invalid-ring` utility; `MetalRing.invalidWidth` in SwiftUI.
- `buttonParts` (the button cap's frame and size without its press) for keys that travel their own way.
- **Skeleton** (`Skeleton`): the shape of content still loading, with a slow sheen.
- **Link** (`Link`): inline text that goes somewhere; an external link carries a small arrow.
- **Button group** and **Split button** (`ButtonGroup`, `SplitButton`): caps joined into one bar; an action with a menu of its variants.
- **Breadcrumbs** (`Breadcrumbs`): the way back up; long trails fold into a menu.
- **Pagination** (`Pagination`): pages of results; the current page's lift glides between numbers.
- **Menubar** (`Menubar`): an app's menus in a row; moving along the bar opens the next at once.
- **Navigation menu** (`NavigationMenu`): site sections whose panels open under the bar.
- **Preview card** (`PreviewCard`): a glance at where a link goes, on hover or focus.
- **Calendar** and **Date picker** (`Calendar`, `DatePicker`): a month of days; the chosen day lands with a small press.
- **Avatar** (`Avatar`, `AvatarGroup`): a person, as a photo or initials, with presence.
- **Card** (`Card`): a person's thing on a raised plate that lifts when it can be opened.
- **Attachment** (`Attachment`, `formatBytes`): a file someone attached, with upload progress and failure.
- **Table** (`Table`): rows that travel to their places when sorted; selectable rows.
- **Empty state** (`EmptyState`): a place with nothing in it yet, and how to start.
- **Split pane** (`SplitPane`): two places with a divider you can move, with a detent at the default.
- **Sidebar** (`Sidebar`): an app's side place that folds to a rail with tooltips.
- **Drop zone** (`DropZone`): a place that receives files by drop or by picking; it lights while files are dragged in the window and refuses what it won't take.
- `disabled` on `Tooltip`, to keep it shut without changing the tree.
- A shadcn registry entry for every new component at `https://metalui.dev/r/<name>.json`.

### Changed

- The modal layer (Dialog, Alert dialog, Sheet) moves from `z-index` 30 to 50, above page chrome and still under menus and popovers (60). If your app puts chrome between 30 and 50, it now sits under open dialogs.
- The modal scrim is stronger: half the colorway's own tone with a light backdrop blur (nearly opaque under Reduce Transparency).
- Select, Radio and Textarea draw the shared invalid ring; the recipe values `select.error.*`, `radio.error.*` and `textarea.error.*` are gone (use `--mu-invalid` and `--mu-invalid-width`).
- `Field.Input` and `Textarea` render Base UI's field control, so inside a `FormField` they take its label, description, error and states.

### SwiftUI

- `MetalRadioGroup`, `MetalTextarea`, `MetalPopover`, `MetalAlertDialog`, `MetalProgress`, `MetalSpinner`, `MetalNumberField`, `MetalToggle`, `MetalAccordion`, `MetalMeter`, `MetalSheet`, `MetalScrollArea`, `MetalCheckboxGroup`, `MetalCombobox` and `MetalFormField` exist as work-in-progress placeholders with the React API's shape; web is the reference until they are finished.

### Fixed

- shadcn registry: `add …/button.json` now imports `tokens.css` and `theme.css` into your global CSS, so a copied component is styled. Files land under `components/metalui/` in the same layout as the package, so imports between components, `motion` and `icons` resolve; shared code comes as `motion`, `icons` and `icon-components` items, and each item lists the components it uses. Removed components are no longer served.

## 0.2.1

Earlier releases are recorded in the git history and tags (`v0.1.0`, `v0.2.0`, `v0.2.1`).
