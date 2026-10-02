import SwiftUI
import CoreText

/// A real destination and a separate source editor. Recognition and source history remain host-owned.
@MainActor
public struct MetalLinkCue: View {
    private let value: String
    private let footprint: [String]
    private let label: String
    private let readOnly: Bool
    private let raw: Bool
    private let editing: Bool?
    private let validate: (String) -> String?
    private let onBegin: () -> Bool
    private let onChange: (String) -> Bool
    private let onCommit: () -> Void
    private let onCancel: () -> Void
    @State private var presented = false
    @State private var original: String?
    @State private var draft = ""
    @State private var error: String?
    @State private var hovering = false
    @FocusState private var navigationFocused: Bool
    @FocusState private var editFocused: Bool
    @FocusState private var fieldFocused: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var enabled
    @Environment(\.openURL) private var openURL
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @MetalMotionPreference private var reduceMotion

    public init(_ value: String, footprint: [String], label: String, readOnly: Bool = false, raw: Bool = false, editing: Bool? = nil,
                validate: @escaping (String) -> String? = { _ in nil }, onBegin: @escaping () -> Bool = { true },
                onChange: @escaping (String) -> Bool, onCommit: @escaping () -> Void = {}, onCancel: @escaping () -> Void = {}) {
        self.value = value; self.footprint = footprint; self.label = label; self.readOnly = readOnly; self.raw = raw; self.editing = editing
        self.validate = validate; self.onBegin = onBegin; self.onChange = onChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    private static func destination(_ words: String) -> URL? {
        guard words.rangeOfCharacter(from: .whitespacesAndNewlines) == nil, let url = URL(string: words),
              let scheme = url.scheme?.lowercased(), ["http", "https"].contains(scheme), url.host?.isEmpty == false else { return nil }
        return url
    }
    private var destination: URL? { Self.destination(value) }
    private var mutable: Bool { enabled && !readOnly && !footprint.isEmpty }
    private var glyph: Double { MetalRecipes.button.points("compact.glyph") }
    /// Source and chip fonts are donor type roles. This runs on input/state changes, never a frame clock.
    private func width(_ words: String, role: MetalTypeRole = MetalType.content) -> Double {
        let font = MetalFonts.ctFont(role, size: role.size)
        let line = CTLineCreateWithAttributedString(NSAttributedString(string: words, attributes: [.font: font]))
        return CTLineGetTypographicBounds(line, nil, nil, nil) + Double(max(0, words.count - 1)) * role.trackingPoints
    }
    private var reserved: Double {
        footprint.map { words in
            let host = Self.destination(words)?.host ?? words
            let chip = width(host, role: MetalType.ui) + MetalCue.urlGlyph + MetalCue.urlGap + MetalCue.urlPadStart + MetalCue.urlPadEnd
            return max(width(words), chip)
        }.max() ?? .zero
    }
    private var destinationLabel: some View {
        Group {
            if raw { Text(value).font(.metal(MetalType.content)).underline() }
            else {
                HStack(spacing: MetalCue.urlGap) {
                    MetalIcon(.link, size: MetalCue.urlGlyph)
                    Text(destination?.host ?? value).font(.metal(MetalType.ui))
                }
                .foregroundStyle(colorway.tokens.cueUrlInk.color)
                .padding(.leading, MetalCue.urlPadStart).padding(.trailing, MetalCue.urlPadEnd)
                .frame(height: MetalCue.urlHeight)
                .metalRecipe(MetalRecipe(fill: .solid(hovering ? MetalCue.urlBgHover : MetalCue.urlBg), shadows: MetalCue.urlRing), in: Capsule(style: .continuous))
            }
        }
    }
    public var body: some View {
        Group {
            if let destination {
                SwiftUI.Link(destination: destination) { destinationLabel }
                    .buttonStyle(.plain).disabled(!enabled).focusable(enabled).focused($navigationFocused).focusEffectDisabled()
                    .onKeyPress(.return) { guard enabled else { return .ignored }; openURL(destination); return .handled }
                    .overlay { if navigationFocused { Capsule().strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth).padding(-MetalButtonMetrics.focusOffset) } }
            } else { destinationLabel.accessibilityAddTraits(.isLink) }
        }
        .frame(width: reserved, alignment: .leading)
        .foregroundStyle(colorway.tokens.ink.color)
        .accessibilityLabel(label).accessibilityValue(value)
        .accessibilityHint("Enter follows this destination. The separate edit key changes its exact URL.")
        .help(value)
        .onHover { hovering = $0 }
        .overlay(alignment: .topTrailing) {
            Button(action: begin) { MetalIcon(.pen, size: glyph) }
                .buttonStyle(.plain).disabled(!mutable).focusable(enabled).focused($editFocused).focusEffectDisabled()
                .onKeyPress(.return) { guard mutable else { return .ignored }; begin(); return .handled }
                .foregroundStyle((hovering || editFocused ? colorway.tokens.ink2 : colorway.tokens.ink3).color)
                .opacity(hovering || navigationFocused || editFocused || presented ? .one : .zero)
                .overlay { if editFocused { Rectangle().strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) } }
                .offset(y: -(glyph + MetalSpace.s2))
                .accessibilityLabel("Edit \(label) URL").accessibilityHint("Enter opens the URL field. Enter applies; Escape cancels.")
                .help("Edit URL")
                .popover(isPresented: $presented, arrowEdge: .bottom) { editor }
        }
        .onChange(of: presented) { _, next in if !next { cancel() } }
        .onChange(of: value) { _, next in if let original, next != original { cancel() } }
        .onChange(of: footprint) { _, _ in cancel() }
        .onChange(of: editing) { _, next in if next == false { cancel() } }
        .onChange(of: enabled) { _, next in if !next { cancel() } }
        .onChange(of: readOnly) { _, next in if next { cancel() } }
        .onChange(of: scenePhase) { _, next in if next != .active { cancel() } }
        .onDisappear { cancel() }
        .transaction { if reduceMotion { $0.animation = nil; $0.disablesAnimations = true } }
    }
    private var editor: some View {
        let recipe = MetalRecipes.popover
        let menu = MetalRecipes.menu
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        return VStack(alignment: .leading, spacing: recipe.points("self.gap")) {
            Text(label).font(.metal(MetalType.title)).foregroundStyle(colorway.tokens.ink.color)
            Text("Write the full URL. The document keeps your exact words.").font(.metal(MetalType.body)).foregroundStyle(colorway.tokens.ink2.color).fixedSize(horizontal: false, vertical: true)
            VStack(alignment: .leading, spacing: MetalSpace.s16) {
                MetalWell(.field) {
                    HStack(spacing: MetalRecipes.field.points("regular.gap")) {
                        MetalIcon(.link, size: MetalRecipes.field.points("regular.glyph"))
                        TextField("URL", text: $draft).textFieldStyle(.plain).font(.metal(MetalType.ui))
                            .focused($fieldFocused).defaultFocus($fieldFocused, true).onSubmit(apply)
                            .accessibilityLabel("\(label) URL")
                            .onChange(of: draft) { _, _ in error = nil }
                    }
                    .padding(.leading, MetalRecipes.field.points("regular.pad-left"))
                    .padding(.trailing, MetalRecipes.field.points("regular.pad-right"))
                    .frame(height: MetalRecipes.field.points("regular.height"))
                }
                .overlay { if fieldFocused { RoundedRectangle(cornerRadius: MetalRecipes.field.points("regular.radius"), style: .continuous).strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) } }
                if let error { Text(error).font(.metal(MetalType.meta)).foregroundStyle(MetalShared.red.color).accessibilityLabel(error) }
                HStack(spacing: MetalSpace.s8) {
                    MetalButton("Apply URL", icon: .check, cap: .primary, size: .compact, action: apply)
                    MetalButton("Cancel URL edit", icon: .close, cap: .standard, size: .compact, action: cancel)
                }
            }.padding(.top, recipe.points("self.body-gap") - recipe.points("self.gap"))
        }
        .padding(recipe.points("self.pad"))
        .frame(minWidth: recipe.points("self.min-width"), maxWidth: recipe.points("self.max-width"))
        .metalObjectRecipe(menu, part: "self", in: shape)
        .background { if reduceTransparency { shape.fill(colorway.tokens.frostOpaque.color) } else {
            MetalBackdropView(backdrop: MetalBackdrop(blur: menu.filterNumber("self.blur", function: "blur") ?? .zero,
                saturation: menu.filterNumber("self.blur", function: "saturate") ?? .one, dark: colorway == .graphite)).clipShape(shape)
        } }
        .onChange(of: error) { _, message in if let message { AccessibilityNotification.Announcement(message).post() } }
        .onKeyPress(.escape) { cancel(); return .handled }
        .task { await Task.yield(); fieldFocused = true }
        .metalColorway(colorway)
    }
    private func begin() {
        guard mutable, onBegin() else { return }
        original = value; draft = value; error = nil; presented = true
    }
    private func apply() {
        guard original != nil, mutable else { return }
        guard let nextDestination = Self.destination(draft) else { error = "Enter an absolute HTTP or HTTPS URL."; return }
        let chipWidth = width(nextDestination.host ?? draft, role: MetalType.ui) + MetalCue.urlGlyph + MetalCue.urlGap + MetalCue.urlPadStart + MetalCue.urlPadEnd
        guard ceil(max(width(draft), chipWidth)) <= ceil(reserved) else { error = "This URL exceeds the source footprint allowed by the document."; return }
        if let refused = validate(draft) { error = refused; return }
        if draft != value && !onChange(draft) { cancel(); return }
        original = nil; presented = false; error = nil; onCommit()
    }
    private func cancel() {
        guard original != nil else { return }
        original = nil; presented = false; error = nil; onCancel()
    }
}
