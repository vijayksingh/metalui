import SwiftUI

// The six hero glyphs as SwiftUI shapes with animatable parameters
// (NATIVE.md §3). Geometry is on the 24-unit grid, copied from
// packages/metalui/icons/src/icons.mjs (and tuned16.mjs for ≤16 pt).
// Hover poses are springs (`MetalIconSpring.pose`) so they reverse and can
// be interrupted; presses are keyframe one-shots that start and end at the
// current pose. `MetalIcon` only uses these when motion is allowed:
// under Reduce Motion it draws the static symbol instead.

/// Inputs every hero glyph takes.
struct MetalIconHeroPose: Equatable {
    var box: CGFloat
    var lineUnits: CGFloat
    var small: Bool
    var hover: Bool
    var hoverCount: Int
    var pressCount: Int
    var duotone: Double

    var scale: CGFloat { box / 24 }
    var stroke: StrokeStyle { StrokeStyle(lineWidth: lineUnits * scale, lineCap: .round, lineJoin: .round) }
    /// Knockout (air-gap) width that was `units` at the Regular stroke.
    func gap(_ units: CGFloat, regular: CGFloat) -> StrokeStyle {
        StrokeStyle(lineWidth: units * lineUnits / regular * scale, lineCap: .round, lineJoin: .round)
    }
}

struct MetalIconHero: View {
    let icon: MetalIconName
    let pose: MetalIconHeroPose

    var body: some View {
        Group {
            switch icon {
            case .sendAway: MetalSendAwayGlyph(pose: pose)
            case .note: MetalNoteGlyph(pose: pose)
            case .group: MetalGroupGlyph(pose: pose)
            case .draw: MetalDrawGlyph(pose: pose)
            case .link: MetalLinkGlyph(pose: pose)
            case .keeper: MetalKeeperGlyph(pose: pose)
            default: EmptyView()
            }
        }
        .frame(width: pose.box, height: pose.box)
    }
}

// MARK: - Grid paths

/// SVG path data on the 24-unit grid, scaled into the shape's rect.
struct MetalGridShape: Shape {
    let d: String
    var transform: CGAffineTransform = .identity

    func path(in rect: CGRect) -> Path {
        let s = rect.width / 24
        return MetalGridPathCache.path(d)
            .applying(transform)
            .applying(CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: rect.minX, ty: rect.minY))
    }
}

enum MetalGridPathCache {
    nonisolated(unsafe) private static var cache: [String: Path] = [:]
    private static let lock = NSLock()

    static func path(_ d: String) -> Path {
        lock.lock()
        defer { lock.unlock() }
        if let p = cache[d] { return p }
        let p = MetalSVGPath.parse(d)
        cache[d] = p
        return p
    }
}

extension CGAffineTransform {
    /// SVG `rotate(deg cx cy)` on the grid.
    static func gridRotation(_ degrees: CGFloat, _ cx: CGFloat, _ cy: CGFloat) -> CGAffineTransform {
        CGAffineTransform(translationX: cx, y: cy)
            .rotated(by: degrees * .pi / 180)
            .translatedBy(x: -cx, y: -cy)
    }
}

private func rectPath(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ r: CGFloat) -> String {
    "M\(x + r) \(y)H\(x + w - r)A\(r) \(r) 0 0 1 \(x + w) \(y + r)V\(y + h - r)A\(r) \(r) 0 0 1 \(x + w - r) \(y + h)"
        + "H\(x + r)A\(r) \(r) 0 0 1 \(x) \(y + h - r)V\(y + r)A\(r) \(r) 0 0 1 \(x + r) \(y)Z"
}

// MARK: - send-away: spiral well + dot

/// Archimedean spiral, clockwise, outer end at −50° + phase.
struct MetalSpiralShape: Shape {
    var phase: Double
    var small: Bool

    var animatableData: Double {
        get { phase }
        set { phase = newValue }
    }

    func path(in rect: CGRect) -> Path {
        let turns = small ? 1.28 : 1.62, r0 = small ? 1.9 : 1.05, r1 = small ? 8.2 : 8.5
        let exponent = small ? 1.0 : 0.92
        let end = (-50 + phase) * .pi / 180
        let sweep = turns * 2 * .pi, a0 = end - sweep
        let s = rect.width / 24
        let n = small ? 56 : 70
        var p = Path()
        for i in 0...n {
            let t = Double(i) / Double(n)
            let rad = r0 + (r1 - r0) * pow(t, exponent), a = a0 + sweep * t
            let pt = CGPoint(x: rect.minX + (12 + rad * cos(a)) * s, y: rect.minY + (12 + rad * sin(a)) * s)
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        return p
    }
}

/// A filled dot in polar grid coordinates about the centre (orbits on arcs).
struct MetalPolarDot: Shape {
    var angle: Double
    var radius: Double
    var dotRadius: Double

    var animatableData: AnimatablePair<AnimatablePair<Double, Double>, Double> {
        get { AnimatablePair(AnimatablePair(angle, radius), dotRadius) }
        set { angle = newValue.first.first; radius = newValue.first.second; dotRadius = newValue.second }
    }

    func path(in rect: CGRect) -> Path {
        let s = rect.width / 24, a = angle * .pi / 180
        let c = CGPoint(x: rect.minX + (12 + radius * cos(a)) * s, y: rect.minY + (12 + radius * sin(a)) * s)
        let r = max(0, dotRadius) * s
        return Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r))
    }
}

private struct SendAwayPress {
    var spin: Double = 0
    var orbit: Double = 0
    var inward: Double = 0
    var dotScale: Double = 1
    var dotOpacity: Double = 1
}

/// Hover: well turns +42°, dot orbits +36° and is drawn in 1.5u. Press:
/// the spiral turns once, the dot orbits +264° into the centre, vanishes,
/// then fades back in.
struct MetalSendAwayGlyph: View {
    let pose: MetalIconHeroPose

    var body: some View {
        let hoverPhase = pose.hover ? 42.0 : 0
        let hoverOrbit = pose.hover ? 36.0 : 0
        let hoverInward = pose.hover ? 1.5 : 0
        let dotAngle = pose.small ? -6.0 : -12.0
        let dotR = pose.small ? 8.2 : 8.35
        let dotSize = pose.small ? 1.6 : 1.4
        KeyframeAnimator(initialValue: SendAwayPress(), trigger: pose.pressCount) { press in
            ZStack {
                MetalSpiralShape(phase: hoverPhase + press.spin, small: pose.small)
                    .stroke(style: pose.stroke)
                MetalPolarDot(
                    angle: dotAngle + hoverOrbit + press.orbit,
                    radius: max(0, dotR - hoverInward - press.inward),
                    dotRadius: dotSize * press.dotScale
                )
                .fill(.foreground)
                .opacity(press.dotOpacity)
            }
            .animation(MetalIconSpring.pose, value: pose.hover)
        } keyframes: { _ in
            KeyframeTrack(\.spin) {
                CubicKeyframe(360, duration: 0.46)
                MoveKeyframe(0)
            }
            KeyframeTrack(\.orbit) {
                CubicKeyframe(264, duration: 0.36)
                MoveKeyframe(0)
            }
            KeyframeTrack(\.inward) {
                CubicKeyframe(dotR, duration: 0.36)
                MoveKeyframe(0)
            }
            KeyframeTrack(\.dotScale) {
                CubicKeyframe(0, duration: 0.36)
                LinearKeyframe(0, duration: 0.08)
                MoveKeyframe(1)
            }
            KeyframeTrack(\.dotOpacity) {
                LinearKeyframe(1, duration: 0.3)
                LinearKeyframe(0, duration: 0.06)
                LinearKeyframe(0, duration: 0.08)
                LinearKeyframe(1, duration: 0.2)
            }
        }
    }
}

// MARK: - note: corner curl

/// r3.5 square 3.5…20.5 with the bottom-right corner cut by `c`.
struct MetalNoteCardShape: Shape {
    var c: Double
    var animatableData: Double {
        get { c }
        set { c = newValue }
    }

    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 20.5, y: 20.5 - c))
        p.addLine(to: CGPoint(x: 20.5, y: 7))
        p.addArc(tangent1End: CGPoint(x: 20.5, y: 3.5), tangent2End: CGPoint(x: 17, y: 3.5), radius: 3.5)
        p.addArc(tangent1End: CGPoint(x: 3.5, y: 3.5), tangent2End: CGPoint(x: 3.5, y: 7), radius: 3.5)
        p.addArc(tangent1End: CGPoint(x: 3.5, y: 20.5), tangent2End: CGPoint(x: 7, y: 20.5), radius: 3.5)
        p.addLine(to: CGPoint(x: 20.5 - c, y: 20.5))
        p.closeSubpath()
        let s = rect.width / 24
        return p.applying(CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: rect.minX, ty: rect.minY))
    }
}

/// The curled flap: a quarter-rounded triangle whose radius grows with the cut.
struct MetalNoteFlapShape: Shape {
    var c: Double
    var animatableData: Double {
        get { c }
        set { c = newValue }
    }

    func path(in rect: CGRect) -> Path {
        let r = 2.4 + (c - 6.3) * (0.9 / 1.9)
        let leg = c - r
        let x0 = 20.5 - c
        var p = Path()
        p.move(to: CGPoint(x: x0, y: 20.5))
        p.addLine(to: CGPoint(x: x0, y: 20.5 - leg))
        p.addArc(tangent1End: CGPoint(x: x0, y: 20.5 - c), tangent2End: CGPoint(x: 20.5, y: 20.5 - c), radius: r)
        p.addLine(to: CGPoint(x: 20.5, y: 20.5 - c))
        p.closeSubpath()
        let s = rect.width / 24
        return p.applying(CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: rect.minX, ty: rect.minY))
    }
}

private struct NoteWrite {
    var first: Double = 1
    var second: Double = 1
}

/// Hover: the corner curls up (cut 6.3 → 8.2) and the flap tint deepens.
/// Press: the content lines write themselves in, 60 ms apart.
struct MetalNoteGlyph: View {
    let pose: MetalIconHeroPose

    var body: some View {
        let c = pose.hover ? 8.2 : 6.3
        KeyframeAnimator(initialValue: NoteWrite(), trigger: pose.pressCount) { write in
            ZStack {
                MetalNoteCardShape(c: c).stroke(style: pose.stroke)
                MetalNoteFlapShape(c: c).fill(.foreground.opacity(max(pose.duotone, pose.hover ? 0.3 : 0.2)))
                MetalNoteFlapShape(c: c).stroke(style: pose.stroke)
                MetalGridShape(d: "M7.6 8.6h8.8").trim(from: 0, to: write.first).stroke(style: pose.stroke)
                MetalGridShape(d: "M7.6 12.2h4.8").trim(from: 0, to: write.second).stroke(style: pose.stroke)
            }
            .animation(MetalIconSpring.pose, value: pose.hover)
        } keyframes: { _ in
            KeyframeTrack(\.first) {
                MoveKeyframe(0)
                CubicKeyframe(1, duration: 0.36)
            }
            KeyframeTrack(\.second) {
                MoveKeyframe(0)
                LinearKeyframe(0, duration: 0.06)
                CubicKeyframe(1, duration: 0.36)
            }
        }
    }
}

// MARK: - link: links separate

/// Hover: the halves pull apart 0.85u along the axis and the bar thins.
/// Press: they snap together (−0.35u) and return.
struct MetalLinkGlyph: View {
    let pose: MetalIconHeroPose

    var body: some View {
        let rest: Double = pose.hover ? 0.85 : 0
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { press in
            MetalLinkParts(sep: rest + press, pose: pose)
                .animation(MetalIconSpring.pose, value: pose.hover)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(-0.35 - rest, duration: 0.15)
                CubicKeyframe(0, duration: 0.19)
            }
        }
    }
}

private struct MetalLinkParts: View, Animatable {
    var sep: Double
    let pose: MetalIconHeroPose

    var animatableData: Double {
        get { sep }
        set { sep = newValue }
    }

    var body: some View {
        let k = sep * pose.scale
        let bar = sep >= 0 ? 1 - 0.38 * sep / 0.85 : 1 + 0.08 * (-sep / 0.35)
        ZStack {
            MetalGridShape(d: "M11.2 7.6l1.4-1.4a3.7 3.7 0 0 1 5.2 5.2l-1.4 1.4")
                .stroke(style: pose.stroke)
                .offset(x: k, y: -k)
            MetalGridShape(d: "M12.8 16.4l-1.4 1.4a3.7 3.7 0 0 1-5.2-5.2l1.4-1.4")
                .stroke(style: pose.stroke)
                .offset(x: -k, y: k)
            MetalGridShape(d: "M9.8 14.2 14.2 9.8")
                .stroke(style: pose.stroke)
                .scaleEffect(bar)
        }
    }
}

// MARK: - draw: the pencil writes a stroke

/// Hover: the tip slides along the curve and inks it (tip and ink locked
/// together, like the web's offset-path). Press: taps the paper.
struct MetalDrawGlyph: View {
    let pose: MetalIconHeroPose

    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { tap in
            MetalDrawParts(progress: pose.hover ? 1 : 0, tap: tap, pose: pose)
                .animation(MetalIconSpring.pose, value: pose.hover)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(1, duration: 0.12)
                CubicKeyframe(0, duration: 0.2)
            }
        }
    }
}

private struct MetalDrawParts: View, Animatable {
    var progress: Double
    var tap: Double
    let pose: MetalIconHeroPose

    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }

    static let ink = "M5.6 17.45c1.05 .7 2 .7 3 0"
    static let pencil: CGAffineTransform = CGAffineTransform.gridRotation(45, 12, 12)
        .concatenating(CGAffineTransform(translationX: -1.6, y: 0.6))

    var body: some View {
        let inkPath = MetalGridPathCache.path(Self.ink)
        let p = min(max(progress, 0), 1)
        let tip = p > 0.001 ? (inkPath.trimmedPath(from: 0, to: p).currentPoint ?? CGPoint(x: 5.6, y: 17.45)) : CGPoint(x: 5.6, y: 17.45)
        let dx = (tip.x - 5.6 - 0.35 * tap) * pose.scale
        let dy = (tip.y - 17.45 + 0.35 * tap) * pose.scale
        ZStack {
            MetalGridShape(d: Self.ink).trim(from: 0, to: p).stroke(style: pose.stroke)
            ZStack {
                MetalGridShape(d: "M9.4 14.4V5.8a2.6 2.6 0 0 1 5.2 0v8.6l-1.75 4a.9.9 0 0 1-1.7 0Z", transform: Self.pencil)
                    .fill(.foreground.opacity(max(pose.duotone, 0.16)))
                MetalGridShape(d: "M9.4 14.4V5.8a2.6 2.6 0 0 1 5.2 0v8.6l-1.75 4a.9.9 0 0 1-1.7 0Z", transform: Self.pencil)
                    .stroke(style: pose.stroke)
                MetalGridShape(d: "M9.4 8.2h5.2", transform: Self.pencil).stroke(style: pose.stroke)
            }
            .offset(x: dx, y: dy)
        }
    }
}

// MARK: - group: folder with cards

private struct GroupPress {
    var drop: Double = 0
}

/// Hover: the cards rise and fan above the flap (50 ms stagger), the flap
/// gives a little. Press: both cards drop into the folder and spring back.
struct MetalGroupGlyph: View {
    let pose: MetalIconHeroPose

    var body: some View {
        KeyframeAnimator(initialValue: GroupPress(), trigger: pose.pressCount) { press in
            if pose.small {
                small(drop: press.drop)
            } else {
                regular(drop: press.drop)
            }
        } keyframes: { _ in
            KeyframeTrack(\.drop) {
                CubicKeyframe(4.8, duration: 0.18)
                SpringKeyframe(0, duration: 0.3, spring: .init(response: 0.42, dampingRatio: 0.66))
            }
        }
    }

    private static let card1 = rectPath(5.6, 6.4, 8.2, 10, 1.7)
    private static let card2 = rectPath(10.2, 7.4, 8.2, 10, 1.7)
    private static let back = "M3.5 12.4V6.3a1.9 1.9 0 0 1 1.9-1.9h3.1a1.6 1.6 0 0 1 1.2.53l1.2 1.37h7.7a1.9 1.9 0 0 1 1.9 1.9v4.2"
    private static let flap = "M3.5 12.2h17v5.4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z"

    private func regular(drop: Double) -> some View {
        let h = pose.hover
        let s = pose.scale
        let gap = pose.gap(3.3, regular: 1.7)
        return ZStack {
            ZStack {
                MetalGridShape(d: Self.back).stroke(style: pose.stroke)
                MetalCardPose(d: Self.card1, rotation: h ? -13 : -8, pivot: CGPoint(x: 9.7, y: 16.4), dx: h ? -0.3 : 0, dy: (h ? -1.5 : 0) + drop) { shape in
                    ZStack {
                        shape.fill(.black)
                        shape.stroke(.black, style: gap)
                    }
                    .blendMode(.destinationOut)
                }
                .animation(MetalIconSpring.pose, value: h)
                MetalCardPose(d: Self.card1, rotation: h ? -13 : -8, pivot: CGPoint(x: 9.7, y: 16.4), dx: h ? -0.3 : 0, dy: (h ? -1.5 : 0) + drop) { shape in
                    shape.stroke(style: pose.stroke)
                }
                .mask(alignment: .top) { Rectangle().frame(height: 11.2 * s) }
                .animation(MetalIconSpring.pose, value: h)
                MetalCardPose(d: Self.card2, rotation: h ? 9 : 5, pivot: CGPoint(x: 14.3, y: 17.4), dx: h ? 0.3 : 0, dy: (h ? -1.9 : 0) + drop) { shape in
                    ZStack {
                        shape.fill(.black)
                        shape.stroke(.black, style: gap)
                    }
                    .blendMode(.destinationOut)
                }
                .animation(MetalIconSpring.pose.delay(MetalIconSpring.stagger), value: h)
                MetalCardPose(d: Self.card2, rotation: h ? 9 : 5, pivot: CGPoint(x: 14.3, y: 17.4), dx: h ? 0.3 : 0, dy: (h ? -1.9 : 0) + drop) { shape in
                    ZStack {
                        shape.fill(.foreground.opacity(max(pose.duotone, 0.14)))
                        shape.stroke(style: pose.stroke)
                    }
                }
                .mask(alignment: .top) { Rectangle().frame(height: 11.2 * s) }
                .animation(MetalIconSpring.pose.delay(MetalIconSpring.stagger), value: h)
            }
            .compositingGroup()
            flapView(h)
        }
    }

    private func small(drop: Double) -> some View {
        let h = pose.hover
        return ZStack {
            MetalGridShape(d: "M3.5 12.2V6.3a1.9 1.9 0 0 1 1.9-1.9h3.1a1.6 1.6 0 0 1 1.2.53l1.2 1.37H12").stroke(style: pose.stroke)
            MetalCardPose(d: "M8.2 11V8.6a1.8 1.8 0 0 1 1.8-1.8h6.6a1.8 1.8 0 0 1 1.8 1.8V11", rotation: h ? 7 : 4, pivot: CGPoint(x: 13, y: 11), dx: 0, dy: (h ? -1.4 : 0) + drop * 0.6) { shape in
                shape.stroke(style: pose.stroke)
            }
            .mask(alignment: .top) { Rectangle().frame(height: 11.6 * pose.scale) }
            .animation(MetalIconSpring.pose, value: h)
            flapView(h, d: "M3.5 12.4h17v5.2a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z")
        }
    }

    private func flapView(_ hover: Bool, d: String = MetalGroupGlyph.flap) -> some View {
        ZStack {
            MetalGridShape(d: d).fill(.foreground.opacity(max(pose.duotone, 0.16)))
            MetalGridShape(d: d).stroke(style: pose.stroke)
        }
        .scaleEffect(x: 1, y: hover ? 0.95 : 1, anchor: UnitPoint(x: 0.5, y: 20.1 / 24))
        .animation(MetalIconSpring.pose, value: hover)
    }
}

/// A grid path posed by animatable rotation (about a grid pivot) and offset,
/// so SwiftUI interpolates the pose rather than the path.
private struct MetalCardPose<Content: View>: View, Animatable {
    let d: String
    var rotation: Double
    let pivot: CGPoint
    var dx: Double
    var dy: Double
    let content: (MetalGridShape) -> Content

    init(d: String, rotation: Double, pivot: CGPoint, dx: Double, dy: Double, @ViewBuilder content: @escaping (MetalGridShape) -> Content) {
        self.d = d
        self.rotation = rotation
        self.pivot = pivot
        self.dx = dx
        self.dy = dy
        self.content = content
    }

    var animatableData: AnimatablePair<Double, AnimatablePair<Double, Double>> {
        get { AnimatablePair(rotation, AnimatablePair(dx, dy)) }
        set { rotation = newValue.first; dx = newValue.second.first; dy = newValue.second.second }
    }

    var body: some View {
        let t = CGAffineTransform.gridRotation(rotation, pivot.x, pivot.y)
            .concatenating(CGAffineTransform(translationX: dx, y: dy))
        content(MetalGridShape(d: d, transform: t))
    }
}

// MARK: - keeper: the buddy

private struct KeeperPress {
    var tilt: Double = 0
    var look: Double = 0
}

/// Hover: blinks (320 ms). Press: the ring tips −8° and the eyes look up.
/// Idle blinking is left to menus that want it; it never loops here.
struct MetalKeeperGlyph: View {
    let pose: MetalIconHeroPose

    var body: some View {
        KeyframeAnimator(initialValue: 1.0, trigger: pose.hoverCount) { blink in
            KeyframeAnimator(initialValue: KeeperPress(), trigger: pose.pressCount) { press in
                parts(blink: blink, press: press)
            } keyframes: { _ in
                KeyframeTrack(\.tilt) {
                    CubicKeyframe(-8, duration: 0.16)
                    SpringKeyframe(0, duration: 0.3, spring: .init(response: 0.42, dampingRatio: 0.66))
                }
                KeyframeTrack(\.look) {
                    CubicKeyframe(-0.9, duration: 0.16)
                    SpringKeyframe(0, duration: 0.3, spring: .init(response: 0.42, dampingRatio: 0.66))
                }
            }
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(0.12, duration: 0.12)
                LinearKeyframe(0.12, duration: 0.06)
                CubicKeyframe(1, duration: 0.14)
            }
        }
    }

    private func parts(blink: Double, press: KeeperPress) -> some View {
        let s = pose.scale
        let small = pose.small
        let centre = small ? CGPoint(x: 12, y: 11.2) : CGPoint(x: 12, y: 11.4)
        let bodyR: CGFloat = small ? 7 : 6.8
        let ringPivot = small ? CGPoint(x: 12, y: 13) : CGPoint(x: 12, y: 12.8)
        let ringRotation = CGAffineTransform.gridRotation(-12 + press.tilt, ringPivot.x, ringPivot.y)
        let front = small ? "M2.4 13a9.6 2.4 0 0 0 19.2 0" : "M2.2 12.8a9.8 2.5 0 0 0 19.6 0"
        let back = "M2.2 12.8a9.8 2.5 0 0 1 19.6 0"
        let eye = small ? CGSize(width: 2.7, height: 4.5) : CGSize(width: 2.4, height: 4.2)
        let eyeY: CGFloat = (small ? 7.2 : 7.5) + press.look
        let eyeXs: [CGFloat] = small ? [8.7, 12.6] : [8.9, 12.7]
        let ringStroke = small ? pose.stroke : StrokeStyle(lineWidth: pose.stroke.lineWidth * 0.88, lineCap: .round, lineJoin: .round)
        let gap = small ? pose.gap(4.4, regular: 1.9) : pose.gap(4, regular: 1.7)
        return ZStack {
            if !small {
                ZStack {
                    MetalGridShape(d: back, transform: ringRotation).stroke(style: ringStroke)
                    Circle()
                        .frame(width: 16 * s, height: 16 * s)
                        .position(x: centre.x * s, y: centre.y * s)
                        .blendMode(.destinationOut)
                }
                .compositingGroup()
            }
            ZStack {
                Circle()
                    .fill(.foreground)
                    .frame(width: bodyR * 2 * s, height: bodyR * 2 * s)
                    .position(x: centre.x * s, y: centre.y * s)
                ForEach(eyeXs, id: \.self) { x in
                    Capsule()
                        .frame(width: eye.width * s, height: eye.height * s)
                        .scaleEffect(x: 1, y: blink, anchor: .center)
                        .position(x: (x + eye.width / 2) * s, y: (eyeY + eye.height / 2) * s)
                        .blendMode(.destinationOut)
                }
                MetalGridShape(d: front, transform: ringRotation)
                    .stroke(.black, style: gap)
                    .blendMode(.destinationOut)
            }
            .compositingGroup()
            MetalGridShape(d: front, transform: ringRotation).stroke(style: ringStroke)
        }
        .frame(width: pose.box, height: pose.box)
    }
}
