# Swift parity requests

## Lens symbol

- **Object:** `MetalIcon(.lens)` with regular and 16 point symbol assets in the generated catalog.
- **Missing:** `MetalIconName.lens` and its `mu.lens` / `mu.lens.16` assets. Mac client still carries `LensGlyphTwin` until the reference icon is authored in MetalUI's icon source and generated for Swift.
- **Demo source:** `app.js:44` draws a 20 by 20 view box, outer circle centered at 10 with radius 6, inner circle radius 2.2, round caps and a 1.55 stroke. `style.css:420` displays it at 14 by 14 in `--ink2` on the lens bar. Keep the 16 point cut legible at that size.
