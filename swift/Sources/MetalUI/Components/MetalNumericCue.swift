import SwiftUI
#if os(macOS)
import AppKit
#endif

/// Canonical quantity and a presentation unit. Unit conversion never changes the quantity.
public struct MetalNumericCueValue: Equatable, Sendable {
    public var value: Double
    public var unit: String
    public init(value: Double, unit: String) { self.value = value; self.unit = unit }
}

/// The host supplies all conversion factors, display formats and lossless source spellings.
public struct MetalNumericCueUnit {
    public var id: String
    public var label: String
    public var factor: Double
    public var step: Double
    public var smallStep: Double
    public var largeStep: Double
    public var format: (Double) -> String
    public var source: (Double) -> String
    public init(id: String, label: String, factor: Double, step: Double = 1,
                smallStep: Double = 0.1, largeStep: Double = 10,
                format: @escaping (Double) -> String, source: @escaping (Double) -> String) {
        precondition(factor.isFinite && factor > 0)
        self.id = id; self.label = label; self.factor = factor
        self.step = step; self.smallStep = smallStep; self.largeStep = largeStep
        self.format = format; self.source = source
    }
}

public enum MetalNumericCueCancelReason: Sendable { case escape, external, pointer }

/// A numeric component embedded in text. Its held scale is an instrument, never present at rest.
public struct MetalNumericCue: View {
    private let label: String
    @Binding private var value: MetalNumericCueValue
    private let units: [MetalNumericCueUnit]
    private let bounds: ClosedRange<Double>
    private let footprint: [String]
    private let kind: MetalCueKind
    private let meaning: MetalCueMeaning?
    private let raw: Bool
    private let readOnly: Bool
    private let allowTyping: Bool
    private let locale: Locale
    private let onBegin: () -> Void
    private let onSourceChange: (String) -> Void
    private let onCommit: () -> Void
    private let onCancel: (MetalNumericCueCancelReason) -> Void
    @Environment(\.isEnabled) private var enabled
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    @FocusState private var focused: Bool
    @State private var typing = false
    @State private var held = false
    @State private var draft = ""
    @State private var initial: MetalNumericCueValue?
    @State private var initialSource: String?
    @State private var expected: MetalNumericCueValue?
    @State private var axis: Axis?
    @State private var lastStop = 0
    @State private var blockedDrag = false

    public init(_ label: String, value: Binding<MetalNumericCueValue>, units: [MetalNumericCueUnit],
                in bounds: ClosedRange<Double>, footprint: [String], kind: MetalCueKind = .measurement,
                meaning: MetalCueMeaning? = nil, raw: Bool = false, readOnly: Bool = false, allowTyping: Bool = true,
                locale: Locale = .current, onBegin: @escaping () -> Void = {},
                onSourceChange: @escaping (String) -> Void = { _ in }, onCommit: @escaping () -> Void = {},
                onCancel: @escaping (MetalNumericCueCancelReason) -> Void = { _ in }) {
        precondition(!units.isEmpty && !footprint.isEmpty && bounds.lowerBound.isFinite && bounds.upperBound.isFinite)
        self.label = label; _value = value; self.units = units; self.bounds = bounds; self.footprint = footprint
        self.kind = kind; self.meaning = meaning; self.raw = raw; self.readOnly = readOnly; self.allowTyping = allowTyping; self.locale = locale
        self.onBegin = onBegin; self.onSourceChange = onSourceChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    private var unit: MetalNumericCueUnit { units.first { $0.id == value.unit } ?? units[0] }
    private var displayed: Double { value.value / unit.factor }
    private var words: String { unit.source(displayed) }
    private var formatted: String { unit.format(displayed) }
    private var mutable: Bool { enabled && !readOnly }
    private var numberFormatter: NumberFormatter {
        let formatter = NumberFormatter(); formatter.locale = locale; formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 16
        return formatter
    }
    public var body: some View {
        ZStack(alignment: .leading) {
            // Real font metrics establish the maximum once per layout; no per-frame geometry reads.
            ForEach(Array(footprint.enumerated()), id: \.offset) { _, words in
                Text(words).font(.metal(MetalType.content)).monospacedDigit().hidden().accessibilityHidden(true)
                    .padding(.top, MetalRecipes.button.points("compact.glyph") + MetalSpace.s2)
            }
            MetalCueText(raw ? words : formatted, kind: kind, meaning: meaning, label: label, raw: raw || !mutable)
                .opacity(typing ? .zero : .one)
                .contentTransition(reduceMotion ? .opacity : .numericText(value: displayed))
                .metalAnimation(.settle, value: value)
                .onTapGesture { startTyping() }
                .gesture(DragGesture(minimumDistance: MetalSpace.s2)
                    .onChanged { drag($0) }
                    .onEnded { _ in if !blockedDrag { commit() }; blockedDrag = false })
            if typing { editor }
        }
        .foregroundStyle(colorway.tokens.ink.color)
        .overlay(alignment: .topLeading) {
            if held {
                MetalTooltipChip(label: "−  │  \(formatted)  │  +", shortcut: nil)
                    .offset(y: -(MetalRecipes.button.points("compact.height") + MetalSpace.s2))
                    .allowsHitTesting(false).accessibilityHidden(true)
            }
        }
        .focusable(interactions: .edit).focused($focused)
        .onChange(of: focused) { _, next in if !next { typing = false; commit() } }
        .onKeyPress(phases: .down) { press in handleKey(press) }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label).accessibilityValue("\(formatted), \(unit.label)")
        .accessibilityHint("Up and down change the value. Option left and right convert units. Escape cancels.")
        .accessibilityAdjustableAction { direction in
            guard mutable else { return }
            begin(); step(direction == .increment ? 1 : -1, amount: unit.step); commit()
        }
        .help("Drag vertically to change, horizontally to convert. Shift steps more; Option steps less. Escape cancels.")
        .onChange(of: value) { previous, next in
            if initial != nil, next != expected { cancel(.external) }
            else if typing && previous.unit != next.unit { draft = numberFormatter.string(from: NSNumber(value: displayed)) ?? String(displayed) }
        }
        .onChange(of: enabled) { _, next in if !next { cancel(.external) } }
        .onChange(of: readOnly) { _, next in if next { cancel(.external) } }
    }

    private var editor: some View {
        TextField(label, text: $draft).textFieldStyle(.plain)
            .font(.metal(MetalType.content)).monospacedDigit()
            .padding(.top, MetalRecipes.button.points("compact.glyph") + MetalSpace.s2)
            .focused($focused)
            .onChange(of: draft) { _, next in
                guard mutable, let number = numberFormatter.number(from: next)?.doubleValue else { return }
                publish(MetalNumericCueValue(value: number * unit.factor, unit: unit.id))
            }
            .onSubmit { typing = false; focused = false; commit() }
    }
    private func begin() {
        guard mutable, initial == nil else { return }
        initial = value; initialSource = words; expected = value; onBegin()
    }
    private func publish(_ next: MetalNumericCueValue, detent: Bool = false) {
        guard mutable, !blockedDrag, next.value.isFinite, let selected = units.first(where: { $0.id == next.unit }) else { return }
        let accepted = MetalNumericCueValue(value: min(bounds.upperBound, max(bounds.lowerBound, next.value)), unit: next.unit)
        guard accepted != value else { return }
        begin(); expected = accepted; value = accepted
        onSourceChange(selected.source(accepted.value / selected.factor))
        if detent { MetalHaptic.detent.perform() }
    }
    private func commit() {
        let active = initial != nil
        initial = nil; initialSource = nil; expected = nil; held = false; axis = nil; lastStop = 0
        if active { onCommit() }
    }
    private func cancel(_ reason: MetalNumericCueCancelReason) {
        guard let original = initial else { return }
        let originalSource = initialSource
        let wasHeld = held
        initial = nil; initialSource = nil; expected = nil; held = false; typing = false; focused = false; axis = nil; lastStop = 0
        if reason != .external {
            value = original
            if let originalSource { onSourceChange(originalSource) }
        }
        blockedDrag = wasHeld; onCancel(reason)
    }
    private func startTyping() {
        guard mutable, allowTyping else { return }
        blockedDrag = false; begin(); draft = numberFormatter.string(from: NSNumber(value: displayed)) ?? String(displayed)
        typing = true; focused = true
    }
    private func step(_ direction: Double, amount: Double) {
        publish(MetalNumericCueValue(value: value.value + direction * amount * unit.factor, unit: value.unit), detent: true)
    }
    private func convert(_ direction: Int) {
        guard let index = units.firstIndex(where: { $0.id == value.unit }) else { return }
        let next = units[min(units.count - 1, max(0, index + direction))]
        publish(MetalNumericCueValue(value: value.value, unit: next.id), detent: true)
    }
    private func drag(_ gesture: DragGesture.Value) {
        guard mutable, !blockedDrag else { return }
        begin(); held = true; typing = false
        let x = gesture.translation.width, y = gesture.translation.height
        if axis == nil { axis = abs(x) > abs(y) ? .horizontal : .vertical }
        let stops: Int
        if axis == .horizontal {
            stops = Int(x / MetalSpace.s16)
            while stops != lastStop { let direction = stops > lastStop ? 1 : -1; lastStop += direction; convert(direction) }
        } else {
            stops = Int(-y / MetalSpace.s2)
            var amount = unit.step
            #if os(macOS)
            if NSEvent.modifierFlags.contains(.shift) { amount = unit.largeStep }
            else if NSEvent.modifierFlags.contains(.option) { amount = unit.smallStep }
            #endif
            let difference = stops - lastStop; lastStop = stops
            if difference != 0 { step(Double(difference), amount: amount) }
        }
    }
    private func handleKey(_ press: KeyPress) -> KeyPress.Result {
        guard mutable else { return .ignored }
        if press.key == .escape { cancel(.escape); return .handled }
        if press.modifiers.contains(.option) && (press.key == .leftArrow || press.key == .rightArrow) {
            blockedDrag = false; begin(); convert(press.key == .leftArrow ? -1 : 1); commit(); return .handled
        }
        if press.key == .upArrow || press.key == .downArrow {
            blockedDrag = false; begin()
            step(press.key == .upArrow ? 1 : -1, amount: press.modifiers.contains(.shift) ? unit.largeStep : press.modifiers.contains(.option) ? unit.smallStep : unit.step)
            commit(); return .handled
        }
        if allowTyping && !typing && (press.key == .return || press.key == .space) { startTyping(); return .handled }
        return .ignored
    }
}
