# Toast

The result of a person's own action, with Undo. React: `ToastProvider` + `useToast()` from `@unlocalhosted/metalui` (Base UI Toast). SwiftUI: `MetalToast` and `.metalToast(_:)`. Sheet reference: KAMUI-20; Kamui brief: 04 §12.

## Use it for

- What an action did, with Undo: "Moved 3 blocks", "Ticked · wrote [x] into the text", "Pinned as a live region · it updates as you write", "Correction remembered · for this exact text".
- An error that needs attention (it stays until resolved).

## Don't use it for

- Recognition. The surface never toasts, badges or sounds for what it recognised.
- Anything a person must read later, or several messages at once. One at a time.

## Anatomy

A 44 tall smoked pill (`rgba(30,30,33,.92)`, blur 22, its stack), padding 0 6 0 16, gap 12, the `ui` role in `#F2F2F0`; a detail after a middle dot in `#9A9AA0`; an Undo cap (28 tall, `#3A3A3E → #2C2C2F`, a light top lip) with a sunk `⌘Z` keycap. Bottom centre, 92 above the dock. Success carries its check; an error its red mark.

## States and motion

| State | Motion |
|---|---|
| arrive | one nest (8) from below, from .97, on settle; Reduce Motion: fades in place |
| replaced by the next | the old leaves on release, the new arrives |
| Undo pressed | the cap presses 1; the action is undone, the toast leaves |
| time out | undoable 5 s, plain 2.6 s, error never |
| leave | on release, the way it came |

## API

```tsx
// once, at the root
<ToastProvider><App /></ToastProvider>

// anywhere below
const toast = useToast();
toast.show({ title: 'Moved 3 blocks', undo: () => undo() });
toast.show({ title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' });
```

```swift
canvas.metalToast($toast)   // toast: MetalToastModel? = .init("Moved 3 blocks", undo: { undo() })
```

## Rules

- The person's own actions only, and always Undo when the action can be undone.
- Say what happened, in the words of the action; a detail, if any, after the middle dot.
- Success carries its check; never colour alone.
- Errors stay until resolved; everything else goes by itself.

## Accessibility

- Base UI Toast: announced politely in a labelled region; F6 moves focus to the toast; the Undo cap is a real button, and ⌘Z does the same (the host's shortcut).

## Tokens

`--mu-toast-*`, `--mu-backdrop`, `--mu-kbd-sunk-*`, `--mu-spring-settle`, `--mu-spring-release`. Swift: `MetalToastMetrics`.
