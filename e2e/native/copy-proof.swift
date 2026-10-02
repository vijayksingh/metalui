import AppKit
import SwiftUI
import MetalUI

@main
struct CopyProof: App {
    var body: some Scene { WindowGroup { ClipboardProof() } }
}
struct ClipboardProof: View {
    @State private var copied = false
    private let text = "Soft Hardware: native clipboard result."
    var body: some View {
        VStack(spacing: 16) {
            Text("Native copy result").font(.metal(MetalType.ui))
            MetalButton("Copy", state: copied ? .done : .idle, doneLabel: "Copied", action: {
                NSPasteboard.general.clearContents()
                copied = NSPasteboard.general.setString(text, forType: .string)
            }) { MetalMorphIcon(copied ? .check : .copy) }
            .keyboardShortcut(.defaultAction)
        }
        .frame(width: 440, height: 240)
        .foregroundStyle(MetalColorway.bone.tokens.ink.color)
        .background(MetalColorway.bone.tokens.s.color)
        .metalColorway(.bone)
        .task(id: copied) {
            guard copied else { return }
            try? await Task.sleep(for: .milliseconds(1600))
            guard !Task.isCancelled else { return }
            copied = false
        }
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing copy window") }
            window.makeKeyAndOrderFront(nil)
            window.recalculateKeyViewLoop()
            try? await Task.sleep(for: .milliseconds(300))
            window.makeFirstResponder(host)
            if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: "\r", charactersIgnoringModifiers: "\r", isARepeat: false, keyCode: 36) {
                _ = window.performKeyEquivalent(with: event)
            }
            try? await Task.sleep(for: .milliseconds(650))
            let committed = copied && NSPasteboard.general.string(forType: .string) == text
            if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"], let image = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                host.cacheDisplay(in: host.bounds, to: image)
                try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent("copy-native.png"))
            }
            try? await Task.sleep(for: .milliseconds(1200))
            let reset = !copied
            let result = "committed=\(committed) reset=\(reset) passed=\(committed && reset)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
