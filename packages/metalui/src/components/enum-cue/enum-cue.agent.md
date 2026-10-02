# Enum cue

A Component: a host-declared finite source state, distinct from a free tag. React `EnumCue` wraps Base UI Button; native `MetalEnumCue` wraps SwiftUI Button. The held adjacent-choice preview is an Instrument. The tab is the existing Mark Part.

## Source contract

`value` is the complete source word; `choices` contains unique source words and optional human labels, glyphs and explicit tints. State meaning remains in words. A neutral tint is the default; the identity hash palette never selects an enum state colour. Reserve every host choice before interaction, so the widest source word pays for the footprint in raw, cued, held and cancelled states.

Use `onBegin` to capture a source range, `onChange(words)` to preview it, `onCommit` to end one history entry and `onCancel` to restore the captured source and UTF16 selection. `useCueDocument`/`MetalCueDocument` supply this lifecycle. If `onBegin` returns false the operation is refused. Host typing or a changed finite vocabulary must end the old range before supplying new source. Pass the optional `editing` transaction flag so unrelated host typing immediately invalidates a held range. An `onChange` returning false refuses a stale preview without a haptic. No recognizer writes text. Cancellation without `onCancel` emits the original word.

## Gestures

- Click/Space cycle; Up/Down step and wrap through the host's declared order. A held keyboard repeat remains one gesture until key release.
- Hold and drag vertically; each named 24-space stop lands an option, not an interpolated enum. Adjacent choices appear only while held.
- Focus gives the control the wheel. Unfocused text never consumes scrolling. Wheel events share one snapshot and commit after the existing release pause.
- Escape, lost capture, blur or unmount cancel the active snapshot. Disabled/read-only or unknown source values never mutate or emit haptics. Read-only remains focusable for its accessible value.
- One shared detent haptic per changed landed state. The browser reports no fabricated feedback when native haptics are unavailable.

The existing drum presents a changed word; reduced motion keeps its crossfade and removes travel. The complete value is in the accessible button name. Native adds an adjustable accessibility action with the same finite choices. At rest, no instrument or timer runs.

## Enclosing provenance

EnumCue forwards its actual Base UI trigger ref and common trigger props, merging host events with its own gestures. An enclosing ProvenanceTooltip reaches the operable words, its source description joins gesture instructions, and Space still writes one source-history step. Set `hint={false}` to let that enclosing tooltip own the visual help. Native `hint: false` likewise suppresses the gesture help when `.metalProvenance(…)` supplies provenance. This changes no material, footprint or motion.

Native mutability disables the inner action button while preserving the outer read-only focus target and description. Dynamic read-only changes refuse default Return shortcuts as well as pointer, wheel and adjustable actions; returning to editable state re-enables the same control without changing its footprint.
