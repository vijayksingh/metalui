import SwiftUI
#if canImport(AppKit)
import AppKit
#elseif canImport(UIKit)
import UIKit
#endif

/// A place's status and choices in one graphite body, in either host colorway.
public struct MetalIsland: View {
    public enum Tone: String, Sendable {
        case live, working, offline, quiet

        var lamp: MetalLEDKind {
            switch self {
            case .live: return .live
            case .working: return .waiting
            case .offline: return .failed
            case .quiet: return .off
            }
        }
    }

    private let title: String
    private let detail: String?
    private let tone: Tone
    private let toneLabel: String?
    private let announce: String?
    private let panel: AnyView?
    private let openBinding: Binding<Bool>?
    private let action: (() -> Void)?
    @State private var ownOpen = false
    @State private var passing: String?
    @Namespace private var bodyGeometry
    @FocusState private var capFocused: Bool
    @MetalMotionPreference private var reduceMotion
    @Environment(\.metalSnapshot) private var snapshot

    /// Without a panel, the host may use the capsule as its own menu trigger.
    public init(_ title: String, detail: String? = nil, tone: Tone = .quiet,
                toneLabel: String? = nil, announce: String? = nil,
                open: Binding<Bool>? = nil, action: (() -> Void)? = nil) {
        self.title = title; self.detail = detail; self.tone = tone
        self.toneLabel = toneLabel; self.announce = announce
        self.openBinding = open; self.action = action; self.panel = nil
    }

    /// The capsule becomes the panel; an omitted binding lets the island own its open state.
    public init<Panel: View>(_ title: String, detail: String? = nil, tone: Tone = .quiet,
                            toneLabel: String? = nil, announce: String? = nil,
                            open: Binding<Bool>? = nil, @ViewBuilder panel: () -> Panel) {
        self.title = title; self.detail = detail; self.tone = tone
        self.toneLabel = toneLabel; self.announce = announce
        self.openBinding = open; self.action = nil; self.panel = AnyView(panel())
    }

    private var open: Bool { openBinding?.wrappedValue ?? ownOpen }
    private var out: Bool { open && panel != nil }
    private var spoken: String { [title, detail, toneLabel ?? tone.rawValue].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ". ") }

    public var body: some View {
        ZStack(alignment: .top) {
            if out { shell(expanded: true, focused: snapshot ? false : capFocused, focus: snapshot ? nil : $capFocused) }
            else { shell(expanded: false, focused: snapshot ? false : capFocused, focus: snapshot ? nil : $capFocused) }
        }
        .metalColorway(.graphite)
        .animation(reduceMotion ? MetalSpringClass.crossfade.spring.animation
                   : (out ? MetalSprings.part : MetalSprings.release).animation, value: out)
        .onKeyPress(.escape) {
            guard out else { return .ignored }
            setOpen(false)
            return .handled
        }
        .background {
            if !snapshot { MetalIslandDismissal(isOpen: out, close: { setOpen(false) }) }
        }
        .onChange(of: out) { wasOpen, isOpen in
            if wasOpen && !isOpen { capFocused = true }
        }
        .task(id: announce) { await showAnnouncement() }
    }

    private func shell(expanded: Bool, focused: Bool, focus: FocusState<Bool>.Binding?) -> some View {
        let recipe = MetalRecipes.island
        let corner = MetalRecipes.surface.points("radius.card")
        let shape = RoundedRectangle(cornerRadius: corner, style: .continuous)
        return VStack(spacing: .zero) {
            Button(action: activate) {
                HStack(spacing: recipe.points("self.gap")) {
                    MetalLED(tone.lamp, gesture: tone == .working ? .breathe : .steady)
                    Text(title).lineLimit(1).truncationMode(.tail)
                        .frame(maxWidth: recipe.points("self.title-max"))
                        .fixedSize(horizontal: true, vertical: false)
                    if let shown = passing ?? detail, !shown.isEmpty {
                        MetalLabel(shown, style: .readoutDim)
                            .id(shown)
                            .transition(reduceMotion ? .opacity : .asymmetric(
                                insertion: .offset(y: MetalMotionTokens.nest).combined(with: .opacity),
                                removal: .offset(y: -MetalMotionTokens.nest).combined(with: .opacity)))
                    }
                    MetalIcon(.chevron, size: MetalRecipes.button.points("compact.glyph"))
                        .rotationEffect(.degrees(open ? 180 : .zero))
                        .animation(reduceMotion ? nil : MetalSprings.part.animation, value: open)
                }
                .clipped()
                .metalAnimation(.settle, value: passing)
            }
            .buttonStyle(MetalIslandCapStyle(focused: focused, flush: expanded))
            .modifier(MetalIslandFocus(focus: focus))
            .accessibilityLabel(spoken)
            .accessibilityValue(panel != nil ? (open ? "Expanded" : "Collapsed") : "")
            // Match only the row's position: its type and cap never stretch with the shell.
            .matchedGeometryEffect(id: "capsule", in: bodyGeometry, properties: reduceMotion ? [] : .position)
            if expanded, let panel {
                panel
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, recipe.points("self.panel-pad"))
                    .padding(.top, recipe.points("self.panel-gap"))
                    .padding(.bottom, recipe.points("self.panel-pad"))
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(title)
                    .transition(reduceMotion ? .opacity : .asymmetric(
                        insertion: .opacity.combined(with: .offset(y: -MetalMotionTokens.nest))
                            .combined(with: .scale(scale: MetalRecipes.popover.scalar("self.enter-scale"), anchor: .top)),
                        removal: .opacity))
            }
        }
        .frame(width: expanded ? recipe.points("self.panel-width") : nil)
        .clipShape(shape)
        .background {
            // Geometry precedes paint. The recipe draws in the moving box with true corners;
            // neither a surface snapshot nor the row is scaled to imitate a new body size.
            Color.clear
                .matchedGeometryEffect(id: "body", in: bodyGeometry, properties: reduceMotion ? [] : .frame, anchor: .top)
                .metalObjectRecipe(MetalRecipes.surface, part: "self", state: "graphite-deep", in: shape)
        }
        .transition(reduceMotion ? .opacity : .identity)
    }

    private func activate() {
        if panel != nil { setOpen(!open) }
        else { action?() }
    }

    private func setOpen(_ next: Bool) {
        withAnimation(reduceMotion ? MetalSpringClass.crossfade.spring.animation
                      : (next ? MetalSprings.part : MetalSprings.release).animation) {
            if let openBinding { openBinding.wrappedValue = next }
            else { ownOpen = next }
        }
    }

    @MainActor private func showAnnouncement() async {
        guard let announce, !announce.isEmpty else { passing = nil; return }
        withMetalAnimation(.settle, reduceMotion: reduceMotion) { passing = announce }
        #if canImport(AppKit)
        if NSWorkspace.shared.isVoiceOverEnabled {
            NSAccessibility.post(element: NSApp as Any, notification: .announcementRequested,
                userInfo: [.announcement: announce, .priority: NSAccessibilityPriorityLevel.low.rawValue])
        }
        #elseif canImport(UIKit)
        if UIAccessibility.isVoiceOverRunning { UIAccessibility.post(notification: .announcement, argument: announce) }
        #endif
        do { try await Task.sleep(for: .milliseconds(MetalToastMetrics.plainMs)) }
        catch { return }
        withMetalAnimation(.settle, reduceMotion: reduceMotion) { passing = nil }
    }
}


/// ImageRenderer has no focus system; real islands keep the capsule's focus binding.
private struct MetalIslandFocus: ViewModifier {
    let focus: FocusState<Bool>.Binding?
    @ViewBuilder func body(content: Content) -> some View {
        if let focus { content.focused(focus) }
        else { content }
    }
}

/// Island wears the web button's graphite cap, with no independent material recipe.
struct MetalIslandCapStyle: ButtonStyle {
    let focused: Bool
    /// Open, the capsule is the panel's title row: flush with the body, its cap only on hover.
    var flush = false

    func makeBody(configuration: Configuration) -> some View {
        MetalIslandCapBody(configuration: configuration, focused: focused, flush: flush)
    }
}

private struct MetalIslandCapBody: View {
    let configuration: ButtonStyleConfiguration
    let focused: Bool
    let flush: Bool
    @State private var hovering = false
    @Environment(\.isEnabled) private var enabled
    @MetalMotionPreference private var reduceMotion

    var body: some View {
        let recipe = MetalRecipes.button
        let shape = Capsule(style: .continuous)
        configuration.label
            .font(recipe.font("graphite.font"))
            .foregroundStyle(recipe.color("graphite.ink")?.color ?? .clear)
            .padding(.horizontal, recipe.points("graphite.pad"))
            .frame(height: recipe.points("graphite.height"))
            .fixedSize(horizontal: true, vertical: false)
            .contentShape(shape)
            .background {
                Color.clear.metalObjectRecipe(recipe, part: "graphite", in: shape)
                    .opacity(flush && !hovering && !configuration.isPressed ? .zero : .one)
                    .animation(reduceMotion ? nil : MetalSprings.release.animation, value: flush)
            }
            .onHover { hovering = $0 }
            .overlay {
                if focused {
                    shape.inset(by: -(recipe.points("self.focus-offset") + recipe.points("self.focus-width") / 2))
                        .stroke(MetalShared.focus.color, lineWidth: recipe.points("self.focus-width"))
                }
            }
            .offset(y: enabled && configuration.isPressed ? recipe.points("self.travel") : .zero)
            .animation(reduceMotion ? nil : MetalSprings.release.animation, value: configuration.isPressed)
            .opacity(enabled ? .one : recipe.scalar("self.disabled"))
    }
}

#if canImport(AppKit)
import AppKit

/// Window-scoped events; the probe never receives hits or steals the host's outside click.
struct MetalIslandDismissal: NSViewRepresentable {
    let isOpen: Bool
    let close: () -> Void
    func makeNSView(context: Context) -> MetalIslandEventView { MetalIslandEventView() }
    func updateNSView(_ view: MetalIslandEventView, context: Context) { view.isOpen = isOpen; view.close = close }
    static func dismantleNSView(_ view: MetalIslandEventView, coordinator: ()) { view.detach() }
}

final class MetalIslandEventView: NSView {
    var isOpen = false
    var close: (() -> Void)?
    private var monitor: Any?
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        detach()
        guard window != nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .keyDown]) { [weak self] event in
            guard let self, self.isOpen, let window = self.window, event.window === window else { return event }
            // Menus and child popups own their Escape before the island does.
            if event.type == .keyDown {
                guard event.keyCode == 53, NSApp.keyWindow === window,
                      NSApp.modalWindow == nil || NSApp.modalWindow === window else { return event }
                self.close?()
                return nil
            }
            if !self.bounds.contains(self.convert(event.locationInWindow, from: nil)) { self.close?() }
            return event
        }
    }
    func detach() { if let monitor { NSEvent.removeMonitor(monitor) }; monitor = nil }
}
#elseif canImport(UIKit)
import UIKit

struct MetalIslandDismissal: UIViewRepresentable {
    let isOpen: Bool
    let close: () -> Void
    func makeUIView(context: Context) -> MetalIslandEventView { MetalIslandEventView() }
    func updateUIView(_ view: MetalIslandEventView, context: Context) { view.isOpen = isOpen; view.close = close }
    static func dismantleUIView(_ view: MetalIslandEventView, coordinator: ()) { view.detach() }
}

final class MetalIslandEventView: UIView, UIGestureRecognizerDelegate {
    var isOpen = false
    var close: (() -> Void)?
    private weak var observedWindow: UIWindow?
    private lazy var tap: UITapGestureRecognizer = {
        let recognizer = UITapGestureRecognizer(target: self, action: #selector(closeIsland))
        recognizer.cancelsTouchesInView = false
        recognizer.delegate = self
        return recognizer
    }()
    override init(frame: CGRect) { super.init(frame: frame); isUserInteractionEnabled = false; isAccessibilityElement = false }
    @available(*, unavailable) required init?(coder: NSCoder) { fatalError() }
    override func didMoveToWindow() {
        super.didMoveToWindow(); detach()
        window?.addGestureRecognizer(tap); observedWindow = window
    }
    func detach() { observedWindow?.removeGestureRecognizer(tap); observedWindow = nil }
    func gestureRecognizer(_ recognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        guard isOpen, let window, touch.view?.window === window else { return false }
        // A presented popup owns taps and Escape, even when UIKit hosts it in the same window.
        guard window.rootViewController?.presentedViewController == nil else { return false }
        return !bounds.contains(convert(touch.location(in: window), from: window))
    }
    func gestureRecognizer(_ recognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
    @objc private func closeIsland() { close?() }
}
#endif
