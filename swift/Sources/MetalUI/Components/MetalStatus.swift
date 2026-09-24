import SwiftUI

// LED and status badge (KAMUI-16). Mirrors components/status from MetalStatusMetrics and MetalShared.

/// What an LED says.
public enum MetalLEDKind: Sendable {
    case live, waiting, failed, link, off

    var gradient: MetalRadialGradient {
        switch self {
        case .live: return MetalShared.ledGreen
        case .waiting: return MetalShared.ledAmber
        case .failed: return MetalShared.ledRed
        case .link: return MetalShared.ledBlue
        case .off: return MetalShared.ledOff
        }
    }
}

/// A tiny lamp, lit from the top left. Decorative: pair it with words.
public struct MetalLED: View {
    public enum Size: Sendable { case `default`, small }
    let kind: MetalLEDKind
    let size: Size

    public init(_ kind: MetalLEDKind, size: Size = .default) {
        self.kind = kind
        self.size = size
    }

    public var body: some View {
        let d = size == .small ? MetalStatusMetrics.ledSmall : MetalStatusMetrics.led
        Circle()
            .fill(kind.gradient.gradient(diameter: d))
            .frame(width: d, height: d)
            .background { MetalOuterShadows(layers: MetalShared.ledRing + (kind == .live ? MetalStatusMetrics.bloom : []), shape: Circle()) }
            .accessibilityHidden(true)
    }
}

/// A state the system is in, with its LED: "JEV LIVE". Not a button; the hint is its help.
public struct MetalStatusBadge: View {
    let text: String
    let led: MetalLEDKind
    let hint: String?
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String, led: MetalLEDKind, hint: String? = nil) {
        self.text = text
        self.led = led
        self.hint = hint
    }

    public var body: some View {
        let t = colorway.tokens
        HStack(spacing: MetalStatusMetrics.badgeGap) {
            MetalLED(led)
            Text(text.uppercased()).font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints).foregroundColor(t.ink2.color)
        }
        .padding(.leading, MetalStatusMetrics.badgePadStart)
        .padding(.trailing, MetalStatusMetrics.badgePadEnd)
        .frame(height: MetalStatusMetrics.badgeHeight)
        .metalRecipe(MetalRecipe(fill: t.btnBg, shadows: t.btnSh), in: Capsule(style: .continuous))
        .fixedSize()
        .help(hint ?? "")
        .accessibilityElement(children: .combine)
        .accessibilityHint(hint ?? "")
    }
}
