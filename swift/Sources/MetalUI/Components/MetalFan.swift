import SwiftUI
#if os(macOS)
import AppKit
#elseif canImport(UIKit)
import UIKit
#endif

/// Shared open cell for one compact control bar.
public enum MetalFanCell: Hashable, Sendable { case picker, tray }

private struct MetalFanReduceMotionKey: EnvironmentKey { static let defaultValue: Bool? = nil }
private extension EnvironmentValues {
    var metalFanReduceMotionOverride: Bool? {
        get { self[MetalFanReduceMotionKey.self] }
        set { self[MetalFanReduceMotionKey.self] = newValue }
    }
}

@MainActor
private final class MetalFanState: ObservableObject {
    @Published var open: MetalFanCell?
    var pickerCount = 0
    var pickerDirection: MetalFanDirection = .up
    init(open: MetalFanCell? = nil) { self.open = open }
    func toggle(_ cell: MetalFanCell) { open = open == cell ? nil : cell }
}

/// Compact bar: label, choice fan, and an expanding options cap.
public struct MetalFan<Content: View>: View {
    private let label: String
    private let content: Content
    private let reduceMotionOverride: Bool?
    private let openBinding: Binding<MetalFanCell?>?
    @StateObject private var state: MetalFanState
    #if os(macOS)
    @State private var eventMonitor: Any?
    #endif

    /// `open`: the host's view of which cell is open, so it can fold the Fan from its own key
    /// handling (Escape) or know it is open. Omit it and the Fan keeps the state itself.
    public init(_ label: String, initialOpen: MetalFanCell? = nil, open: Binding<MetalFanCell?>? = nil,
                reduceMotion: Bool? = nil, @ViewBuilder content: () -> Content) {
        self.label = label
        self.content = content()
        self.reduceMotionOverride = reduceMotion
        self.openBinding = open
        _state = StateObject(wrappedValue: MetalFanState(open: open?.wrappedValue ?? initialOpen))
    }

    public var body: some View {
        HStack(alignment: .bottom, spacing: MetalRecipes.toolbar.points("self.gap")) { content }
            .environmentObject(state)
            .environment(\.metalFanReduceMotionOverride, reduceMotionOverride)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
            #if os(macOS)
            .onExitCommand { state.open = nil }
            #else
            .onKeyPress(.escape) { state.open = nil; return .handled }
            #endif
            .onChange(of: state.open) { _, now in
                if let openBinding, openBinding.wrappedValue != now { openBinding.wrappedValue = now }
            }
            // The host's value wins when it changes (without a binding this follows the Fan's own).
            .onChange(of: openBinding.map { $0.wrappedValue } ?? state.open) { _, now in
                if state.open != now { state.open = now }
            }
            #if os(macOS)
            .background {
                // ImageRenderer represents NSView bridges as a yellow placeholder.
                if ProcessInfo.processInfo.environment["METALUI_CAPTURES"] == nil {
                    MetalFanWindowProbe { view in
                        guard eventMonitor == nil else { return }
                        eventMonitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .keyDown]) { event in
                            guard state.open != nil, let window = view.window, event.window === window else { return event }
                            // Escape folds from anywhere in the window: keyboard focus usually sits
                            // in the host (a canvas), where `onExitCommand` never hears it.
                            if event.type == .keyDown {
                                guard event.keyCode == 53 else { return event }
                                state.open = nil
                                return nil
                            }
                            var bounds = view.convert(view.bounds, to: nil)
                            if state.open == .picker {
                                let reach = Double(state.pickerCount) * (MetalRecipes.iconButton.points("tool.size") + MetalRecipes.toolbar.points("self.gap"))
                                bounds = bounds.insetBy(dx: 0, dy: -reach)
                            }
                            if !bounds.contains(event.locationInWindow) { state.open = nil }
                            return event
                        }
                    }
                }
            }
            .onDisappear {
                if let eventMonitor { NSEvent.removeMonitor(eventMonitor); self.eventMonitor = nil }
            }
            #elseif canImport(UIKit)
            .background {
                MetalFanOutsideTapLayer(state: state)
            }
            #endif
    }
}

#if os(macOS)
private struct MetalFanWindowProbe: NSViewRepresentable {
    let ready: (NSView) -> Void
    func makeNSView(context: Context) -> NSView { NSView() }
    func updateNSView(_ view: NSView, context: Context) { DispatchQueue.main.async { ready(view) } }
}
#endif

#if canImport(UIKit)
/// Observes outside taps without intercepting the host's gesture or covering expanded picks.
private struct MetalFanOutsideTapLayer: UIViewRepresentable {
    let state: MetalFanState

    func makeUIView(context: Context) -> OutsideTapView {
        OutsideTapView(state: state)
    }
    func updateUIView(_ view: OutsideTapView, context: Context) { view.state = state }
    static func dismantleUIView(_ view: OutsideTapView, coordinator: ()) { view.detach() }

    final class OutsideTapView: UIView, UIGestureRecognizerDelegate {
        var state: MetalFanState
        private weak var observedWindow: UIWindow?
        private lazy var tap: UITapGestureRecognizer = {
            let recognizer = UITapGestureRecognizer(target: self, action: #selector(fold))
            recognizer.cancelsTouchesInView = false
            recognizer.delegate = self
            return recognizer
        }()

        init(state: MetalFanState) {
            self.state = state
            super.init(frame: .zero)
            isUserInteractionEnabled = false
            isAccessibilityElement = false
        }
        @available(*, unavailable)
        required init?(coder: NSCoder) { fatalError() }

        override func didMoveToWindow() {
            super.didMoveToWindow()
            detach()
            window?.addGestureRecognizer(tap)
            observedWindow = window
        }

        func detach() {
            observedWindow?.removeGestureRecognizer(tap)
            observedWindow = nil
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            guard state.open != nil, let window else { return false }
            var bounds = convert(self.bounds, to: window)
            if state.open == .picker {
                let reach = CGFloat(state.pickerCount) * (MetalRecipes.iconButton.points("tool.size") + MetalRecipes.toolbar.points("self.gap"))
                let above = state.pickerDirection == .up ? reach : ceil(CGFloat(state.pickerCount) / 2) * (MetalRecipes.iconButton.points("tool.size") + MetalRecipes.toolbar.points("self.gap"))
                bounds.origin.y -= above
                bounds.size.height += reach
            }
            return !bounds.contains(touch.location(in: window))
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                               shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool { true }

        @objc private func fold() { state.open = nil }
    }
}
#endif

/// Current context, using the same graphite cap material as the tool cells.
public struct MetalFanLabel: View {
    let title: String
    public init(_ title: String) { self.title = title }
    public var body: some View {
        let r = MetalRecipes.iconButton
        Text(title)
            .font(MetalRecipes.toolbar.font("search.font"))
            .foregroundStyle((r.color("tool.ink") ?? MetalTokens.graphite.ink).color)
            .padding(.horizontal, MetalRecipes.toolbar.points("self.pad"))
            .frame(height: r.points("tool.size"))
            .metalObjectRecipe(r, part: "tool", in: RoundedRectangle(cornerRadius: r.points("tool.radius"), style: .continuous))
            .fixedSize()
    }
}

public struct MetalFanOption<Value: Hashable>: Identifiable {
    public let value: Value
    public let label: String
    public let icon: MetalIconName
    public let shortcut: String?
    public var id: Value { value }
    public init(_ value: Value, _ label: String, icon: MetalIconName, shortcut: String? = nil) {
        self.value = value; self.label = label; self.icon = icon; self.shortcut = shortcut
    }
}

public enum MetalFanDirection: Sendable { case up, both }

/// Current choice stays in the bar; its siblings fan from behind it.
public struct MetalFanPicker<Value: Hashable>: View {
    private let label: String
    @Binding private var value: Value
    private let options: [MetalFanOption<Value>]
    private let direction: MetalFanDirection
    @EnvironmentObject private var state: MetalFanState
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.metalFanReduceMotionOverride) private var reduceMotionOverride
    @FocusState private var focusedOption: Int?
    @FocusState private var capFocused: Bool

    public init(_ label: String, value: Binding<Value>, options: [MetalFanOption<Value>], direction: MetalFanDirection = .up) {
        self.label = label; _value = value; self.options = options; self.direction = direction
    }

    private var others: [MetalFanOption<Value>] { options.filter { $0.value != value } }
    private var current: MetalFanOption<Value>? { options.first { $0.value == value } ?? options.first }
    private var open: Bool { state.open == .picker }
    private var still: Bool { reduceMotionOverride ?? reduceMotion }
    private func slot(_ index: Int) -> Int {
        if direction == .up { return -(index + 1) }
        return (index.isMultiple(of: 2) ? -1 : 1) * (index / 2 + 1)
    }

    private func moveFocus(from index: Int, by delta: Int) {
        let next = index + delta
        if next < 0 { capFocused = true }
        else if next < others.count { focusedOption = next }
    }

    public var body: some View {
        let step = MetalRecipes.iconButton.points("tool.size") + MetalRecipes.toolbar.points("self.gap")
        ZStack(alignment: .bottom) {
            ForEach(Array(others.enumerated()), id: \.element.id) { index, option in
                MetalIconButton(option.shortcut.map { "\(option.label) · \($0)" } ?? option.label,
                                icon: option.icon, variant: .tool) {
                    value = option.value
                    state.open = nil
                    capFocused = true
                }
                .focused($focusedOption, equals: index)
                #if os(macOS)
                .onMoveCommand { move in
                    moveFocus(from: index, by: move == .up ? 1 : move == .down ? -1 : 0)
                }
                #else
                .onKeyPress(.upArrow) { moveFocus(from: index, by: 1); return .handled }
                .onKeyPress(.downArrow) { moveFocus(from: index, by: -1); return .handled }
                #endif
                // Before the offset: the reported frame moves with the drawn option.
                .metalHitRegion(open)
                // Each choice travels out of the cap on SwiftUI's own snappy motion (the chrome
                // role): quick and exact like a system menu. Opening staggers by a beat; folding
                // goes back together.
                .offset(y: open ? Double(slot(index)) * step : 0)
                .opacity(open ? .one : .zero)
                .animation(still ? MetalSpringClass.crossfade.spring.animation
                                 : MetalSprings.chrome.animation.delay(open ? Double(index) * MetalMotionTokens.fanStagger : .zero),
                           value: open)
                .allowsHitTesting(open)
                .accessibilityHidden(!open)
                .zIndex(open ? Double(others.count - index) : 0)
            }
            if let current {
                MetalIconButton("\(label): \(current.label)", icon: current.icon, variant: .tool) {
                    state.toggle(.picker)
                }
                .focused($capFocused)
                .accessibilityValue(open ? "Expanded" : "Collapsed")
                .zIndex(100)
            }
        }
        .frame(width: MetalRecipes.iconButton.points("tool.size"), height: MetalRecipes.iconButton.points("tool.size"))
        .onChange(of: state.open) { old, new in
            if new == .picker { focusedOption = others.isEmpty ? nil : 0 }
            else if old == .picker && new == nil { capFocused = true }
        }
        .onAppear {
            state.pickerCount = others.count
            state.pickerDirection = direction
        }
    }
}

/// Options cap expands sideways; its content can be picks or action buttons.
public struct MetalFanTray<Icon: View, Content: View>: View {
    private let label: String
    private let icon: Icon
    private let content: Content
    @EnvironmentObject private var state: MetalFanState
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.metalFanReduceMotionOverride) private var reduceMotionOverride
    @FocusState private var capFocused: Bool
    @FocusState private var foldFocused: Bool
    private var still: Bool { reduceMotionOverride ?? reduceMotion }

    public init(_ label: String, @ViewBuilder icon: () -> Icon, @ViewBuilder content: () -> Content) {
        self.label = label; self.icon = icon(); self.content = content()
    }

    public var body: some View {
        let r = MetalRecipes.iconButton
        let open = state.open == .tray
        HStack(spacing: MetalRecipes.toolbar.points("self.gap")) {
            if open {
                content
                    .environment(\.metalToolbarVariant, true)
                    .accessibilityLabel(label)
                MetalIconButton("Fold \(label)", variant: .tool) { state.open = nil; capFocused = true } icon: {
                    Text("‹").font(MetalRecipes.toolbar.font("search.font"))
                }
                .focused($foldFocused)
            } else {
                MetalIconButton(label, variant: .tool) { state.toggle(.tray) } icon: { icon }
                    .focused($capFocused)
                    .accessibilityValue("Collapsed")
            }
        }
        .padding(.horizontal, open ? MetalRecipes.toolbar.points("self.pad") : .zero)
        .frame(height: r.points("tool.size"))
        .metalObjectRecipe(r, part: "tool", in: RoundedRectangle(cornerRadius: r.points("tool.radius"), style: .continuous))
        .fixedSize()
        .metalHitRegion()
        .animation(MetalMotion.resolve(.chrome, reduceMotion: still).animation, value: open)
        .onChange(of: state.open) { old, new in
            if new == .tray { foldFocused = true }
            else if old == .tray && new == nil { capFocused = true }
        }
    }
}
