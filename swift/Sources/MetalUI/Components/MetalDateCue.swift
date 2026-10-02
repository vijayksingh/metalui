import SwiftUI

private enum MetalCivilDay {
    static var calendar: Foundation.Calendar {
        var calendar = Foundation.Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return calendar
    }
    static func date(_ words: String) -> Date {
        let parts = words.split(separator: "-").compactMap { Int($0) }
        precondition(words.count == 10 && parts.count == 3 && parts[0] > 0, "MetalDateCue requires civil YYYY-MM-DD dates")
        let date = calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))!
        precondition(civil(date) == words, "MetalDateCue requires valid civil dates")
        return date
    }
    static func civil(_ date: Date) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    static func ordinal(_ words: String) -> Double { date(words).timeIntervalSince1970 / (24 * 60 * 60) }
    static func civil(_ ordinal: Double) -> String { civil(Date(timeIntervalSince1970: ordinal.rounded() * (24 * 60 * 60))) }
    static func format(_ words: String, locale: Locale, template: String) -> String {
        let formatter = DateFormatter(); formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = locale; formatter.setLocalizedDateFormatFromTemplate(template)
        return formatter.string(from: date(words))
    }
}

/// An inline civil date. The explicit today snapshot gives relative words one stable meaning.
public struct MetalDateCue: View {
    private let label: String
    @Binding private var value: String
    private let today: String
    private let bounds: ClosedRange<String>
    private let footprint: [String]
    private let locale: Locale
    private let hint: Bool
    private let raw: Bool
    private let readOnly: Bool
    private let format: ((String) -> String)?
    private let source: ((String) -> String)?
    private let onBegin: () -> Void
    private let onSourceChange: (String) -> Void
    private let onCommit: () -> Void
    private let onCancel: (MetalNumericCueCancelReason) -> Void
    @Environment(\.isEnabled) private var enabled
    @State private var open = false
    @State private var changed = false

    public init(_ label: String, value: Binding<String>, today: String, in bounds: ClosedRange<String>, footprint: [String],
                locale: Locale = Locale(identifier: "en_GB"), raw: Bool = false, hint: Bool = true, readOnly: Bool = false,
                format: ((String) -> String)? = nil, source: ((String) -> String)? = nil,
                onBegin: @escaping () -> Void = {}, onSourceChange: @escaping (String) -> Void = { _ in },
                onCommit: @escaping () -> Void = {}, onCancel: @escaping (MetalNumericCueCancelReason) -> Void = { _ in }) {
        _ = MetalCivilDay.date(value.wrappedValue); _ = MetalCivilDay.date(today)
        _ = MetalCivilDay.date(bounds.lowerBound); _ = MetalCivilDay.date(bounds.upperBound)
        self.label = label; _value = value; self.today = today; self.bounds = bounds; self.footprint = footprint
        self.locale = locale; self.raw = raw; self.hint = hint; self.readOnly = readOnly; self.format = format; self.source = source
        self.onBegin = onBegin; self.onSourceChange = onSourceChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    public static func relativeWords(_ day: String, today: String) -> String {
        let delta = Int(MetalCivilDay.ordinal(day) - MetalCivilDay.ordinal(today))
        if delta == -1 { return "yesterday" }; if delta == 0 { return "today" }; if delta == 1 { return "tomorrow" }
        if abs(delta) <= 7 {
            return "\(delta < 0 ? "last" : "next") \(MetalCivilDay.format(day, locale: Locale(identifier: "en_US"), template: "EEEE"))"
        }
        return day
    }
    private func words(_ day: String) -> String { source?(day) ?? Self.relativeWords(day, today: today) }
    private func display(_ day: String) -> String {
        if let format { return format(day) }
        if abs(MetalCivilDay.ordinal(day) - MetalCivilDay.ordinal(today)) <= 7 { return words(day) }
        return MetalCivilDay.format(day, locale: locale, template: day.prefix(4) == today.prefix(4) ? "EEEMMMd" : "EEEMMMdy")
    }
    private var resolved: String { MetalCivilDay.format(value, locale: locale, template: "EEEEdMMMMy") }
    private var quantity: Binding<MetalNumericCueValue> {
        Binding(get: { MetalNumericCueValue(value: MetalCivilDay.ordinal(value), unit: "day") }, set: { value = MetalCivilDay.civil($0.value) })
    }
    private var selection: Binding<Date> {
        Binding(get: { MetalCivilDay.date(value) }, set: { date in
            guard enabled && !readOnly else { return }
            let day = MetalCivilDay.civil(date)
            if day != value { onBegin(); value = day; onSourceChange(words(day)); onCommit(); MetalHaptic.detent.perform() }
            open = false
        })
    }
    public var body: some View {
        MetalPopover(label, description: resolved, isPresented: $open) {
            MetalNumericCue(label, value: quantity,
                units: [MetalNumericCueUnit(id: "day", label: "calendar day", factor: 1, step: 1, smallStep: 1, largeStep: 7,
                    format: { display(MetalCivilDay.civil($0)) }, source: { words(MetalCivilDay.civil($0)) })],
                in: MetalCivilDay.ordinal(bounds.lowerBound)...MetalCivilDay.ordinal(bounds.upperBound), footprint: footprint,
                kind: .date, meaning: .time, raw: raw, readOnly: readOnly, allowTyping: false, locale: locale, resolved: resolved, hint: hint,
                onOpenPicker: { if enabled && !readOnly { open = true } },
                onBegin: { changed = false }, onSourceChange: { words in
                    if !changed { changed = true; onBegin() }; onSourceChange(words)
                }, onCommit: { if changed { onCommit() }; changed = false },
                onCancel: { reason in if changed { onCancel(reason) }; changed = false })
                .highPriorityGesture(LongPressGesture(minimumDuration: MetalRecipes.button.durationSeconds("hold.duration"), maximumDistance: MetalSpace.s2).onEnded { _ in
                    if enabled && !readOnly { open = true }
                })
                .accessibilityHint("Arrow keys change days. Shift changes weeks. Hold, Option Down, Return or Space opens Calendar.")
        } content: {
            MetalCalendar("\(label) calendar", selection: selection, in: MetalCivilDay.date(bounds.lowerBound)...MetalCivilDay.date(bounds.upperBound))
                .calendarTimeZone(MetalCivilDay.calendar.timeZone).calendarLocale(locale)
        }
        .onChange(of: enabled) { _, next in if !next { open = false } }
        .onChange(of: readOnly) { _, next in if next { open = false } }
    }
}
