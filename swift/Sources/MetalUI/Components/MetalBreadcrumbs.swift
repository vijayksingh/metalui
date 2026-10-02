import SwiftUI

// WIP: MetalBreadcrumbs is a placeholder that keeps the React API's shape (a path and a selection
// callback). It lays out buttons and chevrons in an HStack, not yet the fold menu or the arrival from
// breadcrumbs.agent.md. Web is the reference.

/// Where you are, as a path you can climb. Work in progress: see breadcrumbs.agent.md.
public struct MetalBreadcrumbs: View {
    private let path: [String]
    private let onSelect: (Int) -> Void

    public init(path: [String], onSelect: @escaping (Int) -> Void) {
        self.path = path
        self.onSelect = onSelect
    }

    public var body: some View {
        HStack(spacing: MetalRecipes.breadcrumbs.points("self.gap")) {
            ForEach(Array(path.enumerated()), id: \.offset) { i, name in
                if i == path.count - 1 {
                    Text(name).accessibilityAddTraits(.isHeader)
                } else {
                    Button(name) { onSelect(i) }.buttonStyle(.plain).foregroundStyle(.secondary)
                    MetalIcon(.chevron, size: MetalRecipes.breadcrumbs.points("sep.size"), interaction: MetalIconInteraction())
                        .rotationEffect(.degrees(270)).foregroundStyle(.tertiary)
                }
            }
        }
    }
}
