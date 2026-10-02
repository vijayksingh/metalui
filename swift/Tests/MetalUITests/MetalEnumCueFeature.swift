import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalEnumCueFeature: XCTestCase {
    private let original = "🧠 Task #todo, send the poster."
    private final class Measurement { var rect: CGRect = .zero; var width: CGFloat { rect.width } }
    private struct WidthKey: PreferenceKey {
        static var defaultValue: CGRect = .zero
        static func reduce(value: inout CGRect, nextValue: () -> CGRect) { let next = nextValue(); if !next.isEmpty { value = next } }
    }
    private struct Host: View {
        @ObservedObject var document: MetalCueDocument
        let colorway: MetalColorway
        let reduced: Bool
        let measurement: Measurement
        private var value: String { ["#todo", "#doing", "#done", "#dropped"].first(where: { document.source.contains($0) }) ?? "#todo" }
        var body: some View {
            VStack(alignment: .leading, spacing: MetalSpace.s24) {
                Text("Finite source state").font(.metal(MetalType.ui))
                MetalEnumCue(value, choices: [
                    .init("#todo", label: "To do", glyph: .note, tint: colorway.tokens.ink3),
                    .init("#doing", label: "Doing", glyph: .clock, tint: MetalShared.orange),
                    .init("#done", label: "Done", glyph: .check, tint: MetalShared.greenDeep),
                    .init("#dropped", label: "Dropped", glyph: .close, tint: colorway.tokens.ink3)
                ], label: "Task state", editing: document.editing, hint: false,
                onBegin: { document.begin((document.source as NSString).range(of: value)) },
                onChange: { _ = document.replace($0) }, onCommit: document.commit, onCancel: document.cancel)
                    .metalProvenance("You", detail: ["Declared task states"])
                    .keyboardShortcut(.defaultAction)
                    .background(GeometryReader { proxy in Color.clear.preference(key: WidthKey.self, value: proxy.frame(in: .named("enum-proof"))) })
                    .onPreferenceChange(WidthKey.self) { measurement.rect = $0 }
                Text(document.source).font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
                MetalButton("Undo state", action: document.undo).keyboardShortcut("z", modifiers: .command)
                Text("UTF16 \(document.selection.start)–\(document.selection.end)").font(.metal(MetalType.readout))
            }.padding(MetalSpace.s24).frame(width: MetalRecipes.dialog.points("self.width")).background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color).metalColorway(colorway).metalReduceMotion(reduced).coordinateSpace(name: "enum-proof")
        }
    }
    private func press(_ text: String, _ window: NSWindow, modifiers: NSEvent.ModifierFlags = []) throws {
        let event = try XCTUnwrap(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: modifiers, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: text, charactersIgnoringModifiers: text, isARepeat: false, keyCode: text == "\r" ? 36 : 6))
        XCTAssertTrue(window.performKeyEquivalent(with: event))
    }
    private func capture(_ name: String, _ host: NSView) throws {
        guard let directory = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let bitmap = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return }
        host.cacheDisplay(in: host.bounds, to: bitmap)
        let url = URL(fileURLWithPath: directory).appendingPathComponent("\(name).png")
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try bitmap.representation(using: .png, properties: [:])!.write(to: url)
    }
    func testFiniteStateDefaultKeyAndCapturedSourceHistory() async throws {
        _ = NSApplication.shared
        for colorway in MetalColorway.allCases {
            let document = MetalCueDocument(original, selection: .init(start: 30, end: 30))
            let measurement = Measurement()
            let host = NSHostingView(rootView: Host(document: document, colorway: colorway, reduced: colorway == .graphite, measurement: measurement))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host; window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await Task.sleep(for: .seconds(0.3))
            let width = measurement.width; XCTAssertGreaterThan(width, 0)
            try press("\r", window); try await Task.sleep(for: .seconds(0.15))
            XCTAssertEqual(document.source, "🧠 Task #doing, send the poster."); XCTAssertEqual(document.selection.start, 31); XCTAssertFalse(document.editing)
            try press("\r", window); try await Task.sleep(for: .seconds(0.6))
            XCTAssertEqual(document.source, "🧠 Task #done, send the poster."); XCTAssertEqual(measurement.width, width, accuracy: 0.5)
            try capture("enum-native-\(colorway.rawValue)", host)
            try press("z", window, modifiers: .command); try await Task.sleep(for: .seconds(0.1)); XCTAssertEqual(document.source, "🧠 Task #doing, send the poster.")
            try press("z", window, modifiers: .command); try await Task.sleep(for: .seconds(0.1)); XCTAssertEqual(document.source, original); XCTAssertEqual(document.selection.start, 30); XCTAssertFalse(document.canUndo)
            let center = host.convert(NSPoint(x: measurement.rect.midX, y: measurement.rect.midY), to: nil)
            for (type, location) in [(NSEvent.EventType.leftMouseDown, center), (.leftMouseDragged, NSPoint(x: center.x, y: center.y + 48)), (.leftMouseUp, NSPoint(x: center.x, y: center.y + 48))] {
                let event = try XCTUnwrap(NSEvent.mouseEvent(with: type, location: location, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1))
                NSApp.sendEvent(event); try await Task.sleep(for: .seconds(0.15))
            }
            XCTAssertEqual(document.source, "🧠 Task #done, send the poster."); XCTAssertFalse(document.editing)
            try press("z", window, modifiers: .command); try await Task.sleep(for: .seconds(0.1)); XCTAssertEqual(document.source, original); XCTAssertFalse(document.canUndo)

        }
    }
}
