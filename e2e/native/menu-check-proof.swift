import AppKit
import SwiftUI
import MetalUI

@main
struct MenuCheckProof: App {
    var body: some Scene { WindowGroup { MenuSettingsProof() } }
}

struct MenuSettingsProof: View {
    @State private var guides = false
    @State private var all = false
    @State private var mixed = true
    @State private var open = true
    @State private var changes = 0
    @State private var disabledChanges = 0
    @State private var finished = 0

    var body: some View {
        VStack {
            Text("Native menu settings").font(.metal(MetalType.ui))
            if open {
                MetalMenuPanel(items: [
                    MetalMenuItem("Show Guides", checked: guides) { guides.toggle(); changes += 1 },
                    MetalMenuItem("Select All Layers", checked: all, indeterminate: mixed) { all.toggle(); mixed = false; changes += 1 },
                    MetalMenuItem("Keep Proportions", disabled: true, checked: true) { disabledChanges += 1 },
                    MetalMenuItem("Finish") { finished += 1 }
                ]) { open = false }
            }
            Text(guides ? "Guides visible" : "Guides hidden").font(.metal(MetalType.meta))
        }
        .frame(width: 520, height: 380)
        .metalColorway(.bone)
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first else { fatalError("Missing menu window") }
            window.makeKeyAndOrderFront(nil)
            try? await Task.sleep(for: .milliseconds(300))
            @MainActor func key(_ characters: String, _ code: UInt16) {
                if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code) { window.sendEvent(event) }
            }
            key("\u{F701}", 125)
            key("\r", 36)
            try? await Task.sleep(for: .milliseconds(900))
            let keptOpen = guides && open && changes == 1
            key("\u{F701}", 125)
            key(" ", 49)
            try? await Task.sleep(for: .milliseconds(600))
            let selectedAll = all && !mixed && open && changes == 2
            key("\u{F701}", 125)
            key("\u{F700}", 126)
            key("\r", 36)
            try? await Task.sleep(for: .milliseconds(600))
            let skippedDisabled = !all && open && disabledChanges == 0 && finished == 0 && changes == 3
            if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"], let view = window.contentView,
               let image = view.bitmapImageRepForCachingDisplay(in: view.bounds) {
                view.cacheDisplay(in: view.bounds, to: image)
                try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent("menu-settings-native.png"))
            }
            key("\u{1B}", 53)
            try? await Task.sleep(for: .milliseconds(200))
            let escaped = !open
            let result = "keptOpen=\(keptOpen) selectedAll=\(selectedAll) skippedDisabled=\(skippedDisabled) escaped=\(escaped) changes=\(changes) passed=\(keptOpen && selectedAll && skippedDisabled && escaped)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
