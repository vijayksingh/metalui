import SwiftUI

// Value types the generated tokens are written in. Each mirrors one CSS value
// shape, so a recipe renders the same on both platforms.

/// An sRGB color with 0–255 channels and a 0–1 alpha, as written in CSS.
public struct MetalRGBA: Equatable, Sendable {
    public let red: Double
    public let green: Double
    public let blue: Double
    public let alpha: Double

    public init(_ red: Double, _ green: Double, _ blue: Double, _ alpha: Double) {
        self.red = red
        self.green = green
        self.blue = blue
        self.alpha = alpha
    }

    public var color: Color {
        Color(.sRGB, red: red / 255, green: green / 255, blue: blue / 255, opacity: alpha)
    }
}

/// One CSS `box-shadow` layer. CSS blur is twice the SwiftUI blur radius.
public struct MetalShadow: Equatable, Sendable {
    public let inset: Bool
    public let x: Double
    public let y: Double
    public let blur: Double
    public let spread: Double
    public let color: MetalRGBA

    public init(inset: Bool, x: Double, y: Double, blur: Double, spread: Double, color: MetalRGBA) {
        self.inset = inset
        self.x = x
        self.y = y
        self.blur = blur
        self.spread = spread
        self.color = color
    }
}

/// A CSS `linear-gradient`. 180° runs top to bottom.
public struct MetalGradient: Equatable, Sendable {
    public struct Stop: Equatable, Sendable {
        public let color: MetalRGBA
        public let location: Double
        public init(_ color: MetalRGBA, _ location: Double) {
            self.color = color
            self.location = location
        }
    }

    public let angle: Double
    public let stops: [Stop]

    public init(angle: Double, stops: [Stop]) {
        self.angle = angle
        self.stops = stops
    }

    /// One color, top to bottom: a flat fill written as a gradient so every recipe has one fill type.
    public static func solid(_ color: MetalRGBA) -> MetalGradient {
        MetalGradient(angle: 180, stops: [.init(color, 0), .init(color, 1)])
    }

    /// True when any stop lets what is behind show through.
    public var isTranslucent: Bool { stops.contains { $0.color.alpha < 1 } }

    public var linearGradient: LinearGradient {
        let radians = angle * .pi / 180
        let dx = sin(radians) / 2
        let dy = -cos(radians) / 2
        return LinearGradient(
            stops: stops.map { Gradient.Stop(color: $0.color.color, location: $0.location) },
            startPoint: UnitPoint(x: 0.5 - dx, y: 0.5 - dy),
            endPoint: UnitPoint(x: 0.5 + dx, y: 0.5 + dy)
        )
    }
}

/// A CSS `radial-gradient(circle at x% y%, …)`, used for LEDs.
public struct MetalRadialGradient: Equatable, Sendable {
    public let center: UnitPoint
    public let stops: [MetalGradient.Stop]

    public init(center: UnitPoint, stops: [MetalGradient.Stop]) {
        self.center = center
        self.stops = stops
    }

    public func gradient(diameter: CGFloat) -> RadialGradient {
        // CSS `circle` without a size is farthest-corner.
        let dx = max(center.x, 1 - center.x), dy = max(center.y, 1 - center.y)
        return RadialGradient(
            stops: stops.map { Gradient.Stop(color: $0.color.color, location: $0.location) },
            center: center,
            startRadius: 0,
            endRadius: diameter * sqrt(dx * dx + dy * dy)
        )
    }
}

/// A CSS `backdrop-filter: blur() saturate()`: the frost behind a floating surface.
public struct MetalBackdrop: Equatable, Sendable {
    /// CSS blur length in points.
    public let blur: Double
    public let saturation: Double
    /// Whether the frost belongs to a dark finish (graphite), so the blur is tinted dark.
    public let dark: Bool

    public init(blur: Double, saturation: Double, dark: Bool) {
        self.blur = blur
        self.saturation = saturation
        self.dark = dark
    }
}

/// A damped spring (mass 1). CSS uses the sampled `linear()` twin.
/// The SwiftUI motion a spring role uses on Apple platforms: the system's own presets, never
/// hand-set physics. The web samples `stiffness`/`damping` into CSS curves; SwiftUI does not.
public enum MetalNativeMotion: String, Sendable {
    /// Quick, exact, no overshoot: parts you touch, controls opening in place.
    case snappy
    /// Unhurried, no overshoot: surfaces rising, content settling.
    case smooth
    /// A little life at the stop: objects landing, hinges.
    case bouncy
    /// Letting go: faster than snappy.
    case quick
    /// A refusal: a short, firm shake.
    case shake

    public var animation: Animation {
        switch self {
        case .snappy: return .snappy
        case .smooth: return .smooth
        case .bouncy: return .bouncy
        case .quick: return .snappy(duration: 0.2)
        case .shake: return .bouncy(duration: 0.3, extraBounce: 0.3)
        }
    }

    /// The same preset as a response / damping pair, for Core Animation
    /// (`CASpringAnimation(perceptualDuration: response, bounce: 1 - dampingFraction)`), so layers
    /// and SwiftUI views move identically. Apple's presets: smooth has no bounce, snappy 0.15,
    /// bouncy 0.3, over half a second.
    public var response: Double {
        switch self {
        case .snappy, .smooth, .bouncy: return 0.5
        case .quick: return 0.2
        case .shake: return 0.3
        }
    }

    public var dampingFraction: Double {
        switch self {
        case .smooth: return 1
        case .snappy, .quick: return 0.85
        case .bouncy: return 0.7
        case .shake: return 0.4
        }
    }
}

public struct MetalSpring: Equatable, Sendable {
    public let stiffness: Double
    public let damping: Double
    /// Settle time the CSS curve is sampled over, in seconds (the web's).
    public let duration: Double
    /// What SwiftUI uses for this role: an Apple preset.
    public let native: MetalNativeMotion

    public init(stiffness: Double, damping: Double, duration: Double, native: MetalNativeMotion = .smooth) {
        self.stiffness = stiffness
        self.damping = damping
        self.duration = duration
        self.native = native
    }

    /// The token's own physics (unit mass, this stiffness and damping), the same spring the web
    /// samples into its `linear()` curve, so a MetalUI view moves alike on both platforms. A
    /// SwiftUI spring keeps its velocity when interrupted, so a new state starts from the frame
    /// on screen. (`native` names the closest Apple preset; it no longer drives motion.)
    public var animation: Animation { .spring(response: response, dampingFraction: dampingFraction) }

    /// The undamped period, 2π/√k: what SwiftUI and Core Animation call response.
    public var response: Double { 2 * .pi / stiffness.squareRoot() }
    /// c / 2√k: 1 settles without overshoot, below 1 gives at the stop (part ≈ 0.61, ~9 %).
    public var dampingFraction: Double { damping / (2 * stiffness.squareRoot()) }
}

/// A named timing curve (`--mu-ease-*`): the CSS cubic-bezier's control points.
public struct MetalCurve: Equatable, Sendable {
    public let x1: Double, y1: Double, x2: Double, y2: Double

    public init(x1: Double, y1: Double, x2: Double, y2: Double) {
        self.x1 = x1; self.y1 = y1; self.x2 = x2; self.y2 = y2
    }

    /// The curve over `duration` seconds.
    public func animation(duration: Double) -> Animation {
        .timingCurve(x1, y1, x2, y2, duration: duration)
    }
}

/// A font family in the Soft Hardware type system.
public enum MetalFontFamily: String, Sendable {
    /// Geist: UI and reading.
    case sans
    /// Martian Mono: engravings, readouts, keycaps and code.
    case mono
    /// Doto: dot-matrix display readouts in widgets.
    case pixel
}

/// One type role, as the CSS `.mu-type-*` class writes it.
public struct MetalTypeRole: Equatable, Sendable {
    public let name: String
    public let family: MetalFontFamily
    public let size: Double
    public let line: Double
    public let weight: Int
    /// Letter spacing in em.
    public let tracking: Double
    /// Width axis as a fraction (1 = normal; Martian Mono runs at 0.875, code at 0.75).
    public let stretch: Double
    public let uppercase: Bool
    public let tabular: Bool
    /// The largest size the role grows to with the host's text size; nil means it stays fixed.
    /// Layouts reserve this size.
    public let maxSize: Double?

    public init(
        name: String, family: MetalFontFamily, size: Double, line: Double, weight: Int,
        tracking: Double, stretch: Double, uppercase: Bool, tabular: Bool, maxSize: Double?
    ) {
        self.name = name
        self.family = family
        self.size = size
        self.line = line
        self.weight = weight
        self.tracking = tracking
        self.stretch = stretch
        self.uppercase = uppercase
        self.tabular = tabular
        self.maxSize = maxSize
    }

    /// Letter spacing in points at the role's size.
    public var trackingPoints: Double { tracking * size }
}
