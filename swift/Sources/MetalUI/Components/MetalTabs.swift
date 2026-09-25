import SwiftUI

public struct MetalTab<Value: Hashable>: Identifiable {
    public let value: Value
    public let title: String
    public let disabled: Bool
    public var id: Value { value }

    public init(_ value: Value, title: String, disabled: Bool = false) {
        self.value = value
        self.title = title
        self.disabled = disabled
    }
}

/// A switcher track whose options own panels. The new panel drifts in from the selected side.
public struct MetalTabs<Value: Hashable, Panel: View>: View {
    let label: String
    @Binding var selection: Value
    let options: [MetalTab<Value>]
    let size: MetalSwitcher<Value>.Size
    let panel: (Value) -> Panel

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hasAppeared = false
    @State private var direction: CGFloat = .zero

    public init(_ label: String, selection: Binding<Value>, options: [MetalTab<Value>],
                size: MetalSwitcher<Value>.Size = .regular, @ViewBuilder panel: @escaping (Value) -> Panel) {
        self.label = label
        _selection = selection
        self.options = options
        self.size = size
        self.panel = panel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s0) {
            MetalSwitchTrack(label: label, selection: tabSelection,
                             options: options.map { MetalTrackOption(value: $0.value, title: $0.title, disabled: $0.disabled) },
                             size: size, role: .tab)
            ZStack(alignment: .topLeading) {
                panel(selection)
                    .id(selection)
                    .transition(.asymmetric(insertion: insertion, removal: .identity))
            }
            .animation(hasAppeared ? MetalMotion.resolve(.settle, reduceMotion: reduceMotion).animation : nil, value: selection)
        }
        .onAppear { hasAppeared = true }
        .onChange(of: selection) { old, new in updateDirection(from: old, to: new) }
    }

    private var insertion: AnyTransition {
        guard hasAppeared, !reduceMotion else { return .opacity }
        return .offset(x: direction * MetalRecipes.tabs.points("panel.drift")).combined(with: .opacity)
    }

    private var tabSelection: Binding<Value> {
        Binding(get: { selection }, set: { new in
            updateDirection(from: selection, to: new)
            selection = new
        })
    }

    private func updateDirection(from old: Value, to new: Value) {
        guard let left = options.firstIndex(where: { $0.value == old }),
              let right = options.firstIndex(where: { $0.value == new }) else { return }
        direction = right >= left ? CGFloat(Double.one) : -CGFloat(Double.one)
    }
}
