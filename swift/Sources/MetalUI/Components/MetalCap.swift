import SwiftUI

/// The fader or knob cap a person moves: a face on its darker side wall, grip ribs or a pointer
/// groove, and its own shadow. Pressed, the face sinks toward the body and the shadow draws in, on
/// the release spring (at once with Reduce Motion). The SwiftUI twin of `Cap` (parts/cap.ts).
public struct MetalCap: View {
    public enum Shape: String, Sendable { case fader, knob }
    public enum Layer: Sendable { case both, body, shadow }
    let shape: Shape
    let ribs: Int
    let color: MetalOklch
    let material: MetalSoundMaterial
    let pressed: Bool
    let size: Double
    let layer: Layer
    let accent: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(shape: Shape = .fader, ribs: Int = MetalGadgetTokens.capRibs, accent: Bool = false, material: MetalSoundMaterial = .clay,
                color: MetalOklch? = nil, pressed: Bool = false, size: Double = 96, layer: Layer = .both) {
        let warm = MetalGadgetFeelTokens.accentWarm, hue = MetalSoundMaterial.clay.finish.sampleHue
        self.shape = shape; self.ribs = ribs; self.accent = accent; self.material = material; self.pressed = pressed; self.size = size; self.layer = layer
        self.color = color ?? (accent ? MetalOklch(L: warm.L, C: warm.C, H: warm.H)
            : material == .ceramic ? MetalOklch(L: MetalGadgetTokens.capCeramic.L, C: MetalGadgetTokens.capCeramic.C, H: hue)
            : MetalOklch(L: MetalGadgetTokens.plugFaceClay, C: MetalGadgetTokens.plugFaceChroma, H: hue))
    }

    /// The face on the 400-unit canvas, as the React Part draws it alone.
    private var face: CGRect {
        let c = MetalGadgetTokens.canvas / 2, sizes = MetalGadgetTokens.partSizes["cap"] ?? (60, 44)
        let W0 = MetalGadgetTokens.capAlone, H = W0 * sizes.1 / sizes.0, W = shape == .knob ? H : W0
        return CGRect(x: c - W / 2, y: c - H / 2, width: W, height: H)
    }
    /// Every length on a cap is at the Part's own size (60 × 44); a bigger cap scales them all.
    private var k: Double { face.height / (MetalGadgetTokens.partSizes["cap"]?.1 ?? face.height) }
    private var radius: Double { shape == .knob ? face.height / 2 : min(MetalGadgetTokens.capRadius * k, face.height / 2) }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, f = face, r = radius, H = f.height
        let sh = MetalGadgetTokens.capShadow, sink = pressed ? MetalGadgetTokens.capPress * k : 0, near = pressed ? MetalGadgetTokens.capPressShadow : 1
        let gi = MetalGadgetTokens.capGrooveInk, ei = MetalGadgetTokens.capEdgeInk
        let groove = MetalPigment.color(lightness: max(gi.floor, color.L - gi.drop), chroma: min(gi.max, color.C * gi.gain + gi.add), hue: color.H)
        let edge = MetalPigment.color(lightness: min(1, color.L + ei.lift), chroma: color.C * ei.chroma, hue: color.H)
        let outline = RoundedRectangle(cornerRadius: r * unit, style: .continuous)
        ZStack(alignment: .topLeading) {
            if layer != .body {
                outline.fill(MetalGadgetLighting.shadow.opacity(sh.alpha))
                    .frame(width: f.width * unit, height: H * unit).blur(radius: H * sh.blur * unit)
                    .position(x: (f.midX + H * sh.dx * near) * unit, y: (f.midY + H * sh.dy * near) * unit)
            }
            if layer != .shadow {
                outline.fill(MetalPigment.color(lightness: color.L - MetalGadgetTokens.capSideDrop, chroma: color.C, hue: color.H))
                    .frame(width: f.width * unit, height: H * unit)
                    .position(x: f.midX * unit, y: (f.midY + MetalGadgetTokens.capSide * k) * unit)
                ZStack(alignment: .topLeading) {
                    if let image = MetalGadgetLighting.surface(CGPath(roundedRect: f, cornerWidth: r, cornerHeight: r, transform: nil), key: "cap-\(shape.rawValue)",
                                                               material: material, lightness: color.L, chroma: color.C, hue: color.H,
                                                               size: size, scale: max(1, displayScale), colorway: colorway) {
                        Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
                    }
                    marks(unit: unit, groove: groove, edge: edge)
                }
                .offset(y: sink * unit)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .animation(reduceMotion ? nil : MetalGadgetTokens.capPressSpring.animation, value: pressed)
        .accessibilityElement()
        .accessibilityLabel("\(shape.rawValue) cap\(accent ? " (accent)" : "")")
    }

    @ViewBuilder private func marks(unit: Double, groove: Color, edge: Color) -> some View {
        let f = face, k = self.k, e = MetalGadgetTokens.capEdge, g = MetalGadgetTokens.capGroove
        if shape == .fader {
            let half = f.width * MetalGadgetTokens.capSpan / 2
            let ys = (0..<ribs).map { f.midY + (Double($0) - Double(ribs - 1) / 2) * MetalGadgetTokens.capPitch * k }
            Path { p in for y in ys { p.move(to: CGPoint(x: (f.midX - half) * unit, y: y * unit)); p.addLine(to: CGPoint(x: (f.midX + half) * unit, y: y * unit)) } }
                .stroke(groove.opacity(g.alpha), style: StrokeStyle(lineWidth: g.width * k * unit, lineCap: .round))
            Path { p in for y in ys { p.move(to: CGPoint(x: (f.midX - half) * unit, y: (y + e.dy * k) * unit)); p.addLine(to: CGPoint(x: (f.midX + half) * unit, y: (y + e.dy * k) * unit)) } }
                .stroke(edge.opacity(e.alpha), style: StrokeStyle(lineWidth: e.width * k * unit, lineCap: .round))
        } else {
            let r = radius, pt = MetalGadgetTokens.capPointer, scale = MetalGadgetTokens.capPointerScale
            Path { p in p.move(to: CGPoint(x: f.midX * unit, y: (f.midY - r * pt.to) * unit)); p.addLine(to: CGPoint(x: f.midX * unit, y: (f.midY - r * pt.from) * unit)) }
                .stroke(groove.opacity(g.alpha * scale), style: StrokeStyle(lineWidth: g.width * scale * k * unit, lineCap: .round))
            Path { p in
                p.move(to: CGPoint(x: (f.midX + e.dy * k / 2) * unit, y: (f.midY - r * pt.to + e.dy * k) * unit))
                p.addLine(to: CGPoint(x: (f.midX + e.dy * k / 2) * unit, y: (f.midY - r * pt.from + e.dy * k) * unit))
            }
            .stroke(edge.opacity(e.alpha), style: StrokeStyle(lineWidth: e.width * k * unit, lineCap: .round))
        }
    }
}
