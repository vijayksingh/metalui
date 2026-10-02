# Link

An inline destination. React wraps Base UI `useRender`; SwiftUI uses `MetalLink` with the same material, states and physical press. Use a Button for actions.

## States

- Rest keeps a hairline below the words; colour never marks a destination alone.
- Hover grows a thicker line from the side the pointer entered and reveals a faint menu-row tint. Press sinks by the button's existing travel and dims. Focus uses the shared green ring.
- `visited`: opt into the browser's quieter visited underline; off by default in apps. Use in documents. Browsers restrict querying visited styles for privacy. Native tracks following this view's destination.
- `aria-current="page"`: full ink, no underline, names the current destination. Native `current: true`.
- `disabled` / `aria-disabled`: ink3, no underline, focusable to discover `disabledReason`, no navigation by pointer, auxiliary click or keyboard. The reason appears in the shared tooltip and spoken name. Native guards the destination action and exposes its reason.
- `loading`: busy route underline sweeps on the existing Progress duration. Its observer pauses it off screen, removes it when the route arrives and stops travel under reduced motion. Native creates its timeline only while loading and appeared; the host owns the route lifecycle.
- `external`: shared external glyph, animated by hover/press, new tab and spoken announcement. Native opens through the system URL action.
- `download` with `fileSize`: shared download glyph followed by the size. Native `download: true` marks the file; use `action:` to provide the platform's download handling.
- `kind="quiet"`: a quieter persistent hairline for lists that already establish destinations. `standalone`: a link on its own line with a trailing arrow.

Every available destination keeps its underline, including quiet/visited/loading. Current and unavailable states are explicit exceptions. Both OS and live scoped/site reduced-motion settings preserve meaning while dropping travel.

## API

React accepts anchor attributes, `external`, `visited`, `disabled`, `disabledReason`, `loading`, `fileSize`, `kind`, and `render` for router anchors. A disabled anchor drops its href and guards activation, while preserving link semantics and focus. No pending work is inferred from click; the router sets and clears `loading`.

Swift accepts `destination:`, `external:`, `visited:`, `current:`, `disabled:`, `disabledReason:`, `loading:`, `download:`, `fileSize:`, `kind:` and optional `action:`. If no action is given, it follows through `openURL`.

```tsx
<Link href="/guides/export" visited>the export guide</Link>
<Link href="/tram.pdf" download fileSize="2.4 MB">Tram map.pdf</Link>
<Link render={<RouterLink to="/region" />} loading={pending}>Open the region</Link>
<Link href="/draft" disabled disabledReason="The guide is being revised">the draft guide</Link>
```

The docs show every state in both colorways and an editing card: handle the real underline to change its offset, or toggle its external glyph. Readouts snap at the shared default; DialKit tunes underline thickness.
