import SwiftUI

// The generated graphite surface and MetalToolStripMetrics compose the
// selection verbs until the requested strip button caps are generated.

/// A verb over a selection.
public struct MetalToolStripItem: Identifiable {
    public var id: String { label }
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
                        .frame(width: MetalSpace.s2 / 2,
                               height: MetalToolStripMetrics.sepHeight)
                        .overlay(alignment: .trailing) {
                            Rectangle().fill(MetalToolStripMetrics.sepLip.color)
                                .frame(width: MetalSpace.s2 / 2)
                                .offset(x: MetalSpace.s2 / 2)
                        }
                        .padding(.horizontal, MetalSpace.s6 / 2)
                }
                MetalToolStripButton(item: item)
            }
        }
        .padding(MetalToolStripMetrics.pad)
        .fixedSize()
        .background {
            MetalSurface(.graphiteStrip, radius: .strip) { Color.clear }
        }
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
    @FocusState private var focused: Bool

    var body: some View {
        Button(action: item.action) { Text(item.label) }
            .buttonStyle(MetalToolStripButtonStyle(destructive: item.destructive, hovering: hovering))
            .focusEffectDisabled()
            .focused($focused)
            .overlay {
                if focused {
                    RoundedRectangle(cornerRadius: MetalRadius.row, style: .continuous)
                        .stroke(MetalShared.focus.color,
                                lineWidth: MetalRecipes.button.points("self.focus-width"))
                }
            }
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
            .offset(y: configuration.isPressed ? MetalRecipes.button.points("self.travel") : .zero)
            .contentShape(RoundedRectangle(cornerRadius: MetalRadius.row))
            .metalAnimation(.release, value: configuration.isPressed)
    }
}
