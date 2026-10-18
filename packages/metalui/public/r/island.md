# Island

Where you are and how things stand, in one capsule in the colorway: the brightest bone cap on bone, graphite-deep on graphite. React: `Island` from `@unlocalhosted/metalui`. SwiftUI: `MetalIsland`. A composition of a chrome Surface, the button's graphite cap (its wash follows the colorway), `Led` / `MetalLED`, `Label`, the detail swap and the chevron. It paints nothing of its own.

## Use it for

- The one object at the top of a place: its name, one fact, a status light, and the menu with the place's choices (other places, appearance, settings).

## Don't use it for

- A row of status pills. Fold them into the island's tone, detail and menu.
- Errors that need an action (use a toast with the action), or a long message (it holds a few words).

## Anatomy

- LED · title · detail (mono, dim) · chevron, on the cap: a white wash with a faint .5 rim (`rgba(255,255,255,.7)`, `rgba(24,22,16,.07)`, ink `#1B1B1D`) on bone, a faint light wash (`rgba(255,255,255,.09)`, ink `#EDEDEF`) on graphite.
- `tone` lights the LED: live (steady), working (breathes), offline (failed), quiet (off). Say it in words too with `toneLabel`; it joins the accessible name.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | LED, title, detail, chevron | none |
| hover, pressed, focus | the cap's own | the cap's press travel |
| open | capsule becomes one chrome panel (bone or graphite-deep); row stays inside | outline travels on surface; row travels as a shared part; panel arrives one nest from top at popover enter-scale; chevron turns on part |
| close | panel becomes the original capsule | release spring; panel fades; Esc, outside press, or capsule closes it |
| announce | the event in the detail's place | the swap drum turns; the capsule's footprint grows first and shrinks after; it turns back after `toast-plain-ms` |
| condition | the condition is the detail (Offline, a past moment) | stays until it ends |

Reduce Motion: the swap and the chevron resolve without travel; the body cross-dissolves without resizing travel.

## Accessibility

- One button: its name is title, detail and the tone in words. With no panel it can trigger the host's menu. With a panel it becomes the panel instead of leaving a trigger behind.
- SwiftUI: `MetalIsland("Today", detail: "8 blocks", tone: .live, open: $open) { panel }`. The panel builder owns row arrangement, using `island.self.panel-gap`. Omit `open` for internally owned state. Closing returns focus to the capsule; the host's controls retain their normal keyboard navigation inside the panel.
- A passing event is also read out through a polite live region.
