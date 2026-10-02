import AppKit
import SwiftUI
import MetalUI
@main struct LinkCardOpenProof: App { var body: some Scene { WindowGroup { Proof() }.windowResizability(.contentSize) } }
struct Proof: View {
    @State private var opens = 0
    @State private var disabled = false
    @State private var graphite = false
    private var colorway: MetalColorway { graphite ? .graphite : .bone }
    var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s24) {
            HStack(spacing: MetalSpace.s24) {
                MetalLinkCard(url: "https://example.com/work", open: { opens += 1 })
                    .disabled(disabled).keyboardShortcut(.defaultAction)
                MetalLinkCard(url: "https://example.com/archive", openLabel: "VISIT", open: {})
            }
            Text("Opened \(opens) times").font(.metal(MetalType.content))
        }.padding(MetalSpace.s24).frame(width: 600).foregroundStyle(colorway.tokens.ink.color)
            .background((graphite ? MetalShared.pageDark : MetalShared.page).color).metalColorway(colorway).metalReduceMotion()
            .task {
                try? await Task.sleep(for: .milliseconds(700)); NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing LinkCard host") }
                window.makeKeyAndOrderFront(nil)
                @MainActor func activate() async {
                    if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                        windowNumber: window.windowNumber, context: nil, characters: "\r", charactersIgnoringModifiers: "\r", isARepeat: false, keyCode: 36) {
                        if !window.performKeyEquivalent(with: event) { window.sendEvent(event) }
                    }
                    try? await Task.sleep(for: .milliseconds(200))
                }
                await activate(); let action = opens == 1
                if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                    for dark in [false, true] {
                        graphite = dark; try? await Task.sleep(for: .milliseconds(200)); host.layoutSubtreeIfNeeded()
                        if let bitmap = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                            host.cacheDisplay(in: host.bounds, to: bitmap)
                            try? bitmap.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent("link-card-open-\(dark ? "graphite" : "bone").png"))
                        }
                    }
                }
                disabled = true; try? await Task.sleep(for: .milliseconds(200)); await activate()
                let silence = opens == 1
                let report = "action=\(action) disabled=\(silence) passed=\(action && silence)"
                try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
