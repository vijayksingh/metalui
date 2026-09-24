import SwiftUI

// Segmented control (KAMUI-04). Mirrors components/segmented from MetalSegmentedMetrics and the colorway.

/// A pill of pills: one of a few options. The thumb glides to the selection on the part spring.
public struct MetalSegmented<Value: Hashable>: View {
    public enum Size: Sendable { case compact, regular }

    let label: String
    let options: [(value: Value, title: String)]
    @Binding var selection: Value
    let size: Size

    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var thumb

    public init(_ label: String, selection: Binding<Value>, options: [(value: Value, title: String)], size: Size = .regular) {
        self.label = label
        _selection = selection
        self.options = options
        self.size = size
    }

    public var body: some View {
        let t = colorway.tokens
        let h = size == .compact ? MetalSegmentedMetrics.compact : MetalSegmentedMetrics.regular
        HStack(spacing: 0) {
            ForEach(options, id: \.value) { option in
                let on = option.value == selection
                Button {
                    withMetalAnimation(.part, reduceMotion: reduceMotion) { selection = option.value }
                } label: {
                    Text(option.title)
                        .font(.metal(MetalType.ui)).tracking(MetalType.ui.trackingPoints)
                        .foregroundColor((on ? t.ink : t.ink2).color)
                        .padding(.horizontal, h / 2 - 1)
                        .frame(height: h)
                        .background {
                            if on {
                                Color.clear
                                    .metalRecipe(MetalRecipe(fill: MetalGradient(angle: 180, stops: [.init(t.thumbHi, 0), .init(t.thumbLo, 1)]), shadows: t.raiseSm), in: Capsule(style: .continuous))
                                    .matchedGeometryEffect(id: "thumb", in: thumb)
                            }
                        }
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(on ? [.isSelected] : [])
            }
        }
        .padding(MetalSegmentedMetrics.trackPad)
        .metalRecipe(MetalRecipe(fill: MetalGradient(angle: 180, stops: [.init(t.wellTop, 0), .init(t.wellBot, 1)]), shadows: t.well), in: Capsule(style: .continuous))
        .opacity(isEnabled ? 1 : 0.4)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}
