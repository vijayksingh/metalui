import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalDrawingIconCaptures: XCTestCase {
    func testDrawingGlyphsInBothCuts() throws {
        let names: [MetalIconName] = [.pen, .marker, .line, .arrow, .rectangle, .ellipse, .eraser]
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: 18) {
                ForEach(names, id: \.self) { name in
                    VStack(spacing: 10) {
                        MetalDrawingIcon(name, size: 24)
                        MetalDrawingIcon(name, size: 16)
                        Text(name.label).font(.metal(MetalType.label))
                    }
                    .frame(width: 76)
                }
            }
            .foregroundStyle(colorway.tokens.icon.color)
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("drawing-icons-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
