import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalSettingsCaptures: XCTestCase {
    func testSettingsSections() throws {
        for colorway in MetalColorway.allCases {
          var previousHeight: Int?
          for width in [420.0, 240.0, 160.0] {
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
            .frame(width: width)
            .padding(MetalSettingsMetrics.sectionGap)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("settings-\(Int(width))-\(colorway.rawValue).png")
            if let previousHeight { XCTAssertGreaterThan(image.height, previousHeight, "Narrow rows must stack and wrap without squeezing controls") }
            previousHeight = image.height
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
          }
        }
    }
}
