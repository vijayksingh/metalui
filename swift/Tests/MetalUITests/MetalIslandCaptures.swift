import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalIslandCaptures: XCTestCase {
    func testIslandStates() throws {
        for colorway in MetalColorway.allCases {
            for reduced in [false, true] {
                let view = VStack(spacing: MetalSpace.s6) {
                    MetalIsland("Today · Wed 7 Oct", detail: "8 blocks", tone: .live, toneLabel: "Recognition live")
                    MetalIsland("Today", detail: "Syncing", tone: .working)
                    MetalIsland("The past", detail: "Offline", tone: .offline)
                    MetalIsland("Today", detail: "8 blocks", tone: .quiet, open: .constant(true)) {
                        VStack(alignment: .leading, spacing: MetalRecipes.island.points("self.panel-gap")) {
                            MetalLabel("Choose a place", style: .name)
                            MetalButton("Appearance", icon: .settings) {}
                            MetalSettings.Row("Keep work in sync", detail: "Changes appear on all your devices") {
                                MetalSwitch("Keep work in sync", isOn: .constant(true))
                            }
                        }
                    }
                }
                .environment(\.metalSnapshot, true)
                .metalReduceMotion(reduced)
                .padding(MetalSpace.s6)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                .metalColorway(colorway)
                let renderer = ImageRenderer(content: view)
                renderer.scale = 2
                let image = try XCTUnwrap(renderer.cgImage)
                XCTAssertGreaterThan(image.width, Int(MetalRecipes.island.points("self.panel-width")))
                let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
                let url = URL(fileURLWithPath: directory).appendingPathComponent("island-\(colorway.rawValue)-\(reduced ? "reduced" : "motion").png")
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
            }
        }
    }
}
