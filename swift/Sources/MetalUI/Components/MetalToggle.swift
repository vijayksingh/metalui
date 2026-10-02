import SwiftUI

private struct MetalToggleTravelKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    var metalToggleTravel: Bool {
        get { self[MetalToggleTravelKey.self] }
        set { self[MetalToggleTravelKey.self] = newValue }
    }
}

/// A button cap and lamp that sink past the catch, then stay on the latch.
public struct MetalToggle: View {
    private let label: String
    @Binding private var isOn: Bool
    private let lamp: Bool

    public init(_ label: String, isOn: Binding<Bool>, lamp: Bool = true) {
        self.label = label; self._isOn = isOn; self.lamp = lamp
    }

    public var body: some View {
        Button { isOn.toggle() } label: {
            HStack(spacing: MetalRecipes.button.points("self.gap")) {
                if lamp { MetalLED(isOn ? .live : .off, size: .small) }
                Text(label)
            }
        }
        .buttonStyle(MetalButtonStyle())
        .focusable()
        .focusEffectDisabled()
        .environment(\.metalButtonGroupLatched, isOn)
        .environment(\.metalToggleTravel, true)
        .accessibilityLabel(label)
        .accessibilityValue(isOn ? "On" : "Off")
        .accessibilityAddTraits(isOn ? [.isSelected] : [])
    }
}

/// One form choice rendered as separate latching caps. Pressing the chosen key keeps it chosen.
public struct MetalRadioKeys<Value: Hashable>: View {
    public struct Option: Identifiable {
        public let value: Value
        public let title: String
        public let disabled: Bool
        public var id: Value { value }
        public init(_ value: Value, _ title: String, disabled: Bool = false) {
            self.value = value; self.title = title; self.disabled = disabled
        }
    }
    private let label: String
    private let options: [Option]
    private let readOnly: Bool
    @Binding private var selection: Value
    @FocusState private var focused: Value?
    @Environment(\.isEnabled) private var enabled

    public init(_ label: String, selection: Binding<Value>, options: [Option], readOnly: Bool = false) {
        self.label = label; self._selection = selection; self.options = options; self.readOnly = readOnly
    }

    public var body: some View {
        HStack(spacing: MetalRecipes.toggle.points("self.gap")) {
            ForEach(options) { option in
                Button { choose(option.value) } label: {
                    HStack(spacing: MetalRecipes.button.points("self.gap")) {
                        MetalLED(selection == option.value ? .live : .off, size: .small)
                        Text(option.title)
                    }
                }
                    .buttonStyle(MetalButtonStyle())
                    .environment(\.metalButtonGroupLatched, selection == option.value)
                    .environment(\.metalToggleTravel, true)
                    .disabled(option.disabled)
                    .focusable()
                    .focused($focused, equals: option.value)
                    .focusEffectDisabled()
                    .onKeyPress(.leftArrow) { move(-1) }
                    .onKeyPress(.upArrow) { move(-1) }
                    .onKeyPress(.rightArrow) { move(1) }
                    .onKeyPress(.downArrow) { move(1) }
                    .accessibilityLabel(option.title)
                    .accessibilityAddTraits(selection == option.value ? [.isSelected] : [])
                    .accessibilityValue(selection == option.value ? "Selected" : "Not selected")
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .accessibilityValue(readOnly ? "Read only" : "")
    }

    private func choose(_ value: Value) {
        guard enabled, !readOnly else { return }
        selection = value
    }

    private func move(_ delta: Int) -> KeyPress.Result {
        guard enabled, !readOnly else { return .ignored }
        let available = options.filter { !$0.disabled }
        guard !available.isEmpty else { return .ignored }
        let index = available.firstIndex { $0.value == (focused ?? selection) } ?? .zero
        let next = available[(index + delta + available.count) % available.count].value
        selection = next; focused = next
        return .handled
    }
}
