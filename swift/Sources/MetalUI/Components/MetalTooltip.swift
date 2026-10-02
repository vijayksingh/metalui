import SwiftUI

// Tooltip (Soft Hardware spec §2, §8). Mirrors components/tooltip from MetalTooltipMetrics: a label chip in the colorway,
// "SELECT · V", 10 from its trigger after 120 ms, a fade on settle. It takes no hits.

/// One shown tooltip, published to the host at the window root.
public struct MetalTooltipEntry: Identifiable {
    public let id: String
    let label: String
    let shortcut: String?
    let edge: VerticalEdge
    let anchor: Anchor<CGRect>
}

/// Shown tooltips, as anchors: the host draws them above everything.
public struct MetalTooltipAnchorKey: PreferenceKey {
    public static let defaultValue: [MetalTooltipEntry] = []
    public static func reduce(value: inout [MetalTooltipEntry], nextValue: () -> [MetalTooltipEntry]) {
        value.append(contentsOf: nextValue())
    }
}

private struct MetalTooltipHostedKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// True under `metalTooltipHost()`: tooltips publish anchors instead of
    /// drawing in their trigger's layer.
    var metalTooltipHosted: Bool {
        get { self[MetalTooltipHostedKey.self] }
        set { self[MetalTooltipHostedKey.self] = newValue }
    }
}

private struct MetalTooltipModifier: ViewModifier {
    let label: String
    let shortcut: String?
    let edge: VerticalEdge
    @State private var shown = false
    @State private var pending: Task<Void, Never>?
    @State private var id = UUID().uuidString
    @MetalMotionPreference private var reduceMotion
    @Environment(\.metalTooltipHosted) private var hosted

    func body(content: Content) -> some View {
        content
            // Hosted: the chip is drawn at the window root, above every sibling and
            // outside every clip (the trigger's own layer cut it off, audit F-008).
            .anchorPreference(key: MetalTooltipAnchorKey.self, value: .bounds) { anchor in
                hosted && shown ? [MetalTooltipEntry(id: id, label: label, shortcut: shortcut, edge: edge, anchor: anchor)] : []
            }
            .overlay(alignment: edge == .top ? .top : .bottom) {
                if shown && !hosted { chip.transition(.opacity) }
            }
            .onHover { hovering in
                pending?.cancel()
                if hovering {
                    pending = Task { @MainActor in
                        try? await Task.sleep(for: .milliseconds(Int(MetalTooltipMetrics.delayMs)))
                        guard !Task.isCancelled else { return }
                        withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = true }
                    }
                } else {
                    withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = false }
                }
            }
            .simultaneousGesture(TapGesture().onEnded { pending?.cancel(); shown = false })
            .accessibilityHint(shortcut.map { "\(label), \($0)" } ?? label)
    }

    private var chip: some View {
        MetalTooltipChip(label: label, shortcut: shortcut)
            .alignmentGuide(edge == .top ? .top : .bottom) { d in
                edge == .top ? d[.bottom] + MetalTooltipMetrics.gap : d[.top] - MetalTooltipMetrics.gap
            }
            .allowsHitTesting(false)
            .zIndex(1)
    }
}

/// Draws every shown tooltip above the content it hosts: centred on its
/// trigger, `gap` away, kept inside the host's bounds and flipped to the other
/// side when there is no room. It takes no hits.
private struct MetalTooltipHost: ViewModifier {
    func body(content: Content) -> some View {
        content
            .environment(\.metalTooltipHosted, true)
            .overlayPreferenceValue(MetalTooltipAnchorKey.self) { entries in
                GeometryReader { proxy in
                    ZStack(alignment: .topLeading) {
                        Color.clear
                        ForEach(entries) { entry in
                            let trigger = proxy[entry.anchor]
                            let bounds = proxy.size
                            MetalTooltipChip(label: entry.label, shortcut: entry.shortcut)
                                .alignmentGuide(.leading) { d in
                                    let margin = MetalTooltipMetrics.gap
                                    return -min(max(trigger.midX - d.width / 2, margin), bounds.width - d.width - margin)
                                }
                                .alignmentGuide(.top) { d in
                                    let gap = MetalTooltipMetrics.gap
                                    let above = trigger.minY - gap - d.height
                                    let below = trigger.maxY + gap
                                    let fitsAbove = above >= gap
                                    let fitsBelow = below + d.height <= bounds.height - gap
                                    let top = entry.edge == .top ? (fitsAbove || !fitsBelow ? above : below)
                                                                 : (fitsBelow || !fitsAbove ? below : above)
                                    return -top
                                }
                                .transition(.opacity)
                        }
                    }
                }
                .allowsHitTesting(false)
            }
    }
}

/// The chip in the colorway: the name, then the key dimmed.
struct MetalTooltipChip: View {
    let label: String
    let shortcut: String?
    @Environment(\.metalColorway) private var colorway

    var body: some View {
        let recipe = MetalRecipes.tooltip
        let cw = MetalRecipeColorway(colorway)
        return (Text(label.uppercased()).foregroundColor((recipe.color("self.ink", colorway: cw) ?? colorway.tokens.ink).color)
            + Text(shortcut.map { " · \($0)" } ?? "").foregroundColor((recipe.color("key.ink", colorway: cw) ?? colorway.tokens.ink3).color))
            .font(.metal(MetalType.label))
            .tracking(MetalType.label.trackingPoints)
            .lineLimit(1)
            .fixedSize()
            .padding(.vertical, MetalTooltipMetrics.padY)
            .padding(.horizontal, MetalTooltipMetrics.padX)
            .metalObjectRecipe(recipe, part: "self", in: Capsule(style: .continuous))
            .accessibilityHidden(true)
    }
}

extension View {
    /// Names this icon-only control and its key, one hover away: `SELECT · V`.
    ///
    ///     Button(action: undo) { MetalIcon(.undo, size: 16) }
    ///         .accessibilityLabel("Undo")
    ///         .metalTooltip("Undo", shortcut: "⌘Z")
    ///
    /// The control keeps its own accessibility label: the tooltip is visual.
    public func metalTooltip(_ label: String, shortcut: String? = nil, edge: VerticalEdge = .top) -> some View {
        modifier(MetalTooltipModifier(label: label, shortcut: shortcut, edge: edge))
    }

    /// Hosts the tooltips of everything inside: put it on the window's root
    /// view (or an overlay that spans the window), so a tooltip is never
    /// covered by a sibling or cut by a clip. Without a host, a tooltip draws
    /// in its trigger's layer.
    public func metalTooltipHost() -> some View {
        modifier(MetalTooltipHost())
    }

    /// The tooltip chip on its own, always shown: for docs and stills.
    public func metalTooltipChip(_ label: String, shortcut: String? = nil) -> some View {
        overlay(alignment: .top) {
            MetalTooltipChip(label: label, shortcut: shortcut)
                .alignmentGuide(.top) { d in d[.bottom] + MetalTooltipMetrics.gap }
        }
    }
}
