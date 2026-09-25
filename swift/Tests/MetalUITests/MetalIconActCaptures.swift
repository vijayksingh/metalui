import AppKit
import SwiftUI
import XCTest
@testable import MetalUI

/// Offscreen filmstrip of every icon act (docs/ICON-MOTION.md), both colorways: the same frames
/// the web filmstrip shows, drawn by the SwiftUI player from the generated data.
@MainActor
final class MetalIconActCaptures: XCTestCase {
    func testActsReturnToRestAndFilm() throws {
        let acts = MetalIconAct.all.sorted { $0.key.rawValue < $1.key.rawValue }
        XCTAssertFalse(acts.isEmpty, "no icon has an act")
        for (name, act) in acts {
            // Every part starts and ends at rest, so nothing snaps when the act is released.
            for index in act.parts.indices {
                for p in [0.0, 1.0] {
                    let s = act.state(index, at: p)
                    let accent = act.parts[index].opacity.first?.v == 0
                    XCTAssertEqual(s.draw, act.state(index, at: 0).draw, accuracy: 0.001, "\(name)/\(act.parts[index].name) draw does not return at \(p)")
                    if accent {
                        XCTAssertEqual(s.opacity, 0, accuracy: 0.001, "\(name)/\(act.parts[index].name) accent visible at \(p)")
                    } else {
                        XCTAssertEqual(s.opacity, act.state(index, at: 0).opacity, accuracy: 0.001, "\(name)/\(act.parts[index].name) opacity does not return at \(p)")
                        XCTAssertTrue(s.transform.isIdentityish, "\(name)/\(act.parts[index].name) not at rest at \(p): \(s.transform)")
                    }
                }
            }
        }

        let dir = try XCTUnwrap(ProcessInfo.processInfo.environment["METALUI_CAPTURES"])
        for colorway in MetalColorway.allCases {
            let ink = colorway.tokens.ink.color
            let view = VStack(alignment: .leading, spacing: 18) {
                ForEach(acts, id: \.key) { name, act in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(name.rawValue.uppercased()).font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.ink2.color)
                        HStack(spacing: 10) {
                            ForEach(0..<12, id: \.self) { i in
                                let elapsed = act.duration * Double(i) / 11
                                VStack(spacing: 4) {
                                    MetalIconActCanvas(act: act, box: 72, lineUnits: 1.7, duoK: colorway.tokens.duoK, elapsed: elapsed)
                                        .foregroundStyle(ink)
                                    Text("\(Int((elapsed * 1000).rounded()))ms").font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.ink2.color)
                                }
                            }
                        }
                    }
                }
            }
            .padding(28)
            .background((colorway == .bone ? MetalShared.page : MetalShared.pageDark).color)
            .metalColorway(colorway)

            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            let image = try XCTUnwrap(renderer.cgImage, "icon-acts-\(colorway.rawValue) did not render")
            let url = URL(fileURLWithPath: dir).appendingPathComponent("icon-acts-\(colorway.rawValue).png")
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try XCTUnwrap(NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]))
            try data.write(to: url)
        }
    }
}

private extension CGAffineTransform {
    var isIdentityish: Bool {
        abs(a - 1) < 0.001 && abs(b) < 0.001 && abs(c) < 0.001 && abs(d - 1) < 0.001 && abs(tx) < 0.001 && abs(ty) < 0.001
    }
}
