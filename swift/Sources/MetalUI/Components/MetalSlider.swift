import AppKit
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
    let onFocusChange: ((Bool) -> Void)?
    let onDragChange: ((Bool) -> Void)?
    let isExternallyDragging: Bool

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @FocusState private var focused: Bool
    @State private var dragging = false

    public init(value: Binding<Double>, in range: ClosedRange<Double>,
                step: Double, largeStep: Double, marks: [Double] = [],
                ticks: [MetalSliderTick] = [], label: String,
                valueText: @escaping (Double) -> String,
                onFocusChange: ((Bool) -> Void)? = nil,
                onDragChange: ((Bool) -> Void)? = nil,
                isExternallyDragging: Bool = false) {
        _value = value
        self.range = range
        self.step = step
        self.largeStep = largeStep
        self.marks = marks
        self.ticks = ticks
        self.label = label
        self.valueText = valueText
        self.onFocusChange = onFocusChange
        self.onDragChange = onDragChange
        self.isExternallyDragging = isExternallyDragging
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
                // The visible well is thin; the entire control remains a drag
                // surface, including space above/below the track and knob.
                Color.clear.frame(width: width, height: geometry.size.height)
                Color.clear
                    .metalObjectRecipe(MetalRecipes.well, part: "self", state: "track", in: Capsule())
                    .frame(width: width, height: track)
                    .position(x: width / 2, y: centre)
                Color.clear
                    .metalObjectRecipe(recipe, part: "fill", in: Capsule())
                    .opacity(recipe.scalar("fill.opacity"))
                    .frame(width: max(track, x), height: track)
                    .position(x: max(track, x) / 2, y: centre)
                Canvas { context, _ in
                    let markWidth = recipe.points("mark.w")
                    let markHeight = recipe.points("mark.h")
                    let radius = recipe.points("mark.radius")
                    let color = (recipe.color("mark.color", colorway: finish) ?? colorway.tokens.scrubberMark).color
                    for mark in marks {
                        let x = inset + clamp(mark) * (width - inset - inset)
                        let rect = CGRect(x: x - markWidth / 2, y: centre - markHeight / 2,
                                          width: markWidth, height: markHeight)
                        context.fill(Path(roundedRect: rect, cornerRadius: radius), with: .color(color))
                    }
                }
                .frame(width: width, height: geometry.size.height)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
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
            .frame(width: width, height: geometry.size.height)
            .contentShape(Rectangle())
            // The web slider's cursors: a pointing hand over the track, an open hand on the
            // knob, a closed hand while dragging.
            .onContinuousHover { phase in
                guard !dragging else { return }
                switch phase {
                case let .active(point):
                    let overKnob = abs(point.x - x) <= knob / 2 && abs(point.y - centre) <= knob / 2
                    (overKnob ? NSCursor.openHand : NSCursor.pointingHand).set()
                case .ended:
                    NSCursor.arrow.set()
                }
            }
            .gesture(DragGesture(minimumDistance: .zero)
                .onChanged { gesture in
                    if !dragging {
                        NSCursor.closedHand.set()
                        onDragChange?(true)
                    }
                    dragging = true
                    focused = true
                    set(range.lowerBound + clamp(gesture.location.x / max(.leastNonzeroMagnitude, width)) * span)
                }
                .onEnded { _ in
                    dragging = false
                    onDragChange?(false)
                    NSCursor.openHand.set()
                })
            .animation(dragging || isExternallyDragging ? nil : MetalMotion.resolve(.part, reduceMotion: reduceMotion).animation,
                       value: value)
        }
        .focusable()
        .focused($focused)
        .onChange(of: focused) { _, isFocused in onFocusChange?(isFocused) }
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
