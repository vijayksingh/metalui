import SwiftUI

/// A dot colour (tokens colorways px-*): an unlit dot, then the lit ones.
public enum MetalDotColour: String, Sendable, CaseIterable {
    case off, hz, hill, sun, moon, star, cloud, cloudDark = "cloud-dark", rain, snow, ink

    public func color(in colorway: MetalColorway) -> MetalRGBA {
        let t = colorway.tokens
        switch self {
        case .off: return t.pxOff
        case .hz: return t.pxHz
        case .hill: return t.pxHill
        case .sun: return t.pxSun
        case .moon: return t.pxMoon
        case .star: return t.pxStar
        case .cloud: return t.pxCloud
        case .cloudDark: return t.pxCloudDark
        case .rain: return t.pxRain
        case .snow: return t.pxSnow
        case .ink: return t.ink
        }
    }
}

/// A colour, at an alpha for a dimmer dot (a glow, fog).
public struct MetalDotInk: Sendable, Equatable {
    public let colour: MetalDotColour
    public let alpha: Double
    public init(_ colour: MetalDotColour, alpha: Double = 1) { self.colour = colour; self.alpha = alpha }
}

/// Square dots on one pitch, printed into a well: one ink index per dot, row by row. Index 0, and
/// any index without an ink, is unlit. Pitch and dot come from the dot-display recipe. Decorative:
/// the object around it names the picture.
public struct MetalDotDisplay: View {
    let cols: Int
    let rows: Int
    let dots: [UInt8]
    let inks: [MetalDotInk]
    let size: Size
    @Environment(\.metalColorway) private var colorway

    /// default (pitch 8, dot 6) or mini (pitch 3, dot 2.4): a glyph in a row of text.
    public enum Size: String, Sendable { case `default` = "self", mini }

    public init(cols: Int, rows: Int, dots: [UInt8], inks: [MetalDotInk], size: Size = .default) {
        self.cols = cols; self.rows = rows; self.dots = dots; self.inks = inks; self.size = size
    }

    public static func pitch(_ size: Size = .default) -> CGFloat { MetalRecipes.dotDisplay.points("\(size.rawValue).pitch") }
    public static func dot(_ size: Size = .default) -> CGFloat { MetalRecipes.dotDisplay.points("\(size.rawValue).dot") }

    public var body: some View {
        let pitch = Self.pitch(size), dot = Self.dot(size), inset = (pitch - dot) / 2
        let off = MetalDotColour.off.color(in: colorway).color
        let fills = inks.map { ink in ink.colour.color(in: colorway).color.opacity(ink.alpha) }
        Canvas { context, _ in
            var byInk = [Path](repeating: Path(), count: max(1, fills.count))
            for y in 0..<rows {
                for x in 0..<cols {
                    let i = y * cols + x
                    let raw = i < dots.count ? Int(dots[i]) : .zero
                    let at = raw < fills.count ? raw : .zero
                    byInk[at].addRect(CGRect(x: CGFloat(x) * pitch + inset, y: CGFloat(y) * pitch + inset, width: dot, height: dot))
                }
            }
            for (i, path) in byInk.enumerated() { context.fill(path, with: .color(i == .zero ? off : fills[i])) }
        }
        .frame(width: CGFloat(cols) * pitch, height: CGFloat(rows) * pitch)
        .accessibilityHidden(true)
    }
}

/// The display's clock: a frame number that steps on the dot-display recipe's step and never
/// tweens. Reduce Motion holds it on the frame it was on.
public struct MetalDotClock<Content: View>: View {
    let running: Bool
    let content: (Int) -> Content
    @MetalMotionPreference private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var origin = Date()

    public init(running: Bool = true, @ViewBuilder content: @escaping (Int) -> Content) {
        self.running = running; self.content = content
    }

    public var body: some View {
        let step = MetalRecipes.dotDisplay.durationSeconds("self.step")
        TimelineView(.animation(minimumInterval: step, paused: !running || reduceMotion || scenePhase != .active)) { timeline in
            content(Int(timeline.date.timeIntervalSince(origin) / step))
        }
    }
}
