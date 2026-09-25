import SwiftUI

/// The cord's geometry on the 400-unit gadget canvas, the same maths as parts/cable.ts.
public enum MetalCableGeometry {
    /// A cubic whose two handles both drop k reaches 3/4·k at its middle.
    static let middle = 0.75
    /// Arc length of a shallow parabola: d + 8s²/3d, solved for the droop s.
    static let parabola = 3.0 / 8.0

    /// How far a cord droops at its middle: set outright, from its length (a hanging cable, or a U when
    /// the ends are close), or a share of the distance.
    public static func sag(from: CGPoint, to: CGPoint, sag: Double? = nil, length: Double? = nil) -> Double {
        if let sag { return max(0, sag) }
        let d = hypot(to.x - from.x, to.y - from.y)
        if let length {
            let spare = max(0, length - d)
            return max((parabola * d * spare).squareRoot(), spare / 2)
        }
        let s = MetalGadgetTokens.cableSag
        return min(s.max, max(s.min, s.share * d))
    }

    /// The two handles: they leave the ends along the run and drop under gravity.
    public static func controls(from: CGPoint, to: CGPoint, sag: Double) -> (CGPoint, CGPoint) {
        let dx = to.x - from.x, k = sag / middle, h = MetalGadgetTokens.cableHandle
        return (CGPoint(x: from.x + h * dx, y: from.y + k), CGPoint(x: to.x - h * dx, y: to.y + k))
    }
}

/// The cord's path. Only its handles animate: the ends are held (by a hand or a plug) and go at once,
/// while the belly follows on the spring.
struct MetalCableShape: Shape {
    var from: CGPoint
    var to: CGPoint
    var c1: CGPoint
    var c2: CGPoint

    var animatableData: AnimatablePair<AnimatablePair<CGFloat, CGFloat>, AnimatablePair<CGFloat, CGFloat>> {
        get { AnimatablePair(AnimatablePair(c1.x, c1.y), AnimatablePair(c2.x, c2.y)) }
        set { c1 = CGPoint(x: newValue.first.first, y: newValue.first.second); c2 = CGPoint(x: newValue.second.first, y: newValue.second.second) }
    }

    func path(in rect: CGRect) -> Path {
        let unit = rect.width / MetalGadgetTokens.canvas
        let scale = { (p: CGPoint) in CGPoint(x: p.x * unit, y: p.y * unit) }
        return Path { p in p.move(to: scale(from)); p.addCurve(to: scale(to), control1: scale(c1), control2: scale(c2)) }
    }
}

/// A rubber patch cord between two plugs, drooping under gravity: its shadow, the rubber body, its
/// darker underside and a sheen toward the light. The SwiftUI twin of `Cable` (parts/cable.ts).
public struct MetalCable: View {
    let from: CGPoint
    let to: CGPoint
    let sag: Double?
    let length: Double?
    let color: MetalOklch
    let size: Double
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(from: CGPoint, to: CGPoint, sag: Double? = nil, length: Double? = nil, color: MetalOklch? = nil, size: Double = 160) {
        let rubber = MetalGadgetTokens.cableRubber
        self.from = from; self.to = to; self.sag = sag; self.length = length; self.size = size
        self.color = color ?? MetalOklch(L: rubber.L, C: rubber.C, H: MetalSoundMaterial.rubber.finish.sampleHue)
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, w = MetalGadgetTokens.cableWidth * unit
        let droop = MetalCableGeometry.sag(from: from, to: to, sag: sag, length: length)
        let (c1, c2) = MetalCableGeometry.controls(from: from, to: to, sag: droop)
        let shape = MetalCableShape(from: from, to: to, c1: c1, c2: c2)
        let sh = MetalGadgetTokens.cableShadow, un = MetalGadgetTokens.cableShade, hi = MetalGadgetTokens.cableSheen
        let round = { (width: Double) in StrokeStyle(lineWidth: width, lineCap: .round) }
        ZStack {
            shape.stroke(MetalGadgetLighting.shadow.opacity(sh.alpha), style: round(w))
                .offset(x: w * sh.dx, y: w * sh.dy).blur(radius: w * sh.blur)
            shape.stroke(MetalPigment.color(lightness: color.L, chroma: color.C, hue: color.H), style: round(w))
            shape.stroke(MetalPigment.color(lightness: color.L - un.drop, chroma: color.C, hue: color.H), style: round(w * un.width))
                .offset(x: w * un.dx, y: w * un.dy)
            shape.stroke(Color.white.opacity(hi.alpha), style: round(w * hi.width))
                .offset(x: w * hi.dx, y: w * hi.dy)
        }
        .frame(width: size, height: size)
        .animation(reduceMotion ? nil : MetalGadgetTokens.cableSpring.animation, value: [c1.x, c1.y, c2.x, c2.y])
        .accessibilityElement()
        .accessibilityLabel("cable")
    }
}
