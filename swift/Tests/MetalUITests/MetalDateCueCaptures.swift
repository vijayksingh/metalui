import AppKit
import SwiftUI
import XCTest
@testable import MetalUI
@MainActor final class MetalDateCueCaptures: XCTestCase {
    func testCivilDateSentence() throws {
        let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        for colorway in MetalColorway.allCases {
            let content = VStack(alignment: .leading, spacing: MetalSpace.s24) {
                HStack(alignment: .firstTextBaseline) {
                    Text("meet")
                    MetalDateCue("Meeting day", value: .constant("2026-03-08"), today: "2026-03-07", in: "2026-03-01"..."2026-04-30", footprint: ["next Wednesday", "Wed, 30 Apr", "2026-03-16"])
                    Text("after lunch")
                }
                HStack(alignment: .firstTextBaseline) {
                    Text("return")
                    MetalDateCue("Return date", value: .constant("2026-04-16"), today: "2026-03-07", in: "2026-03-01"..."2026-04-30", footprint: ["next Wednesday", "Wed, 30 Apr", "2026-03-16"])
                }
                MetalDateCue("Read only date", value: .constant("2026-03-08"), today: "2026-03-07", in: "2026-03-01"..."2026-04-30", footprint: ["next Wednesday", "2026-03-16"], readOnly: true)
            }.font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color).padding(MetalSpace.s24).frame(width: 600, alignment: .leading)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color).metalColorway(colorway).metalReduceMotion()
            let renderer = ImageRenderer(content: content); renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]))
                .write(to: URL(fileURLWithPath: directory).appendingPathComponent("date-cue-\(colorway.rawValue).png"))
        }
    }
}
