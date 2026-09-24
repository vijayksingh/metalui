import AppKit
import SwiftUI

/// A screen-space drawing cursor. Recreate it when tool, width, zoom, pressure, ink, or colorway changes.
@MainActor
public struct MetalBrushCursor {
    public enum Mode: Sendable { case pen, eraser }

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

    public var cursor: NSCursor {
        let image = makeImage()
        return NSCursor(image: image, hotSpot: NSPoint(x: image.size.width / 2, y: image.size.height / 2))
    }

    /// Same image the NSCursor uses; useful for a tool palette or an offscreen specimen.
    public func makeImage() -> NSImage {
        let recipe = MetalRecipes.brush
        let diameter = max(recipe.points("self.min"), strokeWidth * zoom * pressure)
        let ring = recipe.points("self.ring")
        let eraserWidth = recipe.points("eraser.width")
        let margin = max(ring, eraserWidth) * 2
        let side = diameter + margin * 2
        let oval = NSRect(x: margin, y: margin, width: diameter, height: diameter)
        let finish = MetalRecipeColorway(colorway)
        let image = NSImage(size: NSSize(width: side, height: side), flipped: false) { _ in
            if mode == .pen {
                Self.nsColor(color).setFill()
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

    private static func nsColor(_ rgba: MetalRGBA) -> NSColor {
        NSColor(srgbRed: rgba.red / 255, green: rgba.green / 255, blue: rgba.blue / 255, alpha: rgba.alpha)
    }
}
