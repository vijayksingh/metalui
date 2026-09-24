import SwiftUI

/// Engraved separator. Its fill, lip and dimensions come from the generated
/// Rule recipe; the parent supplies the length.
public struct MetalRule: View {
    public enum Orientation: Sendable { case vertical, horizontal }
    public enum Tone: Sendable { case `default`, graphite }

    let orientation: Orientation
    let tone: Tone

    public init(_ orientation: Orientation = .vertical, tone: Tone = .default) {
        self.orientation = orientation
        self.tone = tone
    }

    public var body: some View {
        let recipe = MetalRecipes.rule
        let thickness = recipe.points("self.thickness")
        let line = Color.clear.metalObjectRecipe(
            recipe, part: "self", state: tone == .graphite ? "graphite" : nil,
            in: Rectangle())
        Group {
            switch orientation {
            case .vertical:
                line.frame(width: thickness)
                    .padding(.horizontal, recipe.points("self.margin"))
            case .horizontal:
                line.frame(height: thickness)
            }
        }
        .accessibilityRepresentation { Divider() }
    }
}
