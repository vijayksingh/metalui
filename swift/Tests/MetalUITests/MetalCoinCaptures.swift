import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalCoinCaptures: XCTestCase {
    func testAmountGlyphInBothCuts() throws {
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: MetalSpace.s16) {
                MetalIcon(.coin, size: 16)
                MetalIcon(.coin, size: 24)
                Text("$40 · €36").font(.metal(MetalType.ui))
            }
            .foregroundStyle(colorway.tokens.ink.color)
            .padding(MetalSpace.s24)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            .metalReduceMotion()
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("coin-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
