import SwiftUI

// LED and status badge painted from the generated status recipe.

/// What an LED says.
public enum MetalLEDKind: Sendable {
    case live, waiting, failed, link, off

    var recipeState: String {
        switch self {
        case .live: return "live"
        case .waiting: return "waiting"
        case .failed: return "failed"
        case .link: return "link"
        case .off: return "off"
        }
    }
}

/// A tiny lamp, lit from the top left. Decorative: pair it with words.
public struct MetalLED: View {
    public enum Size: Sendable { case `default`, small }
    let kind: MetalLEDKind
    let size: Size

    public init(_ kind: MetalLEDKind, size: Size = .default) {
        self.kind = kind
        self.size = size
    }

    public var body: some View {
        let recipe = MetalRecipes.status
        let d = recipe.points(size == .small ? "led.size-small" : "led.size")
        Color.clear
            .frame(width: d, height: d)
            .metalObjectRecipe(recipe, part: "led", state: kind.recipeState, in: Circle())
            .accessibilityHidden(true)
    }
}

/// A state the system is in, with its LED. Not a button; the hint is its help.
public struct MetalStatusBadge: View {
    let text: String
    let led: MetalLEDKind
    let hint: String?
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String, led: MetalLEDKind, hint: String? = nil) {
        self.text = text
        self.led = led
        self.hint = hint
    }

    public var body: some View {
        let recipe = MetalRecipes.status
        HStack(spacing: recipe.points("badge.gap")) {
            MetalLED(led)
            Text(text.uppercased())
                .font(recipe.font("badge.font"))
                .tracking(recipe.tracking("badge.tracking", size: recipe.fontSize("badge.font")))
                .foregroundColor(colorway.tokens.ink2.color)
        }
        .padding(.horizontal, recipe.points("badge.pad"))
        .frame(height: recipe.points("badge.height"))
        .metalObjectRecipe(recipe, part: "badge", in: Capsule(style: .continuous))
        .fixedSize()
        .help(hint ?? "")
        .accessibilityElement(children: .combine)
        .accessibilityHint(hint ?? "")
    }
}
