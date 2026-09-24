import SwiftUI

// One renderer draws any material recipe, a fill plus a CSS box-shadow stack,
// so SwiftUI matches the web pixel for pixel in structure:
//
//   outer shadows   behind the shape, unclipped (contact and ambient)
//   fill            the gradient
//   inner shadows   clipped to the shape (glow, pillow, well shading)
//   content         on top
//
// CSS paints the first shadow in a list on top, so layers draw in reverse.

/// A fill and its shadow stack.
public struct MetalRecipe: Equatable, Sendable {
    public let fill: MetalGradient
    public let shadows: [MetalShadow]

    public init(fill: MetalGradient, shadows: [MetalShadow]) {
        self.fill = fill
        self.shadows = shadows
    }
}

/// The region outside `base` (shifted by the offset and shrunk by `spread`),
/// within a rect grown by `extent`. Filled even-odd, blurred and clipped to
/// `base`, it is a CSS inset shadow.
private struct MetalInsetShadowShape<Base: Shape>: Shape {
    let base: Base
    let spread: CGFloat
    let offset: CGSize
    let extent: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path(rect)
        let hole = rect
            .insetBy(dx: extent + spread, dy: extent + spread)
            .offsetBy(dx: offset.width, dy: offset.height)
        guard hole.width > .zero, hole.height > .zero else { return path }
        path.addPath(base.path(in: hole))
        return path
    }
}

/// Outer shadow stack, drawn behind the shape.
struct MetalOuterShadows<S: Shape>: View {
    let layers: [MetalShadow]
    let shape: S

    var body: some View {
        ZStack {
            ForEach(Array(layers.enumerated().reversed()), id: \.offset) { _, layer in
                shape
                    .fill(layer.color.color)
                    .padding(-layer.spread)
                    .offset(x: layer.x, y: layer.y)
                    .blur(radius: layer.blur / 2)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// Inner shadow stack, clipped to the shape.
struct MetalInnerShadows<S: Shape>: View {
    let layers: [MetalShadow]
    let shape: S

    var body: some View {
        ZStack {
            ForEach(Array(layers.enumerated().reversed()), id: \.offset) { _, layer in
                let extent = layer.blur + abs(layer.x) + abs(layer.y) + abs(layer.spread) + 2
                MetalInsetShadowShape(
                    base: shape,
                    spread: layer.spread,
                    offset: CGSize(width: layer.x, height: layer.y),
                    extent: extent
                )
                .fill(layer.color.color, style: FillStyle(eoFill: true))
                .padding(-extent)
                .blur(radius: layer.blur / 2)
            }
        }
        .clipShape(shape)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct MetalRecipeModifier<S: Shape>: ViewModifier {
    let recipe: MetalRecipe
    let shape: S

    func body(content: Content) -> some View {
        content.background {
            ZStack {
                MetalOuterShadows(layers: recipe.shadows.filter { !$0.inset }, shape: shape)
                shape.fill(recipe.fill.linearGradient)
                MetalInnerShadows(layers: recipe.shadows.filter(\.inset), shape: shape)
            }
            .allowsHitTesting(false)
        }
    }
}

extension View {
    /// Renders a material recipe behind the view, in `shape`.
    public func metalRecipe<S: Shape>(_ recipe: MetalRecipe, in shape: S) -> some View {
        modifier(MetalRecipeModifier(recipe: recipe, shape: shape))
    }
}
