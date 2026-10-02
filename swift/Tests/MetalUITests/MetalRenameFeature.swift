import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// A live native editing feature slice: real field focus/selection, Return, request lock and result.
@MainActor
final class MetalRenameFeature: XCTestCase {
    private final class Document: ObservableObject {
        @Published var name = "report.final.txt"
        @Published var pending = false
        @Published var requests = 0
        @Published var done = false
    }
    private struct Fixture: View {
        @ObservedObject var document: Document
        let colorway: MetalColorway
        var body: some View {
            MetalRenameEditor(document.name, file: true, label: "File name",
                validate: { $0 == "Taken" ? "That name is taken." : nil },
                onRename: { _ in document.requests += 1; try await Task.sleep(for: .seconds(0.8)) },
                onRenamed: { name, original in document.name = name; XCTAssertEqual(original, "report.final.txt") },
                onDone: { document.done = true }, onCancel: {}, onPendingChange: { document.pending = $0 })
                .padding(MetalSpace.s20)
                .frame(width: MetalRecipes.dialog.points("self.width"))
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
        }
    }
    private func fields(_ view: NSView) -> [NSTextField] {
        (view as? NSTextField).map { [$0] } ?? view.subviews.flatMap(fields)
    }
    private func snapshot(_ name: String, _ view: NSView) {
        guard let dir = ProcessInfo.processInfo.environment["METALUI_CAPTURES"],
              let bitmap = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
        view.cacheDisplay(in: view.bounds, to: bitmap)
        let url = URL(fileURLWithPath: dir).appendingPathComponent("\(name).png")
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        XCTAssertNoThrow(try bitmap.representation(using: .png, properties: [:])!.write(to: url))
    }
    func testSelectedFileRename() async throws {
        _ = NSApplication.shared
        for colorway in MetalColorway.allCases {
            let document = Document()
            let host = NSHostingView(rootView: Fixture(document: document, colorway: colorway))
            let window = NSWindow(contentRect: NSRect(origin: .zero, size: host.fittingSize), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = host
            window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
            defer { window.close() }
            try await Task.sleep(for: .seconds(0.25))
            let input = try XCTUnwrap(fields(host).first(where: { $0.stringValue == "report.final.txt" }))
            let editor = try XCTUnwrap(input.currentEditor() as? NSTextView)
            XCTAssertEqual(editor.selectedRange(), NSRange(location: 0, length: ("report.final" as NSString).length))
            snapshot("rename-editor-\(colorway.rawValue)", host)
            // This is the platform field editor's actual text/Return path, not component state mutation.
            editor.selectAll(nil); editor.insertText("Lisbon.txt", replacementRange: editor.selectedRange())
            editor.doCommand(by: #selector(NSResponder.insertNewline(_:)))
            try await Task.sleep(for: .seconds(0.1))
            XCTAssertTrue(document.pending); XCTAssertEqual(document.requests, 1); XCTAssertFalse(input.isEnabled)
            try await Task.sleep(for: .seconds(1.2))
            XCTAssertEqual(document.name, "Lisbon.txt"); XCTAssertFalse(document.done)
            snapshot("rename-result-\(colorway.rawValue)", host)
            try await Task.sleep(for: .seconds(0.9))
            XCTAssertTrue(document.done); XCTAssertFalse(document.pending); XCTAssertEqual(document.requests, 1)
        }
    }
}
