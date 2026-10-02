import SwiftUI
import MetalUI

/// A document snapshot, owned by this example host rather than by a library form framework.
public struct MetalRegionEdit: Equatable, Sendable {
    public var name = ""
    public var notes = ""
    public var city: String?
    public var copies = 1
    public var format = "pdf"
    public var include: Set<String> = ["notes"]
    public init(name: String = "") { self.name = name }
}

/// The executable native host shown with FormField docs. Storage and its failure belong to its caller.
@MainActor
public struct MetalSaveRegionExample: View {
    @Binding private var saved: MetalRegionEdit?
    private let onSave: (MetalRegionEdit) async throws -> Void
    @State private var draft = MetalRegionEdit()
    @State private var state: MetalButtonState = .idle
    @State private var pending = false
    @State private var tried = false
    @State private var failure: String?
    @State private var request: Task<Void, Never>?
    @State private var result: Task<Void, Never>?
    @State private var deck = MetalToastDeck()
    @FocusState private var nameFocused: Bool
    @Environment(\.metalColorway) private var colorway

    public init(saved: Binding<MetalRegionEdit?>, onSave: @escaping (MetalRegionEdit) async throws -> Void) {
        _saved = saved; self.onSave = onSave
    }
    private var validation: String? {
        let name = draft.name.trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? "Give the region a name." : name.count < 3 ? "Use at least 3 letters." : nil
    }
    public var body: some View {
        MetalWaitingPresentation(state: state) { phase, _ in
            VStack(alignment: .leading, spacing: MetalRecipes.formField.points("self.form-gap")) {
                VStack(alignment: .leading, spacing: MetalRecipes.formField.points("self.gap")) {
                    Text("Region name").metalType(MetalType.ui).foregroundStyle(colorway.tokens.ink.color)
                    nameField
                    Text("Shown on its edge and in search.").metalType(MetalType.meta).foregroundStyle(colorway.tokens.ink3.color)
                    if tried, let validation { Text(validation).metalType(MetalType.meta).foregroundStyle(colorway.tokens.invalid.color) }
                }
                MetalFormField("Notes") { MetalTextarea("Notes", text: $draft.notes, minRows: 2, limit: 140) }.disabled(pending)
                MetalFormField("City") { MetalCombobox("Choose a city", items: ["Amsterdam", "Berlin", "Lisbon", "Paris", "Porto", "Rome", "Vienna"], selection: $draft.city) }.disabled(pending)
                MetalFormField("Copies") { MetalNumberField("Copies", value: $draft.copies, in: 1...9) }.disabled(pending)
                MetalFormField("Export as") {
                    MetalRadioGroup(selection: $draft.format, axis: .horizontal, options: [.init("png", "PNG"), .init("pdf", "PDF")])
                }.disabled(pending)
                MetalFormField("Include") {
                    MetalCheckboxGroup(options: [("notes", "Notes"), ("photos", "Photos")], selection: $draft.include)
                }.disabled(pending)
                MetalButton("Save region", cap: .primary, state: state, waitingLabel: "Saving…", doneLabel: "Saved", errorLabel: "Try again", action: submit) {
                    MetalMorphIcon(phase == .done ? .check : phase == .error ? .syncError : .region)
                }.keyboardShortcut(.defaultAction)
                if let failure { Text(failure).metalType(MetalType.meta).foregroundStyle(colorway.tokens.invalid.color) }
                Text(saved.map { "Stored: \($0.name)" } ?? "No saved region.").metalType(MetalType.meta).foregroundStyle(colorway.tokens.ink2.color)
                MetalToastDeckView(deck)
            }
            .frame(maxWidth: MetalRecipes.dialog.points("self.width"))
            .onChange(of: phase) { _, next in
                guard next == .done else { return }
                result?.cancel()
                result = Task { @MainActor in
                    do { try await Task.sleep(for: .seconds(MetalSpringClass.settle.spring.duration + MetalWaiting.minimumVisible)) } catch { return }
                    guard !Task.isCancelled else { return }; pending = false
                }
            }
        }
        .onChange(of: draft) { _, _ in if !pending { state = .idle; failure = nil } }
        .onDisappear { request?.cancel(); result?.cancel() }
    }
    private var nameField: some View {
        let recipe = MetalRecipes.field
        let shape = RoundedRectangle(cornerRadius: recipe.points("regular.radius"), style: .continuous)
        return MetalWell(.field, radius: recipe.points("regular.radius")) {
            TextField("Trip to Lisbon", text: $draft.name)
                .textFieldStyle(.plain).font(.metal(MetalType.ui)).foregroundStyle(colorway.tokens.ink.color)
                .focused($nameFocused).onSubmit(submit).accessibilityLabel("Region name")
                .accessibilityHint(tried ? validation ?? "Shown on its edge and in search." : "Shown on its edge and in search.")
                .padding(.leading, recipe.points("regular.pad-left")).padding(.trailing, recipe.points("regular.pad-right"))
                .frame(height: recipe.points("regular.height"))
        }
        .overlay {
            if tried && validation != nil { shape.strokeBorder(colorway.tokens.invalid.color, lineWidth: MetalRing.invalidWidth) }
            else if nameFocused && !pending { shape.strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) }
        }
        .disabled(pending).opacity(pending ? recipe.scalar("state.disabled") : Double.one)
    }
    private func submit() {
        guard !pending else { return }
        tried = true
        guard validation == nil else { nameFocused = true; return }
        var next = draft; next.name = next.name.trimmingCharacters(in: .whitespacesAndNewlines)
        let original = saved
        pending = true; failure = nil; state = .waiting
        request = Task { @MainActor in
            do {
                try await onSave(next)
                guard !Task.isCancelled else { return }
                saved = next; state = .done
                deck.show(MetalToastModel("Saved region \(next.name)", undo: { saved = original; state = .idle }))
            } catch {
                guard !Task.isCancelled else { return }
                failure = error.localizedDescription; state = .error; pending = false
            }
        }
    }
}
