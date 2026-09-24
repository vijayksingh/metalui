import SwiftUI

// Command palette (KAMUI-06; Kamui 04 §3). Mirrors components/command-palette from MetalPaletteMetrics:
// one field, sections of rows, a raised selected row, a footer of keys. Hover moves the selection;
// ↩ runs, ⇧↩ runs pinned, ⎋ closes. The selection is instant (rows are scanned, not watched).

/// One row of the palette.
public struct MetalCommandPaletteItem: Identifiable, Sendable {
    /// The right side of a row.
    public enum Hint: Sendable {
        /// A key on a small cap: "⌘Z".
        case key(String)
        /// A readout engraving: "8:52", "RULES".
        case readout(String)
        /// A readout, then a key: a fragment's time and ↩.
        case readoutKey(String, String)
    }

    public let id: String
    public let label: String
    /// LENS, LENSES, FRAGMENTS, ACTIONS. Rows of one section must be adjacent.
    public let section: String
    public let icon: MetalIconName?
    public let hint: Hint?
    public let keywords: [String]
    /// A destructive action: the row is red.
    public let danger: Bool

    public init(id: String, label: String, section: String, icon: MetalIconName? = nil, hint: Hint? = nil, keywords: [String] = [], danger: Bool = false) {
        self.id = id
        self.label = label
        self.section = section
        self.icon = icon
        self.hint = hint
        self.keywords = keywords
        self.danger = danger
    }

    func matches(_ query: String) -> Bool {
        let words = query.lowercased().split(whereSeparator: \.isWhitespace)
        guard !words.isEmpty else { return true }
        let hay = ([label] + keywords).joined(separator: " ").lowercased()
        return words.allSatisfy { hay.contains($0) }
    }
}

/// ⌘K: lenses and actions. Present it with `.metalCommandPalette(isPresented:…)`, or place it yourself.
public struct MetalCommandPalette: View {
    @Binding var query: String
    let items: [MetalCommandPaletteItem]
    let filter: Bool
    let placeholder: String
    let status: String?
    let pinnable: Bool
    let onRun: (MetalCommandPaletteItem, Bool) -> Void
    let onClose: () -> Void

    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalSnapshot) private var snapshot
    @State private var selected = 0
    @FocusState private var fieldFocused: Bool

    /// - Parameters:
    ///   - filter: true filters `items` by every query word against label and keywords; false shows them as given.
    ///   - onRun: the row, and whether it was ⇧↩ (pin). Close the palette in it.
    public init(
        query: Binding<String>,
        items: [MetalCommandPaletteItem],
        filter: Bool = true,
        placeholder: String = "Try “open tasks about the poster”",
        status: String? = nil,
        pinnable: Bool = true,
        onRun: @escaping (MetalCommandPaletteItem, _ pin: Bool) -> Void,
        onClose: @escaping () -> Void
    ) {
        _query = query
        self.items = items
        self.filter = filter
        self.placeholder = placeholder
        self.status = status
        self.pinnable = pinnable
        self.onRun = onRun
        self.onClose = onClose
    }

    private var shown: [MetalCommandPaletteItem] { filter ? items.filter { $0.matches(query) } : items }

    private var sections: [(name: String, rows: [(offset: Int, element: MetalCommandPaletteItem)])] {
        var out: [(name: String, rows: [(offset: Int, element: MetalCommandPaletteItem)])] = []
        for (i, item) in shown.enumerated() {
            if let last = out.indices.last, out[last].name == item.section { out[last].rows.append((i, item)) }
            else { out.append((item.section, [(i, item)])) }
        }
        return out
    }

    public var body: some View {
        let t = colorway.tokens
        let rows = shown
        VStack(spacing: 0) {
            field(t)
            if rows.isEmpty {
                Text("Nothing matches").font(.metal(MetalType.ui)).foregroundColor(t.ink3.color)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, MetalPaletteMetrics.rowPad).padding(.vertical, 14)
            } else {
                list(t)
            }
            footer(t)
        }
        .padding(MetalPaletteMetrics.pad)
        .frame(width: MetalPaletteMetrics.width)
        .metalFrost(.plate, in: RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous))
        .onAppear { fieldFocused = true }
        .onChange(of: query) { _, _ in selected = 0 }
        .onKeyPress(.downArrow) { move(1, count: rows.count); return .handled }
        .onKeyPress(.upArrow) { move(-1, count: rows.count); return .handled }
        .onKeyPress(.return, phases: .down) { press in
            guard rows.indices.contains(selected) else { return .handled }
            onRun(rows[selected], pinnable && press.modifiers.contains(.shift))
            return .handled
        }
        .onKeyPress(.escape) { onClose(); return .handled }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Lenses and actions")
        .accessibilityAddTraits(.isModal)
    }

    private func move(_ by: Int, count: Int) {
        guard count > 0 else { return }
        selected = min(max(selected + by, 0), count - 1)
    }

    private func field(_ t: MetalColorwayTokens) -> some View {
        HStack(spacing: MetalPaletteMetrics.fieldGap) {
            MetalIcon(.search, size: MetalPaletteMetrics.fieldGlyph).foregroundStyle(t.ink3.color)
            Group {
                if snapshot {
                    // ImageRenderer cannot draw a text field: the same text and its caret, drawn.
                    HStack(spacing: 1) {
                        Text(query.isEmpty ? placeholder : query).foregroundColor((query.isEmpty ? t.ink3 : t.ink).color)
                        Rectangle().fill(MetalShared.greenDeep.color).frame(width: 1.5, height: 18)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    TextField("", text: $query, prompt: Text(placeholder).foregroundColor(t.ink3.color))
                        .textFieldStyle(.plain)
                        .foregroundColor(t.ink.color)
                        .tint(MetalShared.greenDeep.color)
                        .focused($fieldFocused)
                        .accessibilityLabel("Lenses and actions")
                }
            }
            .font(.metal(MetalType.content))
            .tracking(MetalType.content.trackingPoints)
            MetalKbd("⎋", size: .small, label: "Escape closes")
        }
        .padding(.leading, MetalPaletteMetrics.fieldPadStart)
        .padding(.trailing, MetalPaletteMetrics.fieldPadEnd)
        .frame(height: MetalPaletteMetrics.fieldHeight)
        .metalRecipe(MetalRecipe(fill: MetalGradient(angle: 180, stops: [.init(t.wellTop, 0), .init(t.wellBot, 1)]), shadows: t.well),
                     in: RoundedRectangle(cornerRadius: MetalPaletteMetrics.fieldRadius, style: .continuous))
    }

    private func engraving(_ text: String, _ t: MetalColorwayTokens) -> some View {
        Text(text).font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints)
            .foregroundColor(t.engrave.color)
            .shadow(color: t.lip.color, radius: 0, x: 0, y: 0.5)
    }

    private func rowsView(_ t: MetalColorwayTokens) -> some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            ForEach(sections, id: \.name) { section in
                HStack {
                    engraving(section.name, t)
                    Spacer()
                    engraving("\(section.rows.count)", t).accessibilityHidden(true)
                }
                .padding(.top, MetalPaletteMetrics.secPadTop)
                .padding(.bottom, MetalPaletteMetrics.secPadBottom)
                .padding(.horizontal, MetalPaletteMetrics.rowPad)
                .accessibilityAddTraits(.isHeader)
                ForEach(section.rows, id: \.element.id) { row in
                    MetalCommandPaletteRow(item: row.element, query: query, selected: row.offset == selected)
                        .id(row.offset)
                        .onHover { if $0 { selected = row.offset } }
                        .onTapGesture { onRun(row.element, false) }
                }
            }
        }
        .padding(.top, 4).padding(.bottom, 2)
        // The selected row's bar sits 2 outside the row: room for it inside the scroll clip.
        .padding(.horizontal, -MetalPaletteMetrics.barLeft)
    }

    @ViewBuilder private func list(_ t: MetalColorwayTokens) -> some View {
        if snapshot {
            rowsView(t).padding(.horizontal, MetalPaletteMetrics.barLeft)
        } else {
            ScrollViewReader { proxy in
                ScrollView { rowsView(t) }
                    .frame(maxHeight: (NSScreen.main?.visibleFrame.height ?? 900) * MetalPaletteMetrics.listMax)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, MetalPaletteMetrics.barLeft)
                    .onChange(of: selected) { _, now in proxy.scrollTo(now) }
            }
        }
    }

    private func footer(_ t: MetalColorwayTokens) -> some View {
        HStack(spacing: MetalPaletteMetrics.footGap) {
            HStack(spacing: 5) { MetalKbd("↑", size: .small); MetalKbd("↓", size: .small); engraving("MOVE", t) }
            HStack(spacing: 5) { MetalKbd("↩", size: .small); engraving("OPEN", t) }
            if pinnable { HStack(spacing: 5) { MetalKbd("⇧↩", size: .small); engraving("PIN", t) } }
            Spacer(minLength: 0)
            if let status { engraving(status, t) }
        }
        .padding(.top, MetalPaletteMetrics.footPadTop)
        .padding(.bottom, MetalPaletteMetrics.footPadBottom)
        .padding(.horizontal, MetalPaletteMetrics.rowPad)
        .overlay(alignment: .top) {
            VStack(spacing: 0) { Rectangle().fill(t.rule.color).frame(height: 1); Rectangle().fill(t.ruleLip.color).frame(height: 1) }
        }
        .padding(.top, 4)
        .accessibilityHidden(true)
    }
}

/// A 36 row: glyph, the label with matches marked, the hint. Selected: a raised cap with a green bar.
private struct MetalCommandPaletteRow: View {
    let item: MetalCommandPaletteItem
    let query: String
    let selected: Bool
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    var body: some View {
        let t = colorway.tokens
        let ink = item.danger ? MetalShared.red : t.ink
        HStack(spacing: MetalPaletteMetrics.rowGap) {
            if let icon = item.icon {
                MetalIcon(icon, size: MetalPaletteMetrics.rowGlyph).foregroundStyle((item.danger ? MetalShared.red : t.ink2).color)
            }
            Text(marked(ink: ink)).lineLimit(1).truncationMode(.tail)
            Spacer(minLength: 0)
            if let hint = item.hint { hintView(hint, t) }
        }
        .padding(.horizontal, MetalPaletteMetrics.rowPad)
        .frame(height: MetalPaletteMetrics.rowHeight)
        .background {
            if selected {
                Color.clear.metalRecipe(MetalRecipe(fill: t.rowOnBg, shadows: t.raiseSm), in: RoundedRectangle(cornerRadius: MetalRadius.row, style: .continuous))
            }
        }
        .overlay(alignment: .leading) {
            if selected {
                Capsule().fill(MetalShared.greenDeep.color)
                    .frame(width: MetalPaletteMetrics.barWidth)
                    .padding(.vertical, MetalPaletteMetrics.barInset)
                    .offset(x: MetalPaletteMetrics.barLeft)
            }
        }
        .contentShape(Rectangle())
        .metalIconInteraction(MetalIconInteraction(isHovered: selected, isPressed: false))
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }

    /// The label with each query word at 650 (semibold) and a green underline.
    private func marked(ink: MetalRGBA) -> AttributedString {
        var s = AttributedString(item.label)
        s.font = .metal(MetalType.ui)
        s.foregroundColor = ink.color
        let lower = item.label.lowercased()
        for word in query.lowercased().split(whereSeparator: \.isWhitespace) {
            var from = lower.startIndex
            while let r = lower.range(of: word, range: from..<lower.endIndex) {
                let lo = lower.distance(from: lower.startIndex, to: r.lowerBound)
                let hi = lower.distance(from: lower.startIndex, to: r.upperBound)
                let a = s.index(s.startIndex, offsetByCharacters: lo), b = s.index(s.startIndex, offsetByCharacters: hi)
                s[a..<b].font = Font.metal(MetalType.ui).weight(.semibold)
                s[a..<b].underlineStyle = Text.LineStyle(pattern: .solid, color: MetalPaletteMetrics.markColor.color)
                from = r.upperBound
            }
        }
        return s
    }

    @ViewBuilder private func hintView(_ hint: MetalCommandPaletteItem.Hint, _ t: MetalColorwayTokens) -> some View {
        let readout = { (s: String) in
            Text(s).font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints).foregroundColor(t.engrave.color)
        }
        switch hint {
        case .key(let k): MetalKbd(k, size: .small)
        case .readout(let r): readout(r)
        case .readoutKey(let r, let k): HStack(spacing: 6) { readout(r); MetalKbd(k, size: .small) }
        }
    }
}

extension View {
    /// Presents the palette over this view: a page scrim at .25, the plate 16 % down, rising one nest
    /// (y −6, .985) on the surface spring; a click on the scrim closes.
    public func metalCommandPalette(
        isPresented: Binding<Bool>,
        query: Binding<String>,
        items: [MetalCommandPaletteItem],
        filter: Bool = true,
        status: String? = nil,
        onRun: @escaping (MetalCommandPaletteItem, _ pin: Bool) -> Void
    ) -> some View {
        modifier(MetalCommandPalettePresenter(isPresented: isPresented, query: query, items: items, filter: filter, status: status, onRun: onRun))
    }
}

private struct MetalCommandPalettePresenter: ViewModifier {
    @Binding var isPresented: Bool
    @Binding var query: String
    let items: [MetalCommandPaletteItem]
    let filter: Bool
    let status: String?
    let onRun: (MetalCommandPaletteItem, Bool) -> Void
    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        let travel = MetalMotion.resolve(.surface, reduceMotion: reduceMotion).allowsTravel
        content.overlay {
            GeometryReader { geo in
                ZStack(alignment: .top) {
                    if isPresented {
                        colorway.tokens.scrim.color
                            .ignoresSafeArea()
                            .onTapGesture { close() }
                            .transition(.opacity)
                        MetalCommandPalette(query: $query, items: items, filter: filter, status: status, onRun: { item, pin in
                            close()
                            onRun(item, pin)
                        }, onClose: close)
                        .padding(.top, geo.size.height * MetalPaletteMetrics.top)
                        .transition(travel
                            ? .opacity.combined(with: .offset(y: -MetalPaletteMetrics.enterRise)).combined(with: .scale(scale: MetalPaletteMetrics.enterScale, anchor: .top))
                            : .opacity)
                    }
                }
                .frame(width: geo.size.width, height: geo.size.height, alignment: .top)
            }
        }
        .metalAnimation(isPresented ? .surface : .release, value: isPresented)
    }

    private func close() { isPresented = false }
}

private struct MetalSnapshotKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    /// Rendering for a still image (ImageRenderer): AppKit-backed controls draw as their static look.
    var metalSnapshot: Bool {
        get { self[MetalSnapshotKey.self] }
        set { self[MetalSnapshotKey.self] = newValue }
    }
}
