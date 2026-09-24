import SwiftUI

/// Text roles from the generated label recipe.
public struct MetalLabel: View {
    public enum Style: String, Sendable {
        case engraved, small, title, heading, query, count, cell, value
        case valueSmall = "value-small"
        case display
        case displayQuiet = "display-quiet"
        case readout
        case readoutDim = "readout-dim"
        case onGraphite = "on-graphite"
        case dark, name, detail

        var fontPart: String {
            switch self {
            case .dark: return "engraved"
            case .readoutDim: return "readout"
            default: return rawValue
            }
        }

        var colorPart: String { self == .small ? "engraved" : rawValue }
        var lipPart: String? {
            switch self {
            case .engraved, .small: return "engraved"
            case .dark: return "dark"
            default: return nil
            }
        }
        var wraps: Bool { self == .display || self == .displayQuiet }
    }

    public enum Tone: Sendable { case accent }

    let text: String
    let style: Style
    let tone: Tone?
    let placeholder: String?
    let emphasis: String?
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String, style: Style = .engraved, tone: Tone? = nil,
                placeholder: String? = nil, emphasis: String? = nil) {
        self.text = text
        self.style = style
        self.tone = tone
        self.placeholder = placeholder
        self.emphasis = emphasis
    }

    public var body: some View {
        let recipe = MetalRecipes.label
        let finish = MetalRecipeColorway(colorway)
        let part = style.fontPart
        let role = recipe.typeRole("\(part).font", trackingKey: "\(part).tracking")
        let isPlaceholder = text.isEmpty && placeholder != nil
        let inkPart = isPlaceholder ? "placeholder" : tone == .accent ? "accent" : style.colorPart
        let ink = recipe.color("\(inkPart).color", colorway: finish)?.color ?? .clear
        let lip = tone == .accent || isPlaceholder ? nil : style.lipPart.flatMap {
            recipe.textShadows($0, colorway: finish).first
        }
        let raw = isPlaceholder ? placeholder ?? "" : text
        let displayed = recipe.text("\(part).transform") == "uppercase" ? raw.uppercased() : raw
        let font = isPlaceholder
            ? Font.metal(role).weight(MetalObjectRecipe.weight(recipe.scalar("placeholder.weight")))
            : Font.metal(role)
        let label: Text = {
            guard !isPlaceholder, let emphasis, displayed.hasPrefix(emphasis.uppercased()),
                  let color = recipe.color("emphasis.color", colorway: finish) else { return Text(displayed) }
            let prefix = Text(emphasis.uppercased())
                .font(.metal(role).weight(MetalObjectRecipe.weight(recipe.scalar("emphasis.weight"))))
                .foregroundColor(color.color)
            return prefix + Text(String(displayed.dropFirst(emphasis.count)))
        }()
        label
            .font(font)
            .tracking(role.trackingPoints)
            .foregroundColor(ink)
            .shadow(color: lip?.color.color ?? .clear,
                    radius: lip?.blur ?? .zero, x: lip?.x ?? .zero, y: lip?.y ?? .zero)
            .lineLimit(style.wraps ? nil : 1)
            .fixedSize(horizontal: !style.wraps, vertical: true)
            .frame(height: style.wraps ? nil : ceil(recipe.lineHeight("\(part).font")))
            .metalAnimation(.settle, value: tone == .accent)
            .accessibilityLabel(raw)
    }
}

/// A label's editable form, with the same role and a generated accent caret.
public struct MetalEditableLabel: View {
    @Binding var text: String
    let style: MetalLabel.Style
    let placeholder: String
    let name: String
    @Environment(\.metalColorway) private var colorway

    public init(_ name: String, text: Binding<String>, style: MetalLabel.Style = .title,
                placeholder: String = "") {
        self.name = name
        self._text = text
        self.style = style
        self.placeholder = placeholder
    }

    public var body: some View {
        let recipe = MetalRecipes.label
        let part = style.fontPart
        let finish = MetalRecipeColorway(colorway)
        TextField("", text: $text, prompt: Text(placeholder)
            .foregroundColor(recipe.color("placeholder.color", colorway: finish)?.color ?? .clear))
            .textFieldStyle(.plain)
            .font(recipe.font("\(part).font"))
            .tracking(recipe.tracking("\(part).tracking", size: recipe.fontSize("\(part).font")))
            .foregroundColor(recipe.color("\(style.colorPart).color", colorway: finish)?.color ?? .clear)
            .tint(MetalShared.greenDeep.color)
            .fixedSize(horizontal: true, vertical: false)
            .frame(height: ceil(recipe.lineHeight("\(part).font")))
            .accessibilityLabel(name)
    }
}
