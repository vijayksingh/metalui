import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// Offscreen conformance sheet: world-space lasso at non-unit zoom, empty count, and corner glow.
@MainActor
final class MetalLassoCaptures: XCTestCase {
    func testLasso() throws {
        for colorway in MetalColorway.allCases {
            let scale: CGFloat = 1.25
            let world = ZStack(alignment: .topLeading) {
                colorway.tokens.s.color
                ForEach(0..<3) { index in
                    RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous)
                        .fill(colorway.tokens.sHi.color)
                        .frame(width: 72, height: 48)
                        .position(x: 105 + CGFloat(index) * 84, y: 90)
                }
                RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous)
                    .fill(colorway.tokens.sHi.color)
                    .frame(width: 72, height: 48)
                    .metalSelectionFrame(.selected, radius: MetalRadius.card, corner: .se)
                    .position(x: 105, y: 195)
                MetalLasso(rect: CGRect(x: 55, y: 48, width: 260, height: 92), count: 3, scale: scale)
                MetalLasso(rect: CGRect(x: 319, y: 230, width: -80, height: -40), count: 0, scale: scale)
            }
            .frame(width: 360, height: 260)
            .scaleEffect(scale, anchor: .topLeading)
            .frame(width: 450, height: 325, alignment: .topLeading)
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)

            let renderer = ImageRenderer(content: world)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage, "lasso-\(colorway.rawValue) did not render")
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("lasso-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]))
            try data.write(to: url)
        }
    }
}
