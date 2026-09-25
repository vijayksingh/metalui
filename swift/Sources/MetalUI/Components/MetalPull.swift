import SwiftUI

/// A drawer's handle, seen from above, drawn with the drawer front it sits on. A bar is a metal
/// capsule standing out in front of the front on two posts, lit on its upper curve with a small
/// shadow; a recess is a finger slot cut into the front. The twin of `Pull`.
public struct MetalPull: View {
    public enum Style: String, Sendable { case bar, recess }
    let style: Style
    let front: MetalOklch
    let size: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    public init(style: Style = .bar, front: MetalOklch? = nil, size: Double = 96) {
        self.style = style; self.size = size
        self.front = front ?? MetalOklch(L: MetalGadgetTokens.plugFaceClay, C: MetalGadgetTokens.plugFaceChroma, H: MetalSoundMaterial.clay.finish.sampleHue)
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, native = MetalGadgetTokens.partSizes["pull"] ?? (96, 14)
        let k = MetalGadgetTokens.pullAlone / native.0, W = native.0 * k, H = native.1 * k
        let panel = MetalGadgetTokens.pullPanel, standoff = MetalGadgetTokens.pullStandoff
        let reach = style == .recess ? 0 : standoff + H
        let top = 200 - (panel.height + reach) / 2, edge = top + panel.height
        let at = style == .recess ? CGPoint(x: 200, y: top + panel.height / 2) : CGPoint(x: 200, y: edge + standoff + H / 2)
        let r = panel.height * MetalGadgetTokens.lidRadius
        let front = CGRect(x: 200 - panel.width / 2, y: top, width: panel.width, height: panel.height)
        ZStack(alignment: .topLeading) {
            if let image = MetalGadgetLighting.surface(CGPath(roundedRect: front, cornerWidth: r, cornerHeight: r, transform: nil), key: "pull-front-\(style.rawValue)",
                                                       material: .clay, lightness: self.front.L, chroma: self.front.C, hue: self.front.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway) {
                Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
            }
            MetalPullShape(style: style, at: at, width: W, height: H, unit: unit)
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityElement()
        .accessibilityLabel("pull, \(style.rawValue)")
    }
}

/// The pull itself on the 400-unit canvas: a bar on its posts with its shadow, or a recess. Also drawn
/// by `MetalGadget` on a drawer's front.
struct MetalPullShape: View {
    let style: MetalPull.Style
    let at: CGPoint
    let width: Double
    let height: Double
    let unit: Double

    var body: some View {
        let W = width, H = height, capsule = Capsule(style: .continuous)
        if style == .recess {
            let lip = MetalGadgetTokens.pullLip
            ZStack(alignment: .topLeading) {
                capsule.fill(Color(.sRGB, red: 20 / 255, green: 16 / 255, blue: 12 / 255).opacity(MetalGadgetTokens.pullRecess))
                    .frame(width: W * unit, height: H * unit).position(x: at.x * unit, y: at.y * unit)
                Path { p in p.move(to: CGPoint(x: (at.x - W / 2 + H / 2) * unit, y: (at.y + H / 2) * unit)); p.addLine(to: CGPoint(x: (at.x + W / 2 - H / 2) * unit, y: (at.y + H / 2) * unit)) }
                    .stroke(.white.opacity(lip.alpha), style: StrokeStyle(lineWidth: lip.width * unit, lineCap: .round))
            }
        } else {
            let m = MetalGadgetTokens.jackMetal, sh = MetalGadgetTokens.pullShadow, posts = MetalGadgetTokens.pullPosts, sheen = MetalGadgetTokens.pullSheen
            let standoff = MetalGadgetTokens.pullStandoff, postH = standoff + H / 2, postY = at.y - H / 2 - standoff + postH / 2
            let foot = MetalPigment.color(lightness: m.L - MetalGadgetTokens.pullFoot, chroma: m.C, hue: m.H)
            ZStack(alignment: .topLeading) {
                capsule.fill(MetalGadgetLighting.shadow.opacity(sh.alpha)).frame(width: W * unit, height: H * unit).blur(radius: sh.blur * unit)
                    .position(x: (at.x + sh.dx) * unit, y: (at.y + sh.dy) * unit)
                ForEach([at.x - W / 2 + posts.inset, at.x + W / 2 - posts.inset], id: \.self) { x in
                    Rectangle().fill(foot).frame(width: posts.width * unit, height: postH * unit)
                        .position(x: x * unit, y: postY * unit)
                }
                capsule.fill(LinearGradient(stops: [.init(color: MetalPigment.color(lightness: min(1, m.L + MetalGadgetTokens.pullCrown), chroma: m.C, hue: m.H), location: 0),
                                                    .init(color: MetalPigment.color(lightness: m.L, chroma: m.C, hue: m.H), location: 0.45), .init(color: foot, location: 1)],
                                            startPoint: .top, endPoint: .bottom))
                    .frame(width: W * unit, height: H * unit).position(x: at.x * unit, y: at.y * unit)
                Path { p in
                    let y = (at.y - H / 2 + H * sheen.at) * unit
                    p.move(to: CGPoint(x: (at.x - W / 2 + H / 2) * unit, y: y)); p.addLine(to: CGPoint(x: (at.x + W / 2 - H / 2) * unit, y: y))
                }
                .stroke(.white.opacity(sheen.alpha), style: StrokeStyle(lineWidth: 1.2 * unit, lineCap: .round))
            }
        }
    }
}
