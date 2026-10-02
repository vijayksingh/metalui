import SwiftUI

// WIP: MetalNavigationMenu is a placeholder that keeps the React API's shape (sections with links).
// It shows system Menus in an HStack, not yet the frosted plate that slides and resizes between keys
// from navigation-menu.agent.md. Web is the reference. This container draws no internal
// glyphs; custom section content uses MetalIcon(.chevron), sized by navigationMenu chevron.size.

/// A site's sections with their links. Work in progress: see navigation-menu.agent.md.
public struct MetalNavigationMenu<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        HStack(spacing: MetalRecipes.menubar.points("self.gap")) { content }
            .accessibilityElement(children: .contain)
    }
}
