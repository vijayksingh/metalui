import SwiftUI

// Toolbar and tool button (object sheet). Mirrors components/toolbar from MetalToolbarMetrics.

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
        let r = MetalRecipes.toolbar
        Group {
            if variant == .graphite {
                // The graphite dock: every value is the toolbar recipe (the reference's #toolbar).
                HStack(spacing: r.points("self.gap")) { content }
                    .padding(r.points("self.pad"))
                    .fixedSize()
                    .metalObjectRecipe(r, part: "self", in: RoundedRectangle(cornerRadius: r.points("self.radius"), style: .continuous))
            } else {
                HStack(spacing: MetalToolbarMetrics.gap) { content }
                    .padding(MetalToolbarMetrics.pad)
                    .fixedSize()
                    .metalFrost(.strip, in: RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous))
            }
        }
            .environment(\.metalToolbarVariant, variant == .graphite)
            .opacity(arrived ? .one : .zero)
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
    let iconView: AnyView
    let latched: Bool
    let action: () -> Void

    public init(_ label: String, icon: MetalIconName, shortcut: KeyEquivalent? = nil, latched: Bool = false, action: @escaping () -> Void) {
        self.label = label
        self.iconView = AnyView(MetalIcon(icon, size: MetalToolbarMetrics.glyph))
        self.shortcut = shortcut
        self.latched = latched
        self.action = action
    }

    /// A tool with authored icon motion supplied by its caller.
    public init<IconContent: View>(_ label: String, shortcut: KeyEquivalent? = nil, latched: Bool = false,
                                   @ViewBuilder icon: () -> IconContent, action: @escaping () -> Void) {
        self.label = label
        self.iconView = AnyView(icon())
        self.shortcut = shortcut
        self.latched = latched
        self.action = action
    }

    public var body: some View {
        let button = Button(action: action) { iconView }
            .buttonStyle(MetalToolButtonStyle(latched: latched))
            .metalTooltip(label, shortcut: shortcut.map { String($0.character).uppercased() })
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
        if graphite {
            let r = MetalRecipes.toolbar
            let size = r.points("tool.size")
            let ledSize = r.points("led.size")
            let ink = r.color("tool.ink") ?? t.icon
            return AnyView(configuration.label
                .foregroundStyle(ink.color)
                .metalIconInteraction(MetalIconInteraction(isHovered: hovering, isPressed: configuration.isPressed))
                .frame(width: size, height: size)
                .metalObjectRecipe(r, part: "tool", state: down ? "pressed" : nil,
                                   in: RoundedRectangle(cornerRadius: r.points("tool.radius"), style: .continuous))
                .overlay(alignment: .topTrailing) {
                    if latched {
                        Color.clear.frame(width: ledSize, height: ledSize)
                            .metalObjectRecipe(r, part: "led", in: Circle())
                            .padding(r.points("led.inset"))
                    }
                }
                .offset(y: down ? (r.points("tool.press")) : 0)
                .contentShape(Rectangle())
                .onHover { hovering = $0 }
                .opacity(isEnabled ? .one : MetalRecipes.button.scalar("self.disabled"))
                .metalAnimation(.release, value: configuration.isPressed))
        }
        let recipe: MetalRecipe = down ? MetalRecipe(fill: t.pressedBg, shadows: t.pressedSh) : MetalRecipe(fill: t.btnBg, shadows: t.btnSh)
        let ink: MetalRGBA = down || hovering ? t.ink : t.icon
        return AnyView(configuration.label
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
            .opacity(isEnabled ? .one : MetalRecipes.button.scalar("self.disabled"))
            .metalAnimation(.release, value: configuration.isPressed))
    }
}

/// An engraved rule between groups of tools.
public struct MetalToolbarSeparator: View {
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalToolbarVariant) private var graphite
    public init() {}
    public var body: some View {
        let t = colorway.tokens
        if graphite {
            let r = MetalRecipes.toolbar
            Color.clear
                .frame(width: r.points("sep.width"), height: r.points("sep.height"))
                .metalObjectRecipe(r, part: "sep", in: Rectangle())
                .padding(.horizontal, r.points("sep.margin"))
                .accessibilityHidden(true)
        } else {
        let r = MetalRecipes.toolbar
        Rectangle().fill(t.rule.color)
            .frame(width: r.points("sep.width"), height: MetalToolbarMetrics.sepHeight)
            .overlay(alignment: .trailing) { Rectangle().fill(t.ruleLip.color).frame(width: r.points("sep.width")).offset(x: r.points("sep.width")) }
            .padding(.horizontal, r.points("sep.margin"))
            .accessibilityHidden(true)
        }
    }
}

/// The search well in the strip: a sunk field that opens the palette, with its keycap.
public struct MetalToolbarSearch: View {
    let placeholder: String
    let shortcut: String
    let onOpen: () -> Void
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalToolbarVariant) private var graphite

    public init(_ placeholder: String = "Search or ask", shortcut: String = "⌘K", onOpen: @escaping () -> Void) {
        self.placeholder = placeholder
        self.shortcut = shortcut
        self.onOpen = onOpen
    }

    public var body: some View {
        let r = MetalRecipes.toolbar
        let role = r.typeRole("search.font")
        let glyph = r.points("search.glyph")
        Button(action: onOpen) {
            HStack(spacing: r.points("search.gap")) {
                MetalIcon(.search, size: glyph)
                Text(placeholder).font(.metal(role))
                Spacer(minLength: 0)
                MetalKbd(shortcut, size: .small, surface: .strip)
            }
            .foregroundStyle((r.color("search.ink") ?? colorway.tokens.ink3).color)
            .padding(.leading, r.points("search.pad-left"))
            .padding(.trailing, r.points("search.pad-right"))
            .frame(minWidth: r.points("search.min-width"), minHeight: r.points("search.height"),
                   maxHeight: r.points("search.height"))
            .metalObjectRecipe(r, part: "search", in: RoundedRectangle(cornerRadius: r.points("search.radius"), style: .continuous))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .fixedSize()
        .accessibilityLabel(placeholder)
        .keyboardShortcut("k", modifiers: .command)
    }
}
