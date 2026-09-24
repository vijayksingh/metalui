import SwiftUI

/// A raised or floating material. The surface supplies its generated layers,
/// radius and backdrop; the caller owns content, layout, role and focus.
public enum MetalSurfaceMaterial: String, Sendable {
    case raise
    case raiseLite = "raise-lite"
    case raiseSm = "raise-sm"
    case frost, plate, panel, pop, tip, lens, graphite
    case graphitePlain = "graphite-plain"
    case graphiteStrip = "graphite-strip"
    case graphiteDeep = "graphite-deep"
    case graphiteGlass = "graphite-glass"

    var recipeState: String {
        switch self {
        case .graphitePlain, .graphiteStrip: return "graphite"
        default: return rawValue
        }
    }

    var backdropPart: String? {
        switch self {
        case .frost, .plate, .panel, .pop, .tip, .lens, .graphite, .graphiteGlass: return rawValue
        case .graphiteStrip: return "graphite-strip"
        case .raise, .raiseLite, .raiseSm, .graphitePlain, .graphiteDeep: return nil
        }
    }

    var reducesToOpaque: Bool {
        switch self {
        case .frost, .plate, .panel, .pop, .tip, .lens: return true
        default: return false
        }
    }

    var isDark: Bool {
        switch self {
        case .graphite, .graphitePlain, .graphiteStrip, .graphiteDeep, .graphiteGlass: return true
        default: return false
        }
    }
}

public enum MetalSurfaceRadius: String, Sendable {
    case pill, hero, card, plate, strip, region, tip, row
}

public struct MetalSurface<Content: View>: View {
    let material: MetalSurfaceMaterial
    let radius: MetalSurfaceRadius?
    @ViewBuilder let content: Content

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    public init(_ material: MetalSurfaceMaterial, radius: MetalSurfaceRadius? = nil,
                @ViewBuilder content: () -> Content) {
        self.material = material
        self.radius = radius
        self.content = content()
    }

    public var body: some View {
        let recipe = MetalRecipes.surface
        let corner = radius.map { recipe.points("radius.\($0.rawValue)") } ?? .zero
        let shape = RoundedRectangle(cornerRadius: corner, style: .continuous)
        content
            .metalObjectRecipe(recipe, part: "self", state: material.recipeState, in: shape)
            .background {
                if reduceTransparency && material.reducesToOpaque {
                    shape.fill(colorway.tokens.frostOpaque.color)
                } else if let part = material.backdropPart {
                    MetalBackdropView(backdrop: MetalBackdrop(
                        blur: recipe.filterNumber("blur.\(part)", function: "blur") ?? .zero,
                        saturation: recipe.filterNumber("blur.\(part)", function: "saturate") ?? .one,
                        dark: material.isDark || colorway == .graphite))
                        .clipShape(shape)
                }
            }
    }
}
