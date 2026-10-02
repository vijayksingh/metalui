import SwiftUI
import MetalUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// The example's real source editor. Its local document owns Undo; no global keyboard listener.
@MainActor
struct MetalProvenanceSourceEditor: View {
    @ObservedObject var document: MetalCueDocument
    var onTyping: () -> Void = {}
    var body: some View {
        MetalWell(.field) {
            MetalProvenanceTextEditor(document: document, onTyping: onTyping)
                .padding(MetalSpace.s12)
        }.accessibilityLabel("Provenance document source")
    }
}
#if os(macOS)
@MainActor
private struct MetalProvenanceTextEditor: NSViewRepresentable {
    @ObservedObject var document: MetalCueDocument
    let onTyping: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(document, onTyping: onTyping) }
    func makeNSView(context: Context) -> NSScrollView {
        let scroll = NSScrollView(), text = MetalProvenanceTextView()
        text.document = document; text.isRichText = false; text.allowsUndo = false
        text.drawsBackground = false; scroll.drawsBackground = false
        text.delegate = context.coordinator; text.string = document.source
        text.font = MetalFonts.ctFont(MetalType.content, size: MetalType.content.size) as NSFont
        text.isVerticallyResizable = true; text.isHorizontallyResizable = false
        text.autoresizingMask = .width
        text.textContainer?.widthTracksTextView = true
        text.setAccessibilityLabel("Provenance document source")
        scroll.documentView = text; return scroll
    }
    func sizeThatFits(_ proposal: ProposedViewSize, nsView scroll: NSScrollView, context: Context) -> CGSize? {
        guard let width = proposal.width, let text = scroll.documentView as? NSTextView else { return nil }
        let inset = text.textContainerInset
        let padding = text.textContainer?.lineFragmentPadding ?? .zero
        let words = NSAttributedString(string: document.source, attributes: [.font: MetalFonts.ctFont(MetalType.content, size: MetalType.content.size)])
        let measured = words.boundingRect(with: NSSize(width: max(1, width - inset.width * 2 - padding * 2), height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading])
        return CGSize(width: width, height: max(MetalType.content.line * 3, ceil(measured.height) + inset.height * 2))
    }
    func updateNSView(_ scroll: NSScrollView, context: Context) {
        guard let text = scroll.documentView as? NSTextView else { return }
        context.coordinator.document = document; context.coordinator.onTyping = onTyping
        context.coordinator.updating = true
        (text as? MetalProvenanceTextView)?.document = document
        if !text.string.utf16.elementsEqual(document.source.utf16) { text.string = document.source }
        if text.window?.firstResponder === text {
            text.setSelectedRange(NSRange(location: document.selection.start, length: document.selection.end - document.selection.start))
        }
        context.coordinator.updating = false
    }
    final class Coordinator: NSObject, NSTextViewDelegate {
        var document: MetalCueDocument; var onTyping: () -> Void; var updating = false
        var beforeTyping: MetalCueSelection?
        init(_ document: MetalCueDocument, onTyping: @escaping () -> Void) { self.document = document; self.onTyping = onTyping }
        func textView(_ text: NSTextView, shouldChangeTextIn affectedCharRange: NSRange, replacementString: String?) -> Bool {
            if !updating { let range = text.selectedRange(); beforeTyping = .init(start: range.location, end: range.location + range.length) }
            return true
        }
        func textDidChange(_ notification: Notification) {
            guard !updating, let text = notification.object as? NSTextView else { return }
            let range = text.selectedRange()
            if let beforeTyping { document.setSelection(beforeTyping); self.beforeTyping = nil }
            document.setSource(text.string, selection: .init(start: range.location, end: range.location + range.length)); onTyping()
        }
        func textDidEndEditing(_ notification: Notification) { if !updating { document.commit() } }
        func textViewDidChangeSelection(_ notification: Notification) {
            guard !updating, let text = notification.object as? NSTextView, text.window?.firstResponder === text else { return }
            let range = text.selectedRange()
            document.setSelection(.init(start: range.location, end: range.location + range.length))
        }
    }
}
@MainActor
private final class MetalProvenanceTextView: NSTextView {
    var document: MetalCueDocument?
    override func keyDown(with event: NSEvent) {
        if event.modifierFlags.contains(.command), event.charactersIgnoringModifiers?.lowercased() == "z" {
            if event.modifierFlags.contains(.shift) { document?.redo() } else { document?.undo() }; return
        }
        super.keyDown(with: event)
    }
}
#else
@MainActor
private struct MetalProvenanceTextEditor: UIViewRepresentable {
    @ObservedObject var document: MetalCueDocument
    let onTyping: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(document, onTyping: onTyping) }
    func makeUIView(context: Context) -> UITextView {
        let text = MetalProvenanceTextView()
        text.document = document; text.backgroundColor = .clear
        text.font = MetalFonts.ctFont(MetalType.content, size: MetalType.content.size) as UIFont
        text.delegate = context.coordinator; text.text = document.source
        text.accessibilityLabel = "Provenance document source"; return text
    }
    func sizeThatFits(_ proposal: ProposedViewSize, uiView text: UITextView, context: Context) -> CGSize? {
        guard let width = proposal.width else { return nil }
        let height = text.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude)).height
        return CGSize(width: width, height: max(MetalType.content.line * 3, height))
    }
    func updateUIView(_ text: UITextView, context: Context) {
        context.coordinator.document = document; context.coordinator.onTyping = onTyping
        context.coordinator.updating = true
        (text as? MetalProvenanceTextView)?.document = document
        if !(text.text ?? "").utf16.elementsEqual(document.source.utf16) { text.text = document.source }
        if text.isFirstResponder { text.selectedRange = NSRange(location: document.selection.start, length: document.selection.end - document.selection.start) }
        context.coordinator.updating = false
    }
    final class Coordinator: NSObject, UITextViewDelegate {
        var document: MetalCueDocument; var onTyping: () -> Void; var updating = false
        var beforeTyping: MetalCueSelection?
        init(_ document: MetalCueDocument, onTyping: @escaping () -> Void) { self.document = document; self.onTyping = onTyping }
        func textView(_ text: UITextView, shouldChangeTextIn range: NSRange, replacementText: String) -> Bool {
            if !updating { beforeTyping = .init(start: text.selectedRange.location, end: NSMaxRange(text.selectedRange)) }
            return true
        }
        func textViewDidChange(_ text: UITextView) {
            guard !updating else { return }
            if let beforeTyping { document.setSelection(beforeTyping); self.beforeTyping = nil }
            document.setSource(text.text, selection: .init(start: text.selectedRange.location, end: NSMaxRange(text.selectedRange))); onTyping()
        }
        func textViewDidEndEditing(_ text: UITextView) { if !updating { document.commit() } }
        func textViewDidChangeSelection(_ text: UITextView) {
            guard !updating, text.isFirstResponder else { return }
            document.setSelection(.init(start: text.selectedRange.location, end: NSMaxRange(text.selectedRange)))
        }
    }
}
@MainActor
private final class MetalProvenanceTextView: UITextView {
    var document: MetalCueDocument?
    override var keyCommands: [UIKeyCommand]? {
        let inherited = (super.keyCommands ?? []).filter { command in
            !(command.input?.lowercased() == "z" && (command.modifierFlags == .command || command.modifierFlags == [.command, .shift]))
        }
        return inherited + [UIKeyCommand(input: "z", modifierFlags: .command, action: #selector(undoSource)),
                            UIKeyCommand(input: "z", modifierFlags: [.command, .shift], action: #selector(redoSource))]
    }
    @objc private func undoSource() { document?.undo() }
    @objc private func redoSource() { document?.redo() }
}
#endif
