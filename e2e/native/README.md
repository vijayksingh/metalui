# Native glyph disabled policy

`icon-disabled-proof.swift` is a SwiftUI integration fixture. Build it in an iOS app that depends on the local MetalUI package and launch on a simulator with its console attached. It sends the same hold request to three real `MetalIcon(.trash)` views: enabled, disabled from the start, and disabled during the hold.

Capture after `MU_PROOF_ACTIVE` and again after `MU_PROOF_DISABLED`. The enabled lid opens in both captures, the disabled lid stays shut, and the third lid returns to rest when its environment disables it. This exercises the public view and inherited SwiftUI environment; it does not inspect animation internals.

Observed on iPhone 15 / iOS 17.5: [active](../../docs/captures/swift/icon-disabled-active.png), [cancelled](../../docs/captures/swift/icon-disabled-cancelled.png). The generic iOS Simulator package build and macOS `swift build` also pass. An enabled decorative glyph still plays its result `act` request; a disabled ancestor suppresses that request.


# Native Toast keyboard deck

Run `python3 e2e/native/run-toast-focus-proof.py` on macOS with Xcode. It builds the local package, opens a temporary native SwiftUI app, sends real Tab events through its window, and measures the public hit regions. Focus fans the deck out; both undoable cards survive beyond their timeout while focused; leaving focus folds it. A subsequent plain result leaves ⌘Z bound to the latest undoable card behind it, and the key dismisses that card after running its callback. The app closes and the temporary bundle is removed.

Set `METALUI_NATIVE_CAPTURE` to an absolute directory to save the focused deck. Proof capture: [focused Toast deck](../../docs/captures/swift/toast-keyboard-focus-bone.png). This feature fixture uses a real window; ImageRenderer stills cannot prove keyboard focus.

# Native RadioKeys keyboard form

Run `python3 e2e/native/run-radio-keys-proof.py` on macOS. A real SwiftUI window starts with 10:00 chosen, focuses a cap using Tab, and sends arrow and Space events. Arrows skip the disabled 11:00 option; pressing the chosen key keeps it chosen; the reverse arrow returns to 10:00. It exercises public selection bindings and native focus, without inspecting animation internals.

# Native scoped motion policy

`motion-policy-proof.swift` is a public-API SwiftUI host. Two trash glyphs receive the same hold; one is inside a dynamically reduced subtree, with a nested `false` probe. The outside glyph continues while the scoped glyph cancels. The nested probe remains reduced; restoring the scope does not resume the cancelled clock. The OS accessibility preference is always ORed with the scope.

Observed on iPhone 15 / iOS 17.5: [both holding](../../docs/captures/swift/motion-policy-active.png), [scope reduced](../../docs/captures/swift/motion-policy-reduced.png), [scope restored](../../docs/captures/swift/motion-policy-restored.png). The generic iOS Simulator package build and macOS `swift build -j 2` pass. Existing native readers and the shared animation modifier use `@MetalMotionPreference`.

# Mac WKWebView haptic transport

Run `python3 e2e/native/run-haptic-webview-proof.py`. A real WKWebView sends alignment, detent and refusal requests through the shipped native bridge. Its device callback records the matching AppKit patterns; invalid names and subframe requests do not reach the device. Detaching twice is safe and stops delivery. This proves transport and pattern mapping, not physical trackpad sensation.


# Native shared morph

`morph-proof.swift` launches real `MetalMorphIcon` instances at 16 and 24 points. It compares prepared final frames with authored resting glyphs in both colorways, interrupts a flight, reduces a scope midflight, turns a chevron and switches safely to Solid glyph. A separate lock instance remains still throughout. The host includes the real bounded NumberField keys.

Run either fixture against an iOS Simulator build (use your booted simulator UUID):

```sh
xcodebuild -jobs 2 -scheme MetalUI -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/metalui-native build CODE_SIGNING_ALLOWED=NO OTHER_SWIFT_FLAGS=-j2
python3 e2e/native/run-proof.py e2e/native/morph-proof.swift --derived-data /tmp/metalui-native --simulator YOUR_BOOTED_UUID --captures /tmp/metalui-native-captures
```

Observed on iPhone 15 / iOS 17.5: [bone comparison](../../docs/captures/swift/morph-bone-check.png), [graphite depth](../../docs/captures/swift/morph-graphite-eye-off.png), [interruption](../../docs/captures/swift/morph-interrupted.png), [reduced during flight](../../docs/captures/swift/morph-reduced.png), [quarter turn](../../docs/captures/swift/morph-turn.png), [Solid glyph fallback](../../docs/captures/swift/morph-fallback.png). Final Canvas and resting MetalIcon silhouettes, line widths and fills match at both sizes. MacOS and generic iOS Simulator builds pass.

Thread CPU on the debug iOS17.5 simulator host: initial copy/check planning39.9ms + path preparation13.6ms; warm lock/warning, send/stop and eye/eye-off planning15.6–27.6ms + path preparation13.5–25.4ms. This preparation runs away from the main actor. ImageRenderer CPU per prepared 24-point frame at3× was55–89µs. These numbers measure CPU preparation/render submission, not GPU work or physical-device frame pacing. Each instance holds54 prepared frames only during its440ms settle; the single shared38KB planner resource is parsed once.


# Native NumberField keys

`number-field-proof.swift` keeps a real bounded field available for interaction. The adjustable value is its own accessible element; the two native buttons retain their button roles and disabled traits. Observed on iPhone15 / iOS17.5 through Device Hub: Increase Copies takes2→3 and exposes the increase button as disabled; Decrease Copies takes3→2→1 and exposes the decrease button as disabled. [Rest](../../docs/captures/swift/number-field-rest.png), [maximum](../../docs/captures/swift/number-field-max.png), [minimum](../../docs/captures/swift/number-field-min.png). The generic simulator package build passes. Run it with the same `run-proof.py` command above, then operate the named keys during its60-second interactive interval.

# Native Menu checkbox rows

Run `python3 e2e/native/run-menu-check-proof.py` on macOS. A real SwiftUI window sends arrow, Return, Space and Escape events to `MetalMenuPanel`. A setting toggles while the panel stays open; a mixed parent becomes fully selected; subsequent host updates preserve the highlighted row; disabled rows cannot run; Escape dismisses. State comes through public `MetalMenuItem` callbacks. Set `METALUI_NATIVE_CAPTURE` to an absolute directory to capture the selected settings.
