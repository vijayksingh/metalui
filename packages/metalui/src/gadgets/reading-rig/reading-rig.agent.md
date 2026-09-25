# Reading rig

Gadgets wired together, drawn from a rig spec. React: `<Rig spec={reading} catalog={{ 'needle-gauge': …, 'counter-drum': … }} values={{ today: { value: minutes } }} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/reading.rig.json`. An Object made of Objects: it stands for a habit and its record, and is never a control.

## Use it for

- Showing that one thing drives another: reaching today's goal adds a day to the streak.
- Any two to eight gadgets whose values flow one way: a rig spec names them, places them on a grid and wires out ports to in ports.

## Don't use it for

- Unrelated gadgets side by side: that's a set, with no cables.
- Two-way links: values flow one way, and the validator refuses a cycle.

## How it moves

`values` sets a gadget's inputs from outside (here today's minutes). The rig works out what each cable carries (`over` pulses as the needle crosses its threshold, and the `count` map turns a pulse into +1), runs a bead of light along the cord, and the gadget at the far end answers when the bead arrives: the streak's drums roll. Staying past the line sends nothing; coming back under and crossing again adds another day. With reduced motion values arrive at once, without the bead.

## Composing a rig

A rig spec is `{ grid: [cols, rows], gadgets: { inst: { gadget, at } }, cables: [{ from: "inst.outPort", to: "inst.inPort", map? }] }`. Each wired port gets a jack beside its gadget (outs on the right, ins on the left) with a plug and a drooping cord between. `validateRig` checks the grid, the ports, the maps, fan-in and fan-out, cycles and the set rules across the gadgets.
