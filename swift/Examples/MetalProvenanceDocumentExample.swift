import SwiftUI
import MetalUI

/// The provenance page's actual document, using the same public controls and source writer.
@MainActor
public struct MetalProvenanceDocumentExample: View {
    public static let source = "Send #poster tomorrow 4pm, slept 6h in #done by #coffee\nPaint #FF6B3D with Sam; open https://metalui.dev."
    @ObservedObject private var document: MetalCueDocument
    private let readOnly: Bool, raw: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var enabled
    @State private var hash: HashCapture?
    private struct HashCapture { let range: NSRange; let source: String }
    public init(document: MetalCueDocument, readOnly: Bool = false, raw: Bool = false) {
        self.document = document; self.readOnly = readOnly; self.raw = raw
    }
    private enum Kind: String { case plain, tag, date, clock, sleep, state, colour, person, link }
    private struct Token: Identifiable { let id: String; let kind: Kind; let words: String; let range: NSRange }
    private static let today = "2026-10-02"
    private static let recent = ["#poster", "#studio", "#coffee"]
    private static let dates: [String] = (0..<29).map { index in
        var calendar = Foundation.Calendar(identifier: .gregorian); calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let date = calendar.date(from: DateComponents(year: 2026, month: 9, day: 18))!
        let next = calendar.date(byAdding: .day, value: index, to: date)!
        let parts = calendar.dateComponents([.year, .month, .day], from: next)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    private static let dateWords = Dictionary(uniqueKeysWithValues: dates.map { (MetalDateCue.relativeWords($0, today: today), $0) })
    private static let expression = try? NSRegularExpression(pattern: #"#[0-9a-f]{6}\b|#(?:todo|doing|done|dropped)\b|#[\p{L}\p{N}\p{M}_-]+|yesterday|today|tomorrow|(?:last|next) (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|\d{4}-\d{2}-\d{2}|\d{1,2}(?::\d{2})?(?:am|pm)\b|\d+(?:\.\d+)?(?:h\d*|min)\b|https?://[^\s.]+(?:\.[^\s.;]+)*|\b(?:Sam|Ana|Hiro)\b"#, options: .caseInsensitive)
    private var tokens: [Token] {
        let source = document.source as NSString
        let matches = Self.expression?.matches(in: document.source, range: NSRange(location: 0, length: source.length)) ?? []
        var result: [Token] = [], at = 0, counts: [Kind: Int] = [:]
        for match in matches {
            let words = source.substring(with: match.range)
            let kind: Kind
            if words.hasPrefix("#"), words.count == 7, UInt32(words.dropFirst(), radix: 16) != nil { kind = .colour }
            else if ["#todo", "#doing", "#done", "#dropped"].contains(words) { kind = .state }
            else if words.hasPrefix("#") { kind = .tag }
            else if Self.dateWords[words] != nil { kind = .date }
            else if words.range(of: #"^\d{1,2}(?::\d{2})?(am|pm)$"#, options: .regularExpression) != nil { kind = .clock }
            else if words.range(of: #"^\d.*(h\d*|min)$"#, options: .regularExpression) != nil { kind = .sleep }
            else if words.hasPrefix("http") { kind = .link }
            else if ["Sam", "Ana", "Hiro"].contains(words) { kind = .person }
            else { continue }
            if kind == .clock {
                let parts = words.dropLast(2).split(separator: ":")
                guard let hour = Int(parts[0]), (1...12).contains(hour), (0...59).contains(parts.count > 1 ? Int(parts[1]) ?? 60 : 0) else { continue }
            }
            if kind == .sleep, Self.quantity(words, clock: false).value > 1440 { continue }
            if match.range.location > at { result.append(.init(id: "plain\(result.count)", kind: .plain, words: source.substring(with: NSRange(location: at, length: match.range.location - at)), range: NSRange(location: at, length: match.range.location - at))) }
            let ordinal = counts[kind, default: 0]; counts[kind] = ordinal + 1
            result.append(.init(id: "\(kind.rawValue)\(ordinal)", kind: kind, words: words, range: match.range)); at = NSMaxRange(match.range)
        }
        if at < source.length { result.append(.init(id: "tail", kind: .plain, words: source.substring(from: at), range: NSRange(location: at, length: source.length - at))) }
        return result
    }
    private func rowTokens(_ row: Int) -> [Token] {
        let source = document.source as NSString, newline = source.range(of: "\n")
        let start = row == 0 ? 0 : newline.location == NSNotFound ? source.length : NSMaxRange(newline)
        let end = row == 0 && newline.location != NSNotFound ? newline.location : source.length
        return tokens.compactMap { token in
            let a = max(start, token.range.location), b = min(end, NSMaxRange(token.range)); guard b > a else { return nil }
            let range = NSRange(location: a, length: b - a)
            return Token(id: token.id, kind: token.kind, words: source.substring(with: range), range: range)
        }
    }
    private func captureHash() {
        guard enabled, !readOnly else { return }
        let source = document.source as NSString, prefix = source.substring(to: document.selection.start) as NSString
        let range = prefix.range(of: #"#[\p{L}\p{N}\p{M}_-]*$"#, options: .regularExpression)
        guard range.location != NSNotFound else { hash = nil; return }
        let words = prefix.substring(with: range)
        guard !Self.recent.contains(words), !["#todo", "#doing", "#done", "#dropped"].contains(words) else { hash = nil; return }
        hash = HashCapture(range: range, source: document.source)
    }
    private func chooseTag(_ words: String) {
        guard let hash, enabled, !readOnly, hash.source.utf16.elementsEqual(document.source.utf16), document.begin(hash.range) else { return }
        document.replace(words); document.commit(); self.hash = nil
    }
    private func begin(_ token: Token) -> Bool { guard let current = tokens.first(where: { $0.id == token.id }) else { return false }; return document.begin(current.range) }
    private func cancel(_ reason: MetalNumericCueCancelReason) { if reason != .external { document.cancel() } }
    private func instructions(_ kind: Kind) -> String {
        switch kind {
        case .tag, .state: "Space cycles · Drag or arrows step"
        case .date: "Arrows change days · Hold or Return opens Calendar"
        case .clock: "Drag or arrows change quarter hours"
        case .sleep: "Drag vertically to change · Horizontally to convert"
        case .colour: "Return opens the colour well"
        case .person: "Return opens known names"
        case .link: "Return follows · Edit URL changes source"
        case .plain: ""
        }
    }
    private static func quantity(_ words: String, clock: Bool) -> MetalNumericCueValue {
        if clock {
            let suffix = words.suffix(2), parts = words.dropLast(2).split(separator: ":")
            return .init(value: Double((Int(parts[0]) ?? 0) % 12 + (suffix == "pm" ? 12 : 0)) * 60 + Double(parts.count > 1 ? Int(parts[1]) ?? 0 : 0), unit: "clock")
        }
        if words.hasSuffix("min") { return .init(value: Double(words.dropLast(3)) ?? 0, unit: "min") }
        let parts = words.split(separator: "h", omittingEmptySubsequences: false)
        return .init(value: (Double(parts[0]) ?? 0) * 60 + (parts.count > 1 ? Double(parts[1]) ?? 0 : 0), unit: "h")
    }
    private static func duration(_ minutes: Double) -> String {
        let h = Int(minutes / 60), m = Int(minutes.truncatingRemainder(dividingBy: 60).rounded())
        return h > 0 ? "\(h)h\(m > 0 ? String(m) : "")" : "\(m)min"
    }
    private static func clock(_ minutes: Double) -> String {
        let n = Int(minutes), h = n / 60, m = n % 60
        return "\(h % 12 == 0 ? 12 : h % 12)\(m == 0 ? "" : String(format: ":%02d", m))\(h < 12 ? "am" : "pm")"
    }
    private static let sleepUnits = [
        MetalNumericCueUnit(id: "h", label: "hours", factor: 60, step: 1 / 12, smallStep: 1 / 60, largeStep: 1, format: { duration($0 * 60) }, source: { duration($0 * 60) }),
        MetalNumericCueUnit(id: "min", label: "minutes", factor: 1, step: 5, smallStep: 1, largeStep: 60, format: { "\(Int($0))min" }, source: { "\(Int($0))min" })
    ]
    @ViewBuilder private func face(_ token: Token) -> some View {
        switch token.kind {
        case .plain: Text(token.words.replacingOccurrences(of: "\n", with: " "))
        case .sleep, .clock:
            let clock = token.kind == .clock
            MetalNumericCue(clock ? "Send time" : "Sleep", value: Binding(get: { Self.quantity(token.words, clock: clock) }, set: { _ in }),
                units: clock ? [MetalNumericCueUnit(id: "clock", label: "time of day", factor: 1, step: 15, smallStep: 1, largeStep: 60, format: Self.clock, source: Self.clock)] : Self.sleepUnits,
                in: 0...(clock ? 1439 : 1440), footprint: clock ? ["12:59pm"] : ["1440min", "23h59", "24h"],
                kind: clock ? .date : .duration, meaning: clock ? .time : .sleep, raw: raw, readOnly: readOnly, allowTyping: false, hint: false,
                onBegin: { _ = begin(token) }, onSourceChange: { document.replace($0) }, onCommit: document.commit, onCancel: cancel)
                .metalProvenance("You", detail: [clock ? "Written clock time" : "Written sleep quantity", instructions(token.kind)], enabled: !document.editing)
        case .state:
            MetalEnumCue(token.words, choices: [
                .init("#todo", label: "To do", glyph: .note, tint: colorway.tokens.ink3),
                .init("#doing", label: "Doing", glyph: .clock, tint: MetalShared.orange),
                .init("#done", label: "Done", glyph: .check, tint: MetalShared.greenDeep),
                .init("#dropped", label: "Dropped", glyph: .close, tint: colorway.tokens.ink3)
            ], label: "Task state", readOnly: readOnly, raw: raw, editing: document.editing, hint: false,
            onBegin: { begin(token) }, onChange: { document.replace($0) }, onCommit: document.commit, onCancel: document.cancel)
                .metalProvenance("You", detail: ["Explicit source words", instructions(token.kind)], enabled: !document.editing)
        case .tag:
            MetalTagCue(token.words, recentTags: Self.recent, label: token.id == "tag0" ? "Project tag" : "Personal tag", readOnly: readOnly, raw: raw, hint: false, editing: document.editing,
                onBegin: { begin(token) }, onChange: { document.replace($0) }, onCommit: document.commit, onCancel: document.cancel)
                .metalProvenance("You", detail: ["Explicit source words", instructions(token.kind)], enabled: !document.editing)
        case .date:
            MetalDateCue("Send date", value: Binding(get: { Self.dateWords[token.words]! }, set: { _ in }), today: Self.today, in: Self.dates.first!...Self.dates.last!, footprint: Array(Self.dateWords.keys) + ["Wed 30 Sept"], raw: raw, hint: false, readOnly: readOnly,
                onBegin: { _ = begin(token) }, onSourceChange: { document.replace($0) }, onCommit: document.commit, onCancel: cancel)
                .metalProvenance("You", detail: ["Explicit source words", instructions(token.kind)], enabled: !document.editing)
        case .colour:
            MetalColourCue("Paint colour", value: Binding(get: { token.words }, set: { _ in }), readOnly: readOnly, raw: raw,
                onBegin: { begin(token) }, onSourceChange: document.replace, onCommit: document.commit, onCancel: { if $0 != "external" { document.cancel() } })
                .metalProvenance("You", detail: ["Explicit source words", instructions(token.kind)], enabled: !document.editing)
        case .person:
            MetalPersonCue(token.words, choices: [.init("Sam"), .init("Ana"), .init("Hiro")], label: "Known person", readOnly: readOnly, raw: raw, hint: false, editing: document.editing,
                onBegin: { begin(token) }, onChange: document.replace, onCommit: document.commit, onCancel: document.cancel)
                .metalProvenance("You", detail: ["Explicit source words", instructions(token.kind)], enabled: !document.editing)
        case .link:
            MetalLinkCue(token.words, footprint: ["https://metalui.dev/components", "https://example.com/notes#one"], label: "Reference link", readOnly: readOnly, raw: raw, editing: document.editing,
                onBegin: { begin(token) }, onChange: document.replace, onCommit: document.commit, onCancel: document.cancel)
                .metalProvenance("You", detail: ["Explicit source words", instructions(token.kind)], enabled: !document.editing)
        }
    }
    private func measuredFace(_ token: Token) -> some View {
        face(token).anchorPreference(key: MetalProvenanceCueAnchors.self, value: .bounds) { anchor in
            token.kind == .plain ? [:] : [token.id: anchor]
        }
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s24) {
            Text("Editable document source").font(.metal(MetalType.label))
            MetalPopover("Recent tags", description: "Search keeps your hash unchanged; choosing replaces its captured source range.", isPresented: Binding(get: { hash != nil }, set: { if !$0 { hash = nil } })) {
                MetalProvenanceSourceEditor(document: document, onTyping: captureHash)
            } content: {
                MetalTagCuePicker("Find a source tag", recentTags: Self.recent, onChoose: chooseTag)
            }
            HStack(alignment: .firstTextBaseline, spacing: .zero) { ForEach(rowTokens(0)) { measuredFace($0) } }
                .font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
            HStack(alignment: .firstTextBaseline, spacing: .zero) { ForEach(rowTokens(1)) { measuredFace($0) } }
                .font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
            HStack(spacing: MetalSpace.s8) {
                MetalButton("Undo source edit", icon: .undo, size: .compact, action: document.undo).disabled(!document.canUndo && !document.editing)
                MetalButton("Redo source edit", icon: .redo, size: .compact, action: document.redo).disabled(!document.canRedo || document.editing)
                MetalButton("Cancel source gesture", icon: .close, size: .compact, action: document.cancel).disabled(!document.editing)
            }
            Text("UTF16 \(document.selection.start)–\(document.selection.end) · \(document.editing ? "preview" : "committed")").font(.metal(MetalType.readout))
        }
        .onChange(of: Array(document.source.utf16)) { _, source in if let hash, !hash.source.utf16.elementsEqual(source) { self.hash = nil } }
        .onChange(of: readOnly) { _, next in if next { hash = nil } }
        .onChange(of: enabled) { _, next in if !next { hash = nil } }
    }
}
