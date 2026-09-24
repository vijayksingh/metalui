import SwiftUI
#if canImport(AppKit)
import AppKit
#elseif canImport(UIKit)
import UIKit
#endif

// The product glyphs as native custom SF Symbols (imported from Kamui's KamuiIcon / KamuiIconView).
//
// Source of truth: packages/metalui/icons/src/icons.mjs. `npm run symbols` writes one variable symbol
// template per glyph (Ultralight/Regular/Black masters, strokes outlined) into
// Resources/MetalIcons.xcassets, plus a `.16` cut from the 16px-tuned bodies, and regenerates
// `MetalIcon+Catalog.generated.swift`. SwiftPM compiles the catalog with actool, so the glyphs load as
// real symbol images: weights follow the font, and palette rendering and `symbolEffect` work.

/// The bundle holding `MetalIcons.xcassets`.
public enum MetalIconBundle {
    public static var bundle: Bundle { .module }
    /// At or below this point size the `.16` cut (heavier stroke, simplified geometry) is drawn.
    public static let smallCutMaximumPointSize: CGFloat = 16
}

extension MetalIconName {
    /// Symbol name of the master drawing, e.g. `mu.send-away`.
    public var symbolName: String { "mu.\(rawValue)" }
    /// Symbol name of the 16px-tuned cut, e.g. `mu.send-away.16`.
    public var smallSymbolName: String { "mu.\(rawValue).16" }

    /// The cut to draw for an icon box of `pointSize` (the 24-unit grid at that many points).
    public func symbolName(forPointSize pointSize: CGFloat) -> String {
        pointSize <= MetalIconBundle.smallCutMaximumPointSize ? smallSymbolName : symbolName
    }

    /// Duotone opacity of the secondary layer at rest; 0 when the glyph has none.
    public var restingDuotone: Double { duotoneOpacity ?? 0 }
    /// Secondary layer opacity on hover, and the whole hover response under Reduce Motion (14 % → 30 %).
    public var hoverDuotone: Double { max(0.30, restingDuotone) }

    /// Six glyphs carry the brand's motion as bespoke SwiftUI shapes; the rest use `symbolEffect`.
    public var isHero: Bool {
        switch self {
        case .sendAway, .note, .group, .draw, .link, .keeper: return true
        default: return false
        }
    }
}

extension Image {
    /// A product glyph as a template symbol image. Size and weight follow the font, like any SF
    /// Symbol; use `MetalIcon` for exact 24-grid boxes, the duotone layer and hover/press motion.
    public init(metal icon: MetalIconName, pointSize: CGFloat = 24) {
        self.init(icon.symbolName(forPointSize: pointSize), bundle: MetalIconBundle.bundle)
    }

    /// A life glyph as a template symbol image (without its feelings vessel; `MetalLifeIcon` adds it).
    public init(metalLife icon: MetalLifeIconName, pointSize: CGFloat = 24) {
        self.init(icon.symbolName(forPointSize: pointSize), bundle: MetalIconBundle.bundle)
    }
}

// MARK: - Metrics

/// Maps an icon box (the 24-unit grid at N points) onto symbol font sizes.
///
/// The templates put the 18-unit square keyline (3…21) on the cap-height box, so a symbol's alignment
/// rect height is 18 units at any size. One measurement at 100 pt gives the font size that makes the
/// 24-unit box exactly `box` points, and the offset that centres the grid (symbol images are otherwise
/// sized by their ink, so different glyphs would sit at different heights).
public enum MetalIconMetrics {
    public struct Placement: Equatable, Sendable {
        public var fontSize: CGFloat
        public var offset: CGSize
    }

    private struct Measurement {
        var capPerPoint: CGFloat
        var centreDelta: CGSize // alignment-rect centre minus image centre, per point, y-down
    }

    nonisolated(unsafe) private static var cache: [String: Measurement] = [:]
    private static let lock = NSLock()

    public static func placement(symbolName name: String, box: CGFloat) -> Placement {
        guard let m = measurement(name) else { return Placement(fontSize: box * 0.62, offset: .zero) }
        let fontSize = box * 18 / 24 / m.capPerPoint
        return Placement(fontSize: fontSize, offset: CGSize(width: -m.centreDelta.width * fontSize, height: -m.centreDelta.height * fontSize))
    }

    private static func measurement(_ name: String) -> Measurement? {
        lock.lock()
        defer { lock.unlock() }
        if let m = cache[name] { return m }
        let reference: CGFloat = 100
        #if canImport(AppKit)
        let configuration = NSImage.SymbolConfiguration(pointSize: reference, weight: .regular, scale: .medium)
        guard let image = NSImage(symbolName: name, bundle: MetalIconBundle.bundle, variableValue: 0)?
            .withSymbolConfiguration(configuration) else { return nil }
        let size = image.size, align = image.alignmentRect
        guard align.height > 0 else { return nil }
        // NSImage is y-up: convert the centre delta to SwiftUI's y-down.
        let m = Measurement(
            capPerPoint: align.height / reference,
            centreDelta: CGSize(width: (align.midX - size.width / 2) / reference, height: -(align.midY - size.height / 2) / reference)
        )
        #elseif canImport(UIKit)
        let configuration = UIImage.SymbolConfiguration(pointSize: reference, weight: .regular, scale: .medium)
        guard let image = UIImage(named: name, in: MetalIconBundle.bundle, with: configuration) else { return nil }
        let size = image.size, insets = image.alignmentRectInsets
        let align = CGRect(x: insets.left, y: insets.top, width: size.width - insets.left - insets.right, height: size.height - insets.top - insets.bottom)
        guard align.height > 0 else { return nil }
        let m = Measurement(
            capPerPoint: align.height / reference,
            centreDelta: CGSize(width: (align.midX - size.width / 2) / reference, height: (align.midY - size.height / 2) / reference)
        )
        #endif
        cache[name] = m
        return m
    }

    /// Stroke width in grid units for a font weight, matching the symbol masters (Ultralight 0.9,
    /// Regular 1.7, Black 3.0). Hero shapes use it so they match the symbols around them.
    public static func strokeUnits(for weight: Font.Weight, regular: CGFloat) -> CGFloat {
        let factor: CGFloat
        switch weight {
        case .ultraLight: factor = 0.9 / 1.7
        case .thin: factor = 1.1 / 1.7
        case .light: factor = 1.35 / 1.7
        case .medium: factor = 1.95 / 1.7
        case .semibold: factor = 2.2 / 1.7
        case .bold: factor = 2.45 / 1.7
        case .heavy: factor = 2.7 / 1.7
        case .black: factor = 3.0 / 1.7
        default: factor = 1
        }
        return regular * factor
    }
}

// MARK: - Interaction

/// The hover and press of the control hosting an icon. Icons animate from it, the way a web icon
/// plays from its `.mu-icon-trigger`.
public struct MetalIconInteraction: Equatable, Sendable {
    public var isHovered: Bool
    public var isPressed: Bool

    public init(isHovered: Bool = false, isPressed: Bool = false) {
        self.isHovered = isHovered
        self.isPressed = isPressed
    }
}

private struct MetalIconInteractionKey: EnvironmentKey {
    static let defaultValue: MetalIconInteraction? = nil
}

extension EnvironmentValues {
    /// The interaction of the control that hosts an icon. `MetalButton` sets it.
    public var metalIconInteraction: MetalIconInteraction? {
        get { self[MetalIconInteractionKey.self] }
        set { self[MetalIconInteractionKey.self] = newValue }
    }
}

extension View {
    /// Drives descendant icons' hover and press motion from a host control.
    public func metalIconInteraction(_ interaction: MetalIconInteraction?) -> some View {
        environment(\.metalIconInteraction, interaction)
    }
}

// MARK: - Motion (the symbolEffect table, Kamui NATIVE.md §1)

/// The spring constants shared with the web (`--k-spring`, `--k-soft`).
enum MetalIconSpring {
    /// Object poses on hover: ζ 0.66, settle ≈ 460 ms.
    static let pose = Animation.spring(response: 0.42, dampingFraction: 0.66)
    /// Quiet settle: ζ 0.9, settle ≈ 340 ms.
    static let soft = Animation.spring(response: 0.42, dampingFraction: 0.9)
    /// The life set's pose spring: ζ 0.62 over 500 ms.
    static let life = Animation.spring(response: 0.44, dampingFraction: 0.62)
    /// Stagger between parts of one glyph.
    static let stagger: Double = 0.05
}

enum MetalIconHoverEffect: Equatable, Sendable {
    case none, bounceUpByLayer, bounceByLayer, pulse, wiggleClockwise, wiggleCounterClockwise, breathe
    /// Whole-glyph rotation about a grid point.
    case tilt(degrees: Double, anchorX: Double, anchorY: Double)
}

enum MetalIconPressEffect: Equatable, Sendable {
    case none, bounce, bounceDown, wiggleLeft
}

/// What an icon does, after availability and Reduce Motion.
struct MetalIconMotion: Equatable, Sendable {
    var hover: MetalIconHoverEffect
    var press: MetalIconPressEffect
    var usesHeroShape: Bool

    static let still = MetalIconMotion(hover: .none, press: .none, usesHeroShape: false)

    /// Under Reduce Motion nothing moves: the symbol is drawn still and only the duotone brightens.
    static func resolve(_ icon: MetalIconName, reduceMotion: Bool) -> MetalIconMotion {
        if reduceMotion { return .still }
        if icon.isHero { return MetalIconMotion(hover: .none, press: .none, usesHeroShape: true) }
        let modern = isModern
        var hover = MetalIconHoverEffect.none
        var press = MetalIconPressEffect.bounceDown
        switch icon {
        case .undo: hover = modern ? .wiggleCounterClockwise : .none
        case .redo: hover = modern ? .wiggleClockwise : .none
        case .pin, .board, .share: hover = .bounceUpByLayer
        case .more:
            hover = .pulse
            press = .bounce
        case .close: hover = .tilt(degrees: 90, anchorX: 12, anchorY: 12)
        case .capture:
            hover = modern ? .breathe : .none
            press = .bounce
        case .zoomIn, .zoomOut:
            hover = .bounceByLayer
            press = .bounce
        case .select: hover = .tilt(degrees: -7, anchorX: 6.1, anchorY: 4.9)
        case .search: hover = .tilt(degrees: -11, anchorX: 19.8, anchorY: 19.8)
        case .syncError: press = modern ? .wiggleLeft : .bounceDown
        // Their motion is the replace between states, not a press.
        case .synced, .offline: press = .none
        default: break
        }
        return MetalIconMotion(hover: hover, press: press, usesHeroShape: false)
    }

    /// `.wiggle` and `.breathe` need macOS 15 / iOS 18.
    static var isModern: Bool {
        if #available(macOS 15, iOS 18, *) { return true }
        return false
    }
}

private struct MetalIconHoverModifier: ViewModifier {
    let effect: MetalIconHoverEffect
    let trigger: Int

    func body(content: Content) -> some View {
        switch effect {
        case .none, .tilt: content
        case .bounceUpByLayer: content.symbolEffect(.bounce.up.byLayer, value: trigger)
        case .bounceByLayer: content.symbolEffect(.bounce.byLayer, value: trigger)
        case .pulse: content.symbolEffect(.pulse.byLayer, options: .nonRepeating, value: trigger)
        case .wiggleClockwise:
            if #available(macOS 15, iOS 18, *) { content.symbolEffect(.wiggle.clockwise, value: trigger) } else { content }
        case .wiggleCounterClockwise:
            if #available(macOS 15, iOS 18, *) { content.symbolEffect(.wiggle.counterClockwise, value: trigger) } else { content }
        case .breathe:
            if #available(macOS 15, iOS 18, *) { content.symbolEffect(.breathe, options: .nonRepeating, value: trigger) } else { content }
        }
    }
}

private struct MetalIconPressModifier: ViewModifier {
    let effect: MetalIconPressEffect
    let trigger: Int

    func body(content: Content) -> some View {
        switch effect {
        case .none: content
        case .bounce: content.symbolEffect(.bounce, value: trigger)
        case .bounceDown: content.symbolEffect(.bounce.down, value: trigger)
        case .wiggleLeft:
            if #available(macOS 15, iOS 18, *) { content.symbolEffect(.wiggle.left, value: trigger) } else { content.symbolEffect(.bounce.down, value: trigger) }
        }
    }
}

private struct MetalIconTilt: ViewModifier {
    let effect: MetalIconHoverEffect
    let isHovered: Bool

    func body(content: Content) -> some View {
        if case let .tilt(degrees, x, y) = effect {
            content
                .rotationEffect(.degrees(isHovered ? degrees : 0), anchor: UnitPoint(x: x / 24, y: y / 24))
                .animation(MetalIconSpring.pose, value: isHovered)
        } else {
            content
        }
    }
}

// MARK: - Views

/// One product glyph in an exact 24-grid box.
///
///     MetalIcon(.sendAway, size: 16)
///
/// - ≤ 16 pt draws the `.16` cut (heavier stroke, simplified bodies).
/// - The duotone is the symbol's secondary layer at the glyph's own opacity (× 1.3 in graphite);
///   hover raises it to 30 %.
/// - Colour follows the inherited foreground style.
/// - Hover and press come from the hosting control (`metalIconInteraction`, set by `MetalButton`),
///   else from the pointer over the icon itself.
/// - Static glyphs use `symbolEffect`; send-away, note, group, draw, link and keeper are SwiftUI shapes.
///   Under Reduce Motion the symbol is still and only the duotone brightens.
public struct MetalIcon: View {
    let icon: MetalIconName
    var size: CGFloat
    var weight: Font.Weight
    var interaction: MetalIconInteraction?

    @Environment(\.metalIconInteraction) private var hostInteraction
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.metalColorway) private var colorway
    @State private var ownHover = false
    @State private var hoverCount = 0
    @State private var pressCount = 0

    public init(_ icon: MetalIconName, size: CGFloat = 16, weight: Font.Weight = .regular, interaction: MetalIconInteraction? = nil) {
        self.icon = icon
        self.size = size
        self.weight = weight
        self.interaction = interaction
    }

    private var state: MetalIconInteraction { interaction ?? hostInteraction ?? MetalIconInteraction(isHovered: ownHover) }
    private var isSmall: Bool { size <= MetalIconBundle.smallCutMaximumPointSize }

    public var body: some View {
        let state = state
        let motion = MetalIconMotion.resolve(icon, reduceMotion: reduceMotion)
        let duotone = (state.isHovered ? icon.hoverDuotone : icon.restingDuotone) * colorway.tokens.duoK
        content(motion: motion, state: state, duotone: duotone)
            .frame(width: size, height: size)
            .modifier(MetalIconTilt(effect: motion.hover, isHovered: state.isHovered))
            .animation(.easeOut(duration: 0.15), value: duotone)
            .contentShape(Rectangle())
            .onHover { hovering in
                guard interaction == nil, hostInteraction == nil else { return }
                ownHover = hovering
            }
            .onChange(of: state.isHovered) { _, hovered in if hovered { hoverCount += 1 } }
            .onChange(of: state.isPressed) { _, pressed in if pressed { pressCount += 1 } }
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private func content(motion: MetalIconMotion, state: MetalIconInteraction, duotone: Double) -> some View {
        if motion.usesHeroShape {
            MetalIconHero(icon: icon, pose: MetalIconHeroPose(
                box: size,
                lineUnits: MetalIconMetrics.strokeUnits(for: weight, regular: isSmall ? icon.smallStrokeUnits : 1.7),
                small: isSmall,
                hover: state.isHovered,
                hoverCount: hoverCount,
                pressCount: pressCount,
                duotone: duotone
            ))
        } else {
            MetalIconSymbol(symbolName: icon.symbolName(forPointSize: size), size: size, weight: weight, duotone: duotone, dimmed: icon.dimmedOpacity ?? 1)
                .modifier(MetalIconHoverModifier(effect: motion.hover, trigger: hoverCount))
                .modifier(MetalIconPressModifier(effect: motion.press, trigger: pressCount))
                .symbolEffectsRemoved(reduceMotion)
        }
    }
}

/// A symbol image placed so its 24-unit grid fills `size` exactly, in palette mode:
/// strokes in the foreground, the duotone and dimmed layers at their opacities.
struct MetalIconSymbol: View {
    let symbolName: String
    var size: CGFloat
    var weight: Font.Weight = .regular
    var duotone: Double
    var dimmed: Double = 1

    var body: some View {
        let placement = MetalIconMetrics.placement(symbolName: symbolName, box: size)
        Image(symbolName, bundle: MetalIconBundle.bundle)
            .symbolRenderingMode(.palette)
            .foregroundStyle(.primary, .primary.opacity(duotone), .primary.opacity(dimmed))
            .font(.system(size: placement.fontSize, weight: weight))
            .imageScale(.medium)
            .contentTransition(.symbolEffect(.replace))
            .fixedSize()
            .offset(placement.offset)
            .frame(width: size, height: size)
    }
}
