import SwiftUI
#if os(macOS)
import AppKit
#elseif canImport(UIKit)
import UIKit
#endif

/// Text and one rename operation. The host owns persistence, validation, dismissal and Undo.
/// Remount for another session; `onRenamed` receives the original captured before the request.
public struct MetalRenameEditor: View {
    @State private var original: String
    private let file: Bool
    private let label: String
    private let validate: (String) -> String?
    private let onRename: (String) async throws -> Void
    private let onRenamed: (String, String) -> Void
    private let onDone: () -> Void
    private let onCancel: () -> Void
    private let onPendingChange: (Bool) -> Void
    @State private var draft: String
    @State private var state: MetalButtonState = .idle
    @State private var failure: String?
    @State private var focused = false
    @State private var request: Task<Void, Never>?
    @State private var result: Task<Void, Never>?
    @Environment(\.metalColorway) private var colorway

    public init(_ value: String, file: Bool = false, label: String = "Name",
                validate: @escaping (String) -> String? = { _ in nil },
                onRename: @escaping (String) async throws -> Void,
                onRenamed: @escaping (String, String) -> Void = { _, _ in },
                onDone: @escaping () -> Void = {}, onCancel: @escaping () -> Void,
                onPendingChange: @escaping (Bool) -> Void = { _ in }) {
        _original = State(initialValue: value); self.file = file; self.label = label; self.validate = validate
        self.onRename = onRename; self.onRenamed = onRenamed; self.onDone = onDone
        self.onCancel = onCancel; self.onPendingChange = onPendingChange
        _draft = State(initialValue: value)
    }
    private var name: String { draft.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var validation: String? { name.isEmpty ? nil : validate(name) }
    private var error: String? { validation ?? failure }
    private var locked: Bool { state == .waiting || state == .done }
    private var canSubmit: Bool { !locked && !name.isEmpty && name != original.trimmingCharacters(in: .whitespacesAndNewlines) && validation == nil }

    public var body: some View {
        let field = MetalRecipes.field
        let shape = RoundedRectangle(cornerRadius: field.points("regular.radius"), style: .continuous)
        VStack(alignment: .leading, spacing: MetalLayout.gapRelated) {
            VStack(alignment: .leading, spacing: MetalRecipes.formField.points("self.gap")) {
                Text(label).metalType(MetalType.ui).foregroundStyle(colorway.tokens.ink.color)
                MetalWell(.field, radius: field.points("regular.radius")) {
                    MetalRenameInput(text: $draft, original: original, file: file, label: label,
                        enabled: !locked, ink: colorway.tokens.ink.color, error: error, focused: $focused,
                        submit: submit, cancel: { if !locked { onCancel() } })
                        .padding(.leading, field.points("regular.pad-left"))
                        .padding(.trailing, field.points("regular.pad-right"))
                        .frame(height: field.points("regular.height"))
                }
                .overlay {
                    if error != nil { shape.strokeBorder(colorway.tokens.invalid.color, lineWidth: MetalRing.invalidWidth) }
                    else if focused && !locked { shape.strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) }
                }
                .opacity(locked ? field.scalar("state.disabled") : Double.one)
                if let error {
                    Text(error).metalType(MetalType.meta)
                        .foregroundStyle((MetalRecipes.formField.color("error.ink", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.invalid).color)
                        .accessibilityAddTraits(.updatesFrequently)
                }
            }
            HStack(spacing: MetalLayout.gapRelated) {
                Spacer(minLength: .zero)
                MetalButton("Cancel", action: onCancel).disabled(locked)
                MetalButton("Rename", cap: .primary, state: state, waitingLabel: "Renaming…", doneLabel: "Renamed", errorLabel: "Try again", action: submit) {
                    MetalRenameGlyph(onResult: finish)
                }.disabled(!canSubmit && !locked)
            }
        }
        .onChange(of: draft) { _, _ in if !locked { failure = nil; state = .idle } }
        .onDisappear { request?.cancel(); result?.cancel(); onPendingChange(false) }
    }
    private func submit() {
        guard canSubmit else { return }
        let captured = name, before = original
        state = .waiting; failure = nil; onPendingChange(true)
        request = Task { @MainActor in
            do {
                try await onRename(captured)
                guard !Task.isCancelled else { return }
                state = .done; onRenamed(captured, before)
            } catch {
                guard !Task.isCancelled else { return }
                failure = error.localizedDescription; state = .error; onPendingChange(false)
            }
        }
    }
    private func finish() {
        guard result == nil else { return }
        result = Task { @MainActor in
            do { try await Task.sleep(for: .seconds(MetalSpringClass.settle.spring.duration + MetalWaiting.minimumVisible)) } catch { return }
            guard !Task.isCancelled else { return }
            onPendingChange(false); onDone()
        }
    }
}

private struct MetalRenameGlyph: View {
    @Environment(\.metalButtonFace) private var face
    let onResult: () -> Void
    var body: some View {
        MetalMorphIcon(face == .done ? .check : face == .error ? .syncError : .pen,
                       size: MetalRecipes.button.points("self.glyph"))
            .onChange(of: face) { _, face in if face == .done { onResult() } }
    }
}

#if os(macOS)
private final class MetalRenameTextField: NSTextField {
    var initialRange: NSRange?
    var gainedFocus: (() -> Void)?
    override func becomeFirstResponder() -> Bool {
        let accepted = super.becomeFirstResponder()
        if accepted {
            gainedFocus?()
            if let range = initialRange {
                initialRange = nil
                DispatchQueue.main.async { [weak self] in self?.currentEditor()?.selectedRange = range }
            }
        }
        return accepted
    }
}
private struct MetalRenameInput: NSViewRepresentable {
    @Binding var text: String
    let original: String
    let file: Bool
    let label: String
    let enabled: Bool
    let ink: Color
    let error: String?
    @Binding var focused: Bool
    let submit: () -> Void
    let cancel: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeNSView(context: Context) -> NSTextField {
        let input = MetalRenameTextField(string: text)
        let source = original as NSString, dot = source.range(of: ".", options: .backwards).location
        let end = file && dot != NSNotFound && dot > 0 && dot < source.length - 1 ? dot : source.length
        input.initialRange = NSRange(location: 0, length: end)
        input.gainedFocus = { context.coordinator.owner.focused = true }
        input.isBezeled = false; input.drawsBackground = false; input.focusRingType = .none
        input.usesSingleLineMode = true; input.lineBreakMode = .byClipping
        input.font = MetalFonts.ctFont(MetalType.ui, size: MetalType.ui.size) as NSFont
        input.setAccessibilityLabel(label); input.delegate = context.coordinator
        DispatchQueue.main.async { if input.window?.firstResponder !== input.currentEditor() { input.window?.makeFirstResponder(input) } }
        return input
    }
    func updateNSView(_ input: NSTextField, context: Context) {
        context.coordinator.owner = self
        if input.stringValue != text { input.stringValue = text }
        input.textColor = NSColor(ink); input.setAccessibilityHelp(error); input.isEnabled = enabled
        input.isEditable = enabled; input.isSelectable = enabled
    }
    final class Coordinator: NSObject, NSTextFieldDelegate {
        var owner: MetalRenameInput
        init(_ owner: MetalRenameInput) { self.owner = owner }
        func controlTextDidChange(_ notification: Notification) { if let input = notification.object as? NSTextField { owner.text = input.stringValue } }
        func controlTextDidEndEditing(_ notification: Notification) { owner.focused = false }
        func control(_ control: NSControl, textView: NSTextView, doCommandBy command: Selector) -> Bool {
            if command == #selector(NSResponder.insertNewline(_:)) { owner.submit(); return true }
            if command == #selector(NSResponder.cancelOperation(_:)) { owner.cancel(); return true }
            return false
        }
    }
}
#elseif canImport(UIKit)
private struct MetalRenameInput: UIViewRepresentable {
    @Binding var text: String
    let original: String
    let file: Bool
    let label: String
    let enabled: Bool
    let ink: Color
    let error: String?
    @Binding var focused: Bool
    let submit: () -> Void
    let cancel: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeUIView(context: Context) -> UITextField {
        let input = UITextField()
        input.text = text; input.borderStyle = .none; input.accessibilityLabel = label
        input.font = MetalFonts.ctFont(MetalType.ui, size: MetalType.ui.size) as UIFont
        input.delegate = context.coordinator
        input.addTarget(context.coordinator, action: #selector(Coordinator.changed(_:)), for: .editingChanged)
        DispatchQueue.main.async { input.becomeFirstResponder() }
        return input
    }
    func updateUIView(_ input: UITextField, context: Context) {
        context.coordinator.owner = self
        if input.text != text { input.text = text }
        input.textColor = UIColor(ink); input.accessibilityHint = error; input.isEnabled = enabled
    }
    final class Coordinator: NSObject, UITextFieldDelegate {
        var owner: MetalRenameInput
        var selected = false
        init(_ owner: MetalRenameInput) { self.owner = owner }
        @objc func changed(_ input: UITextField) { owner.text = input.text ?? "" }
        func textFieldDidBeginEditing(_ input: UITextField) {
            owner.focused = true
            guard !selected else { return }; selected = true
            let source = owner.original as NSString, dot = source.range(of: ".", options: .backwards).location
            let end = owner.file && dot != NSNotFound && dot > 0 && dot < source.length - 1 ? dot : source.length
            if let position = input.position(from: input.beginningOfDocument, offset: end) { input.selectedTextRange = input.textRange(from: input.beginningOfDocument, to: position) }
        }
        func textFieldDidEndEditing(_ input: UITextField) { owner.focused = false }
        func textFieldShouldReturn(_ input: UITextField) -> Bool { owner.submit(); return false }
    }
}
#endif
