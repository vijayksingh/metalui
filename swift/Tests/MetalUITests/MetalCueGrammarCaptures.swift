import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalCueGrammarCaptures: XCTestCase {
    func testRecognitionGrammarOnTextSurface() throws {
        for colorway in MetalColorway.allCases {
            let content = VStack(alignment: .leading, spacing: MetalSpace.s24) {
                HStack(alignment: .firstTextBaseline, spacing: MetalSpace.s16) {
                    MetalCueText("tomorrow 4pm", kind: .date, meaning: .time, label: "Date and time", recognition: "date")
                    MetalCueText("$40", kind: .amount, meaning: .money, label: "Amount", recognition: "amount", formatted: "$40.00")
                    MetalCueText("6h", kind: .measurement, meaning: .sleep, label: "Sleep", recognition: "sleep")
                }
                HStack(spacing: MetalSpace.s16) {
                    MetalCueText("8000 steps", kind: .measurement, meaning: .steps, label: "Steps")
                    MetalCueText("#FF6B3D", kind: .hex, meaning: .colour, label: "Colour", color: MetalShared.orange)
                    MetalCueText("Sam", kind: .measurement, meaning: .person, label: "Sam", personGlyph: AnyView(MetalAvatar(name: "Sam", accessibilityLabel: "").scaleEffect(MetalRecipes.button.points("compact.glyph") / MetalRecipes.avatar.points("size.regular"))))
                }
                HStack(spacing: MetalSpace.s16) {
                    MetalCueTag("#poster")
                    MetalCueTag("#café")
                    MetalCueTag("#cafe\u{301}")
                    MetalCueTag("#studio", derived: true)
                    MetalCueInferred("FRI · 0.82")
                    MetalCueInferred("FRI", confirmed: true)
                }
                HStack(spacing: MetalSpace.s16) {
                    MetalCueText("$40", kind: .amount, meaning: .money, raw: true, formatted: "$40.00")
                    MetalCueText("6h", kind: .measurement, meaning: .sleep, raw: true)
                    MetalCueLife(.coffee)
                }
            }
            .font(.metal(MetalType.content))
            .foregroundStyle(colorway.tokens.ink.color)
            .padding(MetalSpace.s24)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway).metalReduceMotion()
            let renderer = ImageRenderer(content: content); renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage)
            let root = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
            let url = URL(fileURLWithPath: root).appendingPathComponent("cue-grammar-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
        }
    }
}
