import SwiftUI

/// A numbered wheel seen through a window: a strip of digits on a cylinder that wraps from 9 into 0,
/// shaded where it turns away, with a glint on its upper curve. `value` is the digit in the window, a
/// real number from 0 to 10, so it can stand between two digits while it rolls. The twin of `Drum`.
public struct MetalDrum: View {
    public enum Face: String, Sendable { case ceramic, clay }
    let value: Double
    let color: MetalOklch
    let ticks: Bool
    let size: Double
    let width: Double
    let accent: Bool

    /// `width` is the drum's width on the 400-unit canvas (default: drawn by itself).
    public init(value: Double = 0, accent: Bool = false, face: Face = .ceramic, color: MetalOklch? = nil, ticks: Bool = false,
                width: Double = MetalGadgetTokens.drumAlone, size: Double = 96) {
        let warm = MetalGadgetFeelTokens.accentWarm, hue = MetalSoundMaterial.clay.finish.sampleHue
        self.value = value; self.accent = accent; self.ticks = ticks; self.width = width; self.size = size
        self.color = color ?? (accent ? MetalOklch(L: warm.L, C: warm.C, H: warm.H)
            : face == .ceramic ? MetalOklch(L: MetalGadgetTokens.capCeramic.L, C: MetalGadgetTokens.capCeramic.C, H: hue)
            : MetalOklch(L: MetalGadgetTokens.plugFaceClay, C: MetalGadgetTokens.plugFaceChroma, H: hue))
    }

    public var body: some View {
        let native = MetalGadgetTokens.partSizes["drum"] ?? (52, 88), unit = size / MetalGadgetTokens.canvas
        let W = width * unit, H = width * native.1 / native.0 * unit, k = H / (native.1 * unit), P = MetalGadgetTokens.drumPitch * k * unit
        let gi = MetalGadgetTokens.capGrooveInk
        let ink = MetalPigment.color(lightness: max(gi.floor, color.L - gi.drop), chroma: min(gi.max, color.C * gi.gain + gi.add), hue: color.H)
        let wrapped = (value.truncatingRemainder(dividingBy: 10) + 10).truncatingRemainder(dividingBy: 10)
        let shape = RoundedRectangle(cornerRadius: MetalGadgetTokens.drumRadius * k * unit, style: .continuous)
        let sh = MetalGadgetTokens.drumShade, e = MetalGadgetTokens.drumEdge, g = MetalGadgetTokens.drumGlint
        ZStack {
            shape.fill(MetalPigment.color(lightness: color.L, chroma: color.C, hue: color.H))
            // The strip: 8 and 9 above 0, 0 and 1 below 9, so the wrap never shows an end.
            ZStack {
                ForEach(-2..<12, id: \.self) { i in
                    Text(ticks ? "–" : "\(((i % 10) + 10) % 10)")
                        .font(.system(size: P * MetalGadgetTokens.drumGlyph, weight: .semibold, design: .monospaced))
                        .foregroundStyle(ink)
                        .offset(y: Double(i) * P)
                }
            }
            .offset(y: -wrapped * P)
            .frame(width: W, height: H)
            .clipShape(shape)
            shape.fill(LinearGradient(stops: [.init(color: .black.opacity(sh.top), location: 0), .init(color: .clear, location: e),
                                              .init(color: .clear, location: 1 - e), .init(color: .black.opacity(sh.bottom), location: 1)],
                                      startPoint: .top, endPoint: .bottom))
            Rectangle().fill(.white.opacity(g.alpha)).frame(width: W, height: H * g.width)
                .offset(y: H * g.at - H / 2 + H * g.width / 2).clipShape(shape)
        }
        .frame(width: W, height: H)
        .frame(width: size, height: size)
        .accessibilityElement()
        .accessibilityLabel("drum showing \(Int(wrapped.rounded()) % 10)")
    }
}
