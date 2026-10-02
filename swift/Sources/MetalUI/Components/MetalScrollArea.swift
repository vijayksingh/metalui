import SwiftUI

// WIP: MetalScrollArea is a placeholder that keeps the React API's shape (content in a frame). It uses
// the system ScrollView and its scroll indicators, not yet the edge fades or the widening thumb from
// scroll-area.agent.md. Web is the reference.
// Native programmatic access: wrap MetalScrollArea in ScrollViewReader and scroll its proxy to
// content IDs. There is no DOM viewport ref. Offset observation via onScrollGeometryChange needs
// macOS 15 / iOS 18, above this package's minimum; no onScroll callback is promised here.

/// A region that scrolls. Work in progress: see scroll-area.agent.md.
public struct MetalScrollArea<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        ScrollView { content }
    }
}
