# Needle gauge

A gadget for a level, drawn from a spec. React: `<Gadget spec={needleGauge} value={minutes} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/needle-gauge.gadget.json`. An Object (an emblem): it stands for a measure the person keeps an eye on, and is never a control.

## Use it for

- A level against a goal: minutes read today, storage used, a health that rises and falls.
- Making crossing a line into news: past the threshold it lights amber and says so once.

## Don't use it for

- A count: that's the counter drum.
- A progress bar for a task: a gauge measures something ongoing.

## How it moves

The `swing` mechanism, held: `value` (0 to 40 minutes here, the drive port's range) swings the needle on the part spring. It overshoots a little and settles; at the ends of the scale it bounces off the pegs. A needle is silent. With reduced motion it goes straight to the value.

## States

The value decides: at or past the threshold (0.75 of the range) the gauge is `over`: the lamp goes amber and the beeper says `waiting`, once, as it crosses. Back under, it rests.

| State | Lamp | News |
|---|---|---|
| rest | off | none |
| over | amber, steady | `waiting` as it crosses |

It says its level: "Today: 24 of 40 min".
