import AppKit
import SwiftUI
import UniformTypeIdentifiers
import MetalUI

/// A public AppKit drag payload enters the real SwiftUI host, not a component callback.
@MainActor final class FileDrag: NSObject, NSDraggingInfo {
    let draggingDestinationWindow: NSWindow?
    let draggingPasteboard = NSPasteboard(name: .init("dev.metalui.drop-proof"))
    let draggingLocation: NSPoint
    let draggingSourceOperationMask: NSDragOperation = .copy
    let draggedImageLocation: NSPoint = .zero
    nonisolated let draggedImage: NSImage? = nil
    let draggingSource: Any? = nil
    private static var sequence = 0
    let draggingSequenceNumber: Int
    var draggingFormation: NSDraggingFormation = .none
    var animatesToDestination = false
    var numberOfValidItemsForDrop = 0
    var springLoadingHighlight: NSSpringLoadingHighlight = .none
    init(window: NSWindow, location: NSPoint, urls: [URL]) {
        Self.sequence += 1
        draggingSequenceNumber = Self.sequence
        draggingDestinationWindow = window; draggingLocation = location
        super.init()
        draggingPasteboard.clearContents()
        draggingPasteboard.writeObjects(urls.map { $0 as NSURL })
    }
    func slideDraggedImage(to screenPoint: NSPoint) {}
    nonisolated override func namesOfPromisedFilesDropped(atDestination dropDestination: URL) -> [String]? { nil }
    func resetSpringLoading() {}
    func enumerateDraggingItems(options: NSDraggingItemEnumerationOptions = [], for view: NSView?, classes classArray: [AnyClass], searchOptions: [NSPasteboard.ReadingOptionKey: Any] = [:], using block: (NSDraggingItem, Int, UnsafeMutablePointer<ObjCBool>) -> Void) {
        for (index, item) in (draggingPasteboard.readObjects(forClasses: classArray, options: searchOptions) ?? []).enumerated() {
            guard let writer = item as? NSPasteboardWriting else { continue }
            let dragging = NSDraggingItem(pasteboardWriter: writer)
            var stop = ObjCBool(false)
            block(dragging, index, &stop)
            if stop.boolValue { break }
        }
    }
}

@main struct DropZoneLabelProof: App {
    var body: some Scene { WindowGroup { Proof() }.windowResizability(.contentSize) }
}
struct Proof: View {
    @State private var graphite = false
    @State private var reduced = false
    @State private var refusalCount = 0
    private var colorway: MetalColorway { graphite ? .graphite : .bone }
    var body: some View {
        MetalDropZone("Drop files here", maxSize: 0, compact: true, onRefused: { refusalCount = $0.count }, onFiles: { _ in })
            .frame(width: 480).padding(MetalSpace.s24)
            .background((graphite ? MetalShared.pageDark : MetalShared.page).color)
            .metalColorway(colorway).metalReduceMotion(reduced)
            .task {
                let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".txt")
                try! Data([1]).write(to: file); defer { try? FileManager.default.removeItem(at: file) }
                try? await Task.sleep(for: .milliseconds(700)); NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("No public DropZone host") }
                window.makeKeyAndOrderFront(nil)
                @MainActor func destinations(_ view: NSView) -> [NSView] { (view.registeredDraggedTypes.isEmpty ? [] : [view]) + view.subviews.flatMap(destinations) }
                let target = destinations(host).last ?? host
                let point = target.convert(CGPoint(x: target.bounds.midX, y: target.bounds.midY), to: nil)
                var sender: FileDrag?
                @MainActor func enter() { let payload = FileDrag(window: window, location: point, urls: [file]); sender = payload; _ = target.draggingEntered(payload); _ = target.draggingUpdated(payload) }
                @MainActor func exit() { if let sender { target.draggingExited(sender); target.draggingEnded(sender) }; sender = nil }
                @MainActor func pixels() -> Data {
                    host.layoutSubtreeIfNeeded()
                    let image = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution])!
                    return NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!
                }
                @MainActor func words(_ data: Data) -> Data {
                    let image = NSBitmapImageRep(data: data)!.cgImage!, scale = CGFloat(image.width) / host.bounds.width
                    let r = MetalRecipes.dropZone, title = window.frame.height - window.contentLayoutRect.height
                    let x = MetalSpace.s24 + r.points("compact.pad-x") + r.points("well.size") + r.points("compact.gap")
                    let y = title + MetalSpace.s24 + (r.points("compact.height") - MetalType.ui.line) / 2
                    let rect = CGRect(x: x * scale, y: y * scale, width: host.bounds.width / 3 * scale, height: MetalType.ui.line * scale)
                    return NSBitmapImageRep(cgImage: image.cropping(to: rect)!).representation(using: .png, properties: [:])!
                }
                var receipts: [String] = [], passed = true
                let variants = ProcessInfo.processInfo.environment["METALUI_NATIVE_LIVE_ONLY"] == "1" ? [] : [false, true]
                for dark in variants { for still in [false, true] {
                    exit(); graphite = dark; reduced = still
                    try? await Task.sleep(for: .milliseconds(700)); let before = pixels(); enter()
                    try? await Task.sleep(for: .milliseconds(60)); let moving = pixels()
                    try? await Task.sleep(for: .milliseconds(700)); let settled = pixels()
                    let changed = words(before) != words(settled), policy = still ? words(moving) == words(settled) : words(moving) != words(settled)
                    passed = passed && changed && policy
                    receipts.append("\(colorway.rawValue)-\(still ? "reduced" : "full"):changed=\(changed),policy=\(policy)")
                    if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                        let stem = "drop-zone-label-\(colorway.rawValue)\(still ? "-reduced" : "")"
                        try? settled.write(to: URL(fileURLWithPath: directory).appendingPathComponent(stem + ".png"))
                        try? moving.write(to: URL(fileURLWithPath: directory).appendingPathComponent(stem + "-moving.png"))
                    }
                } }
                exit(); graphite = false; reduced = false; try? await Task.sleep(for: .milliseconds(700)); enter()
                try? await Task.sleep(for: .milliseconds(60)); reduced = true
                try? await Task.sleep(for: .milliseconds(60)); let immediate = pixels()
                try? await Task.sleep(for: .milliseconds(700)); let settled = pixels()
                if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                    try? immediate.write(to: URL(fileURLWithPath: directory).appendingPathComponent("drop-zone-label-live-immediate.png"))
                    try? settled.write(to: URL(fileURLWithPath: directory).appendingPathComponent("drop-zone-label-live-settled.png"))
                }
                let live = words(immediate) == words(settled); passed = passed && live; receipts.append("liveReduced=\(live)")
                exit(); reduced = false; try? await Task.sleep(for: .milliseconds(700))
                let refused = FileDrag(window: window, location: point, urls: [file])
                _ = target.draggingEntered(refused); _ = target.prepareForDragOperation(refused)
                _ = target.performDragOperation(refused); target.concludeDragOperation(refused); target.draggingEnded(refused)
                try? await Task.sleep(for: .milliseconds(60)); reduced = true
                try? await Task.sleep(for: .milliseconds(60)); let stopped = pixels()
                try? await Task.sleep(for: .milliseconds(700)); let stoppedRest = pixels()
                let refusal = refusalCount == 1 && words(stopped) == words(stoppedRest)
                passed = passed && refusal; receipts.append("liveRefusal=\(refusal)")
                if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] {
                    try? stopped.write(to: URL(fileURLWithPath: directory).appendingPathComponent("drop-zone-label-refusal-immediate.png"))
                    try? stoppedRest.write(to: URL(fileURLWithPath: directory).appendingPathComponent("drop-zone-label-refusal-settled.png"))
                }
                try? (receipts.joined(separator: " ") + " passed=\(passed)").write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
