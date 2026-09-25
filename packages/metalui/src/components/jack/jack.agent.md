# Jack

A knurled satin-steel nut around a socket, where a plug seats. React: `Jack` from `@unlocalhosted/metalui`. SwiftUI: `MetalJack`. A part: it has a look and no job of its own.

## Use it for

- Where a connection is made in a gadget: the patch bay's sockets, a rig's inputs and outputs.
- A socket that shows a state from inside: lit green for live, blue for a link.

## Don't use it for

- A button or a knob: a jack is never turned or pressed. The plug in it moves; the jack stays.
- A decorative ring: if nothing plugs in, it is not a jack.

## Anatomy

A nut of satin steel (the metal material, lit by the one light) with twelve knurls, around a socket whose radius is 0.44 of the nut's (tokens `gadgets.jack`). The socket is a cut: its floor is dark steel, its top wall is shaded. Lit, a lamp glows at its bottom in a signal colour (live, link, waiting, failed).

## API

`Jack lit? ("live" | "link" | "waiting" | "failed" | null) knurls? size? (px) host?`

SwiftUI: `MetalJack(lit: .link, size: 96)`.

In a gadget spec, a jack is `{ "part": "jack", "role": "trim" }`; the seat mechanism binds it to its `socket` slot.
