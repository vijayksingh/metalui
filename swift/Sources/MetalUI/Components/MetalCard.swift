import SwiftUI

// WIP: MetalCard is a placeholder that keeps the React API's shape (title, description, content). It
// stacks them on a rounded fill, not yet the raised surface, the media bleed, the hover lift or the
// selected ring from card.agent.md. Web is the reference.

/// Use a separate `MetalButton("Share", icon: .share, size: .compact, action: share)`
/// in the content slot for a Share action; selection choices keep their plain word.
/// A person's thing on a plate. Work in progress: see card.agent.md.
public struct MetalCard<Content: View>: View {
    private let title: String
    private let description: String?
    private let content: Content

    public init(_ title: String, description: String? = nil, @ViewBuilder content: () -> Content = { EmptyView() }) {
        self.title = title
        self.description = description
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: MetalRecipes.card.points("self.gap")) {
            Text(title).font(.headline)
            if let description { Text(description).foregroundStyle(.secondary) }
            content
        }
        .padding(MetalRecipes.card.points("self.pad"))
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background, in: RoundedRectangle(cornerRadius: MetalRecipes.surface.points("radius.card"), style: .continuous))
    }
}
