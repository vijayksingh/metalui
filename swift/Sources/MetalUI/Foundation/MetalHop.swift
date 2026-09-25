import SwiftUI

/// A short throw along the same quadratic arc as web `hopPoint`.
public enum MetalHop {
    public enum Side: Sendable { case up, cw, ccw }

    /// Point at eased progress, with screen coordinates growing downward.
    public static func point(from: CGPoint, to: CGPoint, progress: CGFloat, side: Side = .up) -> CGPoint {
        let dx = to.x - from.x
        let dy = to.y - from.y
        let distance = hypot(dx, dy)
        guard distance > .zero else { return to }
        var nx = -dy / distance
        var ny = dx / distance
        if side == .cw || (side == .up && abs(dx) >= abs(dy) && ny > .zero) {
            nx = -nx
            ny = -ny
        }
        let bow = min(CGFloat(MetalMotionTokens.hopArcRatio) * distance, CGFloat(MetalMotionTokens.hopLift))
        let control = CGPoint(x: from.x + dx / 2 + nx * bow, y: from.y + dy / 2 + ny * bow)
        let t = 1 - pow(1 - min(max(progress, .zero), 1), 2)
        let u = 1 - t
        return CGPoint(
            x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
            y: u * u * from.y + 2 * u * t * control.y + t * t * to.y
        )
    }
}

private struct MetalHopEffect: GeometryEffect {
    let from: CGPoint
    let to: CGPoint
    let side: MetalHop.Side
    var progress: CGFloat

    var animatableData: CGFloat {
        get { progress }
        set { progress = newValue }
    }

    func effectValue(size: CGSize) -> ProjectionTransform {
        let point = MetalHop.point(from: from, to: to, progress: progress, side: side)
        return ProjectionTransform(CGAffineTransform(translationX: point.x, y: point.y))
    }
}

private struct MetalHopModifier: ViewModifier {
    let from: CGPoint
    let to: CGPoint
    let side: MetalHop.Side
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var progress: CGFloat = 1

    func body(content: Content) -> some View {
        content
            .modifier(MetalHopEffect(from: from, to: to, side: side, progress: progress))
            .onChange(of: to) { _, _ in
                guard !reduceMotion else { progress = 1; return }
                var reset = Transaction(animation: nil)
                reset.disablesAnimations = true
                withTransaction(reset) { progress = 0 }
                withAnimation(.linear(duration: MetalMotionTokens.hopDuration)) { progress = 1 }
            }
    }
}

extension View {
    /// Moves this view from `from` to `to` relative to its untransformed origin.
    /// Initial placement and Reduce Motion use the destination immediately.
    public func metalHop(from: CGPoint, to: CGPoint, side: MetalHop.Side = .up) -> some View {
        modifier(MetalHopModifier(from: from, to: to, side: side))
    }
}
