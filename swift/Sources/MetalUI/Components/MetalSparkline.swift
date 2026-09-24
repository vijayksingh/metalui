import SwiftUI

/// One daily slot. `nil` in the series leaves a visible break in the line.
public struct MetalSparklinePoint {
    public let value: Double
    public let title: String?
    public let onSelect: (() -> Void)?

    public init(value: Double, title: String? = nil, onSelect: (() -> Void)? = nil) {
        self.value = value
        self.title = title
        self.onSelect = onSelect
    }
}

/// A recipe-painted series: broken line, dashed average, and selectable dots.
public struct MetalSparkline: View {
    public enum Size: Sendable { case regular, mini }

    let points: [MetalSparklinePoint?]
    let size: Size
    @Environment(\.metalColorway) private var colorway

    public init(points: [MetalSparklinePoint?], size: Size = .regular) {
        self.points = points
        self.size = size
    }

    public var body: some View {
        let recipe = MetalRecipes.sparkline
        let height = recipe.points(size == .mini ? "self.height-mini" : "self.height")
        let values = points.compactMap { $0?.value }
        GeometryReader { geometry in
            if let minimum = values.min(), let maximum = values.max() {
                let flat = maximum - minimum < 0.000001
                let low = flat ? minimum - 1 : minimum
                let high = flat ? maximum + 1 : maximum
                let pad = recipe.points("dot.r") * 2
                let x: (Int) -> CGFloat = { index in
                    points.count > 1
                        ? geometry.size.width * CGFloat(index) / CGFloat(points.count - 1)
                        : geometry.size.width / 2
                }
                let y: (Double) -> CGFloat = { value in
                    height - pad - ((value - low) / (high - low)) * (height - pad * 2)
                }
                let average = values.reduce(0, +) / Double(values.count)
                let finish = MetalRecipeColorway(colorway)
                let dash = (recipe.text("base.dash") ?? "").split(separator: " ")
                    .compactMap { Double($0) }.map { CGFloat($0) }
                let last = points.indices.last { points[$0] != nil }

                ZStack(alignment: .topLeading) {
                    Path { path in
                        path.move(to: CGPoint(x: .zero, y: y(average)))
                        path.addLine(to: CGPoint(x: geometry.size.width, y: y(average)))
                    }
                    .stroke((recipe.color("base.color", colorway: finish) ?? colorway.tokens.rule).color,
                            style: StrokeStyle(lineWidth: recipe.points("base.width"), dash: dash))

                    Path { path in
                        var connected = false
                        for index in points.indices {
                            guard let point = points[index] else { connected = false; continue }
                            let position = CGPoint(x: x(index), y: y(point.value))
                            if connected { path.addLine(to: position) }
                            else { path.move(to: position) }
                            connected = true
                        }
                    }
                    .stroke((recipe.color("line.color", colorway: finish) ?? colorway.tokens.ink2).color,
                            style: StrokeStyle(lineWidth: recipe.points("line.width"),
                                               lineCap: .round, lineJoin: .round))

                    ForEach(points.indices, id: \.self) { index in
                        if let point = points[index] {
                            let isLast = index == last
                            let radius = recipe.points(isLast ? "dot.r-last" : "dot.r")
                            let fill = recipe.color(isLast ? "dot.last-fill" : "dot.fill", colorway: finish) ?? colorway.tokens.sHi
                            let ring = recipe.color(isLast ? "dot.last-ring" : "dot.ring", colorway: finish) ?? colorway.tokens.ink2
                            let dot = Circle().fill(fill.color)
                                .overlay { Circle().strokeBorder(ring.color, lineWidth: recipe.points("dot.stroke")) }
                                .frame(width: radius + radius, height: radius + radius)
                            if let onSelect = point.onSelect {
                                Button(action: onSelect) { dot }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel(point.title ?? "Trend point")
                                    .help(point.title ?? "")
                                    .position(x: x(index), y: y(point.value))
                            } else {
                                dot.accessibilityHidden(true)
                                    .position(x: x(index), y: y(point.value))
                            }
                        }
                    }
                }
            }
        }
        .frame(height: height)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Trend")
    }
}
