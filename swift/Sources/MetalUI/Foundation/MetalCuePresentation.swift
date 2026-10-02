import CoreText
import SwiftUI

/// A document reading line uses its current words' advance and inline meaning glyphs.
/// Standalone cue surfaces retain their reserved editing footprint and display grammar.
public enum MetalCuePresentation: Sendable { case surface, documentLine }
private struct MetalCuePresentationKey: EnvironmentKey {
    static let defaultValue: MetalCuePresentation = .surface
}
extension EnvironmentValues {
    var metalCuePresentation: MetalCuePresentation {
        get { self[MetalCuePresentationKey.self] }
        set { self[MetalCuePresentationKey.self] = newValue }
    }
}
extension View {
    public func metalCuePresentation(_ presentation: MetalCuePresentation) -> some View {
        environment(\.metalCuePresentation, presentation)
    }
}

/// Meaning sits at the reading font's cap center; the glyph contributes real inline advance.
struct MetalCueGlyphBaseline: ViewModifier {
    let side: Double
    func body(content: Content) -> some View {
        content.frame(width: side, height: side)
            .alignmentGuide(.firstTextBaseline) { dimensions in
                dimensions.height / 2 + CTFontGetCapHeight(MetalFonts.ctFont(MetalType.content, size: MetalType.content.size)) / 2
            }
    }
}
struct MetalCueInlineGlyph<Content: View>: View {
    let side: Double
    @ViewBuilder let content: Content
    var body: some View { content.modifier(MetalCueGlyphBaseline(side: side)).accessibilityHidden(true) }
}
