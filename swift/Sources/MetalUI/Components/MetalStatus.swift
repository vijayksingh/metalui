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
        let d: CGFloat = diameter ?? CGFloat(recipe.points(size == .small ? "lamp.size-small" : "lamp.size") + bezel * 2)
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

public enum MetalStatusTone: Sendable { case `default`, quiet, strong }
public enum MetalStatusSurface: Sendable { case solid, transparent, frosted }

/// System state in words, beside its decorative lamp. A hint is its accessible help.
public struct MetalStatusBadge: View {
    let text: String
    let led: MetalLEDKind
    let hint: String?
    let tone: MetalStatusTone
    let surface: MetalStatusSurface
    let solid: Bool
    let gesture: MetalLampGesture?
    let glyph: MetalIconName?
    @MetalMotionPreference private var reduceMotion
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String, led: MetalLEDKind, hint: String? = nil,
                tone: MetalStatusTone = .default, surface: MetalStatusSurface = .solid,
                solid: Bool = false, gesture: MetalLampGesture? = nil, glyph: MetalIconName? = nil) {
        self.text = text; self.led = led; self.hint = hint; self.tone = tone
        self.surface = surface; self.solid = solid; self.gesture = gesture; self.glyph = glyph
    }
    public var body: some View {
        let recipe = MetalRecipes.status
        let quiet = tone == .quiet && !solid
        let translucent = !quiet && !solid && tone != .strong && surface != .solid
        let ink = recipe.color("ink.\(led.recipeState)", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink
        let frost = MetalFrost.plate.recipe(in: colorway)
        let material = MetalRecipe(fill: frost.fill,
            shadows: recipe.shadows("badge", colorway: MetalRecipeColorway(colorway)),
            backdrop: surface == .frosted ? frost.backdrop : nil,
            opaqueFill: frost.opaqueFill, contrastEdge: frost.contrastEdge)
        HStack(spacing: recipe.points("badge.gap")) {
            if let glyph {
                MetalMorphIcon(glyph, size: MetalRecipes.button.points("compact.glyph"))
                    .foregroundStyle((translucent ? colorway.tokens.ink : colorway.tokens.ink2).color)
                    .accessibilityHidden(true)
            } else { MetalLED(led, gesture: gesture) }
            ZStack {
                Text(text.uppercased()).id(glyph == nil ? "words" : text)
                    .transition(reduceMotion ? .opacity : .asymmetric(
                        insertion: .opacity.combined(with: .offset(y: MetalSpace.s4)),
                        removal: .opacity.combined(with: .offset(y: -MetalSpace.s4))))
            }.id(reduceMotion).clipped().metalAnimation(.settle, value: text)
                // A removed SwiftUI identity can retain its former offset transition.
                // Resolve reduced words immediately so a live scope change cannot travel.
                .transaction { transaction in
                    if reduceMotion { transaction.animation = nil; transaction.disablesAnimations = true }
                }
                .font(recipe.font("badge.font"))
                .tracking(recipe.tracking("badge.tracking", size: recipe.fontSize("badge.font")))
                .foregroundColor((translucent ? colorway.tokens.ink : colorway.tokens.ink2).color)
        }
        .padding(.horizontal, quiet ? CGFloat.zero : recipe.points("badge.pad"))
        .frame(height: recipe.points("badge.height"))
        .background {
          ZStack {
            if !quiet {
                if translucent { Color.clear.metalRecipe(material, in: Capsule(style: .continuous)) }
                else { Color.clear.metalObjectRecipe(recipe, part: "badge", in: Capsule(style: .continuous)) }
                if tone == .strong { Capsule(style: .continuous).fill(ink.color.opacity(recipe.scalar("badge.tint"))) }
            }
          }
        }
        .fixedSize()
        .help(hint ?? "")
        .accessibilityElement(children: .combine)
        .accessibilityLabel(text)
        .accessibilityHint(hint ?? "")
    }
}
