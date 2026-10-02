import SwiftUI
import MetalUI

/// An inline attachment operation using the existing field, key, chip and waiting recipes.
@MainActor
public struct MetalTagExample: View {
    @Binding private var tags: [String]
    private let onAttach: (String) async throws -> Void
    @State private var draft = ""
    @State private var pending = false
    @State private var state: MetalButtonState = .idle
    @State private var failure: String?
    @State private var request: Task<Void, Never>?
    @State private var result: Task<Void, Never>?
    @State private var deck = MetalToastDeck()
    @FocusState private var focused: Bool
    @Environment(\.metalColorway) private var colorway
    public init(tags: Binding<[String]>, onAttach: @escaping (String) async throws -> Void) { _tags = tags; self.onAttach = onAttach }
    private var value: String {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        return text.hasPrefix("#") ? String(text.dropFirst()) : text
    }
    private var validation: String? {
        pending ? nil : value.count > 32 ? "Use 32 characters or fewer." : tags.contains(where: { $0.localizedLowercase == value.localizedLowercase }) ? "This tag is already attached." : nil
    }
    public var body: some View {
        MetalWaitingPresentation(state: state) { phase, _ in
            VStack(alignment: .leading, spacing: MetalSpace.s12) {
                HStack(spacing: MetalSpace.s8) { ForEach(tags, id: \.self) { tag in MetalChip(.tag) { Text("#\(tag)") } } }.accessibilityLabel("Attached tags")
                Text("Tag").metalType(MetalType.ui).foregroundStyle(colorway.tokens.ink.color)
                field
                if let validation { Text(validation).metalType(MetalType.meta).foregroundStyle(colorway.tokens.invalid.color) }
                HStack(spacing: MetalSpace.s8) {
                    MetalButton("Tag", size: .compact, state: state, waitingLabel: "Tagging…", doneLabel: "Tagged", errorLabel: "Try again", action: submit) {
                        MetalMorphIcon(phase == .done ? .check : phase == .error ? .syncError : .tag)
                    }.disabled(phase == .idle && (value.isEmpty || validation != nil)).keyboardShortcut(.defaultAction)
                    MetalButton("Cancel", size: .compact, action: cancel).disabled(pending || draft.isEmpty)
                }
                if let failure { Text(failure).metalType(MetalType.meta).foregroundStyle(colorway.tokens.invalid.color) }
                MetalToastDeckView(deck)
            }
            .frame(maxWidth: MetalRecipes.dialog.points("self.width"))
            .onChange(of: phase) { _, next in
                guard next == .done else { return }
                result?.cancel(); result = Task { @MainActor in
                    do { try await Task.sleep(for: .seconds(MetalSpringClass.settle.spring.duration + MetalWaiting.minimumVisible)) } catch { return }
                    guard !Task.isCancelled else { return }; pending = false; state = .idle; draft = ""
                }
            }
        }
        .onChange(of: draft) { _, _ in if !pending { state = .idle; failure = nil } }
        .onDisappear { request?.cancel(); result?.cancel() }
        #if os(macOS)
        .onExitCommand(perform: cancel)
        #endif
    }
    private var field: some View {
        let recipe = MetalRecipes.field
        let shape = RoundedRectangle(cornerRadius: recipe.points("compact.radius"), style: .continuous)
        return MetalWell(.field, radius: recipe.points("compact.radius")) {
            TextField("Add a tag", text: $draft).textFieldStyle(.plain).font(.metal(MetalType.ui)).foregroundStyle(colorway.tokens.ink.color)
                .focused($focused).onSubmit(submit).accessibilityLabel("Tag")
                .padding(.leading, recipe.points("compact.pad-left")).padding(.trailing, recipe.points("compact.pad-right")).frame(height: recipe.points("compact.height"))
        }.overlay {
            if validation != nil || failure != nil { shape.strokeBorder(colorway.tokens.invalid.color, lineWidth: MetalRing.invalidWidth) }
            else if focused && !pending { shape.strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) }
        }.disabled(pending).opacity(pending ? recipe.scalar("state.disabled") : Double.one)
    }
    private func cancel() { guard !pending else { return }; draft = ""; failure = nil; state = .idle; focused = true }
    private func submit() {
        guard !pending, !value.isEmpty, validation == nil else { return }
        let next = value, original = tags
        pending = true; failure = nil; state = .waiting
        request = Task { @MainActor in
            do {
                try await onAttach(next); guard !Task.isCancelled else { return }
                tags = original + [next]; state = .done
                deck.show(MetalToastModel("Tagged #\(next)", undo: { tags = original }))
            } catch { guard !Task.isCancelled else { return }; failure = error.localizedDescription; state = .error; pending = false }
        }
    }
}
