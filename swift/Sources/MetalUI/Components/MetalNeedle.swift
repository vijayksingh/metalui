import SwiftUI

/// A tapered pointer on a pivot cap over a scale printed on glass, with a zone past its threshold.
/// Place it in a `MetalBezel`'s content: it draws on the 400-unit canvas. `value` (0 to 1) turns it.
/// The twin of `Needle` (parts/needle.ts).
public struct MetalNeedle: View {
    let value: Double
    let arc: Double
    let ticks: Int
    let threshold: Double?
    let length: Double
    let pivot: CGPoint
    let color: MetalOklch
    let glass: MetalOklch
    let size: Double

    public init(value: Double = 0.5, arc: Double = 120, ticks: Int = 9, threshold: Double? = nil, length: Double? = nil,
                at pivot: CGPoint = CGPoint(x: 200, y: 222), color: MetalOklch? = nil, glass: MetalOklch, size: Double = 160) {
        let warm = MetalGadgetFeelTokens.accentWarm
        self.value = value; self.arc = arc; self.ticks = ticks; self.threshold = threshold; self.pivot = pivot; self.glass = glass; self.size = size
        self.length = length ?? MetalGadgetTokens.partSizes["needle"]?.0 ?? 96
        self.color = color ?? MetalOklch(L: warm.L, C: warm.C, H: warm.H)
    }

    /// The needle's rotation for a value: the arc's left end at 0, straight up at a half, its right end at 1.
    public static func angle(_ value: Double, arc: Double) -> Double { (value - 0.5) * arc }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, L = length, k = L / (MetalGadgetTokens.partSizes["needle"]?.0 ?? L)
        let c = CGPoint(x: pivot.x * unit, y: pivot.y * unit)
        let gi = MetalGadgetTokens.capGrooveInk
        let ink = MetalPigment.color(lightness: max(gi.floor, glass.L - gi.drop), chroma: min(gi.max, glass.C * gi.gain + gi.add), hue: glass.H)
        let point = { (deg: Double, r: Double) in CGPoint(x: c.x + r * unit * cos((deg - 90) * .pi / 180), y: c.y + r * unit * sin((deg - 90) * .pi / 180)) }
        let sc = MetalGadgetTokens.needleScale, line = MetalGadgetTokens.needleLine, sh = MetalGadgetTokens.needleShadow
        let bw = MetalGadgetTokens.needleWidth.base * k / 2, tw = MetalGadgetTokens.needleWidth.tip * k / 2, tail = L * MetalGadgetTokens.needleTail
        let pointer = Path { p in
            p.move(to: CGPoint(x: c.x - bw * unit, y: c.y + tail * unit)); p.addLine(to: CGPoint(x: c.x - tw * unit, y: c.y - L * unit))
            p.addLine(to: CGPoint(x: c.x + tw * unit, y: c.y - L * unit)); p.addLine(to: CGPoint(x: c.x + bw * unit, y: c.y + tail * unit)); p.closeSubpath()
        }
        let turn = Self.angle(value, arc: arc), metal = MetalGadgetTokens.jackMetal, r = MetalGadgetTokens.needleCap * k * unit
        ZStack(alignment: .topLeading) {
            // The scale, printed on the glass.
            ForEach(0..<ticks, id: \.self) { i in
                let deg = Self.angle(Double(i) / Double(ticks - 1), arc: arc), major = i % MetalGadgetTokens.needleMajor == 0
                Path { p in p.move(to: point(deg, L * (major ? sc.major : sc.inner))); p.addLine(to: point(deg, L * sc.outer)) }
                    .stroke(ink.opacity(line.alpha), style: StrokeStyle(lineWidth: line.width * k * unit * (major ? MetalGadgetTokens.needleMajorWidth : 1), lineCap: .round))
            }
            if let threshold {
                let z = MetalGadgetTokens.needleZone, band = MetalGadgetTokens.lampColors["waiting"]!.1
                Path { p in p.addArc(center: c, radius: L * (z.inner + z.outer) / 2 * unit, startAngle: .degrees(Self.angle(threshold, arc: arc) - 90), endAngle: .degrees(Self.angle(1, arc: arc) - 90), clockwise: false) }
                    .stroke(Color(.sRGB, red: band.0, green: band.1, blue: band.2).opacity(z.alpha), lineWidth: L * (z.outer - z.inner) * unit)
            }
            // The pointer and its shadow, turned about the pivot.
            ZStack(alignment: .topLeading) {
                pointer.fill(MetalGadgetLighting.shadow.opacity(sh.alpha)).offset(x: sh.dx * k * unit, y: sh.dy * k * unit).blur(radius: sh.blur * k * unit)
                pointer.fill(MetalPigment.color(lightness: color.L, chroma: color.C, hue: color.H))
            }
            .rotationEffect(.degrees(turn), anchor: UnitPoint(x: pivot.x / MetalGadgetTokens.canvas, y: pivot.y / MetalGadgetTokens.canvas))
            // The pivot cap.
            let span = r + r
            Circle().fill(MetalGadgetLighting.shadow.opacity(sh.alpha)).frame(width: span, height: span).blur(radius: sh.blur * k * unit)
                .position(x: c.x + sh.dx * k * unit * MetalGadgetTokens.needleCapShadow, y: c.y + sh.dy * k * unit * MetalGadgetTokens.needleCapShadow)
            Circle().fill(RadialGradient(colors: [MetalPigment.color(lightness: min(1, metal.L + MetalGadgetTokens.needleCrown), chroma: metal.C, hue: metal.H),
                                                  MetalPigment.color(lightness: metal.L, chroma: metal.C, hue: metal.H)],
                                         center: UnitPoint(x: 0.38, y: 0.32), startRadius: 0, endRadius: r * 1.4))
                .frame(width: span, height: span).position(c)
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityHidden(true)
    }
}
