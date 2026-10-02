# Haptic catches

`MetalHaptic` is the shared native request: `alignment`, `detent`, or `refusal`.
Call `.perform()` on the main actor after an accepted interaction. Disabled and read-only
controls do not request feedback. Reduced motion changes visual travel, independently of
the physical catch. Nothing schedules feedback at rest.

macOS maps these requests to AppKit alignment, level change, and generic feedback. iOS
uses selection feedback for alignment/detents and an error notification for refusal.
Devices without haptic hardware remain usable.

The optional `MetalHapticWebViewBridge` decodes only these names from main-frame messages
and uses the same mapping. Its existing AppKit-pattern callback can route feedback to a
host device. `MetalWebHaptic` remains a typealias of `MetalHaptic`; detaching the bridge
stops delivery without retaining the web view.

`e2e/native/run-haptic-webview-proof.py` launches a real Mac WKWebView host. It verifies
all three requests, ignores invalid/subframe requests, and proves detach stops delivery.
This verifies the transport and device mapping; it does not measure physical sensation.
