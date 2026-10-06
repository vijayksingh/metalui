import SwiftUI

// A pill cap from the generated button recipe; it sinks while held and springs back.

/// Which cap a button wears. `standard` is soft-touch in the colorway,
/// `primary` wears the contrasting finish, `destructive` the one red cap.
public enum MetalButtonCap: Sendable {
    case standard
    case primary
    case destructive
    case strip
    case stripDanger
}

/// The host owns the request. Done refuses another press; error permits a retry.
public enum MetalButtonState: Sendable { case idle, waiting, done, error }

/// Press-in pill cap for any `Button`.
public struct MetalButtonStyle: ButtonStyle {
    public var cap: MetalButtonCap
    public var size: MetalButtonSize

    public init(cap: MetalButtonCap = .standard, size: MetalButtonSize = .default) {
        self.cap = cap
        self.size = size
    }

    public func makeBody(configuration: Configuration) -> some View {
        MetalButtonBody(configuration: configuration, cap: cap, size: size)
    }
}

/// Which size a button is: the regular or compact recipe.
public enum MetalButtonSize: Sendable {
    case `default`
    case compact
}

private struct MetalButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let cap: MetalButtonCap
    let size: MetalButtonSize

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.metalButtonGroup) private var group
    @Environment(\.metalButtonGroupLatched) private var latched
    @Environment(\.metalToggleTravel) private var toggleTravel
    @MetalMotionPreference private var reduceMotion
    @Environment(\.metalButtonGroupWidth) private var groupWidth
    @State private var segmentID = UUID()
    @Environment(\.metalButtonHolding) private var holding
    @Environment(\.metalButtonKeyboardPressed) private var keyboardPressed
    @Environment(\.metalButtonWaiting) private var waiting
    @Environment(\.metalButtonIconOnly) private var iconOnly
    @Environment(\.metalButtonHoldEnabled) private var holdEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.metalButtonFocused) private var focused
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    var body: some View {
        let pressing = isEnabled && (configuration.isPressed || keyboardPressed)
        let isDown = toggleTravel ? (pressing || latched) : isEnabled && (pressing || holding || waiting || latched)
        let depth = toggleTravel ? (pressing ? MetalRecipes.toggle.points("self.catch") : latched ? MetalRecipes.toggle.points("self.latch") : .zero) : isDown ? MetalRecipes.button.points("self.travel") : .zero
        let travel: Animation? = toggleTravel && pressing ? .linear(duration: MetalRecipes.toggle.durationSeconds("self.press")) : MetalMotion.resolve(toggleTravel && latched ? .part : .release, reduceMotion: reduceMotion).animation
        let recipe = MetalRecipes.button
        let strip = cap == .strip || cap == .stripDanger
        let compact = size == .compact && !strip
        let height = recipe.points(strip ? "strip.height" : compact ? "compact.height" : "self.height")
        let shape = RoundedRectangle(cornerRadius: group != nil ? .zero : strip ? recipe.points("strip.radius") : height / 2, style: .continuous)
        let width = (groupWidth ?? (iconOnly ? height : nil)).map { CGFloat($0) }
        let part = strip ? "strip" : compact && cap == .standard ? "compact" : cap == .standard ? "self" : cap == .primary ? "primary" : "destructive"

        configuration.label
            // The button is its icons' trigger: a MetalIcon inside plays its hover pose and press.
            .metalIconInteraction(MetalIconInteraction(isHovered: !holdEnabled && !waiting && hovering && isEnabled, isPressed: !holdEnabled && !waiting && isDown, holdDuration: holding ? recipe.durationSeconds("hold.duration") : nil))
            .font(strip ? recipe.font("strip.font") : compact ? recipe.font("compact.font") : .metal(MetalType.ui))
            .tracking(compact ? recipe.tracking("compact.tracking", size: recipe.fontSize("compact.font")) : MetalType.ui.trackingPoints)
            .lineLimit(1)
            // A button is as wide as its label: it never truncates it.
            .fixedSize(horizontal: true, vertical: false)
            .foregroundStyle(foreground(colorway.tokens))
            .padding(.horizontal, iconOnly || groupWidth != nil ? .zero : recipe.points(strip ? "strip.pad" : compact ? "compact.pad" : "self.pad"))
            .frame(width: width)
            .frame(height: height)
            .contentShape(shape)
            .background { if group != nil && hovering && isEnabled && !isDown { Color.clear.metalObjectRecipe(MetalRecipes.buttonGroup, part: "key", state: "hover", in: shape).allowsHitTesting(false) } }
            .onHover { hovering = $0 }
            .background {
                ZStack {
                    Color.clear.metalObjectRecipe(recipe, part: part, state: strip && hovering ? "hover" : nil, in: shape).opacity(isDown || group != nil ? Double.zero : .one)
                    Color.clear.metalObjectRecipe(recipe, part: part, state: "pressed", in: shape).opacity(isDown ? Double.one : .zero)
                    if cap == .destructive || cap == .stripDanger {
                        Color.clear.metalObjectRecipe(recipe, part: "hold", in: shape)
                            .scaleEffect(x: holding ? Double.one : .zero, anchor: .leading)
                            .clipShape(shape)
                            .animation(holding ? .linear(duration: recipe.durationSeconds("hold.duration")) : MetalSpringClass.release.spring.animation, value: holding)
                    }
                }
                // A color change, not motion: it stays under Reduce Motion, like the CSS .18s.
                .animation(.easeInOut(duration: Measurement(value: MetalButtonMetrics.fadeMs, unit: UnitDuration.milliseconds).converted(to: .seconds).value), value: isDown)
            }
            .overlay {
                if (isFocused || focused) && isEnabled {
                    shape
                        .inset(by: group != nil ? recipe.points("self.focus-width") / 2 : -(recipe.points("self.focus-offset") + recipe.points("self.focus-width") / 2))
                        .stroke(MetalShared.focus.color, lineWidth: recipe.points("self.focus-width"))
                }
            }
            .offset(y: depth)
            // Latching caps share this material, but travel past the catch before resting on it.
            .animation(travel, value: depth)
            .opacity(isEnabled ? Double.one : recipe.scalar("self.disabled"))
            .anchorPreference(key: MetalButtonGroupAnchors.self, value: .bounds) { group == nil ? [:] : [segmentID: $0] }
            .onChange(of: isDown) { _, down in group?.pressed(segmentID, down) }
    }

    private func foreground(_ tokens: MetalColorwayTokens) -> Color {
        switch cap {
        case .standard: return (size == .compact && !hovering ? tokens.ink2 : tokens.ink).color
        case .primary: return (MetalRecipes.button.color("primary.ink", colorway: MetalRecipeColorway(colorway)) ?? MetalCaps.primary.ink).color
        case .strip: return (MetalRecipes.button.color(hovering ? "strip.ink-hover" : "strip.ink") ?? tokens.ink).color
        case .stripDanger: return (MetalRecipes.button.color("strip-danger.ink") ?? MetalCaps.destructive.ink).color
        case .destructive: return (MetalRecipes.button.color("destructive.ink") ?? MetalCaps.destructive.ink).color
        }
    }
}

/// A pill text button with a press-in cap.
///
///     MetalButton("New Canvas", cap: .primary) { create() }
///     MetalButton("seed a sample day", size: .compact) { seed() }
public struct MetalButton<Icon: View>: View {
    private let title: String
    private let cap: MetalButtonCap
    private let size: MetalButtonSize
    private let icon: Icon?
    private let hold: Bool
    private let iconOnly: Bool
    private let state: MetalButtonState?
    private let waitingLabel: String
    private let doneLabel: String
    private let errorLabel: String
    @State private var face: MetalButtonState = .idle
    @State private var visibleAt: ContinuousClock.Instant?
    @MetalMotionPreference private var reduceMotion
    @State private var holding = false
    @State private var keyboardHold: Task<Void, Never>?
    @State private var keyboardPressed = false
    @State private var holdConfirmed = false
    @FocusState private var focused: Bool
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.metalButtonGroup) private var group
    @Environment(\.isEnabled) private var isEnabled
    private let action: () -> Void

    public init(_ title: String, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, hold: Bool = false, iconOnly: Bool = false, state: MetalButtonState? = nil, waitingLabel: String = "Working…", doneLabel: String = "Done", errorLabel: String = "Try again", action: @escaping () -> Void) where Icon == EmptyView {
        self.title = title
        self.cap = cap
        self.size = size
        self.hold = hold
        self.iconOnly = iconOnly
        self.state = state
        self.waitingLabel = waitingLabel
        self.doneLabel = doneLabel
        self.errorLabel = errorLabel
        self.icon = nil
        self.action = action
    }

    /// A button with a leading icon (16 pt; 14 compact), such as a MetalUI glyph or an SF Symbol.
    public init(_ title: String, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, hold: Bool = false, iconOnly: Bool = false, state: MetalButtonState? = nil, waitingLabel: String = "Working…", doneLabel: String = "Done", errorLabel: String = "Try again", action: @escaping () -> Void, @ViewBuilder icon: () -> Icon) {
        self.title = title
        self.cap = cap
        self.size = size
        self.hold = hold
        self.iconOnly = iconOnly
        self.state = state
        self.waitingLabel = waitingLabel
        self.doneLabel = doneLabel
        self.errorLabel = errorLabel
        self.icon = icon()
        self.action = action
    }

    public var body: some View {
        let cap = group?.cap ?? self.cap
        let size = group?.size ?? self.size
        let compact = size == .compact || cap == .strip || cap == .stripDanger
        let recipe = MetalRecipes.button
        let glyph = recipe.points(compact ? "compact.glyph" : "self.glyph")
        let needsHold = hold && (cap == .destructive || cap == .stripDanger)
        Button(action: { if !needsHold && !blocked { action() } }) {
            HStack(spacing: recipe.points(compact ? "compact.gap" : "self.gap")) {
                if state != nil {
                    ZStack {
                        if let icon { icon.opacity(face == .waiting ? Double.zero : .one) }
                        if face == .waiting { MetalButtonWaitArc() }
                    }.frame(width: glyph, height: glyph)
                    if !iconOnly { ZStack {
                        Text(title).hidden()
                        Text(waitingLabel).hidden()
                        Text(doneLabel).hidden()
                        Text(errorLabel).hidden()
                        Text(faceLabel).id(faceLabel)
                            .transition(reduceMotion ? .opacity : .asymmetric(insertion: .offset(y: MetalSpace.s4).combined(with: .opacity), removal: .offset(y: -MetalSpace.s4).combined(with: .opacity)))
                    }.id(reduceMotion).clipped().metalAnimation(.settle, value: faceLabel)
                        .transaction { transaction in
                            if reduceMotion { transaction.animation = nil; transaction.disablesAnimations = true }
                        } }
                } else {
                    if let icon { icon.frame(width: glyph, height: glyph) }
                    if !iconOnly { Text(title) }
                }
            }
        }
        .buttonStyle(MetalButtonStyle(cap: cap, size: size))
        .environment(\.metalButtonFace, face)
        .environment(\.metalButtonHolding, holding)
        .environment(\.metalButtonKeyboardPressed, keyboardPressed)
        .environment(\.metalButtonFocused, focused)
        .environment(\.metalButtonWaiting, face == .waiting)
        .environment(\.metalButtonIconOnly, iconOnly)
        .environment(\.metalButtonHoldEnabled, needsHold)
        .modifier(MetalButtonLongPress(enabled: needsHold && isEnabled && !blocked,
            duration: recipe.durationSeconds("hold.duration"), distance: recipe.points("self.height"),
            pressing: { pressed in
                guard keyboardHold == nil else { return }
                if pressed { holdConfirmed = false }
                holding = pressed
            }, perform: {
                guard scenePhase == .active && !blocked && keyboardHold == nil && !holdConfirmed else { return }
                holdConfirmed = true
                holding = false
                action()
            }))
        .focusable(isEnabled)
        .focused($focused)
        .onChange(of: focused) { _, focused in if !focused { cancelPress() } }
        .onChange(of: isEnabled) { _, enabled in if !enabled { cancelPress() } }
        .onChange(of: scenePhase) { _, phase in if phase != .active { cancelPress() } }
        .onKeyPress(keys: [.space, .return], phases: [.down, .repeat, .up]) { key in
            guard isEnabled && !blocked else { cancelPress(); return .handled }
            if !needsHold {
                if key.phase == .down { keyboardPressed = true }
                else if key.phase == .up {
                    let activate = keyboardPressed
                    keyboardPressed = false
                    if activate { action() }
                }
                return .handled
            }
            if key.phase == .down {
                guard !holding else { return .handled }
                holdConfirmed = false
                holding = true
                keyboardHold?.cancel()
                keyboardHold = Task { @MainActor in
                    try? await Task.sleep(for: .seconds(recipe.durationSeconds("hold.duration")))
                    guard !Task.isCancelled && !holdConfirmed else { return }
                    holdConfirmed = true
                    holding = false
                    action()
                }
            } else if key.phase == .up, keyboardHold != nil {
                keyboardHold?.cancel()
                keyboardHold = nil
                holding = false
                holdConfirmed = true
            }
            return .handled
        }
        .onKeyPress(.escape) {
            cancelPress()
            return .ignored
        }
        .onDisappear { cancelPress() }
        .focusEffectDisabled()
        .accessibilityLabel(faceLabel)
        .accessibilityValue(state == .waiting ? waitingLabel : "")
        .task(id: state) { await updateFace() }
        .onChange(of: state) { _, _ in if blocked { cancelPress() } }
        .accessibilityHint(needsHold ? "Hold to confirm" : "")
        .accessibilityAction(named: "Confirm") { if needsHold && isEnabled && !blocked { cancelPress(); action() } }
    }

    private func cancelPress() {
        keyboardHold?.cancel()
        keyboardHold = nil
        keyboardPressed = false
        holding = false
        holdConfirmed = true
    }

    private var blocked: Bool { state == .waiting || state == .done || face == .waiting }
    private var faceLabel: String { face == .waiting ? waitingLabel : face == .done ? doneLabel : face == .error ? errorLabel : title }

    @MainActor private func updateFace() async {
        if state == .waiting {
            guard visibleAt == nil else { return }
            face = .idle
            try? await Task.sleep(for: .seconds(MetalWaiting.showDelay))
            guard !Task.isCancelled else { return }
            visibleAt = .now
            face = .waiting
        } else {
            if state != .idle && state != nil, let visibleAt {
                let minimum = Duration.seconds(MetalWaiting.minimumVisible)
                let elapsed = visibleAt.duration(to: .now)
                if elapsed < minimum { try? await Task.sleep(for: minimum - elapsed) }
            }
            guard !Task.isCancelled else { return }
            visibleAt = nil
            face = state ?? .idle
        }
    }
}

extension MetalButton where Icon == MetalIcon {
    /// An action that names itself with a glyph and a verb: the MetalUI glyph leads the label,
    /// sized by the cap (16 pt; 14 compact), and plays its act when the button is hovered or pressed.
    ///
    ///     MetalButton("Share", icon: .share) { share() }
    public init(_ title: String, icon: MetalIconName, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, hold: Bool = false, iconOnly: Bool = false, state: MetalButtonState? = nil, waitingLabel: String = "Working…", doneLabel: String = "Done", errorLabel: String = "Try again", action: @escaping () -> Void) {
        let glyph = MetalRecipes.button.points(size == .compact || cap == .strip || cap == .stripDanger ? "compact.glyph" : "self.glyph")
        self.init(title, cap: cap, size: size, hold: hold, iconOnly: iconOnly, state: state, waitingLabel: waitingLabel, doneLabel: doneLabel, errorLabel: errorLabel, action: action) { MetalIcon(icon, size: glyph) }
    }
}

private struct MetalButtonHoldingKey: EnvironmentKey { static let defaultValue = false }
private extension EnvironmentValues {
    var metalButtonHolding: Bool {
        get { self[MetalButtonHoldingKey.self] }
        set { self[MetalButtonHoldingKey.self] = newValue }
    }
}

private struct MetalButtonHoldEnabledKey: EnvironmentKey { static let defaultValue = false }
private extension EnvironmentValues {
    var metalButtonHoldEnabled: Bool {
        get { self[MetalButtonHoldEnabledKey.self] }
        set { self[MetalButtonHoldEnabledKey.self] = newValue }
    }
}

private struct MetalButtonLongPress: ViewModifier {
    let enabled: Bool
    let duration: Double
    let distance: Double
    let pressing: (Bool) -> Void
    let perform: () -> Void

    @ViewBuilder func body(content: Content) -> some View {
        if enabled {
            content.onLongPressGesture(minimumDuration: duration, maximumDistance: distance, pressing: pressing, perform: perform)
        } else {
            content
        }
    }
}


private struct MetalButtonWaitingKey: EnvironmentKey { static let defaultValue = false }
private extension EnvironmentValues {
    var metalButtonWaiting: Bool {
        get { self[MetalButtonWaitingKey.self] }
        set { self[MetalButtonWaitingKey.self] = newValue }
    }
}

// This clock exists only in a visible waiting glyph slot. Reduce Motion uses a still arc.
private struct MetalButtonWaitArc: View {
    @MetalMotionPreference private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var visible = false
    private let started = Date()
    var body: some View {
        let recipe = MetalRecipes.spinner
        let inset = recipe.points("self.ring") / 2
        TimelineView(.animation(paused: reduceMotion || scenePhase != .active || !visible)) { context in
            Circle().trim(from: 1 - recipe.scalar("self.tail"), to: 1)
                .stroke(style: StrokeStyle(lineWidth: recipe.points("self.ring"), lineCap: .butt))
                .rotationEffect(.degrees(reduceMotion ? 0 : context.date.timeIntervalSince(started) / recipe.durationSeconds("self.turn") * 360))
                .padding(inset)
        }
        .accessibilityHidden(true)
        .onAppear { visible = true }
        .onDisappear { visible = false }
    }
}

private struct MetalButtonIconOnlyKey: EnvironmentKey { static let defaultValue = false }
private extension EnvironmentValues {
    var metalButtonIconOnly: Bool {
        get { self[MetalButtonIconOnlyKey.self] }
        set { self[MetalButtonIconOnlyKey.self] = newValue }
    }
}

private struct MetalButtonFaceKey: EnvironmentKey { static let defaultValue = MetalButtonState.idle }
extension EnvironmentValues {
    var metalButtonFace: MetalButtonState {
        get { self[MetalButtonFaceKey.self] }
        set { self[MetalButtonFaceKey.self] = newValue }
    }
}

private struct MetalButtonKeyboardPressedKey: EnvironmentKey { static let defaultValue = false }
private extension EnvironmentValues {
    var metalButtonKeyboardPressed: Bool {
        get { self[MetalButtonKeyboardPressedKey.self] }
        set { self[MetalButtonKeyboardPressedKey.self] = newValue }
    }
}

private struct MetalButtonFocusedKey: EnvironmentKey { static let defaultValue = false }
private extension EnvironmentValues {
    var metalButtonFocused: Bool {
        get { self[MetalButtonFocusedKey.self] }
        set { self[MetalButtonFocusedKey.self] = newValue }
    }
}
