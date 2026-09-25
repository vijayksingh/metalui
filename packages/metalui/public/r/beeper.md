# Beeper

A grille plate over a brass piezo disc. React: `Beeper` from `@unlocalhosted/metalui`. SwiftUI: `MetalBeeper`. A part: it has a look and no job of its own.

## Use it for

- A gadget that reports a state: the patch bay (synced, failed), the needle gauge (over a threshold).
- The only place a gadget makes a tone. Every other sound a gadget makes is the knock of its material.

## Don't use it for

- A gadget that only acts. Acts are heard through their materials; the beeper is for news.
- Playing on every act, or at rest. Only a change of state plays it.
- A light. It never glows; lamps are LEDs.

## Anatomy

A rounded plate (satin steel, or clay) with 3 to 7 slots, through which you see a brass disc in the plate's shadow (tokens `gadgets.beeper`). Its size is the Part's 44 × 24.

## States

- **Rest.** The disc sits dark behind the slots.
- **Sounding.** It plays one of the four earcons (`done`, `failed`, `waiting`, `ready` from `sound.beeper.earcons`). For each note, the disc flexes and catches the light, and the plate lifts a hair. Both follow the notes' own times, rising in 12 ms and falling in 70 ms, so what you see lands with what you hear.
- **Reduced motion.** No lift. The disc still catches the light, which is light, not movement.

## API

`Beeper slots? (3..7) material? ("metal" | "clay") color? earcon? beat? size? host?`. Change `beat` to play `earcon` again. The sound is the caller's: call `sound.beep(earcon)` alongside, so a muted beep can still be seen.

SwiftUI: `MetalBeeper(earcon: .done, trigger: count, size: 96)`, with `MetalSound.beep(.done)` alongside.

In a gadget spec: `{ "part": "beeper", "role": "trim", "params": { "slots": 5 } }`. A mechanism binds it to its `beeper` slot, and the mechanism's beep cue plays it.
