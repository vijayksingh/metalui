import SwiftUI

// KAMUI-15 · Button. Mirrors components/button/button.css: a 32 pt pill cap
// that sinks 1 pt into a well while held and springs back on release.

/// Which cap a button wears. `standard` is soft-touch in the colorway,
/// `primary` is the dark cap, `destructive` the one red cap.
public enum MetalButtonCap: Sendable {
    case standard
    case primary
    case destructive
}

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

/// Which size a button is: 32, or compact 28 (the medium's pills).
public enum MetalButtonSize: Sendable {
    case `default`
    case compact
}

private struct MetalButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let cap: MetalButtonCap
    let size: MetalButtonSize

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    var body: some View {
        let isDown = isEnabled && configuration.isPressed
        let shape = Capsule(style: .continuous)
        let recipes = recipes(for: colorway.tokens)
        let compact = size == .compact

        configuration.label
            // The button is its icons' trigger: a MetalIcon inside plays its hover pose and press.
            .metalIconInteraction(MetalIconInteraction(isHovered: hovering && isEnabled, isPressed: isDown))
            .metalType(MetalType.ui, scale: compact ? MetalButtonMetrics.compactSize / MetalType.ui.size : 1)
            .lineLimit(1)
            // A button is as wide as its label: it never truncates it.
            .fixedSize(horizontal: true, vertical: false)
            .foregroundStyle(foreground(colorway.tokens))
            .padding(.horizontal, compact ? MetalButtonMetrics.compactPad : MetalButtonMetrics.pad)
            .frame(height: compact ? MetalButtonMetrics.compactHeight : MetalButtonMetrics.height)
            .contentShape(shape)
            .onHover { hovering = $0 }
            .background {
                ZStack {
                    Color.clear.metalRecipe(recipes.up, in: shape).opacity(isDown ? 0 : 1)
                    Color.clear.metalRecipe(recipes.down, in: shape).opacity(isDown ? 1 : 0)
                }
                // A color change, not motion: it stays under Reduce Motion, like the CSS .18s.
                .animation(.easeInOut(duration: MetalButtonMetrics.fadeMs / 1000), value: isDown)
            }
            .overlay {
                if isFocused && isEnabled {
                    shape
                        .inset(by: -(MetalButtonMetrics.focusOffset + MetalButtonMetrics.focusWidth / 2))
                        .stroke(MetalShared.focus.color, lineWidth: MetalButtonMetrics.focusWidth)
                }
            }
            .offset(y: isDown ? MetalButtonMetrics.travel : 0)
            // The press rides release, which Reduce Motion keeps unchanged (MetalMotion).
            .metalAnimation(.release, value: isDown)
            .opacity(isEnabled ? 1 : MetalButtonMetrics.disabled)
    }

    private func recipes(for tokens: MetalColorwayTokens) -> (up: MetalRecipe, down: MetalRecipe) {
        switch cap {
        case .standard:
            return (MetalRecipe(fill: tokens.btnBg, shadows: size == .compact ? tokens.raiseSm : tokens.btnSh),
                    MetalRecipe(fill: tokens.pressedBg, shadows: tokens.pressedSh))
        case .primary:
            let c = MetalCaps.primary
            return (MetalRecipe(fill: c.bg, shadows: c.sh), MetalRecipe(fill: c.pressedBg, shadows: c.pressedSh))
        case .destructive:
            let c = MetalCaps.destructive
            return (MetalRecipe(fill: c.bg, shadows: c.sh), MetalRecipe(fill: c.pressedBg, shadows: c.pressedSh))
        }
    }

    private func foreground(_ tokens: MetalColorwayTokens) -> Color {
        switch cap {
        case .standard: return (size == .compact && !hovering ? tokens.ink2 : tokens.ink).color
        case .primary: return MetalCaps.primary.ink.color
        case .destructive: return MetalCaps.destructive.ink.color
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
    private let action: () -> Void

    public init(_ title: String, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, action: @escaping () -> Void) where Icon == EmptyView {
        self.title = title
        self.cap = cap
        self.size = size
        self.icon = nil
        self.action = action
    }

    /// A button with a leading icon (16 pt; 14 compact), such as a MetalUI glyph or an SF Symbol.
    public init(_ title: String, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, action: @escaping () -> Void, @ViewBuilder icon: () -> Icon) {
        self.title = title
        self.cap = cap
        self.size = size
        self.icon = icon()
        self.action = action
    }

    public var body: some View {
        let compact = size == .compact
        let glyph = compact ? MetalButtonMetrics.compactGlyph : MetalButtonMetrics.glyph
        Button(action: action) {
            HStack(spacing: compact ? MetalButtonMetrics.compactGap : MetalButtonMetrics.gap) {
                if let icon { icon.frame(width: glyph, height: glyph) }
                Text(title)
            }
        }
        .buttonStyle(MetalButtonStyle(cap: cap, size: size))
        .focusEffectDisabled()
        .accessibilityLabel(title)
    }
}
