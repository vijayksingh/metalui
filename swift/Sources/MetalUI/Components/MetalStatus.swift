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
///
/// `gesture` is how it behaves over time (steady, flicker, breathe, blink2, rise; tokens
/// status.gestures). A new gesture plays from the start; Reduce Motion holds the lamp steady.
public struct MetalLED: View {
    public enum Size: Sendable { case `default`, small }
    let kind: MetalLEDKind
    let size: Size
    let diameter: CGFloat?
    let gesture: MetalLampGesture
    /// A fixed point in the gesture (0–1), for captures; nil plays it in time.
    let phase: Double?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var start = Date()

    public init(_ kind: MetalLEDKind, size: Size = .default, diameter: CGFloat? = nil, gesture: MetalLampGesture = .steady, phase: Double? = nil) {
        self.kind = kind
        self.size = size
        self.diameter = diameter
        self.gesture = gesture
        self.phase = phase
    }

    /// The lamp's level (0 dark lens … 1 lit) at a point in the gesture.
    static func level(_ gesture: MetalLampGesture, at progress: Double) -> Double {
        let keys = gesture.keys, p = min(1, max(0, progress))
        guard let hi = keys.firstIndex(where: { $0.0 >= p }), hi > 0 else { return keys.first?.1 ?? 1 }
        let (t0, l0) = keys[hi - 1], (t1, l1) = keys[hi]
        var f = t1 > t0 ? (p - t0) / (t1 - t0) : 1
        if gesture.eased { f = f * f * (3 - 2 * f) }
        return l0 + (l1 - l0) * f
    }

    /// A dimmed lamp's saturation, and the shade over it: the web's brightness() and saturate() at this level.
    static func saturation(at level: Double) -> Double { MetalLampDim.saturate + (1 - MetalLampDim.saturate) * level }
    static func shade(at level: Double) -> Double { (1 - MetalLampDim.brightness) * (1 - level) }

    public var body: some View {
        let recipe = MetalRecipes.status
        let d = diameter ?? recipe.points(size == .small ? "led.size-small" : "led.size")
        let still = gesture.duration == 0 || reduceMotion
        TimelineView(.animation(paused: still || phase != nil)) { context in
            let progress: Double = {
                if let phase { return phase }
                if still { return 1 }
                let t = context.date.timeIntervalSince(start) / gesture.duration
                return gesture.loops ? t.truncatingRemainder(dividingBy: 1) : min(1, t)
            }()
            let level = Self.level(gesture, at: progress)
            Color.clear
                .frame(width: d, height: d)
                .metalObjectRecipe(recipe, part: "led", state: kind.recipeState, in: Circle())
                .saturation(Self.saturation(at: level))
                .overlay(Circle().fill(Color.black.opacity(Self.shade(at: level))))
        }
        .id("\(kind.recipeState)-\(gesture.rawValue)")
        .onChange(of: gesture) { start = Date() }
        .onChange(of: kind.recipeState) { start = Date() }
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
