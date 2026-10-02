import AppKit
import SwiftUI
import MetalUI

@main struct SidebarToggleProof: App {
    var body: some Scene { WindowGroup { Receipt() } }
}
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var collapsed = false
    @State private var disabled = false
    @State private var reduced = false
    var body: some View {
        VStack(spacing: MetalSpace.s16) {
            MetalSidebarToggle(collapsed: $collapsed).disabled(disabled).keyboardShortcut(.defaultAction)
            Text(collapsed ? "Collapsed" : "Expanded").font(.metal(MetalType.meta))
        }
        .frame(width: 340, height: 160).foregroundStyle(colorway.tokens.ink.color)
        .background(colorway.tokens.s.color).metalColorway(colorway).metalReduceMotion(reduced)
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing receipt window") }
            window.makeKeyAndOrderFront(nil)
            @MainActor func commit() {
                let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: "\r", charactersIgnoringModifiers: "\r", isARepeat: false, keyCode: 36)!
                NSApp.sendEvent(event)
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"], let image = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return }
                host.cacheDisplay(in: host.bounds, to: image)
                try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
            }
            commit()
            try? await Task.sleep(for: .milliseconds(200))
            capture("sidebar-toggle-native-contact")
            try? await Task.sleep(for: .seconds(2))
            let normal = collapsed
            capture("sidebar-toggle-native-rest")
            reduced = true
            try? await Task.sleep(for: .milliseconds(200))
            commit()
            try? await Task.sleep(for: .milliseconds(200))
            capture("sidebar-toggle-native-reduced")
            let expanded = !collapsed
            disabled = true
            try? await Task.sleep(for: .milliseconds(200))
            commit()
            try? await Task.sleep(for: .milliseconds(200))
            let ignored = !collapsed
            let result = "collapsed=\(normal) expanded=\(expanded) disabled=\(ignored) passed=\(normal && expanded && ignored)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
