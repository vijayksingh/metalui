# Island

Where you are and how things stand, in one graphite capsule. React: `Island` from `@unlocalhosted/metalui`. A composition of `Button` (graphite cap), `Led`, `Label`, `SwapText` and the chevron `MorphIcon`. It paints nothing of its own.

## Use it for

- The one object at the top of a place: its name, one fact, a status light, and the menu with the place's choices (other places, appearance, settings).

## Don't use it for

- A row of status pills. Fold them into the island's tone, detail and menu.
- Errors that need an action (use a toast with the action), or a long message (it holds a few words).

## Anatomy

- LED · title · detail (mono, dim) · chevron, on the graphite cap.
- `tone` lights the LED: live (steady), working (breathes), offline (failed), quiet (off). Say it in words too with `toneLabel`; it joins the accessible name.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | LED, title, detail, chevron | none |
| hover, pressed, focus | the graphite cap's own | the cap's press travel |
| open | its menu below | the chevron turns over on the part spring |
| announce | the event in the detail's place | the swap drum turns; the capsule's footprint grows first and shrinks after; it turns back after `toast-plain-ms` |
| condition | the condition is the detail (Offline, a past moment) | stays until it ends |

Reduce Motion: the swap and the chevron resolve without travel.

## Accessibility

- One button: its name is title, detail and the tone in words. Pair it with `Menu` (`trigger={<Island … open={open} />}`).
- A passing event is also read out through a polite live region.
