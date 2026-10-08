import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalLabelWrappingFeature: XCTestCase {
    func testSentenceColumnAndSingleLineRoles() throws {
        let sentence = "Keep this canvas in sync across all your devices"
        for colorway in MetalColorway.allCases {
            for style in [MetalLabel.Style.display, .displayQuiet, .name, .detail, .engraved, .small, .title, .heading, .query, .count, .cell, .value, .valueSmall, .readout, .readoutDim, .onGraphite, .dark] {
                let narrow = ImageRenderer(content: MetalLabel(sentence, style: style).frame(width: 120).metalColorway(colorway))
                let wide = ImageRenderer(content: MetalLabel(sentence, style: style).frame(width: 600).metalColorway(colorway))
                let narrowImage = try XCTUnwrap(narrow.cgImage), wideImage = try XCTUnwrap(wide.cgImage)
                switch style {
                case .display, .displayQuiet, .name, .detail:
                    XCTAssertGreaterThan(narrowImage.height, wideImage.height, "\(style) wraps to its column")
                default:
                    XCTAssertEqual(narrowImage.height, wideImage.height, "\(style) stays on one line")
                }
            }
        }
    }
}
