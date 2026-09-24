import SwiftUI

// Memory scrubber. Mirrors components/memory-scrubber from MetalScrubberMetrics and the colorway tokens.

/// Time as a dimension of the surface. `selection` is nil at now.
public struct MetalMemoryScrubber: View {
    let range: ClosedRange<Date>
    @Binding var selection: Date?
    let marks: [Date]
    let format: (Date) -> String

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dragging = false

    public init(range: ClosedRange<Date>, selection: Binding<Date?>, marks: [Date] = [], format: @escaping (Date) -> String = MetalMemoryScrubber.defaultFormat) {
        self.range = range
        _selection = selection
        self.marks = marks
        self.format = format
    }

    public static func defaultFormat(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE d MMM · HH:mm"
        return f.string(from: date).uppercased()
    }

    private var span: TimeInterval { max(1, range.upperBound.timeIntervalSince(range.lowerBound)) }
    private func fraction(_ d: Date) -> CGFloat { CGFloat(d.timeIntervalSince(range.lowerBound) / span) }

    private func set(_ t: Date) {
        // Within 1 % of now it snaps to now.
        selection = range.upperBound.timeIntervalSince(t) < span * MetalScrubberMetrics.snap ? nil : min(max(t, range.lowerBound), range.upperBound)
    }

    /// Day starts across the range, at most seven labels (every nth day), today last.
    private var dayMarks: [Date] {
        let cal = Calendar.current
        var days: [Date] = []
        var d = cal.startOfDay(for: range.lowerBound)
        while d <= range.upperBound { days.append(d); d = cal.date(byAdding: .day, value: 1, to: d)! }
        let step = max(1, Int((Double(days.count) / 6).rounded(.up)))
        return days.enumerated().filter { $0.offset % step == 0 || $0.offset == days.count - 1 }.map(\.element)
    }

    private func dayLabel(_ d: Date) -> String {
        if Calendar.current.isDate(d, inSameDayAs: range.upperBound) { return "TODAY" }
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f.string(from: d).uppercased()
    }

    public var body: some View {
        let t = colorway.tokens
        let label = MetalType.label
        let value = selection ?? range.upperBound
        let read = selection.map(format) ?? "NOW"
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: MetalScrubberMetrics.readoutGap) {
                HStack(spacing: 5) {
                    MetalIcon(.clock, size: MetalScrubberMetrics.readoutGlyph)
                    Text("MEMORY · \(read)")
                }
                .font(.metal(label)).tracking(label.trackingPoints).foregroundColor(t.engrave.color)
                if selection != nil {
                    Button("NOW") { withMetalAnimation(.part, reduceMotion: reduceMotion) { selection = nil } }
                        .buttonStyle(.plain)
                        .font(.metal(label)).tracking(label.trackingPoints).foregroundColor(MetalShared.greenDeep.color)
                }
            }
            .frame(height: MetalScrubberMetrics.trackTop - 4, alignment: .top)
            GeometryReader { geo in
                let w = geo.size.width
                let x = fraction(value) * w
                ZStack(alignment: .leading) {
                    Color.clear
                        .metalRecipe(MetalRecipe(fill: MetalGradient(angle: 180, stops: [.init(t.wellTop, 0), .init(t.wellBot, 1)]), shadows: t.well), in: Capsule())
                        .frame(height: MetalScrubberMetrics.track)
                    Capsule().fill(MetalScrubberMetrics.fill.linearGradient).opacity(MetalScrubberMetrics.fillOpacity)
                        .frame(width: max(MetalScrubberMetrics.track, x), height: MetalScrubberMetrics.track)
                    ForEach(marks, id: \.self) { m in
                        RoundedRectangle(cornerRadius: 1).fill(t.scrubberMark.color)
                            .frame(width: MetalScrubberMetrics.markWidth, height: MetalScrubberMetrics.markHeight)
                            .offset(x: MetalScrubberMetrics.inset + fraction(m) * (w - 2 * MetalScrubberMetrics.inset) - MetalScrubberMetrics.markWidth / 2)
                    }
                    Circle()
                        .fill(AngularGradient(colors: MetalScrubberMetrics.knobSweep.map(\.color), center: .center, startAngle: .degrees(200 - 90), endAngle: .degrees(200 + 270)))
                        .overlay { MetalInnerShadows(layers: MetalScrubberMetrics.knobSh.filter(\.inset), shape: Circle()) }
                        .background { MetalOuterShadows(layers: MetalScrubberMetrics.knobSh.filter { !$0.inset }, shape: Circle()) }
                        .frame(width: MetalScrubberMetrics.knob, height: MetalScrubberMetrics.knob)
                        .offset(x: x - MetalScrubberMetrics.knob / 2)
                }
                .frame(height: MetalScrubberMetrics.knob)
                .contentShape(Rectangle())
                .gesture(DragGesture(minimumDistance: 0)
                    .onChanged { g in
                        dragging = true
                        set(range.lowerBound.addingTimeInterval(Double(g.location.x / max(1, w)) * span))
                    }
                    .onEnded { _ in dragging = false })
                .animation(dragging ? nil : MetalMotion.resolve(.part, reduceMotion: reduceMotion).animation, value: value)
            }
            .frame(height: MetalScrubberMetrics.knob)
            GeometryReader { geo in
                let w = geo.size.width - 2 * MetalScrubberMetrics.inset
                ForEach(dayMarks, id: \.self) { d in
                    VStack(spacing: 2) {
                        Rectangle().fill(t.scrubberDayTick.color).frame(width: 1, height: MetalScrubberMetrics.dayTick)
                        Text(dayLabel(d)).font(.metal(label)).tracking(label.trackingPoints).foregroundColor(t.engrave.color).fixedSize()
                    }
                    .position(x: MetalScrubberMetrics.inset + min(max(fraction(d.addingTimeInterval(43200)), 0.04), 0.96) * w, y: 10)
                }
            }
            .frame(height: 20)
            .offset(y: -6)
        }
        .frame(width: MetalScrubberMetrics.width, height: MetalScrubberMetrics.height + 14, alignment: .topLeading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Scrub through time")
        .accessibilityValue(selection == nil ? "Now" : read)
        .accessibilityAdjustableAction { direction in
            let step = MetalScrubberMetrics.stepMs / 1000
            let next = value.addingTimeInterval(direction == .increment ? step : -step)
            withMetalAnimation(.part, reduceMotion: reduceMotion) { set(next) }
        }
    }
}
