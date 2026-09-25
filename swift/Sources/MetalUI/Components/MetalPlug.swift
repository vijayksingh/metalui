import SwiftUI

/// A knurled cap that seats in a jack: a face on its darker skirt, grip knurls, a centre boss, an optional
/// cable stub, and its own shadow. The SwiftUI twin of `Plug` (parts/plug.ts), from tokens gadgets.plug.
public struct MetalPlug: View {
    public enum Stub: String, Sendable { case up, left, right, none }
    /// Which layers to draw: a mechanism moves the plug and its shadow separately.
    public enum Layer: Sendable { case both, body, shadow }
    let color: MetalOklch
    let stub: Stub
    let size: Double
    let accent: Bool
    let layer: Layer
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    public init(accent: Bool = false, color: MetalOklch? = nil, stub: Stub = .none, size: Double = 96, layer: Layer = .both) {
        let warm = MetalGadgetFeelTokens.accentWarm
        self.accent = accent
        self.color = color ?? (accent ? MetalOklch(L: warm.L, C: warm.C, H: warm.H) : MetalOklch(L: MetalGadgetTokens.plugFaceClay, C: MetalGadgetTokens.plugFaceChroma, H: MetalSoundMaterial.clay.finish.sampleHue))
        self.stub = stub; self.size = size; self.layer = layer
    }

    private var direction: CGVector {
        switch stub { case .up: return CGVector(dx: 0, dy: -1); case .left: return CGVector(dx: -1, dy: 0); case .right: return CGVector(dx: 1, dy: 0); case .none: return .zero }
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, D = MetalGadgetTokens.plugAlone * unit, R = D / 2
        let sh = MetalGadgetTokens.plugShadow, c = CGPoint(x: size / 2, y: MetalGadgetTokens.plugCentreY * unit)
        let face = CGPath(ellipseIn: CGRect(x: MetalGadgetTokens.canvas / 2 - MetalGadgetTokens.plugAlone / 2 * MetalGadgetTokens.plugFace,
                                             y: MetalGadgetTokens.plugCentreY - MetalGadgetTokens.plugAlone / 2 * MetalGadgetTokens.plugFace,
                                             width: MetalGadgetTokens.plugAlone * MetalGadgetTokens.plugFace, height: MetalGadgetTokens.plugAlone * MetalGadgetTokens.plugFace), transform: nil)
        ZStack(alignment: .topLeading) {
            // Its shadow, a layer of its own.
            if layer != .body {
                Circle().fill(MetalGadgetLighting.shadow.opacity(sh.alpha))
                    .frame(width: D, height: D).blur(radius: R * sh.blur)
                    .position(x: c.x + R * sh.dx, y: c.y + R * sh.dy)
            }
            if layer != .shadow {
            if stub != .none {
                Path { p in
                    p.move(to: CGPoint(x: c.x + direction.dx * R * MetalGadgetTokens.plugStubFrom, y: c.y + direction.dy * R * MetalGadgetTokens.plugStubFrom))
                    p.addLine(to: CGPoint(x: c.x + direction.dx * R * (1 + MetalGadgetTokens.plugStub.length), y: c.y + direction.dy * R * (1 + MetalGadgetTokens.plugStub.length)))
                }
                .stroke(MetalPigment.color(lightness: MetalGadgetTokens.plugStubL, chroma: MetalGadgetTokens.plugStubChroma, hue: color.H),
                        style: StrokeStyle(lineWidth: R * MetalGadgetTokens.plugStub.width, lineCap: .round))
            }
            // The skirt: the plug's side, darker, showing below the face.
            Circle().fill(MetalPigment.color(lightness: color.L - MetalGadgetTokens.plugSkirt, chroma: color.C, hue: color.H))
                .frame(width: D, height: D)
                .position(x: c.x, y: c.y + R * MetalGadgetTokens.plugSide)
            // The face, lit by the one light.
            if let image = MetalGadgetLighting.surface(face, key: "plug-face", material: .clay, lightness: color.L, chroma: color.C, hue: color.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway) {
                Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
            }
            ForEach(0..<MetalGadgetTokens.plugKnurls, id: \.self) { i in
                let span = MetalGadgetTokens.plugKnurl, groove = CGSize(width: R * MetalGadgetTokens.plugKnurlWidth, height: R * (span.1 - span.0))
                Capsule().fill(Color.black.opacity(MetalGadgetTokens.plugKnurlAlpha))
                    .frame(width: groove.width, height: groove.height)
                    .offset(y: -R * (span.0 + span.1) / 2)
                    .rotationEffect(.degrees(Double(i) / Double(MetalGadgetTokens.plugKnurls) * 360))
                    .position(c)
            }
            Circle().fill(MetalPigment.color(lightness: color.L - MetalGadgetTokens.plugBossDrop, chroma: color.C, hue: color.H))
                .frame(width: D * MetalGadgetTokens.plugBoss, height: D * MetalGadgetTokens.plugBoss)
                .position(c)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityElement()
        .accessibilityLabel(accent ? "plug (accent)" : "plug")
    }
}
