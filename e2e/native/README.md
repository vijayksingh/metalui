# Native glyph disabled policy

`icon-disabled-proof.swift` is a SwiftUI integration fixture. Build it in an iOS app that depends on the local MetalUI package and launch on a simulator with its console attached. It sends the same hold request to three real `MetalIcon(.trash)` views: enabled, disabled from the start, and disabled during the hold.

Capture after `MU_PROOF_ACTIVE` and again after `MU_PROOF_DISABLED`. The enabled lid opens in both captures, the disabled lid stays shut, and the third lid returns to rest when its environment disables it. This exercises the public view and inherited SwiftUI environment; it does not inspect animation internals.

Observed on iPhone 15 / iOS 17.5: [active](../../docs/captures/swift/icon-disabled-active.png), [cancelled](../../docs/captures/swift/icon-disabled-cancelled.png). The generic iOS Simulator package build and macOS `swift build` also pass. An enabled decorative glyph still plays its result `act` request; a disabled ancestor suppresses that request.


# Native Toast keyboard deck

Run `python3 e2e/native/run-toast-focus-proof.py` on macOS with Xcode. It builds the local package, opens a temporary native SwiftUI app, sends real Tab events through its window, and measures the public hit regions. Focus fans the deck out; both undoable cards survive beyond their timeout while focused; leaving focus folds it. A subsequent plain result leaves ⌘Z bound to the latest undoable card behind it, and the key dismisses that card after running its callback. The app closes and the temporary bundle is removed.

Set `METALUI_NATIVE_CAPTURE` to an absolute directory to save the focused deck. Proof capture: [focused Toast deck](../../docs/captures/swift/toast-keyboard-focus-bone.png). This feature fixture uses a real window; ImageRenderer stills cannot prove keyboard focus.

# Native RadioKeys keyboard form

Run `python3 e2e/native/run-radio-keys-proof.py` on macOS. A real SwiftUI window starts with 10:00 chosen, focuses a cap using Tab, and sends arrow and Space events. Arrows skip the disabled 11:00 option; pressing the chosen key keeps it chosen; the reverse arrow returns to 10:00. It exercises public selection bindings and native focus, without inspecting animation internals.
