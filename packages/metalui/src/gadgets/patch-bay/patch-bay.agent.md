# Patch bay

A gadget for sync, drawn from a spec. React: `<Gadget spec={patchBay} state="syncing" />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/patch-bay.gadget.json`. An Object (an emblem): it stands for the person's sync, and is never a control.

## Use it for

- Settings › Sync, and the moments sync is going on, has just finished, or has failed.
- A sync rig, where its `done` pulse and `healthy` output drive other gadgets.

## Don't use it for

- A button. To operate it, wrap it in a Button and drive `state` and `act`.
- Anything that is not a connection between two things.

## States

| State | Lamp | Plug | News |
|---|---|---|---|
| rest | off | seated | none |
| connected | green, steady | seated | none |
| syncing | amber, breathing | lifted a little (y −7) | none |
| done | green; flickers as the plug lands | seats again, with the act | `done` on the beeper |
| failed | red, blinking twice | pulled out and lying aside | `failed` on the beeper; hint "check your connection" |

Entering *done* plays the seat act: the plug lifts, hangs and clicks home, the lamp flickers as it lands and the beeper says done. Its cord follows the plug and swings. With reduced motion, parts go straight to their poses, and the click, the lamp and the beep stay.

## Compose your own

Every gadget is a spec like this one: Parts from the catalog placed on a 400-unit canvas, a job and a feel (colours come from them), a mechanism bound to the Parts it moves, and states. Change the spec and the renderer draws the new gadget. `validateGadget` returns every problem with a code, path and fix.
