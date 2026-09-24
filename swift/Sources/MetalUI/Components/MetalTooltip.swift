import SwiftUI

// Tooltip (Kamui 04 §2, §8). Mirrors components/tooltip from MetalTooltipMetrics: a graphite label chip,
// "SELECT · V", 10 from its trigger after 120 ms, a fade on settle. It takes no hits.

private struct MetalTooltipModifier: ViewModifier {
    let label: String
    let shortcut: String?
    let edge: VerticalEdge
    @State private var shown = false
    @State private var pending: Task<Void, Never>?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .overlay(alignment: edge == .top ? .top : .bottom) {
                if shown { chip.transition(.opacity) }
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

/// The graphite chip: the name, then the key dimmed.
struct MetalTooltipChip: View {
    let label: String
    let shortcut: String?

    var body: some View {
        (Text(label.uppercased()).foregroundColor(MetalTooltipMetrics.ink.color)
            + Text(shortcut.map { " · \($0)" } ?? "").foregroundColor(MetalTooltipMetrics.keyInk.color))
            .font(.metal(MetalType.label))
            .tracking(MetalType.label.trackingPoints)
            .lineLimit(1)
            .fixedSize()
            .padding(.vertical, MetalTooltipMetrics.padY)
            .padding(.horizontal, MetalTooltipMetrics.padX)
            .metalFrost(.graphite, in: Capsule(style: .continuous))
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

    /// The tooltip chip on its own, always shown: for docs and stills.
    public func metalTooltipChip(_ label: String, shortcut: String? = nil) -> some View {
        overlay(alignment: .top) {
            MetalTooltipChip(label: label, shortcut: shortcut)
                .alignmentGuide(.top) { d in d[.bottom] + MetalTooltipMetrics.gap }
        }
    }
}
