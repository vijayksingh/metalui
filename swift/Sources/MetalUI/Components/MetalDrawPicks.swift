import SwiftUI

/// Fixed drawing inks from the draw recipe. The graphite strip uses its light ink bead.
public enum MetalInk: String, CaseIterable, Sendable, Identifiable {
    case ink, red, blue, green, amber
    public var id: String { rawValue }
    public var label: String { rawValue.capitalized }

    public func color(in colorway: MetalColorway, graphiteStrip: Bool = false) -> MetalRGBA {
        let key = self == .ink && graphiteStrip ? "ink.on-dark" : "ink.\(rawValue)"
        return MetalRecipes.draw.color(key, colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink
    }
}

/// Three stroke widths, shown as dots in the current ink.
public enum MetalInkWidth: String, CaseIterable, Sendable, Identifiable {
    case fine, regular, bold
    public var id: String { rawValue }
    public var label: String { rawValue.capitalized }
    public var points: Double { MetalRecipes.draw.points("width.\(rawValue)") }
}

/// Five glossy ink beads in a toolbar. Selection sits in the toolbar's latched well.
public struct MetalInkPicks: View {
    @Binding private var value: MetalInk
    private let disabled: Bool

    public init(value: Binding<MetalInk>, disabled: Bool = false) {
        _value = value
        self.disabled = disabled
    }

    public var body: some View {
        HStack(spacing: MetalRecipes.draw.points("self.gap")) {
            ForEach(MetalInk.allCases) { ink in
                MetalDrawPick(label: ink.label, chosen: value == ink, disabled: disabled, ink: ink, width: nil) {
                    value = ink
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Ink")
    }
}

/// Three stroke-width dots, painted in the chosen ink.
public struct MetalWidthPicks: View {
    @Binding private var value: MetalInkWidth
    private let ink: MetalInk
    private let disabled: Bool

    public init(value: Binding<MetalInkWidth>, ink: MetalInk = .ink, disabled: Bool = false) {
        _value = value
        self.ink = ink
        self.disabled = disabled
    }

    public var body: some View {
        HStack(spacing: MetalRecipes.draw.points("self.gap")) {
            ForEach(MetalInkWidth.allCases) { width in
                MetalDrawPick(label: width.label, chosen: value == width, disabled: disabled, ink: ink, width: width) {
                    value = width
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Width")
    }
}

private struct MetalDrawPick: View {
    let label: String
    let chosen: Bool
    let disabled: Bool
    let ink: MetalInk
    let width: MetalInkWidth?
    let action: () -> Void
    @FocusState private var focused: Bool

    var body: some View {
        Button(action: action) { Color.clear }
            .buttonStyle(MetalDrawPickStyle(chosen: chosen, ink: ink, width: width))
            .disabled(disabled)
            .focusEffectDisabled()
            .focused($focused)
            .overlay {
                if focused {
                    Circle().stroke(MetalShared.focus.color, lineWidth: MetalRecipes.segmented.points("self.focus-width"))
                        .allowsHitTesting(false)
                }
            }
            .metalTooltip(label)
            .accessibilityLabel(label)
            .accessibilityAddTraits(chosen ? [.isSelected] : [])
    }
}

private struct MetalDrawPickStyle: ButtonStyle {
    let chosen: Bool
    let ink: MetalInk
    let width: MetalInkWidth?
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalToolbarVariant) private var graphiteStrip
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false

    func makeBody(configuration: Configuration) -> some View {
        let r = MetalRecipes.draw
        let size = r.points("self.size")
        let dot = width?.points ?? r.points("self.bead")
        let scale = configuration.isPressed ? r.scalar("bead.press") : hovering && isEnabled ? r.scalar("bead.hover") : .one
        let t = colorway.tokens
        let well = MetalRecipe(fill: t.pressedBg, shadows: t.pressedSh)
        let bead = Circle()
            .fill(ink.color(in: colorway, graphiteStrip: graphiteStrip).color)
            .frame(width: dot, height: dot)
            .background {
                if width == nil {
                    Circle()
                        .fill(ink.color(in: colorway, graphiteStrip: graphiteStrip).color)
                        .metalRecipe(MetalDrawGloss.recipe(ink: ink.color(in: colorway, graphiteStrip: graphiteStrip), colorway: colorway), in: Circle())
                }
            }
            .scaleEffect(reduceMotion ? .one : scale)
            .animation(reduceMotion ? nil : configuration.isPressed ? .easeOut(duration: MetalDrawPickMotion.pressDuration) : MetalSpringClass.part.spring.animation,
                       value: scale)

        return bead
            .frame(width: size, height: size)
            .background {
                if chosen { Color.clear.metalRecipe(well, in: Circle()) }
            }
            .contentShape(Circle())
            .opacity(isEnabled ? .one : MetalButtonMetrics.disabled)
            .onHover { hovering = $0 }
    }
}

/// Read the ordered CSS shadow stack directly from the generated draw token.
private enum MetalDrawGloss {
    static func recipe(ink: MetalRGBA, colorway: MetalColorway) -> MetalRecipe {
        let raw = MetalRecipes.draw.text("bead.gloss", colorway: MetalRecipeColorway(colorway)) ?? ""
        let shadows: [MetalShadow] = raw.components(separatedBy: "), ").compactMap { segment in
            let entry = segment.hasSuffix(")") ? segment : segment + ")"
            guard let open = entry.firstIndex(of: "("),
                  let end = entry.lastIndex(of: ")") else { return nil }
            let dimensions = entry[..<open].split(separator: " ")
            let values = entry[entry.index(after: open)..<end].split(separator: ",").compactMap { Double($0) }
            let numbers = dimensions.filter { $0 != "inset" }.compactMap { Double($0.replacingOccurrences(of: "px", with: "")) }
            guard numbers.count >= 3, values.count == 4 else { return nil }
            return MetalShadow(inset: dimensions.first == "inset", x: numbers[0], y: numbers[1], blur: numbers[2],
                               spread: numbers.count > 3 ? numbers[3] : 0,
                               color: MetalRGBA(values[0], values[1], values[2], values[3]))
        }
        return MetalRecipe(fill: .solid(ink), shadows: shadows)
    }
}
