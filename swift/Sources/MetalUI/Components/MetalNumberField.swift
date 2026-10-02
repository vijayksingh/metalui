import SwiftUI

// WIP: MetalNumberField is a placeholder that keeps the React API's shape (a value in a range with a
// step, a label). It steps within the same range with shared glyph keys, not yet the field-well pill, the keycaps, the drum turn
// or the refusal from number-field.agent.md. Web is the reference.

/// A number you step, scrub or type. Work in progress: see number-field.agent.md.
public struct MetalNumberField: View {
    private let label: String
    @Binding private var value: Int
    private let range: ClosedRange<Int>
    private let step: Int
    @State private var decreaseActs = 0
    @State private var increaseActs = 0

    public init(_ label: String, value: Binding<Int>, in range: ClosedRange<Int>, step: Int = 1) {
        self.label = label
        self._value = value
        self.range = range
        self.step = step
    }

    public var body: some View {
        HStack {
            Text("\(label): \(value)").monospacedDigit()
            Spacer()
            Button { decreaseActs += 1; change(increasing: false) } label: {
                MetalIcon(.minus, size: MetalRecipes.numberField.points("key.glyph"), act: decreaseActs)
            }
            .buttonRepeatBehavior(.enabled)
            .disabled(value <= range.lowerBound)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Decrease \(label)")
            Button { increaseActs += 1; change(increasing: true) } label: {
                MetalIcon(.plus, size: MetalRecipes.numberField.points("key.glyph"), act: increaseActs)
            }
            .buttonRepeatBehavior(.enabled)
            .disabled(value >= range.upperBound)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Increase \(label)")
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .accessibilityValue(String(value))
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: change(increasing: true)
            case .decrement: change(increasing: false)
            @unknown default: break
            }
        }
    }

    private func change(increasing: Bool) {
        let result = increasing ? value.addingReportingOverflow(step) : value.subtractingReportingOverflow(step)
        value = result.overflow ? (increasing ? range.upperBound : range.lowerBound)
            : min(max(result.partialValue, range.lowerBound), range.upperBound)
    }
}
