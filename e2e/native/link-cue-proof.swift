import AppKit
import SwiftUI
import MetalUI

@main struct LinkCueProof: App { var body: some Scene { WindowGroup { Receipt() } } }
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @StateObject private var document = MetalCueDocument("🧠 Read https://metalui.dev/overview before Friday.", selection: .init(start: 49, end: 49))
    @State private var reduced = false
    @State private var disabled = false
    @State private var readOnly = false
    @State private var commits = 0
    @State private var cancels = 0
    @State private var followed: [String] = []
    @State private var tailX: CGFloat = .zero
    private var range: NSRange { (document.source as NSString).range(of: #"https?://\S+"#, options: [.regularExpression, .caseInsensitive]) }
    private var value: String { range.location == NSNotFound ? "" : (document.source as NSString).substring(with: range) }
    var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s24) {
            HStack(spacing: .zero) {
                Text("🧠 Read ")
                MetalLinkCue(value, footprint: ["https://metalui.dev/components/provenance-tooltip?section=editing", "metalui.dev"], label: "Reference", readOnly: readOnly, editing: document.editing,
                    onBegin: { document.begin(range) }, onChange: document.replace,
                    onCommit: { commits += 1; document.commit() }, onCancel: { cancels += 1; document.cancel() }).disabled(disabled)
                Text(" before Friday.").background(GeometryReader { geometry in Color.clear.preference(key: TailFrame.self, value: geometry.frame(in: .global).minX) })
            }
            Text(document.source)
            Text("UTF16 \(document.selection.start)–\(document.selection.end) · commits \(commits) · cancels \(cancels)").font(.metal(MetalType.readout))
        }
        .padding(MetalSpace.s24).frame(width: 900, height: 220)
        .font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
        .metalColorway(colorway).metalReduceMotion(reduced)
        .environment(\.openURL, OpenURLAction { url in followed.append(url.absoluteString); return .handled })
        .onPreferenceChange(TailFrame.self) { tailX = $0 }
        .task {
            try? await Task.sleep(for: .seconds(1)); NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView else { fatalError("Missing link window") }
            window.makeKeyAndOrderFront(nil); window.recalculateKeyViewLoop(); window.makeFirstResponder(host)
            try? await Task.sleep(for: .milliseconds(400))
            let savedPointer = NSEvent.mouseLocation; CGWarpMouseCursorPosition(.zero)
            defer { CGWarpMouseCursorPosition(CGPoint(x: savedPointer.x, y: (NSScreen.screens.first?.frame.height ?? .zero) - savedPointer.y)) }
            var trace: [String] = []
            @MainActor func key(_ characters: String, _ code: UInt16) async {
                let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: NSApp.keyWindow?.windowNumber ?? window.windowNumber, context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code)!
                NSApp.sendEvent(event); try? await Task.sleep(for: .milliseconds(200))
                trace.append("key\(code) active=\(document.editing) source=\(value) commits=\(commits) follows=\(followed.count)")
            }
            @MainActor func input(_ words: String) async -> Bool {
                guard let editor = NSApp.keyWindow?.firstResponder as? NSTextView else { trace.append("No actual field editor: \(String(describing: NSApp.keyWindow?.firstResponder))"); return false }
                editor.selectAll(nil); editor.insertText(words, replacementRange: NSRange(location: NSNotFound, length: 0))
                try? await Task.sleep(for: .milliseconds(200)); return true
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] else { return }
                for visible in NSApp.windows.filter({ $0.isVisible }) {
                    guard let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(visible.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { continue }
                    let image = NSBitmapImageRep(cgImage: pixels)
                    try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + (visible === window ? "-document.png" : "-field.png")))
                }
            }
            let firstTail = tailX
            await key("\r", 36)
            let navigated = followed == ["https://metalui.dev/overview"] && !document.editing
            await key("\t", 48); await key("\r", 36); try? await Task.sleep(for: .milliseconds(400))
            let opened = document.editing && NSApp.keyWindow?.firstResponder is NSTextView
            let exact = "https://METALUI.dev/components/Button?tab=Main#Held"
            let typed = await input(exact)
            let draftOnly = value == "https://metalui.dev/overview"
            capture("link-field")
            await key("\r", 36); try? await Task.sleep(for: .milliseconds(400))
            let committed = value == exact && commits == 1 && !document.editing
            let footprint = abs(firstTail - tailX) < 1
            capture("link-chosen")
            document.undo(); try? await Task.sleep(for: .milliseconds(300))
            let undo = value == "https://metalui.dev/overview" && !document.canUndo && document.selection == .init(start: 49, end: 49)
            await key("\r", 36); try? await Task.sleep(for: .milliseconds(300))
            _ = await input("javascript:alert(1)"); await key("\r", 36)
            let refused = document.editing && value == "https://metalui.dev/overview" && commits == 1
            _ = await input("https://metalui.dev/" + String(repeating: "wide-word-", count: 30)); await key("\r", 36)
            let oversized = document.editing && value == "https://metalui.dev/overview" && commits == 1
            await key("\u{1B}", 53)
            let escaped = !document.editing && cancels == 1
            reduced = true; try? await Task.sleep(for: .milliseconds(300))
            await key("\r", 36); try? await Task.sleep(for: .milliseconds(300)); _ = await input("https://metalui.dev/components/calendar"); await key("\r", 36)
            let reducedEdit = value == "https://metalui.dev/components/calendar" && commits == 2 && !document.editing
            capture("link-reduced")
            readOnly = true; try? await Task.sleep(for: .milliseconds(300)); await key("\r", 36)
            let readonly = !document.editing && commits == 2
            disabled = true; try? await Task.sleep(for: .milliseconds(300)); await key("\r", 36)
            let inert = !document.editing && commits == 2
            let passed = navigated && opened && typed && draftOnly && committed && footprint && undo && refused && oversized && escaped && reducedEdit && readonly && inert
            let report = "navigated=\(navigated) opened=\(opened) typed=\(typed) draftOnly=\(draftOnly) committed=\(committed) footprint=\(footprint) undo=\(undo) invalid=\(refused) oversized=\(oversized) escape=\(escaped) reduced=\(reducedEdit) readonly=\(readonly) disabled=\(inert) trace=\(trace) passed=\(passed)"
            try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8); NSApp.terminate(nil)
        }
    }
}
private struct TailFrame: PreferenceKey {
    static var defaultValue: CGFloat = .zero
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}
