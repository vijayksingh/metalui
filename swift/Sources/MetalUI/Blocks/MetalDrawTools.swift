import SwiftUI

/// Eight fixed drawing tools. Pencil reuses the Draw glyph; other glyphs have their own motion.
public enum MetalDrawTool: String, CaseIterable, Sendable, Identifiable {
    case pen, pencil, marker, line, arrow, rectangle, ellipse, eraser
    public var id: String { rawValue }
    public var label: String { rawValue.capitalized }

    public var icon: MetalIconName {
        switch self {
        case .pen: return .pen
        case .pencil: return .draw
        case .marker: return .marker
        case .line: return .line
        case .arrow: return .arrow
        case .rectangle: return .rectangle
        case .ellipse: return .ellipse
        case .eraser: return .eraser
        }
    }

    public var shortcut: KeyEquivalent {
        switch self {
        case .pen: return "p"
        case .pencil: return "n"
        case .marker: return "m"
        case .line: return "l"
        case .arrow: return "a"
        case .rectangle: return "r"
        case .ellipse: return "o"
        case .eraser: return "e"
        }
    }
}

/// Toolbar drawing group: eight latched tools, five inks, three widths. The host retains the
/// last ink and width for each tool and handles Select/Escape outside this block.
public struct MetalDrawTools: View {
    public enum Variant: Sendable { case frost, graphite }
    @Binding private var tool: MetalDrawTool?
    @Binding private var ink: MetalInk
    @Binding private var width: MetalInkWidth
    private let variant: Variant

    public init(tool: Binding<MetalDrawTool?>, ink: Binding<MetalInk>, width: Binding<MetalInkWidth>,
                variant: Variant = .frost) {
        _tool = tool
        _ink = ink
        _width = width
        self.variant = variant
    }

    public var body: some View {
        MetalToolbar("Drawing", variant: variant == .graphite ? .graphite : .frost) {
            ForEach(MetalDrawTool.allCases) { item in
                MetalToolButton(item.label, shortcut: item.shortcut, latched: tool == item) {
                    if item == .pencil {
                        MetalIcon(.draw, size: MetalToolbarMetrics.glyph)
                    } else {
                        MetalDrawingIcon(item.icon, size: MetalToolbarMetrics.glyph)
                    }
                } action: {
                    tool = tool == item ? nil : item
                }
            }
            MetalToolbarSeparator()
            MetalInkPicks(value: $ink, disabled: tool == .eraser)
            MetalToolbarSeparator()
            MetalWidthPicks(value: $width, ink: ink, disabled: tool == .eraser)
        }
    }
}
