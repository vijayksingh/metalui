# Counter drum

A gadget for a streak, drawn from a spec. React: `<Gadget spec={counterDrum} value={days} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/counter-drum.gadget.json`. An Object (an emblem): it stands for a count the person keeps, and is never a control.

## Use it for

- A streak (days in a row), or any count a person builds up and should see grow.
- The moment the count changes: set `value` and the drums turn.

## Don't use it for

- A number you only need to read: use text.
- A level or a proportion: that's the needle gauge or the fader bank.

## How it moves

The `roll` mechanism, held: `value` is the count (0 to 999). Only drums whose digit changes turn, the lowest first and each higher one 60 ms after the one below, like an odometer: counting up a drum only turns forward, so 9 runs on into 0. Each ticks past its digits and settles with a small knock. With reduced motion the drums go straight to their digits, each moved one ticking once.

## States

| State | Lamp | News |
|---|---|---|
| rest | off | none |
| counting | green, steady | none |
| rolled-over | green, blinking twice | `done` on the beeper |

It says its count: "Streak: 12 days".
