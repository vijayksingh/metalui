import AppKit
import SwiftUI
import MetalUI

@main struct SidebarWordsProof: App { var body: some Scene { WindowGroup { Receipt() } } }
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @State private var collapsed = false
    @State private var reduced = false
    @State private var disabled = false
    @State private var installation = 0
    @State private var capFrame = CGRect.zero
    var body: some View {
        VStack(spacing: MetalSpace.s24) {
            MetalSidebarToggle(collapsed: $collapsed).disabled(disabled).id(installation)
                .background(CapFrame { capFrame = $0 }.allowsHitTesting(false))
            Text(collapsed ? "Collapsed" : "Expanded").font(.metal(MetalType.readout))
        }
        .padding(MetalSpace.s24).frame(width: 700, height: 220)
        .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
        .metalColorway(colorway).metalReduceMotion(reduced)
        .task {
            try? await Task.sleep(for: .seconds(1)); NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first else { fatalError("Missing Sidebar window") }
            window.makeKeyAndOrderFront(nil)
            try? await Task.sleep(for: .milliseconds(400))
            let savedPointer = NSEvent.mouseLocation; CGWarpMouseCursorPosition(.zero)
            defer { CGWarpMouseCursorPosition(CGPoint(x: savedPointer.x, y: (NSScreen.screens.first?.frame.height ?? .zero) - savedPointer.y)) }
            @MainActor func pause(_ seconds: Double) async { try? await Task.sleep(for: .seconds(seconds)) }
            @MainActor func pointer(_ type: NSEvent.EventType) {
                let point = NSPoint(x: capFrame.midX, y: capFrame.midY)
                window.sendEvent(NSEvent.mouseEvent(with: type, location: point, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: window.windowNumber, context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1)!)
            }
            @MainActor func press() async { pointer(.mouseMoved); pointer(.leftMouseDown); await pause(0.05); pointer(.leftMouseUp); await pause(0.005) }
            @MainActor func renderedWords() -> WordPixels? {
                guard capFrame.width > 0, let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return nil }
                let scale = Double(pixels.width) / window.frame.width
                let recipe = MetalRecipes.sidebar
                let left = recipe.points("item.pad-x") + recipe.points("item.glyph") + recipe.points("item.gap")
                let words = CGRect(x: (capFrame.minX + left) * scale,
                    y: (window.frame.height - capFrame.maxY + capFrame.height * 0.18) * scale,
                    width: (capFrame.width - left - recipe.points("item.pad-x")) * scale, height: capFrame.height * 0.64 * scale)
                guard let image = pixels.cropping(to: words) else { return nil }
                let bitmap = NSBitmapImageRep(cgImage: image)
                var minX = bitmap.pixelsWide, minY = bitmap.pixelsHigh, maxX = -1, maxY = -1, count = 0, sumY = 0
                for y in 0..<bitmap.pixelsHigh { for x in 0..<bitmap.pixelsWide {
                    guard let ink = bitmap.colorAt(x: x, y: y)?.usingColorSpace(.deviceRGB) else { continue }
                    let solid = colorway == .bone ? max(ink.redComponent, ink.greenComponent, ink.blueComponent) < 0.55
                        : min(ink.redComponent, ink.greenComponent, ink.blueComponent) > 0.45
                    if solid { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y); count += 1; sumY += y }
                } }
                guard count > 0 else { return nil }
                return WordPixels(bounds: CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1), count: count, meanY: Double(sumY) / Double(count))
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"],
                      let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { return }
                try? NSBitmapImageRep(cgImage: pixels).representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + ".png"))
            }
            await press(); await pause(0.6); let full = collapsed; capture("sidebar-full-collapsed")
            reduced = true; await pause(0.2); await press(); await pause(0.2)
            let initialReduced = !collapsed; capture("sidebar-initial-reduced")
            reduced = false; await pause(0.2); await press(); await pause(0.01)
            reduced = true; await pause(0.05); let live = renderedWords(); capture("sidebar-live-reduced")
            await pause(0.5); let settled = renderedWords(); capture("sidebar-live-settled")
            let stopped = live?.matches(settled) == true
            installation += 1; await pause(0.1); pointer(.mouseMoved); await pause(0.2); let canonical = settled?.matches(renderedWords()) == true; capture("sidebar-canonical-reduced")
            disabled = true; await pause(0.2); await press(); let ignored = collapsed
            let passed = full && initialReduced && stopped && canonical && ignored
            let report = "full=\(full) initialReduced=\(initialReduced) stopped=\(stopped) canonical=\(canonical) disabled=\(ignored) passed=\(passed)"
            try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8); NSApp.terminate(nil)
        }
    }
}
private struct CapFrame: NSViewRepresentable {
    var report: (CGRect) -> Void
    func makeNSView(context: Context) -> Probe { let view = Probe(); view.report = report; return view }
    func updateNSView(_ view: Probe, context: Context) { view.report = report; view.measure() }
    final class Probe: NSView {
        var report: ((CGRect) -> Void)?
        override func layout() { super.layout(); measure() }
        override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); measure() }
        func measure() { DispatchQueue.main.async { [weak self] in guard let self, self.window != nil else { return }; self.report?(self.convert(self.bounds, to: nil)) } }
    }
}

// Compare actual word ink placement and coverage against a fresh reduced control;
// a stable but incorrectly retained vertical offset must still fail.
private struct WordPixels {
    let bounds: CGRect
    let count: Int
    let meanY: Double
    func matches(_ other: WordPixels?) -> Bool {
        guard let other else { return false }
        return bounds == other.bounds && abs(meanY - other.meanY) < 0.2 && abs(count - other.count) <= max(2, count / 50)
    }
}
