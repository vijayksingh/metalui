import SwiftUI

public enum MetalTextareaSize: Sendable { case large, regular, compact }

// WIP: MetalTextarea is a placeholder that keeps the React API's shape (text, rows, limit, invalid).
// It grows between the rows with a vertical TextField, but does not yet draw the field well, the
// settle-spring growth or its refusal shake from textarea.agent.md. Web is the reference.

/// Several lines of text. Work in progress: see textarea.agent.md for the finished behaviour.
public struct MetalTextarea: View {
    private let label: String
    @Binding private var text: String
    private let minRows: Int
    private let maxRows: Int
    private let limit: Int?
    private let invalid: Bool
    private let size: MetalTextareaSize
    private let counterThreshold: Double
    @Environment(\.metalColorway) private var colorway

    public init(_ label: String, text: Binding<String>, minRows: Int = 3, maxRows: Int = 8, limit: Int? = nil, invalid: Bool = false, size: MetalTextareaSize = .large, counterThreshold: Double? = nil) {
        self.label = label
        self._text = text
        self.minRows = minRows
        self.maxRows = maxRows
        self.limit = limit
        self.invalid = invalid
        self.size = size
        self.counterThreshold = min(1, max(0, counterThreshold ?? MetalRecipes.textarea.scalar("count.show")))
    }

    public var body: some View {
        VStack(alignment: .trailing, spacing: MetalRecipes.textarea.points("count.gap")) {
        TextField(label, text: $text, axis: .vertical)
            .font(.metal(size == .large ? MetalType.content : MetalType.ui))
            .lineLimit(minRows...maxRows)
            .onChange(of: text) { _, new in
                if let limit, new.count > limit { text = String(new.prefix(limit)) }
            }
            .accessibilityLabel(label)
        if let limit, Double(text.count) >= Double(limit) * counterThreshold {
            Text("\(text.count)/\(limit)").font(.metal(MetalType.meta)).monospacedDigit()
                .foregroundStyle(text.count >= limit ? colorway.tokens.invalid.color : colorway.tokens.ink3.color)
                .accessibilityLabel("\(text.count) of \(limit) characters")
        }
        }
    }
}
