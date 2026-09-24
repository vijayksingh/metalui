import SwiftUI

extension MetalLifeIconName {
    /// Symbol name of the master drawing, e.g. `mu.life.coffee`.
    public var symbolName: String { "mu.life.\(rawValue)" }
    /// Symbol name of the 16px-tuned cut, e.g. `mu.life.coffee.16`.
    public var smallSymbolName: String { "mu.life.\(rawValue).16" }

    public func symbolName(forPointSize pointSize: CGFloat) -> String {
        pointSize <= MetalIconBundle.smallCutMaximumPointSize ? smallSymbolName : symbolName
    }
}

/// One life glyph in an exact 24-grid box: what a block is about (a meal, a run, a feeling).
///
///     MetalLifeIcon(.coffee, size: 16)
///     MetalLifeIcon(.calm, size: 16)            // tide tint, from the manifest
///     MetalLifeIcon(.calm, size: 16, tint: nil) // in the surrounding ink
///
/// - ≤ 16 pt draws the tuned cut (the trailing glyph on a block is 16, the day strip 14, a row slot 24).
/// - Feelings, the two energy states and a few moments carry their tint on the stroke
///   (tokens.json foundations.tint). A tinted glyph's vessel is not filled; untinted, the vessel is
///   the faint disc at its authored opacity. Tints turn off under Increase Contrast and
///   `.metalUntinted()`.
/// - There is no press: a glyph on a line is not a control. On the host's hover the glyph bounces
///   once; under Reduce Motion it stays still and only the duotone brightens.
public struct MetalLifeIcon: View {
    let icon: MetalLifeIconName
    var size: CGFloat
    var tint: MetalTint?

    @Environment(\.metalIconInteraction) private var hostInteraction
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalUntinted) private var untinted
    @Environment(\.colorSchemeContrast) private var contrast
    @State private var ownHover = false
    @State private var hoverCount = 0

    /// A life glyph with the tint its manifest names.
    public init(_ icon: MetalLifeIconName, size: CGFloat = 16) {
        self.icon = icon
        self.size = size
        self.tint = icon.tint
    }

    /// A life glyph with an explicit tint, or `nil` for the surrounding ink.
    public init(_ icon: MetalLifeIconName, size: CGFloat = 16, tint: MetalTint?) {
        self.icon = icon
        self.size = size
        self.tint = tint
    }

    private var isHovered: Bool { hostInteraction?.isHovered ?? ownHover }

    /// The tint in effect: none under Increase Contrast or with tints off.
    private var activeTint: MetalTint? { untinted || contrast == .increased ? nil : tint }

    public var body: some View {
        let hovered = isHovered
        let k = colorway.tokens.duoK
        let rest = icon.duotoneOpacity ?? 0
        let duotone = (hovered ? max(0.30, rest) : rest) * k
        let tinted = activeTint
        ZStack {
            if let vessel = icon.vesselOpacity, tinted == nil {
                // The feelings vessel: the self as a soft round screen, r 9.3 on the 24 grid.
                Circle()
                    .fill(.foreground.opacity(vessel * k))
                    .frame(width: size * 18.6 / 24, height: size * 18.6 / 24)
            }
            MetalIconSymbol(symbolName: icon.symbolName(forPointSize: size), size: size, duotone: duotone, dimmed: icon.dimmedOpacity ?? 1)
                .symbolEffect(.bounce.byLayer, value: hoverCount)
                .symbolEffectsRemoved(reduceMotion)
        }
        .frame(width: size, height: size)
        .foregroundStyle(tinted.map { AnyShapeStyle($0.color(in: colorway).color) } ?? AnyShapeStyle(.foreground))
        .animation(.easeOut(duration: 0.15), value: duotone)
        .contentShape(Rectangle())
        .onHover { hovering in
            guard hostInteraction == nil else { return }
            ownHover = hovering
        }
        .onChange(of: hovered) { _, now in if now { hoverCount += 1 } }
        .accessibilityHidden(true)
    }
}
