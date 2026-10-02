import SwiftUI

/// One selected object; the host keeps its data and transformed bounds.
public struct MetalToolStripSelection: Identifiable {
    public let id: String
    public let kind: String
    public init(_ id: String, kind: String) { self.id = id; self.kind = kind }
}

/// A selection action, optionally opening a menu of formats or destinations.
public struct MetalToolStripItem: Identifiable {
    public let id: String
    public let label: String
    public let icon: MetalIconName?
    public let destructive: Bool
    public let irreversible: Bool
    public let disabledReason: String?
    public let busy: Bool
    public let singleOnly: Bool
    public let shortcut: String?
    public let menu: [MetalMenuItem]
    public let action: () -> Void
    public init(_ label: String, id: String? = nil, icon: MetalIconName? = nil, destructive: Bool = false,
                irreversible: Bool = false, disabledReason: String? = nil, busy: Bool = false,
                singleOnly: Bool = false, shortcut: String? = nil, menu: [MetalMenuItem] = [], action: @escaping () -> Void) {
        self.id = id ?? label; self.label = label; self.icon = icon; self.destructive = destructive
        self.irreversible = irreversible; self.disabledReason = disabledReason; self.busy = busy
        self.singleOnly = singleOnly; self.shortcut = shortcut; self.menu = menu; self.action = action
    }
}

/// Catalog order stays stable; a mixed selection keeps only verbs supported by every kind.
public func metalVerbsFor(_ selection: [MetalToolStripSelection], sets: [String: [MetalToolStripItem]], order: [String]) -> [MetalToolStripItem] {
    guard !selection.isEmpty else { return [] }
    let kinds = Array(Set(selection.map(\.kind))).sorted()
    let catalog = order.compactMap { id in sets.values.lazy.compactMap { $0.first { $0.id == id } }.first }
    return catalog.compactMap { item in
        guard !item.singleOnly || selection.count == 1 else { return nil }
        let matches = kinds.compactMap { sets[$0]?.first { $0.id == item.id } }
        guard matches.count == kinds.count else { return nil }
        return MetalToolStripItem(item.label, id: item.id, icon: item.icon, destructive: item.destructive,
            irreversible: item.irreversible, disabledReason: matches.compactMap(\.disabledReason).first,
            busy: matches.contains { $0.busy }, singleOnly: item.singleOnly, shortcut: item.shortcut,
            menu: item.menu, action: item.action)
    }
}

private struct MetalToolStripSizeKey: PreferenceKey {
    static let defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) { value = nextValue() }
}

/// A graphite action strip. Supply parent-space bounds after every canvas pan or zoom.
public struct MetalToolStrip: View {
    let label: String
    let items: [MetalToolStripItem]
    let count: Int?
    let maxVisible: Int
    let anchor: CGRect?
    let viewport: CGRect?
    let entrance: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false
    @State private var size: CGSize = .zero
    @State private var backingScale: CGFloat = 1
    @Namespace private var keys
    @FocusState private var focusedKey: String?

    public init(label: String, items: [MetalToolStripItem], count: Int? = nil, maxVisible: Int = .max,
                anchor: CGRect? = nil, viewport: CGRect? = nil, entrance: Bool = true) {
        self.label = label; self.items = items; self.count = count; self.maxVisible = maxVisible
        self.anchor = anchor; self.viewport = viewport; self.entrance = entrance
    }
    public init(label: String, selection: [MetalToolStripSelection], sets: [String: [MetalToolStripItem]], order: [String],
                maxVisible: Int = .max, anchor: CGRect? = nil, viewport: CGRect? = nil, entrance: Bool = true) {
        self.init(label: label, items: metalVerbsFor(selection, sets: sets, order: order), count: selection.count,
                  maxVisible: maxVisible, anchor: anchor, viewport: viewport, entrance: entrance)
    }

    private var normal: [MetalToolStripItem] { items.filter { !$0.destructive } }
    private var danger: [MetalToolStripItem] { items.filter(\.destructive) }
    private var capacity: Int {
        guard let viewport else { return maxVisible }
        let key = MetalToolStripMetrics.buttonHeight + MetalToolStripMetrics.gap
        let reserve = Double(danger.count) * key + MetalToolStripMetrics.pad * 2 + (count == nil ? 0 : key)
        return min(maxVisible, max(1, Int((viewport.width - reserve) / key)))
    }
    private var overflow: [MetalToolStripItem] { normal.count > capacity ? Array(normal.dropFirst(max(0, capacity - 1))) : [] }
    private var overflowMenu: [MetalMenuItem] {
        overflow.flatMap { item in
            if item.menu.isEmpty { return [MetalMenuItem(item.disabledReason.map { "\(item.label) · \($0)" } ?? item.label, icon: item.icon, shortcut: item.shortcut, disabled: item.disabledReason != nil || item.busy, action: item.action)] }
            return item.menu.map { row in row.isSeparator ? .separator : MetalMenuItem("\(item.label) · \(row.label)", icon: row.icon, shortcut: row.shortcut, disabled: row.disabled || item.disabledReason != nil || item.busy, action: row.action ?? {}) }
        }
    }
    private var visible: [MetalToolStripItem] { overflow.isEmpty ? normal : Array(normal.prefix(max(0, capacity - 1))) }

    public var body: some View {
        let travel = MetalMotion.resolve(.part, reduceMotion: reduceMotion).allowsTravel
        let strip = HStack(spacing: MetalToolStripMetrics.gap) {
            if let count { MetalLabel("\(count)", style: .onGraphite).accessibilityLabel("\(count) selected") }
            ForEach(visible) { item in key(item) }
            if !overflow.isEmpty {
                MetalToolStripKey(item: MetalToolStripItem("More", id: "__more", icon: .more,
                    menu: overflowMenu, action: {})).focused($focusedKey, equals: "__more")
            }
            ForEach(danger) { item in
                MetalRule(tone: .graphite).frame(height: MetalToolStripMetrics.sepHeight)
                key(item)
            }
        }
        .padding(MetalToolStripMetrics.pad)
        .fixedSize()
        .background { MetalSurface(.graphiteStrip, radius: .strip) { Color.clear }.scaleEffect(x: backingScale, anchor: .leading) }
        .background { GeometryReader { geometry in Color.clear.preference(key: MetalToolStripSizeKey.self, value: geometry.size) } }
        .onPreferenceChange(MetalToolStripSizeKey.self) { next in
            let old = size.width
            size = next
            guard old > 0, next.width > 0, old != next.width, !reduceMotion else { backingScale = 1; return }
            var transaction = Transaction(); transaction.disablesAnimations = true
            withTransaction(transaction) { backingScale = old / next.width }
            DispatchQueue.main.async { withMetalAnimation(.settle, reduceMotion: reduceMotion) { backingScale = 1 } }
        }
        .opacity(arrived || !entrance ? Double.one : .zero)
        .offset(y: arrived || !entrance || !travel ? 0 : MetalToolStripMetrics.enterRise)
        .onAppear { withMetalAnimation(.part, reduceMotion: reduceMotion) { arrived = true } }
        .metalAnimation(.settle, value: items.map(\.id))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Tools for \(label)")
        .onMoveCommand { direction in
            let ids = visible.map(\.id) + (overflow.isEmpty ? [] : ["__more"]) + danger.map(\.id)
            guard !ids.isEmpty else { return }
            let current = focusedKey.flatMap { ids.firstIndex(of: $0) } ?? 0
            let step = direction == .left ? -1 : direction == .right ? 1 : 0
            if step != 0 { focusedKey = ids[(current + step + ids.count) % ids.count] }
        }
        if let anchor, let viewport { strip.position(position(anchor, viewport)) } else { strip }
    }
    private func key(_ item: MetalToolStripItem) -> some View {
        MetalToolStripKey(item: item).focused($focusedKey, equals: item.id).matchedGeometryEffect(id: item.id, in: keys, properties: .position).transition(.opacity)
    }
    private func position(_ anchor: CGRect, _ viewport: CGRect) -> CGPoint {
        let padding = MetalToolStripMetrics.pad, gap = MetalToolStripMetrics.gapAbove
        let x = min(max(anchor.midX, viewport.minX + padding + size.width / 2), viewport.maxX - padding - size.width / 2)
        let above = anchor.minY - gap - size.height / 2
        let below = anchor.maxY + gap + size.height / 2
        let y = above - size.height / 2 >= viewport.minY + padding ? above : below
        return CGPoint(x: x, y: min(max(y, viewport.minY + padding + size.height / 2), viewport.maxY - padding - size.height / 2))
    }
}

private struct MetalToolStripKey: View {
    let item: MetalToolStripItem
    @State private var menuOpen = false
    var body: some View {
        MetalButton(item.label, cap: item.destructive ? .stripDanger : .strip, hold: item.irreversible,
                    iconOnly: item.icon != nil, state: item.busy ? .waiting : .idle, action: {
            guard item.disabledReason == nil, !item.busy else { return }
            if item.menu.isEmpty { item.action() } else { menuOpen = true }
        }) { if let icon = item.icon { MetalIcon(icon, size: MetalRecipes.button.points("compact.glyph")) } }
        .opacity(item.disabledReason == nil ? Double.one : MetalRecipes.button.scalar("self.disabled"))
        .accessibilityHint(item.disabledReason ?? (item.irreversible ? "Hold to confirm" : ""))
        .metalTooltip(item.disabledReason.map { "\(item.label) · \($0)" } ?? item.label, shortcut: item.shortcut)
        .popover(isPresented: $menuOpen) { MetalMenuPanel(heading: item.label, items: item.menu) { menuOpen = false } }
    }
}
