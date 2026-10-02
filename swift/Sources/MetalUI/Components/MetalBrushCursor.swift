#if canImport(AppKit)
import AppKit
#elseif canImport(UIKit)
import UIKit
#endif
import SwiftUI

/// A screen-space drawing cursor. Recreate it when tool, width, zoom, pressure, ink, or colorway changes.
@MainActor
public struct MetalBrushCursor {
    public enum Mode: Sendable {
        case pen, pencil, marker, line, arrow, rectangle, ellipse, eraser

        var isShape: Bool {
            switch self {
            case .line, .arrow, .rectangle, .ellipse: true
            default: false
            }
        }
    }

    public let mode: Mode
    public let strokeWidth: CGFloat
    public let zoom: CGFloat
    public let pressure: CGFloat
    public let color: MetalRGBA
    public let colorway: MetalColorway

    public init(mode: Mode, strokeWidth: CGFloat, zoom: CGFloat, pressure: CGFloat = 1,
                color: MetalRGBA, colorway: MetalColorway) {
        self.mode = mode
        self.strokeWidth = strokeWidth
        self.zoom = zoom
        self.pressure = pressure
        self.color = color
        self.colorway = colorway
    }

    #if canImport(AppKit)
    public var cursor: NSCursor {
        let image = makeImage()
        return NSCursor(image: image, hotSpot: NSPoint(x: image.size.width / 2, y: image.size.height / 2))
    }

    #endif

    /// Ring/crosshair for a host canvas. Position it at the touch or pencil location.
    public var view: some View {
        #if canImport(AppKit)
        Image(nsImage: makeImage()).allowsHitTesting(false).accessibilityHidden(true)
        #else
        Image(uiImage: makeImage()).allowsHitTesting(false).accessibilityHidden(true)
        #endif
    }

    #if canImport(AppKit)
    /// Same image the NSCursor uses; useful for a tool palette or an offscreen specimen.
    public func makeImage() -> NSImage {
        let recipe = MetalRecipes.brush
        let diameter = max(recipe.points("self.min"), strokeWidth * zoom * pressure)
        let ring = recipe.points("self.ring")
        let eraserWidth = recipe.points("eraser.width")
        let reach = recipe.points("cross.arm") + recipe.points("cross.gap")
        let shapeSide = (recipe.points("cross.hint-offset") + recipe.points("cross.hint-size") + 2) * 2
        let margin = max(ring, eraserWidth) * 2
        let side = mode.isShape ? shapeSide : diameter + margin * 2
        let oval = NSRect(x: margin, y: margin, width: diameter, height: diameter)
        let finish = MetalRecipeColorway(colorway)
        let image = NSImage(size: NSSize(width: side, height: side), flipped: false) { _ in
            if mode.isShape {
                let centre = NSPoint(x: side / 2, y: side / 2)
                let gap = recipe.points("cross.gap")
                let path = NSBezierPath()
                for (a, b) in [
                    (NSPoint(x: centre.x - reach, y: centre.y), NSPoint(x: centre.x - gap, y: centre.y)),
                    (NSPoint(x: centre.x + gap, y: centre.y), NSPoint(x: centre.x + reach, y: centre.y)),
                    (NSPoint(x: centre.x, y: centre.y - reach), NSPoint(x: centre.x, y: centre.y - gap)),
                    (NSPoint(x: centre.x, y: centre.y + gap), NSPoint(x: centre.x, y: centre.y + reach)),
                ] { path.move(to: a); path.line(to: b) }
                let hint = Self.shapeHint(mode, centre: NSPoint(x: centre.x + recipe.points("cross.hint-offset"),
                                                                  y: centre.y - recipe.points("cross.hint-offset")),
                                          size: recipe.points("cross.hint-size"))
                path.append(hint)
                path.lineCapStyle = .round
                Self.nsColor(finish == .graphite ? colorway.tokens.sLo : colorway.tokens.sHi).setStroke()
                path.lineWidth = recipe.points("cross.halo")
                path.stroke()
                Self.nsColor(colorway.tokens.ink).setStroke()
                path.lineWidth = recipe.points("cross.line")
                path.stroke()
            } else if mode == .pen || mode == .pencil {
                Self.nsColor(color).withAlphaComponent(mode == .pencil ? recipe.scalar("pencil.ink") : 1).setFill()
                NSBezierPath(ovalIn: oval).fill()
                if let light = recipe.color("self.ring-ink", colorway: finish) {
                    Self.nsColor(light).setStroke()
                    let path = NSBezierPath(ovalIn: oval)
                    path.lineWidth = ring
                    path.stroke()
                }
                if let dark = recipe.color("self.edge-ink", colorway: finish) {
                    Self.nsColor(dark).setStroke()
                    let path = NSBezierPath(ovalIn: oval.insetBy(dx: -ring, dy: -ring))
                    path.lineWidth = ring
                    path.stroke()
                }
            } else if mode == .marker {
                let marker = NSBezierPath(roundedRect: NSRect(x: oval.minX, y: oval.midY - diameter * recipe.scalar("marker.ratio") / 2,
                                                              width: diameter, height: diameter * recipe.scalar("marker.ratio")),
                                          xRadius: diameter * recipe.scalar("marker.ratio") / 4,
                                          yRadius: diameter * recipe.scalar("marker.ratio") / 4)
                var transform = AffineTransform(translationByX: -oval.midX, byY: -oval.midY)
                transform.rotate(byDegrees: -35)
                transform.translate(x: oval.midX, y: oval.midY)
                marker.transform(using: transform)
                Self.nsColor(color).withAlphaComponent(recipe.scalar("marker.ink")).setFill()
                marker.fill()
                Self.nsColor(colorway.tokens.ink).setStroke()
                marker.lineWidth = ring
                marker.stroke()
            } else if let ink = recipe.color("eraser.ink", colorway: finish) {
                Self.nsColor(ink).setStroke()
                let path = NSBezierPath(ovalIn: oval)
                path.lineWidth = eraserWidth
                let dash = (recipe.text("eraser.dash") ?? "").split(separator: " ").compactMap { Double($0) }.map { CGFloat($0) }
                path.setLineDash(dash, count: dash.count, phase: .zero)
                path.stroke()
            }
            return true
        }
        image.isTemplate = false
        return image
    }

    private static func shapeHint(_ mode: Mode, centre: NSPoint, size: CGFloat) -> NSBezierPath {
        let r = size / 2
        let path = NSBezierPath()
        switch mode {
        case .line, .arrow:
            path.move(to: NSPoint(x: centre.x - r, y: centre.y - r))
            path.line(to: NSPoint(x: centre.x + r, y: centre.y + r))
            if mode == .arrow {
                path.move(to: NSPoint(x: centre.x, y: centre.y + r))
                path.line(to: NSPoint(x: centre.x + r, y: centre.y + r))
                path.line(to: NSPoint(x: centre.x + r, y: centre.y))
            }
        case .rectangle:
            path.appendRoundedRect(NSRect(x: centre.x - r, y: centre.y - r * 0.75,
                                          width: size, height: size * 0.75), xRadius: 1, yRadius: 1)
        case .ellipse:
            path.appendOval(in: NSRect(x: centre.x - r, y: centre.y - r * 0.75,
                                       width: size, height: size * 0.75))
        default: break
        }
        return path
    }

    private static func nsColor(_ rgba: MetalRGBA) -> NSColor {
        NSColor(srgbRed: rgba.red / 255, green: rgba.green / 255, blue: rgba.blue / 255, alpha: rgba.alpha)
    }
    #elseif canImport(UIKit)
    /// Same recipe as the macOS pointer, rendered into a canvas overlay on iOS.
    public func makeImage() -> UIImage {
        let recipe = MetalRecipes.brush
        let diameter = max(recipe.points("self.min"), strokeWidth * zoom * pressure)
        let ring = recipe.points("self.ring")
        let eraserWidth = recipe.points("eraser.width")
        let reach = recipe.points("cross.arm") + recipe.points("cross.gap")
        let shapeSide = (recipe.points("cross.hint-offset") + recipe.points("cross.hint-size") + 2) * 2
        let margin = max(ring, eraserWidth) * 2
        let side = mode.isShape ? shapeSide : diameter + margin * 2
        let oval = CGRect(x: margin, y: margin, width: diameter, height: diameter)
        let finish = MetalRecipeColorway(colorway)
        return UIGraphicsImageRenderer(size: CGSize(width: side, height: side)).image { renderer in
            // Match the AppKit y-up drawing before the image enters SwiftUI's y-down canvas.
            let context = renderer.cgContext
            context.translateBy(x: 0, y: side)
            context.scaleBy(x: 1, y: -1)
            if mode.isShape {
                let centre = CGPoint(x: side / 2, y: side / 2)
                let gap = recipe.points("cross.gap")
                let path = UIBezierPath()
                for (a, b) in [
                    (CGPoint(x: centre.x - reach, y: centre.y), CGPoint(x: centre.x - gap, y: centre.y)),
                    (CGPoint(x: centre.x + gap, y: centre.y), CGPoint(x: centre.x + reach, y: centre.y)),
                    (CGPoint(x: centre.x, y: centre.y - reach), CGPoint(x: centre.x, y: centre.y - gap)),
                    (CGPoint(x: centre.x, y: centre.y + gap), CGPoint(x: centre.x, y: centre.y + reach)),
                ] { path.move(to: a); path.addLine(to: b) }
                path.append(Self.shapeHint(mode, centre: CGPoint(x: centre.x + recipe.points("cross.hint-offset"),
                                                                 y: centre.y - recipe.points("cross.hint-offset")),
                                           size: recipe.points("cross.hint-size")))
                path.lineCapStyle = .round
                Self.uiColor(finish == .graphite ? colorway.tokens.sLo : colorway.tokens.sHi).setStroke()
                path.lineWidth = recipe.points("cross.halo")
                path.stroke()
                Self.uiColor(colorway.tokens.ink).setStroke()
                path.lineWidth = recipe.points("cross.line")
                path.stroke()
            } else if mode == .pen || mode == .pencil {
                Self.uiColor(color).withAlphaComponent(mode == .pencil ? recipe.scalar("pencil.ink") : 1).setFill()
                UIBezierPath(ovalIn: oval).fill()
                if let light = recipe.color("self.ring-ink", colorway: finish) {
                    Self.uiColor(light).setStroke()
                    let path = UIBezierPath(ovalIn: oval)
                    path.lineWidth = ring
                    path.stroke()
                }
                if let dark = recipe.color("self.edge-ink", colorway: finish) {
                    Self.uiColor(dark).setStroke()
                    let path = UIBezierPath(ovalIn: oval.insetBy(dx: -ring, dy: -ring))
                    path.lineWidth = ring
                    path.stroke()
                }
            } else if mode == .marker {
                let marker = UIBezierPath(roundedRect: CGRect(x: oval.minX, y: oval.midY - diameter * recipe.scalar("marker.ratio") / 2,
                                                              width: diameter, height: diameter * recipe.scalar("marker.ratio")),
                                          cornerRadius: diameter * recipe.scalar("marker.ratio") / 4)
                let transform = CGAffineTransform(translationX: oval.midX, y: oval.midY)
                    .rotated(by: -35 * .pi / 180).translatedBy(x: -oval.midX, y: -oval.midY)
                marker.apply(transform)
                Self.uiColor(color).withAlphaComponent(recipe.scalar("marker.ink")).setFill()
                marker.fill()
                Self.uiColor(colorway.tokens.ink).setStroke()
                marker.lineWidth = ring
                marker.stroke()
            } else if let ink = recipe.color("eraser.ink", colorway: finish) {
                Self.uiColor(ink).setStroke()
                let path = UIBezierPath(ovalIn: oval)
                path.lineWidth = eraserWidth
                let dash = (recipe.text("eraser.dash") ?? "").split(separator: " ").compactMap { Double($0) }.map { CGFloat($0) }
                path.setLineDash(dash, count: dash.count, phase: .zero)
                path.stroke()
            }
        }
    }

    private static func shapeHint(_ mode: Mode, centre: CGPoint, size: CGFloat) -> UIBezierPath {
        let r = size / 2
        let path = UIBezierPath()
        switch mode {
        case .line, .arrow:
            path.move(to: CGPoint(x: centre.x - r, y: centre.y - r))
            path.addLine(to: CGPoint(x: centre.x + r, y: centre.y + r))
            if mode == .arrow {
                path.move(to: CGPoint(x: centre.x, y: centre.y + r))
                path.addLine(to: CGPoint(x: centre.x + r, y: centre.y + r))
                path.addLine(to: CGPoint(x: centre.x + r, y: centre.y))
            }
        case .rectangle:
            path.append(UIBezierPath(roundedRect: CGRect(x: centre.x - r, y: centre.y - r * 0.75,
                                                        width: size, height: size * 0.75), cornerRadius: .one))
        case .ellipse:
            path.append(UIBezierPath(ovalIn: CGRect(x: centre.x - r, y: centre.y - r * 0.75,
                                                   width: size, height: size * 0.75)))
        default: break
        }
        return path
    }

    private static func uiColor(_ rgba: MetalRGBA) -> UIColor {
        UIColor(red: rgba.red / 255, green: rgba.green / 255, blue: rgba.blue / 255, alpha: rgba.alpha)
    }
    #endif

}
