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
}
