import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// The SwiftUI slider beside the web playground on metalui.dev (docs/captures/swift/slider-*.png):
/// at the minimum, part way and at the maximum, so the knob can be seen sitting flush inside the
/// groove's ends with the fill's end and the labelled ticks under its centre.
///
///     METALUI_CAPTURES=docs/captures/swift swift test --filter MetalSliderCaptures
@MainActor
final class MetalSliderCaptures: XCTestCase {
    private let ticks = [0, 0.25, 0.5, 0.75, 1].map { MetalSliderTick(at: $0, label: "\(Int($0 * 100))") }

    private func slider(_ value: Double) -> some View {
        MetalSlider(value: .constant(value), in: 0...100, step: 1, largeStep: 10,
                    ticks: ticks, label: "Amount", valueText: { "\(Int($0))" })
            .frame(width: 360, height: 48)
    }

    func testSliderGeometry() throws {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 20) {
                slider(0)
                slider(40)
                slider(100)
                MetalSlider(values: .constant([25, 75]), in: 0...100, step: 5, largeStep: 25,
                            minStepsBetweenValues: 2, thumbLabels: ["Exposure, lower", "Exposure, upper"],
                            showsValue: true, valueBubble: true, label: "Exposure", valueText: { "\(Int($0))%" })
                    .frame(height: 32)
                MetalSlider(value: .constant(-60), in: -100...100, step: 1, largeStep: 10,
                            knobIcon: .volume, showsValue: true, tone: .neutral, centered: true,
                            label: "Balance", valueText: { "\(Int($0))" }).frame(height: 32)
                MetalSlider(value: .constant(40), in: 0...100, step: 1, largeStep: 10,
                            ticks: ticks, startIcon: .volume, endIcon: .volume, showsValue: true,
                            orientation: .vertical, label: "Vertical level", valueText: { "\(Int($0))%" })
                    .frame(width: 72, height: 240)
                // the playground's zoom: glyphs at the ends, the value beside it, in each size
                ForEach(MetalSliderSize.allCases, id: \.self) { size in
                    MetalSlider(value: .constant(100), in: 25...200, step: 5, largeStep: 25,
                                size: size, startIcon: .zoomOut, endIcon: .zoomIn, showsValue: true,
                                label: "Zoom", valueText: { "\(Int($0))%" })
                        .frame(width: 360, height: 32)
                }
                // disabled: the whole slider at 40 %
                MetalSlider(value: .constant(35), in: 0...100, step: 1, largeStep: 10, showsValue: true,
                            label: "Volume", valueText: { "\(Int($0))%" })
                    .frame(width: 360, height: 32)
                    .disabled(true)
            }
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            guard let dir = ProcessInfo.processInfo.environment["METALUI_CAPTURES"] else { continue }
            let url = URL(fileURLWithPath: dir).appendingPathComponent("slider-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
