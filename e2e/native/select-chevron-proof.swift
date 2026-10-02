import AppKit
import SwiftUI
import MetalUI

@main struct SelectChevronProof: App {
    var body: some Scene { WindowGroup { Receipt() } }
}
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var selection: String? = "alpha"
    @State private var reduced = false
    @State private var disabled = false
    var body: some View {
        MetalSelect("File format", selection: $selection, options: [
            MetalSelectOption("alpha", label: "PDF"), MetalSelectOption("beta", label: "SVG"),
            MetalSelectOption("disabled", label: "PNG", disabled: true),
        ]).keyboardShortcut(.defaultAction).disabled(disabled)
            .padding(MetalSpace.s16).frame(width: 340, height: 180)
            .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
            .metalColorway(colorway).metalReduceMotion(reduced)
            .task {
                try? await Task.sleep(for: .seconds(1))
                NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first else { fatalError("Missing select window") }
                window.makeKeyAndOrderFront(nil)
                @MainActor func key(_ characters: String, _ code: UInt16) {
                    let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                        windowNumber: NSApp.keyWindow?.windowNumber ?? window.windowNumber, context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code)!
                    NSApp.sendEvent(event)
                }
                @MainActor func capture(_ name: String) {
                    guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"],
                          let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return }
                    let image = NSBitmapImageRep(cgImage: pixels)
                    try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
                }
                key("\r", 36)
                try? await Task.sleep(for: .seconds(1))
                let opened = NSApp.windows.contains { $0 !== window && $0.isVisible }
                capture("select-chevron-native-open")
                key("\u{F701}", 125); key("\r", 36)
                try? await Task.sleep(for: .seconds(1))
                let chose = selection == "beta"
                capture("select-chevron-native-chosen")
                key("\r", 36)
                try? await Task.sleep(for: .milliseconds(150))
                reduced = true
                try? await Task.sleep(for: .milliseconds(200))
                key("\u{1B}", 53)
                try? await Task.sleep(for: .milliseconds(400))
                capture("select-chevron-native-reduced")
                let escaped = selection == "beta" && !NSApp.windows.contains { $0 !== window && $0.isVisible }
                disabled = true
                try? await Task.sleep(for: .milliseconds(200))
                key("\r", 36)
                try? await Task.sleep(for: .milliseconds(400))
                let refused = !NSApp.windows.contains { $0 !== window && $0.isVisible }
                let result = "opened=\(opened) chosen=\(chose) escaped=\(escaped) disabled=\(refused) passed=\(opened && chose && escaped && refused)"
                try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
