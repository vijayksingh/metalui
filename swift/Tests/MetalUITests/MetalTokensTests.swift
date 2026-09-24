import SwiftUI
import XCTest
@testable import MetalUI

final class MetalTokensTests: XCTestCase {
    /// Spot-checks the generated tokens against the sheet's literal CSS values.
    func testGeneratedTokensMatchTheSheet() {
        XCTAssertEqual(MetalTokens.bone.btnBg, MetalGradient(angle: 180, stops: [
            .init(MetalRGBA(255, 255, 255, 1), 0), .init(MetalRGBA(244, 243, 240, 1), 1),
        ]))
        XCTAssertEqual(MetalTokens.bone.btnSh.count, 5)
        XCTAssertEqual(MetalTokens.bone.btnSh[0], MetalShadow(inset: true, x: 0, y: 0, blur: 4, spread: 1, color: MetalRGBA(255, 255, 255, 0.9)))
        XCTAssertEqual(MetalTokens.graphite.pressedSh.filter(\.inset).count, 3)
        XCTAssertEqual(MetalCaps.destructive.pressedSh[1], MetalShadow(inset: false, x: 0, y: 0, blur: 0, spread: 0.5, color: MetalRGBA(110, 10, 0, 0.55)))
        XCTAssertEqual(MetalSprings.press, MetalSpring(stiffness: 500, damping: 40, duration: 0.3))
        XCTAssertEqual(MetalTokens.graphite.duoK, 1.3)
    }

    @MainActor
    func testButtonRendersInBothColorways() {
        for colorway in MetalColorway.allCases {
            let view = HStack {
                MetalButton("New Canvas", cap: .primary) {}
                MetalButton("Cancel") {}
                MetalButton("Delete", cap: .destructive) {}
            }
            .padding(24)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            XCTAssertNotNil(renderer.cgImage, "\(colorway) did not render")
        }
    }
}
