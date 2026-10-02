import SwiftUI

// Shared selected mark: same generated check route, same pen phases, no clock at rest.
enum MetalTickMark: Equatable { case tick, dash }

struct MetalTickGlyph: View {
    let mark: MetalTickMark?
    let side: CGFloat
    let color: Color
    let onInk: (Bool) -> Void
    @MetalMotionPreference private var reduceMotion
    @State private var drawn: CGFloat
    @State private var bend: CGFloat
    @State private var stroke = 0

    init(mark: MetalTickMark?, side: CGFloat, color: Color, onInk: @escaping (Bool) -> Void = { _ in }) {
        self.mark = mark
        self.side = side
        self.color = color
        self.onInk = onInk
        _drawn = State(initialValue: mark == nil ? 0 : MetalTickShape.rest)
        _bend = State(initialValue: mark == .dash ? 0 : 1)
    }

    var body: some View {
        MetalTickShape(bend: bend)
            .trim(from: 0, to: drawn)
            .stroke(color, style: StrokeStyle(lineWidth: MetalRecipes.checkbox.scalar("tick.pen") * side / MetalTickShape.grid,
                                             lineCap: .round, lineJoin: .round))
            .frame(width: side, height: side)
            .opacity(drawn > .zero ? .one : .zero)
            .allowsHitTesting(false)
            .accessibilityHidden(true)
            .onChange(of: mark) { old, new in pen(from: old, to: new) }
            .onChange(of: reduceMotion) { _, reduced in
                if reduced { pen(from: mark, to: mark) }
            }
    }

    /// Runs the pen for a change of mark: draw, withdraw, or bend the dash and tick into each other.
    private func pen(from old: MetalTickMark?, to new: MetalTickMark?) {
        stroke += 1
        let this = stroke
        let recipe = MetalRecipes.checkbox
        let part = MetalMotion.resolve(.part, reduceMotion: reduceMotion)
        let settle = MetalMotion.resolve(.settle, reduceMotion: reduceMotion)
        onInk(true)
        guard part.allowsTravel else {
            var still = Transaction(animation: nil)
            still.disablesAnimations = true
            withTransaction(still) {
                if let new { bend = new == .tick ? 1 : 0; drawn = MetalTickShape.rest } else { drawn = 0; onInk(false) }
            }
            return
        }
        let beat = recipe.durationSeconds("tick.delay")
        let down = recipe.durationSeconds("tick.down")
        let pace = recipe.durationSeconds("tick.pace")
        let withdraw = recipe.durationSeconds("tick.withdraw")
        let press = MetalShared.easePress
        let later = { (seconds: Double, step: @escaping () -> Void) in
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { if stroke == this { step() } }
        }
        switch (old, new) {
        case let (.some, .some(to)) where drawn > 0:
            // The same stroke bends: the dash's corner drops and its tail rises (or back).
            withAnimation(settle.animation) { bend = to == .tick ? 1 : 0; drawn = MetalTickShape.rest }
        case let (_, .some(to)):
            bend = to == .tick ? 1 : 0
            if to == .dash || drawn >= MetalTickShape.short {
                later(drawn > 0 ? 0 : beat) { withAnimation(part.animation) { drawn = MetalTickShape.rest } }
            } else {
                later(beat) { withAnimation(press.animation(duration: down)) { drawn = MetalTickShape.short } }
                later(beat + down + pace) { withAnimation(part.animation) { drawn = MetalTickShape.rest } }
            }
        case (_, nil):
            let share = { (d: CGFloat) in withdraw * Double(d / MetalTickShape.rest) }
            let finish = { later(0) { onInk(false) } }
            if old == .dash || drawn <= MetalTickShape.short {
                withAnimation(press.animation(duration: share(drawn))) { drawn = 0 }
                later(share(drawn)) { finish() }
            } else {
                let long = share(drawn - MetalTickShape.short), short = share(MetalTickShape.short)
                withAnimation(press.animation(duration: long)) { drawn = MetalTickShape.short }
                later(long + pace) { withAnimation(press.animation(duration: short)) { drawn = 0 } }
                later(long + pace + short) { finish() }
            }
        }
    }
}

/// The dimple's tick: the check glyph's route on the 24 grid, bent from the dash (0) to the tick (1),
/// with its long leg run on past the tip by its own length (room for the pen's overshoot). Trim it
/// to `rest` for the route itself.
struct MetalTickShape: Shape {
    var bend: CGFloat

    static let grid: CGFloat = 24
    static let tick = [MetalTickRoute.start, MetalTickRoute.corner, MetalTickRoute.tip]
    /// The tick laid flat across its own width at its middle height, the corner at the same share of the way.
    static let dash: [CGPoint] = {
        let xs = tick.map(\.x), ys = tick.map(\.y)
        let y = (ys.min()! + ys.max()!) / 2, x0 = xs.min()!, x1 = xs.max()!
        return [CGPoint(x: x0, y: y), CGPoint(x: x0 + (x1 - x0) * shareOfShortLeg, y: y), CGPoint(x: x1, y: y)]
    }()
    private static func legs(_ r: [CGPoint]) -> (CGFloat, CGFloat) {
        (hypot(r[1].x - r[0].x, r[1].y - r[0].y), hypot(r[2].x - r[1].x, r[2].y - r[1].y))
    }
    static let shareOfShortLeg: CGFloat = { let (a, b) = legs(tick); return a / (a + b) }()
    /// The route's share of the whole path (the route plus the tail): where a drawn tick rests.
    static let rest: CGFloat = { let (a, b) = legs(tick); return (a + b) / (a + 2 * b) }()
    /// The short leg's share of the whole path: the corner.
    static let short: CGFloat = { let (a, b) = legs(tick); return a / (a + 2 * b) }()

    var animatableData: CGFloat {
        get { bend }
        set { bend = newValue }
    }

    func path(in rect: CGRect) -> Path {
        let k = rect.width / Self.grid
        let p = zip(Self.dash, Self.tick).map { d, t in
            CGPoint(x: rect.minX + (d.x + (t.x - d.x) * bend) * k, y: rect.minY + (d.y + (t.y - d.y) * bend) * k)
        }
        var path = Path()
        path.move(to: p[0])
        path.addLine(to: p[1])
        path.addLine(to: p[2])
        path.addLine(to: CGPoint(x: 2 * p[2].x - p[1].x, y: 2 * p[2].y - p[1].y))
        return path
    }
}

