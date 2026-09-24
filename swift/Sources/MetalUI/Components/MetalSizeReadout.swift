import SwiftUI

// Size readout: the KAMUI-14 readout on its own. Mirrors components/size-readout from MetalPresence.

/// A graphite pill that reads a measured value: "● 320 × 214", "● 3 · 540 × 180", "● COPIED · PNG 130 × 215", "● 100 %".
public struct MetalSizeReadout: View {
    let size: CGSize
    let count: Int?
    let copied: String?
    let value: String?
    let led: Bool

    public init(size: CGSize = .zero, count: Int? = nil, copied: String? = nil, value: String? = nil, led: Bool = true) {
        self.size = size
        self.count = count
        self.copied = copied
        self.value = value
        self.led = led
    }

    public var body: some View {
        let w = Int(size.width.rounded()), h = Int(size.height.rounded())
        let dim = MetalPresence.readoutDim.color
        let role = MetalType.readout
        let label: Text = {
            if let value { return Text(value) }
            if let copied { return Text("COPIED ") + Text("·").foregroundColor(dim) + Text(" \(copied) \(w) ") + Text("×").foregroundColor(dim) + Text(" \(h)") }
            if let count, count > 1 { return Text("\(count) ") + Text("·").foregroundColor(dim) + Text(" \(w) ") + Text("×").foregroundColor(dim) + Text(" \(h)") }
            return Text("\(w) ") + Text("×").foregroundColor(dim) + Text(" \(h)")
        }()
        HStack(spacing: MetalPresence.readoutGapInner) {
            if led {
                Circle()
                    .fill(MetalShared.ledGreen.gradient(diameter: MetalPresence.readoutLed))
                    .frame(width: MetalPresence.readoutLed, height: MetalPresence.readoutLed)
            }
            label
                .font(.metal(role))
                .tracking(MetalPresence.readoutTracking * role.size)
                .monospacedDigit()
                .foregroundColor(MetalPresence.readoutInk.color)
                .lineLimit(1)
                .fixedSize()
        }
        .padding(.leading, MetalPresence.readoutPadStart)
        .padding(.trailing, MetalPresence.readoutPadEnd)
        .frame(height: MetalPresence.readoutHeight)
        .metalRecipe(MetalRecipe(fill: MetalPresence.readoutBg, shadows: MetalPresence.readoutSh), in: Capsule(style: .continuous))
        .fixedSize()
    }
}
