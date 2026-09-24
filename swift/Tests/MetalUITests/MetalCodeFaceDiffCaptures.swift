import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// Offscreen code-card conformance: derived diff rows and host-provided classes.
@MainActor
final class MetalCodeFaceDiffCaptures: XCTestCase {
    func testDiffCards() throws {
        let code = "--- a/file.swift\n+++ b/file.swift\n-let count = 1\n+let count = 2\n func done() { // context\n+  print(\"let 42\")"
        for colorway in MetalColorway.allCases {
            let view = HStack(alignment: .top, spacing: 22) {
                MetalCodeFace(code, language: "diff")
                MetalCodeFace(code, language: "swift", diff: [.context, .context, .remove, .add, .context, .add])
            }
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)

            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage, "code-card-diff-\(colorway.rawValue) did not render")
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("code-card-diff-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]))
            try data.write(to: url)
        }
    }
}
