import SwiftUI

// A question composed from the generated chip, label and icon-button recipes.

/// One question the recognizer asks at middle confidence, beside its block: "Task? 0.72 ✓ ×".
/// Faint (.62) until its block is hovered; arrives on settle from 3 above and .96.
public struct MetalSuggestionChip: View {
    let label: String
    let confidence: Double
    let hostHovered: Bool
    let onAccept: () -> Void
    let onDismiss: () -> Void
    let onHoverChange: (Bool) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var arrived = false
    @State private var hovering = false
    private enum Action: Hashable { case accept, dismiss }
    @FocusState private var focusedAction: Action?

    public init(label: String, confidence: Double, hostHovered: Bool = false, onAccept: @escaping () -> Void, onDismiss: @escaping () -> Void, onHoverChange: @escaping (Bool) -> Void = { _ in }) {
        self.label = label
        self.confidence = confidence
        self.hostHovered = hostHovered
        self.onAccept = onAccept
        self.onDismiss = onDismiss
        self.onHoverChange = onHoverChange
    }

    public var body: some View {
        let conf = String(format: "%.2f", confidence)
        let travel = MetalMotion.resolve(.settle, reduceMotion: reduceMotion).allowsTravel
        MetalChip(.suggestion) {
            MetalChipText { Text(label) }
            MetalLabel(conf, style: .small)
                .padding(.leading, MetalSuggestion.confMarginStart)
                .padding(.trailing, MetalSuggestion.confMarginEnd)
                .accessibilityHidden(true)
            MetalChipActions {
                MetalIconButton("Accept", variant: .mini, accept: true, action: onAccept) { Text("✓") }
                    .focused($focusedAction, equals: .accept)
                MetalIconButton("Dismiss", variant: .mini, action: onDismiss) { Text("×") }
                    .focused($focusedAction, equals: .dismiss)
            }
        }
        .opacity(arrived ? (hostHovered || hovering || focusedAction != nil ? .one : MetalSuggestion.restOpacity) : .zero)
        .offset(y: arrived || !travel ? 0 : -MetalSuggestion.enterRise)
        .scaleEffect(arrived || !travel ? .one : MetalSuggestion.enterScale)
        .onHover { hovering = $0; onHoverChange($0) }
        .metalAnimation(.settle, value: hovering || hostHovered || focusedAction != nil)
        .onAppear { withMetalAnimation(.settle, reduceMotion: reduceMotion) { arrived = true } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Suggestion: \(label) Confidence \(conf)")
    }
}
