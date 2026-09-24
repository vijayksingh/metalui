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

/// A fill and its shadow stack; a frosted recipe adds a backdrop and an opaque twin.
public struct MetalRecipe: Equatable, Sendable {
    public let fill: MetalGradient
    public let shadows: [MetalShadow]
    /// The blur of what is behind (frosted recipes only).
    public let backdrop: MetalBackdrop?
    /// The fill under Reduce Transparency: opaque, and the backdrop goes.
    public let opaqueFill: MetalGradient?
    /// The hairline that rims the surface under Increase Contrast.
    public let contrastEdge: MetalRGBA?

    public init(
        fill: MetalGradient,
        shadows: [MetalShadow],
        backdrop: MetalBackdrop? = nil,
        opaqueFill: MetalGradient? = nil,
        contrastEdge: MetalRGBA? = nil
    ) {
        self.fill = fill
        self.shadows = shadows
        self.backdrop = backdrop
        self.opaqueFill = opaqueFill
        self.contrastEdge = contrastEdge
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

/// Everything except `base`, within a rect grown by `extent`. Masks outer shadows so they never
/// show through a translucent fill: CSS paints an outer box-shadow only outside the border box.
private struct MetalOutsideShape<Base: Shape>: Shape {
    let base: Base
    let extent: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path(rect.insetBy(dx: -extent, dy: -extent))
        path.addPath(base.path(in: rect))
        return path
    }
}

/// Outer shadow stack, drawn behind the shape.
struct MetalOuterShadows<S: Shape>: View {
    let layers: [MetalShadow]
    let shape: S
    var excludesInterior = false

    var body: some View {
        Group {
            if excludesInterior {
                let extent = layers.map { $0.blur + abs($0.x) + abs($0.y) + max($0.spread, 0) }.max() ?? 0
                stack.mask {
                    MetalOutsideShape(base: shape, extent: extent * 2).fill(style: FillStyle(eoFill: true))
                }
            } else {
                stack
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private var stack: some View {
        ZStack {
            ForEach(Array(layers.enumerated().reversed()), id: \.offset) { _, layer in
                // The spread grows or shrinks the path, never the layout: a large negative spread on a
                // small object (raise's −36 on a 36 pt bar) must collapse the shadow, not grow the view.
                MetalSpreadShape(base: shape, spread: layer.spread)
                    .fill(layer.color.color)
                    .offset(x: layer.x, y: layer.y)
                    .blur(radius: layer.blur / 2)
            }
        }
    }
}

/// `base` grown (or shrunk) by `spread` on every side; empty when it shrinks past nothing, as CSS does.
struct MetalSpreadShape<Base: Shape>: Shape {
    let base: Base
    let spread: CGFloat

    func path(in rect: CGRect) -> Path {
        let r = rect.insetBy(dx: -spread, dy: -spread)
        guard r.width > 0, r.height > 0 else { return Path() }
        return base.path(in: r)
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

/// The frost behind a floating surface: SwiftUI's own material, so it rasterizes with the view
/// tree (no platform view), tinted to the recipe's finish. The recipe's fill lies over it.
struct MetalBackdropView: View {
    let backdrop: MetalBackdrop

    var body: some View {
        Rectangle()
            .fill(.ultraThinMaterial)
            .saturation(backdrop.saturation)
            .environment(\.colorScheme, backdrop.dark ? .dark : .light)
            .allowsHitTesting(false)
            .accessibilityHidden(true)
    }
}

private struct MetalRecipeModifier<S: InsettableShape>: ViewModifier {
    let recipe: MetalRecipe
    let shape: S
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.colorSchemeContrast) private var contrast

    func body(content: Content) -> some View {
        // Reduce Transparency: the opaque twin replaces the fill and the backdrop goes.
        let opaque = reduceTransparency && recipe.opaqueFill != nil
        let fill = opaque ? recipe.opaqueFill! : recipe.fill
        content.background {
            ZStack {
                MetalOuterShadows(
                    layers: recipe.shadows.filter { !$0.inset },
                    shape: shape,
                    excludesInterior: fill.isTranslucent
                )
                if let backdrop = recipe.backdrop, !opaque {
                    MetalBackdropView(backdrop: backdrop).clipShape(shape)
                }
                shape.fill(fill.linearGradient)
                MetalInnerShadows(layers: recipe.shadows.filter(\.inset), shape: shape)
                if contrast == .increased, let edge = recipe.contrastEdge {
                    shape.strokeBorder(edge.color, lineWidth: 1)
                }
            }
            .allowsHitTesting(false)
        }
    }
}

extension View {
    /// Renders a material recipe behind the view, in `shape`.
    public func metalRecipe<S: InsettableShape>(_ recipe: MetalRecipe, in shape: S) -> some View {
        modifier(MetalRecipeModifier(recipe: recipe, shape: shape))
    }

    /// A frosted surface (E2 floating) in the environment colorway, in `shape`.
    public func metalFrost<S: InsettableShape>(_ frost: MetalFrost, in shape: S) -> some View {
        modifier(MetalFrostModifier(frost: frost, shape: shape))
    }
}

private struct MetalFrostModifier<S: InsettableShape>: ViewModifier {
    let frost: MetalFrost
    let shape: S
    @Environment(\.metalColorway) private var colorway

    func body(content: Content) -> some View {
        content.metalRecipe(frost.recipe(in: colorway), in: shape)
    }
}
