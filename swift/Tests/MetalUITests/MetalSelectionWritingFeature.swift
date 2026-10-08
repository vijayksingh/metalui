import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalSelectionWritingFeature: XCTestCase {
    func testWritingLeavesOnlyObject() throws {
        for colorway in MetalColorway.allCases {
            for reduced in [false, true] {
                let object = MetalLabel("Writing with the caret alone", style: .name)
                    .padding(MetalSpace.s6)
                let plain = object.padding(MetalSpace.s64)
                    .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                    .metalColorway(colorway).metalReduceMotion(reduced)
                let framed = object.metalSelectionFrame(.selected, mode: .writing, corner: .nw)
                    .padding(MetalSpace.s64)
                    .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                    .metalColorway(colorway).metalReduceMotion(reduced)
                let plainRenderer = ImageRenderer(content: plain)
                let frameRenderer = ImageRenderer(content: framed)
                let expected = try XCTUnwrap(plainRenderer.cgImage)
                let actual = try XCTUnwrap(frameRenderer.cgImage)
                XCTAssertEqual(actual.width, expected.width)
                XCTAssertEqual(actual.height, expected.height)
                let actualPixels = try pixels(actual), expectedPixels = try pixels(expected)
                if actualPixels != expectedPixels {
                    let differences = (0..<actualPixels.count).filter { actualPixels[$0] != expectedPixels[$0] }
                    print("Writing \(colorway.rawValue), reduced \(reduced): \(differences.count) differing channels; first \(differences.prefix(12).map { "\($0 / 4 % actual.width),\($0 / 4 / actual.width):\(expectedPixels[$0])/\(actualPixels[$0])" })")
                    if let directory = ProcessInfo.processInfo.environment["METALUI_CAPTURES"] {
                        for (name, image) in [("actual", actual), ("expected", expected)] {
                            let url = URL(fileURLWithPath: directory).appendingPathComponent("selection-\(colorway.rawValue)-\(reduced)-\(name).png")
                            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
                        }
                    }
                }
                XCTAssertEqual(actualPixels, expectedPixels,
                               "Writing must hide ring, collar, handles, glow and readout")
            }
        }
    }

    // Compare rendered pixels, not CoreGraphics' unspecified bitmap row padding.
    private func pixels(_ image: CGImage) throws -> Data {
        let context = try XCTUnwrap(CGContext(data: nil, width: image.width, height: image.height,
            bitsPerComponent: 8, bytesPerRow: image.width * 4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        return Data(bytes: try XCTUnwrap(context.data), count: image.width * image.height * 4)
    }
}
