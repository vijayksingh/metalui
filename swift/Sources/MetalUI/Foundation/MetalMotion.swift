import SwiftUI

/// What a spring class does right now: its spring, a crossfade, or nothing.
public enum MetalMotionResolution: Equatable, Sendable {
    case animate(MetalSpring)
    case crossfade(MetalSpring)
    case instant

    /// The animation to run, or nil when the change applies at once.
    public var animation: Animation? {
        switch self {
        case let .animate(spring), let .crossfade(spring): return spring.animation
        case .instant: return nil
        }
    }

    /// Whether offsets and scale may animate (false for a crossfade or an instant change).
    public var allowsTravel: Bool {
        if case .animate = self { return true }
        return false
    }
}

/// The one place Reduce Motion is resolved, per spring class, like `--mu-travel-*` and
/// `data-mu-motion` on the web. No view reads the accessibility setting on its own.
public enum MetalMotion {
    public static func resolve(_ springClass: MetalSpringClass, reduceMotion: Bool) -> MetalMotionResolution {
        guard reduceMotion else { return .animate(springClass.spring) }
        switch springClass.reducedMotion {
        case .unchanged: return .animate(springClass.spring)
        case .crossfade: return .crossfade(MetalSpringClass.crossfade.spring)
        case .instant: return .instant
        }
    }
}

private struct MetalAnimationModifier<Value: Equatable>: ViewModifier {
    let springClass: MetalSpringClass
    let value: Value
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content.animation(MetalMotion.resolve(springClass, reduceMotion: reduceMotion).animation, value: value)
    }
}

extension View {
    /// Animates changes to `value` on a spring class, resolved for Reduce Motion.
    public func metalAnimation<Value: Equatable>(_ springClass: MetalSpringClass, value: Value) -> some View {
        modifier(MetalAnimationModifier(springClass: springClass, value: value))
    }
}

/// Runs a state change on a spring class, resolved for Reduce Motion.
@MainActor
public func withMetalAnimation<Result>(
    _ springClass: MetalSpringClass,
    reduceMotion: Bool,
    _ body: () throws -> Result
) rethrows -> Result {
    try withAnimation(MetalMotion.resolve(springClass, reduceMotion: reduceMotion).animation, body)
}
