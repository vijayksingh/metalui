import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// A real retained native status, changed through neighboring keyboard-operated commands.
@MainActor
final class MetalStatusSyncFeature: XCTestCase {
    private final class Session: ObservableObject {
        @Published var glyph: MetalIconName = .synced
        var words: String { glyph == .synced ? "All changes synced" : glyph == .offline ? "Offline · changes stay here" : "Sync failed · retry available" }
        var led: MetalLEDKind { glyph == .synced ? .link : glyph == .offline ? .off : .failed }
    }
    private struct Host: View {
        @ObservedObject var session: Session
        let colorway: MetalColorway
        var body: some View {
            VStack(spacing: MetalSpace.s24) {
                MetalStatusBadge(session.words, led: session.led,
                    hint: session.glyph == .syncError ? "Check the connection, then retry sync." : nil,
                    glyph: session.glyph)
                HStack(spacing: MetalSpace.s8) {
                    MetalButton("Disconnect", icon: .offline, size: .compact) { session.glyph = .offline }.keyboardShortcut("o", modifiers: [])
                    MetalButton("Fail sync", icon: .syncError, size: .compact) { session.glyph = .syncError }.keyboardShortcut("f", modifiers: [])
                    MetalButton("Retry sync", icon: .synced, size: .compact) { session.glyph = .synced }.keyboardShortcut("r", modifiers: [])
                }
            }.padding(MetalSpace.s24).background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway).metalReduceMotion(colorway == .graphite)
        }
    }
    private func press(_ text: String, in window: NSWindow) throws {
        let event = try XCTUnwrap(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: text, charactersIgnoringModifiers: text, isARepeat: false, keyCode: 15))
        XCTAssertTrue(window.performKeyEquivalent(with: event))
    }
    private func capture(_ name: String, _ view: NSView) throws {
        guard let directory = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let bitmap = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
        view.cacheDisplay(in: view.bounds, to: bitmap)
        try XCTUnwrap(bitmap.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(name).png"))
    }
    func testRetainedStatusThroughKeyboardRecovery() async throws {
        _ = NSApplication.shared; MetalFonts.register()
        for colorway in MetalColorway.allCases {
            let session = Session(); let view = NSHostingView(rootView: Host(session: session, colorway: colorway))
            let window = NSWindow(contentRect: .init(x: 0, y: 0, width: 560, height: 160), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = view; window.makeKeyAndOrderFront(nil)
            defer { window.close() }
            try await Task.sleep(for: .milliseconds(150))
            try press("o", in: window); XCTAssertEqual(session.glyph, .offline); XCTAssertEqual(session.words, "Offline · changes stay here")
            try await Task.sleep(for: .milliseconds(550))
            try capture("status-sync-offline-\(colorway.rawValue)", view)
            try press("f", in: window); XCTAssertEqual(session.glyph, .syncError); XCTAssertEqual(session.words, "Sync failed · retry available")
            try await Task.sleep(for: .milliseconds(550))
            try capture("status-sync-error-\(colorway.rawValue)", view)
            try press("r", in: window); XCTAssertEqual(session.glyph, .synced); XCTAssertEqual(session.words, "All changes synced")
            try await Task.sleep(for: .milliseconds(550))
            try capture("status-sync-\(colorway.rawValue)", view)
        }
    }
}
