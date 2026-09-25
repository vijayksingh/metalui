import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalLinkCardPreviewCaptures: XCTestCase {
    func testPlainAndPreviewCards() throws {
        for colorway in MetalColorway.allCases {
            let art = NSImage(size: NSSize(width: 250, height: 128), flipped: false) { rect in
                colorway.tokens.cueUrlInk.nsColor.setFill()
                rect.fill()
                colorway.tokens.presenceDot.nsColor.setFill()
                NSBezierPath(ovalIn: rect.insetBy(dx: 42, dy: 14)).fill()
                return true
            }
            let preview = MetalLinkPreview(title: "A quiet place to make better things",
                                           image: Image(nsImage: art), icon: Image(systemName: "globe"))
            let view = HStack(alignment: .top, spacing: MetalSettingsMetrics.sectionGap) {
                MetalLinkCard(url: "https://example.com/work/studio", open: {})
                MetalLinkCard(url: "https://example.com/work/studio", preview: preview, open: {})
            }
            .padding(MetalSettingsMetrics.sectionGap)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("link-card-preview-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}

private extension MetalRGBA {
    var nsColor: NSColor {
        NSColor(srgbRed: red / 255, green: green / 255, blue: blue / 255, alpha: alpha)
    }
}
