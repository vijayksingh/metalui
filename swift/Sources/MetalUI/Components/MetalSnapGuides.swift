import SwiftUI
#if os(macOS)
import AppKit
#endif

/// One alignment in canvas world coordinates. The host places `MetalSnapGuides` inside its
/// transformed world and passes the same scale used for that transform.
public struct MetalSnapGuide: Equatable, Sendable {
    public enum Axis: Hashable, Sendable { case vertical, horizontal }
    public enum Kind: Sendable { case edge, center }

    public let axis: Axis
    public let position: CGFloat
    public let start: CGFloat
    public let end: CGFloat
    public let kind: Kind

    public init(axis: Axis, position: CGFloat, start: CGFloat, end: CGFloat, kind: Kind) {
        self.axis = axis
        self.position = position
        self.start = start
        self.end = end
        self.kind = kind
    }
}

/// The current snap alignments, drawn over the canvas in world coordinates.
/// Pass an empty list when the drag ends. Only departure opacity animates; active lines track
/// the snap immediately. The overlay neither handles input nor adds accessibility content.
public struct MetalSnapGuides: View {
    public let guides: [MetalSnapGuide]
    public let scale: CGFloat

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var lastGuides: [MetalSnapGuide] = []
    @State private var engaged: Set<EngagedLine> = []
    @State private var isLeaving = false
    @State private var clearTask: Task<Void, Never>?

    private var guideOpacity: Double { isLeaving ? .zero : 1 }

    private struct EngagedLine: Hashable {
        let axis: MetalSnapGuide.Axis
        let position: CGFloat

        init(_ guide: MetalSnapGuide) {
            axis = guide.axis
            position = (guide.position * 100).rounded() / 100
        }
    }

    public init(guides: [MetalSnapGuide], scale: CGFloat = 1) {
        self.guides = guides
        self.scale = scale
    }

    public var body: some View {
        let draw = guides.isEmpty ? lastGuides : guides
        let zoom = scale.isFinite && scale > 0 ? scale : 1
        let overshoot = MetalPresence.guideOvershoot / zoom
        let width = MetalPresence.guideWidth / zoom
        let dash = MetalPresence.guideDash / zoom
        let color = (colorway == .graphite ? MetalPresence.guideDark : MetalPresence.guide).color

        GeometryReader { _ in
            if !draw.isEmpty {
                ZStack(alignment: .topLeading) {
                    path(for: .edge, in: draw, overshoot: overshoot)
                        .stroke(color, style: StrokeStyle(lineWidth: width, lineCap: .butt))
                    path(for: .center, in: draw, overshoot: overshoot)
                        .stroke(color, style: StrokeStyle(lineWidth: width, lineCap: .butt, dash: [dash, dash]))
                }
                .opacity(guideOpacity)
                .transaction { if !guides.isEmpty { $0.animation = nil } }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            lastGuides = guides
            engaged = Set(guides.map(EngagedLine.init))
        }
        .onChange(of: guides) { _, next in update(next) }
        .onChange(of: reduceMotion) { _, enabled in
            if enabled && isLeaving { clearImmediately() }
        }
        .onDisappear { clearTask?.cancel() }
    }

    private func path(for kind: MetalSnapGuide.Kind, in guides: [MetalSnapGuide], overshoot: CGFloat) -> Path {
        Path { path in
            for guide in guides where guide.kind == kind {
                let start = min(guide.start, guide.end) - overshoot
                let end = max(guide.start, guide.end) + overshoot
                switch guide.axis {
                case .vertical:
                    path.move(to: CGPoint(x: guide.position, y: start))
                    path.addLine(to: CGPoint(x: guide.position, y: end))
                case .horizontal:
                    path.move(to: CGPoint(x: start, y: guide.position))
                    path.addLine(to: CGPoint(x: end, y: guide.position))
                }
            }
        }
    }

    private func update(_ next: [MetalSnapGuide]) {
        let keys = Set(next.map(EngagedLine.init))
        #if os(macOS)
        if !keys.subtracting(engaged).isEmpty {
            NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .now)
        }
        #endif
        engaged = keys

        clearTask?.cancel()
        clearTask = nil
        if !next.isEmpty {
            // Guide positions and re-engagement must never inherit a surrounding drag animation.
            withAnimation(nil) {
                lastGuides = next
                isLeaving = false
            }
        } else if reduceMotion {
            clearImmediately()
        } else if !lastGuides.isEmpty {
            withMetalAnimation(.release, reduceMotion: false) { isLeaving = true }
            clearTask = Task { @MainActor in
                do { try await Task.sleep(for: .seconds(MetalSprings.release.duration)) }
                catch { return }
                lastGuides = []
                clearTask = nil
            }
        }
    }

    private func clearImmediately() {
        clearTask?.cancel()
        clearTask = nil
        withAnimation(nil) {
            lastGuides = []
            isLeaving = false
        }
    }
}
