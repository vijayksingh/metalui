import SwiftUI

public enum MetalSpinnerSize: Sendable { case regular, small }

/// The presentation clock for any waiting host. The host still owns work, disabled actions and results.
/// Use it around a row, field, card or incoming view; known amounts use MetalProgress.
public struct MetalWaitingPresentation<Content: View>: View {
    private let state: MetalButtonState
    private let showDelay: Double
    private let minVisible: Double
    private let longAfter: Double
    private let content: (MetalButtonState, Bool) -> Content
    @State private var phase: MetalButtonState = .idle
    @State private var long = false
    @State private var visibleAt: Date?

    public init(state: MetalButtonState, showDelay: Double = MetalWaiting.showDelay,
                minVisible: Double = MetalWaiting.minimumVisible, longAfter: Double = MetalWaiting.longAfter,
                @ViewBuilder content: @escaping (MetalButtonState, Bool) -> Content) {
        self.state = state; self.showDelay = max(.zero, showDelay)
        self.minVisible = max(.zero, minVisible); self.longAfter = max(.zero, longAfter)
        self.content = content
    }

    public var body: some View {
        content(phase, long)
            .task(id: state) {
                if state == .waiting {
                    long = false
                    let started = Date()
                    if visibleAt == nil {
                        phase = .idle
                        try? await Task.sleep(for: .seconds(showDelay))
                        guard !Task.isCancelled else { return }
                        visibleAt = Date(); phase = .waiting
                    }
                    try? await Task.sleep(for: .seconds(max(.zero, longAfter - Date().timeIntervalSince(started))))
                    guard !Task.isCancelled else { return }; long = true
                } else {
                    let remaining = state == .idle ? .zero : visibleAt.map { max(.zero, minVisible - Date().timeIntervalSince($0)) } ?? .zero
                    try? await Task.sleep(for: .seconds(remaining))
                    guard !Task.isCancelled else { return }
                    visibleAt = nil; long = false; phase = state
                }
            }
    }
}

/// A current-ink arc in a host glyph slot; no sunk well. All clocks stop when hidden or inactive.
public struct MetalSpinner: View {
    private let size: MetalSpinnerSize
    private let diameter: CGFloat?
    private let label: String
    private let active: Bool
    private let announce: Bool
    private let showDelay: Double
    private let minVisible: Double

    public init(size: MetalSpinnerSize = .regular, diameter: CGFloat? = nil, label: String = "Loading",
                active: Bool = true, announce: Bool = true, showDelay: Double = MetalWaiting.showDelay,
                minVisible: Double = MetalWaiting.minimumVisible) {
        self.size = size; self.diameter = diameter; self.label = label; self.active = active
        self.announce = announce; self.showDelay = showDelay; self.minVisible = minVisible
    }

    public var body: some View {
        let d = diameter ?? MetalRecipes.spinner.points(size == .small ? "self.small" : "self.size")
        MetalWaitingPresentation(state: active ? .waiting : .done, showDelay: showDelay, minVisible: minVisible) { phase, _ in
            Group {
                if phase == .waiting { MetalWaitingArc().transition(.opacity) }
                else { Color.clear }
            }
            .frame(width: d, height: d)
            .accessibilityHidden(!announce || phase != .waiting)
            .accessibilityLabel(label)
            .animation(.easeOut(duration: MetalRecipes.spinner.durationSeconds("self.fade")), value: phase)
        }
    }
}

private struct MetalWaitingArc: View {
    @MetalMotionPreference private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var appeared = false
    @State private var start = Date()

    var body: some View {
        let recipe = MetalRecipes.spinner
        let tail = recipe.scalar("self.tail")
        TimelineView(.animation(paused: !appeared || scenePhase != .active)) { context in
            let elapsed = context.date.timeIntervalSince(start)
            let progress = elapsed / recipe.durationSeconds("self.turn")
            let pulse = elapsed / MetalRecipes.progress.durationSeconds("segment.breathe")
            let dim = MetalRecipes.progress.scalar("segment.dim")
            let level = reduceMotion ? dim + (1 - dim) * (1 - cos(pulse * .pi)) / 2 : 1
            Circle()
                .strokeBorder(.foreground, lineWidth: recipe.points("self.ring"))
                .mask(AngularGradient(stops: [.init(color: .clear, location: .zero),
                    .init(color: .clear, location: 1 - tail), .init(color: .white, location: 1)], center: .center))
                .rotationEffect(reduceMotion ? .zero : .degrees(progress * 360))
                .opacity(level)
        }
        .onAppear { appeared = true; start = Date() }
        .onDisappear { appeared = false }
    }
}

/// A large waiting host reserves the incoming image/text shape, rather than centering an arc.
/// Compose these inside MetalWaitingPresentation; geometry comes from the content being loaded.
public struct MetalWaitingShape: View {
    private let width: CGFloat?
    private let height: CGFloat
    public init(width: CGFloat? = nil, height: CGFloat = MetalRecipes.skeleton.points("self.line")) {
        self.width = width; self.height = height
    }
    public var body: some View {
        Color.clear
            .frame(width: width, height: height)
            .metalObjectRecipe(MetalRecipes.well, part: "field",
                               in: RoundedRectangle(cornerRadius: MetalRecipes.skeleton.points("self.radius"), style: .continuous))
            .accessibilityHidden(true)
    }
}
