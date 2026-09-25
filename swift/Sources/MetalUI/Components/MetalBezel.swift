import SwiftUI

/// An inset gadget's body: a frame in the body's material around an opening, where a glass face sits
/// sunk below it, shaded by the frame's inner wall. `content` is light inside the glass (on the
/// 400-unit canvas), drawn between the glass and its surface. The SwiftUI twin of `Bezel`.
public struct MetalBezel<Content: View>: View {
    public enum Opening: String, Sendable { case round, square }
    let material: MetalSoundMaterial
    let color: MetalOklch
    let glass: MetalOklch
    let opening: Opening
    let width: Double
    let rings: Bool
    let size: Double
    let content: Content
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    public init(_ material: MetalSoundMaterial = .stone, color: MetalOklch? = nil, glass: MetalOklch? = nil, opening: Opening = .round,
                width: Double = MetalGadgetTokens.bezelWidth, rings: Bool = true, size: Double = 160, @ViewBuilder content: () -> Content) {
        let f = material.finish, t = MetalGadgetFeelTokens.self
        self.material = material; self.opening = opening; self.width = width; self.rings = rings; self.size = size; self.content = content()
        self.color = color ?? MetalOklch(L: min(f.lightness.1, max(f.lightness.0, 0.72)), C: min(f.chromaCap, 0.06), H: f.sampleHue)
        self.glass = glass ?? MetalOklch(L: (t.glassFaceLightness.0 + t.glassFaceLightness.1) / 2, C: t.glassFaceChromaCap / 2, H: MetalSoundMaterial.glass.finish.sampleHue)
    }

    private var body0: CGRect { let r = MetalGadgetTokens.bodyRect; return CGRect(x: r.x, y: r.y, width: r.width, height: r.height) }
    /// The opening on the 400-unit canvas: the body less the frame at its narrowest.
    private var hole: CGRect { body0.insetBy(dx: width, dy: width) }
    private func openingPath(_ r: CGRect) -> CGPath {
        opening == .round ? CGPath(ellipseIn: r, transform: nil)
            : CGPath(roundedRect: r, cornerWidth: r.width * MetalGadgetTokens.bezelOpeningRadius, cornerHeight: r.width * MetalGadgetTokens.bezelOpeningRadius, transform: nil)
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, h = hole, R = h.width / 2
        let shape = MetalGadgetOpeningShape(path: openingPath(h), unit: unit)
        let d = MetalGadgetTokens.glassDepth, ink = MetalGadgetTokens.capGrooveInk
        let centre = MetalPigment.color(lightness: min(1, glass.L + d.centre), chroma: glass.C * 0.8, hue: glass.H)
        let rim = MetalPigment.color(lightness: glass.L - d.rim, chroma: min(0.14, glass.C * 1.2), hue: glass.H)
        let line = MetalPigment.color(lightness: max(ink.floor, glass.L - ink.drop), chroma: min(ink.max, glass.C * ink.gain + ink.add), hue: glass.H)
        let g = MetalGadgetTokens.glassGlare, rimShade = MetalGadgetTokens.glassRim
        ZStack(alignment: .topLeading) {
            // The face, sunk: glass, the light in it, its surface.
            ZStack(alignment: .topLeading) {
                shape.fill(RadialGradient(colors: [centre, rim], center: UnitPoint(x: (h.minX + h.width * 0.44) / MetalGadgetTokens.canvas, y: (h.minY + h.height * 0.4) / MetalGadgetTokens.canvas),
                                          startRadius: 0, endRadius: h.width * 0.62 * unit))
                content.frame(width: size, height: size, alignment: .topLeading).clipShape(shape)
                if rings {
                    ForEach(MetalGadgetTokens.glassRings, id: \.self) { k in
                        Circle().stroke(line.opacity(MetalGadgetTokens.glassLine.alpha), lineWidth: MetalGadgetTokens.glassLine.width * unit)
                            .frame(width: h.width * k * unit, height: h.width * k * unit).position(x: h.midX * unit, y: h.midY * unit)
                    }
                    Path { p in
                        p.move(to: CGPoint(x: h.minX * unit, y: h.midY * unit)); p.addLine(to: CGPoint(x: h.maxX * unit, y: h.midY * unit))
                        p.move(to: CGPoint(x: h.midX * unit, y: h.minY * unit)); p.addLine(to: CGPoint(x: h.midX * unit, y: h.maxY * unit))
                    }
                    .stroke(line.opacity(MetalGadgetTokens.glassCross), lineWidth: MetalGadgetTokens.glassLine.width * unit)
                    .clipShape(shape)
                }
                shape.fill(RadialGradient(colors: [.clear, .black.opacity(rimShade.alpha)], center: .init(x: h.midX / MetalGadgetTokens.canvas, y: h.midY / MetalGadgetTokens.canvas),
                                          startRadius: R * (1 - rimShade.width * 2) * unit, endRadius: R * unit))
                Ellipse().fill(RadialGradient(colors: [.white.opacity(g.alpha), .clear], center: .center, startRadius: 0, endRadius: R * g.width * unit))
                    .frame(width: h.width * g.width * unit, height: h.width * g.height * unit)
                    .position(x: (h.minX + 2 * R * g.cx) * unit, y: (h.minY + 2 * R * g.cy) * unit)
                    .clipShape(shape)
                // The frame's top wall shades the face, as any cut's does.
                shape.stroke(MetalGadgetLighting.shadow.opacity(MetalGadgetTokens.holeAlpha), lineWidth: MetalGadgetTokens.holeBlur * 2 * unit)
                    .offset(x: MetalGadgetTokens.holeOffset.dx * unit, y: MetalGadgetTokens.holeOffset.dy * unit)
                    .blur(radius: MetalGadgetTokens.holeBlur * unit).clipShape(shape)
            }
            // The frame, lit by the one light.
            if let image = MetalGadgetLighting.surface(framePath, key: "bezel-\(opening.rawValue)-\(Int(width))", material: material,
                                                       lightness: color.L, chroma: color.C, hue: color.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway) {
                Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityElement()
        .accessibilityLabel("\(material.rawValue) bezel with a glass face")
    }

    private var framePath: CGPath {
        let path = CGMutablePath()
        path.addRoundedRect(in: body0, cornerWidth: MetalGadgetTokens.bodyRadius, cornerHeight: MetalGadgetTokens.bodyRadius)
        path.addPath(openingPath(hole))
        return path
    }
}

/// An opening's outline as a shape, on the 400-unit canvas scaled by `unit`.
struct MetalGadgetOpeningShape: Shape {
    let outline: Path
    init(path: CGPath, unit: Double) { outline = Path(path).applying(CGAffineTransform(scaleX: unit, y: unit)) }
    func path(in rect: CGRect) -> Path { outline }
}

extension MetalBezel where Content == EmptyView {
    /// A bezel with nothing glowing in its glass.
    public init(_ material: MetalSoundMaterial = .stone, color: MetalOklch? = nil, glass: MetalOklch? = nil, opening: Opening = .round,
                width: Double = MetalGadgetTokens.bezelWidth, rings: Bool = true, size: Double = 160) {
        self.init(material, color: color, glass: glass, opening: opening, width: width, rings: rings, size: size) { EmptyView() }
    }
}
