import SwiftUI

// WIP: MetalCombobox is a placeholder that keeps the React API's shape (items, a selection, a
// prompt). It filters a system List under a TextField, not yet the field well, the menu plate, the
// settling fit or the gliding highlight from combobox.agent.md. Web is the reference.

/// Type to find one of many. Work in progress: see combobox.agent.md.
public struct MetalCombobox: View {
    private let items: [String]
    private let prompt: String
    @Binding private var selection: String?
    @State private var query = ""

    public init(_ prompt: String, items: [String], selection: Binding<String?>) {
        self.prompt = prompt
        self.items = items
        self._selection = selection
    }

    public var body: some View {
        VStack(alignment: .leading) {
            HStack {
                TextField(prompt, text: $query)
                if selection != nil {
                    Button { selection = nil; query = "" } label: {
                        MetalIcon(.close, size: MetalRecipes.combobox.points("clear.glyph"))
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Clear")
                }
            }
            if !query.isEmpty {
                ForEach(items.filter { $0.localizedCaseInsensitiveContains(query) }, id: \.self) { item in
                    Button(item) { selection = item; query = item }.buttonStyle(.plain)
                }
            }
        }
    }
}
