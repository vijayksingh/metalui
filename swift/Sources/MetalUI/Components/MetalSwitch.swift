import SwiftUI

public enum MetalSwitchSize: Sendable {
    case regular, small
}

/// SwiftUI Toggle keeps switch semantics, keyboard handling, and its bound state.
public struct MetalSwitch: View {
    private let label: String
    @Binding private var isOn: Bool
    private let size: MetalSwitchSize

    public init(_ label: String, isOn: Binding<Bool>, size: MetalSwitchSize = .regular) {
        self.label = label
        self._isOn = isOn
        self.size = size
    }

    public var body: some View {
        Toggle(label, isOn: $isOn)
            .toggleStyle(MetalSwitchStyle(size: size))
            .accessibilityLabel(label)
    }
}

public struct MetalSwitchStyle: ToggleStyle {
    public let size: MetalSwitchSize

    public init(size: MetalSwitchSize = .regular) { self.size = size }

    public func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn.toggle() } label: { configuration.label }
        .buttonStyle(MetalSwitchButtonStyle(isOn: configuration.isOn, size: size))
        .focusEffectDisabled()
    }
}

private struct MetalSwitchButtonStyle: ButtonStyle {
    let isOn: Bool
    let size: MetalSwitchSize

    func makeBody(configuration: Configuration) -> some View {
        MetalSwitchBody(isOn: isOn, size: size, pressed: configuration.isPressed)
    }
}

private struct MetalSwitchBody: View {
    let isOn: Bool
    let size: MetalSwitchSize
    let pressed: Bool

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused

    var body: some View {
        let recipe = MetalRecipes.`switch`
        let small = size == .small
        let width = recipe.points(small ? "small.width" : "self.width")
        let height = recipe.points(small ? "small.height" : "self.height")
        let diameter = recipe.points(small ? "small.thumb" : "thumb.size")
        let travel = recipe.points(small ? "small.travel" : "thumb.travel")
        let stretch = pressed && isEnabled ? recipe.points("thumb.stretch") : .zero
        let shape = Capsule(style: .continuous)

        ZStack(alignment: .leading) {
            Color.clear.metalObjectRecipe(recipe, part: "self", in: shape)
            Color.clear.metalObjectRecipe(recipe, part: "self", state: "on", in: shape)
                .opacity(isOn ? Double.one : .zero)
                .animation(.easeInOut(duration: MetalSprings.settle.duration), value: isOn)
            Color.clear
                .frame(width: diameter + stretch, height: diameter)
                .metalObjectRecipe(recipe, part: "thumb", in: shape)
                .offset(x: recipe.points("self.pad") + (isOn ? travel - stretch : .zero))
                .metalAnimation(.part, value: isOn)
                .metalAnimation(.part, value: pressed)
        }
        .frame(width: width, height: height)
        .contentShape(shape)
        .overlay {
            if isFocused && isEnabled {
                shape
                    .inset(by: -(MetalRing.focusOffset + MetalRing.focusWidth / 2))
                    .stroke(MetalShared.focus.color, lineWidth: MetalRing.focusWidth)
            }
        }
        .opacity(isEnabled ? Double.one : recipe.scalar("self.disabled"))
    }
}
