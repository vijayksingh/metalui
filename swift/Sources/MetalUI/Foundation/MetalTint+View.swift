import SwiftUI

private struct MetalUntintedKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Tints off: glyph bodies fall back to ink. The web twin is `data-mu-untinted`.
    public var metalUntinted: Bool {
        get { self[MetalUntintedKey.self] }
        set { self[MetalUntintedKey.self] = newValue }
    }
}

private struct MetalTintModifier: ViewModifier {
    let tint: MetalTint
    /// The glyph's own duotone opacity (its `--duo`, 0.17 for the feelings vessel).
    let duotone: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalUntinted) private var untinted
    @Environment(\.colorSchemeContrast) private var contrast

    func body(content: Content) -> some View {
        // Bone: ink line, enamel body. Graphite: the line glows in the pigment, the body is its
        // duotone. Under Increase Contrast, with tints off, or for neutral, the glyph stays ink.
        if let pigment = tint.pigment, !untinted, contrast != .increased {
            let tokens = colorway.tokens
            let body = pigment.color.opacity(min(1, duotone * tokens.duoK * tokens.tintBody))
            if tokens.tintLine >= 1 {
                content.symbolRenderingMode(.palette).foregroundStyle(pigment.color, body)
            } else {
                content.symbolRenderingMode(.palette).foregroundStyle(HierarchicalShapeStyle.primary, body)
            }
        } else {
            content
        }
    }
}

extension View {
    /// Colors a feelings or moment glyph with its tint's pigment, as its colorway sets it. Never use it on text.
    public func metalTint(_ tint: MetalTint, duotone: Double = 0.17) -> some View {
        modifier(MetalTintModifier(tint: tint, duotone: duotone))
    }

    /// Turns feelings tints off for descendants, like `data-mu-untinted` on the web.
    public func metalUntinted(_ untinted: Bool = true) -> some View {
        environment(\.metalUntinted, untinted)
    }
}
