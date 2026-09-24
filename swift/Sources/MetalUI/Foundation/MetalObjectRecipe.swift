import SwiftUI

// An object's look as data (tokens.json `recipes`, generated into MetalRecipes): layers per part and
// state — fills, CSS box-shadow stacks, text-shadow lips — and its sizes, radii and type. The web
// reads the same layers as --mu-r-<object>-<part>[-<state>]-<prop> custom properties.
//
// Paint order follows CSS: within one part and state, the first background layer is on top, and
// the first shadow in a stack is drawn on top.

/// A color a layer paints with: a fixed RGBA, or the object's own color at an alpha (a swatch's
/// colored drop shadow, `self/.53` in the recipe).
public enum MetalRecipePaint: Equatable, Sendable {
    case color(MetalRGBA)
    case selfColor(alpha: Double)

    public func resolved(self own: MetalRGBA?) -> MetalRGBA {
        switch self {
        case .color(let c): return c
        case .selfColor(let a):
            let base = own ?? MetalRGBA(0, 0, 0, 1)
            return MetalRGBA(base.red, base.green, base.blue, base.alpha * a)
        }
    }
}

public struct MetalRecipeStop: Equatable, Sendable {
    public let paint: MetalRecipePaint
    public let location: Double
    public init(_ paint: MetalRecipePaint, _ location: Double) {
        self.paint = paint
        self.location = location
    }
}

public enum MetalRecipeFill: Equatable, Sendable {
    case solid(MetalRecipePaint)
    /// CSS angle: 180 is top → bottom, 90 is left → right.
    case linear(angle: Double, stops: [MetalRecipeStop])
    /// Center in unit coordinates of the part's box.
    case radial(center: CGPoint, stops: [MetalRecipeStop])
}

public struct MetalRecipeShadow: Equatable, Sendable {
    public let inset: Bool
    public let x: Double
    public let y: Double
    public let blur: Double
    public let spread: Double
    public let paint: MetalRecipePaint
    public init(inset: Bool, x: Double, y: Double, blur: Double, spread: Double, paint: MetalRecipePaint) {
        self.inset = inset
        self.x = x
        self.y = y
        self.blur = blur
        self.spread = spread
        self.paint = paint
    }

    /// As a MetalShadow for the existing renderers (MetalOuterShadows, the inset shape).
    public func shadow(self own: MetalRGBA? = nil) -> MetalShadow {
        MetalShadow(inset: inset, x: x, y: y, blur: blur, spread: spread, color: paint.resolved(self: own))
    }
}

public enum MetalRecipeColorway: String, Equatable, Sendable { case bone, graphite }

public struct MetalRecipeLayer: Equatable, Sendable {
    public enum Value: Equatable, Sendable {
        case fill(MetalRecipeFill)
        case shadow(MetalRecipeShadow)
        case textShadow(MetalRecipeShadow)
    }

    public let part: String
    public let state: String?
    public let colorway: MetalRecipeColorway?
    public let value: Value

    public init(part: String, state: String?, colorway: MetalRecipeColorway?, fill: MetalRecipeFill) {
        self.part = part
        self.state = state
        self.colorway = colorway
        self.value = .fill(fill)
    }

    public init(part: String, state: String?, colorway: MetalRecipeColorway?, shadow: MetalRecipeShadow) {
        self.part = part
        self.state = state
        self.colorway = colorway
        self.value = .shadow(shadow)
    }

    public init(part: String, state: String?, colorway: MetalRecipeColorway?, textShadow: MetalRecipeShadow) {
        self.part = part
        self.state = state
        self.colorway = colorway
        self.value = .textShadow(textShadow)
    }
}

public enum MetalRecipeProp: Equatable, Sendable {
    /// Points (CSS px).
    case number(Double)
    /// A CSS value as written: a font shorthand ("600 9.5px/1 mono"), a color, a letter-spacing.
    case text(String)
    case perColorway(bone: String, graphite: String)
}

public struct MetalObjectRecipe: Equatable, Sendable {
    public let name: String
    public let layers: [MetalRecipeLayer]
    public let props: [String: MetalRecipeProp]

    public init(name: String, layers: [MetalRecipeLayer], props: [String: MetalRecipeProp]) {
        self.name = name
        self.layers = layers
        self.props = props
    }

    /// The layers of one part in one state, for one colorway (state-less layers are the rest state).
    public func layers(_ part: String, state: String? = nil, colorway: MetalRecipeColorway = .bone) -> [MetalRecipeLayer] {
        layers.filter { $0.part == part && $0.state == state && ($0.colorway == nil || $0.colorway == colorway) }
    }

    public func fills(_ part: String, state: String? = nil, colorway: MetalRecipeColorway = .bone) -> [MetalRecipeFill] {
        layers(part, state: state, colorway: colorway).compactMap { if case .fill(let f) = $0.value { return f } else { return nil } }
    }

    public func shadows(_ part: String, state: String? = nil, colorway: MetalRecipeColorway = .bone, self own: MetalRGBA? = nil) -> [MetalShadow] {
        layers(part, state: state, colorway: colorway).compactMap { if case .shadow(let s) = $0.value { return s.shadow(self: own) } else { return nil } }
    }

    /// A number prop in points; zero when the recipe has none.
    public func points(_ key: String) -> Double { number(key) ?? .zero }

    /// A unitless prop (an opacity, a scale) written as text or number; zero when absent.
    public func scalar(_ key: String) -> Double {
        if let n = number(key) { return n }
        return Double(text(key) ?? "") ?? .zero
    }

    public func number(_ key: String) -> Double? {
        if case .number(let n) = props[key] { return n }
        return nil
    }

    public func text(_ key: String, colorway: MetalRecipeColorway = .bone) -> String? {
        switch props[key] {
        case .text(let s): return s
        case .perColorway(let b, let g): return colorway == .graphite ? g : b
        default: return nil
        }
    }

    /// A CSS font shorthand prop ("600 9.5px/1 mono") in the bundled families: Geist (`sans`) or
    /// Martian Mono (`mono`), at the prop's weight and size.
    public func font(_ key: String) -> Font {
        .metal(typeRole(key))
    }

    /// The font size of a font shorthand prop, for em trackings.
    public func fontSize(_ key: String) -> Double {
        let parts = (text(key) ?? "").split(separator: " ")
        return parts.dropFirst().first.flatMap { Double($0.split(separator: "p").first ?? "") } ?? 13
    }

    /// An em letter-spacing prop ("0.04em") in points at `size`.
    public func tracking(_ key: String, size: Double) -> Double {
        let s = text(key) ?? "0"
        return (Double(s.replacingOccurrences(of: "em", with: "")) ?? 0) * size
    }

    static func weight(_ w: Double) -> Font.Weight {
        switch w {
        case ..<350: return .light
        case ..<450: return .regular
        case ..<550: return .medium
        case ..<650: return .semibold
        default: return .bold
        }
    }
}

extension MetalRecipeColorway {
    init(_ colorway: MetalColorway) { self = colorway == .graphite ? .graphite : .bone }
}

extension MetalRecipeFill {
    /// The fill as a paintable view in `shape`, the object's own color resolved.
    @ViewBuilder
    func view<S: Shape>(in shape: S, self own: MetalRGBA?) -> some View {
        switch self {
        case .solid(let p):
            shape.fill(p.resolved(self: own).color)
        case .linear(let angle, let stops):
            shape.fill(MetalGradient(angle: angle, stops: stops.map { .init($0.paint.resolved(self: own), $0.location) }).linearGradient)
        case .radial(let center, let stops):
            GeometryReader { geo in
                shape.fill(
                    MetalRadialGradient(center: UnitPoint(x: center.x, y: center.y), stops: stops.map { .init($0.paint.resolved(self: own), $0.location) })
                        .gradient(diameter: max(geo.size.width, geo.size.height))
                )
            }
        }
    }

    var isTranslucent: Bool {
        func clear(_ p: MetalRecipePaint) -> Bool { if case .color(let c) = p { return c.alpha < 1 } else { return false } }
        switch self {
        case .solid(let p): return clear(p)
        case .linear(_, let s), .radial(_, let s): return s.contains { clear($0.paint) }
        }
    }
}

private struct MetalObjectRecipeModifier<S: InsettableShape>: ViewModifier {
    let recipe: MetalObjectRecipe
    let part: String
    let state: String?
    let shape: S
    let own: MetalRGBA?
    @Environment(\.metalColorway) private var colorway

    func body(content: Content) -> some View {
        let cw = MetalRecipeColorway(colorway)
        // a state paints its own layers where it has them, else the rest state's
        let stateFills = recipe.fills(part, state: state, colorway: cw)
        let fills = stateFills.isEmpty ? recipe.fills(part, colorway: cw) : stateFills
        let stateShadows = recipe.shadows(part, state: state, colorway: cw, self: own)
        let shadows = stateShadows.isEmpty ? recipe.shadows(part, colorway: cw, self: own) : stateShadows
        content.background {
            ZStack {
                MetalOuterShadows(layers: shadows.filter { !$0.inset }, shape: shape, excludesInterior: fills.contains(where: \.isTranslucent))
                // CSS paints the first background layer on top
                ForEach(Array(fills.enumerated().reversed()), id: \.offset) { _, fill in
                    fill.view(in: shape, self: own)
                }
                MetalInnerShadows(layers: shadows.filter(\.inset), shape: shape)
            }
            .allowsHitTesting(false)
        }
    }
}

extension View {
    /// Paints one part of an object recipe (tokens.json `recipes`) behind the view, in `shape`:
    /// outer shadows, the fill layers, inner shadows, in the environment colorway.
    public func metalObjectRecipe<S: InsettableShape>(_ recipe: MetalObjectRecipe, part: String, state: String? = nil, in shape: S, self own: MetalRGBA? = nil) -> some View {
        modifier(MetalObjectRecipeModifier(recipe: recipe, part: part, state: state, shape: shape, own: own))
    }
}

extension Double {
    /// Full opacity or scale, for call sites that must not carry literals.
    public static let one: Double = 1
}
