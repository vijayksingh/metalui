import SwiftUI

/// Keeps the sentence column readable, moving the one control below it when needed.
/// Measures and places the same views in both arrangements, preserving control state.
struct MetalSettingsRowLayout: Layout {
    private struct Measurement {
        let text: CGSize
        let control: CGSize
        let width: CGFloat
        let stacked: Bool

        var height: CGFloat {
            stacked ? text.height + MetalSettingsMetrics.stackGap + control.height
                : max(text.height, control.height)
        }
    }

    private func measure(_ proposal: ProposedViewSize, _ subviews: Subviews) -> Measurement {
        let control = subviews[1].sizeThatFits(.unspecified)
        let ideal = subviews[0].sizeThatFits(.unspecified)
        let gap = CGFloat(MetalSettingsMetrics.rowGap)
        let width = proposal.width.flatMap { $0.isFinite ? $0 : nil }
            ?? max(ideal.width, MetalSettingsMetrics.textMin) + gap + control.width
        let stacked = width < MetalSettingsMetrics.textMin + gap + control.width
        let textWidth = max(.zero, stacked ? width : width - gap - control.width)
        let text = subviews[0].sizeThatFits(ProposedViewSize(width: textWidth, height: nil))
        return Measurement(text: text, control: control, width: width, stacked: stacked)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard subviews.count == 2 else { return .zero }
        let measurement = measure(proposal, subviews)
        return CGSize(width: measurement.width, height: measurement.height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 2 else { return }
        let measurement = measure(ProposedViewSize(width: bounds.width, height: nil), subviews)
        let textWidth = measurement.stacked ? bounds.width
            : bounds.width - MetalSettingsMetrics.rowGap - measurement.control.width
        subviews[0].place(
            at: CGPoint(x: bounds.minX, y: bounds.minY + (measurement.stacked ? .zero : (bounds.height - measurement.text.height) / 2)),
            anchor: .topLeading, proposal: ProposedViewSize(width: max(.zero, textWidth), height: measurement.text.height))
        subviews[1].place(
            at: CGPoint(x: measurement.stacked ? bounds.minX : bounds.maxX - measurement.control.width,
                        y: measurement.stacked ? bounds.minY + measurement.text.height + MetalSettingsMetrics.stackGap
                            : bounds.midY - measurement.control.height / 2),
            anchor: .topLeading, proposal: ProposedViewSize(measurement.control))
    }
}
