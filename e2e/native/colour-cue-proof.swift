import AppKit
import SwiftUI
import MetalUI

/// Integration in a real macOS app: public controls, popup/window keys, pointer and source history.
@MainActor final class ColourFeature {
    var checks: [Bool] = []
    func unwrap<T>(_ value: T?) throws -> T { guard let value else { throw CocoaError(.coderValueNotFound) }; return value }
    func checkGreaterThan(_ a: CGFloat, _ b: CGFloat) { checks.append(a > b) }
    func checkFalse(_ v: Bool) { checks.append(!v) }
    func checkNotEqual<T: Equatable>(_ a: T, _ b: T) { checks.append(a != b) }
    func checkEqual<T: Equatable>(_ a: T, _ b: T) { checks.append(a == b) }
    func checkEqual(_ a: CGFloat, _ b: CGFloat, accuracy: CGFloat) { checks.append(abs(a-b) <= accuracy) }
    private let original = "🎨 Paint #ff6b3d with Sam."
    private final class Measure { var width: CGFloat = .zero }
    private struct Width: PreferenceKey {
        static var defaultValue: CGFloat = .zero
        static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
    }
    private struct Host: View {
        @ObservedObject var document: MetalCueDocument
        let colorway: MetalColorway
        let measure: Measure
        private var range: NSRange { (document.source as NSString).range(of: "#[0-9A-Fa-f]{6}", options: .regularExpression) }
        private var value: String { (document.source as NSString).substring(with: range) }
        var body: some View {
            VStack(alignment: .leading, spacing: MetalSpace.s24) {
                HStack(alignment: .firstTextBaseline, spacing: MetalSpace.s8) {
                    Text("Paint")
                    MetalColourCue("Paint colour", value: Binding(get: { value }, set: { _ in }),
                        onBegin: { document.begin(range) }, onSourceChange: document.replace,
                        onCommit: document.commit, onCancel: { if $0 != "external" { document.cancel() } })
                        .keyboardShortcut(.defaultAction)
                        .background(GeometryReader { proxy in Color.clear.preference(key: Width.self, value: proxy.size.width) })
                        .onPreferenceChange(Width.self) { measure.width = $0 }
                    Text("with Sam.")
                }
                Text(document.source)
                MetalButton("Undo colour edit", action: document.undo).keyboardShortcut("z", modifiers: .command)
            }.font(.metal(MetalType.content)).padding(MetalSpace.s24).frame(width: 600, height: 220)
                .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
                .metalColorway(colorway).metalReduceMotion(colorway == .graphite)
        }
    }
    private func key(_ text: String, code: UInt16, window: NSWindow, modifiers: NSEvent.ModifierFlags = []) throws {
        let event = try unwrap(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: modifiers,
            timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil,
            characters: text, charactersIgnoringModifiers: text, isARepeat: false, keyCode: code))
        if !window.performKeyEquivalent(with: event) { window.sendEvent(event) }
    }
    private func capture(_ name: String, _ host: NSView) throws {
        guard let root = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let window = host.window,
              let image = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return }
        try NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: root).appendingPathComponent(name + ".png"))
    }
    func runFeature() async throws {
        _ = NSApplication.shared
        NSApp.setActivationPolicy(.regular)
        for colorway in MetalColorway.allCases {
            let document = MetalCueDocument(original, selection: .init(start: 2, end: 2)), measure = Measure()
            let host = NSHostingView(rootView: Host(document: document, colorway: colorway, measure: measure))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host; window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await Task.sleep(for: .milliseconds(300)); let width = measure.width; checkGreaterThan(width, 0)
            try key("\r", code: 36, window: window); try await Task.sleep(for: .milliseconds(500))
            let popup = try unwrap(NSApp.windows.first { $0 !== window && $0.isVisible && String(describing: type(of: $0)).contains("Popover") })
            popup.makeKeyAndOrderFront(nil); popup.makeFirstResponder(popup.contentView)
            for _ in 0..<4 where document.source == original {
                popup.selectNextKeyView(nil); try key("\u{F703}", code: 124, window: popup); try await Task.sleep(for: .milliseconds(150))
            }
            let once = document.source; checkNotEqual(once, original); checkFalse(document.editing)
            try key("\u{F703}", code: 124, window: popup); try await Task.sleep(for: .milliseconds(150))
            checkNotEqual(document.source, once); checkEqual(measure.width, width, accuracy: 0.1)
            try capture("colour-cue-well-\(colorway.rawValue)", try unwrap(popup.contentView))
            try key("\u{1b}", code: 53, window: popup); try await Task.sleep(for: .milliseconds(200))
            try key("z", code: 6, window: window, modifiers: .command); checkEqual(document.source, once)
            try key("z", code: 6, window: window, modifiers: .command); checkEqual(document.source, original); checkEqual(document.selection.start, 2)
            try key("\r", code: 36, window: window); try await Task.sleep(for: .milliseconds(400))
            let heldPopup = try unwrap(NSApp.windows.last { $0 !== window && $0.isVisible && String(describing: type(of: $0)).contains("Popover") })
            heldPopup.makeKeyAndOrderFront(nil)
            let contents = try unwrap(heldPopup.contentView)
            // Public rendered geometry: hue track sits one well inset above the popup's bottom.
            let y = MetalRecipes.popover.points("self.pad") + MetalSpace.s16 + MetalRecipes.slider.points("regular.knob")
            let point = contents.convert(NSPoint(x: contents.bounds.midX, y: contents.isFlipped ? contents.bounds.maxY - y : y), to: nil)
            for (type, x) in [(NSEvent.EventType.leftMouseDown, point.x), (.leftMouseDragged, point.x + 40), (.leftMouseDragged, point.x + 70), (.leftMouseUp, point.x + 70)] {
                let event = try unwrap(NSEvent.mouseEvent(with: type, location: NSPoint(x: x, y: point.y), modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: heldPopup.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1))
                heldPopup.sendEvent(event); try await Task.sleep(for: .milliseconds(100))
            }
            checkNotEqual(document.source, original); checkFalse(document.editing)
            try key("\u{1b}", code: 53, window: heldPopup); try await Task.sleep(for: .milliseconds(200))
            try key("z", code: 6, window: window, modifiers: .command); checkEqual(document.source, original); checkFalse(document.canUndo)
            try capture("colour-cue-\(colorway.rawValue)", host)
        }
    }
}

@main struct ColourCueProof: App {
    var body: some Scene {
        WindowGroup { Text("Native colour cue feature proof").task {
            let proof = ColourFeature()
            do { try await proof.runFeature() }
            catch { proof.checks.append(false); print(error) }
            let result = "checks=\(proof.checks) passed=\(!proof.checks.contains(false))"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        } }
    }
}
