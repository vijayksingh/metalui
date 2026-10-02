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

@main struct DropZoneProof: App {
    var body: some Scene { WindowGroup { ReceivingFiles() } }
}
struct ReceivingFiles: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var accepted: [URL] = []
    @State private var refusals: [MetalDropRefusal] = []
    @State private var reduced = false
    @State private var disabled = false
    var body: some View {
        VStack(spacing: 16) {
            MetalDropZone(description: "PDFs up to 100 bytes", accept: [.pdf], maxSize: 100, multiple: false,
                          onRefused: { refusals = $0 }, onFiles: { accepted = $0 })
                .disabled(disabled).metalReduceMotion(reduced).frame(width: 360)
            Text("\(accepted.count) accepted · \(refusals.count) refused").font(.metal(MetalType.meta))
        }
        .frame(width: 520, height: 360)
        .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
        .metalColorway(colorway)
        .task {
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            try! FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            defer { try? FileManager.default.removeItem(at: folder) }
            let pdf = folder.appendingPathComponent("map.pdf"), other = folder.appendingPathComponent("other.pdf")
            let large = folder.appendingPathComponent("large.pdf"), wrong = folder.appendingPathComponent("wrong.txt")
            try! Data(repeating: 1, count: 10).write(to: pdf); try! Data(repeating: 1, count: 10).write(to: other)
            try! Data(repeating: 1, count: 120).write(to: large); try! Data(repeating: 1, count: 10).write(to: wrong)
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing receiving window") }
            window.makeKeyAndOrderFront(nil)
            @MainActor func drop(_ urls: [URL]) {
                func destinations(_ view: NSView) -> [NSView] {
                    (view.registeredDraggedTypes.isEmpty ? [] : [view]) + view.subviews.flatMap(destinations)
                }
                let targets = destinations(host)
                let target = targets.last ?? host
                let point = target.convert(CGPoint(x: target.bounds.midX, y: target.bounds.midY), to: nil)
                let sender = FileDrag(window: window, location: point, urls: urls)
                _ = target.draggingEntered(sender)
                _ = target.prepareForDragOperation(sender)
                _ = target.performDragOperation(sender)
                target.concludeDragOperation(sender)
                target.draggingEnded(sender)
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"], let image = host.bitmapImageRepForCachingDisplay(in: host.bounds) else { return }
                host.cacheDisplay(in: host.bounds, to: image)
                try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
            }
            drop([pdf])
            try? await Task.sleep(for: .milliseconds(700))
            let took = accepted == [pdf] && refusals.isEmpty
            capture("drop-zone-native-accepted")
            drop([wrong, pdf, large, other])
            try? await Task.sleep(for: .milliseconds(700))
            let filtered = accepted == [pdf] && refusals.map { $0.reason.rawValue }.sorted() == ["type", "size", "count"].sorted()
            let detail = "accepted=\(accepted.map(\.lastPathComponent)) refused=\(refusals.map { $0.url.lastPathComponent + ":" + $0.reason.rawValue })"
            capture("drop-zone-native-refused")
            reduced = true
            try? await Task.sleep(for: .milliseconds(200))
            drop([pdf])
            try? await Task.sleep(for: .milliseconds(300))
            let reducedTake = accepted == [pdf] && refusals.isEmpty
            capture("drop-zone-native-reduced")
            disabled = true
            try? await Task.sleep(for: .milliseconds(200))
            drop([wrong])
            try? await Task.sleep(for: .milliseconds(200))
            let ignored = accepted == [pdf] && refusals.isEmpty
            let result = "detail=\(detail) took=\(took) filtered=\(filtered) reduced=\(reducedTake) ignored=\(ignored) passed=\(took && filtered && reducedTake && ignored)"
            try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
