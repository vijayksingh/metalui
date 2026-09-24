import SwiftUI

// Menu and the correction popover, painted from the generated menu recipe.
// A native `.contextMenu` cannot take this material, so the panel is drawn here and
// the host presents it: `.metalMenu(isPresented:at:…)` over a SwiftUI view, or an AppKit canvas
// shows `MetalMenuPanel` at the right-click point from its own input controller.

/// One row, or a separator.
public struct MetalMenuItem: Identifiable {
    public let id: String
    let label: String
    let icon: MetalIconName?
    let shortcut: String?
    let danger: Bool
    let disabled: Bool
    let action: (() -> Void)?

    /// A 30 row.
    public init(_ label: String, icon: MetalIconName? = nil, shortcut: String? = nil, danger: Bool = false, disabled: Bool = false, action: @escaping () -> Void) {
        self.id = label
        self.label = label
        self.icon = icon
        self.shortcut = shortcut
        self.danger = danger
        self.disabled = disabled
        self.action = action
    }

    private init(separator id: String) {
        self.id = id
        label = ""
        icon = nil
        shortcut = nil
        danger = false
        disabled = true
        action = nil
    }

    /// An engraved rule between groups of rows.
    public static var separator: MetalMenuItem { MetalMenuItem(separator: "separator") }

    var isSeparator: Bool { action == nil }
}

/// The plate: an optional engraved heading, rows that share one highlight for pointer and keyboard,
/// ↑ ↓ to move, ↩ to choose, ⎋ to close.
public struct MetalMenuPanel: View {
    let heading: String?
    let items: [MetalMenuItem]
    let onClose: () -> Void

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @State private var highlighted: Int?
    @FocusState private var focused: Bool

    public init(heading: String? = nil, items: [MetalMenuItem], onClose: @escaping () -> Void) {
        self.heading = heading
        self.items = items
        self.onClose = onClose
    }

    private var choosable: [Int] { items.indices.filter { !items[$0].isSeparator && !items[$0].disabled } }

    public var body: some View {
        let recipe = MetalRecipes.menu
        let t = colorway.tokens
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        VStack(alignment: .leading, spacing: 0) {
            if let heading {
                MetalLabel(heading, style: .engraved)
                    .padding(.top, recipe.points("heading.pad-top"))
                    .padding(.horizontal, recipe.points("heading.pad-x"))
                    .padding(.bottom, recipe.points("heading.pad-bottom"))
                    .accessibilityAddTraits(.isHeader)
            }
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                if item.isSeparator {
                    Color.clear
                        .frame(height: recipe.points("sep.thickness"))
                        .metalObjectRecipe(recipe, part: "sep", in: Rectangle())
                        .padding(.vertical, recipe.points("sep.inset-y"))
                        .padding(.horizontal, recipe.points("sep.inset-x"))
                        .accessibilityHidden(true)
                } else {
                    row(item, index: index, recipe)
                }
            }
        }
        .padding(recipe.points("self.pad"))
        .frame(minWidth: recipe.points("self.min-width"), alignment: .leading)
        .fixedSize()
        .metalObjectRecipe(recipe, part: "self", in: shape)
        .background {
            if reduceTransparency {
                shape.fill(t.frostOpaque.color)
            } else {
                MetalBackdropView(backdrop: MetalBackdrop(
                    blur: recipe.filterNumber("self.blur", function: "blur") ?? .zero,
                    saturation: recipe.filterNumber("self.blur", function: "saturate") ?? .one,
                    dark: colorway == .graphite))
                    .clipShape(shape)
            }
        }
        .focusable()
        .focusEffectDisabled()
        .focused($focused)
        .onAppear { focused = true }
        // A click elsewhere takes focus: the menu closes, nothing runs.
        .onChange(of: focused) { _, now in if !now { onClose() } }
        .onKeyPress(.downArrow) { move(1); return .handled }
        .onKeyPress(.upArrow) { move(-1); return .handled }
        .onKeyPress(.return) { choose(highlighted); return .handled }
        .onKeyPress(.escape) { onClose(); return .handled }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(heading ?? "Menu")
    }

    private func move(_ by: Int) {
        let rows = choosable
        guard !rows.isEmpty else { return }
        guard let current = highlighted, let at = rows.firstIndex(of: current) else {
            highlighted = by > 0 ? rows.first : rows.last
            return
        }
        highlighted = rows[min(max(at + by, 0), rows.count - 1)]
    }

    private func choose(_ index: Int?) {
        guard let index, items.indices.contains(index), !items[index].disabled, let action = items[index].action else { return }
        onClose()
        action()
    }

    private func row(_ item: MetalMenuItem, index: Int, _ recipe: MetalObjectRecipe) -> some View {
        let t = colorway.tokens
        let ink = item.danger ? MetalShared.red : t.ink
        let on = highlighted == index
        return HStack(spacing: recipe.points("row.gap")) {
            if let icon = item.icon {
                MetalIcon(icon, size: recipe.points("row.glyph"))
                    .foregroundStyle((item.danger ? MetalShared.red : t.ink2).color)
            }
            Text(item.label)
                .font(recipe.font("row.font"))
                .tracking(recipe.tracking("row.tracking", size: recipe.fontSize("row.font")))
                .foregroundColor(ink.color).lineLimit(1)
            Spacer(minLength: recipe.points("row.key-gap"))
            if let key = item.shortcut { MetalKbd(key, size: .small) }
        }
        .padding(.horizontal, recipe.points("row.pad"))
        .frame(height: recipe.points("row.height"))
        .background {
            if on {
                Color.clear.metalObjectRecipe(recipe, part: "row", state: "hover",
                    in: RoundedRectangle(cornerRadius: recipe.points("row.radius"), style: .continuous))
            }
        }
        .contentShape(Rectangle())
        .metalIconInteraction(MetalIconInteraction(isHovered: on, isPressed: false))
        .opacity(item.disabled ? recipe.scalar("row.disabled") : .one)
        .onHover { hovering in
            guard !item.disabled else { return }
            if hovering { highlighted = index } else if highlighted == index { highlighted = nil }
        }
        .onTapGesture { choose(index) }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { choose(index) }
    }
}

extension View {
    /// Presents a menu over this view: at `point` (a right-click, in this view's space), or 6 below its
    /// leading edge. It fades in on settle and out on release; a click elsewhere (focus leaving) closes it.
    ///
    ///     cue.metalMenu(isPresented: $correcting, at: clickPoint, heading: "NOTE · TASK BY RECOGNIZER 0.82", items: [
    ///         MetalMenuItem("Not a Task") { correct(.task(false)) },
    ///         .separator,
    ///         MetalMenuItem("Gather Similar", icon: .search) { gather() },
    ///     ])
    public func metalMenu(isPresented: Binding<Bool>, at point: CGPoint? = nil, heading: String? = nil, items: [MetalMenuItem]) -> some View {
        modifier(MetalMenuPresenter(isPresented: isPresented, point: point, heading: heading, items: items))
    }
}

private struct MetalMenuPresenter: ViewModifier {
    @Binding var isPresented: Bool
    let point: CGPoint?
    let heading: String?
    let items: [MetalMenuItem]

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .topLeading) {
                GeometryReader { geo in
                    if isPresented {
                        MetalMenuPanel(heading: heading, items: items) { isPresented = false }
                            .offset(x: point?.x ?? 0, y: point?.y ?? geo.size.height + MetalMenuMetrics.offset)
                            .transition(.opacity)
                    }
                }
            }
            .zIndex(isPresented ? 1 : 0)
            .metalAnimation(isPresented ? .settle : .release, value: isPresented)
    }
}
