# Keycap chord

A gadget for shortcuts, drawn from a spec. React: `<Gadget spec={keycapChord} act={n} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/keycap-chord.gadget.json`. An Object (an emblem): it stands for the person's shortcuts, and is never a control.

## Use it for

- Settings › Shortcuts, and the command palette's empty state.
- Acknowledging that a shortcut was used: bump `act` and the chord plays.

## Don't use it for

- Showing which keys a shortcut is. That is the inline Keycap (`Kbd`) next to the command.
- A keyboard. Two keys make a chord; it is an emblem, not an input.

## How it moves

The `press` mechanism: each key's face drops 6 units into its skirt and springs back on the release spring, ⌘ first and K 60 ms after. Each knocks in its own material as it bottoms out (ceramic tinks; the orange K is clay) and clicks quieter and higher as it hits its top stop. The lamp flickers with the first key. With reduced motion the keys still dip, at once, and the sounds stay.

## States

| State | Lamp | On entry |
|---|---|---|
| rest | off | nothing |
| ready | green, steady | nothing |
| chord | green, steady | plays the chord |

## Colour

Command, pinned to ceramic (the bone plastic of a keyboard): the lightest band, so no other ceramic gadget sits beside it in a set.
