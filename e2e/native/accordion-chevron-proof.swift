import AppKit
import SwiftUI
import MetalUI

@main struct AccordionChevronProof: App {
    var body: some Scene { WindowGroup { Receipt() } }
}
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var expanded = false
    @State private var disabled = false
    @State private var reduced = false
    var body: some View {
        VStack(spacing: MetalSpace.s16) {
            MetalAccordion("Export options", expanded: $expanded) { Text("PDF, SVG and PNG").font(.metal(MetalType.meta)) }
                .disabled(disabled).keyboardShortcut(.defaultAction)
            Text(expanded ? "Expanded" : "Collapsed").font(.metal(MetalType.meta))
        }
        .padding(MetalSpace.s16).frame(width: 340, height: 200).foregroundStyle(colorway.tokens.ink.color)
        .background(colorway.tokens.s.color).metalColorway(colorway).metalReduceMotion(reduced)
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first else { fatalError("Missing receipt window") }
            window.makeKeyAndOrderFront(nil)
            @MainActor func commit() {
                let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: "\r", charactersIgnoringModifiers: "\r", isARepeat: false, keyCode: 36)!
                NSApp.sendEvent(event)
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"],
                      let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return }
                let image = NSBitmapImageRep(cgImage: pixels)
                try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
            }
            commit()
            try? await Task.sleep(for: .milliseconds(200))
            capture("accordion-chevron-native-contact")
            try? await Task.sleep(for: .seconds(2))
            let normal = expanded
            capture("accordion-chevron-native-rest")
            reduced = true
            try? await Task.sleep(for: .milliseconds(200))
            commit()
            try? await Task.sleep(for: .milliseconds(200))
            capture("accordion-chevron-native-reduced")
            let closed = !expanded
            disabled = true
            try? await Task.sleep(for: .milliseconds(200))
            commit()
            try? await Task.sleep(for: .milliseconds(200))
            let ignored = !expanded
            let result = "opened=\(normal) closed=\(closed) disabled=\(ignored) passed=\(normal && closed && ignored)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
