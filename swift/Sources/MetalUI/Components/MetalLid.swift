import SwiftUI

/// A hinged flap over a bin's mouth, seen from above. `open` is degrees about its hinge (the back
/// edge, or the left): it foreshortens toward the hinge and its shadow falls further out as the free
/// edge rises. `armed` makes its underside red, which glows into the gap as it opens. The twin of `Lid`.
public struct MetalLid: View {
    public enum Hinge: String, Sendable { case back, left }
    let open: Double
    let armed: Bool
    let hinge: Hinge
    let color: MetalOklch
    let material: MetalSoundMaterial
    let dims: (Double, Double)
    let center: CGPoint
    let size: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    /// `dims` is the lid's [width, height] on the 400-unit canvas and `center` its closed centre
    /// (default: drawn by itself).
    public init(open: Double = 0, armed: Bool = false, hinge: Hinge = .back, material: MetalSoundMaterial = .rubber, color: MetalOklch? = nil,
                dims: (Double, Double)? = nil, center: CGPoint = CGPoint(x: 200, y: 200), size: Double = 96) {
        let f = MetalSoundMaterial.rubber.finish, a = MetalGadgetTokens.lidAlone
        self.open = open; self.armed = armed; self.hinge = hinge; self.material = material; self.center = center; self.size = size
        self.color = color ?? MetalOklch(L: (f.lightness.0 + f.lightness.1) / 2, C: f.chromaCap, H: f.sampleHue)
        self.dims = dims ?? (hinge == .left ? (a.length, a.width) : (a.width, a.length))
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, (w, h) = dims, left = hinge == .left
        let short = min(w, h), r = short * MetalGadgetTokens.lidRadius, L = left ? w : h
        let c = cos(open * .pi / 180), rise = L * sin(open * .pi / 180) * MetalGadgetTokens.lidLift
        let sh = MetalGadgetTokens.lidShadow, k = rise / hypot(sh.dx, sh.dy)
        let anchor = left ? UnitPoint(x: (center.x - w / 2) / MetalGadgetTokens.canvas, y: 0.5) : UnitPoint(x: 0.5, y: (center.y - h / 2) / MetalGadgetTokens.canvas)
        let fold = (x: left ? c : 1, y: left ? 1 : c)
        let rect = CGRect(x: center.x - w / 2, y: center.y - h / 2, width: w, height: h)
        let shape = RoundedRectangle(cornerRadius: r * unit, style: .continuous)
        let mouth = MetalGadgetTokens.lidMouth, under = MetalGadgetTokens.lidUnder, red = MetalGadgetTokens.lampColors["failed"]!.1
        let redColor = Color(.sRGB, red: red.0, green: red.1, blue: red.2)
        let g = MetalGadgetTokens.lidGrip
        let gs = left ? CGSize(width: short * g.height, height: h * g.width) : CGSize(width: w * g.width, height: short * g.height)
        let gc = left ? CGPoint(x: center.x + w / 2 - short * g.height * 2.2, y: center.y) : CGPoint(x: center.x, y: center.y + h / 2 - short * g.height * 2.2)
        ZStack(alignment: .topLeading) {
            // Its shadow, further out the higher the free edge stands; under the mouth, which is dark already.
            shape.fill(MetalGadgetLighting.shadow.opacity(sh.alpha)).frame(width: w * unit, height: h * unit).blur(radius: short * sh.blur * unit)
                .position(x: center.x * unit, y: center.y * unit)
                .frame(width: size, height: size, alignment: .topLeading)
                .scaleEffect(x: fold.x, y: fold.y, anchor: anchor)
                .offset(x: (short * sh.dx + sh.dx * k) * unit, y: (short * sh.dy + sh.dy * k) * unit)
            // The mouth, and under an armed lid the red glowing into the gap from its free edge.
            ZStack(alignment: .topLeading) {
                shape.fill(MetalPigment.color(lightness: mouth.L, chroma: color.C * mouth.chroma, hue: color.H))
                if armed {
                    Rectangle().fill(LinearGradient(stops: [.init(color: redColor.opacity(under.alpha), location: 0), .init(color: .clear, location: 1)],
                                                    startPoint: left ? .leading : .top, endPoint: left ? .trailing : .bottom))
                        .frame(width: (left ? L * under.reach : w) * unit, height: (left ? h : L * under.reach) * unit)
                        .offset(x: left ? L * c * unit : 0, y: left ? 0 : L * c * unit)
                }
            }
            .frame(width: w * unit, height: h * unit, alignment: .topLeading).clipShape(shape)
            .position(x: center.x * unit, y: center.y * unit)
            // The lid, foreshortened toward its hinge.
            ZStack(alignment: .topLeading) {
                if let image = MetalGadgetLighting.surface(CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil), key: "lid-\(w)x\(h)-\(center.x)-\(center.y)",
                                                           material: material, lightness: color.L, chroma: color.C, hue: color.H,
                                                           size: size, scale: max(1, displayScale), colorway: colorway) {
                    Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
                }
                Capsule().fill(.black.opacity(g.alpha)).frame(width: gs.width * unit, height: gs.height * unit).position(x: gc.x * unit, y: gc.y * unit)
            }
            .frame(width: size, height: size, alignment: .topLeading)
            .scaleEffect(x: fold.x, y: fold.y, anchor: anchor)
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityElement()
        .accessibilityLabel("lid, \(open > 0 ? "open \(Int(open.rounded()))°" : "closed")\(armed ? ", armed" : "")")
    }
}
