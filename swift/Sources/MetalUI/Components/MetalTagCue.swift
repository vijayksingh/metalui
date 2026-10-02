import SwiftUI

private func recentTags(_ tags: [String]) -> [String] {
    var seen = Set<String>()
    return tags.filter { tag in
        guard tag.hasPrefix("#"), tag.count > 1,
              tag.dropFirst().allSatisfy({ $0.isLetter || $0.isNumber || $0 == "_" || $0 == "-" }) else { return false }
        return seen.insert(tag).inserted
    }
}
/// Recent source tags share the existing finite control and canonical identity tab.
@MainActor public struct MetalTagCue: View {
    private let value: String, label: String
    private let tags: [String]
    private let readOnly: Bool, raw: Bool, hint: Bool
    private let editing: Bool?
    private let onBegin: () -> Bool, onChange: (String) -> Void, onCommit: () -> Void
    private let onCancel: (() -> Void)?
    public init(_ value: String, recentTags tags: [String], label: String, readOnly: Bool = false, raw: Bool = false, hint: Bool = true, editing: Bool? = nil,
                onBegin: @escaping () -> Bool = { true }, onChange: @escaping (String) -> Void,
                onCommit: @escaping () -> Void = {}, onCancel: (() -> Void)? = nil) {
        self.value = value; self.label = label; self.tags = recentTags(tags.contains(value) ? tags : [value] + tags)
        self.readOnly = readOnly; self.raw = raw; self.hint = hint; self.editing = editing
        self.onBegin = onBegin; self.onChange = onChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    public var body: some View {
        MetalEnumCue(value, choices: tags.map { .init($0, tint: MetalCue.tagColor($0)) }, label: label,
                     readOnly: readOnly, raw: raw, editing: editing, hint: hint, onBegin: onBegin, onChange: onChange, onCommit: onCommit, onCancel: onCancel)
    }
}
/// Search does not edit source; only a chosen, exact recent word reaches the host.
@MainActor public struct MetalTagCuePicker: View {
    private let tags: [String], label: String
    private let onChoose: (String) -> Void
    @State private var query = ""
    @State private var highlight = 0
    @FocusState private var focused: Bool
    @Environment(\.isEnabled) private var enabled
    @Environment(\.metalColorway) private var colorway
    public init(_ label: String, recentTags tags: [String], onChoose: @escaping (String) -> Void) {
        self.label = label; self.tags = recentTags(tags); self.onChoose = onChoose
    }
    private var filtered: [String] { query.isEmpty ? tags : tags.filter { $0.localizedCaseInsensitiveContains(query) } }
    private func choose() { if enabled, filtered.indices.contains(highlight) { onChoose(filtered[highlight]) } }
    public var body: some View {
        let pad = MetalRecipes.field.points("regular.pad-left")
        VStack(alignment: .leading, spacing: MetalSpace.s8) {
            MetalWell(.field) {
                TextField("Find a recent tag", text: $query).textFieldStyle(.plain)
                    .font(.metal(MetalType.ui)).padding(.horizontal, pad)
                    .frame(height: MetalRecipes.field.points("regular.height"))
                    .focused($focused).accessibilityLabel(label)
                    .accessibilityValue(filtered.indices.contains(highlight) ? "\(query), \(filtered[highlight])" : "\(query), No recent tags")
                    .onSubmit(choose)
                    .onKeyPress(keys: [.upArrow, .downArrow]) { key in
                        guard enabled, !filtered.isEmpty else { return .ignored }
                        highlight = min(filtered.count - 1, max(0, highlight + (key.key == .upArrow ? -1 : 1)))
                        return .handled
                    }
            }
            if filtered.isEmpty { Text("No recent tags").font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink2.color) }
            ForEach(Array(filtered.enumerated()), id: \.element) { index, tag in
                Button { if enabled { onChoose(tag) } } label: { MetalCueTag(tag).frame(maxWidth: .infinity, alignment: .leading).frame(height: MetalRecipes.menu.points("row.height")) }
                    .buttonStyle(.plain).accessibilityLabel(tag)
                    .accessibilityHint(index == highlight ? "Current choice" : "Recent tag")
            }
        }.onAppear { focused = true }.onChange(of: query) { _, _ in highlight = 0 }
    }
}
