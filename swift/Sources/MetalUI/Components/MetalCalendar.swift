import SwiftUI

/// Inclusive calendar-day range. A start without an end is an unfinished selection.
public struct MetalDateRange: Equatable {
    public var start: Date?
    public var end: Date?
    public init(start: Date? = nil, end: Date? = nil) { self.start = start; self.end = end }
}

/// The shared month grid: single, range, or independent dates, with one roving keyboard focus.
public struct MetalCalendar: View {
    private enum Selection { case single(Binding<Date>), range(Binding<MetalDateRange>), multiple(Binding<Set<Date>>) }
    private let label: String
    private let selection: Selection
    private let limits: ClosedRange<Date>?
    private var monthBinding: Binding<Date>?
    private var locale: Locale = .current
    private var timeZone: TimeZone = .current
    private var weekStartsOn: Int?
    private var weekNumbers = false
    private var months = 1
    private var minDays = 1
    private var maxDays: Int?
    private var isDateUnavailable: (Date) -> Bool = { _ in false }
    private var unavailableLabel = "Unavailable"
    private var markedDays: (Date) -> String? = { _ in nil }
    private var readOnly = false
    @State private var ownMonth: Date
    @State private var preview: Date?
    @State private var hovering: Date?
    @State private var jump = false
    @State private var later = true
    @FocusState private var focused: Date?
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion

    public init(_ label: String, selection: Binding<Date>, in range: ClosedRange<Date>? = nil, month: Binding<Date>? = nil) {
        self.label = label; self.selection = .single(selection); limits = range; monthBinding = month
        _ownMonth = State(initialValue: Self.monthStart(month?.wrappedValue ?? selection.wrappedValue))
    }
    public init(_ label: String, range: Binding<MetalDateRange>, in limits: ClosedRange<Date>? = nil, month: Binding<Date>? = nil, minDays: Int = 1, maxDays: Int? = nil) {
        self.label = label; selection = .range(range); self.limits = limits; monthBinding = month
        self.minDays = max(1, minDays); self.maxDays = maxDays
        _ownMonth = State(initialValue: Self.monthStart(month?.wrappedValue ?? range.wrappedValue.start ?? Date()))
    }
    public init(_ label: String, dates: Binding<Set<Date>>, in limits: ClosedRange<Date>? = nil, month: Binding<Date>? = nil) {
        self.label = label; selection = .multiple(dates); self.limits = limits; monthBinding = month
        _ownMonth = State(initialValue: Self.monthStart(month?.wrappedValue ?? dates.wrappedValue.sorted().first ?? Date()))
    }
    public func calendarLocale(_ locale: Locale, weekStartsOn: Int? = nil, weekNumbers: Bool = false) -> Self {
        var view = self; view.locale = locale; view.weekStartsOn = weekStartsOn; view.weekNumbers = weekNumbers; return view
    }
    public func calendarMonths(_ count: Int) -> Self { var view = self; view.months = max(1, count); return view }
    public func calendarUnavailable(_ label: String = "Unavailable", predicate: @escaping (Date) -> Bool) -> Self {
        var view = self; view.isDateUnavailable = predicate; view.unavailableLabel = label; return view
    }
    public func calendarMarks(_ marks: @escaping (Date) -> String?) -> Self { var view = self; view.markedDays = marks; return view }
    public func calendarReadOnly(_ value: Bool = true) -> Self { var view = self; view.readOnly = value; return view }

    private var calendar: Foundation.Calendar {
        var value = Foundation.Calendar(identifier: .gregorian); value.locale = locale; value.timeZone = timeZone
        if let weekStartsOn { value.firstWeekday = (weekStartsOn % 7 + 7) % 7 + 1 }
        return value
    }
    private var month: Date { monthStart(monthBinding?.wrappedValue ?? ownMonth) }
    private func monthStart(_ date: Date) -> Date { calendar.date(from: calendar.dateComponents([.year, .month], from: date))! }
    public func calendarTimeZone(_ zone: TimeZone) -> Self {
        var view = self; view.timeZone = zone
        view._ownMonth = State(initialValue: view.monthStart(monthBinding?.wrappedValue ?? firstChosen ?? Date()))
        return view
    }
    private static func monthStart(_ date: Date) -> Date { Foundation.Calendar.current.date(from: Foundation.Calendar.current.dateComponents([.year, .month], from: date))! }
    private func addDays(_ date: Date, _ count: Int) -> Date { calendar.date(byAdding: .day, value: count, to: date)! }
    private func addMonths(_ date: Date, _ count: Int) -> Date { calendar.date(byAdding: .month, value: count, to: date)! }
    private func same(_ a: Date?, _ b: Date?) -> Bool { guard let a, let b else { return false }; return calendar.isDate(a, inSameDayAs: b) }
    private func outside(_ date: Date) -> Bool {
        guard let limits else { return false }; return calendar.startOfDay(for: date) < calendar.startOfDay(for: limits.lowerBound) || calendar.startOfDay(for: date) > calendar.startOfDay(for: limits.upperBound)
    }
    private var firstChosen: Date? {
        switch selection { case .single(let binding): binding.wrappedValue; case .range(let binding): binding.wrappedValue.start; case .multiple(let binding): binding.wrappedValue.sorted().first }
    }
    private var currentRange: MetalDateRange? { if case .range(let binding) = selection { return binding.wrappedValue }; return nil }
    private var shownRange: MetalDateRange? {
        guard let range = currentRange, let start = range.start, range.end == nil, let preview else { return currentRange }
        let candidate = MetalDateRange(start: min(start, preview), end: max(start, preview)); return valid(candidate) ? candidate : range
    }
    private func selected(_ date: Date) -> Bool {
        switch selection {
        case .single(let binding): return same(date, binding.wrappedValue)
        case .multiple(let binding): return binding.wrappedValue.contains { same(date, $0) }
        case .range(let binding): let range = binding.wrappedValue; guard let start = range.start else { return false }; return same(date, start) || range.end.map { date >= start && date <= $0 } == true
        }
    }
    private func valid(_ range: MetalDateRange) -> Bool {
        guard let start = range.start, let end = range.end else { return false }
        let count = (calendar.dateComponents([.day], from: start, to: end).day ?? .zero) + 1
        guard count >= minDays, maxDays.map({ count <= $0 }) ?? true else { return false }
        for offset in 0..<count { let d = addDays(start, offset); if outside(d) || isDateUnavailable(d) { return false } }
        return true
    }
    private func choose(_ date: Date) {
        guard !outside(date), !isDateUnavailable(date), !readOnly else { return }
        withMetalAnimation(.part, reduceMotion: reduceMotion) {
            switch selection {
            case .single(let binding): binding.wrappedValue = date
            case .multiple(let binding):
                if let existing = binding.wrappedValue.first(where: { same(date, $0) }) { binding.wrappedValue.remove(existing) } else { binding.wrappedValue.insert(date) }
            case .range(let binding):
                if let start = binding.wrappedValue.start, binding.wrappedValue.end == nil {
                    let candidate = MetalDateRange(start: min(start, date), end: max(start, date)); guard valid(candidate) else { return }; binding.wrappedValue = candidate
                } else { binding.wrappedValue = MetalDateRange(start: date) }
            }
        }
        preview = nil; moveFocus(date)
    }
    private func show(_ date: Date) {
        let target = monthStart(date); guard target != month else { return }; later = target > month
        withMetalAnimation(.settle, reduceMotion: reduceMotion) { if let monthBinding { monthBinding.wrappedValue = target } else { ownMonth = target } }
    }
    private func moveFocus(_ date: Date) {
        let target = limits.map { min(max(calendar.startOfDay(for: date), calendar.startOfDay(for: $0.lowerBound)), calendar.startOfDay(for: $0.upperBound)) } ?? date
        if target < month || target >= addMonths(month, months) { show(target) }; focused = target
        if currentRange?.start != nil && currentRange?.end == nil { preview = target }
    }
    private func formatted(_ date: Date, _ template: String) -> String {
        let formatter = DateFormatter(); formatter.locale = locale; formatter.timeZone = timeZone; formatter.setLocalizedDateFormatFromTemplate(template); return formatter.string(from: date)
    }
    public var body: some View {
        let recipe = MetalRecipes.calendar
        VStack(spacing: recipe.points("head.gap")) {
            HStack(spacing: recipe.points("head.gap")) {
                Button { show(addMonths(month, -1)) } label: { MetalMorphIcon(.chevron, size: recipe.points("step.glyph"), turn: .left) }.buttonStyle(MetalButtonStyle(size: .compact)).accessibilityLabel("Previous month").disabled(limits.map { month <= monthStart($0.lowerBound) } ?? false)
                Spacer(minLength: .zero)
                Button { jump = true } label: { Text(formatted(month, "MMMM yyyy")).font(.metal(MetalType.title)).contentTransition(.numericText(countsDown: !later)) }.buttonStyle(.plain).accessibilityLabel("Choose month and year: \(formatted(month, "MMMM yyyy"))").popover(isPresented: $jump) {
                    VStack(spacing: MetalLayout.gapRelated) {
                        Stepper("Year \(calendar.component(.year, from: month))", value: Binding(get: { calendar.component(.year, from: month) }, set: { year in if let date = calendar.date(from: DateComponents(year: year, month: calendar.component(.month, from: month), day: 1)) { show(date) } }), in: (limits.map { calendar.component(.year, from: $0.lowerBound) } ?? 1)...(limits.map { calendar.component(.year, from: $0.upperBound) } ?? 9999))
                        ForEach(1...12, id: \.self) { number in
                            let date = calendar.date(from: DateComponents(year: calendar.component(.year, from: month), month: number, day: 1))!
                            Button(formatted(date, "MMMM")) { show(date); jump = false }.buttonStyle(MetalButtonStyle(size: .compact)).disabled(limits.map { date < monthStart($0.lowerBound) || date > monthStart($0.upperBound) } ?? false)
                        }
                    }.padding(MetalLayout.gapRelated)
                }
                Spacer(minLength: .zero)
                Button { show(addMonths(month, 1)) } label: { MetalMorphIcon(.chevron, size: recipe.points("step.glyph"), turn: .right) }.buttonStyle(MetalButtonStyle(size: .compact)).accessibilityLabel("Next month").disabled(limits.map { addMonths(month, months - 1) >= monthStart($0.upperBound) } ?? false)
            }.frame(height: recipe.points("head.height"))
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .top, spacing: MetalLayout.gapGroup) { panels }
                VStack(spacing: MetalLayout.gapGroup) { panels }
            }
            if currentRange?.start != nil && currentRange?.end == nil { Text("Choose the end date").font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink3.color) }
        }
        .padding(recipe.points("self.pad"))
        .foregroundStyle(colorway.tokens.ink.color)
        .accessibilityElement(children: .contain).accessibilityLabel(label)
        .onChange(of: firstChosen) { _, next in if let next, monthBinding == nil, next < month || next >= addMonths(month, months) { show(next) } }
    }
    @ViewBuilder private var panels: some View {
        ForEach(0..<months, id: \.self) { index in
            let at = addMonths(month, index)
            VStack(spacing: .zero) {
                if months > 1 { Text(formatted(at, "MMMM yyyy")).font(.metal(MetalType.ui)) }
                monthGrid(at)
            }.id(at).transition(.asymmetric(insertion: .opacity.combined(with: .offset(x: reduceMotion ? .zero : (later ? MetalMotionTokens.content : -MetalMotionTokens.content))), removal: .opacity))
        }
    }
    private func monthGrid(_ at: Date) -> some View {
        let recipe = MetalRecipes.calendar
        let lead = (calendar.component(.weekday, from: at) - calendar.firstWeekday + 7) % 7
        let days = (0..<42).map { addDays(at, $0 - lead) }
        return Grid(horizontalSpacing: recipe.points("day.gap"), verticalSpacing: recipe.points("day.gap")) {
            GridRow {
                if weekNumbers { Text("Wk").font(.metal(MetalType.meta)).frame(width: recipe.points("day.size"), height: recipe.points("day.size")) }
                ForEach(0..<7, id: \.self) { index in Text(formatted(days[index], "EEEEE")).font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink3.color).frame(width: recipe.points("day.size"), height: recipe.points("day.size")).accessibilityLabel(formatted(days[index], "EEEE")) }
            }
            ForEach(0..<6, id: \.self) { row in
                GridRow {
                    if weekNumbers { let iso = Foundation.Calendar(identifier: .iso8601); Text("\(iso.component(.weekOfYear, from: days[row * 7]))").font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink3.color) }
                    ForEach(0..<7, id: \.self) { column in
                        let date = days[row * 7 + column]
                        if months > 1 && !calendar.isDate(date, equalTo: at, toGranularity: .month) { Color.clear.frame(width: recipe.points("day.size"), height: recipe.points("day.size")) } else { dayButton(date, at: at) }
                    }
                }
            }
        }.accessibilityElement(children: .contain).accessibilityLabel(formatted(at, "MMMM yyyy"))
    }
    private func dayButton(_ date: Date, at: Date) -> some View {
        let recipe = MetalRecipes.calendar
        let radius = recipe.points("day.radius")
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        let inRange = shownRange.map { range in range.start.map { date >= $0 } == true && range.end.map { date <= $0 } == true } ?? false
        let endpoint = same(date, shownRange?.start) || same(date, shownRange?.end)
        let startRadius = same(date, shownRange?.start) ? radius : Double.zero
        let endRadius = same(date, shownRange?.end) ? radius : Double.zero
        let rangeShape = UnevenRoundedRectangle(topLeadingRadius: startRadius, bottomLeadingRadius: startRadius, bottomTrailingRadius: endRadius, topTrailingRadius: endRadius)
        let rangeInset = -recipe.points("day.gap") / 2
        let rangeOpacity: Double = currentRange?.end == nil ? recipe.scalar("self.disabled") : .one
        let on = selected(date)
        let mark = markedDays(date)
        let blocked = isDateUnavailable(date)
        let full = formatted(date, "EEEE d MMMM yyyy")
        return Button { choose(date) } label: {
            Text("\(calendar.component(.day, from: date))").font(.metal(MetalType.ui)).monospacedDigit()
                .frame(width: recipe.points("day.size"), height: recipe.points("day.size"))
                .foregroundStyle((calendar.isDate(date, equalTo: at, toGranularity: .month) ? colorway.tokens.ink : colorway.tokens.ink3).color)
                .background {
                    if inRange {
                        Color.clear.metalObjectRecipe(MetalRecipes.switcher, part: "self", in: rangeShape)
                            .padding(.horizontal, rangeInset)
                            .opacity(rangeOpacity)
                    }
                    if on && (!inRange || endpoint) { Color.clear.metalObjectRecipe(MetalRecipes.switcher, part: "thumb", in: shape).transition(.scale(scale: reduceMotion ? .one : MetalRecipes.calendar.scalar("land.scale"))) }
                    else if hovering == date && !blocked { Color.clear.metalObjectRecipe(MetalRecipes.switcher, part: "self", in: shape) }
                }
                .overlay(alignment: .bottom) { if calendar.isDateInToday(date) { Circle().fill(MetalShared.focus.color).frame(width: recipe.points("today.size"), height: recipe.points("today.size")).padding(.bottom, recipe.points("today.offset")) } }
                .overlay(alignment: .topTrailing) { if mark != nil { Circle().fill(MetalShared.focus.color).frame(width: recipe.points("today.size"), height: recipe.points("today.size")).padding(recipe.points("today.offset")) } }
                .overlay { if focused == date { shape.strokeBorder(MetalShared.focus.color, lineWidth: MetalRecipes.switcher.points("option.focus-width")) } }
        }
        .buttonStyle(.plain).disabled(outside(date)).opacity(outside(date) || blocked ? recipe.scalar("self.disabled") : .one)
        .focused($focused, equals: date).focusEffectDisabled()
        .onHover { hovering = $0 ? date : nil; if $0 && currentRange?.start != nil && currentRange?.end == nil { preview = date } else if !$0 { preview = nil } }
        .onKeyPress(.leftArrow) { moveFocus(addDays(date, -1)); return .handled }.onKeyPress(.rightArrow) { moveFocus(addDays(date, 1)); return .handled }
        .onKeyPress(.upArrow) { moveFocus(addDays(date, -7)); return .handled }.onKeyPress(.downArrow) { moveFocus(addDays(date, 7)); return .handled }
        .onKeyPress(.pageUp) { moveFocus(addMonths(date, -1)); return .handled }.onKeyPress(.pageDown) { moveFocus(addMonths(date, 1)); return .handled }
        .onKeyPress(.home) { moveFocus(addDays(date, -(calendar.component(.weekday, from: date) - calendar.firstWeekday + 7) % 7)); return .handled }.onKeyPress(.end) { moveFocus(addDays(date, 6 - (calendar.component(.weekday, from: date) - calendar.firstWeekday + 7) % 7)); return .handled }
        .accessibilityLabel(full + (blocked ? ", \(unavailableLabel)" : "") + (mark.map { ", \($0)" } ?? ""))
        .accessibilityAddTraits(on ? [.isSelected] : [])
        .accessibilityHint(readOnly ? "Read only" : blocked ? unavailableLabel : calendar.isDateInToday(date) ? "Today" : "")
    }
}

public struct MetalDatePreset {
    public let label: String
    public let range: MetalDateRange
    public init(_ label: String, start: Date, end: Date? = nil) { self.label = label; range = MetalDateRange(start: start, end: end ?? start) }
}

/// A field well with native localized date segments and the shared MetalUI calendar.
/// A selected date with time is an instant; changing its time zone preserves that instant.
public struct MetalDatePicker: View {
    private enum Selection { case single(Binding<Date?>), range(Binding<MetalDateRange>), multiple(Binding<Set<Date>>) }
    private let label: String
    private let selection: Selection
    private let limits: ClosedRange<Date>?
    private let required: Bool
    private let readOnly: Bool
    private let name: String?
    private let showTime: Bool
    private let zoneBinding: Binding<TimeZone>?
    private let zones: [TimeZone]
    private let presets: [MetalDatePreset]
    private let minDays: Int
    private let maxDays: Int?
    private let unavailable: (Date) -> Bool
    private let unavailableLabel: String
    @Environment(\.metalColorway) private var colorway
    @Environment(\.locale) private var locale
    @Environment(\.isEnabled) private var isEnabled
    @State private var open = false
    @State private var error: String?

    public init(_ label: String, selection: Binding<Date?>, in limits: ClosedRange<Date>? = nil, required: Bool = false, readOnly: Bool = false, name: String? = nil, showTime: Bool = false, timeZone: Binding<TimeZone>? = nil, timeZones: [TimeZone] = [], presets: [MetalDatePreset] = [], unavailableLabel: String = "Unavailable", isDateUnavailable: @escaping (Date) -> Bool = { _ in false }) {
        self.label = label; self.selection = .single(selection); self.limits = limits; self.required = required; self.readOnly = readOnly; self.name = name; self.showTime = showTime; zoneBinding = timeZone; zones = timeZones; self.presets = presets; minDays = 1; maxDays = nil; unavailable = isDateUnavailable; self.unavailableLabel = unavailableLabel
    }
    public init(_ label: String, range: Binding<MetalDateRange>, in limits: ClosedRange<Date>? = nil, minDays: Int = 1, maxDays: Int? = nil, required: Bool = false, readOnly: Bool = false, name: String? = nil, presets: [MetalDatePreset] = [], unavailableLabel: String = "Unavailable", isDateUnavailable: @escaping (Date) -> Bool = { _ in false }) {
        self.label = label; selection = .range(range); self.limits = limits; self.minDays = max(1, minDays); self.maxDays = maxDays; self.required = required; self.readOnly = readOnly; self.name = name; self.presets = presets; showTime = false; zoneBinding = nil; zones = []; unavailable = isDateUnavailable; self.unavailableLabel = unavailableLabel
    }
    public init(_ label: String, dates: Binding<Set<Date>>, in limits: ClosedRange<Date>? = nil, required: Bool = false, readOnly: Bool = false, name: String? = nil, unavailableLabel: String = "Unavailable", isDateUnavailable: @escaping (Date) -> Bool = { _ in false }) {
        self.label = label; selection = .multiple(dates); self.limits = limits; self.required = required; self.readOnly = readOnly; self.name = name; minDays = 1; maxDays = nil; presets = []; showTime = false; zoneBinding = nil; zones = []; unavailable = isDateUnavailable; self.unavailableLabel = unavailableLabel
    }
    private var zone: TimeZone { zoneBinding?.wrappedValue ?? .current }
    private var calendar: Foundation.Calendar { var value = Foundation.Calendar(identifier: .gregorian); value.timeZone = zone; value.locale = locale; return value }
    private var chosen: Date? { switch selection { case .single(let binding): binding.wrappedValue; case .range(let binding): binding.wrappedValue.start; case .multiple(let binding): binding.wrappedValue.sorted().first } }
    private var end: Date? { if case .range(let binding) = selection { return binding.wrappedValue.end }; return nil }
    private var isRange: Bool { if case .range = selection { return true }; return false }
    private var isMultiple: Bool { if case .multiple = selection { return true }; return false }
    private func eligible(_ date: Date) -> Bool {
        if let limits, date < limits.lowerBound || date > limits.upperBound { error = "Date is outside the allowed range"; return false }
        if unavailable(date) { error = unavailableLabel; return false }; error = nil; return true
    }
    private func valid(_ range: MetalDateRange) -> Bool {
        guard let start = range.start else { if range.end != nil { error = "Choose the start date first"; return false }; return true }
        guard eligible(start) else { return false }; guard let end = range.end else { return true }
        let length = (calendar.dateComponents([.day], from: calendar.startOfDay(for: start), to: calendar.startOfDay(for: end)).day ?? .zero) + 1
        guard length >= minDays, maxDays.map({ length <= $0 }) ?? true else { error = "Choose an allowed date range"; return false }
        for offset in 0..<length { guard let date = calendar.date(byAdding: .day, value: offset, to: start), eligible(date) else { return false } }
        return true
    }
    private func set(_ date: Date, end: Bool = false) {
        guard isEnabled, !readOnly, eligible(date) else { return }
        switch selection {
        case .single(let binding): binding.wrappedValue = date
        case .multiple(let binding): binding.wrappedValue.insert(calendar.startOfDay(for: date))
        case .range(let binding):
            let candidate = end ? MetalDateRange(start: binding.wrappedValue.start, end: date) : MetalDateRange(start: date, end: binding.wrappedValue.end)
            if valid(candidate) { binding.wrappedValue = candidate }
        }
    }
    private func clear() {
        guard isEnabled, !readOnly else { return }
        switch selection { case .single(let binding): binding.wrappedValue = nil; case .range(let binding): binding.wrappedValue = MetalDateRange(); case .multiple(let binding): binding.wrappedValue = [] }; error = nil
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: MetalRecipes.calendar.points("head.gap")) {
            entryWell
            if showTime, let zoneBinding { zoneSelect(zoneBinding) }
            if let error { Text(error).font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.invalid.color).accessibilityLabel(error) }
        }
        .environment(\.timeZone, zone)
        .accessibilityElement(children: .contain).accessibilityLabel(label + (required ? ", required" : ""))
    }
    private var entryWell: some View {
        let recipe = MetalRecipes.field
        let shape = RoundedRectangle(cornerRadius: recipe.points("regular.radius"), style: .continuous)
        let disabledOpacity: Double = isEnabled ? .one : recipe.scalar("state.disabled")
        return HStack(spacing: recipe.points("regular.gap")) {
            nativeEntry(end: false)
            if isRange { Text("–"); nativeEntry(end: true) }
            Button { open = true } label: { MetalMorphIcon(.calendar, size: recipe.points("regular.glyph")) }.buttonStyle(.plain).accessibilityLabel("Choose \(label)").disabled(readOnly)
            if chosen != nil && !readOnly { Button { clear() } label: { MetalMorphIcon(.close, size: recipe.points("regular.glyph")) }.buttonStyle(.plain).accessibilityLabel("Clear \(label)") }
        }
        .padding(.leading, recipe.points("regular.pad-left")).padding(.trailing, recipe.points("regular.pad-right"))
        .frame(minHeight: recipe.points("regular.height"))
        .metalObjectRecipe(MetalRecipes.well, part: "field", in: shape)
        .opacity(disabledOpacity)
        .accessibilityIdentifier(name ?? label)
        .popover(isPresented: $open) { pickerContent.padding(MetalRecipes.calendar.points("self.pad")) }
    }
    private func zoneSelect(_ binding: Binding<TimeZone>) -> some View {
        let selection = Binding<TimeZone?>(get: { binding.wrappedValue }, set: { if let next = $0 { binding.wrappedValue = next } })
        let choices: [TimeZone] = zones.isEmpty ? [zone, TimeZone(secondsFromGMT: .zero)!] : zones
        let options: [MetalSelectOption<TimeZone>] = choices.map { MetalSelectOption($0, label: $0.identifier.replacingOccurrences(of: "_", with: " ")) }
        return MetalSelect("\(label) time zone", selection: selection, options: options, size: .compact).disabled(readOnly)
    }
    @ViewBuilder private func nativeEntry(end: Bool) -> some View {
        let binding = Binding<Date>(get: { (end ? self.end : chosen) ?? calendar.startOfDay(for: Date()) }, set: { set($0, end: end) })
        Group {
            if let limits { DatePicker(end ? "\(label) end" : label, selection: binding, in: limits, displayedComponents: showTime ? [.date, .hourAndMinute] : .date) }
            else { DatePicker(end ? "\(label) end" : label, selection: binding, displayedComponents: showTime ? [.date, .hourAndMinute] : .date) }
        }
        .labelsHidden().disabled(readOnly)
        .font(.metal(MetalType.ui))
        .accessibilityValue((end ? self.end : chosen) == nil ? "No date chosen" : (end ? self.end : chosen)!.formatted(date: .abbreviated, time: showTime ? .shortened : .omitted))
        #if os(macOS)
        .datePickerStyle(.field)
        #else
        .datePickerStyle(.compact)
        #endif
    }
    @ViewBuilder private var pickerContent: some View {
        VStack(spacing: MetalRecipes.calendar.points("head.gap")) {
            calendarControl
            HStack(spacing: MetalRecipes.calendar.points("head.gap")) {
                Button("Today") { selectToday() }.buttonStyle(MetalButtonStyle(size: .compact)).disabled(readOnly || unavailable(Date()) || limits.map { !calendar.isDate(Date(), inSameDayAs: $0.lowerBound) && Date() < $0.lowerBound || !calendar.isDate(Date(), inSameDayAs: $0.upperBound) && Date() > $0.upperBound } == true)
                ForEach(presets.indices, id: \.self) { index in
                    let preset = presets[index]
                    Button(preset.label) {
                        if isRange, case .range(let binding) = selection { if valid(preset.range) { binding.wrappedValue = preset.range; open = false } }
                        else if let date = preset.range.start { set(date); open = false }
                    }.buttonStyle(MetalButtonStyle(size: .compact)).disabled(readOnly)
                }
                if isMultiple { Button("Done") { open = false }.buttonStyle(MetalButtonStyle(size: .compact)) }
            }
        }
    }
    @ViewBuilder private var calendarControl: some View {
        switch selection {
        case .single(let binding):
            MetalCalendar(label, selection: Binding(get: { binding.wrappedValue ?? Date() }, set: { date in
                if showTime {
                    let time = calendar.dateComponents([.hour, .minute], from: binding.wrappedValue ?? calendar.startOfDay(for: Date()))
                    if let combined = calendar.date(bySettingHour: time.hour ?? .zero, minute: time.minute ?? .zero, second: .zero, of: date, matchingPolicy: .strict, repeatedTimePolicy: .first, direction: .forward), calendar.isDate(combined, inSameDayAs: date) { set(combined); open = false } else { error = "This local time does not exist in the selected time zone" }
                } else { set(date); open = false }
            }), in: limits).calendarLocale(locale).calendarTimeZone(zone).calendarUnavailable(unavailableLabel, predicate: unavailable)
        case .range(let binding):
            MetalCalendar(label, range: Binding(get: { binding.wrappedValue }, set: { candidate in if valid(candidate) { binding.wrappedValue = candidate; if candidate.end != nil { open = false } } }), in: limits, minDays: minDays, maxDays: maxDays).calendarMonths(2).calendarLocale(locale).calendarTimeZone(zone).calendarUnavailable(unavailableLabel, predicate: unavailable)
        case .multiple(let binding): MetalCalendar(label, dates: binding, in: limits).calendarLocale(locale).calendarTimeZone(zone).calendarUnavailable(unavailableLabel, predicate: unavailable)
        }
    }
    private func selectToday() {
        let today = calendar.startOfDay(for: Date())
        if case .range(let binding) = selection { let candidate = MetalDateRange(start: today, end: minDays > 1 ? nil : today); if valid(candidate) { binding.wrappedValue = candidate; if candidate.end != nil { open = false } } }
        else { set(showTime ? Date() : today); if !isMultiple { open = false } }
    }
}
