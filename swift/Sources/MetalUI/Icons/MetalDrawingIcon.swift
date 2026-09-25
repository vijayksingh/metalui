import SwiftUI

/// Seven drawing glyphs with the part motion authored in icons.mjs. Use inside a control that
/// supplies `metalIconInteraction`; standalone glyphs also respond to pointer hover.
public struct MetalDrawingIcon: View {
    let icon: MetalIconName
    let size: CGFloat
    let weight: Font.Weight
    @Environment(\.metalIconInteraction) private var hostInteraction
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.metalColorway) private var colorway
    @State private var ownHover = false
    @State private var hoverCount = 0
    @State private var pressCount = 0

    public init(_ icon: MetalIconName, size: CGFloat = 16, weight: Font.Weight = .regular) {
        self.icon = icon
        self.size = size
        self.weight = weight
    }

    public var body: some View {
        let interaction = hostInteraction ?? MetalIconInteraction(isHovered: ownHover)
        let animated = !reduceMotion
        let pose = MetalIconHeroPose(
            box: size,
            lineUnits: MetalIconMetrics.strokeUnits(for: weight, regular: size <= 16 ? icon.smallStrokeUnits : 1.7),
            small: size <= 16,
            hover: animated && interaction.isHovered,
            hoverCount: hoverCount,
            pressCount: pressCount,
            duotone: (interaction.isHovered ? icon.hoverDuotone : icon.restingDuotone) * colorway.tokens.duoK
        )
        Group {
            if animated {
                switch icon {
                case .pen: MetalPenGlyph(pose: pose)
                case .marker: MetalMarkerGlyph(pose: pose)
                case .line: MetalLineGlyph(pose: pose)
                case .arrow: MetalArrowGlyph(pose: pose)
                case .rectangle: MetalRectangleGlyph(pose: pose)
                case .ellipse: MetalEllipseGlyph(pose: pose)
                case .eraser: MetalEraserGlyph(pose: pose)
                default: MetalIcon(icon, size: size, weight: weight)
                }
            } else {
                MetalIcon(icon, size: size, weight: weight)
            }
        }
        .frame(width: size, height: size)
        .contentShape(Rectangle())
        .onHover { if hostInteraction == nil { ownHover = $0 } }
        .onChange(of: interaction.isHovered) { _, hovered in if hovered { hoverCount += 1 } }
        .onChange(of: interaction.isPressed) { _, pressed in if pressed { pressCount += 1 } }
        .accessibilityHidden(true)
    }
}

private enum DrawingPaths {
    static let pen = "M8.8 3.2h6.4v5.2l1.4 2.8-4.6 8.2-4.6-8.2 1.4-2.8Z"
    static let marker = "M9.4 4.6a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v8.8H9.4Z"
    static let markerTip = "M10.2 13.4h3.6v2.1l-3.6 3.1Z"
    static let eraser = "M8.8 5.4a2 2 0 0 1 2-2h2.4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2.4a2 2 0 0 1-2-2Z"
    static let tilted = CGAffineTransform.gridRotation(45, 12, 12)
        .concatenating(CGAffineTransform(translationX: -1.6, y: 0.6))
}

/// Grid path wrapper keeps repeated contours in one 24-unit coordinate space.
private struct DrawingStroke: View {
    let d: String
    let pose: MetalIconHeroPose
    var transform: CGAffineTransform = .identity
    var progress: CGFloat = 1
    var width: CGFloat? = nil

    var body: some View {
        MetalGridShape(d: d, transform: transform)
            .trim(from: 0, to: progress)
            .stroke(.foreground, style: StrokeStyle(lineWidth: (width ?? pose.lineUnits) * pose.scale,
                                                    lineCap: .round, lineJoin: .round))
            .frame(width: pose.box, height: pose.box)
    }
}

private struct DrawingFill: View {
    let d: String
    let pose: MetalIconHeroPose
    var transform: CGAffineTransform = .identity
    var opacity: Double = 1

    var body: some View {
        MetalGridShape(d: d, transform: transform)
            .fill(.foreground.opacity(opacity))
            .frame(width: pose.box, height: pose.box)
    }
}

private struct MetalPenGlyph: View {
    let pose: MetalIconHeroPose
    private static let wave = "M5.2 17.8c.8-.9 1.7-.9 2.4 0s1.6.9 2.4 0"

    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { dip in
            PenParts(pose: pose, progress: pose.hover ? 1 : 0, dip: dip)
                .animation(MetalIconSpring.pose, value: pose.hover)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(1, duration: 0.15)
                CubicKeyframe(0, duration: 0.35)
            }
        }
    }

    private struct PenParts: View, Animatable {
        let pose: MetalIconHeroPose
        var progress: Double
        var dip: Double
        var animatableData: Double {
            get { progress }
            set { progress = newValue }
        }

        var body: some View {
            let path = MetalGridPathCache.path(MetalPenGlyph.wave)
            let p = max(0, min(1, progress))
            let tip = p > 0 ? path.trimmedPath(from: 0, to: p).currentPoint ?? CGPoint(x: 5.2, y: 17.8) : CGPoint(x: 5.2, y: 17.8)
            ZStack {
                DrawingStroke(d: MetalPenGlyph.wave, pose: pose, progress: p, width: pose.lineUnits + dip)
                Circle().fill(.foreground).frame(width: 3.4 * pose.scale, height: 3.4 * pose.scale)
                    .position(x: 10 * pose.scale, y: 17.8 * pose.scale)
                    .scaleEffect(dip > 0 ? dip : 0)
                    .opacity(dip * (1 - dip * 0.7))
                ZStack {
                    DrawingFill(d: DrawingPaths.pen, pose: pose, transform: DrawingPaths.tilted, opacity: max(pose.duotone, 0.16))
                    DrawingStroke(d: DrawingPaths.pen, pose: pose, transform: DrawingPaths.tilted)
                    DrawingStroke(d: "M12 19.4v-5", pose: pose, transform: DrawingPaths.tilted)
                    DrawingFill(d: "M12 11.65a.75.75 0 1 1 0 1.5a.75.75 0 1 1 0-1.5", pose: pose, transform: DrawingPaths.tilted)
                }
                .offset(x: (tip.x - 5.2 + dip * 0.35) * pose.scale,
                        y: (tip.y - 17.8 + dip * 0.55) * pose.scale)
                .scaleEffect(x: 1 + dip * 0.05, y: 1 - dip * 0.08, anchor: UnitPoint(x: 5.2 / 24, y: 17.8 / 24))
            }
            .frame(width: pose.box, height: pose.box)
        }
    }
}

private struct MetalMarkerGlyph: View {
    let pose: MetalIconHeroPose
    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { sweep in
            MarkerParts(pose: pose, progress: pose.hover ? 1 : 0, sweep: sweep)
                .animation(MetalIconSpring.pose, value: pose.hover)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(-0.2, duration: 0.20)
                CubicKeyframe(1.1, duration: 0.32)
                CubicKeyframe(0, duration: 0.10)
            }
        }
    }

    private struct MarkerParts: View, Animatable {
        let pose: MetalIconHeroPose
        var progress: Double
        var sweep: Double
        var animatableData: Double {
            get { progress }
            set { progress = newValue }
        }
        var body: some View {
            let travel = sweep == 0 ? progress : max(0, min(1, sweep))
            ZStack {
                RoundedRectangle(cornerRadius: 1.3 * pose.scale)
                    .fill(.foreground.opacity(0.26))
                    .frame(width: 4.4 * pose.scale, height: 3.4 * pose.scale)
                    .scaleEffect(x: travel, y: 1, anchor: .leading)
                    .position(x: 5.8 * pose.scale, y: 16.9 * pose.scale)
                ZStack {
                    DrawingFill(d: DrawingPaths.marker, pose: pose, transform: DrawingPaths.tilted, opacity: max(pose.duotone, 0.16))
                    DrawingStroke(d: DrawingPaths.marker, pose: pose, transform: DrawingPaths.tilted)
                    DrawingStroke(d: DrawingPaths.markerTip, pose: pose, transform: DrawingPaths.tilted)
                }
                .offset(x: 3.4 * travel * pose.scale, y: sweep < 0 ? -0.9 * pose.scale : 0)
                .rotationEffect(.degrees(sweep < 0 ? 4 : 0), anchor: UnitPoint(x: 4.5 / 24, y: 16 / 24))
            }
            .frame(width: pose.box, height: pose.box)
        }
    }
}

private struct MetalLineGlyph: View {
    let pose: MetalIconHeroPose
    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.hoverCount) { bow in
            KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { pull in
                ZStack {
                    MetalBentLine(bow: bow, pull: pull)
                        .stroke(.foreground, style: pose.stroke)
                    Circle().stroke(.foreground, lineWidth: pose.lineUnits * pose.scale)
                        .frame(width: 2.6 * pose.scale, height: 2.6 * pose.scale)
                        .position(x: 5.4 * pose.scale, y: 18.6 * pose.scale)
                    Circle().stroke(.foreground, lineWidth: pose.lineUnits * pose.scale)
                        .frame(width: 2.6 * pose.scale, height: 2.6 * pose.scale)
                        .position(x: (18.6 - 13.2 * pull) * pose.scale, y: (5.4 + 13.2 * pull) * pose.scale)
                }
                .frame(width: pose.box, height: pose.box)
            } keyframes: { _ in
                KeyframeTrack(\.self) {
                    CubicKeyframe(1, duration: 0.22)
                    CubicKeyframe(0, duration: 0.42)
                }
            }
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(-3, duration: 0.14)
                CubicKeyframe(2, duration: 0.20)
                CubicKeyframe(-1, duration: 0.18)
                CubicKeyframe(0.4, duration: 0.18)
                CubicKeyframe(0, duration: 0.20)
            }
        }
    }
}

private struct MetalBentLine: Shape {
    var bow: Double
    var pull: Double
    var animatableData: AnimatablePair<Double, Double> {
        get { AnimatablePair(bow, pull) }
        set { bow = newValue.first; pull = newValue.second }
    }
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 24
        var p = Path()
        p.move(to: CGPoint(x: 5.4 * s, y: 18.6 * s))
        p.addCurve(to: CGPoint(x: (18.6 - 13.2 * pull) * s, y: (5.4 + 13.2 * pull) * s),
                   control1: CGPoint(x: (9.8 + bow) * s, y: (14.2 + bow) * s),
                   control2: CGPoint(x: (14.2 + bow) * s, y: (9.8 + bow) * s))
        return p
    }
}

private struct MetalArrowGlyph: View {
    let pose: MetalIconHeroPose
    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { fire in
            ZStack {
                MetalArrowShaft(bend: pose.hover ? 1 : 0)
                    .stroke(.foreground, style: pose.stroke)
                    .animation(MetalIconSpring.pose, value: pose.hover)
                    .scaleEffect(1 + fire * 0.12, anchor: UnitPoint(x: 5.4 / 24, y: 18.6 / 24))
                DrawingStroke(d: "M10.8 5.4h7.8v7.8", pose: pose)
                    .rotationEffect(.degrees(pose.hover ? 45 : 0), anchor: UnitPoint(x: 18.6 / 24, y: 5.4 / 24))
                    .animation(MetalIconSpring.pose.delay(0.05), value: pose.hover)
            }
            .offset(x: fire * 1.5 * pose.scale, y: -fire * 1.5 * pose.scale)
            .frame(width: pose.box, height: pose.box)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(-0.9, duration: 0.14)
                CubicKeyframe(1, duration: 0.14)
                CubicKeyframe(0, duration: 0.22)
            }
        }
    }
}

private struct MetalArrowShaft: Shape {
    var bend: Double
    var animatableData: Double {
        get { bend }
        set { bend = newValue }
    }
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 24
        var p = Path()
        p.move(to: CGPoint(x: 5.4 * s, y: 18.6 * s))
        p.addCurve(to: CGPoint(x: (18 - 0.2 * bend) * s, y: (6 - 0.6 * bend) * s),
                   control1: CGPoint(x: (9.6 - 4 * bend) * s, y: (14.4 - 3.2 * bend) * s),
                   control2: CGPoint(x: (13.8 - 3.6 * bend) * s, y: (10.2 - 4.8 * bend) * s))
        return p
    }
}

private struct MetalRectangleGlyph: View {
    let pose: MetalIconHeroPose
    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.hoverCount) { rough in
            KeyframeAnimator(initialValue: 1.0, trigger: pose.pressCount) { draw in
                ZStack {
                    MetalRectangleContour(rough: rough)
                        .stroke(.foreground, style: pose.stroke)
                        .scaleEffect(x: draw, y: draw, anchor: UnitPoint(x: 3.4 / 24, y: 5 / 24))
                    Circle().fill(.foreground)
                        .frame(width: 3.4 * pose.scale, height: 3.4 * pose.scale)
                        .position(x: (3.4 + 17.2 * draw) * pose.scale, y: (5 + 14 * draw) * pose.scale)
                        .opacity(draw < 1 ? 1 : 0)
                }
                .frame(width: pose.box, height: pose.box)
            } keyframes: { _ in
                KeyframeTrack(\.self) {
                    CubicKeyframe(0.24, duration: 0.17)
                    CubicKeyframe(1.08, duration: 0.27)
                    CubicKeyframe(1, duration: 0.16)
                }
            }
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(1, duration: 0.22)
                SpringKeyframe(0, spring: Spring(response: 0.42, dampingRatio: 0.66))
            }
        }
    }
}

private struct MetalRectangleContour: Shape {
    var rough: Double
    var animatableData: Double {
        get { rough }
        set { rough = newValue }
    }
    func path(in rect: CGRect) -> Path {
        let s = rect.width / 24
        let clean = MetalGridPathCache.path("M6.6 5L17.4 5A3.2 3.2 0 0 1 20.6 8.2L20.6 15.8A3.2 3.2 0 0 1 17.4 19L6.6 19A3.2 3.2 0 0 1 3.4 15.8L3.4 8.2A3.2 3.2 0 0 1 6.6 5Z")
        let roughPath = MetalGridPathCache.path("M5.9 6.1L17.9 4.5A3.2 3.2 0 0 1 21.1 7.7L20.2 16.4A3.2 3.2 0 0 1 16.9 19.5L7.3 18.6A3.2 3.2 0 0 1 4 15.3L3 8.9A3.2 3.2 0 0 1 5.9 6.1Z")
        return (rough > 0.5 ? roughPath : clean).applying(CGAffineTransform(scaleX: s, y: s))
    }
}

private struct MetalEllipseGlyph: View {
    let pose: MetalIconHeroPose
    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { trace in
            ZStack {
                Ellipse().stroke(.foreground, style: pose.stroke)
                    .frame(width: 17.2 * pose.scale, height: 13.8 * pose.scale)
                    .opacity(trace > 0 && trace < 1 ? 0.18 : 1)
                Ellipse().trim(from: 0, to: trace)
                    .stroke(.foreground, style: pose.stroke)
                    .frame(width: 17.2 * pose.scale, height: 13.8 * pose.scale)
                Circle().fill(.foreground)
                    .frame(width: 2.8 * pose.scale, height: 2.8 * pose.scale)
                    .offset(x: 8.6 * cos(trace * 2 * .pi) * pose.scale,
                            y: 6.9 * sin(trace * 2 * .pi) * pose.scale)
                    .opacity(trace > 0 && trace < 0.96 ? 1 : 0)
            }
            .scaleEffect(x: pose.hover ? 0.97 : 1, y: pose.hover ? 1.12 : 1)
            .animation(MetalIconSpring.pose, value: pose.hover)
            .frame(width: pose.box, height: pose.box)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(1, duration: 0.62)
                MoveKeyframe(0)
            }
        }
    }
}

private struct MetalEraserGlyph: View {
    let pose: MetalIconHeroPose
    var body: some View {
        KeyframeAnimator(initialValue: 0.0, trigger: pose.pressCount) { rub in
            ZStack {
                DrawingStroke(d: "M3.6 20.6c.9-.7 1.9-.7 2.8 0s1.9.7 2.8 0", pose: pose,
                              progress: pose.hover ? max(0, 1 - abs(rub)) : 0, width: 1.3)
                ForEach(0..<2, id: \.self) { index in
                    Circle().fill(.foreground)
                        .frame(width: (index == 0 ? 1.2 : 1) * pose.scale,
                               height: (index == 0 ? 1.2 : 1) * pose.scale)
                        .position(x: (index == 0 ? 7 : 8) * pose.scale,
                                  y: (index == 0 ? 19.6 : 20.2) * pose.scale)
                        .offset(x: rub * (index == 0 ? -2.2 : 1.6) * pose.scale,
                                y: abs(rub) * pose.scale)
                        .opacity(abs(rub))
                }
                ZStack {
                    DrawingFill(d: DrawingPaths.eraser, pose: pose, transform: DrawingPaths.tilted, opacity: max(pose.duotone, 0.16))
                    DrawingStroke(d: DrawingPaths.eraser, pose: pose, transform: DrawingPaths.tilted)
                    DrawingStroke(d: "M8.8 12.8h6.4", pose: pose, transform: DrawingPaths.tilted)
                }
                .rotationEffect(.degrees(pose.hover ? -7 : 0), anchor: UnitPoint(x: 6.2 / 24, y: 18.8 / 24))
                .offset(x: rub * 2.6 * pose.scale, y: abs(rub) * 0.3 * pose.scale)
                .animation(MetalIconSpring.pose, value: pose.hover)
            }
            .frame(width: pose.box, height: pose.box)
        } keyframes: { _ in
            KeyframeTrack(\.self) {
                CubicKeyframe(-1, duration: 0.17)
                CubicKeyframe(0.7, duration: 0.17)
                CubicKeyframe(-0.4, duration: 0.17)
                CubicKeyframe(0, duration: 0.21)
            }
        }
    }
}
