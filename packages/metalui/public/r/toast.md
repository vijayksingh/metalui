# Toast

The result of a person's own action, with Undo. React: `ToastProvider` + `useToast()` from `@unlocalhosted/metalui` (Base UI Toast). SwiftUI: `MetalToastDeck` and `.metalToastDeck(_:)` (the deck), `MetalToast` and `.metalToast(_:)` (one at a time). Sheet reference: the object sheet; 

## Use it for

- What an action did, with Undo: "Moved 3 blocks", "Ticked · wrote [x] into the text", "Pinned as a live region · it updates as you write", "Correction remembered · for this exact text".
- An error that needs attention (it stays until resolved).

## Don't use it for

- Recognition. The surface never toasts, badges or sounds for what it recognised.
- Anything a person must read later. Several results in a row stack as a deck; it isn't a log.

## Anatomy

A 44 tall glass pill in the colorway (blur 22, its stack), padding 0 6 0 16, gap 12, the `ui` role; a detail after a middle dot; a count after a repeat (`×3`); an Undo cap (28 tall, a light top lip) with a sunk `⌘Z` keycap; a quiet 28 close key (×) that shows its cap on hover. Bone: a bone pill (`rgba(251,250,248,.92)`), ink `#1B1B1D`, detail `#6E6E72`, a bone cap (`#FFFFFF → #F0EFEB`). Graphite: a smoked pill (`rgba(30,30,33,.92)`), ink `#F2F2F0`, detail `#9A9AA0`, a graphite cap (`#3A3A3E → #2C2C2F`). Bottom centre, 92 above the dock. Success carries its check; an error its red mark.

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
