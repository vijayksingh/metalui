import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalDrawToolsCaptures: XCTestCase {
    func testDrawingStripStates() throws {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 16) {
                MetalDrawTools(tool: .constant(.pen), ink: .constant(.blue), width: .constant(.regular))
                MetalDrawTools(tool: .constant(.eraser), ink: .constant(.red), width: .constant(.bold))
                MetalDrawTools(tool: .constant(.marker), ink: .constant(.ink), width: .constant(.fine), variant: .graphite)
            }
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("draw-tools-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
