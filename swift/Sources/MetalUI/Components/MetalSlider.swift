#if canImport(AppKit)
import AppKit
#endif
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

/// The slider's sizes: the groove's thickness and the knob together, with the end glyphs and the gap
/// beside the groove (tokens.json `recipes.slider.props.compact | regular | large`).
public enum MetalSliderSize: String, CaseIterable, Sendable {
    case compact
    case regular
    case large
}

/// How tick labels are set: the meta type at ink2 (readable on any surface, the default), or engraved
/// for a host that engraves its own scale (the time scrubber's weekdays).
public enum MetalSliderTickStyle: Sendable {
    case meta
    case engraved
}

/// Sizes the fill, or places the knob, at a fraction of the knob's travel. The fraction is what
/// animates and it is clamped every frame, so a jump that overshoots on the part spring stops
/// flush against the groove's end instead of carrying the knob past it (the web clamps the same way).
private struct MetalSliderAlong: ViewModifier, Animatable {
    var fraction: Double
    let knob: CGFloat
    let travel: CGFloat
    let centre: CGFloat
    let track: CGFloat
    let fill: Bool

    var animatableData: Double {
        get { fraction }
        set { fraction = newValue }
    }

    func body(content: Content) -> some View {
        let x = knob / 2 + min(max(fraction, .zero), .one) * travel
        if fill {
            content
                .frame(width: max(track, x), height: track)
                .position(x: max(track, x) / 2, y: centre)
        } else {
            content.position(x: x, y: centre)
        }
    }
}

/// A value on a generated well track. Marks (notches cut across the groove) and labelled ticks are
/// fractions of its span; a drag follows the pointer while keys and track jumps use the part spring.
///
/// Geometry, the same as the web slider: the groove is the full width W; the knob (K across)
/// travels K/2 … W − K/2, so at either end it sits flush with the groove's rounded end and never
/// hangs outside it. The fill runs to the knob's centre; marks and ticks use the same travel.
///
/// States, as on the web: hover lifts the knob (settle spring, a longer shadow), pressing or dragging
/// presses it (a tight shadow), the knob grows away from the nearer end so it never pokes past the
/// groove, keyboard focus draws the ring, `.disabled(true)` dims it to 40 % and takes no input, and an
/// arrow pushing past an end nudges the groove one nest on the refusal spring (none under Reduce Motion).
public struct MetalSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let largeStep: Double
    let marks: [Double]
    let ticks: [MetalSliderTick]
    let tickStyle: MetalSliderTickStyle
    let size: MetalSliderSize
    let startIcon: MetalIconName?
    let endIcon: MetalIconName?
    let showsValue: Bool
    let label: String
    let valueText: (Double) -> String
    let onFocusChange: ((Bool) -> Void)?
    let onDragChange: ((Bool) -> Void)?
    let isExternallyDragging: Bool

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.isEnabled) private var isEnabled
    @FocusState private var focused: Bool
    /// Focus came from the keyboard (Tab, arrows): only then is the ring drawn, never after a press.
    @State private var keyboardFocus = false
    @State private var dragging = false
    @State private var hovering = false
    /// Each refusal counts up; its direction is which end was pushed (1 the maximum, −1 the minimum).
    @State private var refusals = 0
    @State private var refusalDirection: Double = .one

    public init(value: Binding<Double>, in range: ClosedRange<Double>,
                step: Double, largeStep: Double, marks: [Double] = [],
                ticks: [MetalSliderTick] = [], tickStyle: MetalSliderTickStyle = .meta,
                size: MetalSliderSize = .regular,
                startIcon: MetalIconName? = nil, endIcon: MetalIconName? = nil,
                showsValue: Bool = false,
                label: String,
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
        self.tickStyle = tickStyle
        self.size = size
        self.startIcon = startIcon
        self.endIcon = endIcon
        self.showsValue = showsValue
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

    /// A key that pushes past an end: the value stays, and the groove says no with a nudge that way.
    private func push(_ delta: Double) {
        let atEnd = delta > .zero ? value >= range.upperBound : value <= range.lowerBound
        if atEnd {
            guard MetalMotion.resolve(.refusal, reduceMotion: reduceMotion).allowsTravel else { return }
            refusalDirection = delta > .zero ? .one : -.one
            refusals += 1
        } else {
            set(value + delta)
        }
    }

    /// A number of the slider's size (`track`, `knob`, `glyph`, `gap`).
    private func metric(_ key: String) -> CGFloat { MetalRecipes.slider.points("\(size.rawValue).\(key)") }

    public var body: some View {
        HStack(spacing: metric("gap")) {
            if let startIcon { glyph(startIcon, atEnd: fraction == .zero) }
            control
            if let endIcon { glyph(endIcon, atEnd: fraction == .one) }
            if showsValue { readout }
        }
        // Disabled: the whole slider, glyphs and value too, at the recipe's 40 %.
        .opacity(isEnabled ? .one : MetalRecipes.slider.scalar("self.disabled"))
        // Focus by keyboard navigation only, like NSSlider: a click or a host
        // taking the keyboard never parks typing here.
        .focusable(interactions: .activate)
        // No system ring: MetalUI's own ring, and only for keyboard focus.
        .focusEffectDisabled()
        .focused($focused)
        .onChange(of: focused) { _, isFocused in
            #if os(macOS)
            keyboardFocus = isFocused && NSApp.currentEvent?.type == .keyDown
            #else
            keyboardFocus = isFocused
            #endif
            onFocusChange?(isFocused)
        }
        .onKeyPress(.leftArrow, phases: .down) { press in
            keyboardFocus = true
            push(-(press.modifiers.contains(.shift) ? largeStep : step))
            return .handled
        }
        .onKeyPress(.rightArrow, phases: .down) { press in
            keyboardFocus = true
            push(press.modifiers.contains(.shift) ? largeStep : step)
            return .handled
        }
        .onKeyPress(.home) { value <= range.lowerBound ? push(-step) : set(range.lowerBound); return .handled }
        .onKeyPress(.end) { value >= range.upperBound ? push(step) : set(range.upperBound); return .handled }
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

    /// An end's glyph at ink2. It plays its act as the value arrives at its end.
    private func glyph(_ icon: MetalIconName, atEnd: Bool) -> some View {
        MetalIcon(icon, size: metric("glyph"), interaction: MetalIconInteraction(isPressed: atEnd))
            .foregroundStyle(colorway.tokens.ink2.color)
    }

    /// The value beside the groove, in the figure type. It keeps the width of the widest end so the
    /// groove never moves, and its digits roll as it changes (the web's drum).
    private var readout: some View {
        ZStack(alignment: .trailing) {
            Text(valueText(range.lowerBound)).hidden()
            Text(valueText(range.upperBound)).hidden()
            Text(valueText(value))
                .contentTransition(reduceMotion ? .opacity : .numericText(value: value))
                .foregroundStyle(colorway.tokens.ink.color)
        }
        .font(.metal(MetalType.figure))
        .monospacedDigit()
        .accessibilityHidden(true)
    }

    private var control: some View {
        let recipe = MetalRecipes.slider
        let finish = MetalRecipeColorway(colorway)
        return GeometryReader { geometry in
            let width = geometry.size.width
            let centre = geometry.size.height / 2
            let track = metric("track")
            let knob = metric("knob")
            // One travel for the knob, the fill's end, the marks and the ticks.
            let travel = max(.zero, width - knob)
            let along = { (f: Double) in knob / 2 + clamp(f) * travel }
            let x = along(fraction)
            let place = { (fill: Bool) in
                MetalSliderAlong(fraction: fraction, knob: knob, travel: travel, centre: centre, track: track, fill: fill)
            }
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
                    .modifier(place(true))
                // Marks are notches cut across the groove: the groove's full height.
                Canvas { context, _ in
                    let markWidth = recipe.points("mark.w")
                    let markHeight = track
                    let radius = recipe.points("mark.radius")
                    let color = (recipe.color("mark.color", colorway: finish) ?? colorway.tokens.scrubberMark).color
                    for mark in marks {
                        let x = along(mark)
                        let rect = CGRect(x: x - markWidth / 2, y: centre - markHeight / 2,
                                          width: markWidth, height: markHeight)
                        context.fill(Path(roundedRect: rect, cornerRadius: radius), with: .color(color))
                    }
                }
                .frame(width: width, height: geometry.size.height)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
                // Each tick hangs a gap under the groove: a short line, then its label, centred on the travel.
                let gap = recipe.points("tick.gap")
                ForEach(ticks) { tick in
                    VStack(spacing: gap) {
                        Rectangle()
                            .fill((recipe.color("tick.color", colorway: finish) ?? colorway.tokens.scrubberDayTick).color)
                            .frame(width: recipe.points("tick.w"), height: recipe.points("tick.h"))
                        switch tickStyle {
                        case .meta:
                            Text(tick.label).font(.metal(MetalType.meta)).foregroundColor(colorway.tokens.ink2.color)
                        case .engraved:
                            MetalLabel(tick.label, style: .engraved)
                        }
                    }
                    .fixedSize()
                    // hung from a point, so a wide label at an end never widens the control
                    .frame(width: .zero, height: .zero, alignment: .top)
                    .position(x: along(tick.at), y: centre + track / 2 + gap)
                    .accessibilityHidden(true)
                }
                // Clear, so only the recipe paints: a bare Circle would fill black over it. The face
                // lifts on hover and presses while held, growing away from the nearer end.
                let knobState: String? = dragging ? "press" : hovering ? "hover" : nil
                Color.clear
                    .metalObjectRecipe(recipe, part: "knob", state: knobState, in: Circle())
                    .frame(width: knob, height: knob)
                    .scaleEffect(dragging ? recipe.scalar("knob.press") : hovering ? recipe.scalar("knob.lift") : .one,
                                 anchor: UnitPoint(x: fraction, y: UnitPoint.center.y))
                    .metalAnimation(.settle, value: knobState)
                    // A host that passes presses through must know where the knob is drawn.
                    .metalHitRegion()
                    .modifier(place(false))
                    .accessibilityHidden(true)
            }
            .frame(width: width, height: geometry.size.height)
            // The whole control is the drag surface; the knob never leaves it.
            .contentShape(Rectangle())
            // The web slider's cursors: a pointing hand over the track, an open hand on the
            // knob, a closed hand while dragging.
            .onContinuousHover { phase in
                guard !dragging else { return }
                switch phase {
                case let .active(point):
                    hovering = true
                    #if canImport(AppKit)
                    let overKnob = abs(point.x - x) <= knob / 2 && abs(point.y - centre) <= knob / 2
                    (overKnob ? NSCursor.openHand : NSCursor.pointingHand).set()
                    #endif
                case .ended:
                    hovering = false
                    #if canImport(AppKit)
                    NSCursor.arrow.set()
                    #endif
                }
            }
            .gesture(DragGesture(minimumDistance: .zero)
                .onChanged { gesture in
                    if !dragging {
                        #if canImport(AppKit)
                        NSCursor.closedHand.set()
                        #endif
                        onDragChange?(true)
                    }
                    dragging = true
                    keyboardFocus = false
                    focused = true
                    // The pointer maps onto the knob's travel, so the knob's centre stays under it.
                    set(range.lowerBound + clamp((gesture.location.x - knob / 2) / max(.leastNonzeroMagnitude, travel)) * span)
                }
                .onEnded { _ in
                    dragging = false
                    onDragChange?(false)
                    #if canImport(AppKit)
                    NSCursor.openHand.set()
                    #endif
                })
            .animation(dragging || isExternallyDragging ? nil : MetalMotion.resolve(.part, reduceMotion: reduceMotion).animation,
                       value: value)
        }
        // A refusal: one nest toward the pushed end, ringing back on the refusal spring.
        .keyframeAnimator(initialValue: Double.zero, trigger: refusals) { content, nudge in
            content.offset(x: nudge * refusalDirection)
        } keyframes: { _ in
            KeyframeTrack {
                LinearKeyframe(MetalRadius.nest, duration: .zero)
                SpringKeyframe(.zero, duration: MetalSprings.refusal.duration,
                               spring: Spring(mass: .one, stiffness: MetalSprings.refusal.stiffness, damping: MetalSprings.refusal.damping))
            }
        }
        .overlay {
            if focused && keyboardFocus {
                RoundedRectangle(cornerRadius: metric("track"), style: .continuous)
                    .inset(by: -(MetalRing.focusOffset + MetalRing.focusWidth / 2))
                    .stroke(MetalShared.focus.color, lineWidth: MetalRing.focusWidth)
                    .allowsHitTesting(false)
            }
        }
    }
}
