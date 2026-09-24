import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalSwitchCaptures: XCTestCase {
    func testSwitchStatesAndSizes() throws {
        for colorway in MetalColorway.allCases {
            let view = VStack(alignment: .leading, spacing: MetalSettingsMetrics.rowGap) {
                HStack(spacing: MetalSettingsMetrics.rowGap) {
                    MetalSwitch("Sync off", isOn: .constant(false))
                    MetalSwitch("Sync on", isOn: .constant(true))
                    MetalSwitch("Sync disabled", isOn: .constant(true)).disabled(true)
                }
                HStack(spacing: MetalSettingsMetrics.rowGap) {
                    MetalSwitch("Compact off", isOn: .constant(false), size: .small)
                    MetalSwitch("Compact on", isOn: .constant(true), size: .small)
                }
            }
            .padding(MetalSettingsMetrics.rowPadX)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("switch-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
