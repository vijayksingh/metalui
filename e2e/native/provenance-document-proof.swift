import AppKit
import SwiftUI
import CoreText
import Combine
import MetalUI

@MainActor final class ProvenanceFeature {
    var checks: [String: Bool] = [:]
    final class Frames { var values: [String: CGRect] = [:] }
    final class Gate: ObservableObject { @Published var readOnly = false; @Published var reduced = false; @Published var raw = false; @Published var width: CGFloat = 960; @Published var height: CGFloat = 340 }
    struct Host: View {
        @ObservedObject var document: MetalCueDocument
        @ObservedObject var gate: Gate
        let frames: Frames, colorway: MetalColorway
        var body: some View {
            VStack {
                MetalProvenanceDocumentExample(document: document, readOnly: gate.readOnly, raw: gate.raw)
                if [UInt16(0xe9), UInt16(0x65)].contains(document.source.utf16.first ?? 0) {
                    MetalEnumCue(document.source.utf16.first == 0xe9 ? "NFC" : "NFD", choices: [.init("NFC"), .init("NFD")], label: "Accent source form",
                        onBegin: { document.begin(NSRange(location: 0, length: (document.source as NSString).range(of: " ").location)) },
                        onChange: { document.replace($0 == "NFC" ? "é" : "e\u{301}") }, onCommit: document.commit, onCancel: document.cancel)
                        .keyboardShortcut(.defaultAction)
                }
            }
                .padding(MetalSpace.s24).frame(width: gate.width, height: gate.height)
                .background(colorway.tokens.s.color).metalColorway(colorway)
                .metalReduceMotion(gate.reduced)
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
        let bounds = try unwrap(frames.values[name]); return host.convert(NSPoint(x: bounds.midX, y: bounds.maxY - MetalType.content.line / 2), to: nil)
    }
    func wordWidth(_ words: String) -> CGFloat {
        let font = MetalFonts.ctFont(MetalType.content, size: MetalType.content.size)
        return CGFloat(CTLineGetTypographicBounds(CTLineCreateWithAttributedString(NSAttributedString(string: words, attributes: [.font: font])), nil, nil, nil))
    }
    func windowImage(_ window: NSWindow) -> CGImage? {
        CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution])
    }
    func capture(_ window: NSWindow, name: String) throws {
        guard let root = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let image = windowImage(window) else { return }
        try NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: root).appendingPathComponent(name + ".png"))
    }
    func glyphSharesCap(_ name: String, first: String, frames: Frames, host: NSView, window: NSWindow, colorway: MetalColorway) throws -> Bool {
        let bounds = host.convert(try unwrap(frames.values[name]), to: nil), image = try unwrap(windowImage(window))
        let scale = CGFloat(image.width) / window.frame.width
        let side = MetalRecipes.button.points("compact.glyph"), advance = side + MetalCue.urlGap
        func ink(_ x: CGFloat, _ width: CGFloat) -> CGRect? {
            guard let crop = image.cropping(to: CGRect(x: (bounds.minX + x) * scale, y: (window.frame.height - bounds.maxY) * scale, width: width * scale, height: bounds.height * scale)) else { return nil }
            let bitmap = NSBitmapImageRep(cgImage: crop)
            var minX = bitmap.pixelsWide, minY = bitmap.pixelsHigh, maxX = -1, maxY = -1
            for y in 0..<bitmap.pixelsHigh { for x in 0..<bitmap.pixelsWide {
                guard let color = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                let solid = colorway == .bone ? max(color.redComponent, color.greenComponent, color.blueComponent) < 0.35 : min(color.redComponent, color.greenComponent, color.blueComponent) > 0.7
                if solid { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) }
            } }
            return maxY < 0 ? nil : CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
        }
        guard let glyph = ink(0, side), let word = ink(advance, wordWidth(first)) else { return false }
        return abs(glyph.midY - word.midY) < 3 && glyph.minY >= 0 && glyph.maxY <= bounds.height * scale
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
            let glyphAdvance = MetalRecipes.button.points("compact.glyph") + MetalCue.urlGap
            checks[prefix + "natural committed source widths"] = stateBefore.width < wordWidth("#dropped") + glyphAdvance && sleepBefore.width < wordWidth("1440min") + glyphAdvance && (frames.values["date0"]?.width ?? .infinity) < wordWidth("next Wednesday") + glyphAdvance
            checks[prefix + "reading controls stay within the text line"] = ["date0", "clock0", "sleep0", "colour0", "person0", "link0"].allSatisfy { (frames.values[$0]?.height ?? .infinity) <= MetalType.content.line + MetalSpace.s2 }
            for (name, first) in [("clock0", "4"), ("sleep0", "6"), ("person0", "S")] { checks[prefix + name + " meaning is inline at content cap"] = try glyphSharesCap(name, first: first, frames: frames, host: host, window: window, colorway: colorway) }
            try capture(window, name: "provenance-document-\(colorway.rawValue)")
            try capture(window, name: "provenance-document-\(colorway.rawValue)-full")
            gate.reduced = true; try await wait()
            checks[prefix + "reduced line keeps natural geometry"] = abs((frames.values["sleep0"]?.width ?? 0) - sleepBefore.width) < 0.1
            try capture(window, name: "provenance-document-\(colorway.rawValue)-reduced")
            let personWidth = frames.values["person0"]?.width, colourWidth = frames.values["colour0"]?.width
            gate.raw = true; try await wait()
            checks[prefix + "raw keeps meaning glyph advance"] = abs((frames.values["person0"]?.width ?? 0) - (personWidth ?? 0)) < 0.1 && abs((frames.values["colour0"]?.width ?? 0) - (colourWidth ?? 0)) < 0.1
            try capture(window, name: "provenance-document-\(colorway.rawValue)-raw")
            gate.raw = false; gate.reduced = colorway == .graphite; try await wait()

            gate.width = 375; gate.height = 560; window.setContentSize(NSSize(width: gate.width, height: gate.height)); try await wait(350)
            checks[prefix + "compact sentence flows without clipping"] = ["reading0", "reading1"].allSatisfy { name in
                guard let bounds = frames.values[name] else { return false }
                return bounds.width <= gate.width - MetalSpace.s24 * 2 + 1 && bounds.minX >= MetalSpace.s24 - 1 && bounds.maxX <= gate.width - MetalSpace.s24 + 1
            } && (frames.values["reading0"]?.height ?? 0) >= MetalType.content.line * 2
            if let container = text.textContainer, let layout = text.layoutManager {
                layout.ensureLayout(for: container)
                checks[prefix + "compact source editor shows all wrapped lines"] = layout.usedRect(for: container).height <= (text.enclosingScrollView?.contentSize.height ?? 0) + 1
            }
            checks[prefix + "compact actual controls remain wholly visible"] = ["date0", "clock0", "sleep0", "colour0", "person0", "link0"].allSatisfy { name in
                guard let bounds = frames.values[name] else { return false }
                return bounds.minX >= MetalSpace.s24 - 1 && bounds.maxX <= gate.width - MetalSpace.s24 + 1 && bounds.maxY <= gate.height - MetalSpace.s24
            } && text.string.utf16.elementsEqual(original.utf16)
            gate.reduced = false; try await wait(); try capture(window, name: "provenance-document-\(colorway.rawValue)-375-full")
            gate.reduced = true; try await wait(); try capture(window, name: "provenance-document-\(colorway.rawValue)-375-reduced")
            for (name, first) in [("clock0", "4"), ("sleep0", "6"), ("person0", "S")] { checks[prefix + name + " compact meaning keeps cap baseline"] = try glyphSharesCap(name, first: first, frames: frames, host: host, window: window, colorway: colorway) }
            gate.raw = true; try await wait(); try capture(window, name: "provenance-document-\(colorway.rawValue)-375-raw")
            gate.raw = false; gate.reduced = colorway == .graphite; gate.width = 960; gate.height = 340
            window.setContentSize(NSSize(width: gate.width, height: gate.height)); try await wait(350)

            let statePoint = try point("state0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: statePoint, window: window); try await wait(70)
            try mouse(.leftMouseDragged, point: NSPoint(x: statePoint.x, y: statePoint.y + 48), window: window); try await wait()
            checks[prefix + "held state source preview"] = document.editing && document.source != original
            checks[prefix + "held state stays bounded by source vocabulary"] = (frames.values["state0"]?.width ?? .infinity) <= wordWidth("#dropped") + glyphAdvance + MetalCue.tagPadX * 2 + 1
            try key("\u{1b}", code: 53, window: window); try mouse(.leftMouseUp, point: statePoint, window: window); try await wait()
            checks[prefix + "Escape restores source selection"] = document.source == original && !document.editing && !document.canUndo && document.selection.start == original.utf16.count
            let sleepPoint = try point("sleep0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: sleepPoint, window: window); try await wait(70)
            let gestureResponder = window.firstResponder
            try mouse(.leftMouseDragged, point: NSPoint(x: sleepPoint.x + 48, y: sleepPoint.y), window: window); try await wait()
            checks[prefix + "held quantity reserves editing footprint"] = (frames.values["sleep0"]?.width ?? 0) > sleepBefore.width
            try mouse(.leftMouseUp, point: NSPoint(x: sleepPoint.x + 48, y: sleepPoint.y), window: window); try await wait()
            checks[prefix + "hours convert source"] = document.source.contains("360min") && document.canUndo && !document.editing
            checks[prefix + "UTF16 caret adjusts"] = document.selection.start == original.utf16.count + 4
            checks[prefix + "committed quantity reflows to changed source"] = (frames.values["sleep0"]?.width ?? 0) > sleepBefore.width && (frames.values["sleep0"]?.height ?? .infinity) <= MetalType.content.line + MetalSpace.s2
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
            let personPoint = try point("person0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: personPoint, window: window); try mouse(.leftMouseUp, point: personPoint, window: window); try await wait()
            checks[prefix + "person opens owned source snapshot"] = document.editing
            var transferredSources: [String] = []
            let ownershipTrace = document.$source.sink { transferredSources.append($0) }
            let outsideQuantity = try point("sleep0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: outsideQuantity, window: window); try await wait(70)
            try mouse(.leftMouseDragged, point: NSPoint(x: outsideQuantity.x + 48, y: outsideQuantity.y), window: window); try await wait()
            try mouse(.leftMouseUp, point: NSPoint(x: outsideQuantity.x + 48, y: outsideQuantity.y), window: window); try await wait()
            ownershipTrace.cancel()
            checks[prefix + "popup cannot lend person range to quantity"] = transferredSources.allSatisfy { $0.contains("with Sam;") }
            document.cancel(); if document.canUndo { document.undo() }; try await wait()
            checks[prefix + "cross-control refusal restores exact source"] = document.source == original
            let personAgain = try point("person0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: personAgain, window: window); try mouse(.leftMouseUp, point: personAgain, window: window); try await wait()
            checks[prefix + "person owns source before outside date"] = document.editing
            var dateSources: [String] = []
            let dateTrace = document.$source.sink { dateSources.append($0) }
            let outsideDate = try point("date0", frames: frames, host: host)
            try mouse(.leftMouseDown, point: outsideDate, window: window); try await wait(70)
            try mouse(.leftMouseDragged, point: NSPoint(x: outsideDate.x, y: outsideDate.y + 4), window: window); try await wait()
            try mouse(.leftMouseUp, point: NSPoint(x: outsideDate.x, y: outsideDate.y + 4), window: window); try await wait()
            dateTrace.cancel()
            checks[prefix + "popup cannot lend person range to date"] = dateSources.allSatisfy { $0.contains("with Sam;") }
            document.cancel(); if document.canUndo { document.undo() }; try await wait()
            checks[prefix + "date refusal leaves source exact"] = document.source == original
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
