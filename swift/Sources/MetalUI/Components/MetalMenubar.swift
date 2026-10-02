import SwiftUI

// WIP: MetalMenubar is a placeholder that keeps the React API's shape (words that open menus). It lays
// out system Menus in an HStack; on macOS prefer the system menu bar through `.commands`. The keys'
// lifted look and the gliding highlight from menubar.agent.md are not drawn yet. Web is the reference.

/// Category words stay words; a system Menu command can use
/// `Label { Text("Export…") } icon: { MetalIcon(.download, size: 14) }`
/// to carry the same authored command glyph as its React row.
/// An app's commands under a few words. Work in progress: see menubar.agent.md.
public struct MetalMenubar<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        HStack(spacing: MetalRecipes.menubar.points("self.gap")) { content }
            .accessibilityElement(children: .contain)
    }
}
