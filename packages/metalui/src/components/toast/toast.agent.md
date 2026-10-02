# Toast

The result of a person's own action, with Undo. React: `ToastProvider` + `useToast()` from `@unlocalhosted/metalui` (Base UI Toast). SwiftUI: `MetalToastDeck` and `.metalToastDeck(_:)` (the deck), `MetalToast` and `.metalToast(_:)` (one at a time). Sheet reference: the object sheet; 

## Use it for

- What an action did, with Undo: "Moved 3 blocks", "Ticked · wrote [x] into the text", "Pinned as a live region · it updates as you write", "Correction remembered · for this exact text".
- An error that needs attention (it stays until resolved).

## Don't use it for

- Recognition. The surface never toasts, badges or sounds for what it recognised.
- Anything a person must read later. Several results in a row stack as a deck; it isn't a log.

## Anatomy

A 44 tall glass pill in the colorway (blur 22, its stack), padding 0 6 0 16, gap 12, the `ui` role; a detail after a middle dot; a count after a repeat (`×3`); an Undo cap (28 tall, a light top lip) with a sunk `⌘Z` keycap; a quiet 28 close key (×) that shows its cap on hover. Bone: a bone pill (`rgba(251,250,248,.92)`), ink `#1B1B1D`, detail `#6E6E72`, a bone cap (`#FFFFFF → #F0EFEB`). Graphite: a smoked pill (`rgba(30,30,33,.92)`), ink `#F2F2F0`, detail `#9A9AA0`, a graphite cap (`#3A3A3E → #2C2C2F`). Bottom centre, 92 above the dock. Each kind owns one persistent glyph: default/loading info, success check, error sync-error. The glyph morphs as its words turn on the shared drum.

The deck: toasts stack in depth, newest in front. Folded cards share the front card’s measured width; expanded cards regain their own width. Each card behind is a step smaller (×.95), peeks 8 past the card in front on the side away from the screen edge (a bottom deck peeks upward) and is 20 % dimmer, its words hidden. Three are drawn; the rest are counted in the back card’s edge (`+2`) and come forward as the front ones go. Fanned out, the cards stand 8 apart in a readable column.

## States and motion

| State | Motion |
|---|---|
| arrive | rises 8 from below, from .97, into the front on the object spring; every card behind steps back one on the same spring, in the same frame |
| fan out | pointer on the deck, or focus into it (Tab, F6): the cards spread into a column on the surface spring; every timer pauses |
| fold | pointer or focus leaves: back into the deck on the surface spring; timers resume |
| swipe | follows the pointer (down or right); past 40 on release it leaves the way it was thrown on release; short of it, springs home |
| close | the close key, or Esc on the focused toast: leaves on release; the next card comes forward |
| repeat | the same title, detail and tone as the front card: no new card; it presses to .96 and springs back on the part spring, counts `×2`, and its timer starts over |
| Undo pressed | the cap presses 1; the action is undone, the toast leaves |
| time out | undoable 5 s, plain 2.6 s, error never |
| Reduce Motion | no travel or scale: cards cross-fade into place; the repeat shows only the count |

## API

```tsx
// once, at the root
<ToastProvider><App /></ToastProvider>

// anywhere below
const toast = useToast();
toast.show({ title: 'Moved 3 blocks', undo: () => undo() });
toast.show({ title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' });
toast.show({ title: 'Moved 3 blocks', undo }); // again: the front card counts ×2
```

```swift
@State private var deck = MetalToastDeck()
canvas.metalToastDeck(deck)
deck.show(.init("Moved 3 blocks", undo: { undo() }))   // again: the front card counts ×2

canvas.metalToast($toast)   // one at a time: toast: MetalToastModel? = .init("Moved 3 blocks", undo: { undo() })
```

## Rules

- The person's own actions only, and always Undo when the action can be undone.
- Say what happened, in the words of the action; a detail, if any, after the middle dot.
- Success carries its check; never colour alone.
- Errors stay until resolved; everything else goes by itself.
- Show results as they happen; the deck keeps the newest in front. Don't build your own queue or clear the deck to show the next one.
- The same result again is a repeat: let it count; don't reword it to force a new card.

## Accessibility

- Base UI Toast: one labelled region (Notifications), announced politely; a new card is always the front one, so only it is read out, and a repeat reads its new count. F6 moves focus into the deck and fans it out; Esc dismisses the focused toast. The Undo cap and the close key (Dismiss) are real buttons; ⌘Z / Ctrl+Z undo the focused toast, otherwise the latest live undoable change, and dismiss it. Editable fields and prevented events keep their own Undo. Set `undoShortcut: false` when the host owns shortcuts; the toast then omits the keycap. Cards not drawn are inert. Swift folded cards hide and disable their actions; focusing a front action fans the deck out and pauses every timer. A separate native shortcut declaration targets the focused undoable card, otherwise the newest undoable card, even when that card is folded. `MetalToastModel(…, undoShortcut: false)` leaves the shortcut to the host.

## Tokens

`--mu-toast-*`, `--mu-r-toast-deck-*` (step-scale, peek, dim, visible, gap, swipe, press), `--mu-backdrop`, `--mu-kbd-sunk-*`, `--mu-spring-object` (arrive), `--mu-spring-surface` (fan out, fold), `--mu-spring-part` (repeat), `--mu-spring-settle`, `--mu-spring-release`. Swift: `MetalToastMetrics`, `MetalRecipes.toast` (deck.*).

## A retained promise result

`toast.update(id, options)` completely replaces one live card without changing its id, position or focused action. It resets that card's count and timeout only; it returns false for a missing/closing card and never resurrects it. Set `timeout: 0` for a result whose host will resolve it. An optional authored `glyph` overrides the kind shape, for example `synced` → `offline` → `sync-error`; explicit consequence words remain mandatory.

```tsx
await toast.promise(exportPoster(), {
  loading: { title: 'Exporting poster', sub: 'the draft stays editable' },
  success: name => ({ title: 'Poster exported', sub: name, undo: undoExport }),
  error: () => ({ title: 'Export failed', sub: 'the draft stays here for retry' }),
});
```

Base UI retains one non-expiring loading card and updates its type on resolution. Success uses the established plain/Undo timeout; error stays. The returned promise preserves its value or rejection; the host handles that error and keeps drafts usable. Closing a pending card wins over late completion. A single persistent polite front-word announcer owns new results, updates and promotion. The viewport and cards have aria-live=off, so background updates and outgoing drum layers add no extra announcement. Glyphs are decorative, words name the result, and reduced motion changes the glyph in place and cross-fades the label. No new clock exists for a resting kind.

Swift `let id = deck.show(model)` returns its retained card id; `deck.update(id, newModel)` returns false after dismissal and refreshes only its card revision/timer. `try await deck.promise({ try await exportPoster() }, loading: .init("Exporting poster"), success: { .init("Poster exported", sub: $0, tone: .success) }, error: { _ in .init("Export failed", tone: .error) })` holds the loading card indefinitely. Native model `glyph` and `timeout` match React; timeout is milliseconds. A binding host can update one retained model with `.init(…, id: existing.id)`; a changed title/kind restarts that host's result clock. Background folded native cards remain hidden from accessibility; a front appearance/update/promotion requests one event-only platform announcement while VoiceOver runs. Outgoing native drum text is excluded from its current title label. Focus/expanded deck policy stays with the existing deck.
