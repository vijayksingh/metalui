import SwiftUI
import MetalUI

/// A small post operation. The host owns the stored comments and its async persistence.
@MainActor
public struct MetalCommentExample: View {
    @Binding private var comments: [String]
    private let onPost: (String) async throws -> Void
    @State private var editing: Bool
    @State private var draft = ""
    @State private var pending = false
    @State private var state: MetalButtonState = .idle
    @State private var failure: String?
    @State private var request: Task<Void, Never>?
    @State private var result: Task<Void, Never>?
    @State private var deck = MetalToastDeck()
    @Environment(\.metalColorway) private var colorway
    public init(comments: Binding<[String]>, initiallyEditing: Bool = false, onPost: @escaping (String) async throws -> Void) {
        _comments = comments; self.onPost = onPost; _editing = State(initialValue: initiallyEditing)
    }
    private var value: String { draft.trimmingCharacters(in: .whitespacesAndNewlines) }
    public var body: some View {
        MetalWaitingPresentation(state: state) { phase, _ in
            VStack(alignment: .leading, spacing: MetalSpace.s12) {
                if editing {
                    MetalFormField("Comment text") { MetalTextarea("Write a comment", text: $draft, minRows: 2, limit: 280, invalid: failure != nil) }.disabled(pending)
                    HStack(spacing: MetalSpace.s8) {
                        MetalButton("Comment", size: .compact, state: state, waitingLabel: "Posting…", doneLabel: "Posted", errorLabel: "Try again", action: submit) {
                            MetalMorphIcon(phase == .done ? .check : phase == .error ? .syncError : .note)
                        }.disabled(phase == .idle && value.isEmpty).keyboardShortcut(.return, modifiers: .command)
                        MetalButton("Cancel", size: .compact, action: cancel).disabled(pending)
                    }
                    if let failure { Text(failure).metalType(MetalType.meta).foregroundStyle(colorway.tokens.invalid.color) }
                } else if comments.isEmpty {
                    MetalEmptyState("No comments") { MetalButton("Comment", icon: .note, size: .compact, action: { editing = true }) }
                } else {
                    ForEach(Array(comments.enumerated()), id: \.offset) { _, comment in Text(comment).metalType(MetalType.content).foregroundStyle(colorway.tokens.ink.color) }
                    MetalButton("Comment", icon: .note, size: .compact, action: { editing = true })
                }
                MetalToastDeckView(deck)
            }
            .frame(maxWidth: MetalRecipes.dialog.points("self.width"))
            .onChange(of: phase) { _, next in
                guard next == .done else { return }
                result?.cancel(); result = Task { @MainActor in
                    do { try await Task.sleep(for: .seconds(MetalSpringClass.settle.spring.duration + MetalWaiting.minimumVisible)) } catch { return }
                    guard !Task.isCancelled else { return }; pending = false; editing = false; state = .idle; draft = ""
                }
            }
        }
        .onChange(of: draft) { _, _ in if !pending { state = .idle; failure = nil } }
        .onDisappear { request?.cancel(); result?.cancel() }
        #if os(macOS)
        .onExitCommand(perform: cancel)
        #endif
    }
    private func cancel() { guard !pending else { return }; draft = ""; state = .idle; failure = nil; editing = false }
    private func submit() {
        guard !pending, !value.isEmpty else { return }
        let next = value, original = comments
        pending = true; failure = nil; state = .waiting
        request = Task { @MainActor in
            do {
                try await onPost(next); guard !Task.isCancelled else { return }
                comments = original + [next]; state = .done
                deck.show(MetalToastModel("Comment posted", undo: { comments = original }))
            } catch { guard !Task.isCancelled else { return }; failure = error.localizedDescription; state = .error; pending = false }
        }
    }
}
