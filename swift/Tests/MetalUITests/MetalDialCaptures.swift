import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalDialCaptures: XCTestCase {
    func testDialAndTimeShapes() throws {
        let start = Date(timeIntervalSince1970: 1_791_331_200)
        let end = start.addingTimeInterval(MetalScrubberMetrics.largeStepMs / 1000 * 3)
        for colorway in MetalColorway.allCases {
            for reduced in [false, true] {
                let view = VStack(alignment: .leading, spacing: MetalSpace.s32) {
                    ForEach([0.0, 0.25, 0.5, 0.75, 1.0], id: \.self) { curl in
                        HStack(spacing: MetalSpace.s24) {
                            MetalDial(value: .constant(0.5), step: 0.1, curl: curl,
                                      marks: [0.2, 0.5, 0.8], ticks: [.init(at: .zero, label: "MIN"), .init(at: .one, label: "MAX")], label: "Level")
                            MetalLabel("CURL \(curl)", style: .engraved)
                        }
                    }
                    HStack(spacing: MetalSpace.s24) {
                        MetalDial(value: .constant(.zero), label: "Minimum")
                        MetalDial(value: .constant(.one), label: "Maximum")
                        MetalDial(value: .constant(0.5), label: "Disabled").disabled(true)
                    }
                    MetalTimeScrubber(range: start...end, selection: .constant(nil), marks: [start, end], shape: .bar)
                    MetalTimeScrubber(range: start...end, selection: .constant(start), marks: [start, end], shape: .dial)
                    MetalTimeScrubber(range: start...end, selection: .constant(nil), shape: .dial)
                }
                .environment(\.metalSnapshot, true).metalReduceMotion(reduced)
                .padding(MetalSpace.s32)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                .metalColorway(colorway)
                let renderer = ImageRenderer(content: view)
                renderer.scale = 2
                let image = try XCTUnwrap(renderer.cgImage)
                let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
                let url = URL(fileURLWithPath: directory).appendingPathComponent("dial-time-\(colorway.rawValue)-\(reduced ? "reduced" : "motion").png")
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
            }
        }
    }
}
