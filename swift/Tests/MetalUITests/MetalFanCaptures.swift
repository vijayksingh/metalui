import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

@MainActor
final class MetalFanCaptures: XCTestCase {
    private enum Tool: Hashable { case select, write, region, pen, pencil, marker, line, arrow, rectangle, ellipse, eraser }
    private let tools: [MetalFanOption<Tool>] = [
        .init(.select, "Select", icon: .select, shortcut: "V"),
        .init(.write, "Write", icon: .text, shortcut: "T"),
        .init(.region, "Region", icon: .region),
        .init(.pen, "Pen", icon: .pen, shortcut: "P"),
        .init(.pencil, "Pencil", icon: .draw, shortcut: "N"),
        .init(.marker, "Marker", icon: .marker, shortcut: "M"),
        .init(.line, "Line", icon: .line, shortcut: "L"),
        .init(.arrow, "Arrow", icon: .arrow, shortcut: "A"),
        .init(.rectangle, "Rectangle", icon: .rectangle, shortcut: "R"),
        .init(.ellipse, "Ellipse", icon: .ellipse, shortcut: "O"),
        .init(.eraser, "Eraser", icon: .eraser, shortcut: "E"),
    ]

    func testCanvasFanSpecimens() throws {
        let directory = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        for colorway in MetalColorway.allCases {
            for scene in ["rest", "picker", "picker-reduced", "ink", "text"] {
                let reduced = scene == "picker-reduced"
                let drawing = scene == "ink"
                let text = scene == "text"
                let view = VStack {
                    Spacer(minLength: 0)
                    MetalFan("Canvas tools", initialOpen: scene.hasPrefix("picker") ? .picker : scene == "rest" ? nil : .tray,
                             reduceMotion: reduced) {
                        MetalFanLabel(drawing ? "Ink" : text ? "Text" : "Canvas", icon: drawing ? .draw : text ? .text : .region)
                        MetalFanPicker("Tool", value: .constant(drawing ? .pen : .select), options: tools)
                        if drawing {
                            MetalFanTray("Ink", icon: { MetalIcon(.draw, size: MetalRecipes.iconButton.points("tool.glyph")) }) {
                                MetalFanInk(value: .constant(.ink))
                                MetalFanWidth(value: .constant(.regular))
                            }
                        } else {
                            MetalFanTray(text ? "Text actions" : "Canvas options", icon: { MetalIcon(.more, size: MetalRecipes.iconButton.points("tool.glyph")) }) {
                                if text {
                                    MetalFanAction("Tasks", icon: .task) {}
                                    MetalFanAction("Summarise", icon: .document) {}
                                    MetalFanAction("Gather", icon: .group) {}
                                    MetalFanAction("Region", icon: .region) {}
                                    MetalFanAction("Export", icon: .share) {}
                                    MetalFanAction("Send away", icon: .sendAway) {}
                                } else { MetalButton("Image", size: .compact) {}; MetalButton("Me", size: .compact) {} }
                            }
                        }
                        MetalIconButton("Search · ⌘K", icon: .search, variant: .tool) {}
                    }
                    Spacer().frame(height: 32)
                }
                .frame(width: 680, height: 520)
                .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
                .metalColorway(colorway)
                let renderer = ImageRenderer(content: view)
                renderer.scale = 2
                let image = try XCTUnwrap(renderer.cgImage)
                let url = URL(fileURLWithPath: directory).appendingPathComponent("fan-\(scene)-\(colorway.rawValue).png")
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])).write(to: url)
            }
        }
    }
}
