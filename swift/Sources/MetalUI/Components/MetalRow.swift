import SwiftUI

/// The recipe row shared by pinned lists, lens panels and palette options.
/// The host supplies the action and accessibility role; a row may contain its
/// own checkbox, so the whole row cannot always be a nested button.
public enum MetalRowVariant: String, Sendable { case list, panel, option }

public struct MetalRow<Lead: View, Content: View, Trail: View>: View {

    let variant: MetalRowVariant
    let checked: Bool
    let active: Bool
    let maybe: Bool
    @ViewBuilder let lead: Lead
    @ViewBuilder let content: Content
    @ViewBuilder let trail: Trail

    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    public init(_ variant: MetalRowVariant = .list, checked: Bool = false,
                active: Bool = false, maybe: Bool = false,
                @ViewBuilder lead: () -> Lead,
                @ViewBuilder text: () -> Content,
                @ViewBuilder trail: () -> Trail) {
        self.variant = variant
        self.checked = checked
        self.active = active
        self.maybe = maybe
        self.lead = lead()
        self.content = text()
        self.trail = trail()
    }

    public var body: some View {
        let recipe = MetalRecipes.row
        let part = variant.rawValue
        let raised = variant == .option ? active : hovering
        let state = raised ? (variant == .option ? "on" : "hover") : nil
        let shape = RoundedRectangle(cornerRadius: recipe.points("\(part).radius"), style: .continuous)
        HStack(alignment: variant == .option ? .center : .top,
               spacing: recipe.points("\(part).gap")) {
            lead.fixedSize()
            content
                .frame(maxWidth: .infinity, alignment: .leading)
                .environment(\.metalRowChecked, checked)
            trail.fixedSize()
        }
        .font(recipe.font("\(part).font"))
        .foregroundColor(colorway.tokens.ink.color)
        .padding(.horizontal, recipe.points("\(part).pad-x"))
        .modifier(MetalRowVerticalLayout(variant: variant, recipe: recipe))
        .metalObjectRecipe(recipe, part: part, state: state, in: shape)
        .overlay(alignment: .leading) {
            if variant == .option && active {
                RoundedRectangle(cornerRadius: recipe.points("rail.radius"), style: .continuous)
                    .fill((recipe.color("rail.color") ?? MetalShared.greenDeep).color)
                    .frame(width: recipe.points("rail.w"))
                    .padding(.vertical, recipe.points("rail.inset"))
                    .offset(x: recipe.points("rail.offset"))
                    .allowsHitTesting(false)
            }
        }
        .contentShape(shape)
        .opacity(maybe ? recipe.scalar("self.maybe") : .one)
        .onHover { hovering = $0 }
        .animation(.easeInOut(duration: recipe.durationSeconds("self.fade")), value: hovering)
    }
}

private struct MetalRowVerticalLayout: ViewModifier {
    let variant: MetalRowVariant
    let recipe: MetalObjectRecipe

    func body(content: Content) -> some View {
        if variant == .option {
            content.frame(height: recipe.points("option.height"))
        } else {
            content.padding(.vertical, recipe.points("\(variant.rawValue).pad-y"))
        }
    }
}

private struct MetalRowCheckedKey: EnvironmentKey {
    static let defaultValue = false
}

private extension EnvironmentValues {
    var metalRowChecked: Bool {
        get { self[MetalRowCheckedKey.self] }
        set { self[MetalRowCheckedKey.self] = newValue }
    }
}

/// The text slot's checked treatment follows the row recipe in both themes.
public struct MetalRowText: View {
    let text: String
    @Environment(\.metalRowChecked) private var checked
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String) { self.text = text }

    public var body: some View {
        let recipe = MetalRecipes.row
        Text(text)
            .foregroundColor(checked
                ? (recipe.color("text.checked", colorway: MetalRecipeColorway(colorway))?.color ?? .clear)
                : colorway.tokens.ink.color)
            .strikethrough(checked)
            .fixedSize(horizontal: false, vertical: true)
    }
}
