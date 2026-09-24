import SwiftUI

/// The finish objects render in: bone (light) or graphite (dark).
public enum MetalColorway: String, CaseIterable, Sendable {
    case bone
    case graphite

    public var tokens: MetalColorwayTokens {
        switch self {
        case .bone: return MetalTokens.bone
        case .graphite: return MetalTokens.graphite
        }
    }

    public var colorScheme: ColorScheme { self == .bone ? .light : .dark }
}

private struct MetalColorwayKey: EnvironmentKey {
    static let defaultValue: MetalColorway? = nil
}

extension EnvironmentValues {
    /// An explicit colorway, or `nil` to follow the color scheme.
    public var metalColorwayOverride: MetalColorway? {
        get { self[MetalColorwayKey.self] }
        set { self[MetalColorwayKey.self] = newValue }
    }

    /// The colorway in effect: the explicit one, else graphite in dark mode and bone in light.
    public var metalColorway: MetalColorway {
        metalColorwayOverride ?? (colorScheme == .dark ? .graphite : .bone)
    }
}

extension View {
    /// Renders descendants in a colorway and pins the matching color scheme,
    /// like `data-mu-colorway` on the web.
    public func metalColorway(_ colorway: MetalColorway) -> some View {
        environment(\.metalColorwayOverride, colorway)
            .environment(\.colorScheme, colorway.colorScheme)
    }
}
