import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalEmptyStateCaptures: XCTestCase {
    func testEmptyStateKinds() throws {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: MetalSpace.s16) {
                MetalSurface(.raise, radius: .hero) {
                    MetalEmptyState("No regions yet", description: "Draw a box around notes to make one.", icon: .region) {
                        MetalButton("New region", icon: .plus, size: .compact) {}
                    }
                }
                .frame(width: MetalRecipes.emptyState.points("self.max-width"))
                MetalEmptyState("No comments", description: "Say something", compact: true) {
                    MetalButton("Comment", icon: .note, size: .compact) {}
                }
            }
            .environment(\.metalSnapshot, true)
            .padding(MetalSpace.s16)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            XCTAssertGreaterThan(image.width, Int(MetalRecipes.emptyState.points("self.max-width")))
            if let directory = ProcessInfo.processInfo.environment["METALUI_CAPTURES"] {
                let url = URL(fileURLWithPath: directory).appendingPathComponent("empty-state-\(colorway.rawValue).png")
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
            }
        }
    }
}
