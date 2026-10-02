import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalPlaybackIconCaptures: XCTestCase {
    func testPlaybackKeysInBothCuts() throws {
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: MetalSpace.s16) {
                ForEach([MetalIconName.play, .pause], id: \.self) { name in
                    HStack(spacing: MetalSpace.s8) {
                        MetalIcon(name, size: 16)
                        MetalIcon(name, size: 24)
                        Text(name.label).font(.metal(MetalType.ui))
                    }
                }
            }
            .foregroundStyle(colorway.tokens.icon.color)
            .padding(MetalSpace.s24)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("playback-icons-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
