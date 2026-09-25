import SwiftUI

/// A short arc, or a weighted throw, with the same screen coordinates as web `hop`.
public enum MetalHop {
    public enum Side: Sendable { case up, cw, ccw }
    public enum Reach: Sendable { case near, far }

    struct FarFrame {
        let point: CGPoint
        let scaleX: CGFloat
        let scaleY: CGFloat
        let height: CGFloat
    }

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

    /// Crouch, a smoothstep throw under a parabolic height, and a squash/rebound landing.
    static func farFrame(from: CGPoint, to: CGPoint, progress: CGFloat) -> FarFrame {
        let crouch = CGFloat(MetalMotionTokens.hopCrouch)
        let flight = CGFloat(MetalMotionTokens.hopDurationFar)
        let land = CGFloat(MetalMotionTokens.hopLand)
        let total = crouch + flight + land
        let time = min(max(progress, .zero), 1) * total
        let squash = CGFloat(MetalMotionTokens.hopSquash)
        let rise = CGFloat(MetalMotionTokens.hopRise)
        let crouchX = 1 + (1 - squash) / 4
        let crouchY = 1 - (1 - squash) / 2

        func mix(_ a: CGFloat, _ b: CGFloat, _ t: CGFloat) -> CGFloat { a + (b - a) * t }
        func flightFrame(_ u: CGFloat) -> FarFrame {
            let dx = to.x - from.x
            let dy = to.y - from.y
            let distance = hypot(dx, dy)
            let apex = min(CGFloat(MetalMotionTokens.hopArcRatio) * distance,
                           CGFloat(MetalMotionTokens.hopLiftFar)) / 2
            let across = u * u * (3 - 2 * u)
            let height = 4 * u * (1 - u)
            let scale = 1 + (rise - 1) * height
            return FarFrame(point: CGPoint(x: from.x + dx * across,
                                           y: from.y + dy * u - apex * height),
                            scaleX: scale, scaleY: scale, height: height)
        }

        if time <= crouch {
            let u = crouch > .zero ? time / crouch : 1
            return FarFrame(point: from, scaleX: mix(1, crouchX, u),
                            scaleY: mix(1, crouchY, u), height: .zero)
        }
        if time <= crouch + flight {
            let u = flight > .zero ? (time - crouch) / flight : 1
            // The web flight's first sample is at 1/20; blend out of its crouch until then.
            let first = CGFloat(1) / 20
            if u < first {
                let next = flightFrame(first)
                let blend = u / first
                return FarFrame(point: CGPoint(x: mix(from.x, next.point.x, blend),
                                               y: mix(from.y, next.point.y, blend)),
                                scaleX: mix(crouchX, next.scaleX, blend),
                                scaleY: mix(crouchY, next.scaleY, blend),
                                height: next.height * blend)
            }
            return flightFrame(u)
        }

        let u = land > .zero ? (time - crouch - flight) / land : 1
        let squashAt: CGFloat = 0.35
        let reboundAt: CGFloat = 0.7
        let squashX = 1 + (1 - squash) / 2
        let reboundX = 1 - (1 - squash) / 6
        let reboundY = 1 + (1 - squash) / 3
        if u <= squashAt {
            let t = u / squashAt
            return FarFrame(point: to, scaleX: mix(1, squashX, t), scaleY: mix(1, squash, t), height: .zero)
        }
        if u <= reboundAt {
            let t = (u - squashAt) / (reboundAt - squashAt)
            return FarFrame(point: to, scaleX: mix(squashX, reboundX, t), scaleY: mix(squash, reboundY, t), height: .zero)
        }
        let t = (u - reboundAt) / (1 - reboundAt)
        return FarFrame(point: to, scaleX: mix(reboundX, 1, t), scaleY: mix(reboundY, 1, t), height: .zero)
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

private struct MetalFarHopEffect: AnimatableModifier {
    let from: CGPoint
    let to: CGPoint
    var progress: CGFloat

    var animatableData: CGFloat {
        get { progress }
        set { progress = newValue }
    }

    func body(content: Content) -> some View {
        let frame = MetalHop.farFrame(from: from, to: to, progress: progress)
        let shadow = MetalMotionTokens.hopRiseShadow
        return content
            .scaleEffect(x: frame.scaleX, y: frame.scaleY, anchor: .bottom)
            .shadow(color: shadow.color.color.opacity(frame.height),
                    radius: shadow.blur * frame.height,
                    x: shadow.x * frame.height, y: shadow.y * frame.height)
            .offset(x: frame.point.x, y: frame.point.y)
    }
}

private struct MetalHopModifier: ViewModifier {
    let from: CGPoint
    let to: CGPoint
    let side: MetalHop.Side
    let reach: MetalHop.Reach
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var progress: CGFloat = 1
    @State private var hopTask: Task<Void, Never>?

    func body(content: Content) -> some View {
        Group {
            if reach == .far {
                content.modifier(MetalFarHopEffect(from: from, to: to, progress: progress))
            } else {
                content.modifier(MetalHopEffect(from: from, to: to, side: side, progress: progress))
            }
        }
            .onChange(of: to) { _, _ in
                hopTask?.cancel()
                guard !reduceMotion else { progress = 1; return }
                var reset = Transaction(animation: nil)
                reset.disablesAnimations = true
                withTransaction(reset) { progress = 0 }
                hopTask = Task { @MainActor in
                    await Task.yield()
                    guard !Task.isCancelled else { return }
                    if reach == .far {
                        await throwFar()
                    } else {
                        withAnimation(.linear(duration: MetalMotionTokens.hopDuration)) { progress = 1 }
                    }
                }
            }
            .onChange(of: reduceMotion) { _, reduced in
                if reduced { hopTask?.cancel(); progress = 1 }
            }
            .onDisappear { hopTask?.cancel() }
    }

    @MainActor
    private func throwFar() async {
        let crouch = MetalMotionTokens.hopCrouch
        let flight = MetalMotionTokens.hopDurationFar
        let land = MetalMotionTokens.hopLand
        let total = crouch + flight + land

        func step(_ target: CGFloat, duration: Double, animation: Animation) async -> Bool {
            withAnimation(animation) { progress = target }
            try? await Task.sleep(for: .seconds(duration))
            return !Task.isCancelled
        }

        guard await step(crouch / total, duration: crouch, animation: .easeOut(duration: crouch)) else { return }
        guard await step((crouch + flight) / total, duration: flight, animation: .linear(duration: flight)) else { return }
        let squashTime = land * 0.35
        guard await step((crouch + flight + squashTime) / total,
                         duration: squashTime, animation: .linear(duration: squashTime)) else { return }
        let reboundTime = land * 0.35
        guard await step((crouch + flight + squashTime + reboundTime) / total,
                         duration: reboundTime, animation: .easeOut(duration: reboundTime)) else { return }
        let settleTime = land - squashTime - reboundTime
        withAnimation(.easeInOut(duration: settleTime)) { progress = 1 }
    }
}

extension View {
    /// Moves this view from `from` to `to` relative to its untransformed origin.
    /// Initial placement and Reduce Motion use the destination immediately.
    public func metalHop(from: CGPoint, to: CGPoint, side: MetalHop.Side = .up, reach: MetalHop.Reach = .near) -> some View {
        modifier(MetalHopModifier(from: from, to: to, side: side, reach: reach))
    }
}
