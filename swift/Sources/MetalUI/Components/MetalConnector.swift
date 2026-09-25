import SwiftUI

/// World-space connector chrome. The host supplies routed endpoints and owns attachment changes.
public struct MetalConnector: View {
    public struct End: Sendable, Equatable {
        public var point: CGPoint
        public var attached: Bool
        public init(_ point: CGPoint, attached: Bool) { self.point = point; self.attached = attached }
    }

    public enum Look: Sendable { case elastic, current, stardust }
    public enum Flow: Sendable { case forward, backward, both }
    public enum State: Sendable { case rest, hover, selected }
    public enum Side: Sendable { case from, to }

    public let from: End
    public let to: End
    public let look: Look
    public let flow: Flow
    public let ink: Color
    public let width: CGFloat
    public let state: State
    public let label: String?
    public let scale: CGFloat
    public let showsPath: Bool
    public let onPress: () -> Void
    public let onEndPress: (Side) -> Void
    public let onHoverChange: (Bool) -> Void

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var middle = CGPoint.zero

    public init(from: End, to: End, look: Look = .elastic, flow: Flow = .forward,
                ink: Color = .primary, width: CGFloat = 2, state: State = .rest,
                label: String? = nil, scale: CGFloat = 1, showsPath: Bool = true,
                onPress: @escaping () -> Void = {},
                onEndPress: @escaping (Side) -> Void = { _ in },
                onHoverChange: @escaping (Bool) -> Void = { _ in }) {
        self.from = from; self.to = to; self.look = look; self.flow = flow
        self.ink = ink; self.width = width; self.state = state
        self.label = label; self.scale = scale
        self.showsPath = showsPath
        self.onPress = onPress; self.onEndPress = onEndPress; self.onHoverChange = onHoverChange
    }

    public var body: some View {
        let recipe = MetalRecipes.connector
        let zoom = scale.isFinite && scale > 0 ? scale : 1
        let centre = CGPoint(x: (from.point.x + to.point.x) / 2, y: (from.point.y + to.point.y) / 2)
        let mid = reduceMotion ? centre : middle
        let band = bandPath(mid)
        ZStack(alignment: .topLeading) {
            if showsPath && state != .rest {
                band.stroke((recipe.color("halo.ink", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink).color,
                            style: StrokeStyle(lineWidth: recipe.points("halo.width") / zoom, lineCap: .round))
            }
            if !showsPath {
                EmptyView()
            } else if look == .elastic || reduceMotion {
                band.stroke(ink, style: StrokeStyle(lineWidth: width, lineCap: .round))
                arrowheads(mid).stroke(ink, style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round))
            } else {
                TimelineView(.animation(minimumInterval: 1.0 / 120.0)) { timeline in
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    if look == .current { current(mid: mid, time: t) }
                    else { stardust(mid: mid, time: t) }
                }
            }
            if showsPath {
                band.stroke(.clear, style: StrokeStyle(lineWidth: recipe.points("hit.width") / zoom))
                    .contentShape(band.strokedPath(StrokeStyle(lineWidth: recipe.points("hit.width") / zoom)))
                    .onTapGesture(perform: onPress)
                    .onHover(perform: onHoverChange)
            }
            ForEach([Side.from, .to], id: \.self) { side in
                let end = side == .from ? from : to
                let radius = recipe.points(state == .selected ? "handle.size" : "end.size") / zoom
                Circle()
                    .fill(state == .selected || end.attached ? ink :
                          (recipe.color("end.free-fill", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.s).color)
                    .overlay(Circle().stroke(ink, lineWidth: recipe.points("end.ring") / zoom))
                    .frame(width: radius * 2, height: radius * 2)
                    .position(end.point)
                    .onTapGesture { onEndPress(side) }
            }
            if let label, !label.isEmpty {
                Text(label)
                    .font(.system(size: 12 / zoom))
                    .padding(.horizontal, recipe.points("label.pad-x") / zoom)
                    .padding(.vertical, recipe.points("label.pad-y") / zoom)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: recipe.points("label.radius") / zoom))
                    .position(mid)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label.map { "Connector: \($0)" } ?? "Connector")
        .onAppear { middle = centre }
        .onChange(of: from) { _, _ in settle(to: centre) }
        .onChange(of: to) { _, _ in settle(to: centre) }
    }

    private func settle(to centre: CGPoint) {
        if reduceMotion { middle = centre }
        else { withAnimation(.interpolatingSpring(stiffness: 170, damping: 13)) { middle = centre } }
    }

    private func bandPath(_ mid: CGPoint) -> Path {
        let a = from.point, b = to.point
        let control = CGPoint(x: 2 * mid.x - (a.x + b.x) / 2,
                              y: 2 * mid.y - (a.y + b.y) / 2)
        return Path { path in path.move(to: a); path.addQuadCurve(to: b, control: control) }
    }

    private func point(_ fraction: Double, mid: CGPoint) -> CGPoint {
        let a = from.point, b = to.point
        let c = CGPoint(x: 2 * mid.x - (a.x + b.x) / 2, y: 2 * mid.y - (a.y + b.y) / 2)
        let u = 1 - fraction
        return CGPoint(x: u*u*a.x + 2*u*fraction*c.x + fraction*fraction*b.x,
                       y: u*u*a.y + 2*u*fraction*c.y + fraction*fraction*b.y)
    }

    private func arrowheads(_ mid: CGPoint) -> Path {
        let length = width * 3.2 + 5
        return Path { path in
            for (enabled, tip, before) in [
                (flow != .backward, to.point, point(0.92, mid: mid)),
                (flow != .forward, from.point, point(0.08, mid: mid))
            ] where enabled {
                let angle = atan2(tip.y - before.y, tip.x - before.x)
                path.move(to: CGPoint(x: tip.x - length * cos(angle - 0.5), y: tip.y - length * sin(angle - 0.5)))
                path.addLine(to: tip)
                path.addLine(to: CGPoint(x: tip.x - length * cos(angle + 0.5), y: tip.y - length * sin(angle + 0.5)))
            }
        }
    }

    @ViewBuilder private func current(mid: CGPoint, time: Double) -> some View {
        bandPath(mid).stroke(ink.opacity(0.3), style: StrokeStyle(lineWidth: width, lineCap: .round))
        ForEach(0..<6, id: \.self) { index in
            let direction = index < 3 ? 1.0 : -1.0
            let enabled = direction > 0 ? flow != .backward : flow != .forward
            if enabled {
                let phase = (time * 0.38 + Double(index % 3) / 3 + (index >= 3 ? 1.0 / 6 : 0)).truncatingRemainder(dividingBy: 1)
                let progress = 0.5 - 0.5 * cos(.pi * phase)
                let head = direction > 0 ? progress : 1 - progress
                let position = point(head, mid: mid)
                Circle().fill(ink.opacity(sqrt(max(0, sin(.pi * phase)))))
                    .frame(width: width * 1.7, height: width * 1.7)
                    .position(position)
                ForEach(1..<16, id: \.self) { tail in
                    let fraction = head - direction * Double(tail) * 0.014 * (0.25 + 1.1 * sin(.pi * phase))
                    if (0...1).contains(fraction) {
                        let p = point(fraction, mid: mid)
                        Circle().fill(ink.opacity(pow(1 - Double(tail) / 16, 1.4) * sqrt(max(0, sin(.pi * phase)))))
                            .frame(width: width * (1 - Double(tail) / 20), height: width * (1 - Double(tail) / 20))
                            .position(p)
                    }
                }
            }
        }
    }

    @ViewBuilder private func stardust(mid: CGPoint, time: Double) -> some View {
        ForEach(0..<34, id: \.self) { index in
            let fraction = Double(index) / 33
            let p = point(fraction, mid: mid)
            let next = point(min(1, fraction + 0.01), mid: mid)
            let tangent = max(1, hypot(next.x - p.x, next.y - p.y))
            let loose = state == .rest ? 1.0 : 0.0
            let drift = (sin(time * 1.3 + Double(index) * 2.1) + sin(time * 0.7 + Double(index) * 5.3) * 0.6) * 3.4 * loose
            let shimmer = max(0, 1 - abs((fraction - time * 0.5).truncatingRemainder(dividingBy: 1) - 0.5) * 7)
            Circle().fill(ink.opacity(min(1, 0.45 + shimmer * 0.6)))
                .frame(width: width * (1.24 + shimmer * 0.9), height: width * (1.24 + shimmer * 0.9))
                .position(x: p.x - (next.y - p.y) / tangent * drift,
                          y: p.y + (next.x - p.x) / tangent * drift)
        }
    }
}
