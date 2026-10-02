import AppKit
import SwiftUI
import MetalUI

@main struct ButtonWordsProof: App { var body: some Scene { WindowGroup { Receipt() } } }
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @Environment(\.scenePhase) private var scenePhase
    @State private var liveScene: ScenePhase = .background
    @State private var state: MetalButtonState = .idle
    @State private var reduced = false
    @State private var held = false
    @State private var disabled = false
    @State private var changedTitle = false
    @State private var installation = 0
    @State private var calls = 0
    @State private var capFrame = CGRect.zero
    @FocusState private var sentinelFocused: Bool
    var body: some View {
        VStack(spacing: MetalSpace.s24) {
            MetalButton(held ? (changedTitle ? "Remove" : "Delete") : "Save", cap: held ? .destructive : .standard,
                        hold: held, state: state, waitingLabel: "Saving…", doneLabel: "Saved", errorLabel: "Try again") {
                calls += 1
                if !held { state = .waiting }
            }
            .disabled(disabled).id(installation)
            .background(CapFrame { capFrame = $0 }.allowsHitTesting(false))
            Text("callbacks \(calls) · \(held ? "hold" : "request") · \(reduced ? "reduced" : "full")").font(.metal(MetalType.readout))
            FocusSentinel().frame(width: 120, height: 24).focusable().focused($sentinelFocused)
        }
        .padding(MetalSpace.s24).frame(width: 700, height: 220)
        .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
        .metalColorway(colorway).metalReduceMotion(reduced)
        .onAppear { liveScene = scenePhase }
        .onChange(of: scenePhase) { _, next in liveScene = next }
        .task {
            try? await Task.sleep(for: .seconds(1)); NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first else { fatalError("Missing Button window") }
            window.makeKeyAndOrderFront(nil)
            try? await Task.sleep(for: .milliseconds(400))
            let savedPointer = NSEvent.mouseLocation; CGWarpMouseCursorPosition(.zero)
            defer { CGWarpMouseCursorPosition(CGPoint(x: savedPointer.x, y: (NSScreen.screens.first?.frame.height ?? .zero) - savedPointer.y)) }
            @MainActor func pause(_ seconds: Double) async { try? await Task.sleep(for: .seconds(seconds)) }
            @MainActor func pointer(_ type: NSEvent.EventType) {
                let point = NSPoint(x: capFrame.midX, y: capFrame.midY)
                window.sendEvent(NSEvent.mouseEvent(with: type, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: window.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1)!)
            }
            @MainActor func key(_ type: NSEvent.EventType, returnKey: Bool = false, escape: Bool = false, repeatKey: Bool = false, tab: Bool = false) {
                window.sendEvent(NSEvent.keyEvent(with: type, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: window.windowNumber, context: nil, characters: tab ? "\t" : escape ? "\u{1b}" : returnKey ? "\r" : " ", charactersIgnoringModifiers: tab ? "\t" : escape ? "\u{1b}" : returnKey ? "\r" : " ", isARepeat: repeatKey, keyCode: tab ? 48 : escape ? 53 : returnKey ? 36 : 49)!)
            }
            @MainActor func keyboardPress() async { key(.keyDown); await pause(0.05); key(.keyUp); await pause(0.05) }
            @MainActor func hasControlFocus() -> Bool { window.firstResponder != nil && window.firstResponder !== window.contentView }
            @MainActor func press() async { pointer(.mouseMoved); pointer(.leftMouseDown); await pause(0.05); pointer(.leftMouseUp); await pause(0.05) }
            @MainActor func renderedWords() -> WordPixels? {
                guard capFrame.width > 0, let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return nil }
                let scale = Double(pixels.width) / window.frame.width
                let recipe = MetalRecipes.button
                let left = recipe.points("self.pad") + recipe.points("self.glyph") + recipe.points("self.gap")
                let words = CGRect(x: (capFrame.minX + left) * scale,
                    y: (window.frame.height - capFrame.maxY + capFrame.height * 0.18) * scale,
                    width: (capFrame.width - left - recipe.points("self.pad")) * scale, height: capFrame.height * 0.64 * scale)
                guard let image = pixels.cropping(to: words) else { return nil }
                let bitmap = NSBitmapImageRep(cgImage: image)
                var minX = bitmap.pixelsWide, minY = bitmap.pixelsHigh, maxX = -1, maxY = -1, count = 0, sumY = 0
                for y in 0..<bitmap.pixelsHigh { for x in 0..<bitmap.pixelsWide {
                    guard let ink = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                    let solid = colorway == .bone ? max(ink.redComponent, ink.greenComponent, ink.blueComponent) < 0.4
                        : min(ink.redComponent, ink.greenComponent, ink.blueComponent) > 0.7
                    if solid { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y); count += 1; sumY += y }
                } }
                guard count > 0 else { return nil }
                return WordPixels(bounds: CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1), count: count, meanY: Double(sumY) / Double(count))
            }
            @MainActor func focusRingVisible() -> Bool {
                guard let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return false }
                let scale = Double(pixels.width) / window.frame.width
                let frame = capFrame.insetBy(dx: -MetalSpace.s8, dy: -MetalSpace.s8)
                guard let cropped = pixels.cropping(to: CGRect(x: frame.minX * scale, y: (window.frame.height - frame.maxY) * scale, width: frame.width * scale, height: frame.height * scale)) else { return false }
                let bitmap = NSBitmapImageRep(cgImage: cropped)
                var green = 0
                for y in 0..<bitmap.pixelsHigh { for x in 0..<bitmap.pixelsWide {
                    guard let ink = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                    if ink.greenComponent > ink.redComponent * 1.5 && ink.greenComponent > ink.blueComponent * 1.2 { green += 1 }
                } }
                return green > 50
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"],
                      let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return }
                try? NSBitmapImageRep(cgImage: pixels).representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
            }
            window.makeFirstResponder(window.contentView); window.selectNextKeyView(nil); await pause(0.1)
            key(.keyDown, tab: true); key(.keyUp, tab: true); await pause(0.1); let nextIsSentinel = sentinelFocused
            key(.keyDown, tab: true); key(.keyUp, tab: true); await pause(0.1)
            let oneFocusStop = nextIsSentinel && !sentinelFocused && focusRingVisible()
            await press(); await pause(MetalWaiting.showDelay + 0.4)
            let fullRequest = calls == 1 && state == .waiting && hasControlFocus()
            capture("button-full-waiting")
            await keyboardPress(); let blocked = calls == 1
            state = .done; await pause(MetalWaiting.minimumVisible + 0.5); capture("button-full-done")
            reduced = true; state = .idle; await pause(0.3)
            let keyRest = renderedWords(); capture("button-keyboard-rest"); key(.keyDown); await pause(0.2); let keyDownWords = renderedWords()
            let keyboardDepth = keyRest != nil && keyDownWords != nil && abs(keyDownWords!.meanY - keyRest!.meanY - MetalRecipes.button.points("self.travel") * window.backingScaleFactor) < 0.2 && calls == 1
            capture("button-keyboard-down"); key(.keyUp); await pause(MetalWaiting.showDelay + 0.3)
            let reducedRequest = calls == 2 && state == .waiting && hasControlFocus()
            capture("button-reduced-waiting")
            state = .idle; reduced = false; await pause(0.4)
            await press(); await pause(MetalWaiting.showDelay + 0.02)
            let beforePolicyFocus = window.firstResponder
            reduced = true; await pause(0.12)
            let liveWords = renderedWords(); let liveFocus = hasControlFocus() && beforePolicyFocus === window.firstResponder
            capture("button-live-reduced")
            await pause(0.4); let stableWords = renderedWords()
            let travelStopped = liveWords?.matches(stableWords) == true
            capture("button-live-settled")
            installation += 1; await pause(0.1); pointer(.mouseMoved); await pause(MetalWaiting.showDelay + 0.3)
            let canonical = stableWords?.matches(renderedWords()) == true
            capture("button-canonical-reduced")
            state = .idle; await pause(0.3); window.makeFirstResponder(window.contentView); window.selectNextKeyView(nil); await pause(0.1); key(.keyDown, returnKey: true); await pause(0.05); key(.keyUp, returnKey: true); await pause(MetalWaiting.showDelay + 0.3)
            let returnActivation = calls == 4 && state == .waiting
            key(.keyDown, returnKey: true); key(.keyUp, returnKey: true); let returnBlocked = calls == 4
            state = .idle; held = true; changedTitle = false; reduced = false; installation += 1
            await pause(0.3); window.makeFirstResponder(window.contentView); window.selectNextKeyView(nil); await pause(0.1)
            let beforeHold = calls
            key(.keyDown); await pause(0.1); key(.keyDown, repeatKey: true); changedTitle = true; await pause(0.02); reduced = true
            await pause(MetalRecipes.button.durationSeconds("hold.duration") + 0.1); key(.keyUp); await pause(0.1)
            let heldCallback = calls == beforeHold + 1 && hasControlFocus()
            let focusRing = focusRingVisible()
            capture("button-held-reduced")
            key(.keyDown); await pause(0.15); key(.keyUp); await pause(MetalRecipes.button.durationSeconds("hold.duration") + 0.1)
            let shortHoldCanceled = calls == beforeHold + 1
            key(.keyDown); await pause(0.15); key(.keyDown, escape: true); key(.keyUp); await pause(MetalRecipes.button.durationSeconds("hold.duration") + 0.1)
            let escapeCanceled = calls == beforeHold + 1
            key(.keyDown); await pause(0.15); disabled = true; await pause(MetalRecipes.button.durationSeconds("hold.duration") + 0.1); key(.keyUp)
            let disabledCanceled = calls == beforeHold + 1
            disabled = false; await pause(0.2); window.makeFirstResponder(window.contentView); window.selectNextKeyView(nil); await pause(0.1)
            key(.keyDown); pointer(.leftMouseDown); await pause(MetalRecipes.button.durationSeconds("hold.duration") + 0.2); pointer(.leftMouseUp); key(.keyUp); await pause(0.1)
            let mixedOnce = calls == beforeHold + 2
            let passed = liveScene == .active && NSApp.isActive && fullRequest && blocked && reducedRequest && liveFocus && travelStopped && canonical && keyboardDepth && returnActivation && returnBlocked && oneFocusStop && focusRing && heldCallback && shortHoldCanceled && escapeCanceled && disabledCanceled && mixedOnce
            let report = "full=\(fullRequest) blocked=\(blocked) reduced=\(reducedRequest) liveFocus=\(liveFocus) travelStopped=\(travelStopped) canonicalRest=\(canonical) keyboardDepth=\(keyboardDepth) returnActivation=\(returnActivation) returnBlocked=\(returnBlocked) oneFocusStop=\(oneFocusStop) focusRing=\(focusRing) holdCallback=\(heldCallback) shortHoldCanceled=\(shortHoldCanceled) escapeCanceled=\(escapeCanceled) disabledCanceled=\(disabledCanceled) mixedOnce=\(mixedOnce) calls=\(calls) scene=\(liveScene) activeApp=\(NSApp.isActive) responder=\(String(describing: window.firstResponder)) cap=\(capFrame) passed=\(passed)"
            try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8); NSApp.terminate(nil)
        }
    }
}
private struct CapFrame: NSViewRepresentable {
    var report: (CGRect) -> Void
    func makeNSView(context: Context) -> Probe { let view = Probe(); view.report = report; return view }
    func updateNSView(_ view: Probe, context: Context) { view.report = report; view.measure() }
    final class Probe: NSView {
        var report: ((CGRect) -> Void)?
        override func layout() { super.layout(); measure() }
        override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); measure() }
        func measure() { DispatchQueue.main.async { [weak self] in guard let self, self.window != nil else { return }; self.report?(self.convert(self.bounds, to: nil)) } }
    }
}

// Reduced motion permits the existing cap colour fade. Compare real ink placement/coverage,
// so paint-only antialias differences cannot masquerade as continuing travel or a wrong offset.
private struct WordPixels {
    let bounds: CGRect
    let count: Int
    let meanY: Double
    func matches(_ other: WordPixels?) -> Bool {
        guard let other else { return false }
        return bounds == other.bounds && abs(meanY - other.meanY) < 0.2 && abs(count - other.count) <= max(2, count / 50)
    }
}

private struct FocusSentinel: NSViewRepresentable {
    func makeNSView(context: Context) -> Key { let key = Key(); key.title = "Focus sentinel"; key.bezelStyle = .rounded; return key }
    func updateNSView(_ view: Key, context: Context) {}
    final class Key: NSButton { override var acceptsFirstResponder: Bool { true } }
}
