import SwiftUI

/// Raised blocks of translucent resin in a grid, lit from behind. Dark, a cell is the resin's own
/// colour, deeper toward its foot; lit, the light comes through it, hottest at its core and thinner at
/// its rim, and spills a halo onto the slab. `lit` is how many cells are lit, a real number, so the cell
/// filling now glows part way; they light from the bottom row up, left to right. The twin of `Cell`.
public struct MetalCell: View {
    let cols: Int
    let rows: Int
    let gap: Double
    let lit: Double
    let color: MetalOklch
    let side: Double?
    let center: CGPoint
    let size: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale

    /// `side` is one cell's side on the 400-unit canvas and `center` the grid's centre (default: drawn
    /// by itself, the Part's side, shrunk so a big grid fits).
    public init(cols: Int = 4, rows: Int = 4,
                gap: Double = MetalGadgetTokens.cellAlone.gap,
                lit: Double = 0, color: MetalOklch? = nil, side: Double? = nil, center: CGPoint = CGPoint(x: 200, y: 200), size: Double = 96) {
        let warm = MetalGadgetFeelTokens.accentWarm
        self.cols = cols; self.rows = rows; self.gap = gap; self.lit = lit; self.side = side; self.center = center; self.size = size
        self.color = color ?? MetalOklch(L: warm.L, C: warm.C, H: warm.H)
    }

    /// Each cell's place in the lighting order, cells in reading order: the bottom row first, left to right.
    public static func order(cols: Int, rows: Int) -> [Int] {
        (0..<(cols * rows)).map { i in (rows - 1 - i / cols) * cols + i % cols }
    }

    /// How lit each cell is (reading order) when `lit` cells are.
    public static func shares(_ lit: Double, cols: Int, rows: Int) -> [Double] {
        order(cols: cols, rows: rows).map { max(0, min(1, lit - Double($0))) }
    }

    /// Where each cell's centre is (reading order), canvas units.
    public static func centres(cols: Int, rows: Int, gap: Double, side S: Double, at c: CGPoint) -> [CGPoint] {
        let w = Double(cols) * S + Double(cols - 1) * gap, h = Double(rows) * S + Double(rows - 1) * gap
        let firstX = CGFloat(Double(c.x) - w / 2 + S / 2)
        let firstY = CGFloat(Double(c.y) - h / 2 + S / 2)
        let step = CGFloat(S + gap)
        return (0..<(cols * rows)).map { i in
            CGPoint(x: firstX + CGFloat(i % cols) * step,
                    y: firstY + CGFloat(i / cols) * step)
        }
    }

    public var body: some View {
        let unit = size / MetalGadgetTokens.canvas, m = Double(max(cols, rows))
        let S = side ?? min(MetalGadgetTokens.cellAlone.side, (MetalGadgetTokens.bodyRect.width - (m + 1) * gap) / m)
        let r = S * MetalGadgetTokens.cellRadius, cs = Self.centres(cols: cols, rows: rows, gap: gap, side: S, at: center)
        let share = Self.shares(lit, cols: cols, rows: rows), through = MetalSoundMaterial.resin.finish.translucency
        let ll = MetalGadgetTokens.cellLit, core = MetalGadgetTokens.cellCore, halo = MetalGadgetTokens.cellHalo, sh = MetalGadgetTokens.cellShadow
        let glow = MetalPigment.color(lightness: min(0.97, color.L + ll.lift), chroma: min(0.37, color.C * ll.chroma), hue: color.H + ll.turn)
        let hot = MetalPigment.color(lightness: min(0.99, color.L + core.lift), chroma: min(0.37, color.C * core.chroma), hue: color.H + core.turn)
        let depth = MetalGadgetTokens.cellDepth
        let shape = RoundedRectangle(cornerRadius: r * unit, style: .continuous)
        // One cell's lit surface at the canvas centre, set down at each cell (every cell lit alike).
        let mid = MetalGadgetTokens.canvas / 2
        let path = CGPath(roundedRect: CGRect(x: mid - S / 2, y: mid - S / 2, width: S, height: S), cornerWidth: r, cornerHeight: r, transform: nil)
        ZStack(alignment: .topLeading) {
            ForEach(0..<cs.count, id: \.self) { i in
                shape.fill(MetalGadgetLighting.shadow.opacity(sh.alpha)).frame(width: S * unit, height: S * unit).blur(radius: S * sh.blur * unit)
                    .position(x: (cs[i].x + S * sh.dx) * unit, y: (cs[i].y + S * sh.dy) * unit)
            }
            ForEach(0..<cs.count, id: \.self) { i in
                shape.fill(glow).frame(width: S * unit, height: S * unit).blur(radius: S * halo.blur * unit)
                    .opacity(share[i] * halo.alpha).position(x: cs[i].x * unit, y: cs[i].y * unit)
            }
            if let image = MetalGadgetLighting.surface(path, key: "cell-\(S)", material: .resin,
                                                       lightness: color.L - MetalGadgetTokens.cellDrop, chroma: color.C, hue: color.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway) {
                ForEach(0..<cs.count, id: \.self) { i in
                    Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
                        .offset(x: (cs[i].x - mid) * unit, y: (cs[i].y - mid) * unit)
                }
            }
            ForEach(0..<cs.count, id: \.self) { i in
                ZStack {
                    shape.fill(LinearGradient(stops: [.init(color: .clear, location: 1 - depth.share), .init(color: .black.opacity(depth.alpha), location: 1)],
                                              startPoint: .top, endPoint: .bottom))
                    shape.fill(RadialGradient(stops: [.init(color: hot, location: 0), .init(color: glow, location: core.share), .init(color: glow.opacity(through), location: 1)],
                                              center: UnitPoint(x: 0.5, y: 0.46), startRadius: 0, endRadius: S * 0.62 * unit))
                        .opacity(share[i])
                }
                .frame(width: S * unit, height: S * unit).position(x: cs[i].x * unit, y: cs[i].y * unit)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .accessibilityElement()
        .accessibilityLabel("\(cols) by \(rows) cells, \(Int(lit)) lit")
    }
}
