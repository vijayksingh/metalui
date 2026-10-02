import SwiftUI

/// Rendered cue bounds for the example's native handling proof and capture; no layout decisions.
public struct MetalProvenanceCueFrames: PreferenceKey {
    public static var defaultValue: [String: CGRect] = [:]
    public static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { _, next in next })
    }
}

/// View anchors let an actual host resolve bounds in its own coordinate space.
public struct MetalProvenanceCueAnchors: PreferenceKey {
    public static var defaultValue: [String: Anchor<CGRect>] = [:]
    public static func reduce(value: inout [String: Anchor<CGRect>], nextValue: () -> [String: Anchor<CGRect>]) { value.merge(nextValue(), uniquingKeysWith: { _, next in next }) }
}
