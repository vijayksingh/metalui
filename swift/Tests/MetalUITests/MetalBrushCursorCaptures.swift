import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalBrushCursorCaptures: XCTestCase {
    func testPenAndEraserCursors() throws {
        for colorway in MetalColorway.allCases {
            let pen = MetalBrushCursor(mode: .pen, strokeWidth: 2, zoom: 1,
                                       color: colorway.tokens.icon, colorway: colorway)
            let wide = MetalBrushCursor(mode: .pen, strokeWidth: 12, zoom: 2,
                                        color: colorway.tokens.cueUrlInk, colorway: colorway)
            let eraser = MetalBrushCursor(mode: .eraser, strokeWidth: 16, zoom: 1,
                                          color: colorway.tokens.icon, colorway: colorway)
            XCTAssertEqual(pen.cursor.hotSpot.x, pen.makeImage().size.width / 2)
            XCTAssertGreaterThan(wide.makeImage().size.width, pen.makeImage().size.width)

            let view = HStack(spacing: MetalSettingsMetrics.rowGap) {
                sample("PEN · MIN", image: pen.cursor.image, colorway: colorway)
                sample("PEN · ZOOM", image: wide.cursor.image, colorway: colorway)
                sample("ERASER", image: eraser.cursor.image, colorway: colorway)
            }
            .padding(MetalSettingsMetrics.sectionGap)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("brush-cursor-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }

    private func sample(_ label: String, image: NSImage, colorway: MetalColorway) -> some View {
        VStack(spacing: MetalSettingsMetrics.headingGap) {
            Image(nsImage: image)
                .interpolation(.none)
                .frame(width: 48, height: 48)
            MetalLabel(label, style: .small)
        }
        .frame(width: 88, height: 72)
        .background(colorway.tokens.s.color)
    }
}
