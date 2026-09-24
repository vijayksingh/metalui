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

    private func iconSheet(_ colorway: MetalColorway) -> some View {
        let columns = Array(repeating: GridItem(.fixed(44), spacing: 8), count: 16)
        return VStack(alignment: .leading, spacing: 20) {
            Text("PRODUCT · \(MetalIconName.allCases.count) · 24 AND 16").font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.engrave.color)
            LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
                ForEach(MetalIconName.allCases, id: \.self) { icon in
                    VStack(spacing: 6) { MetalIcon(icon, size: 24); MetalIcon(icon, size: 16) }
                }
            }
            Text("LIFE · \(MetalLifeIconName.allCases.count) · 24 AND 16, TINTED WHERE THE MANIFEST SAYS").font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.engrave.color)
            LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
                ForEach(MetalLifeIconName.allCases, id: \.self) { icon in
                    VStack(spacing: 6) { MetalLifeIcon(icon, size: 24); MetalLifeIcon(icon, size: 16) }
                }
            }
        }
        .foregroundStyle(colorway.tokens.icon.color)
        .padding(28)
        .frame(width: 16 * 52 + 56, alignment: .leading)
        .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
        .metalColorway(colorway)
    }

    func testIcons() {
        for colorway in MetalColorway.allCases {
            capture("icons-\(colorway.rawValue)", iconSheet(colorway))
        }
    }

    private func selectionSheet(_ colorway: MetalColorway) -> some View {
        let object = RoundedRectangle(cornerRadius: MetalRadius.plate, style: .continuous)
        return HStack(alignment: .top, spacing: 40) {
            Color.clear.frame(width: 150, height: 88).metalRecipe(MetalRecipe(fill: colorway.tokens.btnBg, shadows: colorway.tokens.raiseSm), in: object)
                .metalSelectionFrame(.selected, radius: MetalRadius.plate)
            Color.clear.frame(width: 150, height: 88).metalRecipe(MetalRecipe(fill: colorway.tokens.btnBg, shadows: colorway.tokens.raiseSm), in: object)
                .metalSelectionFrame(.selected, mode: .writing, radius: MetalRadius.plate, handles: .text)
            Color.clear.frame(width: 150, height: 88).metalRecipe(MetalRecipe(fill: colorway.tokens.btnBg, shadows: colorway.tokens.raiseSm), in: object)
                .metalSelectionFrame(.selected, variant: .lite, radius: MetalRadius.plate, readout: false)
            Color.clear.frame(width: 150, height: 88).metalRecipe(MetalRecipe(fill: colorway.tokens.btnBg, shadows: colorway.tokens.raiseSm), in: object)
                .metalSelectionFrame(.selected, variant: .lite, radius: MetalRadius.plate, count: 3)
        }
        .padding(.horizontal, 32)
        .padding(.top, 32)
        .padding(.bottom, 64)
        .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
        .metalColorway(colorway)
    }

    func testSelectionFrame() {
        for colorway in MetalColorway.allCases {
            capture("selection-frame-\(colorway.rawValue)", selectionSheet(colorway))
        }
    }

    private func cueSheet(_ colorway: MetalColorway) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 24) {
                MetalDimple(isOn: .constant(false), label: "rest")
                MetalDimple(isOn: .constant(true), label: "checked")
                MetalDimple(isOn: .constant(false), doing: true, label: "doing")
                MetalDimple(isOn: .constant(false), ghost: true, label: "ghost")
                MetalCueUrgency()
            }
            (Text("Send ") + Text("tomorrow 4pm").metalCue(.date, colorway: colorway) + Text(", ") + Text("1h30").metalCue(.duration, colorway: colorway)
                + Text(" for ") + Text("$40").metalCue(.amount, colorway: colorway) + Text(", slept ") + Text("6h").metalCue(.measurement, colorway: colorway)
                + Text(" in ") + Text("#FF6B3D").metalCue(.hex, colorway: colorway, hex: MetalShared.orange))
                .font(.metal(MetalType.content))
                .foregroundColor(colorway.tokens.ink.color)
            HStack(spacing: 8) {
                MetalCueTag("#poster")
                MetalCueTag("#studio", derived: true)
                MetalCueURLPill(host: "figma.com") {}
                MetalCueInferred("fri")
                MetalCueLife(.coffee)
            }
        }
        .padding(28)
        .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
        .metalColorway(colorway)
    }

    func testCues() {
        for colorway in MetalColorway.allCases {
            capture("cue-\(colorway.rawValue)", cueSheet(colorway))
        }
    }

    func testSuggestionChip() {
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: 24) {
                MetalSuggestionChip(label: "Task?", confidence: 0.72, onAccept: {}, onDismiss: {})
                MetalSuggestionChip(label: "Track as sleep?", confidence: 0.64, hostHovered: true, onAccept: {}, onDismiss: {})
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("suggestion-chip-\(colorway.rawValue)", view)
        }
    }

    func testHoverEngraving() {
        for colorway in MetalColorway.allCases {
            let view = VStack(alignment: .leading, spacing: 16) {
                MetalHoverEngraving(kind: "LOG", details: ["07:40", "SLEEP 6 H", "ALSO TIRED"], status: (.live, "JEV ✓"))
                MetalHoverEngraving(kind: "TASK", details: ["TOMORROW 16:00"], tags: ["poster"], status: (.live, "JEV ✓"))
                MetalHoverEngraving(kind: "LUNCH? 0.71", status: (.waiting, "ASKING JEV…"))
                MetalHoverEngraving(kind: "NOT SENT", details: ["LOOKS LIKE A SECRET"], status: (.off, "KEPT ON THIS MAC"))
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("hover-engraving-\(colorway.rawValue)", view)
        }
    }

    func testProvenanceTooltip() {
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: 16) {
                MetalProvenanceTooltip(source: "Rule", detail: ["Date parser"])
                MetalProvenanceTooltip(source: "Jev", detail: ["0.82"])
                MetalProvenanceTooltip(source: "You")
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("provenance-tooltip-\(colorway.rawValue)", view)
        }
    }

    func testRegion() {
        for colorway in MetalColorway.allCases {
            let view = HStack(alignment: .top, spacing: 20) {
                MetalRegionView(name: "friday", rule: "dates them friday", count: 2).frame(width: 200, height: 140)
                MetalRegionView(name: "Done", rule: "marks tasks done", dropRule: "drop to mark tasks done", state: .over).frame(width: 200, height: 140)
                MetalRegionView(name: "#poster", rule: "tags them #poster", state: .dim).frame(width: 200, height: 140)
                MetalRegionView(name: "open tasks", rule: "lens · live", lens: true) {
                    VStack(spacing: 2) {
                        MetalRegionRow("Send the poster", meta: "FRI") { MetalDimple(isOn: .constant(false), label: "Send the poster") }
                        MetalRegionRow("Call the printer", checked: true) { MetalDimple(isOn: .constant(true), label: "Call the printer") }
                    }
                }.frame(width: 260, height: 160)
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("region-\(colorway.rawValue)", view)
        }
    }

    func testSegmented() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 20) {
                MetalSegmented("Colorway", selection: .constant("bone"), options: [("bone", "Bone"), ("graphite", "Graphite")])
                MetalSegmented("View", selection: .constant("list"), options: [("place", "place"), ("list", "list"), ("table", "table"), ("timeline", "timeline"), ("gallery", "gallery")], size: .compact)
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("segmented-\(colorway.rawValue)", view)
        }
    }

    func testLensBar() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 20) {
                MetalLensBar(query: "open tasks about the poster", count: 6, source: .jev, mode: .constant(.list), onPin: {}, onClose: {})
                MetalLensBar(query: "lunch this week", source: .asking, mode: .constant(.place), onPin: {}, onClose: {})
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("lens-bar-\(colorway.rawValue)", view)
        }
    }

    func testMemoryScrubber() {
        let end = Date(timeIntervalSince1970: 1_790_000_000)
        let start = end.addingTimeInterval(-6 * 86400)
        let marks = (0..<20).map { start.addingTimeInterval(Double($0) * 6 * 86400 / 20 + 3600) }
        for colorway in MetalColorway.allCases {
            let view = VStack(alignment: .leading, spacing: 24) {
                MetalMemoryScrubber(range: start...end, selection: .constant(nil), marks: marks)
                MetalMemoryScrubber(range: start...end, selection: .constant(end.addingTimeInterval(-2.4 * 86400)), marks: marks)
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("memory-scrubber-\(colorway.rawValue)", view)
        }
    }

    func testPastBanner() {
        for colorway in MetalColorway.allCases {
            let view = MetalPastBanner(moment: "viewing Tue 23 Sep · 14:10") {}
                .padding(28)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
            capture("past-banner-\(colorway.rawValue)", view)
        }
    }

    func testToolStrip() {
        for colorway in MetalColorway.allCases {
            let view = MetalToolStrip(label: "3 blocks", items: ["Tasks", "Summarise", "Gather", "Region", "Export"].map { MetalToolStripItem($0) {} } + [MetalToolStripItem("Send away", destructive: true) {}])
                .padding(28)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
            capture("tool-strip-\(colorway.rawValue)", view)
        }
    }

    func testSizeReadout() {
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: 16) {
                MetalSizeReadout(size: CGSize(width: 320, height: 214))
                MetalSizeReadout(size: CGSize(width: 540, height: 180), count: 3)
                MetalSizeReadout(size: CGSize(width: 130, height: 215), copied: "PNG")
                MetalSizeReadout(value: "100 %")
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("size-readout-\(colorway.rawValue)", view)
        }
    }

    func testKbd() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 16) {
                HStack(spacing: 6) { MetalKbd("⌘"); MetalKbd("K"); MetalKbd("⇧"); MetalKbd("↩"); MetalKbd("⎋") }
                HStack(spacing: 6) { MetalKbd("↑", size: .small); MetalKbd("↓", size: .small); MetalKbd("⌘K", surface: .strip); MetalKbd("⌘Z", surface: .sunk) }
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("kbd-\(colorway.rawValue)", view)
        }
    }

    func testStatus() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 20) {
                HStack(spacing: 24) { MetalLED(.live); MetalLED(.waiting); MetalLED(.failed); MetalLED(.link); MetalLED(.off) }
                HStack(spacing: 12) {
                    MetalStatusBadge("Jev live", led: .live)
                    MetalStatusBadge("Jev offline · add key to keychain", led: .waiting)
                    MetalStatusBadge("Jev · no connection", led: .failed)
                }
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("status-\(colorway.rawValue)", view)
        }
    }

    func testToast() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 16) {
                MetalToast(MetalToastModel("Moved 3 blocks", undo: {}))
                MetalToast(MetalToastModel("Pinned as a live region", sub: "it updates as you write", tone: .success))
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("toast-\(colorway.rawValue)", view)
        }
    }
}
