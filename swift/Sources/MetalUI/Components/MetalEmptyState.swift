import SwiftUI

// WIP: MetalEmptyState is a placeholder that keeps the React API's shape (title, description, glyph,
// action). It uses the system ContentUnavailableView, not yet the sunk well or the arrival from
// empty-state.agent.md. Web is the reference.

/// A place with nothing in it yet. Work in progress: see empty-state.agent.md.
/// Supply a starting action such as `MetalButton("Attach files", icon: .attach)`
/// or `MetalButton("New note", icon: .note)` through the action builder.
public struct MetalEmptyState<Action: View>: View {
    private let title: String
    private let description: String?
    private let systemImage: String
    private let action: Action

    public init(_ title: String, description: String? = nil, systemImage: String = "tray", @ViewBuilder action: () -> Action = { EmptyView() }) {
        self.title = title
        self.description = description
        self.systemImage = systemImage
        self.action = action()
    }

    public var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
        } description: {
            if let description { Text(description) }
        } actions: {
            action
        }
    }
}
