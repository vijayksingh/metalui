import SwiftUI

// Swatch. Mirrors components/swatch: every value is the swatch recipe (MetalRecipes.swatch).

/// A colour as a hard, glossy chip in its own colour: a sheen, a bright top edge and a dark
/// bottom rim, an inner glow, a contact shadow and a drop shadow in its own colour; the hex
/// engraved in the corner in dark or light ink by the colour's luma; a recessed LED dimple top
/// right. With an action it is a button (the host opens its colour picker); hover lifts it.
public struct MetalSwatch: View {
    let hex: String
    let label: String?
    let action: (() -> Void)?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false

    public init(hex: String, label: String? = nil, action: (() -> Void)? = nil) {
        self.hex = hex
        self.label = label
        self.action = action
    }

    public var body: some View {
        let r = MetalRecipes.swatch
        let own = MetalRGBA(hex: hex) ?? MetalRGBA(0, 0, 0, 1)
        let size = r.points("self.size")
        let radius = r.points("self.radius")
        let ledSize = r.points("led.size")
        let ledInset = r.points("led.inset")
        let ink = own.luma > Self.darkInkAbove ? r.color("label.ink-dark") : r.color("label.ink-light")
        let role = r.typeRole("label.font", trackingKey: "label.tracking")
        let chip = ZStack(alignment: .topLeading) {
            Text(label ?? hex)
                .font(.metal(role))
                .tracking(role.trackingPoints)
                .foregroundStyle((ink ?? own).color)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                .padding(.leading, r.points("label.x"))
                .padding(.bottom, r.points("label.y"))
            Color.clear
                .frame(width: ledSize, height: ledSize)
                .metalObjectRecipe(r, part: "led", in: Circle())
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.top, ledInset)
                .padding(.trailing, ledInset)
                .accessibilityHidden(true)
        }
        .frame(width: size, height: size)
        .metalObjectRecipe(r, part: "self", in: RoundedRectangle(cornerRadius: radius, style: .continuous), self: own)
        .offset(y: hovering && !reduceMotion ? -MetalSpace.s2 : 0)
        .metalAnimation(.surface, value: hovering)
        .onHover { hovering = $0 }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Colour \(hex)")

        if let action {
            Button(action: action) { chip }.buttonStyle(.plain)
        } else {
            chip
        }
    }

    /// The chip's size for layout.
    public static var size: CGSize {
        let side = MetalRecipes.swatch.points("self.size")
        return CGSize(width: side, height: side)
    }

    /// Luma above which the engraving is dark (the reference design's contrast rule).
    static let darkInkAbove: Double = 150
}
