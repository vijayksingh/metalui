import SwiftUI

// Selection tool strip. Mirrors components/tool-strip from MetalToolStripMetrics and the graphite frost.

/// A verb over a selection.
public struct MetalToolStripItem: Identifiable {
    public let id = UUID()
    public let label: String
    public let destructive: Bool
    public let action: () -> Void

    public init(_ label: String, destructive: Bool = false, action: @escaping () -> Void) {
        self.label = label
        self.destructive = destructive
        self.action = action
    }
}

/// Verbs over a click selection on a graphite strip; the destructive one after an engraved separator.
public struct MetalToolStrip: View {
    let label: String
    let items: [MetalToolStripItem]
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false

    public init(label: String, items: [MetalToolStripItem]) {
        self.label = label
        self.items = items
    }

    public var body: some View {
        let travel = MetalMotion.resolve(.part, reduceMotion: reduceMotion).allowsTravel
        HStack(spacing: MetalToolStripMetrics.gap) {
            ForEach(items) { item in
                if item.destructive {
                    Rectangle().fill(MetalToolStripMetrics.sep.color)
                        .frame(width: 1, height: MetalToolStripMetrics.sepHeight)
                        .overlay(alignment: .trailing) { Rectangle().fill(MetalToolStripMetrics.sepLip.color).frame(width: 1).offset(x: 1) }
                        .padding(.horizontal, 3)
                }
                MetalToolStripButton(item: item)
            }
        }
        .padding(MetalToolStripMetrics.pad)
        .fixedSize()
        .metalFrost(.graphite, in: RoundedRectangle(cornerRadius: MetalRadius.plate, style: .continuous))
        .opacity(arrived ? 1 : 0)
        .offset(y: arrived || !travel ? 0 : MetalToolStripMetrics.enterRise)
        .onAppear { withMetalAnimation(.part, reduceMotion: reduceMotion) { arrived = true } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Tools for \(label)")
    }
}

private struct MetalToolStripButton: View {
    let item: MetalToolStripItem
    @State private var hovering = false

    var body: some View {
        Button(action: item.action) { Text(item.label) }
            .buttonStyle(MetalToolStripButtonStyle(destructive: item.destructive, hovering: hovering))
            .onHover { hovering = $0 }
    }
}

private struct MetalToolStripButtonStyle: ButtonStyle {
    let destructive: Bool
    let hovering: Bool

    func makeBody(configuration: Configuration) -> some View {
        let ink = destructive ? MetalToolStripMetrics.danger : hovering ? MetalToolStripMetrics.inkHover : MetalToolStripMetrics.ink
        configuration.label
            .font(.metal(MetalType.ui)).tracking(MetalType.ui.trackingPoints)
            .foregroundColor(ink.color)
            .padding(.horizontal, MetalToolStripMetrics.buttonPad)
            .frame(height: MetalToolStripMetrics.buttonHeight)
            .background(RoundedRectangle(cornerRadius: MetalRadius.row, style: .continuous).fill(
                configuration.isPressed ? MetalToolStripMetrics.active.color : hovering ? MetalToolStripMetrics.hover.color : .clear))
            .offset(y: configuration.isPressed ? 1 : 0)
            .contentShape(RoundedRectangle(cornerRadius: MetalRadius.row))
            .metalAnimation(.release, value: configuration.isPressed)
    }
}
