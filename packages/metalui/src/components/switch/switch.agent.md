# Switch

A setting that is on or off and takes effect at once. React: `Switch` from `@unlocalhosted/metalui` (Base UI Switch). SwiftUI: `MetalSwitch`. Its look is the `switch` recipe.

## Use it for

- Settings that apply immediately: "Sync this canvas", "Share usage data", "Show the grid".

## Don't use it for

- A choice that needs Save (use a checkbox in a form), one of several options (use a segmented control), or a task (use the checkbox in the margin).

## Anatomy

- Track: a sunk pill, 40 × 24 (small 32 × 20), padding 2, the track well; on, a soft green gradient with an inner shadow.
- Thumb: a raised round cap, 20 (small 16), the segmented thumb's material.

## States and motion

| State | Look |
|---|---|
| off | thumb left, plain well |
| on | thumb right (travel 16, small 12) on the part spring; track green, fading on settle |
| pressed | the thumb stretches 4 pt toward where it is going |
| focus | the green ring at offset 2, keyboard only |
| disabled | 40 % |

Reduce Motion: the thumb moves at once; the colour still fades.

## API

| React | SwiftUI |
|---|---|
| `checked`, `defaultChecked`, `onCheckedChange` | `isOn:` |
| `size` (`regular`, `small`) | `size:` |
| `disabled` | `.disabled()` |
| `aria-label` | `.accessibilityLabel` |

## Keyboard and accessibility

- A button with the switch role; Space toggles. Pair it with a visible label (the settings row does), or give it `aria-label`.

## Rules

- A switch acts at once. If the change needs confirming, it is not a switch.
- The label says what is on, not "Enable …": "Sync this canvas".
