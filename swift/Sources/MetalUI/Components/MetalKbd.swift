import SwiftUI

// Keycap. Mirrors components/kbd from MetalKbdMetrics and the cap material.

/// A key's glyph on a small raised cap, in the readout role.
public struct MetalKbd: View {
    public enum Size: Sendable { case `default`, small }
    public enum Surface: Sendable { case `default`, strip, sunk }

    let key: String
    let size: Size
    let surface: Surface
    let label: String?
    @Environment(\.metalColorway) private var colorway

    public init(_ key: String, size: Size = .default, surface: Surface = .default, label: String? = nil) {
        self.key = key
        self.size = size
        self.surface = surface
        self.label = label
    }

    public var body: some View {
        let t = colorway.tokens
        let small = size == .small
        let recipe: MetalRecipe
        let ink: MetalRGBA
        switch surface {
        case .default: recipe = MetalRecipe(fill: t.capBg, shadows: t.capSh); ink = t.ink2
        case .strip: recipe = MetalRecipe(fill: MetalKbdMetrics.stripBg, shadows: MetalKbdMetrics.stripSh); ink = MetalKbdMetrics.stripInk
        case .sunk: recipe = MetalRecipe(fill: MetalKbdMetrics.sunkBg, shadows: MetalKbdMetrics.sunkSh); ink = MetalKbdMetrics.sunkInk
        }
        let shape = RoundedRectangle(cornerRadius: surface == .sunk ? 999 : MetalRadius.key, style: .continuous)
        return Text(key)
            .font(.metal(MetalType.readout)).tracking(MetalType.readout.trackingPoints).monospacedDigit()
            .foregroundColor(ink.color)
            .padding(.horizontal, small ? MetalKbdMetrics.padSmall : MetalKbdMetrics.pad)
            .frame(minWidth: small ? MetalKbdMetrics.minSmall : MetalKbdMetrics.min, minHeight: small ? MetalKbdMetrics.small : MetalKbdMetrics.height, maxHeight: small ? MetalKbdMetrics.small : MetalKbdMetrics.height)
            .metalRecipe(recipe, in: shape)
            .fixedSize()
            .accessibilityLabel(label ?? key)
    }
}
