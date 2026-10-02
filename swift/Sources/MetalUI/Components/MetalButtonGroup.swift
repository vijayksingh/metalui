import SwiftUI

// One raised bar. Segment bounds cut the fixed seams; the faces press inside them.
struct MetalButtonGroupContext {
    let cap: MetalButtonCap
    let size: MetalButtonSize
    let pressed: (UUID, Bool) -> Void
}
private struct MetalButtonGroupContextKey: EnvironmentKey { static let defaultValue: MetalButtonGroupContext? = nil }
struct MetalButtonGroupAnchors: PreferenceKey {
    static let defaultValue: [UUID: Anchor<CGRect>] = [:]
    static func reduce(value: inout [UUID: Anchor<CGRect>], nextValue: () -> [UUID: Anchor<CGRect>]) { value.merge(nextValue(), uniquingKeysWith: { _, new in new }) }
}
private struct MetalButtonGroupLatchedKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    var metalButtonGroup: MetalButtonGroupContext? {
        get { self[MetalButtonGroupContextKey.self] }
        set { self[MetalButtonGroupContextKey.self] = newValue }
    }
    var metalButtonGroupLatched: Bool {
        get { self[MetalButtonGroupLatchedKey.self] }
        set { self[MetalButtonGroupLatchedKey.self] = newValue }
    }
}

/// Related operations cut from one cap. Use MetalButton children, or the group's latching key.
public struct MetalButtonGroup<Content: View>: View {
    private let label: String
    private let content: Content
    private let cap: MetalButtonCap
    private let size: MetalButtonSize
    private let rocker: Bool
    @State private var pressed: UUID?
    @State private var tilt: Double = .zero
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(_ label: String, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, rocker: Bool = false, @ViewBuilder content: () -> Content) {
        self.label = label
        self.cap = cap == .primary ? .primary : .standard
        self.size = size
        self.rocker = rocker
        self.content = content()
    }

    public var body: some View {
        let shape = Capsule(style: .continuous)
        let part = cap == .primary ? "primary" : size == .compact ? "compact" : "self"
        let angle = Double(MetalRecipes.buttonGroup.text("rocker.angle")?.replacingOccurrences(of: "deg", with: "") ?? "") ?? .zero
        HStack(spacing: MetalRecipes.buttonGroup.points("tray.gap")) { content }
            .environment(\.metalButtonGroup, MetalButtonGroupContext(cap: cap, size: size, pressed: { id, down in pressed = down ? id : nil }))
            .clipShape(shape)
            .background { Color.clear.metalObjectRecipe(MetalRecipes.button, part: part, in: shape) }
            .overlayPreferenceValue(MetalButtonGroupAnchors.self) { anchors in
                GeometryReader { geometry in
                    let frames = anchors.mapValues { geometry[$0] }
                    let width = MetalRecipes.rule.points("self.thickness")
                    let inset = MetalRadius.nest
                    ZStack(alignment: .topLeading) {
                        ForEach(Array(frames.keys), id: \.self) { id in
                            if let frame = frames[id], frame.maxX < geometry.size.width - width {
                                Rectangle().fill(.clear).metalObjectRecipe(MetalRecipes.rule, part: "self", in: Rectangle())
                                    .frame(width: width, height: max(.zero, geometry.size.height - inset - inset))
                                    .offset(x: frame.maxX - width, y: inset)
                            }
                        }
                    }
                    .onChange(of: pressed) { _, id in
                        guard rocker, frames.count == 2, let id, let frame = frames[id] else { tilt = .zero; return }
                        tilt = frame.midX < geometry.size.width / 2 ? -angle : angle
                    }
                }.allowsHitTesting(false)
            }
            .rotationEffect(.degrees(reduceMotion ? .zero : tilt))
            .metalAnimation(.part, value: tilt)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
    }
}

/// A sunk readout window. It has no action and never becomes a keyboard stop.
public struct MetalButtonGroupReadout: View {
    private let value: String
    private let label: String
    @State private var id = UUID()
    @Environment(\.metalButtonGroup) private var group
    @Environment(\.metalColorway) private var colorway
    public init(_ value: String, label: String) { self.value = value; self.label = label }
    public var body: some View {
        Text(value).font(.metal(MetalType.meta)).monospacedDigit()
            .foregroundStyle(colorway.tokens.ink2.color)
            .padding(.horizontal, MetalRecipes.button.points("self.pad"))
            .frame(height: MetalRecipes.button.points(group?.size == .compact ? "compact.height" : "self.height"))
            .background { Color.clear.metalObjectRecipe(MetalRecipes.well, part: "field", in: Rectangle()) }
            .contentTransition(.numericText())
            .metalAnimation(.settle, value: value)
            .anchorPreference(key: MetalButtonGroupAnchors.self, value: .bounds) { [id: $0] }
            .accessibilityLabel(label)
            .accessibilityValue(value)
    }
}

/// A latching segment for a group: the host owns the binding, and its lamp states the latch.
public struct MetalButtonGroupToggle: View {
    private let label: String
    @Binding private var isOn: Bool
    @Environment(\.metalButtonGroup) private var group
    public init(_ label: String, isOn: Binding<Bool>) { self.label = label; self._isOn = isOn }
    public var body: some View {
        Button { isOn.toggle() } label: {
            HStack(spacing: MetalRecipes.button.points("self.gap")) { MetalLED(isOn ? .live : .off, size: .small); Text(label) }
        }
        .buttonStyle(MetalButtonStyle(cap: group?.cap ?? .standard, size: group?.size ?? .default))
        .environment(\.metalButtonGroupLatched, isOn)
        .accessibilityLabel(label)
        .accessibilityValue(isOn ? "On" : "Off")
        .accessibilityAddTraits(isOn ? [.isSelected] : [])
    }
}

/// One cap for a primary action and a chevron behind its seam. The shared menu owns keyboard rows.
public struct MetalSplitButton<Primary: View>: View {
    private let label: String
    private let cap: MetalButtonCap
    private let size: MetalButtonSize
    private let primary: Primary
    private let alternatives: [MetalMenuItem]
    private let heading: String?
    @State private var open = false
    @FocusState private var focused: Bool
    @Environment(\.isEnabled) private var enabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    public init(_ menuLabel: String, cap: MetalButtonCap = .standard, size: MetalButtonSize = .default, heading: String? = nil, menu: [MetalMenuItem], @ViewBuilder primary: () -> Primary) {
        self.label = menuLabel; self.cap = cap == .primary ? .primary : .standard; self.size = size; self.heading = heading; self.primary = primary(); self.alternatives = menu
    }
    public var body: some View {
        let recipe = MetalRecipes.buttonGroup
        let turn = Double(recipe.text("chevron.turn")?.replacingOccurrences(of: "deg", with: "") ?? "") ?? .zero
        MetalButtonGroup(label, cap: cap, size: size) {
            primary
            Button { open.toggle() } label: {
                Image(systemName: "chevron.down")
                    .font(MetalRecipes.button.font("compact.font"))
                    .rotationEffect(.degrees(open ? turn : .zero))
                    .metalAnimation(.part, value: open)
            }
            .buttonStyle(MetalButtonStyle(cap: cap, size: size))
            .environment(\.metalButtonGroupLatched, open)
            .environment(\.metalButtonGroupWidth, recipe.points("chevron.width"))
            .focused($focused)
            .focusEffectDisabled()
            .accessibilityLabel(label)
            .accessibilityValue(open ? "Expanded" : "Collapsed")
            .onKeyPress(.downArrow) { guard enabled else { return .ignored }; open = true; return .handled }
            .popover(isPresented: $open, arrowEdge: .bottom) {
                MetalMenuPanel(heading: heading, items: alternatives) { open = false; focused = true }
                    .environment(\.metalButtonGroup, nil)
            }
            .onChange(of: open) { _, open in if !open && enabled { focused = true } }
            .onChange(of: enabled) { _, enabled in if !enabled { open = false } }
        }
    }
}
private struct MetalButtonGroupWidthKey: EnvironmentKey { static let defaultValue: Double? = nil }
extension EnvironmentValues {
    var metalButtonGroupWidth: Double? {
        get { self[MetalButtonGroupWidthKey.self] }
        set { self[MetalButtonGroupWidthKey.self] = newValue }
    }
}
