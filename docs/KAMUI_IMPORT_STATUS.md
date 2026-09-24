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
| 2 | Frosted recipe + Reduce Transparency twin | pending | | |
| Gate 2 | Owner sign-off on frost parity | awaiting owner | | |

## 3. Icons

| Step | What | Status | Commit | Clients import |
|---|---|---|---|---|
| 3.1 | Life set source, subpath and manifest | pending | | |
| 3.6 | SF Symbols + `MetalIcon` / `MetalLifeIcon` | pending | | |
| 3.2 | Life gallery page | pending | | |
| 3.3 | Feelings construction and lint | pending | | |
| 3.4 | Feelings grid | pending | | |
| 3.5 | Grammar (K3 fixes, one per glyph) and life morph pairs | pending | | |
| 3.7 | Medium chrome glyphs (one per commit) | pending | | |
| Gate 3 | Owner review: life gallery, feelings grid, SF Symbols preview | awaiting owner | | |

3.6 runs before 3.2–3.5 because both clients need the glyphs on screen before they need the gallery.

## 4. Rule amendments

| Step | What | Status | Commit |
|---|---|---|---|
| 4 | T5 split into hover lift (`settle`) and land (`object`); Button anatomy reads Geist 12.5 | pending | |

## 5. Objects, one at a time

| Order | Object | Status | Commit | Clients import |
|---|---|---|---|---|
| 1 | Selection frame (KAMUI-14) | pending | | |
| 2 | Cue family | pending | | |
| 3 | Suggestion chip | pending | | |
| 4 | Hover engraving | pending | | |
| 5 | Provenance tooltip | pending | | |
| 6 | Region | pending | | |
| 7 | Segmented control → Lens bar | pending | | |
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
