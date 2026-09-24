import SwiftUI

// Toolbar and tool button (KAMUI-01/02). Mirrors components/toolbar from MetalToolbarMetrics.

/// A strip of tools: 48 tall, a capsule; frost in the colorway or graphite.
public struct MetalToolbar<Content: View>: View {
    public enum Variant: Sendable { case frost, graphite }
    let variant: Variant
    let label: String
    let content: Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false

    public init(_ label: String, variant: Variant = .frost, @ViewBuilder content: () -> Content) {
        self.label = label
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        let travel = MetalMotion.resolve(.surface, reduceMotion: reduceMotion).allowsTravel
        HStack(spacing: MetalToolbarMetrics.gap) { content }
            .padding(MetalToolbarMetrics.pad)
            .fixedSize()
            .metalFrost(variant == .graphite ? .graphite : .strip, in: RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous))
            .environment(\.metalToolbarVariant, variant == .graphite)
            .opacity(arrived ? 1 : 0)
            .offset(y: arrived || !travel ? 0 : MetalRadius.nest)
            .onAppear { withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true } }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
    }
}

private struct MetalToolbarGraphiteKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    var metalToolbarVariant: Bool {
        get { self[MetalToolbarGraphiteKey.self] }
        set { self[MetalToolbarGraphiteKey.self] = newValue }
    }
}

/// A circular 36 tool cap with a 16 glyph. Latched tools sit pressed with a 4 pt green LED.
public struct MetalToolButton: View {
    let label: String
    let shortcut: KeyEquivalent?
    let icon: MetalIconName
    let latched: Bool
    let action: () -> Void

    public init(_ label: String, icon: MetalIconName, shortcut: KeyEquivalent? = nil, latched: Bool = false, action: @escaping () -> Void) {
        self.label = label
        self.icon = icon
        self.shortcut = shortcut
        self.latched = latched
        self.action = action
    }

    public var body: some View {
        let button = Button(action: action) { MetalIcon(icon, size: MetalToolbarMetrics.glyph) }
            .buttonStyle(MetalToolButtonStyle(latched: latched))
            .help(shortcut.map { "\(label) · \(String($0.character).uppercased())" } ?? label)
            .accessibilityLabel(label)
            .accessibilityAddTraits(latched ? [.isSelected] : [])
        if let shortcut { button.keyboardShortcut(shortcut, modifiers: []) } else { button }
    }
}

private struct MetalToolButtonStyle: ButtonStyle {
    let latched: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalToolbarVariant) private var graphite
    @Environment(\.isEnabled) private var isEnabled
    @State private var hovering = false

    func makeBody(configuration: Configuration) -> some View {
        let t = colorway.tokens
        let down = latched || configuration.isPressed
        let recipe: MetalRecipe = graphite
            ? (down ? MetalRecipe(fill: MetalToolbarMetrics.graphitePressedBg, shadows: MetalToolbarMetrics.graphitePressedSh)
                    : MetalRecipe(fill: MetalToolbarMetrics.graphiteCapBg, shadows: MetalToolbarMetrics.graphiteCapSh))
            : (down ? MetalRecipe(fill: t.pressedBg, shadows: t.pressedSh) : MetalRecipe(fill: t.btnBg, shadows: t.btnSh))
        let ink: MetalRGBA = graphite ? (down || hovering ? MetalToolStripMetrics.inkHover : MetalToolbarMetrics.graphiteInk) : (down || hovering ? t.ink : t.icon)
        return configuration.label
            .foregroundStyle(ink.color)
            .metalIconInteraction(MetalIconInteraction(isHovered: hovering, isPressed: configuration.isPressed))
            .frame(width: MetalToolbarMetrics.tool, height: MetalToolbarMetrics.tool)
            .metalRecipe(recipe, in: Circle())
            .overlay(alignment: .topTrailing) {
                if latched {
                    MetalLED(.live, size: .small).padding(MetalToolbarMetrics.ledInset)
                }
            }
            .offset(y: down ? 1 : 0)
            .contentShape(Circle())
            .onHover { hovering = $0 }
            .opacity(isEnabled ? 1 : 0.4)
            .metalAnimation(.release, value: configuration.isPressed)
    }
}

/// An engraved rule between groups of tools.
public struct MetalToolbarSeparator: View {
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalToolbarVariant) private var graphite
    public init() {}
    public var body: some View {
        let t = colorway.tokens
        Rectangle().fill((graphite ? MetalToolStripMetrics.sep : t.rule).color)
            .frame(width: 1, height: MetalToolbarMetrics.sepHeight)
            .overlay(alignment: .trailing) { Rectangle().fill((graphite ? MetalToolStripMetrics.sepLip : t.ruleLip).color).frame(width: 1).offset(x: 1) }
            .padding(.horizontal, 3)
            .accessibilityHidden(true)
    }
}
