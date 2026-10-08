import SwiftUI

/// Time as a dimension of the canvas. A nil selection means Now.
/// The bar hands its track to MetalDial while winding, then takes it back at rest.
public struct MetalTimeScrubber: View {
    public enum Shape: Sendable { case bar, dial }
    let range: ClosedRange<Date>
    @Binding var selection: Date?
    let marks: [Date]
    let format: (Date) -> String
    let onFocusChange: ((Bool) -> Void)?
    let onScrubChange: ((Bool) -> Void)?
    let isScrubbing: Bool
    let shape: Shape
    @State private var wound: Bool
    @State private var initialCurl: Double?

    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion

    public init(range: ClosedRange<Date>, selection: Binding<Date?>,
                marks: [Date] = [],
                format: @escaping (Date) -> String = MetalTimeScrubber.defaultFormat,
                onFocusChange: ((Bool) -> Void)? = nil,
                onScrubChange: ((Bool) -> Void)? = nil,
                isScrubbing: Bool = false,
                shape: Shape = .bar) {
        self.range = range
        _selection = selection
        self.marks = marks
        self.format = format
        self.onFocusChange = onFocusChange
        self.onScrubChange = onScrubChange
        self.isScrubbing = isScrubbing
        self.shape = shape
        _wound = State(initialValue: shape == .dial)
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
        // One set for both shapes: the dial takes the bar's track over at curl 0, so its ticks are
        // the bar's (the dial fades tick labels as it winds).
        let earlier = starts.filter { !calendar.isDate($0, inSameDayAs: range.upperBound) }
        let step = max(1, Int((Double(earlier.count) / 6).rounded(.up)))
        // One earlier day is only the range's margin, not history: no lone "SAT" on a new canvas.
        guard earlier.count >= 2 || selection != nil else { return [] }
        let labels = earlier.enumerated().compactMap { offset, date -> MetalSliderTick? in
            guard offset % step == 0 else { return nil }
            let formatter = DateFormatter()
            formatter.dateFormat = "EEE"
            let noon = calendar.date(byAdding: .hour, value: 12, to: date) ?? date
            return MetalSliderTick(at: fraction(noon), label: formatter.string(from: date).uppercased())
        }
        // At Now the knob is the today mark and would cover the label; in the past it shows the way back.
        return labels + (selection == nil ? [] : [MetalSliderTick(at: 1, label: "TODAY")])
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
        // One layout and one readout in both shapes (docs/ONE-SHAPE.md): the bar hands its track to
        // the dial at curl 0 and takes it back there, and the readout is the same view throughout,
        // so the wind moves things instead of swapping them. Positions travel on the surface spring,
        // the dial's own wind.
        MetalTimeScrubberLayout(shape: shape) {
            Group {
                if wound {
                    MetalDial(
                        value: value,
                        in: range.lowerBound.timeIntervalSince1970...range.upperBound.timeIntervalSince1970,
                        step: MetalScrubberMetrics.stepMs / 1000,
                        largeStep: MetalScrubberMetrics.largeStepMs / 1000,
                        curl: shape == .dial ? .one : .zero,
                        initialCurl: initialCurl,
                        barLength: MetalScrubberMetrics.width - MetalRecipes.dial.points("self.knob"),
                        marks: marks.map(fraction), ticks: dayTicks, tickStyle: .engraved,
                        label: "Memory", valueText: { _ in "MEMORY · \(readout)" },
                        onCurlRest: { curl in
                            if curl == .zero && shape == .bar { wound = false; initialCurl = nil }
                        },
                        onFocusChange: onFocusChange,
                        onDragChange: onScrubChange
                    )
                } else {
                    MetalSlider(value: value,
                        in: range.lowerBound.timeIntervalSince1970...range.upperBound.timeIntervalSince1970,
                        step: MetalScrubberMetrics.stepMs / 1000,
                        largeStep: MetalScrubberMetrics.largeStepMs / 1000,
                        marks: marks.map(fraction), ticks: dayTicks, tickStyle: .engraved,
                        label: "Memory", valueText: { _ in "MEMORY · \(readout)" },
                        onFocusChange: onFocusChange, onDragChange: onScrubChange,
                        isExternallyDragging: isScrubbing)
                    .frame(width: MetalScrubberMetrics.width)
                }
            }
            // As a bar the track sits in a slot one dial knob tall: the dial at curl 0 is exactly
            // that, its track centred, so the hand-off from slider to dial cannot move the line.
            .frame(height: wound ? nil : MetalRecipes.dial.points("self.knob"))
            readoutView(readout, shape: shape)
        }
        .animation(MetalMotion.resolve(.surface, reduceMotion: reduceMotion).animation, value: shape)
        .onChange(of: shape) { _, next in
            if next == .dial && !wound { initialCurl = .zero; wound = true }
        }
    }

    private func readoutView(_ readout: String, shape: Shape) -> some View {
        HStack(spacing: MetalScrubberMetrics.readoutGap) {
                if shape == .dial {
                    VStack(alignment: .leading, spacing: MetalScrubberMetrics.glyphGap) {
                        MetalLabel("MEMORY", style: .small)
                        ForEach(Array(readout.components(separatedBy: " · ").enumerated()), id: \.offset) { _, line in
                            MetalLabel(line, style: .engraved)
                        }
                    }
                    .allowsHitTesting(false)
                    .transition(.opacity)
                } else {
                    HStack(spacing: MetalScrubberMetrics.glyphGap) {
                        MetalIcon(.clock, size: MetalScrubberMetrics.readoutGlyph)
                            .offset(y: MetalScrubberMetrics.glyphDrop)
                        MetalLabel("MEMORY · \(readout)", style: .engraved)
                    }
                    .allowsHitTesting(false)
                    .transition(.opacity)
                }
                if selection != nil {
                    Button {
                        withMetalAnimation(.part, reduceMotion: reduceMotion) { selection = nil }
                    } label: {
                        HStack(spacing: MetalScrubberMetrics.glyphGap) {
                            MetalIcon(.clock, size: MetalRecipes.button.points("compact.glyph"))
                                .foregroundStyle((MetalRecipes.label.color("accent.color", colorway: MetalRecipeColorway(colorway))?.color) ?? .primary)
                            MetalLabel("NOW", style: .engraved, tone: .accent)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Back to Now")
                }
        }
    }
}

public typealias MetalMemoryScrubber = MetalTimeScrubber
