# Key

A big key standing on its skirt: the Keycap as a gadget draws it. React: `Key` from `@unlocalhosted/metalui`. SwiftUI: `MetalKey`. A part: it has a look and no job of its own.

## Use it for

- The keys of a gadget that stands for commands or shortcuts (the keycap chord).
- The key a person would press: give that one the accent, and only that one.

## Don't use it for

- Showing a shortcut in the interface. That is the inline Keycap (`Kbd`), a readout that is never pressed.
- A button. A gadget is never a control; wrap it in a Button to operate it.

## Anatomy

A rounded skirt the size of the Part (112 × 112, radius 0.21 of it), darker than the face; a face 0.8 of the key on top of it, lifted toward the top edge; one glyph engraved into the face, a dark cut in the face's own ink with a lit lower edge; its shadow as its own layer (`key.shadow`). Tokens: `gadgets.key`.

## States

- **Rest.** The face stands on its skirt.
- **Pressed.** The face drops 6 units into the skirt and spreads a little under the finger (1.02 across, 0.96 down), on the `release` spring; the skirt never moves. With reduced motion it still dips, at once: the press mechanism keeps its travel.
- **Sound.** In a gadget, the press mechanism strikes each key's material as it bottoms out, and again quieter and higher as it hits its top stop.

## API

`Key glyph? accent? material? ("clay" | "ceramic") color? pressed? size? host?`

SwiftUI: `MetalKey(glyph: "⌘", accent: false, pressed: isDown, size: 96)`.

In a gadget spec: `{ "part": "key", "role": "actor", "params": { "glyph": "⌘" } }`. The `press` mechanism binds keys to its `keys` slot and plays them as a chord.
