import SwiftUI

/// Time as a dimension of the canvas. A nil selection means Now.
/// The track, fill, marks, ticks and knob all come from MetalSlider's recipe.
public struct MetalTimeScrubber: View {
    let range: ClosedRange<Date>
    @Binding var selection: Date?
    let marks: [Date]
    let format: (Date) -> String

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(range: ClosedRange<Date>, selection: Binding<Date?>,
                marks: [Date] = [],
                format: @escaping (Date) -> String = MetalTimeScrubber.defaultFormat) {
        self.range = range
        _selection = selection
        self.marks = marks
        self.format = format
    }

    public static func defaultFormat(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE d MMM · HH:mm"
        return formatter.string(from: date).uppercased()
    }

    private var span: TimeInterval {
        max(.leastNonzeroMagnitude, range.upperBound.timeIntervalSince(range.lowerBound))
    }

    private func fraction(_ date: Date) -> Double {
        min(max(date.timeIntervalSince(range.lowerBound) / span, .zero), .one)
    }

    private var dayTicks: [MetalSliderTick] {
        let calendar = Calendar.current
        var starts: [Date] = []
        var day = calendar.startOfDay(for: range.lowerBound)
        while day < range.upperBound {
            starts.append(day)
            guard let next = calendar.date(byAdding: .day, value: 1, to: day) else { break }
            day = next
        }
        let earlier = starts.filter { !calendar.isDate($0, inSameDayAs: range.upperBound) }
        let step = max(1, Int((Double(earlier.count) / 6).rounded(.up)))
        let labels = earlier.enumerated().compactMap { offset, date -> MetalSliderTick? in
            guard offset % step == 0 else { return nil }
            let formatter = DateFormatter()
            formatter.dateFormat = "EEE"
            let noon = calendar.date(byAdding: .hour, value: 12, to: date) ?? date
            return MetalSliderTick(at: fraction(noon), label: formatter.string(from: date).uppercased())
        }
        return labels + [MetalSliderTick(at: 1, label: "TODAY")]
    }

    public var body: some View {
        let readout = selection.map(format) ?? "NOW"
        let value = Binding<Double>(
            get: { (selection ?? range.upperBound).timeIntervalSince1970 },
            set: { next in
                let date = Date(timeIntervalSince1970: next)
                selection = range.upperBound.timeIntervalSince(date) < span * MetalScrubberMetrics.snap
                    ? nil : min(max(date, range.lowerBound), range.upperBound)
            }
        )
        ZStack(alignment: .topLeading) {
            MetalSlider(
                value: value,
                in: range.lowerBound.timeIntervalSince1970...range.upperBound.timeIntervalSince1970,
                step: MetalScrubberMetrics.stepMs / 1000,
                largeStep: MetalScrubberMetrics.largeStepMs / 1000,
                marks: marks.map(fraction), ticks: dayTicks,
                label: "Memory", valueText: { _ in "MEMORY · \(readout)" }
            )
            HStack(spacing: MetalScrubberMetrics.readoutGap) {
                HStack(spacing: MetalScrubberMetrics.glyphGap) {
                    MetalIcon(.clock, size: MetalScrubberMetrics.readoutGlyph)
                        .offset(y: MetalScrubberMetrics.glyphDrop)
                    MetalLabel("MEMORY · \(readout)", style: .engraved)
                }
                if selection != nil {
                    Button {
                        withMetalAnimation(.part, reduceMotion: reduceMotion) { selection = nil }
                    } label: {
                        MetalLabel("NOW", style: .engraved, tone: .accent)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Back to Now")
                }
            }
        }
        .frame(width: MetalScrubberMetrics.width, height: MetalScrubberMetrics.height)
    }
}

public typealias MetalMemoryScrubber = MetalTimeScrubber
