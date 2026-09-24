import SwiftUI

public struct MetalSliderTick: Identifiable, Sendable {
    public let at: Double
    public let label: String
    public var id: Double { at }

    public init(at: Double, label: String) {
        self.at = at
        self.label = label
    }
}

/// A value on a generated well track. Marks and labels are fractions of its
/// span; a drag follows the pointer while keys and track jumps use the part spring.
public struct MetalSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let largeStep: Double
    let marks: [Double]
    let ticks: [MetalSliderTick]
    let label: String
    let valueText: (Double) -> String

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @FocusState private var focused: Bool
    @State private var dragging = false

    public init(value: Binding<Double>, in range: ClosedRange<Double>,
                step: Double, largeStep: Double, marks: [Double] = [],
                ticks: [MetalSliderTick] = [], label: String,
                valueText: @escaping (Double) -> String) {
        _value = value
        self.range = range
        self.step = step
        self.largeStep = largeStep
        self.marks = marks
        self.ticks = ticks
        self.label = label
        self.valueText = valueText
    }

    private var span: Double { max(.leastNonzeroMagnitude, range.upperBound - range.lowerBound) }
    private func clamp(_ fraction: Double) -> Double { min(max(fraction, .zero), .one) }
    private var fraction: Double { clamp((value - range.lowerBound) / span) }

    private func set(_ next: Double) { value = min(max(next, range.lowerBound), range.upperBound) }

    public var body: some View {
        let recipe = MetalRecipes.slider
        let finish = MetalRecipeColorway(colorway)
        GeometryReader { geometry in
            let width = geometry.size.width
            let centre = geometry.size.height / 2
            let track = recipe.points("track.height")
            let inset = recipe.points("track.inset")
            let knob = recipe.points("knob.size")
            let x = width * fraction
            ZStack(alignment: .topLeading) {
                Color.clear
                    .metalObjectRecipe(MetalRecipes.well, part: "self", state: "track", in: Capsule())
                    .frame(width: width, height: track)
                    .position(x: width / 2, y: centre)
                Color.clear
                    .metalObjectRecipe(recipe, part: "fill", in: Capsule())
                    .opacity(recipe.scalar("fill.opacity"))
                    .frame(width: max(track, x), height: track)
                    .position(x: max(track, x) / 2, y: centre)
                ForEach(Array(marks.enumerated()), id: \.offset) { _, mark in
                    RoundedRectangle(cornerRadius: recipe.points("mark.radius"), style: .continuous)
                        .fill((recipe.color("mark.color", colorway: finish) ?? colorway.tokens.scrubberMark).color)
                        .frame(width: recipe.points("mark.w"), height: recipe.points("mark.h"))
                        .position(x: inset + clamp(mark) * (width - inset - inset), y: centre)
                        .accessibilityHidden(true)
                }
                ForEach(ticks) { tick in
                    VStack(spacing: .zero) {
                        Rectangle()
                            .fill((recipe.color("tick.color", colorway: finish) ?? colorway.tokens.scrubberDayTick).color)
                            .frame(width: recipe.points("tick.w"), height: recipe.points("tick.h"))
                        MetalLabel(tick.label, style: .engraved)
                    }
                    .fixedSize()
                    .position(x: inset + clamp(tick.at) * (width - inset - inset),
                              y: centre + recipe.points("tick.top") + recipe.points("tick.h"))
                    .accessibilityHidden(true)
                }
                Circle()
                    .metalObjectRecipe(recipe, part: "knob", in: Circle())
                    .frame(width: knob, height: knob)
                    .position(x: x, y: centre)
                    .accessibilityHidden(true)
            }
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: .zero)
                .onChanged { gesture in
                    dragging = true
                    focused = true
                    set(range.lowerBound + clamp(gesture.location.x / max(.leastNonzeroMagnitude, width)) * span)
                }
                .onEnded { _ in dragging = false })
            .animation(dragging ? nil : MetalMotion.resolve(.part, reduceMotion: reduceMotion).animation,
                       value: value)
        }
        .focusable()
        .focused($focused)
        .onKeyPress(.leftArrow, phases: .down) { press in
            set(value - (press.modifiers.contains(.shift) ? largeStep : step))
            return .handled
        }
        .onKeyPress(.rightArrow, phases: .down) { press in
            set(value + (press.modifiers.contains(.shift) ? largeStep : step))
            return .handled
        }
        .onKeyPress(.home) { set(range.lowerBound); return .handled }
        .onKeyPress(.end) { set(range.upperBound); return .handled }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue(valueText(value))
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: set(value + step)
            case .decrement: set(value - step)
            @unknown default: break
            }
        }
    }
}
