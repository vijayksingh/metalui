import SwiftUI

/* ─────────────────────────────────────────────────────────
 * ICON ACT (docs/ICON-MOTION.md)
 *
 * The same studies the web plays, from the same data (MetalIconActs.generated.swift):
 *    0ms  the hosting control is hovered or pressed → the act starts on one clock
 *   Nms   every part is back at rest, N = the act's duration; it finishes even if the
 *         pointer leaves, and a trigger during the act is ignored
 * Each part's poses, opacity and draw are keyframes with the easing that leaves them,
 * evaluated here exactly as Web Animations does. Parts nest: a child moves inside its parent.
 * Reduced motion: MetalIcon draws the still symbol instead.
 * ───────────────────────────────────────────────────────── */

/// A CSS cubic-bezier easing, solved for progress the way browsers do.
struct MetalIconEase: Equatable, Sendable {
    let x1: Double, y1: Double, x2: Double, y2: Double

    init(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double) {
        self.x1 = x1; self.y1 = y1; self.x2 = x2; self.y2 = y2
    }

    static let linear = MetalIconEase(0, 0, 1, 1)

    func callAsFunction(_ x: Double) -> Double {
        if self == .linear || x <= 0 || x >= 1 { return min(max(x, 0), 1) }
        let cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
        let cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
        func sx(_ t: Double) -> Double { ((ax * t + bx) * t + cx) * t }
        func dx(_ t: Double) -> Double { (3 * ax * t + 2 * bx) * t + cx }
        var t = x
        for _ in 0..<8 {
            let err = sx(t) - x
            if abs(err) < 1e-6 { break }
            let d = dx(t)
            if abs(d) < 1e-6 { break }
            t -= err / d
        }
        if t < 0 || t > 1 || abs(sx(t) - x) > 1e-4 { // bisection when Newton wanders
            var lo = 0.0, hi = 1.0
            t = x
            for _ in 0..<30 {
                let v = sx(t)
                if abs(v - x) < 1e-6 { break }
                if v < x { lo = t } else { hi = t }
                t = (lo + hi) / 2
            }
        }
        return ((ay * t + by) * t + cy) * t
    }
}

/// A part's pose at one keyframe: translate (grid units), rotate (degrees), scale, about the part's origin.
struct MetalIconActPose: Sendable {
    let t: Double, x: Double, y: Double, r: Double, sx: Double, sy: Double
    let ease: MetalIconEase

    init(_ t: Double, x: Double, y: Double, r: Double, sx: Double, sy: Double, ease: MetalIconEase) {
        self.t = t; self.x = x; self.y = y; self.r = r; self.sx = sx; self.sy = sy; self.ease = ease
    }
}

/// One keyframe of a scalar channel (opacity, draw).
struct MetalIconActValue: Sendable {
    let t: Double, v: Double
    let ease: MetalIconEase

    init(_ t: Double, _ v: Double, ease: MetalIconEase) {
        self.t = t; self.v = v; self.ease = ease
    }
}

struct MetalIconActPart: Sendable {
    let name: String
    let origin: CGPoint
    let poses: [MetalIconActPose]
    let opacity: [MetalIconActValue]
    let draw: [MetalIconActValue]
}

enum MetalIconActFill: Sendable {
    case none, solid
    case duotone(Double)
}

/// One inked element in grid units, moved by its chain of parts (outermost first).
struct MetalIconActInk: Sendable {
    let d: String
    let parts: [Int]
    /// Stroke width as a multiple of the glyph's line; 0 for no stroke.
    let stroke: Double
    let fill: MetalIconActFill
    let opacity: Double
}

struct MetalIconAct: Sendable {
    let duration: Double
    let caption: String
    let parts: [MetalIconActPart]
    let ink: [MetalIconActInk]

    /// Where one part is at progress `p` (0…1 of the act).
    struct PartState {
        var transform: CGAffineTransform = .identity
        var opacity: Double = 1
        var draw: Double = 1
    }

    private static func segment<K>(_ keys: [K], _ p: Double, t: (K) -> Double) -> (K, K, Double, K)? {
        guard let first = keys.first, let last = keys.last else { return nil }
        if p <= t(first) { return (first, first, 0, first) }
        if p >= t(last) { return (last, last, 0, last) }
        for i in 0..<(keys.count - 1) where p < t(keys[i + 1]) {
            let a = keys[i], b = keys[i + 1]
            return (a, b, (p - t(a)) / (t(b) - t(a)), a)
        }
        return (last, last, 0, last)
    }

    private static func value(_ keys: [MetalIconActValue], _ p: Double, rest: Double) -> Double {
        guard let (a, b, u, _) = segment(keys, p, t: { $0.t }) else { return rest }
        let e = a.ease(u)
        return a.v + (b.v - a.v) * e
    }

    func state(_ index: Int, at p: Double) -> PartState {
        let part = parts[index]
        var s = PartState()
        if let (a, b, u, _) = Self.segment(part.poses, p, t: { $0.t }) {
            let e = a.ease(u)
            func lerp(_ x: Double, _ y: Double) -> Double { x + (y - x) * e }
            let o = part.origin
            // CSS: translate(origin) · translate(x, y) · rotate(r) · scale(sx, sy) · translate(-origin)
            s.transform = CGAffineTransform(translationX: -o.x, y: -o.y)
                .concatenating(CGAffineTransform(scaleX: lerp(a.sx, b.sx), y: lerp(a.sy, b.sy)))
                .concatenating(CGAffineTransform(rotationAngle: lerp(a.r, b.r) * .pi / 180))
                .concatenating(CGAffineTransform(translationX: lerp(a.x, b.x) + o.x, y: lerp(a.y, b.y) + o.y))
        }
        s.opacity = Self.value(part.opacity, p, rest: 1)
        s.draw = Self.value(part.draw, p, rest: 1)
        return s
    }
}

/// Draws an act at a moment: `elapsed` seconds in (0 is rest). Grid geometry scaled into `box`.
struct MetalIconActCanvas: View {
    let act: MetalIconAct
    let box: CGFloat
    let lineUnits: CGFloat
    let duoK: Double
    let elapsed: Double

    var body: some View {
        Canvas { context, _ in
            let p = act.duration > 0 ? min(max(elapsed / act.duration, 0), 1) : 0
            let states = act.parts.indices.map { act.state($0, at: p) }
            let grid = CGAffineTransform(scaleX: box / 24, y: box / 24)
            for ink in act.ink {
                var m = CGAffineTransform.identity
                var opacity = ink.opacity
                var draw = 1.0
                for index in ink.parts.reversed() { // innermost first, then each parent around it
                    m = m.concatenating(states[index].transform)
                }
                for index in ink.parts {
                    opacity *= states[index].opacity
                    if !act.parts[index].draw.isEmpty { draw = states[index].draw }
                }
                guard opacity > 0.001 else { continue }
                var ctx = context
                ctx.opacity = opacity
                ctx.concatenate(m.concatenating(grid))
                var path = MetalGridPathCache.path(ink.d)
                if draw < 0.999 { path = path.trimmedPath(from: 0, to: max(draw, 0)) }
                switch ink.fill {
                case .none: break
                case .solid: ctx.fill(path, with: .foreground)
                case let .duotone(duo):
                    var tint = ctx
                    tint.opacity = opacity * duo * duoK
                    tint.fill(path, with: .foreground)
                }
                if ink.stroke > 0, draw > 0.001 {
                    ctx.stroke(path, with: .foreground, style: StrokeStyle(lineWidth: lineUnits * ink.stroke, lineCap: .round, lineJoin: .round))
                }
            }
        }
        .frame(width: box, height: box)
    }
}

/// Plays an act once from `start` (nil: at rest), on the display's clock.
struct MetalIconActView: View {
    let act: MetalIconAct
    let box: CGFloat
    let lineUnits: CGFloat
    let duoK: Double
    let start: Date?

    var body: some View {
        TimelineView(.animation(paused: start == nil)) { timeline in
            MetalIconActCanvas(
                act: act, box: box, lineUnits: lineUnits, duoK: duoK,
                elapsed: start.map { timeline.date.timeIntervalSince($0) } ?? 0
            )
        }
    }
}
