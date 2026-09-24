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

/// A damped spring (mass 1). CSS uses the sampled `linear()` twin.
public struct MetalSpring: Equatable, Sendable {
    public let stiffness: Double
    public let damping: Double
    /// Settle time the CSS curve is sampled over, in seconds.
    public let duration: Double

    public init(stiffness: Double, damping: Double, duration: Double) {
        self.stiffness = stiffness
        self.damping = damping
        self.duration = duration
    }

    public var animation: Animation {
        .interpolatingSpring(mass: 1, stiffness: stiffness, damping: damping)
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
