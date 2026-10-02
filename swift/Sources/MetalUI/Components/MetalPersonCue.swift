import SwiftUI

public struct MetalPersonCueChoice: Identifiable {
    public let value: String
    public let label: String?
    public let avatar: AnyView?
    public let disabled: Bool
    public var id: String { value }
    /// Avatar is supplied by the host Object; this control never creates or infers a person.
    public init(_ value: String, label: String? = nil, avatar: AnyView? = nil, disabled: Bool = false) {
        self.value = value; self.label = label; self.avatar = avatar; self.disabled = disabled
    }
}

/// A known person's exact source name. Source ranges and history belong to MetalCueDocument or its host.
@MainActor
public struct MetalPersonCue: View {
    private let value: String
    private let choices: [MetalPersonCueChoice]
    private let label: String
    private let readOnly: Bool
    private let raw: Bool
    private let hint: Bool
    private let editing: Bool?
    private let onBegin: () -> Bool
    private let onChange: (String) -> Bool
    private let onCommit: () -> Void
    private let onCancel: () -> Void
    @State private var open = false
    @State private var hovering = false
    @State private var original: String?
    @State private var highlighted: String?
    @State private var arrived = false
    @State private var prefix = ""
    @State private var lastKey = Date.distantPast
    @Namespace private var glide
    @FocusState private var focused: Bool
    @FocusState private var listFocused: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var enabled
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.scenePhase) private var scenePhase
    @MetalMotionPreference private var reduceMotion

    public init(_ value: String, choices: [MetalPersonCueChoice], label: String, readOnly: Bool = false, raw: Bool = false, hint: Bool = true, editing: Bool? = nil,
                onBegin: @escaping () -> Bool = { true }, onChange: @escaping (String) -> Bool,
                onCommit: @escaping () -> Void = {}, onCancel: @escaping () -> Void = {}) {
        self.value = value; self.choices = choices; self.label = label; self.readOnly = readOnly; self.raw = raw; self.hint = hint; self.editing = editing
        self.onBegin = onBegin; self.onChange = onChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    private var valid: Bool { !choices.isEmpty && choices.allSatisfy { !$0.value.isEmpty } && Set(choices.map(\.value)).count == choices.count }
    private var mutable: Bool { valid && enabled && !readOnly && choices.contains { !$0.disabled } }
    private var available: [MetalPersonCueChoice] { choices.filter { !$0.disabled } }
    private var current: MetalPersonCueChoice? { choices.first { $0.value == value } }
    private var vocabulary: [String] { choices.map { $0.value + ($0.disabled ? "\u{0}disabled" : "\u{0}enabled") } }
    private var names: [String] { Array(Set(choices.map(\.value) + [value])).sorted() }
    private func avatar(_ choice: MetalPersonCueChoice?) -> AnyView {
        choice?.avatar ?? AnyView(MetalIcon(.person, size: MetalRecipes.button.points("compact.glyph")))
    }
    public var body: some View {
        Button(action: begin) {
            ZStack(alignment: .leading) {
                ForEach(names, id: \.self) { Text($0).hidden().accessibilityHidden(true) }
                MetalCueText(value, kind: .duration, meaning: .person, label: value, raw: raw, personGlyph: avatar(current))
                    .id(value).transition(reduceMotion ? .opacity : .asymmetric(insertion: .offset(y: MetalSpace.s4).combined(with: .opacity), removal: .offset(y: -MetalSpace.s4).combined(with: .opacity)))
            }
            .font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
            .fixedSize().metalAnimation(.settle, value: value)
            .overlay(alignment: .bottomLeading) {
                if hovering && mutable && !raw { colorway.tokens.cueQuiet.color.frame(height: MetalRecipes.mark.points("match.thickness")).offset(y: MetalCue.underlineOffset) }
            }
        }
        .buttonStyle(.plain).onHover { hovering = $0 }
        .disabled(!enabled || !valid || readOnly)
        .focusable(enabled && valid).focused($focused).focusEffectDisabled()
        .overlay { if focused { Rectangle().strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth) } }
        .opacity(enabled ? Double.one : MetalRecipes.field.scalar("state.disabled"))
        .accessibilityLabel(label).accessibilityValue(value)
        .accessibilityHint(readOnly ? "Read only" : "Opens known people. Arrows or type a name, Return chooses, Escape cancels.")
        .help(hint ? (readOnly ? "Read only" : "Choose a known person") : "")
        .popover(isPresented: $open, arrowEdge: .bottom) { list }
        .onChange(of: open) { _, next in if !next { cancel() } }
        .onChange(of: value) { _, next in if let original, next != original { cancel() } }
        .onChange(of: vocabulary) { _, _ in cancel() }
        .onChange(of: editing) { _, next in if next == false { cancel() } }
        .onChange(of: enabled) { _, next in if !next { cancel() } }
        .onChange(of: readOnly) { _, next in if next { cancel() } }
        .onChange(of: scenePhase) { _, next in if next != .active { cancel() } }
        .onDisappear { cancel() }
    }
    private var list: some View {
        let recipe = MetalRecipes.menu
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        return VStack(alignment: .leading, spacing: .zero) {
            ForEach(choices) { choice in row(choice) }
        }
        .padding(recipe.points("self.pad"))
        .frame(minWidth: recipe.points("self.min-width"), alignment: .leading)
        .metalObjectRecipe(recipe, part: "self", in: shape)
        .background {
            if reduceTransparency { shape.fill(colorway.tokens.frostOpaque.color) }
            else {
                MetalBackdropView(backdrop: MetalBackdrop(blur: recipe.filterNumber("self.blur", function: "blur") ?? .zero,
                    saturation: recipe.filterNumber("self.blur", function: "saturate") ?? .one, dark: colorway == .graphite)).clipShape(shape)
            }
        }
        .opacity(arrived ? .one : .zero)
        .scaleEffect(reduceMotion || arrived ? CGFloat(Double.one) : CGFloat(MetalRecipes.select.scalar("pop.scale")))
        .metalAnimation(.settle, value: highlighted)
        .focusable().focusEffectDisabled().focused($listFocused)
        .defaultFocus($listFocused, true)
        .task {
            arrived = false; await Task.yield()
            withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true }; listFocused = true
        }
        .onKeyPress(.downArrow) { move(1); return .handled }
        .onKeyPress(.upArrow) { move(-1); return .handled }
        .onKeyPress(.home) { highlighted = available.first?.value; return .handled }
        .onKeyPress(.end) { highlighted = available.last?.value; return .handled }
        .onKeyPress(.return) { choose(); return .handled }
        .onKeyPress(.space) { choose(); return .handled }
        .onKeyPress(.escape) { cancel(); return .handled }
        .onKeyPress { press in
            guard press.characters.first?.isLetter == true else { return .ignored }
            let now = Date(); if now.timeIntervalSince(lastKey) > MetalSpringClass.release.spring.duration { prefix = "" }; lastKey = now
            prefix += press.characters.localizedLowercase
            if let match = available.first(where: { ($0.label ?? $0.value).localizedLowercase.hasPrefix(prefix) }) { highlighted = match.value }
            else { prefix = press.characters.localizedLowercase; highlighted = available.first { ($0.label ?? $0.value).localizedLowercase.hasPrefix(prefix) }?.value ?? highlighted }
            return .handled
        }
        .accessibilityElement(children: .contain).accessibilityLabel(label)
        .metalColorway(colorway)
    }
    private func row(_ choice: MetalPersonCueChoice) -> some View {
        let recipe = MetalRecipes.menu
        return Button {
            highlighted = choice.value; choose()
        } label: {
            HStack(spacing: recipe.points("row.gap")) {
                avatar(choice).frame(width: recipe.points("row.glyph"), height: recipe.points("row.glyph")).accessibilityHidden(true)
                Text(choice.label ?? choice.value).frame(maxWidth: .infinity, alignment: .leading)
                MetalTickGlyph(mark: value == choice.value ? .tick : nil, side: MetalRecipes.select.points("mark.glyph"), color: colorway.tokens.ink.color)
                    .frame(width: MetalRecipes.select.points("mark.slot")).accessibilityHidden(true)
            }
            .font(recipe.font("row.font")).foregroundStyle(colorway.tokens.ink.color)
            .padding(.horizontal, recipe.points("row.pad")).frame(height: recipe.points("row.height"))
            .background { if highlighted == choice.value { MetalListGlide().matchedGeometryEffect(id: "highlight", in: glide) } }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain).disabled(choice.disabled).opacity(choice.disabled ? recipe.scalar("row.disabled") : .one)
        .onHover { if $0 && !choice.disabled { highlighted = choice.value } }
        .accessibilityLabel(choice.label.map { $0 == choice.value ? choice.value : "\($0) (\(choice.value))" } ?? choice.value)
        .accessibilityAddTraits(value == choice.value ? [.isSelected] : [])
    }
    private func begin() {
        guard mutable, onBegin() else { return }
        original = value; highlighted = available.first(where: { $0.value == value })?.value ?? available.first?.value; prefix = ""; open = true
    }
    private func move(_ step: Int) {
        guard !available.isEmpty else { return }
        let index = available.firstIndex { $0.value == highlighted } ?? .zero
        highlighted = available[min(max(index + step, .zero), available.count - 1)].value
    }
    private func choose() {
        guard original != nil, let highlighted, available.contains(where: { $0.value == highlighted }) else { return }
        if highlighted != value && !onChange(highlighted) { cancel(); return }
        original = nil; open = false; onCommit()
    }
    private func cancel() {
        guard original != nil else { return }
        original = nil; open = false; onCancel()
    }
}
