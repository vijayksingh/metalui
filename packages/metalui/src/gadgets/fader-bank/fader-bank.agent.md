# Fader bank

A gadget for settings, drawn from a spec. React: `<Gadget spec={faderBank} value={mix} state="on" />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/fader-bank.gadget.json`. An Object (an emblem): it stands for the person's settings, and is never a control.

## Use it for

- The Settings emblem, and a settings section's header.
- Showing that something was tuned: drive `value` when a setting changes, and the caps move.

## Don't use it for

- An actual slider or volume control. Use the Slider component; this is a picture of settings, not a way to change them.
- News. Only the `changed` state beeps, once, when a change is saved.

## How it moves

The `slide` mechanism, held. Each cap has its own rest place (its `value` param: 0.3, 0.72, 0.5). The drive port `mix` (0 to 1, default 0.5) shifts the whole bank: at 0.5 the caps rest where they sit, and pushing it toward 1 moves them all up until they meet the tops of their slots and knock, one after another, 40 ms apart. They scrape as they travel and tick past each eighth of the slot. With reduced motion they go straight to their places, each moved cap ticking once.

## States

| State | Lamp | News |
|---|---|---|
| rest | off | none |
| on | green, steady | none |
| changed | green, flickering | `done` on the beeper |

## Colour

Tune is neutral hardware: its body chroma is capped, so it resolves to a pale warm-grey clay (weight 0: changing a setting commits nothing), and grey hardware keeps the house orange accent on the cap you would touch.
