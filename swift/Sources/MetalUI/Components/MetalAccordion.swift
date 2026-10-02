import SwiftUI

// WIP: MetalAccordion is a placeholder that keeps the React API's shape (a title and content per
// section, an expanded binding). It uses the system DisclosureGroup, not yet the row headers, rules,
// or the settle/release panel motion from accordion.agent.md. Web is the reference.

/// A section that opens in place. Work in progress: see accordion.agent.md.
public struct MetalAccordion<Content: View>: View {
    private let title: String
    @Binding private var expanded: Bool
    private let content: Content

    public init(_ title: String, expanded: Binding<Bool>, @ViewBuilder content: () -> Content) {
        self.title = title
        self._expanded = expanded
        self.content = content()
    }

    public var body: some View {
        DisclosureGroup(title, isExpanded: $expanded) { content }
            .disclosureGroupStyle(MetalAccordionDisclosureStyle(title: title))
    }
}

/// A state indicator from the shared icon set. Panel material parity remains WIP above.
private struct MetalAccordionDisclosureStyle: DisclosureGroupStyle {
    let title: String
    @Environment(\.metalColorway) private var colorway

    func makeBody(configuration: Configuration) -> some View {
        VStack(alignment: .leading) {
            Button { configuration.isExpanded.toggle() } label: {
                HStack {
                    configuration.label
                    Spacer()
                    MetalIcon(.chevron, size: MetalRecipes.accordion.points("chevron.size"))
                        .rotationEffect(.degrees(configuration.isExpanded ? 0 : -90))
                        .foregroundColor(colorway.tokens.ink2.color)
                        .metalAnimation(.settle, value: configuration.isExpanded)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(title)
            .accessibilityValue(configuration.isExpanded ? "Expanded" : "Collapsed")
            if configuration.isExpanded { configuration.content }
        }
    }
}
