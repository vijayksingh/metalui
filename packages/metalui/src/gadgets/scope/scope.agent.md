# Scope

A gadget for search, drawn from a spec. React: `<Gadget spec={scope} state="searching" />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/scope.gadget.json`. An Object (an emblem): it stands for the person's search, and is never a control.

## Use it for

- The search moment: while a query runs, `searching`; then `found` or `nothing`.
- The no-results state (`nothing`), in place of an empty-state illustration.

## Don't use it for

- A progress bar: the sweep says "looking", not how far along.
- A control. To start a search, use the search field.

## How it moves

The `sweep` mechanism: a beam turns once around the glass in 1.4 s, and each blip lights as the beam crosses it (its moment is its angle around the beam) and fades over 600 ms, with a soft glass tick. While the state is `searching` it sweeps again and again. When the search ends the beam stops where it is. With reduced motion there's no sweep; the lamp and the news stay.

## States

| State | Lamp | Blips | News |
|---|---|---|---|
| rest | off | dark | none |
| searching | amber, breathing | lit by the beam, fading | a tick per blip |
| found | green, steady | lit | `done` |
| nothing | amber, steady | dark | `waiting` |

## Colour

Find, pinned to stone: an inset gadget, so it's seen through its glass, an ice blue at the find station (250°). The set rules compare it by that glass.
