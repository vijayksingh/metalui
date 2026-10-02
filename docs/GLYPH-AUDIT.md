# Owned glyph audit

Snapshot: 2026-10-03. The product catalog contains 79 glyphs with shared wire/duotone geometry, authored acts and tuned 16px contours. React and native consume generated geometry; 78 glyphs participate in the generated morph catalog. Unsupported/custom artwork keeps its documented static fallback rather than claiming a contour morph.

An action uses its semantic glyph and a verb. A glyph-only cap keeps the verb in its tooltip and accessible name. One changing control retains one morph host and changes its words on the shared settle; reduced motion applies the meaning without travel. This audit covers the keys the library owns, not arbitrary artwork supplied by an application.

## Source and feature receipts

The web sources are `packages/metalui/src/components/<host>/`; native counterparts are `swift/Sources/MetalUI/Components/Metal<Host>.swift`, except LinkCard which renders through `MetalGlassFace.swift`.

| Owned host | Shared meaning | Web feature receipt | Native feature receipt or boundary |
| --- | --- | --- | --- |
| Button and grouped/split keys | Action glyph slot, waiting/result, canonical split chevron | `button-waiting.spec.ts`, `button-group.spec.ts` | Shared cap/glyph recipes and `MetalMorphIcon` builder; native authored keyboard/result proof accompanies the Button follow-up |
| Copy | `copy` to `check`, then back, paired copied words | `docs-copy.spec.ts` | `native/run-copy-proof.py` |
| Status and retained Toast | Sync/info/success/error glyph plus words | `status-sync.spec.ts`, `toast-promise.spec.ts` | `native/run-status-label-proof.py`, `native/run-toast-label-proof.py`; retained toast also updates its callback |
| Attachment | Host-reported upload, success or error; canonical remove/retry | `attachment.spec.ts` | `native/run-attachment-result-proof.py`, `native/run-attachment-label-proof.py`; live reduced words and target ink settle immediately |
| DropZone | Receiver to accepted check or refused close, with receiving/result words | `drop-zone.spec.ts` | `native/run-drop-zone-proof.py`, `native/run-drop-zone-label-proof.py`; live reduction also cancels sink, glyph lift and refusal presentation |
| Sidebar toggle | Expanded/collapsed contour and Expand/Collapse words | `sidebar.spec.ts`, `icon-sidebar.spec.ts` | `native/run-sidebar-glyph-proof.py`, `native/run-sidebar-toggle-proof.py`; custom artwork remains supported |
| Accordion and Select | One canonical chevron morphs its turn | `accordion.spec.ts`, `select-glyph.spec.ts` | `native/run-accordion-chevron-proof.py`, `native/run-select-chevron-proof.py` |
| Navigation menu and shared Menu submenus | Canonical chevron follows the open state | `navigation-menu.spec.ts`, `menubar.spec.ts` | Navigation menu and Menubar remain explicit system adapters; no owned native disclosure contour to replace |
| Combobox | Canonical clear key; no visible open chevron | `combobox.spec.ts` | Native system picker adapter; no library-drawn open glyph |
| Table | Canonical arrow morphs ascending/descending | `table.spec.ts` | Explicit native SwiftUI Table adapter; no owned custom sort glyph |
| Calendar and DatePicker | Quarter-turned chevron month keys, calendar picker and close clear keys | `calendar.spec.ts`, `calendar-selection.spec.ts`, `date-picker-entry.spec.ts`, `date-cue.spec.ts` | `native/run-date-cue-proof.py` covers public focus, picker acceptance, history and inactive keyboard refusal |
| Pagination, breadcrumbs and NumberField | Shared chevrons, minus/plus | `pagination.spec.ts`, `number-field.spec.ts` | Native counterparts consume canonical geometry; component guides state their keyboard contracts |
| Fan, Link and LinkCard OPEN | Canonical close, external/download and named tray action glyphs | `fan.spec.ts`, `link.spec.ts`, `link-card-open.spec.ts` | Public `MetalFan`, `MetalLink` and `MetalGlassFace`; `native/run-link-card-open-proof.py` preserves enabled/custom/disabled action semantics |

The receipt paths are integration/end-to-end fixtures, not unit tests. The final integrated gates report current execution separately from this source map.

## Scope boundaries

- Pin/Unpin, Group/Ungroup and Zoom in/out are distinct current verbs. No current owned key flips between those meanings at a limit. Hosts introducing such a key use the documented morph and paired words-builder contract; this audit does not claim those absent behaviors implemented.
- Bone/Graphite and Motion header controls remain named words. The conditional glyph requirement has no current glyph to migrate.
- Native Table, Navigation menu and Menubar are still documented system adapters. Closing their hand-glyph audit does not turn them into complete custom native controls.
- Host `icon`, `systemImage` and custom glyph builders preserve supplied artwork. Applications choose the canonical morph builder when the same custom key changes meaning.
- Shared Checkbox tick ink consumes the generated check act geometry; it is not a second authored checkmark.
- Folder paper/flap paths, sparkline plots, connector routes, snap guides, line handles, brush cursor, dot display, selection geometry, Progress amount ring and swatch geometry remain drawings of a person's stuff, measurements or instruments. They are not semantic glyph copies.
- Multiplication/count text such as `320 × 214` and `×3` remains text, not a close glyph.
