# Provenance tooltip

One hover away from every cue: where it came from. A composition block: a wrapped `Tooltip` with the detail in `Tooltip.Dim`. React: `ProvenanceTooltip` (and `ProvenanceProvider` around a canvas) from `@unlocalhosted/metalui`. SwiftUI: `.metalProvenance(_:detail:)` or `MetalProvenanceTooltip`.

## Use it for

- Every cue the app applied: `Rule · date parser`, `Recognizer · 0.82`, `Region · Done`, `Cluster · poster`, `Formula`, `You` (a correction).

## Don't use it for

- Tooltips on chrome (a tool's name and key). Those are the toolbar's tooltips.
- Long explanations. The source, then the detail.
- Hiding confidence. If the app guessed, the number is shown.

## Anatomy

`Tooltip wrap` (the graphite fill with no backdrop, radius 11, padding 6 / 10, max 280 wide, 10 mono at 1.45, tracked .05em): the source in its ink, the detail after a middle dot in `Tooltip.Dim`. It waits 380 ms, sits 8 above the cue, or 34 above a cue that shows its own value chip on hover, and flips below near the top of the view.

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hovered or focused 380 ms | the tooltip | fade on settle |
| next cue within the group | the next tooltip at once | – |
| leave, Escape | hidden | fade on settle |

## API

```tsx
<ProvenanceProvider>
  <ProvenanceTooltip source="Recognizer" detail={['0.82']} clearsChip>
    <Mark kind="date" resolved="TUE 30 SEP">tomorrow</Mark>
  </ProvenanceTooltip>
</ProvenanceProvider>
```

| Prop | Notes |
|---|---|
| `source` | first, in the tooltip's ink |
| `detail` | dimmed, after a middle dot |
| `clearsChip` | the cue has its own value chip: sit above it |
| `open` | controlled |
| `disabled` | suppresses the visual tooltip while an editing instrument is held; source metadata and trigger focus remain |

## Rules

- Every applied cue has provenance, and a guess shows its number.
- The source first.
- It never covers the cue's own value chip.

## Accessibility

- Base UI Tooltip: it opens on hover and on keyboard focus and closes on Escape. Tooltips are visual only, so the block also appends provenance to the cue's authored `aria-description` ("Recognizer, 0.82"). The cue stays the focusable element.
- It never holds interactive content. Native exposes Source as high-importance custom accessibility content, preserving the wrapped cue’s keyboard hint.
- Compose with the actual control trigger. Numeric and date inputs receive source through `inputAria.aria-describedby`; Person, Enum, Tag, Colour and Link forward it directly. Do not add a focusable wrapper.
- Use `disabled={document.editing}` or native `enabled: !document.editing` while scale/adjacent-state feedback is held. Suppression closes the visual overlay without disabling the control or erasing its origin.

## One source document

The docs source example uses `useCueDocument` and native `MetalCueDocument` with the exact sentence and an explicit 2 October 2026 date reference. Host-known tags and names, finite task states, canonical minutes, full hex and URLs remain authored source words. No recognizer confidence is invented. The source textarea/TextKit editor owns UTF16 selection; apply it only when that editor is already focused.

`onBegin` captures the operated range, source callbacks replace its words, `onCommit` records one gesture and `onCancel` restores it. Pointer previews create one Undo. Numeric keyboard detents commit one edit; Enum key repeats share a held gesture until release. Undo/Redo restores source and selection without stealing focus. Compare source by exact UTF16 units; NFC/NFD spellings remain distinct authored edits even when the caret does not move. Typing an unfinished hash opens `TagCue.Picker` against that captured range; search leaves it unchanged, choosing replaces it once, dismissal retains the typed hash. Known people use a named Select trigger and listbox; finite state/tag rotors remain named adjustable buttons. Numeric/date cues remain spinbuttons.

Examples live outside the published native library in `swift/Examples/MetalProvenanceDocumentExample.swift`; the same public controls back the actual macOS feature fixture. Browser and native receipts cover UTF16 emoji/caret shifts, history, cancellation, fixed footprints, read-only controls and both colorways/reduced motion. These receipts do not claim observed VoiceOver speech or physical trackpad feedback.

## Tokens

Timing and placement: `--mu-provenance-delay-ms`, `--mu-provenance-offset`, `--mu-provenance-chip-offset`. Look: the tooltip recipe. Swift: `MetalProvenance`.
