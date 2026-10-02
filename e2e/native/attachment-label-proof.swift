import AppKit
import SwiftUI
import MetalUI

@main struct AttachmentLabelProof: App {
    var body: some Scene { WindowGroup { Proof() }.windowResizability(.contentSize) }
}
struct Proof: View {
    @State private var complete = false
    @State private var graphite = false
    @State private var reduced = false
    private var colorway: MetalColorway { graphite ? .graphite : .bone }
    var body: some View {
        MetalAttachment(name: "Proof.pdf", size: 240_000, uploadState: complete ? .complete : .error, error: complete ? nil : "Connection lost")
            .frame(width: 480).padding(MetalSpace.s24)
            .background((graphite ? MetalShared.pageDark : MetalShared.page).color)
            .metalColorway(colorway).metalReduceMotion(reduced)
            .task {
                NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing public host") }
                window.makeKeyAndOrderFront(nil)
                @MainActor func pixels() -> Data {
                    host.layoutSubtreeIfNeeded()
                    guard let image = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { fatalError("Own-window pixels unavailable") }
                    return NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!
                }
                @MainActor func wordPixels(_ data: Data) -> Data {
                    let image = NSBitmapImageRep(data: data)!.cgImage!
                    let scale = CGFloat(image.width) / host.bounds.width
                    let title = window.frame.height - window.contentLayoutRect.height
                    // Metadata follows the type well and result glyph. Exclude the filename,
                    // independently allowed glyph act, raised plate and system titlebar.
                    let r = MetalRecipes.attachment
                    let x = MetalSpace.s24 + r.points("self.pad") + r.points("type.size") + r.points("self.gap") + MetalRecipes.button.points("compact.glyph") + MetalSpace.s4
                    let height = window.contentLayoutRect.height - 2 * MetalSpace.s24
                    let rect = CGRect(x: x * scale, y: (title + MetalSpace.s24 + height / 2 + r.points("body.gap")) * scale,
                        width: host.bounds.width / 2 * scale, height: MetalType.meta.line * scale)
                    return NSBitmapImageRep(cgImage: image.cropping(to: rect)!).representation(using: .png, properties: [:])!
                }
                var receipts: [String] = []
                var passed = true
                for dark in [false, true] { for still in [false, true] {
                    graphite = dark; reduced = still; complete = false
                    try? await Task.sleep(for: .milliseconds(700))
                    let before = pixels(); complete = true
                    try? await Task.sleep(for: .milliseconds(60)); let moving = pixels()
                    var settled = moving, equal = 0
                    for _ in 0..<15 {
                        try? await Task.sleep(for: .milliseconds(200)); let next = pixels()
                        equal = wordPixels(next) == wordPixels(settled) ? equal + 1 : 0; settled = next
                        if equal >= 3 { break }
                    }
                    let changed = wordPixels(before) != wordPixels(settled), resting = equal >= 3
                    // Reduced receipts apply instantly; full receipts settle on the shared spring.
                    let policy = still ? wordPixels(moving) == wordPixels(settled) : wordPixels(moving) != wordPixels(settled)
                    passed = passed && changed && resting && policy
                    receipts.append("\(colorway.rawValue)-\(still ? "reduced" : "full"):changed=\(changed),rest=\(resting),policy=\(policy)")
                    if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                        let stem = "attachment-label-\(colorway.rawValue)\(still ? "-reduced" : "")"
                        try? settled.write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(stem).png"))
                        try? moving.write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(stem)-moving.png"))
                    }
                } }
                graphite = false; reduced = false; complete = false
                try? await Task.sleep(for: .milliseconds(700)); complete = true
                try? await Task.sleep(for: .milliseconds(60)); reduced = true
                try? await Task.sleep(for: .milliseconds(60)); let cancelled = pixels()
                try? await Task.sleep(for: .milliseconds(700)); let afterPolicy = pixels()
                if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                    try? cancelled.write(to: URL(fileURLWithPath: directory).appendingPathComponent("attachment-label-live-immediate.png"))
                    try? afterPolicy.write(to: URL(fileURLWithPath: directory).appendingPathComponent("attachment-label-live-settled.png"))
                }
                let livePolicy = wordPixels(cancelled) == wordPixels(afterPolicy)
                passed = passed && livePolicy; receipts.append("liveReduced=\(livePolicy)")
                try? (receipts.joined(separator: " ") + " passed=\(passed)").write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
