# Dialog

A modal layer. React: `Dialog` with parts `Dialog.Root` (open, onOpenChange) and `Dialog.Popup` (a `Surface`, material `plate` by default). SwiftUI: `MetalDialog(isPresented:) { popup: … }`.

## Behaviour

- Focus moves in and stays in; Escape and a click on the scrim close it; focus returns to the opener.
- The popup rises a step (−6, from .985) on the surface spring and closes on release; under Reduce Motion it fades in place.
- Name it: `aria-label` on the popup.
