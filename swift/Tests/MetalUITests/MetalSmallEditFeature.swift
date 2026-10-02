import AppKit
import SwiftUI
import XCTest
import MetalUIExamples
@testable import MetalUI

@MainActor
final class MetalSmallEditFeature: XCTestCase {
    private final class Storage: ObservableObject {
        @Published var saved: MetalRegionEdit?
        var requests = 0
    }
    private struct SaveHost: View {
        @ObservedObject var storage: Storage
        let colorway: MetalColorway
        var body: some View {
            MetalSaveRegionExample(saved: $storage.saved, onSave: { _ in
                storage.requests += 1; try await Task.sleep(for: .seconds(0.8))
            })
            .padding(MetalSpace.s20)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
        }
    }
    private func fields(_ view: NSView) -> [NSTextField] {
        (view as? NSTextField).map { [$0] } ?? view.subviews.flatMap(fields)
    }
    private func capture(_ name: String, _ host: NSView) {
        guard let dir = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let bitmap = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return }
        host.cacheDisplay(in: host.bounds, to: bitmap)
        let url = URL(fileURLWithPath: dir).appendingPathComponent("\(name).png")
        XCTAssertNoThrow(try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true))
        XCTAssertNoThrow(try bitmap.representation(using: .png, properties: [:])!.write(to: url))
    }
    func testSaveRegionHost() async throws {
        _ = NSApplication.shared
        for colorway in MetalColorway.allCases {
            let storage = Storage()
            let host = NSHostingView(rootView: SaveHost(storage: storage, colorway: colorway))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host
            window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await Task.sleep(for: .seconds(0.25))
            let input = try XCTUnwrap(fields(host).first(where: { $0.placeholderString == "Trip to Lisbon" }))
            window.makeFirstResponder(input)
            let editor = try XCTUnwrap(input.currentEditor() as? NSTextView)
            editor.insertText("Lisbon", replacementRange: editor.selectedRange())
            editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
            try await Task.sleep(for: .seconds(0.1))
            XCTAssertEqual(storage.requests, 1); XCTAssertFalse(input.isEnabled)
            try await Task.sleep(for: .seconds(1.2))
            XCTAssertEqual(storage.saved?.name, "Lisbon")
            capture("save-region-result-\(colorway.rawValue)", host)
            try await Task.sleep(for: .seconds(0.8))
            XCTAssertTrue(input.isEnabled); XCTAssertEqual(storage.requests, 1)
        }
    }
    private final class TagStorage: ObservableObject {
        @Published var tags = ["travel"]
        var requests = 0
    }
    private struct TagHost: View {
        @ObservedObject var storage: TagStorage
        let colorway: MetalColorway
        var body: some View {
            MetalTagExample(tags: $storage.tags, onAttach: { _ in
                storage.requests += 1; try await Task.sleep(for: .seconds(0.8))
            }).padding(MetalSpace.s20).background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color).metalColorway(colorway)
        }
    }
    func testTagHost() async throws {
        _ = NSApplication.shared
        for colorway in MetalColorway.allCases {
            let storage = TagStorage()
            let host = NSHostingView(rootView: TagHost(storage: storage, colorway: colorway))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host; window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await Task.sleep(for: .seconds(0.25))
            let input = try XCTUnwrap(fields(host).first(where: { $0.placeholderString == "Add a tag" }))
            window.makeFirstResponder(input)
            let editor = try XCTUnwrap(input.currentEditor() as? NSTextView)
            editor.insertText("Lisbon", replacementRange: editor.selectedRange()); editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
            try await Task.sleep(for: .seconds(0.1)); XCTAssertEqual(storage.requests, 1); XCTAssertFalse(input.isEnabled)
            try await Task.sleep(for: .seconds(1.2)); XCTAssertEqual(storage.tags, ["travel", "Lisbon"])
            capture("tag-result-\(colorway.rawValue)", host)
            try await Task.sleep(for: .seconds(0.8)); XCTAssertTrue(input.isEnabled); XCTAssertEqual(input.stringValue, "")
        }
    }

    private final class CommentStorage: ObservableObject {
        @Published var comments: [String] = []
        var requests = 0
    }
    private struct CommentHost: View {
        @ObservedObject var storage: CommentStorage
        let colorway: MetalColorway
        var body: some View {
            MetalCommentExample(comments: $storage.comments, initiallyEditing: true, onPost: { _ in
                storage.requests += 1; try await Task.sleep(for: .seconds(0.8))
            }).padding(MetalSpace.s20).background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color).metalColorway(colorway)
        }
    }
    func testCommentHost() async throws {
        _ = NSApplication.shared
        for colorway in MetalColorway.allCases {
            let storage = CommentStorage()
            let host = NSHostingView(rootView: CommentHost(storage: storage, colorway: colorway))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host; window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await Task.sleep(for: .seconds(0.25))
            let input = try XCTUnwrap(fields(host).first(where: { $0.placeholderString == "Write a comment" }))
            window.makeFirstResponder(input)
            let editor = try XCTUnwrap(input.currentEditor() as? NSTextView)
            editor.insertText("Bring the tram map.", replacementRange: editor.selectedRange())
            try await Task.sleep(for: .seconds(0.15))
            let event = try XCTUnwrap(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: .command, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: "\r", charactersIgnoringModifiers: "\r", isARepeat: false, keyCode: 36))
            XCTAssertTrue(window.performKeyEquivalent(with: event))
            try await Task.sleep(for: .seconds(0.1)); XCTAssertEqual(storage.requests, 1); XCTAssertFalse(input.isEnabled)
            try await Task.sleep(for: .seconds(1.2)); XCTAssertEqual(storage.comments, ["Bring the tram map."])
            capture("comment-result-\(colorway.rawValue)", host)
            try await Task.sleep(for: .seconds(0.8)); XCTAssertFalse(fields(host).contains(where: { $0.placeholderString == "Write a comment" }))
        }
    }

}
