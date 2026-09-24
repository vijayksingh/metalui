import SwiftUI

// Lens bar. Mirrors components/lens-bar from MetalLensBarMetrics, the plate frost and MetalSegmented.

/// How a lens shows its answer.
public enum MetalLensMode: String, CaseIterable, Sendable {
    case place, list, table, timeline, gallery

    public var title: String {
        switch self {
        case .place: return "In Place"
        case .list: return "List"
        case .table: return "Table"
        case .timeline: return "Timeline"
        case .gallery: return "Gallery"
        }
    }
}

/// Where a lens's answer came from.
public enum MetalLensSource: Sendable { case asking, jev, local }

/// Names the question a lens asks, counts its matches and switches views; pin and close at the end.
public struct MetalLensBar: View {
    let query: String
    let count: Int?
    let source: MetalLensSource?
    @Binding var mode: MetalLensMode
    let modes: [MetalLensMode]
    let onPin: (() -> Void)?
    let onClose: () -> Void

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false

    public init(query: String, count: Int? = nil, source: MetalLensSource? = nil, mode: Binding<MetalLensMode>, modes: [MetalLensMode] = MetalLensMode.allCases, onPin: (() -> Void)? = nil, onClose: @escaping () -> Void) {
        self.query = query
        self.count = count
        self.source = source
        _mode = mode
        self.modes = modes
        self.onPin = onPin
        self.onClose = onClose
    }

    public var body: some View {
        let t = colorway.tokens
        let label = MetalType.label
        let travel = MetalMotion.resolve(.surface, reduceMotion: reduceMotion).allowsTravel
        HStack(spacing: MetalLensBarMetrics.gap) {
            MetalIcon(.search, size: MetalLensBarMetrics.glyph).foregroundStyle(t.ink2.color)
            Text(query).font(.metal(MetalType.title)).foregroundColor(t.ink.color).lineLimit(1).truncationMode(.tail)
                .frame(maxWidth: MetalLensBarMetrics.queryMax, alignment: .leading)
            if let count {
                Text("\(count) \(count == 1 ? "MATCH" : "MATCHES")").font(.metal(label)).tracking(label.trackingPoints).foregroundColor(t.engrave.color)
            }
            if let source {
                HStack(spacing: 5) {
                    if source == .asking {
                        Circle().fill(MetalShared.ledAmber.gradient(diameter: 5)).frame(width: 5, height: 5)
                    }
                    Text(source == .asking ? "ASKING JEV" : source == .jev ? "VIA JEV" : "LOCAL")
                        .font(.metal(label)).tracking(label.trackingPoints).foregroundColor(t.engrave.color)
                }
            }
            if !modes.isEmpty {
                MetalSegmented("View", selection: $mode, options: modes.map { ($0, $0.title) }, size: .compact)
            }
            if let onPin { MetalLensBarButton(icon: .pin, label: "Pin as a live region", action: onPin) }
            MetalLensBarButton(icon: .close, label: "Close lens", action: onClose)
        }
        .padding(.leading, MetalLensBarMetrics.padStart)
        .padding(.trailing, MetalLensBarMetrics.padEnd)
        .frame(height: MetalLensBarMetrics.height)
        .fixedSize()
        .metalFrost(.plate, in: Capsule(style: .continuous))
        .opacity(arrived ? 1 : 0)
        .offset(y: arrived || !travel ? 0 : -MetalLensBarMetrics.enterDrop)
        .scaleEffect(arrived || !travel ? 1 : MetalLensBarMetrics.enterScale)
        .onAppear { withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Lens: \(query)")
    }
}

private struct MetalLensBarButton: View {
    let icon: MetalIconName
    let label: String
    let action: () -> Void
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    var body: some View {
        let t = colorway.tokens
        Button(action: action) {
            MetalIcon(icon, size: MetalLensBarMetrics.glyph, interaction: MetalIconInteraction(isHovered: hovering))
                .foregroundStyle((hovering ? t.ink : t.ink2).color)
                .frame(width: MetalLensBarMetrics.iconButton, height: MetalLensBarMetrics.iconButton)
                .background(Circle().fill(t.ink.color.opacity(hovering ? 0.05 : 0)))
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .metalAnimation(.settle, value: hovering)
        .help(label)
        .accessibilityLabel(label)
    }
}
