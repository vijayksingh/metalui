import AppKit
import SwiftUI
import MetalUI

@main struct TagCueProof: App { var body: some Scene { WindowGroup { TagForm() } } }
private let original = "🎨 Send #poster with Sam."
private let tags = ["#poster", "#studio", "#coffee", "#long-project"]
struct TagForm: View {
    @StateObject private var document = MetalCueDocument(original, selection: .init(start: 2, end: 2))
    @State private var picker = false
    @State private var readOnly = false
    @State private var disabled = false
    @FocusState private var sourceFocused: Bool
    @State private var width: CGFloat = .zero
    private struct Width: PreferenceKey { static var defaultValue = CGFloat.zero; static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) } }
    private var range: NSRange { (document.source as NSString).range(of: "#[\\p{L}\\p{N}_-]+", options: .regularExpression) }
    private var value: String { range.location == NSNotFound ? "#poster" : (document.source as NSString).substring(with: range) }
    private var colorway: MetalColorway { ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone }
    var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s16) {
            TextField("Tag source", text: Binding(get: { document.source }, set: { document.setSource($0); if $0.hasSuffix("#") { document.commit(); picker = true } }))
                .focused($sourceFocused).accessibilityLabel("Tag source")
            HStack(spacing: MetalSpace.s8) {
                Text("Send")
                MetalTagCue(value, recentTags: tags, label: "Project tag", readOnly: readOnly, editing: document.editing,
                    onBegin: { document.begin(range) }, onChange: { _ = document.replace($0) }, onCommit: document.commit, onCancel: document.cancel)
                    .disabled(disabled || picker).keyboardShortcut(.defaultAction)
                    .background(GeometryReader { proxy in Color.clear.preference(key: Width.self, value: proxy.size.width) })
                    .onPreferenceChange(Width.self) { width = $0 }
                Text("with Sam.")
            }
            if picker { MetalTagCuePicker("Find a recent tag", recentTags: tags) { tag in
                let source = document.source as NSString
                if document.begin(.init(location: source.length - 1, length: 1)) { document.replace(tag); document.commit(); picker = false }
            }.onKeyPress(.escape) { picker = false; return .handled } }
            HStack {
                MetalButton("Undo tag edit", icon: .undo, action: document.undo).keyboardShortcut("z", modifiers: .command)
                MetalButton("Edit source", icon: .pen) { sourceFocused = true }.keyboardShortcut("1", modifiers: .command)
                MetalButton("Read only") { readOnly.toggle() }.keyboardShortcut("l", modifiers: .command)
                MetalButton("Disabled") { disabled.toggle() }.keyboardShortcut("d", modifiers: .command)
            }
        }.padding(MetalSpace.s24).frame(width: 600).font(.metal(MetalType.content))
            .foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
            .metalColorway(colorway).metalReduceMotion(colorway == .graphite)
            .task {
                try? await Task.sleep(for: .milliseconds(700))
                NSApp.activate(ignoringOtherApps: true)
                guard let window = NSApp.windows.first else { return }; window.makeKeyAndOrderFront(nil)
                @MainActor func key(_ text: String, _ code: UInt16, modifiers: NSEvent.ModifierFlags = []) async {
                    if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: modifiers, timestamp: ProcessInfo.processInfo.systemUptime,
                        windowNumber: window.windowNumber, context: nil, characters: text, charactersIgnoringModifiers: text, isARepeat: false, keyCode: code) {
                        if modifiers.contains(.command) || !picker { if !window.performKeyEquivalent(with: event) { window.sendEvent(event) } } else { window.sendEvent(event) }
                    }
                    try? await Task.sleep(for: .milliseconds(200))
                }
                var checks: [Bool] = []
                let initialWidth = width
                await key("\r", 36); checks.append(document.source == "🎨 Send #studio with Sam."); checks.append(abs(width - initialWidth) < 0.1)
                await key("z", 6, modifiers: .command); checks.append(document.source == original && document.selection.start == 2)
                await key("l", 37, modifiers: .command); await key("\r", 36); checks.append(document.source == original)
                await key("l", 37, modifiers: .command); await key("d", 2, modifiers: .command); await key("\r", 36); checks.append(document.source == original)
                await key("d", 2, modifiers: .command); await key("1", 18, modifiers: .command); (window.firstResponder as? NSTextView)?.setSelectedRange(NSRange(location: document.source.utf16.count, length: 0)); await key(" ", 49); await key("#", 20)
                checks.append(document.source == original + " #" && picker)
                await key("\u{F701}", 125); await key("\r", 36)
                checks.append(document.source == original + " #studio" && !picker)
                await key("z", 6, modifiers: .command); checks.append(document.source == original + " #")
                if let path = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"], let image = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]) {
                    try? NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path).appendingPathComponent("tag-cue-\(colorway.rawValue).png"))
                }
                let result = "source=\(document.source) readOnly=\(readOnly) disabled=\(disabled) picker=\(picker) checks=\(checks) passed=\(!checks.contains(false))"
                try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
