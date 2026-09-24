import SwiftUI

/// A glyph-only control. Its three finishes read the generated icon-button recipe.
public enum MetalIconButtonVariant: Sendable { case tool, ghost, mini }

private struct MetalIconButtonShape: InsettableShape {
    let tool: Bool
    let radius: Double
    var inset: Double = .zero

    func path(in rect: CGRect) -> Path {
        let bounds = rect.insetBy(dx: inset, dy: inset)
        return tool
            ? RoundedRectangle(cornerRadius: max(.zero, radius - inset), style: .continuous).path(in: bounds)
            : Capsule(style: .continuous).path(in: bounds)
    }

    func inset(by amount: CGFloat) -> MetalIconButtonShape {
        var shape = self
        shape.inset += amount
        return shape
    }
}

public struct MetalIconButton<Icon: View>: View {
    let label: String
    let variant: MetalIconButtonVariant
    let pressed: Bool
    let accept: Bool
    let icon: Icon
    let action: () -> Void

    public init(_ label: String, variant: MetalIconButtonVariant = .ghost,
                pressed: Bool = false, accept: Bool = false, action: @escaping () -> Void,
                @ViewBuilder icon: () -> Icon) {
        self.label = label
        self.variant = variant
        self.pressed = pressed
        self.accept = accept
        self.action = action
        self.icon = icon()
    }

    public var body: some View {
        Button(action: action) { icon }
            .buttonStyle(MetalIconButtonStyle(variant: variant, latched: pressed, accept: accept))
            .focusEffectDisabled()
            .accessibilityLabel(label)
            .accessibilityAddTraits(pressed ? [.isSelected] : [])
    }
}

extension MetalIconButton where Icon == MetalIcon {
    public init(_ label: String, icon: MetalIconName, variant: MetalIconButtonVariant = .ghost,
                pressed: Bool = false, action: @escaping () -> Void) {
        self.init(label, variant: variant, pressed: pressed, action: action) {
            MetalIcon(icon, size: MetalRecipes.iconButton.points(variant == .tool ? "tool.glyph" : "ghost.glyph"))
        }
    }
}

private struct MetalIconButtonStyle: ButtonStyle {
    let variant: MetalIconButtonVariant
    let latched: Bool
    let accept: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false

    func makeBody(configuration: Configuration) -> some View {
        let recipe = MetalRecipes.iconButton
        let cw = MetalRecipeColorway(colorway)
        let tool = variant == .tool
        let mini = variant == .mini
        let part = tool ? "tool" : mini ? "mini" : "ghost"
        let shape = MetalIconButtonShape(tool: tool, radius: recipe.points("tool.radius"))
        let down = tool && (latched || configuration.isPressed)
        let width = recipe.points(tool ? "tool.size" : mini ? "mini.w" : "ghost.size")
        let height = recipe.points(tool ? "tool.size" : mini ? "mini.h" : "ghost.size")
        let inkKey = tool ? "tool.ink" : hovering ? (mini && accept ? "mini.accept-ink" : "\(part).ink-hover") : "\(part).ink"
        let ink = recipe.color(inkKey, colorway: cw)?.color ?? .clear
        let travel = MetalMotion.resolve(.release, reduceMotion: reduceMotion).allowsTravel
        configuration.label
            .font(mini ? recipe.font("mini.font") : nil)
            .foregroundColor(ink)
            .metalIconInteraction(MetalIconInteraction(isHovered: hovering && isEnabled,
                                                       isPressed: configuration.isPressed))
            .frame(width: mini ? nil : recipe.points(tool ? "tool.glyph" : "ghost.glyph"),
                   height: mini ? nil : recipe.points(tool ? "tool.glyph" : "ghost.glyph"))
            .frame(width: width, height: height)
            .contentShape(shape)
            .metalObjectRecipe(recipe, part: part,
                               state: down ? "pressed" : hovering && !tool ? "hover" : nil, in: shape)
            .animation(.easeInOut(duration: recipe.durationSeconds(tool ? "tool.shadow-time" : "self.fade")),
                       value: tool ? down : hovering)
            .overlay(alignment: .topTrailing) {
                if latched && tool {
                    Color.clear
                        .frame(width: recipe.points("led.size"), height: recipe.points("led.size"))
                        .metalObjectRecipe(recipe, part: "led", in: Circle())
                        .padding(recipe.points("led.inset"))
                }
            }
            .overlay {
                if isFocused && isEnabled {
                    shape.strokeBorder(MetalShared.focus.color, lineWidth: MetalRing.focusWidth)
                }
            }
            .offset(y: down && travel ? recipe.points("tool.press") : .zero)
            .animation(.linear(duration: recipe.durationSeconds("tool.press-time")), value: down)
            .onHover { hovering = $0 }
            .opacity(isEnabled ? .one : MetalRecipes.button.scalar("self.disabled"))
    }
}
