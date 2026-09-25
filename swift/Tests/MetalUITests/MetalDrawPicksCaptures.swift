import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalDrawPicksCaptures: XCTestCase {
    func testPicksInToolbar() throws {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 16) {
                MetalToolbar("Drawing") {
                    MetalInkPicks(value: .constant(.blue))
                    MetalToolbarSeparator()
                    MetalWidthPicks(value: .constant(.regular), ink: .blue)
                }
                MetalToolbar("Drawing", variant: .graphite) {
                    MetalInkPicks(value: .constant(.ink))
                    MetalToolbarSeparator()
                    MetalWidthPicks(value: .constant(.bold), ink: .ink)
                }
                MetalToolbar("Eraser") {
                    MetalInkPicks(value: .constant(.red), disabled: true)
                    MetalToolbarSeparator()
                    MetalWidthPicks(value: .constant(.fine), ink: .red, disabled: true)
                }
            }
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("draw-picks-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
