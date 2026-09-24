import SwiftUI

// Region. Mirrors components/region from MetalRegion and the colorway region-* tokens.

/// A region's state on the canvas.
public enum MetalRegionState: Sendable {
    case rest
    /// A block is dragged above it: the drop target.
    case over
    /// An in-place lens has no match inside.
    case dim
    /// It did not exist at the scrubbed time.
    case past
}

/// A drawn rectangle with a name that carries a rule: a sunk well with its head, or a pinned lens plate.
public struct MetalRegionView<Rows: View>: View {
    let name: String
    let rule: String?
    let dropRule: String?
    let count: Int?
    let state: MetalRegionState
    let lens: Bool
    @Binding var renaming: Bool
    let onRename: (String) -> Void
    let rows: Rows

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @State private var draft = ""
    @FocusState private var nameFocused: Bool

    public init(
        name: String, rule: String? = nil, dropRule: String? = nil, count: Int? = nil, state: MetalRegionState = .rest,
        lens: Bool = false, renaming: Binding<Bool> = .constant(false), onRename: @escaping (String) -> Void = { _ in },
        @ViewBuilder rows: () -> Rows = { EmptyView() }
    ) {
        self.name = name
        self.rule = rule
        self.dropRule = dropRule
        self.count = count
        self.state = state
        self.lens = lens
        _renaming = renaming
        self.onRename = onRename
        self.rows = rows()
    }

    public var body: some View {
        let t = colorway.tokens
        GeometryReader { geo in
            let radius = min(geo.size.width, geo.size.height) >= MetalRegion.bigAt ? MetalRadius.hero : MetalRadius.card
            let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
            ZStack(alignment: .topLeading) {
                background(shape, t)
                VStack(alignment: .leading, spacing: 0) {
                    head(t).frame(height: MetalRegion.headHeight, alignment: .top)
                    if lens {
                        rows.padding(.horizontal, MetalRegion.bodyInset).padding(.bottom, MetalRegion.bodyInset)
                    }
                }
            }
        }
        .opacity(state == .past ? 0 : state == .dim ? MetalRegion.dim : 1)
        .allowsHitTesting(state != .past)
        .metalAnimation(.settle, value: state)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(name.isEmpty ? "Unnamed region" : "Region \(name)\(rule.map { ", \($0)" } ?? "")")
    }

    @ViewBuilder
    private func background(_ shape: RoundedRectangle, _ t: MetalColorwayTokens) -> some View {
        if lens {
            ZStack {
                if !reduceTransparency { MetalBackdropView(backdrop: MetalBackdrop(blur: MetalRegion.lensBlur, saturation: 1, dark: colorway == .graphite)).clipShape(shape) }
                Color.clear.metalRecipe(MetalRecipe(fill: reduceTransparency ? .solid(t.frostOpaque) : t.regionLensFill, shadows: t.raiseLite), in: shape)
            }
        } else if state == .over {
            Color.clear.metalRecipe(MetalRecipe(
                fill: MetalGradient(angle: 180, stops: [.init(MetalRegion.overFillTop, 0), .init(MetalRegion.overFillBot, 1)]),
                shadows: t.regionOverShade + [MetalShadow(inset: true, x: 0, y: 0, blur: 0, spread: 1, color: MetalRegion.overRing)]
            ), in: shape)
        } else {
            Color.clear.metalRecipe(MetalRecipe(fill: t.regionFill, shadows: t.regionSh), in: shape)
        }
    }

    private func head(_ t: MetalColorwayTokens) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: MetalRegion.headGap) {
            if renaming {
                TextField("name this region", text: $draft)
                    .textFieldStyle(.plain)
                    .font(.metal(MetalType.title))
                    .foregroundColor(t.ink.color)
                    .focused($nameFocused)
                    .fixedSize()
                    .onAppear { draft = name; nameFocused = true }
                    .onSubmit { onRename(draft.trimmingCharacters(in: .whitespaces)); renaming = false }
                    .onExitCommand { renaming = false }
            } else {
                Text(name.isEmpty ? "name this region" : name)
                    .font(.metal(MetalType.title))
                    .foregroundColor((name.isEmpty ? t.ink3 : t.ink).color)
            }
            Text((state == .over ? dropRule ?? rule : rule)?.uppercased() ?? "")
                .font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints)
                .foregroundColor(state == .over ? MetalRegion.overRule.color : t.engrave.color)
                .lineLimit(1).truncationMode(.tail)
                .frame(maxWidth: .infinity, alignment: .leading)
            if let count, count > 0 {
                Text("\(count)").font(.metal(MetalType.readout)).monospacedDigit().foregroundColor(t.ink3.color)
            }
        }
        .padding(.top, MetalRegion.headPadTop)
        .padding(.horizontal, MetalRegion.headPadX)
    }
}

/// A row in a pinned lens region: an optional dimple, the text, a trailing engraving; checked rows are struck.
public struct MetalRegionRow<Lead: View>: View {
    let text: String
    let checked: Bool
    let meta: String?
    let lead: Lead
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    public init(_ text: String, checked: Bool = false, meta: String? = nil, @ViewBuilder lead: () -> Lead = { EmptyView() }) {
        self.text = text
        self.checked = checked
        self.meta = meta
        self.lead = lead()
    }

    public var body: some View {
        let t = colorway.tokens
        HStack(alignment: .firstTextBaseline, spacing: MetalRegion.rowGap) {
            lead
            Text(text).font(.metal(MetalType.ui)).foregroundColor((checked ? t.ink3 : t.ink).color).strikethrough(checked)
            Spacer(minLength: 0)
            if let meta { Text(meta.uppercased()).font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints).foregroundColor(t.engrave.color) }
        }
        .padding(.vertical, MetalRegion.rowPadY)
        .padding(.horizontal, MetalRegion.rowPadX)
        .background {
            if hovering {
                Color.clear.metalRecipe(MetalRecipe(fill: .solid(t.rowHover), shadows: t.raiseSm), in: RoundedRectangle(cornerRadius: MetalRadius.row, style: .continuous))
            }
        }
        .contentShape(Rectangle())
        .onHover { hovering = $0 }
        .metalAnimation(.settle, value: hovering)
    }
}
