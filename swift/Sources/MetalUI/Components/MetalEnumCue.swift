import SwiftUI
#if os(macOS)
import AppKit
#endif

public struct MetalEnumCueChoice: Equatable, Sendable {
    public let value: String
    public let label: String?
    public let glyph: MetalIconName?
    public let tint: MetalRGBA?
    public init(_ value: String, label: String? = nil, glyph: MetalIconName? = nil, tint: MetalRGBA? = nil) {
        self.value = value; self.label = label; self.glyph = glyph; self.tint = tint
    }
}

/// A finite source state. Source ranges and snapshot history belong to its document host.
@MainActor
public struct MetalEnumCue: View {
    private let value: String
    private let choices: [MetalEnumCueChoice]
    private let label: String
    private let readOnly: Bool
    private let raw: Bool
    private let hint: Bool
    private let editing: Bool?
    private let onBegin: () -> Bool
    private let onChange: (String) -> Void
    private let onCommit: () -> Void
    private let onCancel: (() -> Void)?
    @State private var gesture: Gesture?
    @State private var wheelEnd: Task<Void, Never>?
    @FocusState private var focused: Bool
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.isEnabled) private var enabled
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    private enum Kind { case pointer, keyboard, wheel }
    private struct Gesture {
        let kind: Kind
        let original: String
        var current: String
        let index: Int
        var moved = false
        var wheel: Double = .zero
    }
    public init(_ value: String, choices: [MetalEnumCueChoice], label: String, readOnly: Bool = false, raw: Bool = false, editing: Bool? = nil, hint: Bool = true,
                onBegin: @escaping () -> Bool = { true }, onChange: @escaping (String) -> Void,
                onCommit: @escaping () -> Void = {}, onCancel: (() -> Void)? = nil) {
        self.value = value; self.choices = choices; self.label = label; self.readOnly = readOnly; self.raw = raw; self.editing = editing; self.hint = hint
        self.onBegin = onBegin; self.onChange = onChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    private var index: Int? { choices.firstIndex(where: { $0.value == value }) }
    private var current: MetalEnumCueChoice { index.map { choices[$0] } ?? .init(value) }
    private var mutable: Bool { Set(choices.map(\.value)).count == choices.count && choices.allSatisfy { !$0.value.isEmpty } && enabled && !readOnly && index != nil && choices.count > 1 }
    private var name: String { current.label.map { $0 == value ? value : "\($0) (\(value))" } ?? value }
    public var body: some View {
        Button(action: cycle) {
            ZStack(alignment: .leading) {
                ForEach(choices, id: \.value) { choice in Text(choice.value).hidden() }
                Group {
                    if raw { Text(value) }
                    else { MetalCueTag(value, tint: current.tint ?? colorway.tokens.ink3) }
                }.id(value).transition(reduceMotion ? .opacity : .asymmetric(insertion: .offset(y: MetalSpace.s4).combined(with: .opacity), removal: .offset(y: -MetalSpace.s4).combined(with: .opacity)))
            }
            .font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
            .fixedSize().metalAnimation(.settle, value: value)
            .overlay(alignment: .topLeading) {
                if !raw, gesture == nil, let glyph = current.glyph {
                    MetalMorphIcon(glyph, size: MetalRecipes.button.points("compact.glyph"))
                        .offset(y: -(MetalRecipes.button.points("compact.glyph") + MetalSpace.s2)).accessibilityHidden(true)
                }
            }
            .overlay(alignment: .topLeading) {
                if gesture != nil, let index { Text(choices[(index - 1 + choices.count) % choices.count].label ?? choices[(index - 1 + choices.count) % choices.count].value)
                    .font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink2.color).offset(y: -MetalSpace.s24).accessibilityHidden(true) }
            }
            .overlay(alignment: .bottomLeading) {
                if gesture != nil, let index { Text(choices[(index + 1) % choices.count].label ?? choices[(index + 1) % choices.count].value)
                    .font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink2.color).offset(y: MetalSpace.s24).accessibilityHidden(true) }
            }
        }
        .buttonStyle(.plain).disabled(!mutable).focusable(enabled).focused($focused).focusEffectDisabled()
        .overlay { if focused { Rectangle().strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) } }
        .opacity(enabled ? Double.one : MetalRecipes.field.scalar("state.disabled"))
        .highPriorityGesture(DragGesture(minimumDistance: .zero).onChanged { drag in
            guard begin(.pointer) else { return }
            let stops = Int((-drag.translation.height / MetalSpace.s24).rounded())
            if stops != 0 { gesture?.moved = true }
            if let gesture { land(gesture.index + stops) }
        }.onEnded { _ in
            guard gesture?.kind == .pointer else { return }
            if gesture?.moved == false { step(1) }; commit()
        })
        .onKeyPress(keys: [.space, .upArrow, .downArrow, .escape], phases: [.down, .repeat, .up]) { key in
            if key.key == .escape, gesture != nil { cancel(); return .handled }
            guard mutable, key.key != .escape else { return .ignored }
            if key.phase == .up { if gesture?.kind == .keyboard { commit() } }
            else if begin(.keyboard) { step(key.key == .upArrow ? -1 : 1) }
            return .handled
        }
        .help(hint ? "Space cycles · Up/Down steps · Focus to scroll · Hold and drag" : "")
        .accessibilityLabel(label).accessibilityValue(name)
        .accessibilityHint(readOnly ? "Read only" : "Space cycles. Up and Down step. Hold and drag vertically; focus to scroll. Escape cancels a held edit.")
        .accessibilityAdjustableAction { direction in
            guard begin(.keyboard) else { return }
            step(direction == .increment ? 1 : -1); commit()
        }
        .onChange(of: value) { _, next in if let gesture, next != gesture.current { cancel(restore: false) } }
        .onChange(of: choices) { _, _ in cancel(restore: false) }
        .onChange(of: editing) { _, next in if next == false { cancel(restore: false) } }
        .onChange(of: readOnly) { _, next in if next { cancel() } }
        .onChange(of: scenePhase) { _, next in if next != .active { cancel() } }
        .onChange(of: enabled) { _, next in if !next { cancel() } }
        .onChange(of: focused) { _, next in if !next { cancel() } }
        .onDisappear { cancel() }
        #if os(macOS)
        .background(MetalEnumWheel { event in
            guard focused, mutable else { return false }
            if !event.momentumPhase.isEmpty { return true }
            guard event.scrollingDeltaY != .zero, begin(.wheel) else { return false }
            gesture?.wheel -= event.scrollingDeltaY * (event.hasPreciseScrollingDeltas ? Double.one : MetalSpace.s24)
            if let gesture {
                let stops = Int(gesture.wheel / MetalSpace.s24)
                if stops != 0 { self.gesture?.wheel -= Double(stops) * MetalSpace.s24; step(stops) }
            }
            wheelEnd?.cancel(); wheelEnd = Task { @MainActor in
                do { try await Task.sleep(for: .seconds(MetalSpringClass.release.spring.duration)) } catch { return }
                guard !Task.isCancelled else { return }; commit()
            }
            return true
        })
        #endif
    }
    private func begin(_ kind: Kind) -> Bool {
        if let gesture { return gesture.kind == kind }
        guard mutable, let index, onBegin() else { return false }
        gesture = .init(kind: kind, original: value, current: value, index: index); if kind == .pointer { focused = true }; return true
    }
    private func land(_ at: Int) {
        guard let gesture, !choices.isEmpty else { return }
        let next = choices[((at % choices.count) + choices.count) % choices.count].value
        guard next != gesture.current else { return }
        self.gesture?.current = next; onChange(next); MetalHaptic.detent.perform()
    }
    private func step(_ amount: Int) { guard let gesture, let index = choices.firstIndex(where: { $0.value == gesture.current }) else { return }; land(index + amount) }
    private func cycle() { if begin(.keyboard) { step(1); commit() } }
    private func commit() { guard gesture != nil else { return }; wheelEnd?.cancel(); wheelEnd = nil; gesture = nil; onCommit() }
    private func cancel(restore: Bool = true) {
        guard let gesture else { return }; wheelEnd?.cancel(); wheelEnd = nil; self.gesture = nil
        if let onCancel { onCancel() } else if restore { onChange(gesture.original) }
    }
}

#if os(macOS)
/// Scoped wheel events: the view never takes pointer hits, and its local monitor checks this window
/// and exact bounds. Unfocused page scrolling passes through unchanged. No keyboard monitor exists.
private struct MetalEnumWheel: NSViewRepresentable {
    let handle: (NSEvent) -> Bool
    func makeNSView(context: Context) -> WheelView { let view = WheelView(); view.handle = handle; return view }
    func updateNSView(_ view: WheelView, context: Context) { view.handle = handle }
    static func dismantleNSView(_ view: WheelView, coordinator: Void) { view.stop() }
    final class WheelView: NSView {
        var handle: ((NSEvent) -> Bool)?
        private var monitor: Any?
        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow(); stop(); guard window != nil else { return }
            monitor = NSEvent.addLocalMonitorForEvents(matching: .scrollWheel) { [weak self] event in
                guard let self, self.window === event.window, self.bounds.contains(self.convert(event.locationInWindow, from: nil)) else { return event }
                return self.handle?(event) == true ? nil : event
            }
        }
        func stop() { if let monitor { NSEvent.removeMonitor(monitor) }; monitor = nil }
    }
}
#endif
