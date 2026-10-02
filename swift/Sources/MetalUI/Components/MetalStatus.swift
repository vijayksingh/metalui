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
    /// Optional outer diameter, including the socket, for a host-specific footprint.
    let diameter: CGFloat?
    let gesture: MetalLampGesture?
    let phase: Double?
    @MetalMotionPreference private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.metalColorway) private var colorway
    @State private var start = Date()
    @State private var finished = false
    @State private var visible = false

    public init(_ kind: MetalLEDKind, size: Size = .default, diameter: CGFloat? = nil, gesture: MetalLampGesture? = nil, phase: Double? = nil) {
        self.kind = kind; self.size = size; self.diameter = diameter
        self.gesture = gesture; self.phase = phase
    }
    private var motion: MetalLampGesture {
        if kind == .off { return .steady }
        return gesture ?? (kind == .waiting ? .breathe : kind == .failed ? .blink2 : .steady)
    }
    static func level(_ gesture: MetalLampGesture, at progress: Double) -> Double {
        let keys = gesture.keys, p = min(1, max(0, progress))
        guard let hi = keys.firstIndex(where: { $0.0 >= p }), hi > 0 else { return keys.first?.1 ?? 1 }
        let (t0, l0) = keys[hi - 1], (t1, l1) = keys[hi]
        var f = t1 > t0 ? (p - t0) / (t1 - t0) : 1
        if gesture.eased { f = f * f * (3 - 2 * f) }
        return l0 + (l1 - l0) * f
    }
    static func saturation(at level: Double) -> Double { MetalLampDim.saturate + (1 - MetalLampDim.saturate) * level }
    static func shade(at level: Double) -> Double { (1 - MetalLampDim.brightness) * (1 - level) }

    public var body: some View {
        let recipe = MetalRecipes.status
        let bezel = recipe.points("lamp.bezel")
        let d = diameter ?? recipe.points(size == .small ? "lamp.size-small" : "lamp.size") + bezel * 2
        let lensSize = max(CGFloat.zero, d - bezel * 2)
        let ink = recipe.color("ink.\(kind.recipeState)", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink
        let still = motion.duration == 0 || reduceMotion || finished
        TimelineView(.animation(paused: still || phase != nil || !visible || scenePhase != .active)) { context in
            let progress: Double = {
                if reduceMotion { return 1 }
                if let phase { return phase }
                if still { return 1 }
                let t = context.date.timeIntervalSince(start) / motion.duration
                return motion.loops ? t.truncatingRemainder(dividingBy: 1) : min(1, t)
            }()
            let opacity = MetalLampDim.brightness + (1 - MetalLampDim.brightness) * Self.level(motion, at: progress)
            Color.clear
                .frame(width: lensSize, height: lensSize)
                .background {
                    if kind == .off { Circle().fill(ink.color) }
                    else { Color.clear.metalObjectRecipe(recipe, part: "lamp", in: Circle(), self: ink).opacity(opacity) }
                }
                .padding(bezel)
                .metalObjectRecipe(recipe, part: "socket", in: Circle(), self: recipe.color("ink.off", colorway: MetalRecipeColorway(colorway)))
        }
        .onAppear { visible = true }
        .onDisappear { visible = false }
        .task(id: "\(kind.recipeState)-\(motion.rawValue)-\(reduceMotion)") {
            start = Date(); finished = false
            guard motion.duration > 0, !motion.loops, !reduceMotion, phase == nil else { return }
            do { try await Task.sleep(for: .seconds(motion.duration)); finished = true } catch { }
        }
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
