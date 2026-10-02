import AppKit
import SwiftUI
import MetalUI

private let original = "🧠 Send #poster, slept 6h. After the edit."
@main struct CueDocumentProof: App { var body: some Scene { WindowGroup { DocumentProof() } } }

struct SourceEditor: NSViewRepresentable {
    @ObservedObject var document: MetalCueDocument
    static var text: NSTextView?
    func makeCoordinator() -> Coordinator { Coordinator(document) }
    func makeNSView(context: Context) -> NSScrollView {
        let scroll = NSScrollView(), text = NSTextView()
        text.isRichText = false; text.font = NSFont.systemFont(ofSize: 15); text.delegate = context.coordinator
        text.string = document.source; scroll.documentView = text; Self.text = text
        return scroll
    }
    func updateNSView(_ scroll: NSScrollView, context: Context) {
        guard let text = scroll.documentView as? NSTextView else { return }
        context.coordinator.updating = true
        if text.string != document.source { text.string = document.source }
        if text.window?.firstResponder === text {
            text.setSelectedRange(NSRange(location: document.selection.start, length: document.selection.end - document.selection.start))
        }
        context.coordinator.updating = false
    }
    final class Coordinator: NSObject, NSTextViewDelegate {
        let document: MetalCueDocument; var updating = false
        init(_ document: MetalCueDocument) { self.document = document }
        func textDidChange(_ notification: Notification) {
            guard !updating, let text = notification.object as? NSTextView else { return }
            let range = text.selectedRange()
            document.setSource(text.string, selection: .init(start: range.location, end: range.location + range.length))
        }
        func textViewDidChangeSelection(_ notification: Notification) {
            guard !updating, let text = notification.object as? NSTextView else { return }
            let range = text.selectedRange()
            document.setSelection(.init(start: range.location, end: range.location + range.length))
        }
    }
}
struct DocumentProof: View {
    @StateObject private var document = MetalCueDocument(original)
    private func begin() { document.begin((document.source as NSString).range(of: "6h")) }
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("One source gesture · UTF16 selection").font(.metal(MetalType.ui))
            SourceEditor(document: document).frame(height: 90)
            HStack {
                MetalButton("Begin 8h") { begin(); document.replace("8h") }.keyboardShortcut("1", modifiers: .command)
                MetalButton("Preview 12h") { document.replace("12h") }.keyboardShortcut("2", modifiers: .command)
                MetalButton("Commit") { document.commit() }.keyboardShortcut("3", modifiers: .command)
            }
            HStack {
                MetalButton("Undo") { document.undo() }.keyboardShortcut("4", modifiers: .command)
                MetalButton("Cancel") { document.cancel() }.keyboardShortcut("5", modifiers: .command)
            }
            Text("Selection \(document.selection.start)–\(document.selection.end), editing \(document.editing)")
                .font(.metal(MetalType.readout))
        }
        .padding(24).frame(width: 600, height: 300)
        .metalColorway(.bone).metalReduceMotion()
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first, let host = window.contentView, let editor = SourceEditor.text else { fatalError("Missing document editor") }
            window.makeKeyAndOrderFront(nil); window.makeFirstResponder(editor)
            editor.setSelectedRange(NSRange(location: original.utf16.count, length: 0))
            @MainActor func press(_ digit: String) {
                if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: .command, timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber, context: nil, characters: digit, charactersIgnoringModifiers: digit, isARepeat: false, keyCode: 18) { _ = window.performKeyEquivalent(with: event) }
            }
            press("1"); try? await Task.sleep(for: .milliseconds(150)); press("2")
            try? await Task.sleep(for: .milliseconds(150))
            let preview = editor.string == original.replacingOccurrences(of: "6h", with: "12h") && editor.selectedRange().location == original.utf16.count + 1
            press("3"); try? await Task.sleep(for: .milliseconds(100)); press("4")
            try? await Task.sleep(for: .milliseconds(150))
            let undone = editor.string == original && editor.selectedRange().location == original.utf16.count && !document.canUndo && document.canRedo
            editor.setSelectedRange(NSRange(location: 2, length: 0))
            press("1"); try? await Task.sleep(for: .milliseconds(150)); press("2")
            try? await Task.sleep(for: .milliseconds(150))
            let before = editor.selectedRange().location == 2
            press("5"); try? await Task.sleep(for: .milliseconds(150))
            let cancelled = editor.string == original && editor.selectedRange().location == 2 && !document.editing
            if let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"], let image = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                host.cacheDisplay(in: host.bounds, to: image)
                try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent("cue-document-native.png"))
            }
            let passed = preview && undone && before && cancelled
            let report = "preview=\(preview) undone=\(undone) before=\(before) cancelled=\(cancelled) passed=\(passed)"
            try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}
