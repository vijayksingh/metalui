#if os(macOS)
import AppKit
#endif
import SwiftUI

public struct MetalSliderTick: Identifiable, Sendable {
    public let at: Double
    public let label: String
    public var id: Double { at }
    public init(at: Double, label: String) { self.at = at; self.label = label }
}
public enum MetalSliderSize: String, CaseIterable, Sendable { case compact, regular, large }
public enum MetalSliderTickStyle: Sendable { case meta, engraved }
public enum MetalSliderOrientation: Sendable { case horizontal, vertical }
public enum MetalSliderTone: Sendable { case green, neutral }

/// Interpolate fractions, then clamp each frame before translating the layer. Geometry never
/// changes during a spring: the knob and full track-sized fill move only by offset and scale.
private struct MetalSliderPlacement: ViewModifier, Animatable {
    var lower: Double
    var upper: Double
    let extent: CGFloat
    let knob: CGFloat
    let vertical: Bool
    let reversed: Bool
    let fill: Bool
    let centered: Bool
    let range: Bool
    let origin: CGFloat
    var animatableData: AnimatablePair<Double, Double> {
        get { AnimatablePair(lower, upper) }
        set { lower = newValue.first; upper = newValue.second }
    }
    func body(content: Content) -> some View {
        let travel = max(.zero, extent - knob)
        let point = { (fraction: Double) in
            let at = knob / 2 + min(1, max(0, fraction)) * travel
            return reversed ? extent - at : at
        }
        if fill {
            let start = range ? point(lower) : centered ? extent / 2 : reversed ? extent : .zero
            let end = point(upper)
            let offset = min(start, end)
            let scale = abs(end - start) / max(.leastNonzeroMagnitude, extent)
            content.scaleEffect(x: vertical ? 1 : scale, y: vertical ? scale : 1, anchor: .topLeading)
                .offset(x: vertical ? .zero : offset, y: vertical ? offset : .zero)
        } else {
            let offset = point(upper) - knob / 2 - origin
            content.offset(x: vertical ? .zero : offset, y: vertical ? offset : .zero)
        }
    }
}

/// Scalar and interval amounts on one clamped travel. Each native range knob has its own
/// keyboard focus and spoken amount. Hosts frame a vertical control to set its height.
public struct MetalSlider: View {
    @Binding private var values: [Double]
    private let range: ClosedRange<Double>
    private let step: Double, largeStep: Double
    private let marks: [Double], ticks: [MetalSliderTick]
    private let tickStyle: MetalSliderTickStyle, size: MetalSliderSize
    private let startIcon: MetalIconName?, endIcon: MetalIconName?, knobIcon: MetalIconName?
    private let showsValue: Bool, valueBubble: Bool, centered: Bool, detents: Bool
    private let orientation: MetalSliderOrientation, tone: MetalSliderTone
    private let minStepsBetweenValues: Int, disabledThumbs: Set<Int>
    private let label: String, thumbLabels: [String]
    private let valueText: (Double) -> String
    private let onFocusChange: ((Bool) -> Void)?, onDragChange: ((Bool) -> Void)?
    private let isExternallyDragging: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.isEnabled) private var isEnabled
    @MetalMotionPreference private var reduceMotion
    @FocusState private var focused: Int?
    @State private var keyboardFocus = false
    @State private var dragging: Int?
    @State private var hovering = false
    @State private var refusals = 0
    @State private var refusalDirection: Double = .one
    @State private var pointerSide = 0
    @State private var startActs = 0
    @State private var endActs = 0

    public init(value: Binding<Double>, in range: ClosedRange<Double>, step: Double, largeStep: Double,
                marks: [Double] = [], ticks: [MetalSliderTick] = [], tickStyle: MetalSliderTickStyle = .meta,
                size: MetalSliderSize = .regular, startIcon: MetalIconName? = nil, endIcon: MetalIconName? = nil,
                knobIcon: MetalIconName? = nil, showsValue: Bool = false, valueBubble: Bool = false,
                orientation: MetalSliderOrientation = .horizontal, tone: MetalSliderTone = .green,
                centered: Bool = false, detents: Bool = false, label: String,
                valueText: @escaping (Double) -> String, onFocusChange: ((Bool) -> Void)? = nil,
                onDragChange: ((Bool) -> Void)? = nil, isExternallyDragging: Bool = false) {
        self.init(values: Binding(get: { [value.wrappedValue] }, set: { if let next = $0.first { value.wrappedValue = next } }),
                  in: range, step: step, largeStep: largeStep, marks: marks, ticks: ticks, tickStyle: tickStyle,
                  size: size, startIcon: startIcon, endIcon: endIcon, knobIcon: knobIcon, showsValue: showsValue,
                  valueBubble: valueBubble, orientation: orientation, tone: tone, centered: centered,
                  detents: detents, label: label, valueText: valueText, onFocusChange: onFocusChange,
                  onDragChange: onDragChange, isExternallyDragging: isExternallyDragging)
    }
    public init(values: Binding<[Double]>, in range: ClosedRange<Double>, step: Double, largeStep: Double,
                minStepsBetweenValues: Int = 0, disabledThumbs: Set<Int> = [], thumbLabels: [String] = [],
                marks: [Double] = [], ticks: [MetalSliderTick] = [], tickStyle: MetalSliderTickStyle = .meta,
                size: MetalSliderSize = .regular, startIcon: MetalIconName? = nil, endIcon: MetalIconName? = nil,
                knobIcon: MetalIconName? = nil, showsValue: Bool = false, valueBubble: Bool = false,
                orientation: MetalSliderOrientation = .horizontal, tone: MetalSliderTone = .green,
                centered: Bool = false, detents: Bool = false, label: String,
                valueText: @escaping (Double) -> String, onFocusChange: ((Bool) -> Void)? = nil,
                onDragChange: ((Bool) -> Void)? = nil, isExternallyDragging: Bool = false) {
        _values = values; self.range = range; self.step = step; self.largeStep = largeStep
        self.minStepsBetweenValues = minStepsBetweenValues; self.disabledThumbs = disabledThumbs; self.thumbLabels = thumbLabels
        self.marks = marks; self.ticks = ticks; self.tickStyle = tickStyle; self.size = size
        self.startIcon = startIcon; self.endIcon = endIcon; self.knobIcon = knobIcon
        self.showsValue = showsValue; self.valueBubble = valueBubble; self.orientation = orientation; self.tone = tone
        self.centered = centered; self.detents = detents; self.label = label; self.valueText = valueText
        self.onFocusChange = onFocusChange; self.onDragChange = onDragChange; self.isExternallyDragging = isExternallyDragging
    }
    private var vertical: Bool { orientation == .vertical }
    private var reversed: Bool { vertical || layoutDirection == .rightToLeft }
    private var span: Double { max(.leastNonzeroMagnitude, range.upperBound - range.lowerBound) }
    private func fraction(_ value: Double) -> Double { min(1, max(0, (value - range.lowerBound) / span)) }
    private func metric(_ key: String) -> CGFloat { MetalRecipes.slider.points("\(size.rawValue).\(key)") }
    private func bounds(_ index: Int) -> ClosedRange<Double> {
        let gap = Double(max(0, minStepsBetweenValues)) * step
        let low = index > 0 ? values[index - 1] + gap : range.lowerBound
        let high = index + 1 < values.count ? values[index + 1] - gap : range.upperBound
        return min(low, high)...high
    }
    private func set(_ raw: Double, index: Int) {
        guard isEnabled, values.indices.contains(index), !disabledThumbs.contains(index) else { return }
        let allowed = bounds(index)
        let snapped = step > .zero ? range.lowerBound + ((raw - range.lowerBound) / step).rounded() * step : raw
        let next = min(allowed.upperBound, max(allowed.lowerBound, snapped))
        guard values[index] != next else { return }
        values[index] = next
        if detents { MetalHaptic.detent.perform() }
    }
    private func refuse(_ physicalDirection: Double) {
        guard isEnabled else { return }
        MetalHaptic.refusal.perform()
        guard MetalMotion.resolve(.refusal, reduceMotion: reduceMotion).allowsTravel else { return }
        refusalDirection = physicalDirection; refusals += 1
    }
    private func push(_ delta: Double, index: Int) {
        guard isEnabled, !disabledThumbs.contains(index) else { return }
        let allowed = bounds(index)
        if delta > .zero ? values[index] >= allowed.upperBound : values[index] <= allowed.lowerBound {
            refuse((delta > .zero ? .one : -.one) * (reversed ? -.one : .one))
        } else { set(values[index] + delta, index: index) }
    }
    private func name(_ index: Int) -> String {
        if thumbLabels.indices.contains(index) { return thumbLabels[index] }
        return values.count > 1 ? "\(label), \(index == 0 ? "lower" : "upper")" : label
    }
    public var body: some View {
        let layout = vertical ? AnyLayout(VStackLayout(spacing: metric("gap"))) : AnyLayout(HStackLayout(spacing: metric("gap")))
        layout {
            if let icon = vertical ? endIcon : startIcon { glyph(icon, act: vertical ? endActs : startActs) }
            control
            if let icon = vertical ? startIcon : endIcon { glyph(icon, act: vertical ? startActs : endActs) }
            if showsValue { readout }
        }
        .opacity(isEnabled ? .one : MetalRecipes.slider.scalar("self.disabled"))
        .focusSection()
        .onChange(of: focused) { _, next in onFocusChange?(next != nil) }
        .onChange(of: values) { before, after in
            guard isEnabled else { return }
            if after.first == range.lowerBound && before.first != range.lowerBound { startActs += 1 }
            if after.last == range.upperBound && before.last != range.upperBound { endActs += 1 }
        }
        .accessibilityElement(children: .contain)
    }
    private func glyph(_ icon: MetalIconName, act: Int) -> some View {
        MetalIcon(icon, size: metric("glyph"), act: act).foregroundStyle(colorway.tokens.ink2.color).accessibilityHidden(true)
    }
    private var readout: some View {
        ZStack(alignment: .trailing) {
            Text(Array(repeating: valueText(range.lowerBound), count: values.count).joined(separator: " – ")).hidden()
            Text(Array(repeating: valueText(range.upperBound), count: values.count).joined(separator: " – ")).hidden()
            Text(Array(repeating: valueText((range.lowerBound + range.upperBound) / 2), count: values.count).joined(separator: " – ")).hidden()
            Text(values.map(valueText).joined(separator: " – "))
                .contentTransition(reduceMotion ? .opacity : .numericText())
                .animation(reduceMotion ? nil : MetalSprings.settle.animation, value: values)
                .foregroundStyle(colorway.tokens.ink.color)
        }.font(.metal(MetalType.figure)).monospacedDigit().accessibilityHidden(true)
    }
    private var fillRecipe: MetalObjectRecipe {
        let recipe = MetalRecipes.slider
        guard tone == .neutral else { return recipe }
        let layers = recipe.layers.map { layer -> MetalRecipeLayer in
            guard layer.part == "fill", case .fill = layer.value else { return layer }
            return MetalRecipeLayer(part: layer.part, state: layer.state, colorway: layer.colorway, fill: .solid(.color(colorway.tokens.ink2)))
        }
        return MetalObjectRecipe(name: recipe.name, layers: layers, props: recipe.props)
    }
    private var control: some View {
        let recipe = MetalRecipes.slider
        let finish = MetalRecipeColorway(colorway)
        let isVertical = vertical
        let nudgeDirection = refusalDirection
        return GeometryReader { geometry in
            let extent = vertical ? geometry.size.height : geometry.size.width
            let knob = metric("knob"), track = metric("track")
            let cross = vertical ? geometry.size.width : geometry.size.height
            let travel = max(.zero, extent - knob)
            let along = { (f: Double) in knob / 2 + min(1, max(0, reversed ? 1 - f : f)) * travel }
            let lower = fraction(values.first ?? range.lowerBound), upper = fraction(values.last ?? range.lowerBound)
            let placement = { (fill: Bool, at: Double, origin: CGFloat) in MetalSliderPlacement(lower: lower, upper: at, extent: extent, knob: knob, vertical: vertical, reversed: reversed, fill: fill, centered: centered, range: values.count > 1, origin: origin) }
            ZStack(alignment: .topLeading) {
                Color.clear.frame(width: geometry.size.width, height: geometry.size.height)
                Color.clear.metalObjectRecipe(MetalRecipes.well, part: "self", state: "track", in: Capsule())
                    .frame(width: vertical ? track : extent, height: vertical ? extent : track)
                    .offset(x: vertical ? (cross - track) / 2 : .zero, y: vertical ? .zero : (cross - track) / 2)
                Color.clear.metalObjectRecipe(fillRecipe, part: "fill", in: Capsule())
                    .frame(width: vertical ? track : extent, height: vertical ? extent : track)
                    .modifier(placement(true, upper, .zero))
                    .offset(x: vertical ? (cross - track) / 2 : .zero, y: vertical ? .zero : (cross - track) / 2)
                Canvas { context, _ in
                    let thickness = recipe.points("mark.w")
                    let radius = recipe.points("mark.radius")
                    let paint = (recipe.color("mark.color", colorway: finish) ?? colorway.tokens.scrubberMark).color
                    for mark in marks {
                        let at = along(mark)
                        let rect = CGRect(x: vertical ? (cross - track) / 2 : at - thickness / 2,
                                          y: vertical ? at - thickness / 2 : (cross - track) / 2,
                                          width: vertical ? track : thickness, height: vertical ? thickness : track)
                        context.fill(Path(roundedRect: rect, cornerRadius: radius), with: .color(paint))
                    }
                }.allowsHitTesting(false).accessibilityHidden(true)
                ForEach(ticks) { tick in
                    let gap = recipe.points("tick.gap")
                    let crossPosition = (cross + track) / 2 + gap
                    let layout = vertical ? AnyLayout(HStackLayout(spacing: gap)) : AnyLayout(VStackLayout(spacing: gap))
                    layout {
                        Rectangle().fill((recipe.color("tick.color", colorway: finish) ?? colorway.tokens.scrubberDayTick).color)
                            .frame(width: recipe.points(vertical ? "tick.h" : "tick.w"), height: recipe.points(vertical ? "tick.w" : "tick.h"))
                        if tickStyle == .meta { Text(tick.label).font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink2.color) }
                        else { MetalLabel(tick.label, style: .engraved) }
                    }.fixedSize().frame(width: .zero, height: .zero, alignment: vertical ? .leading : .top)
                        .position(x: vertical ? crossPosition : along(tick.at), y: vertical ? along(tick.at) : crossPosition)
                        .accessibilityHidden(true)
                }
                // A layout group gives each knob a stable, ordered keyboard target. Their
                // physical travel still uses transforms, independently of these static slots.
                let knobLayout = vertical ? AnyLayout(VStackLayout(spacing: .zero)) : AnyLayout(HStackLayout(spacing: .zero))
                knobLayout {
                    ForEach(values.indices, id: \.self) { index in
                        let at = fraction(values[index])
                        let stopped = disabledThumbs.contains(index)
                        let state: String? = stopped ? nil : dragging == index ? "press" : hovering ? "hover" : nil
                        ZStack {
                            Color.clear.metalObjectRecipe(recipe, part: "knob", state: state, in: Circle())
                                .scaleEffect(stopped ? .one : dragging == index ? recipe.scalar("knob.press") : hovering ? recipe.scalar("knob.lift") : .one,
                                             anchor: vertical ? UnitPoint(x: UnitPoint.center.x, y: 1 - at) : UnitPoint(x: reversed ? 1 - at : at, y: UnitPoint.center.y))
                                .metalAnimation(.settle, value: state)
                            if let knobIcon { MetalIcon(knobIcon, size: metric("glyph")).foregroundStyle(MetalColorway.bone.tokens.ink.color).accessibilityHidden(true) }
                            if focused == index && keyboardFocus {
                                Circle().inset(by: -(MetalRing.focusOffset + MetalRing.focusWidth / 2)).stroke(MetalShared.focus.color, lineWidth: MetalRing.focusWidth)
                            }
                        }.frame(width: knob, height: knob)
                            .opacity(stopped && isEnabled ? recipe.scalar("self.disabled") : .one)
                            .overlay(alignment: vertical ? .trailing : .top) {
                                if valueBubble && (dragging == index || focused == index && keyboardFocus) {
                                    Text(valueText(values[index])).font(.metal(MetalType.meta)).monospacedDigit()
                                        .contentTransition(reduceMotion ? .opacity : .numericText())
                                        .animation(reduceMotion ? nil : MetalSprings.settle.animation, value: values[index])
                                        .foregroundStyle(colorway.tokens.ink.color)
                                        .padding(.horizontal, MetalRecipes.tooltip.points("self.pad-x"))
                                        .padding(.vertical, MetalRecipes.tooltip.points("self.pad-y"))
                                        .metalObjectRecipe(MetalRecipes.tooltip, part: "self", in: RoundedRectangle(cornerRadius: MetalRecipes.tooltip.points("self.radius")))
                                        .fixedSize().offset(x: vertical ? knob + metric("gap") : .zero, y: vertical ? .zero : -(knob + metric("gap")))
                                        .accessibilityHidden(true)
                                }
                            }
                            .metalHitRegion()
                            .focusable(interactions: .edit).focusEffectDisabled().focused($focused, equals: index)
                            .disabled(disabledThumbs.contains(index))
                            .onChange(of: focused) { _, next in
                                #if os(macOS)
                                if next == index { keyboardFocus = NSApp.currentEvent?.type == .keyDown }
                                #else
                                if next == index && dragging == nil { keyboardFocus = true }
                                #endif
                            }
                            .onKeyPress(.leftArrow, phases: .down) { press in keyboardFocus = true; push((layoutDirection == .rightToLeft ? .one : -.one) * (press.modifiers.contains(.shift) ? largeStep : step), index: index); return .handled }
                            .onKeyPress(.rightArrow, phases: .down) { press in keyboardFocus = true; push((layoutDirection == .rightToLeft ? -.one : .one) * (press.modifiers.contains(.shift) ? largeStep : step), index: index); return .handled }
                            .onKeyPress(.upArrow, phases: .down) { press in keyboardFocus = true; push(press.modifiers.contains(.shift) ? largeStep : step, index: index); return .handled }
                            .onKeyPress(.downArrow, phases: .down) { press in keyboardFocus = true; push(-(press.modifiers.contains(.shift) ? largeStep : step), index: index); return .handled }
                            .onKeyPress(.home) { keyboardFocus = true; values[index] <= bounds(index).lowerBound ? push(-step, index: index) : set(bounds(index).lowerBound, index: index); return .handled }
                            .onKeyPress(.end) { keyboardFocus = true; values[index] >= bounds(index).upperBound ? push(step, index: index) : set(bounds(index).upperBound, index: index); return .handled }
                            .onKeyPress(.pageUp) { keyboardFocus = true; push(largeStep, index: index); return .handled }
                            .onKeyPress(.pageDown) { keyboardFocus = true; push(-largeStep, index: index); return .handled }
                            .accessibilityElement(children: .ignore).accessibilityLabel(name(index)).accessibilityValue(valueText(values[index]))
                            .accessibilityAdjustableAction { direction in set(values[index] + (direction == .increment ? step : -step), index: index) }
                            // Move the complete focus/hit target, rather than just its drawn face.
                            .offset(x: vertical ? (cross - knob) / 2 : .zero, y: vertical ? .zero : (cross - knob) / 2)
                            .modifier(placement(false, at, CGFloat(!vertical && layoutDirection == .rightToLeft ? values.count - 1 - index : index) * knob))
                    }
                }.fixedSize()
            }
            .contentShape(Rectangle())
            .onContinuousHover { phase in
                switch phase {
                case .active: hovering = true
                    #if os(macOS)
                    if dragging == nil { NSCursor.openHand.set() }
                    #endif
                case .ended: hovering = false
                    #if os(macOS)
                    if dragging == nil { NSCursor.arrow.set() }
                    #endif
                }
            }
            .gesture(DragGesture(minimumDistance: .zero).onChanged { gesture in
                guard isEnabled else { return }
                let position = vertical ? gesture.location.y : gesture.location.x
                if dragging == nil {
                    dragging = values.indices.filter { !disabledThumbs.contains($0) }.min { abs(along(fraction(values[$0])) - position) < abs(along(fraction(values[$1])) - position) }
                    if let dragging { focused = dragging; keyboardFocus = false; onDragChange?(true) }
                    #if os(macOS)
                    NSCursor.closedHand.set()
                    #endif
                }
                guard let index = dragging else { return }
                let side = position < .zero ? -1 : position > extent ? 1 : 0
                if side != 0 && side != pointerSide { refuse(Double(side)) }; pointerSide = side
                let raw = min(1, max(0, (position - knob / 2) / max(.leastNonzeroMagnitude, travel)))
                set(range.lowerBound + (reversed ? 1 - raw : raw) * span, index: index)
            }.onEnded { _ in dragging = nil; pointerSide = 0; onDragChange?(false)
                #if os(macOS)
                NSCursor.openHand.set()
                #endif
            })
            .animation(dragging != nil || isExternallyDragging || reduceMotion ? nil : MetalSprings.part.animation, value: values)
        }
        .frame(minWidth: metric("knob"), minHeight: metric("knob"))
        .keyframeAnimator(initialValue: Double.zero, trigger: refusals) { content, nudge in
            content.offset(x: isVertical ? .zero : nudge * nudgeDirection, y: isVertical ? nudge * nudgeDirection : .zero)
        } keyframes: { _ in
            KeyframeTrack { MoveKeyframe(MetalRadius.nest); SpringKeyframe(.zero, duration: MetalSprings.refusal.duration, spring: Spring(mass: .one, stiffness: MetalSprings.refusal.stiffness, damping: MetalSprings.refusal.damping)) }
        }
    }
}
