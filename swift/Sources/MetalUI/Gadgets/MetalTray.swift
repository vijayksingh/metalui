import SwiftUI

/// A drawer's tray, the twin of drawTray (parts/slab.ts): a Slab placed as the actor of a slide-out,
/// seen from above. A rim around a darker floor, index cards standing packed from the front (the
/// fill's share of them), and a front in the body's own material. Drawn on the 400-unit canvas.
struct MetalTray: View {
    let at: CGPoint
    let dims: (Double, Double)
    let color: MetalOklch
    let material: MetalSoundMaterial
    let fill: Double
    let size: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    /// How many of a tray's cards stand at a fill.
    static func cards(_ fill: Double) -> Int { Int((min(1, max(0, fill)) * Double(MetalGadgetTokens.trayCards)).rounded()) }

    var body: some View {
        let unit = size / MetalGadgetTokens.canvas, (w, d) = dims, wall = MetalGadgetTokens.trayWall, frontT = MetalGadgetTokens.trayFront
        let rim = CGRect(x: at.x - w / 2 - wall, y: at.y - d / 2 - wall, width: w + 2 * wall, height: d + 2 * wall)
        let frontY = at.y + d / 2 + wall, front = CGRect(x: at.x - w / 2 - wall, y: frontY, width: w + 2 * wall, height: frontT)
        let card = MetalGadgetTokens.trayCard, tab = MetalGadgetTokens.trayTab, n = Self.cards(fill)
        let paper = MetalPigment.color(lightness: MetalGadgetTokens.capCeramic.L, chroma: MetalGadgetTokens.capCeramic.C, hue: color.H)
        let edge = Color(.sRGB, red: 30 / 255, green: 26 / 255, blue: 22 / 255).opacity(0.18)
        ZStack(alignment: .topLeading) {
            surface(rim, radius: wall * 1.5, key: "tray-rim")
            RoundedRectangle(cornerRadius: wall / 2 * unit, style: .continuous)
                .fill(MetalPigment.color(lightness: color.L - MetalGadgetTokens.trayFloorDrop, chroma: color.C, hue: color.H))
                .frame(width: w * unit, height: d * unit).position(x: at.x * unit, y: at.y * unit)
            ForEach(0..<MetalGadgetTokens.trayCards, id: \.self) { k in
                let y = at.y + d / 2 - card.inset / 2 - Double(k) * card.gap
                let tx = k % 2 == 1 ? at.x + w / 2 - card.inset - tab.width : at.x - w / 2 + card.inset + tab.width
                ZStack(alignment: .topLeading) {
                    Capsule().fill(paper).overlay(Capsule().stroke(edge, lineWidth: 0.8 * unit))
                        .frame(width: tab.width * unit, height: tab.height * unit).position(x: tx * unit, y: (y - card.thickness / 2 - tab.height / 2) * unit)
                    Capsule().fill(paper).overlay(Capsule().stroke(edge, lineWidth: 0.8 * unit))
                        .frame(width: (w - 2 * card.inset) * unit, height: card.thickness * unit).position(x: at.x * unit, y: y * unit)
                }
                .opacity(k < n ? 1 : 0)
            }
            surface(front, radius: frontT / 3, key: "tray-front")
        }
        .frame(width: size, height: size, alignment: .topLeading)
    }

    @ViewBuilder private func surface(_ rect: CGRect, radius: Double, key: String) -> some View {
        if let image = MetalGadgetLighting.surface(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil),
                                                   key: "\(key)-\(rect.origin.x)-\(rect.origin.y)-\(rect.width)-\(rect.height)", material: material,
                                                   lightness: color.L, chroma: color.C, hue: color.H, size: size, scale: max(1, displayScale), colorway: colorway) {
            Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
        }
    }
}
