import SwiftUI

public struct MetalSelectOption<Value: Hashable>: Identifiable {
    public let value: Value
    public let label: String
    public let lead: MetalIconName?
    public let disabled: Bool
    public var id: Value { value }

    public init(_ value: Value, label: String, lead: MetalIconName? = nil, disabled: Bool = false) {
        self.value = value
        self.label = label
        self.lead = lead
        self.disabled = disabled
    }
}

public struct MetalSelectGroup<Value: Hashable> {
    public let label: String
    public let options: [MetalSelectOption<Value>]

    public init(_ label: String, options: [MetalSelectOption<Value>]) {
        self.label = label
        self.options = options
    }
}

/// A raised cap that chooses one named value from the menu's frosted list.
public struct MetalSelect<Value: Hashable>: View {
    public enum Size: Sendable { case regular, compact }

    let label: String
    @Binding var selection: Value?
    let groups: [MetalSelectGroup<Value>]
    let placeholder: String
    let size: Size
    let invalid: Bool

    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @State private var open = false
    @State private var hovering = false
    @State private var highlighted: Value?
    @State private var arrived = false
    @FocusState private var listFocused: Bool
    @FocusState private var triggerFocused: Bool
    @Namespace private var glide

    public init(_ label: String, selection: Binding<Value?>, options: [MetalSelectOption<Value>],
                placeholder: String = "", size: Size = .regular, invalid: Bool = false) {
        self.init(label, selection: selection, groups: [MetalSelectGroup("", options: options)],
                  placeholder: placeholder, size: size, invalid: invalid)
    }

    public init(_ label: String, selection: Binding<Value?>, groups: [MetalSelectGroup<Value>],
                placeholder: String = "", size: Size = .regular, invalid: Bool = false) {
        self.label = label
        _selection = selection
        self.groups = groups
        self.placeholder = placeholder
        self.size = size
        self.invalid = invalid
    }

    private var allOptions: [MetalSelectOption<Value>] { groups.flatMap(\.options) }
    private var enabledOptions: [MetalSelectOption<Value>] { allOptions.filter { !$0.disabled } }
    private var selectedOption: MetalSelectOption<Value>? { allOptions.first { $0.value == selection } }

    public var body: some View {
        let recipe = MetalRecipes.select
        let key = size == .compact ? "compact" : "regular"
        let shape = RoundedRectangle(cornerRadius: recipe.points("\(key).radius"), style: .continuous)
        let button = MetalRecipes.button
        let part = size == .compact ? "compact" : "self"
        Button { open = true; highlighted = selection ?? enabledOptions.first?.value } label: {
            HStack(spacing: recipe.points("\(key).gap")) {
                if let lead = selectedOption?.lead {
                    MetalIcon(lead, size: MetalRecipes.menu.points("row.glyph"))
                }
                Text(selectedOption?.label ?? placeholder)
                    .foregroundColor((selectedOption == nil ? colorway.tokens.ink3 : colorway.tokens.ink).color)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.up.chevron.down")
                    .resizable().scaledToFit()
                    .frame(width: recipe.points("chevron.size"), height: recipe.points("chevron.size"))
                    .foregroundColor((open ? colorway.tokens.ink : hovering ? colorway.tokens.ink2 :
                        recipe.color("chevron.ink", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink3).color)
                    .accessibilityHidden(true)
            }
            .font(recipe.font("\(key).font"))
            .padding(.leading, recipe.points("\(key).pad-left"))
            .padding(.trailing, recipe.points("\(key).pad-right"))
            .frame(minWidth: recipe.points("\(key).min-width"))
            .frame(height: recipe.points("\(key).height"))
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .focused($triggerFocused)
        .onHover { hovering = $0 }
        .background {
            ZStack {
                Color.clear.metalObjectRecipe(button, part: part, in: shape).opacity(open ? .zero : .one)
                Color.clear.metalObjectRecipe(button, part: part, state: "pressed", in: shape).opacity(open ? .one : .zero)
                if hovering && !open { shape.fill(recipe.color("veil.hover", colorway: MetalRecipeColorway(colorway))?.color ?? .clear) }
            }
        }
        .overlay {
            if invalid, let ring = recipe.color("error.ring", colorway: MetalRecipeColorway(colorway)) {
                shape.strokeBorder(ring.color, lineWidth: MetalRecipes.well.points("region-dot.hue-edge"))
            }
            if triggerFocused && isEnabled {
                shape.inset(by: -(button.points("self.focus-offset") + button.points("self.focus-width") / 2))
                    .stroke(MetalShared.focus.color, lineWidth: button.points("self.focus-width"))
            }
        }
        .offset(y: open ? button.points("self.travel") : .zero)
        .metalAnimation(.release, value: open)
        .opacity(isEnabled ? .one : button.scalar("self.disabled"))
        .accessibilityLabel(label)
        .accessibilityValue(selectedOption?.label ?? placeholder)
        .accessibilityAddTraits(.isButton)
        .popover(isPresented: $open, arrowEdge: .bottom) { list }
    }

    private var list: some View {
        let recipe = MetalRecipes.menu
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        return VStack(alignment: .leading, spacing: .zero) {
            ForEach(groups.indices, id: \.self) { groupIndex in
                let group = groups[groupIndex]
                if groupIndex > .zero {
                    Color.clear.frame(height: recipe.points("sep.thickness"))
                        .metalObjectRecipe(recipe, part: "sep", in: Rectangle())
                        .padding(.vertical, recipe.points("sep.inset-y"))
                        .padding(.horizontal, recipe.points("sep.inset-x"))
                }
                if !group.label.isEmpty {
                    MetalLabel(group.label, style: .engraved)
                        .padding(.top, recipe.points("heading.pad-top"))
                        .padding(.horizontal, recipe.points("heading.pad-x"))
                        .padding(.bottom, recipe.points("heading.pad-bottom"))
                        .accessibilityAddTraits(.isHeader)
                }
                ForEach(group.options) { option in row(option) }
            }
        }
        .padding(recipe.points("self.pad"))
        .frame(minWidth: recipe.points("self.min-width"), alignment: .leading)
        .metalObjectRecipe(recipe, part: "self", in: shape)
        .background {
            if reduceTransparency { shape.fill(colorway.tokens.frostOpaque.color) }
            else {
                MetalBackdropView(backdrop: MetalBackdrop(
                    blur: recipe.filterNumber("self.blur", function: "blur") ?? .zero,
                    saturation: recipe.filterNumber("self.blur", function: "saturate") ?? .one,
                    dark: colorway == .graphite)).clipShape(shape)
            }
        }
        .opacity(arrived ? .one : .zero)
        .scaleEffect(reduceMotion || arrived ? CGFloat(Double.one) : selectScale)
        .metalAnimation(.settle, value: highlighted)
        .focusable().focusEffectDisabled().focused($listFocused)
        .task {
            arrived = false
            await Task.yield()
            withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true }
            listFocused = true
        }
        .onKeyPress(.downArrow) { move(1); return .handled }
        .onKeyPress(.upArrow) { move(-1); return .handled }
        .onKeyPress(.home) { highlighted = enabledOptions.first?.value; return .handled }
        .onKeyPress(.end) { highlighted = enabledOptions.last?.value; return .handled }
        .onKeyPress(.return) { choose(); return .handled }
        .onKeyPress(.space) { choose(); return .handled }
        .onKeyPress(.escape) { open = false; return .handled }
        .onKeyPress { press in
            guard let character = press.characters.first, character.isLetter || character.isNumber else { return .ignored }
            highlighted = enabledOptions.first { $0.label.localizedLowercase.hasPrefix(String(character).localizedLowercase) }?.value ?? highlighted
            return .handled
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private var selectScale: CGFloat { CGFloat(MetalRecipes.select.scalar("pop.scale")) }

    private func row(_ option: MetalSelectOption<Value>) -> some View {
        let recipe = MetalRecipes.menu
        let select = MetalRecipes.select
        let on = highlighted == option.value
        return Button {
            highlighted = option.value
            choose()
        } label: {
            HStack(spacing: recipe.points("row.gap")) {
                Group {
                    if selection == option.value { MetalLED(.live, size: .small) }
                    else { Color.clear }
                }
                .frame(width: select.points("led.slot"))
                if let lead = option.lead { MetalIcon(lead, size: recipe.points("row.glyph")) }
                Text(option.label).frame(maxWidth: .infinity, alignment: .leading)
            }
            .font(recipe.font("row.font"))
            .foregroundColor(colorway.tokens.ink.color)
            .padding(.horizontal, recipe.points("row.pad"))
            .frame(height: recipe.points("row.height"))
            .background {
                if on { MetalListGlide().matchedGeometryEffect(id: "highlight", in: glide) }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(option.disabled)
        .opacity(option.disabled ? recipe.scalar("row.disabled") : .one)
        .onHover { if $0 && !option.disabled { highlighted = option.value } }
        .accessibilityAddTraits(selection == option.value ? [.isSelected] : [])
    }

    private func move(_ step: Int) {
        guard !enabledOptions.isEmpty else { return }
        guard let index = enabledOptions.firstIndex(where: { $0.value == highlighted }) else {
            highlighted = step > .zero ? enabledOptions.first?.value : enabledOptions.last?.value
            return
        }
        highlighted = enabledOptions[min(max(index + step, .zero), enabledOptions.count - 1)].value
    }

    private func choose() {
        guard let highlighted, enabledOptions.contains(where: { $0.value == highlighted }) else { return }
        selection = highlighted
        open = false
    }
}
