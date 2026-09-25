import SwiftUI

/// Light behind a translucent part, in its own colour fading to nothing at its edge: a glow, a radar
/// beam with a bright leading edge that fades behind it (drawn as the same slices as the web), or a
/// blip. Place it in a `MetalBezel`'s content: it draws on the 400-unit canvas. The twin of `Backlight`.
public struct MetalBacklight: View {
    public enum Shape: String, Sendable { case glow, beam, dot }
    public enum Tint: Sendable { case signal(String), accent, glass(MetalOklch) }
    let shape: Shape
    let tint: Tint
    let alpha: Double
    let heading: Double
    let at: CGPoint
    let diameter: Double
    let size: Double

    /// `at` and `diameter` are on the 400-unit canvas: by default a bezel's glass.
    public init(_ shape: Shape = .glow, color: Tint, alpha: Double = MetalGadgetTokens.backlightAlpha, heading: Double = 0,
                at: CGPoint? = nil, diameter: Double? = nil, size: Double = 160) {
        let r = MetalGadgetTokens.bodyRect, w = MetalGadgetTokens.bezelWidth
        self.shape = shape; self.tint = color; self.alpha = alpha; self.heading = heading; self.size = size
        self.at = at ?? CGPoint(x: r.x + r.width / 2, y: r.y + r.height / 2)
        self.diameter = diameter ?? (min(r.width, r.height) - 2 * w)
    }

    private var color: Color {
        switch tint {
        case .signal(let s):
            let c = (MetalGadgetTokens.lampColors[s] ?? MetalGadgetTokens.lampColors["off"]!).1
            return Color(.sRGB, red: c.0, green: c.1, blue: c.2)
        case .accent:
            let a = MetalGadgetFeelTokens.accentWarm
            return MetalPigment.color(lightness: a.L, chroma: a.C, hue: a.H)
        case .glass(let g):
            return MetalPigment.color(lightness: min(1, g.L + MetalGadgetTokens.backlightGlassLift), chroma: g.C * MetalGadgetTokens.backlightGlassChroma, hue: g.H)
        }
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, R = diameter / 2, c = CGPoint(x: at.x * unit, y: at.y * unit)
        ZStack(alignment: .topLeading) {
            switch shape {
            case .glow, .dot:
                // A glow lights the part it sits in (its diameter); a dot is a blip, its diameter its own.
                let r = shape == .glow ? R * MetalGadgetTokens.backlightGlow * 2 : R
                let core = shape == .dot ? MetalGadgetTokens.backlightDot : 0, span = (r + r) * unit
                Circle()
                    .fill(RadialGradient(stops: [.init(color: .white.opacity(alpha), location: 0), .init(color: color.opacity(alpha), location: core), .init(color: .clear, location: 1)],
                                         center: .center, startRadius: 0, endRadius: r * unit))
                    .frame(width: span, height: span)
                    .position(c)
            case .beam:
                beam(center: c, radius: R * unit)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    /// Slices from the leading edge back, each fainter, and the edge itself a bright line.
    private func beam(center c: CGPoint, radius R: Double) -> some View {
        let n = MetalGadgetTokens.backlightSlices, slice = MetalGadgetTokens.backlightSpread / Double(n), lead = MetalGadgetTokens.backlightLead
        let point = { (deg: Double) in CGPoint(x: c.x + R * cos((deg + heading - 90) * .pi / 180), y: c.y + R * sin((deg + heading - 90) * .pi / 180)) }
        return ZStack {
            ForEach(0..<n, id: \.self) { i in
                let fade = alpha * (1 - Double(i) / Double(n))
                Path { p in
                    p.move(to: c)
                    p.addLine(to: point(-Double(i) * slice))
                    p.addArc(center: c, radius: R, startAngle: .degrees(-Double(i) * slice + heading - 90), endAngle: .degrees(-Double(i + 1) * slice + heading - 90), clockwise: true)
                    p.closeSubpath()
                }
                .fill(color.opacity(fade * MetalGadgetTokens.backlightSliceAlpha))
            }
            Path { p in p.move(to: c); p.addLine(to: point(0)) }
                .stroke(color.opacity(lead.alpha * alpha), style: StrokeStyle(lineWidth: lead.width * size / MetalGadgetTokens.canvas, lineCap: .round))
        }
    }
}
