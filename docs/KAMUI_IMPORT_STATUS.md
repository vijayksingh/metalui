# Kamui import status

Tracks every step of Kamui's import plan (`kamui/docs/design/system/10-metalui-import.md`) against what has shipped here. The plan stays in Kamui, untouched; this file is MetalUI's ledger. One step is one commit. Kamui's two clients (the TanStack web app and the native Mac app) keep a temporary twin of each object until the row below says **shipped**, then switch to the import path in the last column.

Status words: **shipped** (committed, checks green, verified in the docs site), **pending** (not started), **in progress**. Owner gates are listed where the plan puts them; a gate is a review, not a blocker for later layers that don't depend on it.

## 1. Foundations

| Step | What | Status | Commit | Clients import |
|---|---|---|---|---|
| 1.1 | Feelings tints (DS-42) | shipped | `f62be7b`, `cc51e40`, `fd138e2`, `bb965e9`, `4b9bbc7` | `--mu-tint-*`, `.mu-tint-*`, `[data-mu-untinted]`; Swift `MetalTint`, `.metalTint(_:)`, `.metalUntinted()` |
| 1.2 | Signals: success, warning, LED blue/off, photon | shipped | `6aa4edc` | `--mu-success`, `--mu-warning`, `--mu-photon`, `--mu-led-*`; Swift `MetalShared.success` … |
| 1.3 | Swift foundations | shipped | `f997ea3` | `MetalRadius`, `MetalSpace`, `MetalHeight`, `MetalIconSize`, `MetalRing`, `MetalType` |
| 1.4 | Fonts (Geist, Martian Mono, Doto) | shipped | `6e55d35` | `MetalFonts.register()`, `Font.metal(_:)` |
| 1.5 | Motion policy (Reduce Motion per spring class) | shipped | `b1627a1` | `--mu-travel-*`, `data-mu-motion="reduce"`; Swift `MetalMotion.resolve`, `.metalAnimation(_:value:)`, `withMetalAnimation` |
| Gate 1 | Owner review: color, type, space, motion pages | awaiting owner | | |

## 2. Materials

| Step | What | Status | Commit | Clients import |
|---|---|---|---|---|
| 2 | Frosted recipe + Reduce Transparency twin | shipped | `fee6d2d` | `.mu-frost-strip\|plate\|graphite`, Tailwind `material-frost-*`, `--mu-backdrop`, `--mu-frost-opaque`, `--mu-contrast-edge`, `data-mu-transparency="reduce"`; Swift `MetalFrost`, `.metalFrost(_:in:)`, `MetalRecipe(backdrop:opaqueFill:contrastEdge:)` |
| Gate 2 | Owner sign-off on frost parity | awaiting owner | | |

## 3. Icons

| Step | What | Status | Commit | Clients import |
|---|---|---|---|---|
| 3.1 | Life set source, subpath and manifest | shipped | `5f27616` | `import { LifeIcon, LifeCoffeeIcon, searchLifeIcons, LIFE_CATALOG } from '@unlocalhosted/metalui/icons/life'` + `@unlocalhosted/metalui/icons/life.css`; `@unlocalhosted/metalui/icons-life.json`; SVGs under `public/icons/life/{svg,svg/16,svg-animated}` |
| 3.6 | SF Symbols + `MetalIcon` / `MetalLifeIcon` | shipped | `730ff1f` | Swift `MetalIcon(.sendAway, size: 16)`, `MetalLifeIcon(.coffee, size: 16)` / `(… tint:)`, `Image(metal:)`, `Image(metalLife:)`, `MetalIconName`, `MetalLifeIconName`, `.metalIconInteraction(_:)` (MetalButton sets it); symbols `mu.<name>`, `mu.<name>.16`, `mu.life.<name>`, `mu.life.<name>.16` in the package bundle. Limitation: native life hovers are one `.bounce.byLayer`, not the authored per-glyph interactions; one part (`mu.life.cycle.16` primary #2) keeps Regular geometry at every weight. |
| 3.2 | Life gallery page | shipped | `a50af15` | metalui.dev/icons/life; `searchLifeIcons(query)` for synonym search |
| 3.3 | Feelings construction and lint | shipped | `a8077b3` (hopeful under K1), `d932a52` | `node scripts/icon-lint.mjs --feelings` / `--life`; ICON-GRAMMAR §K; composer on /icons/life |
| 3.4 | Feelings grid | shipped | `6bcb380` | metalui.dev/icons/life#the-feelings-grid (docs only) |
| 3.5 | Grammar (K3 fixes, one per glyph) and life morph pairs | partial | `725d387` | Scored: all 30 declared feelings pairs are under 1 (the feelings are a morph space by construction); nap ↔ bad-night .25; weather 1.36–1.88; sleep ↔ nap 2.62; time markers, tired/rested are out of the family (the sun and the battery bars are solid plates, K0). Pending: the 19 K3 redraws (docs/icon-grammar/LIFE-LINT.md) and the time-marker suns as beads, one glyph per commit after owner review; a life `MorphIcon` runtime (life morph geometry is not generated yet). |
| 3.7 | Medium chrome glyphs (one per commit) | shipped | proposals `docs(icons): medium chrome glyph proposals`; `0cdf211` plus, `31ed76a` region, `809a286` task, `c7289b0` tag, `52523a7` calendar, `98a4c9a` document, `20de8e6` clock, `3b18500` me, `36c150b` seed | `PlusIcon`, `RegionIcon`, `TaskIcon`, `TagIcon`, `CalendarIcon`, `DocumentIcon`, `ClockIcon`, `MeIcon`, `SeedIcon` (or `<Icon name="region" />`) from `@unlocalhosted/metalui/icons`; Swift `MetalIcon(.region)` …; symbols `mu.region` …. write → `text`, ink → `draw`, lens → `search`. task ↔ check rides the drum (strain 1.94). |
| Gate 3 | Owner review: life gallery, feelings grid, SF Symbols preview | awaiting owner | | |

3.6 runs before 3.2–3.5 because both clients need the glyphs on screen before they need the gallery.

## 4. Rule amendments

| Step | What | Status | Commit |
|---|---|---|---|
| 4 | T5 split into hover lift (`settle`) and land (`object`); Button anatomy reads Geist 12.5 | shipped | `b58264e` (Button already read Geist 12.5 from `6e55d35`) |

## 5. Objects, one at a time

| Order | Object | Status | Commit | Clients import |
|---|---|---|---|---|
| 1 | Selection frame (KAMUI-14) | shipped | `5602645` | React `import { SelectionFrame } from '@unlocalhosted/metalui'` (`state`, `variant`, `mode`, `radius`, `handles`, `count`, `copied`, `edge`, `onHandlePointerDown`); CSS `--mu-presence-*`; Swift `.metalSelectionFrame(_:variant:mode:radius:handles:readout:count:copied:edge:onHandleDrag:)`, `MetalSelectionFrame(size:)`, `MetalPresence` for Kamui's AppKit overlay. Derived value to confirm: graphite hover dot `rgba(255,255,255,.18)` (the prototype is bone-only). |
| 2 | Cue family | shipped | `9d77ce8` | React `Cue` (`kind`: date, duration, amount, measurement, tag, derived-tag, hex; `resolved`, `color`, `swatch`), `CueUrl`, `CueInferred`, `Dimple` (Base UI Checkbox; `doing`, `ghost`), `CueUrgency`, `CueLife` from `@unlocalhosted/metalui`; CSS `--mu-cue-*`, `--mu-type-<role>` vars; Swift `Text.metalCue(_:colorway:hex:)`, `MetalCueTag`, `MetalDimple`, `MetalCueURLPill`, `MetalCueInferred`, `MetalCueUrgency`, `MetalCueLife`, `MetalCue` tokens for the TextKit host. Finding: the demo's tabular figures in flow moved text by 1.09 px in Geist, so cues keep the text's own figures. Derived values to confirm: graphite cue-quiet, tag, derived, ghost and URL ink (the prototype is bone-only). |
| 3 | Suggestion chip | shipped | `059db55` | React `SuggestionChip` (`label`, `confidence`, `onAccept`, `onDismiss`, `hostHovered`; the block is the host via `.mu-icon-trigger`); CSS `--mu-suggestion-*`; Swift `MetalSuggestionChip(label:confidence:hostHovered:onAccept:onDismiss:)`, `MetalSuggestion`. Derived to confirm: graphite chip fill `rgba(44,44,47,.7)`. |
| 4 | Hover engraving | shipped | `be98d7b` | React `HoverEngraving` (`kind`, `details`, `tags`, `status: { led: 'live'\|'waiting'\|'failed'\|'off', text }`, `placement`, `open`, `immediate`); CSS `--mu-engraving-*`; Swift `MetalHoverEngraving`, `.metalHoverEngraving(_:placement:isPresented:)`, `MetalEngraving`. Derived to confirm: graphite engraving fill and emphasis. |
| 5 | Provenance tooltip | shipped | `a1909a8` | React `ProvenanceTooltip` (`source`, `detail`, `clearsChip`, `open`; wraps the cue) and `ProvenanceProvider` (Base UI Tooltip); CSS `--mu-provenance-*`; Swift `MetalProvenanceTooltip`, `.metalProvenance(_:detail:clearsChip:)`, `MetalProvenance`. Decision: the readout role (10.5), not label, since provenance informs on its own (DS-06). |
| 6 | Region | shipped | `78c214b` | React `Region` (`name`, `rule`, `dropRule`, `count`, `over`, `dim`, `past`, `lens`, `renaming`, `onRename`, `onRenameCancel`, `width`, `height`) and `RegionRow` (`checked`, `lead`, `meta`); CSS `--mu-region-*`, `--mu-raise-lite`, `--mu-row-hover`; Swift `MetalRegionView(name:rule:dropRule:count:state:lens:renaming:onRename:rows:)`, `MetalRegionRow`, `MetalRegion`. Derived to confirm: graphite region fill, shade and lens plate. |
| 7a | Segmented control | shipped | `ab19895` | React `Segmented` (`options`, `value`, `defaultValue`, `onValueChange`, `size: 'compact'\|'regular'`, `aria-label`; Base UI RadioGroup); CSS `--mu-segmented-*`; Swift `MetalSegmented(_:selection:options:size:)`. |
| 7b | Lens bar | shipped | see `feat(objects): lens bar` | React `LensBar` (`query`, `count`, `source: 'asking'\|'jev'\|'local'\|null`, `mode`, `onModeChange`, `modes`, `onPin`, `onClose`, `glyphs: { lens, pin, close }`; Base UI Toolbar); CSS `--mu-lensbar-*`; Swift `MetalLensBar(query:count:source:mode:modes:onPin:onClose:)`, `MetalLensMode`, `MetalLensSource`. |
| 8 | Memory scrubber | pending | | |
| 9 | Past banner | pending | | |
| 10 | Tool strip | pending | | |
| 11 | Size readout | pending | | |

## 5b. Further objects the client LLDs need

From `kamui/docs/architecture/medium/LLD/WEB_CLIENT.md` §2 (`src/chrome/*`) and `MAC_CLIENT.md` §6 ("`MetalButton`, Toast, Command palette, Segmented, Tooltip, Popover/Menu, Kbd, LED, Toolbar as each ships"). Built after §5, one at a time, in this order.

| Order | Object | Kamui brief | Status | Commit | Clients import |
|---|---|---|---|---|---|
| 12 | Kbd (keycap) | 04 §9 | pending | | |
| 13 | LED and status pill | 04 §10 | pending | | |
| 14 | Toast | 04 §12 | pending | | |
| 15 | Toolbar and tool button | 04 §2 | pending | | |
| 16 | Command palette | 04 §3 | pending | | |
| 17 | Tooltip and popover / correction menu | 04 §8, §18 | pending | | |
| 18 | Button refit: compact 28 variant | 04 §1 | pending | | |

## 6. Kamui switches over

Kamui's side; tracked in Kamui. Each row above lists what a client imports once it ships.
