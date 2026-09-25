import SwiftUI

struct MetalTrackOption<Value: Hashable>: Identifiable {
    let value: Value
    let title: String
    var disabled = false
    var id: Value { value }
}

/// Shared track and travelling thumb for Switcher values and Tabs panels.
struct MetalSwitchTrack<Value: Hashable>: View {
    enum Role { case value, tab }

    let label: String
    @Binding var selection: Value
    let options: [MetalTrackOption<Value>]
    let size: MetalSwitcher<Value>.Size
    let role: Role

    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var thumb
    @State private var hovering: Value?
    @FocusState private var focused: Value?

    @ViewBuilder
    var body: some View {
        if role == .tab {
            track.accessibilityRepresentation {
                TabView(selection: $selection) {
                    ForEach(options, id: \.value) { option in
                        Color.clear
                            .tabItem { Text(option.title) }
                            .tag(option.value)
                            .disabled(option.disabled)
                    }
                }
                .accessibilityLabel(label)
            }
        } else {
            track
        }
    }

    private var track: some View {
        let recipe = MetalRecipes.switcher
        let cw = MetalRecipeColorway(colorway)
        let h = recipe.points(size == .compact ? "option.height" : "option.height-regular")
        return HStack(spacing: .zero) {
            ForEach(options, id: \.value) { option in
                let on = option.value == selection
                Button {
                    withMetalAnimation(.part, reduceMotion: reduceMotion) { selection = option.value }
                } label: {
                    Text(option.title)
                        .font(recipe.font("option.font"))
                        .tracking(recipe.tracking("option.tracking", size: recipe.fontSize("option.font")))
                        .foregroundColor((recipe.color(on || hovering == option.value ? "option.ink-on" : "option.ink", colorway: cw) ?? colorway.tokens.ink).color)
                        .padding(.horizontal, recipe.points("option.pad-x"))
                        .frame(height: h)
                        .background {
                            if on {
                                Color.clear
                                    .metalObjectRecipe(recipe, part: "thumb", in: Capsule(style: .continuous))
                                    .matchedGeometryEffect(id: "thumb", in: thumb)
                            }
                        }
                        .contentShape(Capsule())
                        .overlay {
                            if focused == option.value {
                                Capsule().strokeBorder(MetalShared.focus.color, lineWidth: recipe.points("option.focus-width"))
                            }
                        }
                }
                .buttonStyle(.plain)
                .disabled(option.disabled)
                .focused($focused, equals: option.value)
                .focusEffectDisabled()
                .onHover { hovering = $0 ? option.value : nil }
                .onKeyPress(.leftArrow) { move(-1); return .handled }
                .onKeyPress(.rightArrow) { move(1); return .handled }
                .onKeyPress(.home) { select(options.first { !$0.disabled }?.value); return .handled }
                .onKeyPress(.end) { select(options.last { !$0.disabled }?.value); return .handled }
                .accessibilityAddTraits(on ? [.isSelected] : [])
            }
        }
        .padding(recipe.points("self.pad"))
        .metalObjectRecipe(recipe, part: "self", in: Capsule(style: .continuous))
        .opacity(isEnabled ? Double.one : recipe.scalar("option.disabled"))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func select(_ value: Value?) {
        guard let value else { return }
        withMetalAnimation(.part, reduceMotion: reduceMotion) { selection = value }
        focused = value
    }

    private func move(_ step: Int) {
        let enabled = options.filter { !$0.disabled }
        guard !enabled.isEmpty else { return }
        let index = enabled.firstIndex { $0.value == selection } ?? .zero
        let next = (index + step + enabled.count) % enabled.count
        select(enabled[next].value)
    }
}

/// A pill of pills: one of a few values. The thumb glides on the part spring.
public struct MetalSwitcher<Value: Hashable>: View {
    public enum Size: Sendable { case compact, regular }

    let label: String
    let options: [(value: Value, title: String)]
    @Binding var selection: Value
    let size: Size

    public init(_ label: String, selection: Binding<Value>, options: [(value: Value, title: String)], size: Size = .regular) {
        self.label = label
        _selection = selection
        self.options = options
        self.size = size
    }

    public var body: some View {
        MetalSwitchTrack(label: label, selection: $selection,
                         options: options.map { MetalTrackOption(value: $0.value, title: $0.title) },
                         size: size, role: .value)
    }
}

@available(*, deprecated, renamed: "MetalSwitcher")
public typealias MetalSegmented = MetalSwitcher
