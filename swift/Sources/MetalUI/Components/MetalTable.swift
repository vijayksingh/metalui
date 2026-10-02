import SwiftUI

// WIP: MetalTable is a placeholder that keeps the React API's shape (rows and columns). Use SwiftUI's
// Table on macOS; this lists rows in a VStack with rules, not yet the engraved labels, the sort's travel
// or the selection tint from table.agent.md. Web is the reference. This row container owns no sort header glyph; custom headers use
// MetalIcon(.arrow) at table sort.glyph, aligned to the column direction.

/// Rows of things. Work in progress: see table.agent.md.
public struct MetalTable<Row: Identifiable, Cells: View>: View {
    private let rows: [Row]
    private let cells: (Row) -> Cells

    public init(_ rows: [Row], @ViewBuilder cells: @escaping (Row) -> Cells) {
        self.rows = rows
        self.cells = cells
    }

    public var body: some View {
        VStack(spacing: 0) {
            ForEach(rows) { row in
                HStack { cells(row) }
                    .frame(height: MetalRecipes.table.points("row.height"))
                Divider()
            }
        }
    }
}
