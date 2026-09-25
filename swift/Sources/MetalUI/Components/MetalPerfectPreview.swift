import SwiftUI

/// World-space feedback for a held stroke. Recognition and the final geometry belong to the host.
public struct MetalPerfectPreview: View {
    public enum Phase: Sendable { case idle, holding, done, tuning }

    public struct Tune: Sendable {
        public let centre: CGPoint
        public let pointer: CGPoint
        public let angle: Double
        public let scale: Double

        public init(centre: CGPoint, pointer: CGPoint, angle: Double, scale: Double) {
            self.centre = centre
            self.pointer = pointer
            self.angle = angle
            self.scale = scale
        }
    }

    public let outline: Path
    public let phase: Phase
    public let tune: Tune?
    public let scale: CGFloat
    public let onHeld: () -> Void

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var trace: CGFloat = 0

    public init(outline: Path, phase: Phase, tune: Tune? = nil, scale: CGFloat = 1,
                onHeld: @escaping () -> Void = {}) {
        self.outline = outline
        self.phase = phase
        self.tune = tune
        self.scale = scale
        self.onHeld = onHeld
    }

    public var body: some View {
        let recipe = MetalRecipes.perfect
        let zoom = scale.isFinite && scale > 0 ? scale : 1
        let ink = (colorway == .graphite ? MetalPresence.guideDark : MetalPresence.guide).color
        ZStack(alignment: .topLeading) {
            if phase == .holding || phase == .done {
                outline.trimmedPath(from: 0, to: reduceMotion ? 1 : trace)
                    .stroke(ink.opacity(recipe.scalar("self.opacity")),
                            style: StrokeStyle(lineWidth: recipe.points("self.line") / zoom, lineCap: .round))
                    .opacity(phase == .done ? 0 : 1)
            }
            if phase == .tuning, let tune {
                Path { path in
                    path.move(to: tune.centre)
                    path.addLine(to: tune.pointer)
                }
                .stroke(ink, style: StrokeStyle(lineWidth: recipe.points("self.line") / zoom,
                                                dash: [3 / zoom, 3 / zoom]))
                Circle().fill(ink)
                    .frame(width: recipe.points("tune.centre") * 2 / zoom,
                           height: recipe.points("tune.centre") * 2 / zoom)
                    .position(tune.centre)
                Text("\(Int(tune.angle.rounded()))° · \(Int((tune.scale * 100).rounded())) %")
                    .font(.system(size: 11 / zoom, weight: .medium, design: .rounded))
                    .foregroundStyle(ink)
                    .position(x: tune.pointer.x, y: tune.pointer.y - recipe.points("tune.readout-gap") / zoom)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .task(id: phase) {
            guard phase == .holding else { trace = 0; return }
            trace = reduceMotion ? 1 : 0
            if !reduceMotion {
                withAnimation(.linear(duration: 0.45)) { trace = 1 }
            }
            try? await Task.sleep(for: .milliseconds(450))
            if !Task.isCancelled { onHeld() }
        }
    }
}
