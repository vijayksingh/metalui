import SwiftUI

/// The graphite reminder that the canvas is showing an earlier moment.
public struct MetalPastBanner: View {
    let moment: String
    let onBack: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @FocusState private var backFocused: Bool
    @State private var arrived = false
    @State private var hovering = false

    public init(moment: String, onBack: @escaping () -> Void) {
        self.moment = moment
        self.onBack = onBack
    }

    public var body: some View {
        let travel = MetalMotion.resolve(.surface, reduceMotion: reduceMotion).allowsTravel
        MetalSurface(.graphitePlain, radius: .pill) {
            HStack(spacing: MetalPastBannerMetrics.gap) {
                MetalLabel("MEMORY", style: .dark)
                MetalLabel(moment, style: .onGraphite)
                Button(action: onBack) {
                    HStack(spacing: MetalPastBannerMetrics.keyGap) {
                        MetalLabel("Back to Now", style: .onGraphite)
                        MetalKbd("⎋", size: .small, surface: .strip)
                    }
                    .padding(.horizontal, MetalPastBannerMetrics.buttonPad)
                    .frame(height: MetalPastBannerMetrics.buttonHeight)
                    .background {
                        Capsule().fill((hovering ? MetalPastBannerMetrics.buttonHover :
                            MetalPastBannerMetrics.buttonBg).color)
                    }
                    .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .focusEffectDisabled()
                .focused($backFocused)
                .overlay {
                    if backFocused {
                        Capsule().stroke(MetalShared.focus.color,
                                         lineWidth: MetalRecipes.button.points("self.focus-width"))
                    }
                }
                .onHover { hovering = $0 }
                .keyboardShortcut(.escape, modifiers: [])
                .accessibilityLabel("Back to Now")
            }
            .padding(.leading, MetalPastBannerMetrics.padStart)
            .padding(.trailing, MetalPastBannerMetrics.padEnd)
            .frame(height: MetalPastBannerMetrics.height)
            .fixedSize()
        }
        .opacity(arrived ? .one : .zero)
        .offset(y: arrived || !travel ? .zero : -MetalRadius.nest)
        .onAppear { withMetalAnimation(.surface, reduceMotion: reduceMotion) { arrived = true } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Memory, \(moment)")
    }
}
