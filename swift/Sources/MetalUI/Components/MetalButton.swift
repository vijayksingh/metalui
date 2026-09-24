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

    public init(cap: MetalButtonCap = .standard) {
        self.cap = cap
    }

    public func makeBody(configuration: Configuration) -> some View {
        MetalButtonBody(configuration: configuration, cap: cap)
    }
}

enum MetalButtonMetrics {
    static let height: CGFloat = 32
    static let horizontalPadding: CGFloat = 15
    static let iconGap: CGFloat = 6
    static let fontSize: CGFloat = 12.5
    /// -0.005em.
    static let tracking: CGFloat = -0.005 * 12.5
    static let pressTravel: CGFloat = 1
    static let disabledOpacity = 0.4
    static let focusWidth: CGFloat = 2
    static let focusOffset: CGFloat = 2
    /// CSS `box-shadow .18s, background .18s`.
    static let fade = Animation.easeInOut(duration: 0.18)
}

private struct MetalButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let cap: MetalButtonCap

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let isDown = isEnabled && configuration.isPressed
        let shape = Capsule(style: .continuous)
        let recipes = recipes(for: colorway.tokens)

        configuration.label
            .font(.system(size: MetalButtonMetrics.fontSize, weight: .medium))
            .tracking(MetalButtonMetrics.tracking)
            .lineLimit(1)
            .foregroundStyle(foreground(colorway.tokens))
            .padding(.horizontal, MetalButtonMetrics.horizontalPadding)
            .frame(height: MetalButtonMetrics.height)
            .contentShape(shape)
            .background {
                ZStack {
                    Color.clear.metalRecipe(recipes.up, in: shape).opacity(isDown ? 0 : 1)
                    Color.clear.metalRecipe(recipes.down, in: shape).opacity(isDown ? 1 : 0)
                }
                .animation(reduceMotion ? nil : MetalButtonMetrics.fade, value: isDown)
            }
            .overlay {
                if isFocused && isEnabled {
                    shape
                        .inset(by: -(MetalButtonMetrics.focusOffset + MetalButtonMetrics.focusWidth / 2))
                        .stroke(MetalShared.focus.color, lineWidth: MetalButtonMetrics.focusWidth)
                }
            }
            .offset(y: isDown ? MetalButtonMetrics.pressTravel : 0)
            // Press travel is feedback and stays under Reduce Motion; the spring does not.
            .animation(reduceMotion ? nil : MetalSprings.release.animation, value: isDown)
            .opacity(isEnabled ? 1 : MetalButtonMetrics.disabledOpacity)
    }

    private func recipes(for tokens: MetalColorwayTokens) -> (up: MetalRecipe, down: MetalRecipe) {
        switch cap {
        case .standard:
            return (MetalRecipe(fill: tokens.btnBg, shadows: tokens.btnSh),
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
        case .standard: return tokens.ink.color
        case .primary: return MetalCaps.primary.ink.color
        case .destructive: return MetalCaps.destructive.ink.color
        }
    }
}

/// A pill text button with a press-in cap.
///
///     MetalButton("New Canvas", cap: .primary) { create() }
public struct MetalButton<Icon: View>: View {
    private let title: String
    private let cap: MetalButtonCap
    private let icon: Icon
    private let action: () -> Void

    public init(_ title: String, cap: MetalButtonCap = .standard, action: @escaping () -> Void) where Icon == EmptyView {
        self.title = title
        self.cap = cap
        self.icon = EmptyView()
        self.action = action
    }

    /// A button with a leading icon (16 pt), such as a MetalUI glyph or an SF Symbol.
    public init(_ title: String, cap: MetalButtonCap = .standard, action: @escaping () -> Void, @ViewBuilder icon: () -> Icon) {
        self.title = title
        self.cap = cap
        self.icon = icon()
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: MetalButtonMetrics.iconGap) {
                icon.frame(width: 16, height: 16)
                Text(title)
            }
        }
        .buttonStyle(MetalButtonStyle(cap: cap))
        .focusEffectDisabled()
        .accessibilityLabel(title)
    }
}
