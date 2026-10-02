import AppKit
import SwiftUI
import MetalUI

@main struct NumericCueProof: App {
    var body: some Scene { WindowGroup { Proof() } }
}
private let units = [
    MetalNumericCueUnit(id: "h", label: "hours", factor: 60, step: 1 / 12, smallStep: 1 / 60, largeStep: 1,
        format: { "\($0) h" }, source: { "\($0)h" }),
    MetalNumericCueUnit(id: "min", label: "minutes", factor: 1, step: 5, smallStep: 1, largeStep: 60,
        format: { "\(Int($0)) min" }, source: { "\(Int($0))min" }),
]
struct Proof: View {
    @State private var value = MetalNumericCueValue(value: 360, unit: "h")
    @State private var enabled = true
    @StateObject private var document = MetalCueDocument("slept 6h")
    @State private var begins = 0
    @State private var commits = 0
    @State private var cancels = 0
    @State private var trace: [String] = []
    var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s24) {
            HStack(alignment: .firstTextBaseline) {
                Text("slept")
                MetalNumericCue("Sleep", value: $value, units: units, in: 0...1440,
                                footprint: ["0.0833333333333333 h", "1440 min"], kind: .duration, meaning: .sleep,
                                onBegin: { document.begin(NSRange(location: 6, length: document.source.utf16.count - 6)); begins += 1 },
                                onSourceChange: { document.replace($0) },
                                onCommit: { document.commit(); commits += 1 },
                                onCancel: { reason in if reason == .external { document.commit() } else { document.cancel() }; cancels += 1 })
                    .disabled(!enabled)
                Text("after work")
            }
            Text(document.source)
            Text("\(begins) begins, \(commits) commits, \(cancels) cancels")
        }.padding(MetalSpace.s24).font(.metal(MetalType.content)).frame(width: 600, height: 220)
            .metalColorway(.bone).metalReduceMotion()
            .task {
                try? await Task.sleep(for: .seconds(1))
                NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing numeric host") }
                window.makeKeyAndOrderFront(nil); window.recalculateKeyViewLoop(); window.makeFirstResponder(host)
                @MainActor func key(_ characters: String, _ code: UInt16, _ modifiers: NSEvent.ModifierFlags = []) async {
                    if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: modifiers,
                        timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber,
                        context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code) { window.sendEvent(event) }
                    try? await Task.sleep(for: .milliseconds(150)); trace.append("\(code): \(value.value), \(value.unit), \(begins)/\(commits)/\(cancels)")
                }
                await key("\u{F700}", 126)
                let stepped = value.value == 365 && begins == 1 && commits == 1
                await key("\u{F700}", 126, [.shift])
                let shifted = value.value == 425
                await key("\u{F701}", 125, [.option])
                let fine = value.value == 424
                await key("\u{F703}", 124, [.option])
                let converted = value.value == 424 && value.unit == "min"
                let before = commits
                await key("\r", 36)
                await key("\u{1b}", 53)
                let cancelled = value.value == 424 && commits == before && cancels == 1
                enabled = false
                try? await Task.sleep(for: .milliseconds(150))
                await key("\u{F700}", 126)
                let disabled = value.value == 424 && commits == before
                document.undo()
                let undo = document.source != "slept 424min"
                let passed = stepped && shifted && fine && converted && cancelled && disabled && undo
                let report = "trace=\(trace) step=\(stepped) shift=\(shifted) fine=\(fine) conversion=\(converted) cancel=\(cancelled) disabled=\(disabled) undo=\(undo) passed=\(passed)"
                try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
