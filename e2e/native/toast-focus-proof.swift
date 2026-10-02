import AppKit
import SwiftUI
import MetalUI
import Darwin

@main
struct ToastFocusProof: App {
    var body: some Scene { WindowGroup { ProofCanvas() } }
}

struct ProofCanvas: View {
    @State private var deck = MetalToastDeck()
    @State private var deckSpan: CGFloat = .zero
    @State private var undone = ""
    var body: some View {
        Text("Canvas").frame(width: 800, height: 400).metalToastDeck(deck)
            .coordinateSpace(name: MetalHitRegion.space)
            .onPreferenceChange(MetalHitRegionKey.self) { frames in
                deckSpan = (frames.map(\.maxY).max() ?? 0) - (frames.map(\.minY).min() ?? 0)
            }
            .task {
                setbuf(stdout, nil)
                deck.show(.init("Older undoable result", undo: {}))
                deck.show(.init("Latest result", undo: { undone = "Latest result" }))
                try? await Task.sleep(for: .seconds(1))
                NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Native window missing") }
                window.makeKeyAndOrderFront(nil)
                window.recalculateKeyViewLoop()
                try? await Task.sleep(for: .seconds(1))
                let folded = deckSpan
                window.makeFirstResponder(host)
                var expanded = false
                for _ in 0..<8 {
                    guard let tab = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: "\t", charactersIgnoringModifiers: "\t", isARepeat: false, keyCode: 48) else { fatalError("Missing Tab event") }
                    window.sendEvent(tab)
                    try? await Task.sleep(for: .milliseconds(150))
                    if deckSpan > folded + MetalRecipes.toast.points("deck.peek") { expanded = true; break }
                }
                try? await Task.sleep(for: .seconds(4))
                let fanned = deckSpan
                let timersPaused = deck.cards.count == 2
                if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"],
                   let bitmap = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                    host.cacheDisplay(in: host.bounds, to: bitmap)
                    try? bitmap.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent("toast-keyboard-focus-bone.png"))
                }
                window.makeFirstResponder(nil)
                try? await Task.sleep(for: .seconds(1))
                let foldedAgain = deckSpan
                deck.show(.init("Plain result", tone: .error))
                try? await Task.sleep(for: .milliseconds(500))
                if let undo = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: .command, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: "z", charactersIgnoringModifiers: "z", isARepeat: false, keyCode: 6) {
                    _ = window.performKeyEquivalent(with: undo)
                }
                try? await Task.sleep(for: .milliseconds(500))
                let shortcutWorked = undone == "Latest result" && !deck.cards.contains(where: { $0.model.title == "Latest result" })
                let result = "key=\(window.isKeyWindow) folded=\(folded) fanned=\(fanned) left=\(foldedAgain) timersPaused=\(timersPaused) shortcut=\(shortcutWorked) passed=\(expanded && timersPaused && shortcutWorked && foldedAgain <= folded + 1)"
                let report = ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"] ?? "/tmp/metalui-toast-native-focus.txt"
                try? result.write(toFile: report, atomically: true, encoding: .utf8)
                print(result)
                NSApp.terminate(nil)
            }
    }
}
