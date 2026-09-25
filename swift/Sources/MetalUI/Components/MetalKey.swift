import SwiftUI

/// A big key standing on its skirt, the Keycap as a gadget draws it: a lit face with an engraved glyph
/// on a darker skirt, and its own shadow. Pressed, the face drops into the skirt and spreads a little,
/// on the release spring (at once with Reduce Motion, where it still dips). The twin of `Key`.
public struct MetalKey: View {
    public enum Layer: Sendable { case both, body, shadow }
    let glyph: String?
    let color: MetalOklch
    let material: MetalSoundMaterial
    let pressed: Bool
    let size: Double
    let layer: Layer
    let accent: Bool
    /// A face offset from outside (a mechanism's pose), on top of `pressed`.
    let facePose: MetalMechanismPose
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(glyph: String? = nil, accent: Bool = false, material: MetalSoundMaterial = .clay, color: MetalOklch? = nil,
                pressed: Bool = false, size: Double = 96, layer: Layer = .both, facePose: MetalMechanismPose = .rest) {
        let warm = MetalGadgetFeelTokens.accentWarm, hue = MetalSoundMaterial.clay.finish.sampleHue
        self.glyph = glyph; self.accent = accent; self.material = material; self.pressed = pressed; self.size = size; self.layer = layer; self.facePose = facePose
        self.color = color ?? (accent ? MetalOklch(L: warm.L, C: warm.C, H: warm.H)
            : material == .ceramic ? MetalOklch(L: MetalGadgetTokens.capCeramic.L, C: MetalGadgetTokens.capCeramic.C, H: hue)
            : MetalOklch(L: MetalGadgetTokens.plugFaceClay, C: MetalGadgetTokens.plugFaceChroma, H: hue))
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, c = MetalGadgetTokens.canvas / 2, S = MetalGadgetTokens.keyAlone
        let native = MetalGadgetTokens.partSizes["key"]?.0 ?? S, k = S / native
        let F = S * MetalGadgetTokens.keyFace.share, fy = c - S * MetalGadgetTokens.keyFaceLift
        let sh = MetalGadgetTokens.keyShadow, press = MetalGadgetTokens.keyPress
        let gi = MetalGadgetTokens.capGrooveInk, ei = MetalGadgetTokens.capEdgeInk
        let ink = MetalPigment.color(lightness: max(gi.floor, color.L - gi.drop), chroma: min(gi.max, color.C * gi.gain + gi.add), hue: color.H)
        let lit = MetalPigment.color(lightness: min(1, color.L + ei.lift), chroma: color.C * ei.chroma, hue: color.H)
        let dy = (pressed ? press.dy * k : 0) + facePose.y * k, sx = (pressed ? press.sx : 1) * facePose.sx, sy = (pressed ? press.sy : 1) * facePose.sy
        let skirt = CGRect(x: c - S / 2, y: c - S / 2, width: S, height: S), faceRect = CGRect(x: c - F / 2, y: fy - F / 2, width: F, height: F)
        ZStack(alignment: .topLeading) {
            if layer != .body {
                RoundedRectangle(cornerRadius: S * MetalGadgetTokens.keyRadius * unit, style: .continuous)
                    .fill(MetalGadgetLighting.shadow.opacity(sh.alpha))
                    .frame(width: S * unit, height: S * unit).blur(radius: S * sh.blur * unit)
                    .position(x: (c + S * sh.dx) * unit, y: (c + S * sh.dy) * unit)
            }
            if layer != .shadow {
                if let image = MetalGadgetLighting.surface(CGPath(roundedRect: skirt, cornerWidth: S * MetalGadgetTokens.keyRadius, cornerHeight: S * MetalGadgetTokens.keyRadius, transform: nil),
                                                           key: "key-skirt", material: material, lightness: color.L - MetalGadgetTokens.keySkirtDrop,
                                                           chroma: color.C, hue: color.H, size: size, scale: max(1, displayScale), colorway: colorway) {
                    Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
                }
                ZStack(alignment: .topLeading) {
                    if let image = MetalGadgetLighting.surface(CGPath(roundedRect: faceRect, cornerWidth: F * MetalGadgetTokens.keyFace.radius, cornerHeight: F * MetalGadgetTokens.keyFace.radius, transform: nil),
                                                               key: "key-face", material: material, lightness: color.L, chroma: color.C, hue: color.H,
                                                               size: size, scale: max(1, displayScale), colorway: colorway) {
                        Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
                    }
                    if let glyph {
                        let font = Font.system(size: F * MetalGadgetTokens.keyGlyph * unit, weight: .medium)
                        Text(glyph).font(font).foregroundStyle(lit.opacity(MetalGadgetTokens.keyGlyphAlpha.edge))
                            .position(x: c * unit, y: (fy + MetalGadgetTokens.keyGlyphEdge * k) * unit)
                        Text(glyph).font(font).foregroundStyle(ink.opacity(MetalGadgetTokens.keyGlyphAlpha.ink))
                            .position(x: c * unit, y: fy * unit)
                    }
                }
                .frame(width: size, height: size, alignment: .topLeading)
                .scaleEffect(x: sx, y: sy, anchor: UnitPoint(x: 0.5, y: fy / MetalGadgetTokens.canvas))
                .offset(y: dy * unit)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .animation(reduceMotion ? nil : MetalGadgetTokens.capPressSpring.animation, value: pressed)
        .accessibilityElement()
        .accessibilityLabel("key\(glyph.map { " \($0)" } ?? "")\(accent ? " (accent)" : "")")
    }
}
