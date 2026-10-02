# Dialog

A modal layer. React: `Dialog` with parts `Dialog.Root` (open, onOpenChange) and `Dialog.Popup` (a `Surface`, material `plate` by default). SwiftUI: `MetalDialog(isPresented:) { popup: … }`.

## Behaviour

- Focus moves in and stays in; Escape and a click on the scrim close it; focus returns to the opener.
- The popup rises a step (−6, from .985) on the surface spring and closes on release; under Reduce Motion it fades in place.
- Name it: `aria-label` on the popup.

## Rename canvas

Compose RenameEditor inside Dialog.Popup, under Dialog.Title. RenameEditor owns its field and actions; do not add a second actions row. Control open and refuse dismissal while onPendingChange is true. onRename persists; onRenamed(name, original) updates the document and captures original for Toast Undo. onDone closes after the pen/check and label drum settle, then the shared result beat. Validation and storage errors stay open; Enter retries, Escape cancels only while idle/error.

Swift: compose MetalRenameEditor inside MetalDialog popup with an EmptyView actions closure (no empty footer is drawn). Pass dismissible: !pending and guard the isPresented Binding setter during pending work. interactiveDismissDisabled preserves the native sheet while the operation lands. MetalRenameEditor calls the same onRenamed/onPendingChange/onDone callbacks. A UIKit hardware Escape key follows the editor's cancellation policy.
