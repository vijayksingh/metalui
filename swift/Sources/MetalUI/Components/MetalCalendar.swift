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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

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
        var value = Foundation.Calendar(identifier: .gregorian); value.locale = locale
        if let weekStartsOn { value.firstWeekday = (weekStartsOn % 7 + 7) % 7 + 1 }
        return value
    }
    private var month: Date { Self.monthStart(monthBinding?.wrappedValue ?? ownMonth) }
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
        let target = Self.monthStart(date); guard target != month else { return }; later = target > month
        withMetalAnimation(.settle, reduceMotion: reduceMotion) { if let monthBinding { monthBinding.wrappedValue = target } else { ownMonth = target } }
    }
    private func moveFocus(_ date: Date) {
        let target = limits.map { min(max(calendar.startOfDay(for: date), calendar.startOfDay(for: $0.lowerBound)), calendar.startOfDay(for: $0.upperBound)) } ?? date
        if target < month || target >= addMonths(month, months) { show(target) }; focused = target
        if currentRange?.start != nil && currentRange?.end == nil { preview = target }
    }
    private func formatted(_ date: Date, _ template: String) -> String {
        let formatter = DateFormatter(); formatter.locale = locale; formatter.setLocalizedDateFormatFromTemplate(template); return formatter.string(from: date)
    }
    public var body: some View {
        let recipe = MetalRecipes.calendar
        VStack(spacing: recipe.points("head.gap")) {
            HStack(spacing: recipe.points("head.gap")) {
                Button { show(addMonths(month, -1)) } label: { Image(systemName: "chevron.left").font(.system(size: recipe.points("step.glyph"))) }.buttonStyle(MetalButtonStyle(size: .compact)).accessibilityLabel("Previous month").disabled(limits.map { month <= Self.monthStart($0.lowerBound) } ?? false)
                Spacer(minLength: .zero)
                Button { jump = true } label: { Text(formatted(month, "MMMM yyyy")).font(.metal(MetalType.title)).contentTransition(.numericText(countsDown: !later)) }.buttonStyle(.plain).accessibilityLabel("Choose month and year: \(formatted(month, "MMMM yyyy"))").popover(isPresented: $jump) {
                    VStack(spacing: MetalLayout.gapRelated) {
                        Stepper("Year \(calendar.component(.year, from: month))", value: Binding(get: { calendar.component(.year, from: month) }, set: { year in if let date = calendar.date(from: DateComponents(year: year, month: calendar.component(.month, from: month), day: 1)) { show(date) } }), in: (limits.map { calendar.component(.year, from: $0.lowerBound) } ?? 1)...(limits.map { calendar.component(.year, from: $0.upperBound) } ?? 9999))
                        ForEach(1...12, id: \.self) { number in
                            let date = calendar.date(from: DateComponents(year: calendar.component(.year, from: month), month: number, day: 1))!
                            Button(formatted(date, "MMMM")) { show(date); jump = false }.buttonStyle(MetalButtonStyle(size: .compact)).disabled(limits.map { date < Self.monthStart($0.lowerBound) || date > Self.monthStart($0.upperBound) } ?? false)
                        }
                    }.padding(MetalLayout.gapRelated)
                }
                Spacer(minLength: .zero)
                Button { show(addMonths(month, 1)) } label: { Image(systemName: "chevron.right").font(.system(size: recipe.points("step.glyph"))) }.buttonStyle(MetalButtonStyle(size: .compact)).accessibilityLabel("Next month").disabled(limits.map { addMonths(month, months - 1) >= Self.monthStart($0.upperBound) } ?? false)
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
