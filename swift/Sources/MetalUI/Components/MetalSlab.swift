import SwiftUI

/// A cut through a slab, on the 400-unit gadget canvas.
public struct MetalSlabCut: Sendable, Hashable {
    public enum Kind: String, Sendable { case slot, hole, tray, well }
    public let kind: Kind
    public let at: CGPoint
    public let size: CGSize
    public let depth: Double?
    public let radius: Double?

    public init(_ kind: Kind, at: (Double, Double), size: (Double, Double), depth: Double? = nil, radius: Double? = nil) {
        self.kind = kind; self.at = CGPoint(x: at.0, y: at.1); self.size = CGSize(width: size.0, height: size.1); self.depth = depth; self.radius = radius
    }

    /// The cut's outline (canvas units): a slot is a capsule, a hole a circle, a tray or well a rounded rect.
    var path: CGPath {
        let rect = CGRect(x: at.x - size.width / 2, y: at.y - size.height / 2, width: size.width, height: size.height)
        switch kind {
        case .hole:
            let r = min(size.width, size.height) / 2
            return CGPath(ellipseIn: CGRect(x: at.x - r, y: at.y - r, width: 2 * r, height: 2 * r), transform: nil)
        case .slot:
            let r = min(size.width, size.height) / 2
            return CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)
        case .tray, .well:
            let r = min(radius ?? MetalGadgetTokens.trayRadius * (kind == .well ? 1.4 : 1), min(size.width, size.height) / 2)
            return CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil)
        }
    }
}

/// The thick panel a gadget is cut from: a material lit by the one light, with cuts whose floors are
/// its own material in shadow, a shaded top wall and a lit lower lip. The SwiftUI twin of `Slab`.
public struct MetalSlab<Content: View>: View {
    let material: MetalSoundMaterial
    let color: MetalOklch
    let cuts: [MetalSlabCut]
    let size: Double
    /// The body's rectangle on the 400-unit canvas (default the standard body).
    let rect: CGRect
    let content: Content
    @Environment(\.displayScale) private var displayScale
    @Environment(\.metalColorway) private var colorway
    @Environment(\.colorSchemeContrast) private var contrast

    public init(_ material: MetalSoundMaterial, color: MetalOklch? = nil, cuts: [MetalSlabCut] = [], rect: CGRect? = nil, size: Double = 160, @ViewBuilder content: () -> Content = { EmptyView() }) {
        let b = MetalGadgetTokens.bodyRect
        self.rect = rect ?? CGRect(x: b.x, y: b.y, width: b.width, height: b.height)
        let f = material.finish
        self.material = material
        self.color = color ?? MetalOklch(L: min(f.lightness.1, max(f.lightness.0, 0.72)), C: min(f.chromaCap, 0.06), H: f.sampleHue)
        self.cuts = cuts; self.size = size; self.content = content()
    }

    private var slabPath: CGPath {
        // Corners scale with the body's shorter side, as the web's slabPath.
        let radius = MetalGadgetTokens.bodyRadius * min(rect.width, rect.height) / MetalGadgetTokens.bodyRect.width
        let path = CGMutablePath()
        path.addRoundedRect(in: rect, cornerWidth: radius, cornerHeight: radius)
        for cut in cuts { path.addPath(cut.path) }
        return path
    }

    /// A cut's floor: the slab's pigment, darker by its depth.
    private func floor(_ cut: MetalSlabCut) -> LinearGradient {
        let depth = cut.depth ?? MetalGadgetTokens.cutDepths[cut.kind.rawValue] ?? 10
        let L = color.L - MetalGadgetTokens.holeFloorDrop - MetalGadgetTokens.holeFloorDepthDrop * depth / 24
        let C = color.C * MetalGadgetTokens.holeFloorChroma
        return LinearGradient(colors: [MetalPigment.color(lightness: L - 0.03, chroma: C, hue: color.H), MetalPigment.color(lightness: L + 0.04, chroma: C, hue: color.H)],
                              startPoint: .top, endPoint: .bottom)
    }

    /// The part of a cut its lower lip lives in: its lower half, a margin wider so the stroke is whole.
    static func lowerHalf(of cut: MetalSlabCut, unit: Double, margin: Double) -> CGRect {
        CGRect(x: (cut.at.x - cut.size.width / 2) * unit - margin, y: cut.at.y * unit + cut.size.height * unit * 0.15,
               width: cut.size.width * unit + margin * 2, height: cut.size.height * unit / 2 + margin * 2)
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, scale = CGAffineTransform(scaleX: unit, y: unit)
        // The lip's clip reaches a little past the cut so its stroke is never cut in half.
        let lipMargin = MetalGadgetTokens.holeLip * 2
        let shade = MetalGadgetLighting.shadow
        ZStack(alignment: .topLeading) {
            // Floors, each with its top wall in shadow.
            ForEach(Array(cuts.enumerated()), id: \.offset) { _, cut in
                let shape = Path(cut.path).applying(scale)
                shape.fill(floor(cut))
                    .overlay(
                        shape.stroke(shade.opacity(MetalGadgetTokens.holeAlpha), lineWidth: MetalGadgetTokens.holeBlur * 2 * unit)
                            .offset(x: MetalGadgetTokens.holeOffset.dx * unit, y: MetalGadgetTokens.holeOffset.dy * unit)
                            .blur(radius: MetalGadgetTokens.holeBlur * unit)
                            .clipShape(shape)
                    )
            }
            if let image = MetalGadgetLighting.surface(slabPath, key: "slab:\(cuts.hashValue):\(rect.debugDescription)", material: material, lightness: color.L, chroma: color.C, hue: color.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway, contrast: contrast == .increased) {
                Image(decorative: image, scale: max(1, displayScale))
            }
            content
            // Lower lips: each cut's outline, stroked light, on its lower half.
            ForEach(Array(cuts.enumerated()), id: \.offset) { _, cut in
                let shape = Path(cut.path).applying(scale)
                let lip = Self.lowerHalf(of: cut, unit: unit, margin: lipMargin)
                shape.stroke(Color.white.opacity(MetalGadgetTokens.holeLipAlpha), lineWidth: MetalGadgetTokens.holeLip * unit)
                    .mask(Rectangle().frame(width: lip.width, height: lip.height).offset(x: lip.minX, y: lip.minY))
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityElement()
        .accessibilityLabel("\(material.rawValue) slab")
    }
}
