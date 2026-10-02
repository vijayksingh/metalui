import AppKit
import SwiftUI
import MetalUI
@main struct DateCueProof: App { var body: some Scene { WindowGroup { Proof() } } }
struct Proof: View {
    @State private var day = "2026-03-08"
    @State private var enabled = true
    @State private var readOnly = false
    @StateObject private var document = MetalCueDocument("meet tomorrow")
    @State private var begins = 0
    @State private var commits = 0
    @State private var cancels = 0
    @State private var cueFrame = CGRect.zero
    
    var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s24) {
            HStack(alignment: .firstTextBaseline) {
                Text("meet")
                MetalDateCue("Meeting day", value: $day, today: "2026-03-07", in: "2026-03-01"..."2026-04-30",
                    footprint: ["next Wednesday", "2026-03-16", "Wed, 30 Apr"], readOnly: readOnly,
                    onBegin: { document.begin(NSRange(location: 5, length: document.source.utf16.count - 5)); begins += 1 },
                    onSourceChange: { document.replace($0) }, onCommit: { document.commit(); commits += 1 },
                    onCancel: { reason in if reason == .external { document.commit() } else { document.cancel() }; cancels += 1 })
                    .disabled(!enabled)
                    .background { GeometryReader { proxy in Color.clear.onAppear { cueFrame = proxy.frame(in: .global) } } }
            }
            Text(document.source)
        }.padding(MetalSpace.s24).font(.metal(MetalType.content)).frame(width: 600, height: 200).metalColorway(.bone).metalReduceMotion()
        .task {
            try? await Task.sleep(for: .seconds(1)); NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("No host") }
            window.makeKeyAndOrderFront(nil); window.recalculateKeyViewLoop(); window.makeFirstResponder(host)
            @MainActor func key(_ characters: String, _ code: UInt16, _ modifiers: NSEvent.ModifierFlags = []) async {
                if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: modifiers,
                    timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil,
                    characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code) { (NSApp.windows.first { $0.isVisible && $0.className == "_NSPopoverWindow" } ?? window).sendEvent(event) }
                try? await Task.sleep(for: .milliseconds(200))
            }
            await key("9", 25); await key("\u{F700}", 126)
            let step = day == "2026-03-09" && document.source == "meet next Monday" && begins == 1 && commits == 1
            await key("\u{F700}", 126, [.shift])
            let week = day == "2026-03-16" && document.source == "meet 2026-03-16"
            document.undo(); day = "2026-03-09"
            let undo = document.source == "meet next Monday"
            let before = begins
            await key("\u{F701}", 125, [.option])
            let panels = NSApp.windows.filter { $0 != window && $0.isVisible }
            let picker = !panels.isEmpty && day == "2026-03-09" && begins == before
            await key("\u{F703}", 124)
            await key(" ", 49)
            try? await Task.sleep(for: .milliseconds(300))
            let accepted = day == "2026-03-10" && document.source == "meet next Tuesday" && begins == before + 1
            let beforeHold = begins
            let point = NSPoint(x: cueFrame.midX, y: host.bounds.height - cueFrame.midY)
            @MainActor func mouse(_ type: NSEvent.EventType, _ point: NSPoint) {
                if let event = NSEvent.mouseEvent(with: type, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: window.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1) { window.sendEvent(event) }
            }
            window.makeKeyAndOrderFront(nil); mouse(.leftMouseDown, point)
            try? await Task.sleep(for: .milliseconds(1000))
            let hold = NSApp.windows.contains { $0.isVisible && $0.className == "_NSPopoverWindow" } && begins == beforeHold
            mouse(.leftMouseUp, point); await key("\u{1b}", 53)
            mouse(.leftMouseDown, point)
            try? await Task.sleep(for: .milliseconds(100))
            mouse(.leftMouseDragged, NSPoint(x: point.x, y: point.y + 6))
            try? await Task.sleep(for: .milliseconds(1000))
            let movement = !NSApp.windows.contains { $0.isVisible && $0.className == "_NSPopoverWindow" } && day != "2026-03-10"
            mouse(.leftMouseUp, NSPoint(x: point.x, y: point.y + 6))
            await key("\u{1b}", 53)
            let afterDrag = day, afterBegins = begins
            readOnly = true; try? await Task.sleep(for: .milliseconds(150))
            await key("\u{F700}", 126); await key("\u{F701}", 125, [.option]); await key("\r", 36)
            let readonly = day == afterDrag && begins == afterBegins && !NSApp.windows.contains { $0.isVisible && $0.className == "_NSPopoverWindow" }
            readOnly = false; try? await Task.sleep(for: .milliseconds(150)); await key("\u{F700}", 126)
            let reenabled = day != afterDrag && begins == afterBegins + 1
            let beforeDisabled = day, beforeDisabledBegins = begins
            enabled = false; try? await Task.sleep(for: .milliseconds(150)); window.makeFirstResponder(host)
            await key("\u{F700}", 126); await key("\r", 36)
            let disabled = day == beforeDisabled && begins == beforeDisabledBegins
            let passed = step && week && undo && picker && accepted && disabled && hold && movement && readonly && reenabled
            let report = "step=\(step) week=\(week) undo=\(undo) picker=\(picker) accepted=\(accepted) disabled=\(disabled) day=\(day) begins=\(begins) hold=\(hold) movement=\(movement) readonly=\(readonly) reenabled=\(reenabled) passed=\(passed)"
            try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
