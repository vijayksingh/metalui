import AppKit
import SwiftUI
import MetalUI

@main
struct RadioKeysProof: App {
    var body: some Scene { WindowGroup { TimeForm() } }
}

struct TimeForm: View {
    @State private var time = "10:00"
    @State private var changes = 0
    var body: some View {
        MetalRadioKeys("Appointment time", selection: $time, options: [
            .init("10:00", "10:00"), .init("11:00", "11:00 · taken", disabled: true), .init("12:00", "12:00")
        ])
        .frame(width: 600, height: 220)
        .onChange(of: time) { _, _ in changes += 1 }
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing time form") }
            window.makeKeyAndOrderFront(nil)
            window.recalculateKeyViewLoop()
            try? await Task.sleep(for: .milliseconds(300))
            window.makeFirstResponder(host)
            @MainActor func key(_ characters: String, _ code: UInt16) {
                if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code) { window.sendEvent(event) }
            }
            key("\t", 48)
            try? await Task.sleep(for: .milliseconds(200))
            key("\u{F703}", 124)
            try? await Task.sleep(for: .milliseconds(300))
            let afterRight = "\(time)/\(changes)"
            let skipped = time == "12:00" && changes == 1
            key(" ", 49)
            try? await Task.sleep(for: .milliseconds(300))
            let afterSpace = "\(time)/\(changes)"
            let retained = time == "12:00" && changes == 1
            key("\u{F702}", 123)
            try? await Task.sleep(for: .milliseconds(300))
            let returned = time == "10:00" && changes == 2
            let result = "right=\(afterRight) space=\(afterSpace) key=\(window.isKeyWindow) responder=\(String(describing: window.firstResponder)) time=\(time) changes=\(changes) skipped=\(skipped) retained=\(retained) returned=\(returned) passed=\(skipped && retained && returned)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
