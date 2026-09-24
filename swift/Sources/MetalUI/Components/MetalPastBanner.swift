import SwiftUI

// Past banner. Mirrors components/past-banner from MetalPastBannerMetrics and the graphite frost.

/// Says the canvas is showing the past, and brings it back: MEMORY · the moment · Back to Now ⎋.
public struct MetalPastBanner: View {
    let moment: String
    let onBack: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false
    @State private var hovering = false

    public init(moment: String, onBack: @escaping () -> Void) {
        self.moment = moment
        self.onBack = onBack
    }

    public var body: some View {
        let label = MetalType.label
        let travel = MetalMotion.resolve(.surface, reduceMotion: reduceMotion).allowsTravel
        HStack(spacing: MetalPastBannerMetrics.gap) {
            Text("MEMORY").font(.metal(label)).tracking(label.trackingPoints)
                .foregroundColor(MetalPastBannerMetrics.engrave.color)
                .shadow(color: MetalPastBannerMetrics.engraveLip.color, radius: 0, x: 0, y: -1)
            Text(moment).font(.metal(MetalType.ui)).tracking(MetalType.ui.trackingPoints)
            Button(action: onBack) {
                HStack(spacing: 6) {
                    Text("Back to Now").font(.metal(MetalType.ui))
                    Text("⎋").foregroundColor(MetalPastBannerMetrics.engrave.color)
                }
                .padding(.horizontal, MetalPastBannerMetrics.buttonPad)
                .frame(height: MetalPastBannerMetrics.buttonHeight)
                .background(Capsule().fill((hovering ? MetalPastBannerMetrics.buttonHover : MetalPastBannerMetrics.buttonBg).color))
                .contentShape(Capsule())
            }
            .buttonStyle(.plain)
            .onHover { hovering = $0 }
            .keyboardShortcut(.escape, modifiers: [])
        }
        .foregroundColor(MetalPastBannerMetrics.ink.color)
        .padding(.leading, MetalPastBannerMetrics.padStart)
        .padding(.trailing, MetalPastBannerMetrics.padEnd)
        .frame(height: MetalPastBannerMetrics.height)
        .fixedSize()
        .metalFrost(.graphite, in: Capsule(style: .continuous))
        .opacity(arrived ? 1 : 0)
        .offset(y: arrived || !travel ? 0 : -MetalRadius.nest)
        .onAppear { withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Memory, \(moment)")
    }
}
