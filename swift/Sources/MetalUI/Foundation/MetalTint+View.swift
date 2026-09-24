import SwiftUI

private struct MetalUntintedKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Tints off: glyphs fall back to the surrounding ink. The web twin is `data-mu-untinted`.
    public var metalUntinted: Bool {
        get { self[MetalUntintedKey.self] }
        set { self[MetalUntintedKey.self] = newValue }
    }
}

private struct MetalTintModifier: ViewModifier {
    let tint: MetalTint
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalUntinted) private var untinted
    @Environment(\.colorSchemeContrast) private var contrast

    func body(content: Content) -> some View {
        // Under Increase Contrast, or with tints off, the glyph keeps the surrounding ink.
        if untinted || contrast == .increased {
            content
        } else {
            content.foregroundStyle(tint.color(in: colorway).color)
        }
    }
}

extension View {
    /// Colors a feelings or energy glyph with its valence tint. Never use it on text.
    public func metalTint(_ tint: MetalTint) -> some View {
        modifier(MetalTintModifier(tint: tint))
    }

    /// Turns valence tints off for descendants, like `data-mu-untinted` on the web.
    public func metalUntinted(_ untinted: Bool = true) -> some View {
        environment(\.metalUntinted, untinted)
    }
}
