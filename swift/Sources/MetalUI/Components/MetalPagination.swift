import SwiftUI

// WIP: MetalPagination is a placeholder that keeps the React API's shape (page and count). It lays
// out previous, page numbers and next as plain buttons, not yet the switcher's track, the gliding
// thumb or the folded window from pagination.agent.md. Web is the reference.

/// Moving through pages of results. Work in progress: see pagination.agent.md.
public struct MetalPagination: View {
    @Binding private var page: Int
    private let count: Int
    @State private var previousActs = 0
    @State private var nextActs = 0

    public init(page: Binding<Int>, count: Int) {
        self._page = page
        self.count = count
    }

    public var body: some View {
        HStack {
            Button { previousActs += 1; page -= 1 } label: { MetalIcon(.chevron, size: MetalRecipes.pagination.points("arrow.size"), act: previousActs).rotationEffect(.degrees(90)) }.disabled(page <= 1).accessibilityElement(children: .ignore).accessibilityLabel("Previous page")
            ForEach(1...max(count, 1), id: \.self) { p in
                Button("\(p)") { page = p }.fontWeight(p == page ? .semibold : .regular).accessibilityLabel("Page \(p)")
            }
            Button { nextActs += 1; page += 1 } label: { MetalIcon(.chevron, size: MetalRecipes.pagination.points("arrow.size"), act: nextActs).rotationEffect(.degrees(270)) }.disabled(page >= count).accessibilityElement(children: .ignore).accessibilityLabel("Next page")
        }
        .buttonStyle(.plain)
    }
}
