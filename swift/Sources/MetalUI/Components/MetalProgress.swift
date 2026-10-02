import SwiftUI

public enum MetalProgressState: String, Sendable { case idle, running, complete, failed, paused, cancelled }
public enum MetalProgressShape: Sendable { case bar, slim, ring, segmented, buffered }
public enum MetalProgressSize: Sendable { case compact, regular }

/// Task amount and state; all shapes share the switch material and progress contract.
public struct MetalProgress: View {
    private let label: String?
    private let value: Double?
    private let total: Double
    private let state: MetalProgressState
    private let shape: MetalProgressShape
    private let size: MetalProgressSize
    private let steps: Int
    private let buffer: Double?
    private let detail: String?
    private let completeLabel: String?
    private let showValue: Bool
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    @State private var visible = false
    @State private var settled: Bool

    public init(_ label: String? = nil, value: Double?, total: Double = 100,
                state: MetalProgressState? = nil, shape: MetalProgressShape = .bar,
                size: MetalProgressSize = .regular, steps: Int = 4, buffer: Double? = nil,
                detail: String? = nil, completeLabel: String? = nil, showValue: Bool = true) {
        self.label = label; self.value = value; self.total = max(Double.leastNonzeroMagnitude, total)
        self.state = state ?? (value.map { $0 >= total } == true ? .complete : .running)
        self.shape = shape; self.size = size; self.steps = max(1, steps); self.buffer = buffer
        self.detail = detail; self.completeLabel = completeLabel; self.showValue = showValue
        _settled = State(initialValue: value.map { $0 >= total } == true)
    }
    private var ratio: Double { min(1, max(0, (value ?? 0) / total)) }
    private var height: Double { size == .compact ? MetalSpace.s4 : MetalRecipes.progress.points("self.height") }
    private var fillColor: Color { state == .failed ? colorway.tokens.invalid.color : MetalShared.greenDeep.color }
    private var glyph: MetalIconName { state == .failed ? .syncError : settled && state == .complete ? .check : state == .paused ? .pause : state == .cancelled ? .close : .document }
    private var displayLabel: String { settled && state == .complete ? completeLabel ?? label ?? "Progress" : label ?? "Progress" }
    private var spokenState: String { state == .complete && !settled ? "finishing" : state.rawValue }
    public var body: some View {
        VStack(alignment: .leading, spacing: MetalRecipes.progress.points("self.gap")) {
            if shape != .slim && (label != nil || showValue) {
                HStack(alignment: .firstTextBaseline) {
                    if label != nil {
                        HStack(spacing: MetalLayout.gapRelated) {
                            MetalMorphIcon(glyph, size: MetalRecipes.button.points("compact.glyph"))
                            Text(displayLabel)
                                .contentTransition(.numericText())
                        }.font(.metal(MetalType.ui)).foregroundStyle(colorway.tokens.ink.color)
                            .animation(reduceMotion ? nil : MetalSprings.settle.animation, value: settled)
                    }
                    Spacer(minLength: .zero)
                    if showValue, value != nil {
                        Text("\(Int((ratio * 100).rounded()))%")
                            .font(.metal(MetalType.meta)).monospacedDigit().foregroundStyle(colorway.tokens.ink2.color)
                            .contentTransition(.numericText(value: ratio))
                            .animation(reduceMotion ? nil : (state == .idle || state == .cancelled ? MetalSprings.release.animation : MetalSprings.settle.animation), value: ratio)
                    }
                }
            }
            track
            if shape != .slim, let detail { Text(detail).font(.metal(MetalType.meta)).monospacedDigit().foregroundStyle(colorway.tokens.ink2.color) }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(displayLabel)
        .accessibilityValue((value == nil ? "Amount unknown" : "\(Int((ratio * 100).rounded())) percent") + " · \(spokenState)" + (detail.map { " · \($0)" } ?? ""))
        .onAppear { visible = true }.onDisappear { visible = false }
        .task(id: "\(ratio)-\(state.rawValue)") {
            guard state == .complete, ratio >= 1 else { settled = false; return }
            if !reduceMotion { try? await Task.sleep(for: .seconds(MetalSprings.settle.duration)) }
            guard !Task.isCancelled else { return }; settled = true
        }
    }
    @ViewBuilder private var track: some View {
        if shape == .ring {
            let diameter = MetalRecipes.iconButton.points(size == .compact ? "ghost.size" : "tool.size")
            let stroke = height / 2
            let inset = stroke / 2
            ZStack {
                Circle().stroke(colorway.tokens.wellBot.color, lineWidth: stroke)
                if value != nil {
                    Circle().trim(from: .zero, to: ratio).stroke(fillColor, style: StrokeStyle(lineWidth: stroke, lineCap: .round)).rotationEffect(.degrees(-90))
                        .opacity(state == .paused ? MetalRecipes.progress.scalar("segment.dim") : .one)
                } else {
                    unknown(ring: true)
                }
            }.padding(inset).frame(width: diameter, height: diameter)
        } else if shape == .segmented && value != nil {
            HStack(spacing: MetalSpace.s2) {
                ForEach(0..<steps, id: \.self) { step in
                    bar(amount: min(1, max(0, ratio * Double(steps) - Double(step))), buffered: nil)
                }
            }.frame(height: height)
        } else {
            bar(amount: ratio, buffered: shape == .buffered ? min(1, max(ratio, (buffer ?? value ?? 0) / total)) : nil).frame(height: height)
        }
    }
    private func bar(amount: Double, buffered: Double?) -> some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Color.clear.metalObjectRecipe(MetalRecipes.switch, part: "self", in: Capsule())
                if let buffered {
                    fill.scaleEffect(x: buffered, y: 1, anchor: .leading).opacity(MetalRecipes.progress.scalar("segment.dim"))
                }
                if value != nil {
                    fill.scaleEffect(x: amount, y: 1, anchor: .leading)
                        .animation(reduceMotion ? nil : (state == .idle || state == .cancelled ? MetalSprings.release.animation : MetalSprings.settle.animation), value: amount)
                } else { unknown(ring: false) }
            }.frame(width: geometry.size.width, height: height).clipShape(Capsule())
        }.frame(height: height)
    }
    // Replace only the on fill; preserve the switch's authored shadow stack, as CSS does.
    private var fillRecipe: MetalObjectRecipe {
        let recipe = MetalRecipes.switch
        guard state == .failed else { return recipe }
        let layers = recipe.layers.map { layer -> MetalRecipeLayer in
            guard layer.part == "self", layer.state == "on", case .fill = layer.value else { return layer }
            return MetalRecipeLayer(part: layer.part, state: layer.state, colorway: layer.colorway,
                                    fill: .solid(.color(colorway.tokens.invalid)))
        }
        return MetalObjectRecipe(name: recipe.name, layers: layers, props: recipe.props)
    }
    private var fill: some View {
        Color.clear.metalObjectRecipe(fillRecipe, part: "self", state: "on", in: Capsule())
            .opacity(state == .paused ? MetalRecipes.progress.scalar("segment.dim") : .one)
    }
    @ViewBuilder private func unknown(ring: Bool) -> some View {
        if state == .running && visible {
            TimelineView(.animation) { clock in unknownFrame(clock.date, ring: ring) }
        } else { unknownFrame(nil, ring: ring) }
    }
    private func unknownFrame(_ date: Date?, ring: Bool) -> some View {
        let r = MetalRecipes.progress
        let duration = (Double((r.text(reduceMotion ? "segment.breathe" : "segment.sweep") ?? "").replacingOccurrences(of: "ms", with: "")) ?? .zero) / 1000
        let phase = (date?.timeIntervalSinceReferenceDate ?? .zero).truncatingRemainder(dividingBy: duration) / duration
        let fraction = r.scalar("segment.ratio")
        let alpha = reduceMotion && date != nil ? r.scalar("segment.dim") + (1 - r.scalar("segment.dim")) * ((sin(phase * .pi * 2) + 1) / 2) : 1
        return GeometryReader { geometry in
            Group {
                if ring {
                    Circle().trim(from: .zero, to: fraction).stroke(fillColor, style: StrokeStyle(lineWidth: height / 2, lineCap: .round)).rotationEffect(.degrees(reduceMotion ? -90 : phase * 360 - 90))
                } else {
                    fill.frame(width: geometry.size.width * fraction).offset(x: reduceMotion || date == nil ? geometry.size.width * (1 - fraction) / 2 : geometry.size.width * ((1 + fraction) * phase - fraction))
                }
            }.opacity(alpha * (ring && state == .paused ? r.scalar("segment.dim") : .one))
        }
    }
}
