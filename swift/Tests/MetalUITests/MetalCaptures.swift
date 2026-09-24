import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// SwiftUI captures that sit beside the web specimens on metalui.dev (PLAN parity gate b).
/// Each renders through `ImageRenderer`; set `METALUI_CAPTURES` to a directory to write PNGs:
///
///     METALUI_CAPTURES=docs/captures/swift swift test --filter MetalCaptures
@MainActor
final class MetalCaptures: XCTestCase {
    private func capture<V: View>(_ name: String, _ view: V) {
        let renderer = ImageRenderer(content: view)
        renderer.scale = 2
        guard let image = renderer.cgImage else { return XCTFail("\(name) did not render") }
        guard let dir = ProcessInfo.processInfo.environment["METALUI_CAPTURES"] else { return }
        let url = URL(fileURLWithPath: dir).appendingPathComponent("\(name).png")
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        let rep = NSBitmapImageRep(cgImage: image)
        XCTAssertNoThrow(try rep.representation(using: .png, properties: [:])!.write(to: url))
    }

    /// A busy backdrop for frost to melt: the same stripes and orange block the docs page uses.
    private struct BusyBackdrop: View {
        var body: some View {
            ZStack(alignment: .topLeading) {
                HStack(spacing: 0) {
                    ForEach(0..<18, id: \.self) { i in
                        Rectangle().fill(i.isMultiple(of: 2) ? Color(white: 0.12) : Color(white: 0.92)).frame(width: 14)
                    }
                }
                RoundedRectangle(cornerRadius: 18).fill(LinearGradient(colors: [Color(red: 1, green: 0.48, blue: 0.3), Color(red: 0.91, green: 0.33, blue: 0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 96, height: 72).offset(x: 150, y: 20)
                Text("Frost melts what is behind").font(.metal(MetalType.title)).foregroundStyle(.black).offset(x: 12, y: 100)
            }
            .frame(width: 252, height: 140, alignment: .topLeading)
            .clipped()
        }
    }

    private func frostBench(_ colorway: MetalColorway) -> some View {
        HStack(spacing: 24) {
            ForEach(MetalFrost.allCases, id: \.self) { frost in
                VStack(spacing: 10) {
                    ZStack {
                        BusyBackdrop()
                        Text(frost.rawValue.uppercased())
                            .font(.metal(MetalType.label))
                            .tracking(MetalType.label.trackingPoints)
                            .foregroundStyle(frost == .graphite ? MetalTokens.graphite.ink2.color : colorway.tokens.ink2.color)
                            .frame(width: 180, height: 56)
                            .metalFrost(frost, in: RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous))
                    }
                }
            }
        }
        .padding(32)
        .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
        .metalColorway(colorway)
    }

    func testFrost() {
        for colorway in MetalColorway.allCases {
            capture("frost-\(colorway.rawValue)", frostBench(colorway))
        }
    }
}
