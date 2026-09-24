import SwiftUI

/// The reference's label recipe: engraved mono, heading, and readout roles.
public struct MetalLabel: View {
    public enum Style: Sendable { case engraved, heading, readout }

    let text: String
    let style: Style
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String, style: Style = .engraved) {
        self.text = text
        self.style = style
    }

    public var body: some View {
        let recipe = MetalRecipes.label
        let finish = MetalRecipeColorway(colorway)
        let part: String = switch style {
        case .engraved: "engraved"
        case .heading: "heading"
        case .readout: "readout"
        }
        let role = recipe.typeRole("\(part).font", trackingKey: "\(part).tracking")
        let lip = style == .engraved ? recipe.textShadows("engraved", colorway: finish).first : nil
        Text(style == .engraved ? text.uppercased() : text)
            .font(.metal(role))
            .tracking(role.trackingPoints)
            .foregroundStyle((recipe.color("\(part).color", colorway: finish) ?? colorway.tokens.engrave).color)
            .shadow(color: lip?.color.color ?? .clear,
                    radius: lip?.blur ?? .zero, x: lip?.x ?? .zero, y: lip?.y ?? .zero)
            .lineLimit(1)
            .fixedSize()
            .accessibilityLabel(text)
    }
}
