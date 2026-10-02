import SwiftUI

// WIP: MetalSidebar is a placeholder that keeps the React API's shape (sections of items). It shows a
// system List with the sidebar style, not yet the gliding highlight or the collapse to a rail from
// sidebar.agent.md. Web is the reference.

/// An app's side place. Work in progress: see sidebar.agent.md.
public struct MetalSidebar<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        List { content }
            .listStyle(.sidebar)
            .frame(minWidth: MetalRecipes.sidebar.points("self.width"))
    }
}

/// The operable collapse/expand key; the host owns its sidebar's layout and binding.
/// MetalSidebar's system List remains a WIP. This key shares the web glyph and dimensions.
public struct MetalSidebarToggle: View {
    @Binding private var collapsed: Bool
    private let customIcon: AnyView?
    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var isEnabled
    @MetalMotionPreference private var reduceMotion
    @State private var hovering = false

    public init(collapsed: Binding<Bool>) {
        self._collapsed = collapsed
        self.customIcon = nil
    }

    public init<Icon: View>(collapsed: Binding<Bool>, @ViewBuilder icon: () -> Icon) {
        self._collapsed = collapsed
        self.customIcon = AnyView(icon())
    }

    public var body: some View {
        let recipe = MetalRecipes.sidebar
        let label = collapsed ? "Expand" : "Collapse"
        Button { collapsed.toggle() } label: {
            HStack(spacing: recipe.points("item.gap")) {
                if let customIcon { customIcon.accessibilityHidden(true) }
                else { MetalMorphIcon(collapsed ? .sidebarCollapsed : .sidebar, size: recipe.points("item.glyph")) }
                ZStack {
                    Text("Collapse").hidden()
                    Text("Expand").hidden()
                    Text(label).id(label)
                        .transition(reduceMotion ? .identity : .asymmetric(insertion: .offset(y: MetalSpace.s4).combined(with: .opacity), removal: .offset(y: -MetalSpace.s4).combined(with: .opacity)))
                }
                .clipped()
            }
            .font(.metal(MetalType.ui))
            .foregroundStyle((hovering ? colorway.tokens.ink : colorway.tokens.ink2).color)
            .frame(height: recipe.points("item.height"))
            .padding(.horizontal, recipe.points("item.pad-x"))
            .contentShape(RoundedRectangle(cornerRadius: recipe.points("item.radius")))
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? Double.one : MetalRecipes.button.scalar("self.disabled"))
        .accessibilityLabel(collapsed ? "Expand the sidebar" : "Collapse to a rail")
        .accessibilityValue(collapsed ? "Collapsed" : "Expanded")
        .help(collapsed ? "Expand the sidebar" : "Collapse to a rail")
        .onHover { hovering = $0 }
        .animation(reduceMotion ? nil : MetalMotion.resolve(.settle, reduceMotion: false).animation, value: collapsed)
        .transaction { transaction in
            if reduceMotion { transaction.animation = nil; transaction.disablesAnimations = true }
        }
    }
}
