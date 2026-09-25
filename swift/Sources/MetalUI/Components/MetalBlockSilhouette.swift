import SwiftUI

/// Far-zoom block shape. Host places and sizes it in world coordinates when its zoom level settles.
public struct MetalBlockSilhouette: View {
    public enum Kind: String, Sendable, CaseIterable {
        case text, code, link, swatch, image, file, region
    }

    public let kind: Kind
    public let color: MetalRGBA?
    public let label: String?
    public let lines: Int?

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(_ kind: Kind, color: MetalRGBA? = nil, label: String? = nil, lines: Int? = nil) {
        self.kind = kind
        self.color = color
        self.label = label
        self.lines = lines
    }

    public var body: some View {
        let recipe = MetalRecipes.silhouette
        let part = kind.rawValue
        let shape = RoundedRectangle(cornerRadius: recipe.points("\(part).radius"), style: .continuous)

        GeometryReader { geometry in
            ZStack(alignment: .topLeading) {
                if kind == .text || kind == .code {
                    let pad: CGFloat = kind == .code ? CGFloat(recipe.points("code.pad")) : .zero
                    bars(in: geometry.size, pad: pad, recipe: recipe)
                }
                if kind == .region, let label, !label.isEmpty {
                    let role = recipe.typeRole("region.font", trackingKey: "region.tracking")
                    Text(label)
                        .font(.metal(role))
                        .tracking(role.trackingPoints)
                        .foregroundStyle((recipe.color("region.ink", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink).color)
                        .lineLimit(1)
                        .padding(recipe.points("region.pad"))
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height, alignment: .topLeading)
            .clipShape(shape)
            .background {
                if kind != .text {
                    Color.clear.metalObjectRecipe(recipe, part: part, in: shape, self: color)
                }
            }
        }
        .transition(reduceMotion ? .identity : .opacity.animation(.easeOut(duration: recipe.durationSeconds("self.fade"))))
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func bars(in size: CGSize, pad: CGFloat, recipe: MetalObjectRecipe) -> some View {
        let part = kind.rawValue
        let pitch = CGFloat(recipe.points("\(part).line"))
        let bar = CGFloat(recipe.points("\(part).bar"))
        let ink = recipe.color("\(part).ink", colorway: MetalRecipeColorway(colorway))?.color ?? Color.clear
        let height = max(.zero, size.height - pad - pad)
        let extent = lines.map { min(height, CGFloat(max(0, $0)) * pitch) } ?? height
        return Canvas { context, canvas in
            guard pitch > 0, bar > 0 else { return }
            for y in stride(from: CGFloat.zero, to: min(extent, canvas.height), by: pitch) {
                context.fill(Path(CGRect(x: .zero, y: y, width: canvas.width, height: min(bar, extent - y))), with: .color(ink))
            }
        }
        .frame(width: max(.zero, size.width - pad - pad), height: extent)
        .offset(x: pad, y: pad)
    }
}
