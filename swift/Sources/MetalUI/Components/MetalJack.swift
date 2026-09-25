import SwiftUI

/// A knurled satin-steel nut around a socket, where a plug seats; lit, a lamp glows in the socket.
/// The SwiftUI twin of `Jack` (parts/jack.ts), from the same tokens (gadgets.jack).
public struct MetalJack: View {
    public enum Lit: String, Sendable { case live, link, waiting, failed }
    let lit: Lit?
    let knurls: Int
    let size: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    /// The nut on the 400-unit canvas: its outline and its socket (even-odd, so the socket is a hole).
    private var nutPath: CGPath {
        let c = MetalGadgetTokens.canvas / 2, R = MetalGadgetTokens.jackNut / 2, r = R * MetalGadgetTokens.jackHole
        let path = CGMutablePath()
        path.addEllipse(in: CGRect(x: c - R, y: c - R, width: 2 * R, height: 2 * R))
        path.addEllipse(in: CGRect(x: c - r, y: c - r, width: 2 * r, height: 2 * r))
        return path
    }

    public init(lit: Lit? = nil, knurls: Int = Int(MetalGadgetTokens.jackKnurls), size: Double = 96) {
        self.lit = lit; self.knurls = knurls; self.size = size
    }

    private var lamp: [Color] {
        switch lit {
        case .live: return [MetalShared.green.color, MetalShared.greenDeep.color]
        case .link: return [MetalShared.blue.color.opacity(MetalGadgetTokens.holeLipAlpha), MetalShared.blue.color]
        case .waiting: return [MetalShared.warning.color, MetalShared.warning.color]
        case .failed: return [MetalShared.red.color, MetalShared.red.color]
        case nil: return []
        }
    }

    public var body: some View {
        // The nut spans 260 of the 400-unit canvas, as the React Part draws it.
        let unit = size / MetalGadgetTokens.canvas, outer = MetalGadgetTokens.jackNut * unit, inner = outer * MetalGadgetTokens.jackHole
        ZStack {
            // The socket: dark steel, its top wall in shadow, a lamp at the bottom when lit.
            Circle().fill(MetalPigment.color(lightness: MetalGadgetTokens.jackFloor, chroma: MetalGadgetTokens.jackMetal.C, hue: MetalGadgetTokens.jackMetal.H))
                .frame(width: inner, height: inner)
                .overlay(Circle().stroke(MetalGadgetLighting.shadow.opacity(MetalGadgetTokens.holeAlpha), lineWidth: MetalGadgetTokens.holeBlur * 2 * unit)
                    .offset(x: MetalGadgetTokens.holeOffset.dx * unit, y: MetalGadgetTokens.holeOffset.dy * unit)
                    .blur(radius: MetalGadgetTokens.holeBlur * unit).clipShape(Circle()))
            if !lamp.isEmpty {
                let glow = inner * MetalGadgetTokens.jackGlow
                Circle().fill(RadialGradient(colors: lamp + [.clear], center: .center, startRadius: 0, endRadius: glow / 2))
                    .frame(width: glow, height: glow)
            }
            // The nut: an annulus of satin steel, lit by the one light like every other body, with its knurls.
            if let image = MetalGadgetLighting.surface(nutPath, key: "jack-nut", material: .metal, lightness: MetalGadgetTokens.jackMetal.L,
                                                       chroma: MetalGadgetTokens.jackMetal.C, hue: MetalGadgetTokens.jackMetal.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway) {
                Image(decorative: image, scale: max(1, displayScale))
                    .frame(width: size, height: size)
            }
            ForEach(0..<knurls, id: \.self) { i in
                let groove = CGSize(width: outer / 2 * MetalGadgetTokens.jackKnurlWidth, height: outer / 2 * (MetalGadgetTokens.jackKnurl.1 - MetalGadgetTokens.jackKnurl.0))
                Capsule().fill(Color.black.opacity(MetalGadgetTokens.jackKnurlAlpha))
                    .frame(width: groove.width, height: groove.height)
                    .offset(y: -outer / 2 * (MetalGadgetTokens.jackKnurl.0 + MetalGadgetTokens.jackKnurl.1) / 2)
                    .rotationEffect(.degrees(Double(i) / Double(knurls) * 360))
            }
        }
        .frame(width: size, height: size)
        .accessibilityElement()
        .accessibilityLabel(lit.map { "jack, lit \($0.rawValue)" } ?? "jack")
    }
}
