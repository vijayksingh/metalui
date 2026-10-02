import AppKit
import SwiftUI
import MetalUI

@main struct SliderProof: App {
    var body: some Scene { WindowGroup { SliderForm() } }
}

struct SliderForm: View {
    @State private var exposure = [25.0, 75.0]
    @State private var level = 40.0
    @State private var rtl = 50.0
    @State private var trace: [String] = []
    @State private var enabled = true
    var body: some View {
        VStack {
            MetalSlider(values: $exposure, in: 0...100, step: 5, largeStep: 25,
                        minStepsBetweenValues: 2, thumbLabels: ["Exposure, lower", "Exposure, upper"],
                        showsValue: true, valueBubble: true, label: "Exposure", valueText: { "\(Int($0))%" })
                .frame(width: 500, height: 48).disabled(!enabled)
            MetalSlider(value: $level, in: 0...100, step: 1, largeStep: 10, orientation: .vertical,
                        label: "Level", valueText: { "\(Int($0))%" }).frame(width: 72, height: 240)
            MetalSlider(value: $rtl, in: 0...100, step: 1, largeStep: 10,
                        label: "RTL amount", valueText: { "\(Int($0))" })
                .environment(\.layoutDirection, .rightToLeft).frame(width: 500, height: 48)
        }.padding().frame(width: 600, height: 450)
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing slider form") }
            window.makeKeyAndOrderFront(nil); window.recalculateKeyViewLoop()
            try? await Task.sleep(for: .milliseconds(300))
            window.makeFirstResponder(host)
            @MainActor func key(_ characters: String, _ code: UInt16, shift: Bool = false) async {
                if let event = NSEvent.keyEvent(with: .keyDown, location: .zero,
                    modifierFlags: shift ? [.shift] : [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: window.windowNumber, context: nil, characters: characters,
                    charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code) { window.sendEvent(event) }
                try? await Task.sleep(for: .milliseconds(150))
                trace.append("\(code)\(shift ? "S" : ""): \(exposure) / \(level) / \(rtl)")
            }
            await key("\u{F72B}", 119)
            let bounded = exposure == [65, 75]
            await key("\u{F703}", 124)
            let refused = exposure == [65, 75]
            await key("\t", 48)
            await key("\u{F72C}", 116)
            let upper = exposure == [65, 100]
            await key("\u{19}", 48, shift: true)
            await key("\u{F72D}", 121)
            let lower = exposure == [40, 100]
            await key("\t", 48); await key("\t", 48)
            await key("\u{F729}", 115)
            await key("\u{F700}", 126)
            let vertical = level == 1
            await key("\t", 48)
            await key("\u{F703}", 124)
            let direction = rtl == 49
            await key("\u{19}", 48, shift: true)
            await key("\u{19}", 48, shift: true)
            await key("\u{19}", 48, shift: true)
            enabled = false
            try? await Task.sleep(for: .milliseconds(150))
            await key("\u{F703}", 124)
            let disabled = exposure == [40, 100]
            let passed = bounded && refused && upper && lower && disabled && vertical && direction
            let result = "trace=\(trace) key=\(window.isKeyWindow) responder=\(String(describing: window.firstResponder)) range=\(exposure) bounded=\(bounded) refusal=\(refused) upper=\(upper) lower=\(lower) disabled=\(disabled) vertical=\(level)/\(vertical) rtl=\(rtl)/\(direction) passed=\(passed)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
