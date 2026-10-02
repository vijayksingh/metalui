import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// Rendering integration of the public inline numeric control in both colorways.
@MainActor final class MetalNumericCueCaptures: XCTestCase {
    private let units = [
        MetalNumericCueUnit(id: "h", label: "hours", factor: 60, step: 1 / 12,
                            format: { "\($0) h" }, source: { "\($0)h" }),
        MetalNumericCueUnit(id: "min", label: "minutes", factor: 1, step: 5,
                            format: { "\(Int($0)) min" }, source: { "\(Int($0))min" }),
    ]
    func testInlineQuantities() throws {
        let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        for colorway in MetalColorway.allCases {
            let content = VStack(alignment: .leading, spacing: MetalSpace.s24) {
                HStack(alignment: .firstTextBaseline) {
                    Text("slept")
                    MetalNumericCue("Sleep", value: .constant(.init(value: 360, unit: "h")), units: units, in: 0...1440,
                                    footprint: ["0.0833333333333333 h", "1440 min"], kind: .duration, meaning: .sleep)
                    Text("after work")
                }
                HStack(alignment: .firstTextBaseline) {
                    Text("work for")
                    MetalNumericCue("Duration", value: .constant(.init(value: 90, unit: "min")), units: units, in: 0...1440,
                                    footprint: ["0.0833333333333333 h", "1440 min"], kind: .duration, meaning: .time)
                    Text("then pause")
                }
                MetalNumericCue("Read only duration", value: .constant(.init(value: 120, unit: "min")), units: units, in: 0...1440,
                                footprint: ["0.0833333333333333 h", "1440 min"], kind: .duration, readOnly: true)
                MetalNumericCue("Disabled duration", value: .constant(.init(value: 120, unit: "min")), units: units, in: 0...1440,
                                footprint: ["0.0833333333333333 h", "1440 min"], kind: .duration).disabled(true)
            }.font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
                .padding(MetalSpace.s24).frame(width: 600, alignment: .leading)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                .metalColorway(colorway).metalReduceMotion()
            let renderer = ImageRenderer(content: content); renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let url = URL(fileURLWithPath: directory).appendingPathComponent("numeric-cue-\(colorway.rawValue).png")
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
