# Status badge

`StatusBadge` / `MetalStatusBadge` names a system state beside a decorative lamp. A component: it tells you what is happening; it never executes the fixing action. A hint uses Base UI Tooltip on hover and focus. Use separate buttons for Retry or settings.

## Material and state

The shared status recipe gives the badge a 26-high cap plate, 11 horizontal pad, 7 gap and defined .5 edge. Words are 500 12px/16px sans, tracking .01em in ink2. The LED lens is 8 (6 small) inside a dark opaque 1px socket: 10/8 total. All lit states have the same 4px halo at .35; off is a dull socket. Colors live in `recipes.status.props.ink`; measured contrast and protan/deuter simulations are in `docs/STATUS-COLORS.md`. Color-vision simulations do not guarantee recognition; words are mandatory.

| State | Default gesture | Words |
|---|---|---|
| live | steady | Sync live |
| waiting | breathe while pending | Sync waiting |
| failed | double blink once, then steady | Sync failed |
| link | steady | Sync linked |
| off | dark | Sync off |

Only inner lens opacity animates; the socket never fades. OS, html.rm and scoped reduced motion hold lamps steady. Words retain every meaning. Hidden/offscreen lamps pause; finite gestures stop at completion.

## Tone and surface

- `tone="default"`: opaque plate by default; it holds its ground on frosted parents and imagery.
- `tone="quiet"`: LED and words with no plate or horizontal padding. Use only on a controlled ground; never directly over imagery.
- `tone="strong"`: opaque plate with 12% tint from the same state ink. Strong always stays opaque.
- `surface="transparent"`: explicit strong frost fill without blur. `surface="frosted"`: same fill plus shared 22px / 1.6 backdrop. Both use full shared ink for worst-case contrast; default opaque/quiet/strong use ink2.
- `solid`: forces an opaque plate, including quiet and translucent requests. Reduced transparency / low power also replaces transparent/frosted with the existing opaque twin and removes blur. Native respects Reduce Transparency.

React: `StatusBadge led hint tone surface solid gesture` with words as children. Swift: `MetalStatusBadge("Sync live", led: .live, tone: .default, surface: .solid, solid: false)`; optional `hint` and `gesture` match React. The tone wins over surface; solid wins over tone. Scope policies use `data-mu-transparency="reduce"`, `data-mu-power="low"`, `data-mu-motion="reduce"` on the parent.

## Accessibility

The badge has role=status and atomic announcements when its words change; keep it outside another aria-busy host. With hint it is focusable, with a description and tooltip; otherwise it has no tab stop. LEDs are aria-hidden. Native combines the words as its accessibility label and exposes the hint as help. Never convey a failure only by red or blinking.
