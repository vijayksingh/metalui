import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalToastPromiseFeature: XCTestCase {
    @MainActor private final class Session: ObservableObject {
        let deck = MetalToastDeck()
        @Published var pending = false
        @Published var stored = "Draft"
        var pendingID: UUID?
        var syncID: UUID?
        func run() {
            guard !pending else { return }; pending = true
            Task {
                do {
                    let name: String = try await deck.promise({ try await Task.sleep(for: .milliseconds(900)); return "poster.pdf" },
                        loading: .init("Exporting poster", sub: "the draft stays editable"),
                        success: { .init("Poster exported", sub: $0, tone: .success, undo: { self.stored = "Draft" }) },
                        error: { _ in .init("Export failed", tone: .error) })
                    stored = name
                } catch { }
                pending = false
            }
        }
        func sync(_ glyph: MetalIconName) {
            let words = glyph == .offline ? "Offline · changes stay here" : glyph == .syncError ? "Sync failed · retry available" : "All changes synced"
            let model = MetalToastModel(words, tone: glyph == .syncError ? .error : .default, glyph: glyph, timeout: 0)
            if let syncID, deck.update(syncID, model) { return }
            syncID = deck.show(model)
        }
    }
    private struct Host: View {
        @ObservedObject var session: Session
        let colorway: MetalColorway
        @State private var draft = "Poster title"
        var body: some View {
            VStack(spacing: MetalSpace.s16) {
                MetalButton("Export poster", icon: .download) { session.run() }.disabled(session.pending).keyboardShortcut("e", modifiers: [])
                MetalWell(.field, radius: MetalRecipes.field.points("regular.radius")) {
                    TextField("Poster draft", text: $draft).textFieldStyle(.plain).metalType(MetalType.ui)
                        .padding(.leading, MetalRecipes.field.points("regular.pad-left"))
                        .frame(height: MetalRecipes.field.points("regular.height"))
                }
                HStack(spacing: MetalSpace.s8) {
                    MetalButton("Sync", icon: .synced, size: .compact) { session.sync(.synced) }.keyboardShortcut("s", modifiers: [])
                    MetalButton("Offline", icon: .offline, size: .compact) { session.sync(.offline) }.keyboardShortcut("o", modifiers: [])
                    MetalButton("Short result", icon: .info, size: .compact) { session.deck.show(.init("Short result", timeout: 1000)) }.keyboardShortcut("t", modifiers: [])
                    MetalButton("Fail", icon: .syncError, size: .compact) { session.sync(.syncError) }.keyboardShortcut("f", modifiers: [])
                }
                Text(session.stored).font(.metal(MetalType.readout))
                Spacer()
            }.padding(MetalSpace.s24).frame(width: 620, height: 360)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalToastDeck(session.deck).metalColorway(colorway).metalReduceMotion(colorway == .graphite)
        }
    }
    private func press(_ text: String, _ window: NSWindow) throws {
        let event = try XCTUnwrap(NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: text, charactersIgnoringModifiers: text, isARepeat: false, keyCode: 15))
        XCTAssertTrue(window.performKeyEquivalent(with: event))
    }
    private func capture(_ name: String, _ view: NSView) throws {
        guard let directory = ProcessInfo.processInfo.environment["METALUI_CAPTURES"], let bitmap = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
        view.cacheDisplay(in: view.bounds, to: bitmap)
        try XCTUnwrap(bitmap.representation(using: .png, properties: [:])).write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(name).png"))
    }
    func testRetainedAsyncResultAndLateDismissal() async throws {
        _ = NSApplication.shared; MetalFonts.register()
        for colorway in MetalColorway.allCases {
            let session = Session(); let view = NSHostingView(rootView: Host(session: session, colorway: colorway))
            let window = NSWindow(contentRect: .init(x: 0, y: 0, width: 620, height: 360), styleMask: [.titled], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false; window.contentView = view; window.makeKeyAndOrderFront(nil)
            defer { window.close() }
            try await Task.sleep(for: .milliseconds(200))
            try press("e", window); try await Task.sleep(for: .milliseconds(150))
            let id = try XCTUnwrap(session.deck.cards.first?.id)
            XCTAssertTrue(session.pending); XCTAssertEqual(session.deck.cards.count, 1)
            try capture("toast-promise-loading-\(colorway.rawValue)", view)
            try await Task.sleep(for: .milliseconds(1200))
            XCTAssertFalse(session.pending); XCTAssertEqual(session.stored, "poster.pdf")
            XCTAssertEqual(session.deck.cards.count, 1); XCTAssertEqual(session.deck.cards[0].id, id)
            XCTAssertEqual(session.deck.cards[0].model.tone, .success)
            try capture("toast-promise-\(colorway.rawValue)", view)
            session.deck.dismiss(id)
            try press("e", window); try await Task.sleep(for: .milliseconds(150))
            let second = try XCTUnwrap(session.deck.cards.first?.id); session.deck.dismiss(second)
            try await Task.sleep(for: .milliseconds(1100)); XCTAssertTrue(session.deck.cards.isEmpty)
            try press("s", window); let sync = try XCTUnwrap(session.deck.cards.first?.id)
            try press("t", window); let foreground = try XCTUnwrap(session.deck.cards.first?.id)
            try await Task.sleep(for: .milliseconds(450))
            try press("o", window); XCTAssertEqual(session.deck.cards[1].id, sync); XCTAssertEqual(session.deck.cards[1].model.glyph, .offline)
            XCTAssertEqual(session.deck.cards[0].id, foreground)
            try await Task.sleep(for: .milliseconds(900))
            XCTAssertEqual(session.deck.cards.count, 1); XCTAssertEqual(session.deck.cards[0].id, sync)
            try press("f", window); XCTAssertEqual(session.deck.cards[0].id, sync); XCTAssertEqual(session.deck.cards[0].model.glyph, .syncError)
            try await Task.sleep(for: .milliseconds(600)); try capture("toast-sync-\(colorway.rawValue)", view)
        }
    }
}
