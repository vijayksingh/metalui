import SwiftUI

public enum MetalWellVariant: String, Sendable { case field, track, region, graphite }
public enum MetalRegionHue: String, Sendable { case neutral, red, amber, green, blue, violet }

/// A material well. Region wells paint the recipe's tiled paper dots above its fill.
public struct MetalWell<Content: View>: View {

    let variant: MetalWellVariant
    let radius: CGFloat?
    let over: Bool
    let hue: MetalRegionHue
    let content: Content

    @Environment(\.metalColorway) private var colorway

    public init(_ variant: MetalWellVariant, radius: CGFloat? = nil, over: Bool = false, hue: MetalRegionHue = .neutral,
                @ViewBuilder content: () -> Content) {
        self.variant = variant
        self.radius = radius
        self.over = over
        self.hue = hue
        self.content = content()
    }

    public var body: some View {
        let recipe = MetalRecipes.well
        let shape = RoundedRectangle(cornerRadius: radius ?? recipe.points("radius.\(variant.rawValue)"), style: .continuous)
        if variant == .region {
            content.background { regionPaper(shape: shape) }
        } else {
            content.metalObjectRecipe(recipe, part: "self", state: variant.rawValue, in: shape)
        }
    }

    private func regionPaper(shape: RoundedRectangle) -> some View {
        let recipe = MetalRecipes.well
        let state = over ? "region-over" : "region"
        let cw = MetalRecipeColorway(colorway)
        let fills = recipe.fills("self", state: state, colorway: cw)
        let shadows = recipe.shadows("self", state: state, colorway: cw)
        let dotColor: Color = {
            guard case .radial(_, let stops)? = fills.first, let stop = stops.first else { return .clear }
            return stop.paint.resolved(self: nil).color
        }()
        let spacing = recipe.points("region-dot.spacing")
        let center = recipe.points("region-dot.offset") + recipe.points("region-dot.center")
        let core = recipe.points("region-dot.core-radius")
        let fade = recipe.points("region-dot.fade-radius")
        let wash = MetalRecipes.folder.color("region-wash.\(hue.rawValue)", colorway: cw)
        let ring = MetalRecipes.folder.color("region-ring.\(hue.rawValue)", colorway: cw)

        return ZStack {
            MetalOuterShadows(layers: shadows.filter { !$0.inset }, shape: shape)
            if fills.count > 1 { fills[1].view(in: shape, self: nil) }
            Canvas(opaque: false, rendersAsynchronously: true) { context, size in
                guard spacing > .zero, fade > .zero else { return }
                let shade = GraphicsContext.Shading.radialGradient(
                    Gradient(stops: [
                        .init(color: dotColor, location: .zero),
                        .init(color: dotColor, location: core / fade),
                        .init(color: .clear, location: CGFloat(Double.one))
                    ]), center: .zero, startRadius: .zero, endRadius: fade)
                for x in stride(from: center, through: size.width + fade, by: spacing) {
                    for y in stride(from: center, through: size.height + fade, by: spacing) {
                        var dot = context
                        dot.translateBy(x: x, y: y)
                        dot.fill(Path(ellipseIn: CGRect(x: -fade, y: -fade, width: fade * 2, height: fade * 2)), with: shade)
                    }
                }
            }
            .clipShape(shape)
            if hue != .neutral, let wash, let ring {
                shape.fill(wash.color)
                shape.strokeBorder(ring.color, lineWidth: recipe.points("region-dot.hue-edge"))
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
