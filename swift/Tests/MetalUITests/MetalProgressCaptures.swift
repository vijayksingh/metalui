import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalProgressCaptures: XCTestCase {
    func testTaskShapesAndStates() throws {
        let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        for colorway in MetalColorway.allCases {
            let view = VStack(alignment: .leading, spacing: MetalLayout.gapGroup) {
                MetalProgress("Exporting photos", value: 45, detail: "8 of 12 · about 20 s")
                MetalProgress("Toolbar export", value: 45, shape: .slim, size: .compact)
                HStack(spacing: MetalLayout.gapGroup) {
                    MetalProgress("Exporting", value: 45, shape: .ring)
                    MetalProgress("Paused", value: 60, state: .paused, shape: .ring, size: .compact)
                }
                MetalProgress("Step 2 of 4", value: 45, shape: .segmented, steps: 4)
                MetalProgress("Media export", value: 45, shape: .buffered, buffer: 75)
                HStack(spacing: MetalLayout.gapGroup) {
                    MetalProgress("Failed export", value: 60, state: .failed)
                    MetalProgress("Cancelled export", value: 0, state: .cancelled)
                }
                MetalProgress("Exporting", value: 100, state: .complete, completeLabel: "Exported")
                MetalProgress("Unknown paused sync", value: nil, state: .paused)
            }
            .padding(MetalSpace.s24).frame(width: 620)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view); renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let url = URL(fileURLWithPath: directory).appendingPathComponent("progress-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
