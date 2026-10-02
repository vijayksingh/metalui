# Scroll area

A region that scrolls, with the system's own scrollbar. React: `ScrollArea` from `@unlocalhosted/metalui`, on Base UI ScrollArea. SwiftUI: `MetalScrollArea` (work in progress). The `scroll-area` recipe draws the bar, the thumb and the edge fades.

## Use it for

- A list or text inside a fixed frame: a panel's rows, a long description in a popover, a sheet's content.

## Don't use it for

- The page itself (let the window scroll), or content that fits (it shows nothing then anyway).

## Anatomy

- Viewport: the content; give the area a height or max-height.
- Edge fades: 20 at the top and bottom, only where there is more beyond.
- Bar: 12 wide at the right, inset 2; thumb 4 wide (8 when reached for), ink at 28 %.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | no bar; fades where there is more | – |
| scrolling | the bar shows | fades in on the settle spring; edge fades grow and shrink with the distance |
| stopped | the bar leaves | 600 ms later, fades on the release spring |
| reaching for the bar | the thumb widens to 8 | part spring |

Reduce Motion: the thumb's width snaps; the fades stay.

## API

| React | SwiftUI |
|---|---|
| children (the content) | `content:` |
| `className` (give it a height or max-height) | `.frame(maxHeight:)` |
| `aria-label` (makes it a named region) | `.accessibilityLabel` |
| `ref` (the outer frame) | No DOM ref; compose the view with SwiftUI modifiers |
| `viewportRef` (`Ref<HTMLDivElement>`, object or callback; the scrollable element) | Wrap in `ScrollViewReader` and use its proxy to scroll to a content ID |
| `onScroll` (Base UI viewport handler; `event.currentTarget` is the viewport) | No offset callback at the current macOS 14 minimum; native `onScrollGeometryChange` requires macOS 15 |

```tsx
const viewport = useRef<HTMLDivElement>(null);

<ScrollArea
  viewportRef={viewport}
  onScroll={(event) => setOffset(event.currentTarget.scrollTop)}
  aria-label="Notes"
  className="h-[240px]"
>
  {notes}
</ScrollArea>

// Read dimensions on demand, outside the scroll handler.
viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
```

`onScroll` observes wheel, keyboard, and imperative scrolling without replacing Base UI's thumb and edge handling. Keep scroll handlers light: read the existing offset, not layout dimensions. The root's other props and `ref` keep their existing destination; use `viewportRef` for scrolling or viewport focus. Callback refs receive `null` when detached. SwiftUI remains the documented system `ScrollView` placeholder; these DOM APIs do not imply native visual or offset-observation parity.

## Keyboard and accessibility

- The viewport takes focus (Tab) and scrolls with the arrow keys, Page Up and Down, Home and End. Name it with `aria-label` when it is a region of its own.

## Rules

- A scroll area inside a scroll area is a trap; give the inner one a clear frame or avoid it.
- Let the fades say "there is more"; do not add "scroll for more" text.
