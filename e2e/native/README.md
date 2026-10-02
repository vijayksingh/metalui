# Native glyph disabled policy

`icon-disabled-proof.swift` is a SwiftUI integration fixture. Build it in an iOS app that depends on the local MetalUI package and launch on a simulator with its console attached. It sends the same hold request to three real `MetalIcon(.trash)` views: enabled, disabled from the start, and disabled during the hold.

Capture after `MU_PROOF_ACTIVE` and again after `MU_PROOF_DISABLED`. The enabled lid opens in both captures, the disabled lid stays shut, and the third lid returns to rest when its environment disables it. This exercises the public view and inherited SwiftUI environment; it does not inspect animation internals.

Observed on iPhone 15 / iOS 17.5: [active](../../docs/captures/swift/icon-disabled-active.png), [cancelled](../../docs/captures/swift/icon-disabled-cancelled.png). The generic iOS Simulator package build and macOS `swift build` also pass. An enabled decorative glyph still plays its result `act` request; a disabled ancestor suppresses that request.
