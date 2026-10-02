import AppKit
import SwiftUI
import MetalUI

@main struct CueRecognitionProof: App {
    var body: some Scene { WindowGroup { CueReceipt() } }
}
struct CueReceipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var confirmations = 0
    @State private var reduced = false
    @State private var raw = true
    var body: some View {
        VStack(spacing: MetalSpace.s16) {
            HStack(spacing: MetalSpace.s24) {
                MetalCueText("tomorrow", kind: .date, meaning: .time, raw: raw, recognition: "date", resolved: "SAT 3 OCT")
                MetalCueText("$40", kind: .amount, meaning: .money, raw: raw, recognition: "money", formatted: "$40.00")
                MetalCueText("6h", kind: .measurement, meaning: .sleep, raw: raw, recognition: "sleep")
            }
            MetalCueInferred("FRI", confirmed: confirmations > 0, onConfirm: { confirmations += 1 })
            MetalButton("Recognize words", cap: .strip) { raw.toggle() }.keyboardShortcut(.defaultAction)
            Text("\(confirmations) committed").font(.metal(MetalType.meta))
        }
        .frame(width: 520, height: 220).foregroundStyle(colorway.tokens.ink.color)
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
            try? await Task.sleep(for: .milliseconds(150))
            capture("cue-recognition-contact-" + colorway.rawValue)
            let cued = !raw
            reduced = true
            try? await Task.sleep(for: .milliseconds(150))
            capture("cue-recognition-mid-reduced-" + colorway.rawValue)
            try? await Task.sleep(for: .seconds(2))
            capture("cue-recognition-rest-" + colorway.rawValue)
            reduced = true
            commit()
            try? await Task.sleep(for: .milliseconds(100))
            let plain = raw
            commit()
            try? await Task.sleep(for: .milliseconds(100))
            capture("cue-recognition-reduced-" + colorway.rawValue)
            let result = "cued=\(cued) plain=\(plain) passed=\(cued && plain && !raw)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
