import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalSettingsCaptures: XCTestCase {
    func testSettingsSections() throws {
        for colorway in MetalColorway.allCases {
            let view = MetalSettings {
                MetalSettings.Section("SYNC") {
                    MetalSettings.Row("Sync this canvas", detail: "Keep your work on this Mac in sync") {
                        MetalSwitch("Sync this canvas", isOn: .constant(true))
                    }
                    MetalSettings.Row("Share usage data", detail: "Help improve the app") {
                        MetalSwitch("Share usage data", isOn: .constant(false))
                    }
                }
                MetalSettings.Section("SHORTCUTS") {
                    MetalSettings.Keys("Brush", keys: ["B"])
                    MetalSettings.Keys("Eraser", keys: ["E"])
                }
            }
            .frame(width: 420)
            .padding(MetalSettingsMetrics.sectionGap)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("settings-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
