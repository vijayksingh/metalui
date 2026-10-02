import SwiftUI

public enum MetalMeterBad: Sendable { case high, low }

/// A measurement in a range. Segments use the shared lamp/socket materials, never a task spinner.
public struct MetalMeter: View {
    private let label: String
    private let value: Double
    private let range: ClosedRange<Double>
    private let segments: Int?
    private let warn: Double?
    private let danger: Double?
    private let bad: MetalMeterBad
    private let showValue: Bool
    private let valueText: String?
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    @State private var presented: Int?
    @State private var from = 0

    public init(_ label: String, value: Double, in range: ClosedRange<Double> = 0...100,
                segments: Int? = nil, warn: Double? = nil, danger: Double? = nil,
                bad: MetalMeterBad = .high, showValue: Bool = true, valueText: String? = nil) {
        self.label = label; self.value = value; self.range = range; self.segments = segments
        self.warn = warn; self.danger = danger; self.bad = bad
        self.showValue = showValue; self.valueText = valueText
    }
    public var body: some View {
        let recipe = MetalRecipes.meter
        let lamp = MetalRecipes.status
        let count = max(1, segments ?? Int(recipe.scalar("self.segments")))
        let span = range.upperBound - range.lowerBound
        let share = min(1, max(0, (value - range.lowerBound) / (span > 0 ? span : 1)))
        let target = Int((share * Double(count)).rounded())
        let lit = presented ?? target
        let warning = warn ?? recipe.scalar("zone.warn")
        let critical = danger ?? recipe.scalar("zone.danger")
        let bezel = lamp.points("lamp.bezel")
        let fade = recipe.durationSeconds("lamp.fade")
        let stagger = recipe.durationSeconds("lamp.stagger")
        let radius = recipe.points("self.radius")
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        let cw = MetalRecipeColorway(colorway)
        let words = valueText ?? share.formatted(.percent.precision(.fractionLength(0)))
        VStack(spacing: recipe.points("self.head-gap")) {
            if !label.isEmpty || showValue {
                HStack {
                    Text(label).font(.metal(MetalType.ui)).foregroundColor(colorway.tokens.ink.color)
                    Spacer()
                    if showValue { Text(words).font(.metal(MetalType.meta)).monospacedDigit().foregroundColor(colorway.tokens.ink2.color) }
                }
            }
            HStack(spacing: recipe.points("self.gap")) {
                ForEach(0..<count, id: \.self) { i in
                    let zone = bad == .low ? Double(count - i) / Double(count) : Double(i + 1) / Double(count)
                    let kind = zone > critical ? "failed" : zone > warning ? "waiting" : "live"
                    let step = max(0, lit >= from ? i - from : from - 1 - i)
                    Color.clear
                        .metalObjectRecipe(lamp, part: "socket", in: shape, self: lamp.color("ink.off", colorway: cw))
                        .overlay {
                            Color.clear
                                .metalObjectRecipe(lamp, part: "lamp", in: shape, self: lamp.color("ink.\(kind)", colorway: cw))
                                .padding(bezel)
                                .opacity(i < lit ? Double.one : Double.zero)
                                .animation(reduceMotion ? nil : .easeOut(duration: fade).delay(Double(step) * stagger), value: i < lit)
                        }
                }
            }
            .frame(height: recipe.points("self.height"))
        }
        .frame(minWidth: recipe.points("self.min-width"))
        .onChange(of: target) { old, new in from = presented ?? old; presented = new }
        .onAppear { presented = target; from = target }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue(words)
    }
}
