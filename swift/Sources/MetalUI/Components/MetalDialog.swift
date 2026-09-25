import SwiftUI

/// The dialog's title, body and trailing actions in the layout owned by its recipe.
/// This is also renderable without presenting a platform sheet for headless captures.
public struct MetalDialogPopup<Popup: View, Actions: View>: View {
    let title: String
    let material: MetalSurfaceMaterial
    let radius: MetalSurfaceRadius
    let popup: Popup
    let actions: Actions

    @Environment(\.metalColorway) private var colorway

    public init(_ title: String, material: MetalSurfaceMaterial = .plate, radius: MetalSurfaceRadius = .card,
                @ViewBuilder popup: () -> Popup, @ViewBuilder actions: () -> Actions) {
        self.title = title
        self.material = material
        self.radius = radius
        self.popup = popup()
        self.actions = actions()
    }

    public var body: some View {
        let recipe = MetalRecipes.dialog
        MetalSurface(material, radius: radius) {
            VStack(alignment: .leading, spacing: recipe.points("self.gap")) {
                Text(title)
                    .font(.metal(MetalType.title))
                    .foregroundStyle(colorway.tokens.ink.color)
                    .accessibilityAddTraits(.isHeader)
                popup
                HStack(spacing: recipe.points("actions.gap")) {
                    Spacer(minLength: .zero)
                    actions
                }
            }
            .padding(recipe.points("self.pad"))
            .frame(width: recipe.points("self.width"))
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
        .accessibilityAddTraits(.isModal)
    }
}

/// A native modal sheet supplies focus containment, Escape, and focus restoration.
public struct MetalDialog<Popup: View, Actions: View>: View {
    @Binding private var isPresented: Bool
    private let title: String
    private let material: MetalSurfaceMaterial
    private let radius: MetalSurfaceRadius
    private let popup: Popup
    private let actions: Actions

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false

    public init(isPresented: Binding<Bool>, title: String,
                material: MetalSurfaceMaterial = .plate, radius: MetalSurfaceRadius = .card,
                @ViewBuilder popup: () -> Popup, @ViewBuilder actions: () -> Actions) {
        _isPresented = isPresented
        self.title = title
        self.material = material
        self.radius = radius
        self.popup = popup()
        self.actions = actions()
    }

    public var body: some View {
        Color.clear.frame(width: .zero, height: .zero)
            .sheet(isPresented: $isPresented, onDismiss: { arrived = false }) {
                let recipe = MetalRecipes.dialog
                MetalDialogPopup(title, material: material, radius: radius, popup: { popup }, actions: { actions })
                    .opacity(arrived ? .one : .zero)
                    .offset(y: arrived || reduceMotion ? .zero : recipe.points("self.enter-y"))
                    .scaleEffect(arrived || reduceMotion ? .one : recipe.scalar("self.enter-scale"))
                    .onAppear {
                        withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true }
                    }
            }
    }
}
