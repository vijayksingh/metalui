import AppKit
import SwiftUI
import MetalUI

@main struct AttachmentResultProof: App {
    var body: some Scene { WindowGroup { Receipt() } }
}
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var state: MetalAttachmentUploadState? = nil
    @State private var progress: Double? = 40
    @State private var retries = 0
    @State private var reduced = false
    @State private var disabled = false
    var body: some View {
        MetalAttachment(name: "Proof.pdf", size: 240_000, progress: progress, uploadState: state,
            error: state == .error ? "Connection lost; the file is still here" : nil,
            retry: { retries += 1; state = .uploading; progress = 100 })
            .keyboardShortcut(.defaultAction).disabled(disabled)
            .padding(MetalSpace.s16).frame(width: 420, height: 220)
            .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
            .metalColorway(colorway).metalReduceMotion(reduced)
            .task {
                try? await Task.sleep(for: .seconds(1))
                NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first else { fatalError("Missing attachment window") }
                window.makeKeyAndOrderFront(nil)
                @MainActor func commit() {
                    let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                        windowNumber: window.windowNumber, context: nil, characters: "\r", charactersIgnoringModifiers: "\r", isARepeat: false, keyCode: 36)!
                    NSApp.sendEvent(event)
                }
                @MainActor func capture(_ name: String) {
                    guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"],
                          let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return }
                    let image = NSBitmapImageRep(cgImage: pixels)
                    try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
                }
                progress = nil
                try? await Task.sleep(for: .seconds(1))
                capture("attachment-native-legacy-clear")
                state = .error
                try? await Task.sleep(for: .seconds(1))
                capture("attachment-native-error")
                commit()
                try? await Task.sleep(for: .seconds(1))
                let pending = state == .uploading && progress == 100 && retries == 1
                capture("attachment-native-uploading")
                state = .complete; progress = nil
                try? await Task.sleep(for: .seconds(2))
                capture("attachment-native-complete")
                reduced = true; state = .error
                try? await Task.sleep(for: .milliseconds(200))
                commit()
                try? await Task.sleep(for: .milliseconds(200))
                let reducedRetry = state == .uploading && retries == 2
                state = .complete; progress = nil
                try? await Task.sleep(for: .milliseconds(200))
                capture("attachment-native-complete-reduced")
                disabled = true; state = .error
                try? await Task.sleep(for: .milliseconds(200))
                commit()
                try? await Task.sleep(for: .milliseconds(200))
                let refused = state == .error && retries == 2
                let result = "pending=\(pending) reducedRetry=\(reducedRetry) disabled=\(refused) retries=\(retries) passed=\(pending && reducedRetry && refused)"
                try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
