import AppKit
import SwiftUI
import MetalUI

@main struct StatusLabelProof: App {
    var body: some Scene { WindowGroup { Proof() }.windowResizability(.contentSize) }
}
struct Proof: View {
    @State private var paused = false
    @State private var graphite = false
    @State private var reduced = false
    private var colorway: MetalColorway { graphite ? .graphite : .bone }
    var body: some View {
        MetalStatusBadge(paused ? "Offline" : "Synced", led: paused ? .off : .live, tone: .quiet, glyph: paused ? .offline : .synced)
            .padding(MetalSpace.s24).frame(width: 480)
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
                func wordPixels(_ data: Data) -> Data {
                    let image = NSBitmapImageRep(data: data)!.cgImage!
                    // The trailing half of this centred quiet badge contains words only,
                    // excluding the glyph's independently allowed result act.
                    let crop = image.cropping(to: CGRect(x: image.width / 2, y: image.height / 2, width: image.width / 4, height: image.height / 2))!
                    return NSBitmapImageRep(cgImage: crop).representation(using: .png, properties: [:])!
                }
                var receipts: [String] = []
                var passed = true
                for dark in [false, true] { for still in [false, true] {
                    graphite = dark; reduced = still; paused = false
                    try? await Task.sleep(for: .milliseconds(700))
                    let before = pixels(); paused = true
                    try? await Task.sleep(for: .milliseconds(60)); let moving = pixels()
                    var settled = moving, equal = 0
                    for _ in 0..<15 {
                        try? await Task.sleep(for: .milliseconds(200)); let next = pixels()
                        equal = next == settled ? equal + 1 : 0; settled = next
                        if equal >= 3 { break }
                    }
                    let changed = before != settled, resting = equal >= 3
                    // Live reduction lands the actual label at once, without retained offset travel.
                    let policy = still ? wordPixels(moving) == wordPixels(settled) : moving != settled
                    passed = passed && changed && resting && policy
                    receipts.append("\(colorway.rawValue)-\(still ? "reduced" : "full"):changed=\(changed),rest=\(resting),policy=\(policy)")
                    if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                        let stem = "status-label-\(colorway.rawValue)\(still ? "-reduced" : "")"
                        try? settled.write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(stem).png"))
                        try? moving.write(to: URL(fileURLWithPath: directory).appendingPathComponent("\(stem)-moving.png"))
                    }
                } }
                reduced = false; paused = false
                try? await Task.sleep(for: .milliseconds(800))
                paused = true
                try? await Task.sleep(for: .milliseconds(60))
                reduced = true
                try? await Task.sleep(for: .milliseconds(60)); let cancelled = pixels()
                try? await Task.sleep(for: .milliseconds(900)); let stopped = pixels()
                let cancelledTravel = wordPixels(cancelled) == wordPixels(stopped)
                receipts.append("mid-transition-reduction:still=\(cancelledTravel)")
                passed = passed && cancelledTravel
                if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                    try? cancelled.write(to: URL(fileURLWithPath: directory).appendingPathComponent("status-label-cancelled.png"))
                }
                try? (receipts.joined(separator: " ") + " passed=\(passed)").write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
