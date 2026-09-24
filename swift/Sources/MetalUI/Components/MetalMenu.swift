import SwiftUI

// Menu and the correction popover (Kamui 03 §5, 04 §8, §18). Mirrors components/menu from
// MetalMenuMetrics. A native `.contextMenu` cannot take this material, so the panel is drawn here and
// the host presents it: `.metalMenu(isPresented:at:…)` over a SwiftUI view, or Kamui's AppKit canvas
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
    @State private var highlighted: Int?
    @FocusState private var focused: Bool

    public init(heading: String? = nil, items: [MetalMenuItem], onClose: @escaping () -> Void) {
        self.heading = heading
        self.items = items
        self.onClose = onClose
    }

    private var choosable: [Int] { items.indices.filter { !items[$0].isSeparator && !items[$0].disabled } }

    public var body: some View {
        let t = colorway.tokens
        VStack(alignment: .leading, spacing: 0) {
            if let heading {
                Text(heading.uppercased())
                    .font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints)
                    .foregroundColor(t.engrave.color)
                    .shadow(color: t.lip.color, radius: 0, x: 0, y: 0.5)
                    .padding(.top, MetalMenuMetrics.headingPadTop)
                    .padding(.horizontal, MetalMenuMetrics.headingPadX)
                    .padding(.bottom, MetalMenuMetrics.headingPadBottom)
                    .accessibilityAddTraits(.isHeader)
            }
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                if item.isSeparator {
                    VStack(spacing: 0) { Rectangle().fill(t.rule.color).frame(height: 1); Rectangle().fill(t.ruleLip.color).frame(height: 1) }
                        .padding(.vertical, MetalMenuMetrics.sepInsetY)
                        .padding(.horizontal, MetalMenuMetrics.sepInsetX)
                        .accessibilityHidden(true)
                } else {
                    row(item, index: index, t)
                }
            }
        }
        .padding(MetalMenuMetrics.pad)
        .frame(minWidth: MetalMenuMetrics.minWidth, alignment: .leading)
        .fixedSize()
        .metalRecipe(MetalRecipe(fill: .solid(t.menuBg), shadows: t.raise, backdrop: MetalBackdrop(blur: MetalFrost.blur, saturation: MetalFrost.saturation, dark: colorway == .graphite), opaqueFill: .solid(t.frostOpaque), contrastEdge: t.contrastEdge),
                     in: RoundedRectangle(cornerRadius: MetalRadius.plate, style: .continuous))
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

    private func row(_ item: MetalMenuItem, index: Int, _ t: MetalColorwayTokens) -> some View {
        let ink = item.danger ? MetalShared.red : t.ink
        let on = highlighted == index
        return HStack(spacing: MetalMenuMetrics.rowGap) {
            if let icon = item.icon {
                MetalIcon(icon, size: MetalMenuMetrics.rowGlyph).foregroundStyle((item.danger ? MetalShared.red : t.ink2).color)
            }
            Text(item.label).font(.metal(MetalType.ui)).foregroundColor(ink.color).lineLimit(1)
            Spacer(minLength: 12)
            if let key = item.shortcut { MetalKbd(key, size: .small) }
        }
        .padding(.horizontal, MetalMenuMetrics.rowPad)
        .frame(height: MetalMenuMetrics.rowHeight)
        .background {
            if on { RoundedRectangle(cornerRadius: MetalRadius.row, style: .continuous).fill(t.menuRowHover.color) }
        }
        .contentShape(Rectangle())
        .metalIconInteraction(MetalIconInteraction(isHovered: on, isPressed: false))
        .opacity(item.disabled ? 0.4 : 1)
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
    ///     cue.metalMenu(isPresented: $correcting, at: clickPoint, heading: "NOTE · TASK BY JEV 0.82", items: [
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
