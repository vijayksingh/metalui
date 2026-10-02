# One bar, several faces

The owner's rejected trough-and-pill silhouette is the binding constraint. The [Teenage Engineering TX–6 guide](https://teenage.engineering/guides/tx-6) separates physical buttons, parameter knobs, faders and the display; its [product page](https://teenage.engineering/products/tx-6) shows those controls embedded in an anodized aluminium body. [Braun LE01](https://www.braun-audio.com/en-DE/audio-hifi/speakers/wireless-speakers/le01/p/156105) lists distinct transport and volume operations on one product. These are references for the distinction between a handled control and a display, not evidence that either product uses MetalUI's bar shape or timing.

The MetalUI sketch follows the owner's explicit machined-bar direction:

```
  ( Undo | Redo )         one raised cap, fixed engraved seam
  (  −   | 100 % | + )    display is a sunk window, never a key
  ( Export PDF |  v  )    primary material across both faces
  ( ● Snap | ○ Grid )     latching faces keep their lamps
```

The existing Button material draws the outer bar. Its recipe has no trough padding or key gaps. Interior faces are square. Rule cuts a one-point dark line and light edge, inset by one nest. Each face owns its press shading and one-point travel; neighbours and the groove stay still. A very faint white light on the hovered face comes from a shared recipe, never a bar-wide lift. Focus is inset by the existing Button ring width.

Storyboard: press begins at zero, the handled face sinks over Button press50ms, then returns on release; the optional two-key rocker also tips one degree on part and springs back. In a split button, the menu segment stays held until the menu closes and its chevron turns180 on part. A display uses the existing label drum on settle. Reduce Motion removes rocker tilt and snaps chevron orientation; label changes keep their crossfade. All timings and material values are existing recipes; the optional angle is a reviewed source token.

The rocker is an opt-in exploration with its own specimen. It never applies to the zoom window, latched controls or a longer action group. Compact, per-key disabled, whole-group disabled, keyboard focus and both colorways have real specimens on the documentation page.
