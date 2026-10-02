import AppKit
import SwiftUI
import MetalUI

@MainActor final class ProvenanceFeature {
    var checks: [String: Bool] = [:]
    final class Frames { var values: [String: CGRect] = [:] }
    final class Gate: ObservableObject { @Published var readOnly = false }
    struct Host: View {
        @ObservedObject var document: MetalCueDocument
        @ObservedObject var gate: Gate
        let frames: Frames, colorway: MetalColorway
        var body: some View {
            VStack {
                MetalProvenanceDocumentExample(document: document, readOnly: gate.readOnly)
                if [UInt16(0xe9), UInt16(0x65)].contains(document.source.utf16.first ?? 0) {
                    MetalEnumCue(document.source.utf16.first == 0xe9 ? "NFC" : "NFD", choices: [.init("NFC"), .init("NFD")], label: "Accent source form",
                        onBegin: { document.begin(NSRange(location: 0, length: (document.source as NSString).range(of: " ").location)) },
                        onChange: { document.replace($0 == "NFC" ? "é" : "e\u{301}") }, onCommit: document.commit, onCancel: document.cancel)
                        .keyboardShortcut(.defaultAction)
                }
            }
                .padding(MetalSpace.s24).frame(width: 960, height: 340)
                .background(colorway.tokens.s.color).metalColorway(colorway)
                .metalReduceMotion(colorway == .graphite)
                .overlayPreferenceValue(MetalProvenanceCueAnchors.self) { anchors in
                    GeometryReader { proxy in Color.clear.preference(key: MetalProvenanceCueFrames.self, value: anchors.mapValues { proxy[$0] }) }
                }
                .onPreferenceChange(MetalProvenanceCueFrames.self) { frames.values = $0 }
        }
    }
    func wait(_ milliseconds: Int = 180) async throws { try await Task.sleep(for: .milliseconds(milliseconds)) }
    func unwrap<T>(_ value: T?) throws -> T { guard let value else { throw CocoaError(.coderValueNotFound) }; return value }
    func editor(_ view: NSView) -> NSTextView? {
        if let text = view as? NSTextView { return text }
        if let scroll = view as? NSScrollView, let text = scroll.documentView as? NSTextView { return text }
        return view.subviews.compactMap(editor).first
    }
    func key(_ text: String, code: UInt16, window: NSWindow, modifiers: NSEvent.ModifierFlags = []) throws {
        let event = try unwrap(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: modifiers,
            timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil,
            characters: text, charactersIgnoringModifiers: text, isARepeat: false, keyCode: code))
        if !window.performKeyEquivalent(with: event) { window.sendEvent(event) }
    }
    func mouse(_ type: NSEvent.EventType, point: NSPoint, window: NSWindow) throws {
        let event = try unwrap(NSEvent.mouseEvent(with: type, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
            windowNumber: window.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1))
        NSApp.sendEvent(event)
    }
    func point(_ name: String, frames: Frames, host: NSView) throws -> NSPoint {
        let bounds = try unwrap(frames.values[name]); return host.convert(NSPoint(x: bounds.minX + MetalSpace.s4, y: bounds.maxY - MetalType.content.line / 2), to: nil)
    }
    func run() async throws {
        NSApp.setActivationPolicy(.regular)
        let original = "🧠 " + MetalProvenanceDocumentExample.source
        for colorway in MetalColorway.allCases {
            let prefix = colorway.rawValue + ": "
            let document = MetalCueDocument(original, selection: .init(start: original.utf16.count, end: original.utf16.count))
            let frames = Frames(), gate = Gate()
            let host = NSHostingView(rootView: Host(document: document, gate: gate, frames: frames, colorway: colorway))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host; window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await wait(450)
            let text = try unwrap(editor(host)); window.makeFirstResponder(text)
            text.setSelectedRange(NSRange(location: original.utf16.count, length: 0)); try await wait()
            checks[prefix + "actual TextKit source"] = text.string == original && document.selection.start == original.utf16.count
            if ProcessInfo.processInfo.environment["METALUI_MINUTE_SOURCE_ONLY"] == "1" {
                let fractional = original.replacingOccurrences(of: "6h", with: "6.001min")
                document.setSource(fractional); document.commit(); try await wait()
                checks[prefix + "sub-minute words remain exact and plain"] = frames.values["sleep0"] == nil && text.string.utf16.elementsEqual(fractional.utf16)
                let exact = original.replacingOccurrences(of: "6h", with: "0.1h")
                document.setSource(exact); document.commit(); try await wait()
                let sleepPoint = try point("sleep0", frames: frames, host: host)
                try mouse(.leftMouseDown, point: sleepPoint, window: window); try await wait(70)
                try mouse(.leftMouseDragged, point: NSPoint(x: sleepPoint.x + 48, y: sleepPoint.y), window: window); try await wait()
                try mouse(.leftMouseUp, point: NSPoint(x: sleepPoint.x + 48, y: sleepPoint.y), window: window); try await wait()
                checks[prefix + "decimal hours convert exact whole minutes"] = document.source == original.replacingOccurrences(of: "6h", with: "6min")
                document.undo(); try await wait()
                checks[prefix + "conversion Undo restores authored decimal hours"] = document.source == exact && text.string == exact
                document.setSource(original.replacingOccurrences(of: "6h", with: "24.1h")); document.commit(); try await wait()
                checks[prefix + "outside host range stays plain"] = frames.values["sleep0"] == nil
                continue
            }
            let stateBefore = try unwrap(frames.values["state0"]), sleepBefore = try unwrap(frames.values["sleep0"])
            let statePoint = try point("state0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: statePoint, window: window); try await wait(70)
            try mouse(.leftMouseDragged, point: NSPoint(x: statePoint.x, y: statePoint.y + 48), window: window); try await wait()
            checks[prefix + "held state source preview"] = document.editing && document.source != original
            checks[prefix + "fixed state footprint"] = abs((frames.values["state0"]?.width ?? 0) - stateBefore.width) < 0.1
            try key("\u{1b}", code: 53, window: window); try mouse(.leftMouseUp, point: statePoint, window: window); try await wait()
            checks[prefix + "Escape restores source selection"] = document.source == original && !document.editing && !document.canUndo && document.selection.start == original.utf16.count
            let sleepPoint = try point("sleep0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: sleepPoint, window: window); try await wait(70)
            let gestureResponder = window.firstResponder
            try mouse(.leftMouseDragged, point: NSPoint(x: sleepPoint.x + 48, y: sleepPoint.y), window: window); try await wait()
            try mouse(.leftMouseUp, point: NSPoint(x: sleepPoint.x + 48, y: sleepPoint.y), window: window); try await wait()
            checks[prefix + "hours convert source"] = document.source.contains("360min") && document.canUndo && !document.editing
            checks[prefix + "UTF16 caret adjusts"] = document.selection.start == original.utf16.count + 4
            checks[prefix + "fixed quantity footprint"] = abs((frames.values["sleep0"]?.width ?? 0) - sleepBefore.width) < 0.1
            checks[prefix + "history preserves host focus"] = window.firstResponder === gestureResponder
            window.makeFirstResponder(text); try key("z", code: 6, window: window, modifiers: .command); try await wait()
            checks[prefix + "local source Undo restores editor caret"] = document.source == original && text.string == original && text.selectedRange().location == original.utf16.count && !document.canUndo
            try key("z", code: 6, window: window, modifiers: [.command, .shift]); try await wait()
            checks[prefix + "local source Redo"] = document.source.contains("360min") && text.selectedRange().location == original.utf16.count + 4
            try key("z", code: 6, window: window, modifiers: .command); try await wait()
            gate.readOnly = true; try await wait()
            try mouse(.leftMouseDown, point: statePoint, window: window); try mouse(.leftMouseUp, point: statePoint, window: window); try await wait()
            checks[prefix + "readonly source stays exact"] = document.source == original && !document.canUndo
            gate.readOnly = false; try await wait()
            if let root = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let image = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                host.cacheDisplay(in: host.bounds, to: image)
                try image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: root).appendingPathComponent("provenance-document-\(colorway.rawValue).png"))
            }
            let composed = "é " + original, decomposed = "e\u{301} " + original
            document.setSource(composed, selection: .init(start: 0, end: 0)); document.commit(); try await wait()
            window.makeFirstResponder(text); text.setSelectedRange(NSRange(location: 0, length: 0))
            try key("\r", code: 36, window: window); try await wait()
            checks[prefix + "cue exact decomposed source with unmoved caret"] = document.source.utf16.elementsEqual(decomposed.utf16) && text.string.utf16.elementsEqual(decomposed.utf16) && document.selection.start == 0 && text.selectedRange().location == 0
            try key("z", code: 6, window: window, modifiers: .command); try await wait()
            checks[prefix + "cue Unicode Undo exact"] = document.source.utf16.elementsEqual(composed.utf16) && text.string.utf16.elementsEqual(composed.utf16) && text.selectedRange().location == 0
            try key("z", code: 6, window: window, modifiers: [.command, .shift]); try await wait()
            checks[prefix + "cue Unicode Redo exact"] = document.source.utf16.elementsEqual(decomposed.utf16) && text.string.utf16.elementsEqual(decomposed.utf16)
            try key("z", code: 6, window: window, modifiers: .command); try await wait()
            window.makeFirstResponder(text); text.setSelectedRange(NSRange(location: 0, length: 1)); try await wait()
            checks[prefix + "actual TextKit typing selection"] = document.selection.start == 0 && document.selection.end == 1 && window.firstResponder === text
            text.insertText("e\u{301}", replacementRange: text.selectedRange()); try await wait()
            checks[prefix + "TextKit exact Unicode typing and caret"] = document.source.utf16.elementsEqual(decomposed.utf16) && document.selection.start == 2 && document.selection.end == 2
            try key("z", code: 6, window: window, modifiers: .command); try await wait()
            checks[prefix + "TextKit Unicode Undo selection"] = text.string.utf16.elementsEqual(composed.utf16) && text.selectedRange() == NSRange(location: 0, length: 1)
            try key("z", code: 6, window: window, modifiers: [.command, .shift]); try await wait()
            checks[prefix + "TextKit Unicode Redo selection"] = text.string.utf16.elementsEqual(decomposed.utf16) && text.selectedRange() == NSRange(location: 2, length: 0)
        }
    }
}
@main struct ProvenanceDocumentProof: App {
    var body: some Scene { WindowGroup { Text("Native provenance source feature").task {
        let proof = ProvenanceFeature()
        do { try await proof.run() } catch { proof.checks["exception \(error)"] = false }
        let report = proof.checks.sorted { $0.key < $1.key }.map { "\($0.key)=\($0.value)" }.joined(separator: "\n") + "\npassed=\(!proof.checks.values.contains(false))"
        try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
        NSApp.terminate(nil)
    } } }
}
