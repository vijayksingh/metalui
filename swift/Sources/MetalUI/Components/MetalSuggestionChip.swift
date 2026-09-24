import SwiftUI

// Suggestion chip. Mirrors components/suggestion-chip from MetalSuggestion and the colorway tokens.

/// One question the recognizer asks at middle confidence, beside its block: "Task? 0.72 ✓ ×".
/// Faint (.62) until its block is hovered; arrives on settle from 3 above and .96.
public struct MetalSuggestionChip: View {
    let label: String
    let confidence: Double
    let hostHovered: Bool
    let onAccept: () -> Void
    let onDismiss: () -> Void

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false
    @State private var hovering = false

    public init(label: String, confidence: Double, hostHovered: Bool = false, onAccept: @escaping () -> Void, onDismiss: @escaping () -> Void) {
        self.label = label
        self.confidence = confidence
        self.hostHovered = hostHovered
        self.onAccept = onAccept
        self.onDismiss = onDismiss
    }

    public var body: some View {
        let t = colorway.tokens
        let conf = String(format: "%.2f", confidence)
        let travel = MetalMotion.resolve(.settle, reduceMotion: reduceMotion).allowsTravel
        HStack(spacing: MetalSuggestion.gap) {
            Text(label).font(.metal(MetalType.ui)).tracking(MetalType.ui.trackingPoints)
            Text(conf)
                .font(.metal(MetalType.label)).tracking(MetalType.label.trackingPoints)
                .foregroundColor(t.engrave.color)
                .padding(.horizontal, 2)
                .accessibilityHidden(true)
            MetalSuggestionButton(symbol: "✓", label: "Accept", accept: true, action: onAccept)
            MetalSuggestionButton(symbol: "×", label: "Dismiss", accept: false, action: onDismiss)
        }
        .foregroundColor(t.ink2.color)
        .padding(.leading, MetalSuggestion.padStart)
        .padding(.trailing, MetalSuggestion.padEnd)
        .frame(height: MetalSuggestion.height)
        .metalRecipe(MetalRecipe(fill: .solid(t.suggestionBg), shadows: [MetalShadow(inset: true, x: 0, y: 0, blur: 0, spread: 0.5, color: MetalSuggestion.ring)] + t.raiseSm), in: Capsule(style: .continuous))
        .opacity(arrived ? (hostHovered || hovering ? 1 : MetalSuggestion.restOpacity) : 0)
        .offset(y: arrived || !travel ? 0 : -MetalSuggestion.enterRise)
        .scaleEffect(arrived || !travel ? 1 : MetalSuggestion.enterScale)
        .onHover { hovering = $0 }
        .metalAnimation(.settle, value: hovering || hostHovered)
        .onAppear { withMetalAnimation(.settle, reduceMotion: reduceMotion) { arrived = true } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Suggestion: \(label) Confidence \(conf)")
    }
}

private struct MetalSuggestionButton: View {
    let symbol: String
    let label: String
    let accept: Bool
    let action: () -> Void
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    var body: some View {
        let t = colorway.tokens
        Button(action: action) {
            Text(symbol)
                .font(.metal(MetalType.ui))
                .foregroundColor((hovering ? (accept ? MetalShared.greenDeep : t.ink) : t.ink3).color)
                .frame(width: MetalSuggestion.buttonWidth, height: MetalSuggestion.buttonHeight)
                .background(Capsule().fill(hovering ? t.suggestionButtonHover.color : .clear))
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .metalAnimation(.settle, value: hovering)
        .accessibilityLabel(label)
    }
}
