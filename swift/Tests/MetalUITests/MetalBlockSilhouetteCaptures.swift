import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// Offscreen feature sheet: every far-zoom kind, both colorways, and line-limited bars.
@MainActor
final class MetalBlockSilhouetteCaptures: XCTestCase {
    func testSilhouettes() throws {
        for colorway in MetalColorway.allCases {
            let ink = colorway.tokens.ink2.color
            let view = VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top, spacing: 18) {
                    sample("TEXT", color: ink) {
                        MetalBlockSilhouette(.text, lines: 3).frame(width: 180, height: 120)
                    }
                    sample("CODE", color: ink) {
                        MetalBlockSilhouette(.code, lines: 3).frame(width: 180, height: 120)
                    }
                    sample("LINK", color: ink) {
                        MetalBlockSilhouette(.link, color: colorway.tokens.cueUrlInk).frame(width: 180, height: 120)
                    }
                }
                HStack(alignment: .top, spacing: 18) {
                    sample("SWATCH", color: ink) {
                        MetalBlockSilhouette(.swatch, color: colorway.tokens.presenceDot).frame(width: 180, height: 120)
                    }
                    sample("IMAGE", color: ink) {
                        MetalBlockSilhouette(.image, color: colorway.tokens.cueUrlInk).frame(width: 180, height: 120)
                    }
                    sample("FILE", color: ink) {
                        MetalBlockSilhouette(.file).frame(width: 180, height: 120)
                    }
                }
                sample("REGION", color: ink) {
                    MetalBlockSilhouette(.region, label: "Research")
                        .frame(width: 576, height: 140)
                }
            }
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)

            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage, "block-silhouette-\(colorway.rawValue) did not render")
            let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: dir).appendingPathComponent("block-silhouette-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]))
            try data.write(to: url)
        }
    }

    private func sample<Content: View>(_ title: String, color: Color, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.metal(MetalType.label)).foregroundStyle(color)
            content()
        }
    }
}
