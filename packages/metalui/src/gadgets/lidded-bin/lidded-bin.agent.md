# Lidded bin

A gadget for throwing away, drawn from a spec. React: `<Gadget spec={liddedBin} value={armed ? 1 : 0} state={emptied ? 'emptied' : undefined} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/lidded-bin.gadget.json`. An Object (an emblem): it stands for the trash, and is never a control.

## Use it for

- The trash, and the moment before something is deleted for good.
- Making a destructive step feel heavy: the lid creaks, the red shows, the lid thuds.

## Don't use it for

- An undoable removal: a lid is for what does not come back.
- A warning without a delete behind it: that's a lamp on the gadget it concerns.

## How it moves

The `flip` mechanism, held, on the hinge spring: the state holds the lid (closed at rest, ajar at 18° when armed). Entering `emptied` swings it all the way open (70°) and lets it fall at 450 ms: it hits the rim and thuds, a rubber knock with a low thump (the gadget is heavy). It creaks, quietly, while it moves. With reduced motion it goes straight to where the state holds it, silently.

## States

`armed` (boolean) decides armed; `emptied` is the host's to set.

| State | Lid | Lamp | News |
|---|---|---|---|
| rest | closed | off | none |
| armed | ajar, red under it | red, steady | none (armed is silent) |
| emptied | open, then slams shut | green, blinks twice | `done` |

It says what it is doing: "Trash: armed, ready to empty".

In a rig: `armed` (boolean) and `empty` (pulse) in, `emptied` (pulse) out.
