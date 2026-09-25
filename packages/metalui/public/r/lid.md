# Lid

A hinged flap over a bin's mouth, seen from above. React: `Lid` from `@unlocalhosted/metalui`. SwiftUI: `MetalLid`. A part: it has a look and no job of its own.

## Use it for

- Something that closes over what it holds and is heavy to open: a bin, a vault.
- Making danger physical: armed, the red under it shows as it opens.

## Don't use it for

- A drawer that slides out: that's a Pull on a tray.
- A setting that flips on and off: that's a rocker Cap.

## Anatomy

A rounded flap (corners 14 % of its shorter side) with a finger grip near its free edge, in near-black rubber by default. Opened by an angle about its hinge (the back edge or the left), it foreshortens toward the hinge (its length × cos of the angle) and its shadow falls further out as the free edge rises. Under it, the mouth is dark rubber. Armed, its underside is red (the failed signal's colour), and the red glows into the gap from the hinge side. Tokens: `gadgets.lid`.

## States

- **Closed.** `open` 0.
- **Ajar.** 18°: a glimpse of what is under it (and of the red, when armed).
- **Open.** 70°.

In a gadget the `flip` mechanism opens it on the hinge spring; it creaks as it opens and thuds as it closes.

## API

`Lid open? armed? hinge? material? color? size? host?`

SwiftUI: `MetalLid(open: 18, armed: true, size: 160)`.
