import SwiftUI

/// Retains one handled track while its readout moves from above the bar to beside the disc.
/// In a narrow slot the dial's readout goes above it, as on the web's wrapping coil.
struct MetalTimeScrubberLayout: Layout {
    let shape: MetalTimeScrubber.Shape

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard subviews.count == 2 else { return .zero }
        let dial = subviews[0].sizeThatFits(.unspecified), read = subviews[1].sizeThatFits(.unspecified)
        let gap = MetalScrubberMetrics.readoutGap
        if shape == .bar {
            return CGSize(width: max(dial.width, read.width), height: max(MetalScrubberMetrics.height, dial.height + read.height + gap))
        }
        let width = dial.width + gap + read.width
        let stacked = proposal.width.map { $0 < width } ?? false
        return CGSize(width: stacked ? max(dial.width, read.width) : width,
                      height: stacked ? dial.height + read.height + gap : max(dial.height, read.height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 2 else { return }
        let dial = subviews[0].sizeThatFits(.unspecified), read = subviews[1].sizeThatFits(.unspecified)
        let gap = MetalScrubberMetrics.readoutGap
        let stacked = shape == .bar || bounds.width < dial.width + gap + read.width
        let stackedOrigin = read.height + gap
        let centeredOrigin = (bounds.height - dial.height) / 2
        // As a bar the track is centred in the scrubber's height (the tools' centre line) with the
        // readout over its top, as the bar has always sat.
        let dialY = shape == .bar ? centeredOrigin
            : stacked ? stackedOrigin : centeredOrigin
        subviews[0].place(at: CGPoint(x: bounds.minX, y: bounds.minY + dialY), anchor: .topLeading, proposal: ProposedViewSize(dial))
        subviews[1].place(at: CGPoint(x: bounds.minX + (stacked ? .zero : dial.width + gap),
                                     y: bounds.minY + (stacked ? .zero : (bounds.height - read.height) / 2)),
                          anchor: .topLeading, proposal: ProposedViewSize(read))
    }
}
