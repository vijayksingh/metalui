import SwiftUI

// Hover engraving. Mirrors components/hover-engraving from MetalEngraving and the colorway tokens.

/// The recognizer's status LED in an engraving.
public enum MetalEngravingStatus: Sendable {
    case live, waiting, failed, off

    var led: MetalRadialGradient {
        switch self {
        case .live: return MetalShared.ledGreen
        case .waiting: return MetalShared.ledAmber
        case .failed: return MetalShared.ledRed
        case .off: return MetalShared.ledOff
        }
    }
}

/// Where the engraving sits: beside the first line of a text block, or below a material block.
public enum MetalEngravingPlacement: Sendable { case beside, below }

/// A block's identity in the label role, engraved: "LOG · 07:40 · SLEEP 6 H" with derived tags and a status.
public struct MetalHoverEngraving: View {
    let kind: String
    let details: [String]
    let tags: [String]
    let status: (MetalEngravingStatus, String)?

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    public init(kind: String, details: [String] = [], tags: [String] = [], status: (MetalEngravingStatus, String)? = nil) {
        self.kind = kind
        self.details = details
        self.tags = tags
        self.status = status
    }

    public var body: some View {
        let t = colorway.tokens
        let recipe = MetalRecipes.hoverEngraving
        let lip = MetalRecipes.label.textShadows("engraved", colorway: MetalRecipeColorway(colorway)).first
        let role = MetalType.label
        HStack(spacing: recipe.points("self.gap")) {
            (Text(kind).foregroundColor((recipe.color("emphasis.color", colorway: MetalRecipeColorway(colorway)) ?? t.engravingEmphasis).color) + Text(details.map { " · \($0)" }.joined()).foregroundColor(t.engrave.color))
                .font(.metal(role)).tracking(role.trackingPoints)
                .shadow(color: (lip?.color ?? t.lip).color, radius: lip?.blur ?? .zero, x: lip?.x ?? .zero, y: lip?.y ?? .zero)
            if !tags.isEmpty {
                HStack(spacing: recipe.points("tag.gap")) {
                    ForEach(tags, id: \.self) { tag in
                        Text("#\(tag)".uppercased())
                            .font(recipe.font("tag.font"))
                            .tracking(recipe.tracking("tag.tracking", size: recipe.fontSize("tag.font")))
                            .foregroundColor(t.engrave.color)
                            .padding(.horizontal, recipe.points("tag.pad"))
                            .frame(height: recipe.points("tag.height"))
                            .metalObjectRecipe(recipe, part: "tag", in: Capsule())
                    }
                }
            }
            if let (led, text) = status {
                HStack(spacing: recipe.points("led.gap")) {
                    Circle().fill(led.led.gradient(diameter: recipe.points("led.size")))
                        .frame(width: recipe.points("led.size"), height: recipe.points("led.size"))
                        .background { MetalOuterShadows(layers: recipe.shadows("led", colorway: MetalRecipeColorway(colorway)), shape: Circle()) }
                    Text(text).font(.metal(role)).tracking(role.trackingPoints).foregroundColor(t.engrave.color)
                }
            }
        }
        .textCase(.uppercase)
        .padding(.horizontal, recipe.points("self.pad"))
        .frame(height: recipe.points("self.height"))
        .background {
            let shape = Capsule(style: .continuous)
            ZStack {
                if !reduceTransparency { MetalBackdropView(backdrop: MetalBackdrop(blur: MetalEngraving.blur, saturation: 1, dark: colorway == .graphite)).clipShape(shape) }
                if reduceTransparency {
                    Color.clear.metalRecipe(MetalRecipe(fill: .solid(t.frostOpaque), shadows: recipe.shadows("self", colorway: MetalRecipeColorway(colorway))), in: shape)
                } else {
                    Color.clear.metalObjectRecipe(recipe, part: "self", in: shape)
                }
            }
        }
        .fixedSize()
        .allowsHitTesting(false)
        .accessibilityElement(children: .combine)
    }
}

private struct MetalHoverEngravingModifier: ViewModifier {
    let engraving: MetalHoverEngraving
    let placement: MetalEngravingPlacement
    let isPresented: Bool?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false
    @State private var shown = false
    @State private var dwell: Task<Void, Never>?

    func body(content: Content) -> some View {
        let travel = MetalMotion.resolve(.settle, reduceMotion: reduceMotion).allowsTravel
        content
            .onHover { hovering = $0 }
            .overlay(alignment: placement == .beside ? .topTrailing : .bottomLeading) {
                engraving
                    .opacity(shown ? .one : .zero)
                    .offset(x: placement == .beside && !shown && travel ? -MetalEngraving.slide : 0, y: placement == .below && !shown && travel ? -MetalEngraving.rise : 0)
                    .alignmentGuide(.trailing) { d in placement == .beside ? -MetalEngraving.besideGap : d[.trailing] }
                    .alignmentGuide(.top) { _ in placement == .beside ? -MetalEngraving.besideTop : 0 }
                    .alignmentGuide(.bottom) { d in placement == .below ? d[.top] - MetalEngraving.belowGap : d[.bottom] }
            }
            .onChange(of: isPresented ?? hovering, initial: true) { _, want in
                dwell?.cancel()
                guard want else { withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = false }; return }
                // A dwell, not a pass: 420 ms of hover before it shows.
                dwell = Task { @MainActor in
                    try? await Task.sleep(nanoseconds: UInt64(MetalEngraving.dwellMs * 1_000_000))
                    guard !Task.isCancelled else { return }
                    withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = true }
                }
            }
    }
}

extension View {
    /// Shows the block's identity after a 420 ms hover dwell, beside its first line (or below it).
    /// Pass `isPresented: false` while the block is selected or being written.
    public func metalHoverEngraving(_ engraving: MetalHoverEngraving, placement: MetalEngravingPlacement = .beside, isPresented: Bool? = nil) -> some View {
        modifier(MetalHoverEngravingModifier(engraving: engraving, placement: placement, isPresented: isPresented))
    }
}
