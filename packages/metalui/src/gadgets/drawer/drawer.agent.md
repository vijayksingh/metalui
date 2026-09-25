# Drawer

A gadget for what is kept, drawn from a spec. React: `<Gadget spec={drawer} value={share} act={filed} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/drawer.gadget.json`. An Object (an emblem): it stands for storage the person keeps things in, and is never a control.

## Use it for

- Storage that fills: files kept on this device, a library, an archive.
- Filing something away: play its act and the drawer slides out and home.

## Don't use it for

- A level that rises and falls: that's the needle gauge.
- Something that fills and then is done: that's the cell grid (a first run, a cache warming).

## How it moves

The `slide-out` mechanism, momentary: the tray and its pull run out 60 units toward you (down the canvas) on their runners by 180 ms, knock against them, hold until 420 ms and spring home on the object spring, knocking shut. The runners slide quietly while it moves. `open` holds it out 60; `full` holds it out 22, because it is too full to close. With reduced motion it keeps its knocks and goes straight to its pose.

Its index cards stand packed from the front, `fill`'s share of ten.

## States

The share decides full (at 0.9); holding it open is the host's.

| State | Tray | Lamp | News |
|---|---|---|---|
| rest | shut | off | none |
| open | out 60 | green, steady | none |
| full | out 22, stuck | amber, steady | none: full is physical |

It says how full it is: "Storage: 40% full".

In a rig: `fill` (number 0 to 1) in, `full` (boolean) out.
