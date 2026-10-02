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

    /// Parts › LED: every kind at each gesture, caught at a moment that shows the gesture's shape.
    func testLedGestures() {
        let kinds: [MetalLEDKind] = [.live, .waiting, .failed, .link, .off]
        let moments: [(MetalLampGesture, Double)] = [(.steady, 1), (.flicker, 0.22), (.breathe, 0), (.blink2, 0.3), (.rise, 0.25)]
        for colorway in MetalColorway.allCases {
            let view = Grid(horizontalSpacing: 28, verticalSpacing: 16) {
                GridRow {
                    Text("")
                    ForEach(moments, id: \.0) { g, _ in Text(g.rawValue.uppercased()).font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.engrave.color) }
                }
                ForEach(kinds, id: \.recipeState) { kind in
                    GridRow {
                        Text(kind.recipeState.uppercased()).font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.engrave.color)
                        ForEach(moments, id: \.0) { g, p in MetalLED(kind, diameter: 10, gesture: g, phase: p) }
                    }
                }
            }
            .padding(32)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("led-gestures-\(colorway.rawValue)", view)
        }
    }

    /// Parts › Dot display: each px colour as a 3 × 3 block with its unlit ring, in a field well.
    func testDotDisplay() {
        let block: [UInt8] = (0..<25).map { i in i % 5 > 0 && i % 5 < 4 && i > 4 && i < 20 ? 1 : 0 }
        let colours = MetalDotColour.allCases.filter { $0 != .off }
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: 16) {
                ForEach(colours, id: \.self) { c in
                    VStack(spacing: 6) {
                        MetalWell(.field, radius: 12) {
                            MetalDotDisplay(cols: 5, rows: 5, dots: block, inks: [MetalDotInk(.off), MetalDotInk(c)])
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        Text(c.rawValue.uppercased()).font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.engrave.color)
                    }
                }
            }
            .padding(32)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("dot-display-\(colorway.rawValue)", view)
        }
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

    /// A world-space alignment across three objects, at a non-unit canvas zoom.
    private func snapGuidesSheet(_ colorway: MetalColorway) -> some View {
        let scale: CGFloat = 1.25
        let guides = [
            MetalSnapGuide(axis: .horizontal, position: 40, start: 45, end: 320, kind: .edge),
            MetalSnapGuide(axis: .vertical, position: 100, start: 40, end: 210, kind: .center),
        ]
        let world = ZStack(alignment: .topLeading) {
            colorway.tokens.s.color
            RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous)
                .fill(colorway.tokens.sHi.color)
                .frame(width: 110, height: 78)
                .position(x: 100, y: 79)
            RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous)
                .fill(colorway.tokens.sHi.color)
                .frame(width: 110, height: 78)
                .position(x: 265, y: 79)
            RoundedRectangle(cornerRadius: MetalRadius.card, style: .continuous)
                .fill(colorway.tokens.sHi.color)
                .frame(width: 110, height: 60)
                .position(x: 100, y: 180)
            MetalSnapGuides(guides: guides, scale: scale)
        }
        .frame(width: 360, height: 230)
        .scaleEffect(scale, anchor: .topLeading)
        .frame(width: 450, height: 287.5, alignment: .topLeading)

        return world
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
    }

    func testSnapGuides() {
        for colorway in MetalColorway.allCases {
            capture("snap-guides-\(colorway.rawValue)", snapGuidesSheet(colorway))
        }
    }

    private func cueSheet(_ colorway: MetalColorway) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 24) {
                MetalDimple(isOn: .constant(false), label: "rest")
                MetalDimple(isOn: .constant(true), label: "checked")
                MetalDimple(isOn: .constant(false), doing: true, label: "doing")
                MetalDimple(isOn: .constant(false), mixed: true, label: "mixed")
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
                MetalHoverEngraving(kind: "LOG", details: ["07:40", "SLEEP 6 H", "ALSO TIRED"], status: (.live, "RECOGNIZED ✓"))
                MetalHoverEngraving(kind: "TASK", details: ["TOMORROW 16:00"], tags: ["poster"], status: (.live, "RECOGNIZED ✓"))
                MetalHoverEngraving(kind: "LUNCH? 0.71", status: (.waiting, "RECOGNIZING…"))
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
                MetalProvenanceTooltip(source: "Recognizer", detail: ["0.82"])
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
                MetalRegionView(name: "Ideas", rule: "from amber folder", hue: .amber).frame(width: 200, height: 140)
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

    /// Visual integration specimen: generated foundation values with real Region and Surface views.
    func testSpatialFieldFoundation() {
        let carried = CGRect(x: 302, y: 148, width: 118, height: 38)
        let atRest = CGRect(x: 265, y: 188, width: 118, height: 38)
        let first = CGRect(x: 22, y: 20, width: 280, height: 180)
        let target = CGRect(x: 348, y: 20, width: 280, height: 180)
        for colorway in MetalColorway.allCases {
            for state in ["rest", "carry", "target"] {
                let scene = MetalSpatialFieldScene(
                    regions: [MetalSpatialFieldRegion(id: "todo", frame: first), MetalSpatialFieldRegion(id: "done", frame: target)],
                    object: atRest, carried: state == "rest" ? nil : carried, targetID: state == "target" ? "done" : nil
                )
                let specimen = ZStack(alignment: .topLeading) {
                    MetalSpatialFieldView(scene: scene)
                    MetalRegionView(name: "To do", rule: "makes tasks").frame(width: 280, height: 180).offset(x: 22, y: 20)
                    MetalRegionView(name: "Done", rule: "marks tasks done", dropRule: "drop to mark tasks done",
                                    state: state == "target" ? .over : .rest)
                        .frame(width: 280, height: 180).offset(x: 348, y: 20)
                    MetalSurface(.raiseLite, radius: .card) {
                        Text("send the poster").font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                    }
                    .offset(x: state == "rest" ? 265 : carried.minX, y: state == "rest" ? 188 : carried.minY)
                }
                .frame(width: 660, height: 240)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
                capture("spatial-field-\(state)-\(colorway.rawValue)", specimen)
            }
        }
    }

    func testSelect() {
        for colorway in MetalColorway.allCases {
            let options = [
                MetalSelectOption("red", label: "Red"),
                MetalSelectOption("green", label: "Green"),
                MetalSelectOption("blue", label: "Blue", disabled: true),
            ]
            let view = HStack(spacing: 20) {
                MetalSelect("Colour", selection: .constant("green"), options: options)
                MetalSelect("Colour", selection: .constant(nil), options: options,
                            placeholder: "Choose colour", size: .compact, invalid: true)
                MetalSelect("Colour", selection: .constant("red"), options: options).disabled(true)
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("select-\(colorway.rawValue)", view)
            let list = MetalSelect("Colour", selection: .constant("green"), groups: [
                MetalSelectGroup("WARM", options: [options[0]]),
                MetalSelectGroup("COOL", options: Array(options.dropFirst())),
            ]).specimenList
                .padding(28)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
            capture("select-list-\(colorway.rawValue)", list)
        }
    }

    func testTabs() {
        for colorway in MetalColorway.allCases {
            let options = [MetalTab("react", title: "React"), MetalTab("swift", title: "SwiftUI")]
            let view = VStack(alignment: .leading, spacing: 20) {
                MetalTabs("Examples", selection: .constant("react"), options: options) { value in
                    Text("\(value) component example").font(.metal(MetalType.ui))
                }
                MetalTabs("Examples", selection: .constant("swift"), options: options, size: .compact) { value in
                    Text("\(value) component example").font(.metal(MetalType.ui))
                }
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("tabs-\(colorway.rawValue)", view)
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
                MetalLensBar(query: "open tasks about the poster", count: 6, source: MetalLensSource("LOCAL"), mode: .constant(.list), onPin: {}, onClose: {})
                MetalLensBar(query: "lunch this week", source: MetalLensSource("ASKING", waiting: true), mode: .constant(.place), onPin: {}, onClose: {})
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
            let view = VStack(alignment: .leading, spacing: MetalToolStripMetrics.gapAbove) {
                MetalLabel("TEXT · 1 SELECTED", style: .engraved)
                MetalToolStrip(label: "a note", items: [MetalToolStripItem("Tasks", icon: .task) {}, MetalToolStripItem("Summarise", icon: .document) {}, MetalToolStripItem("Region", icon: .region) {}, MetalToolStripItem("Gather", icon: .group) {}, MetalToolStripItem("Export", icon: .share) {}, MetalToolStripItem("Rename", icon: .text, singleOnly: true) {}, MetalToolStripItem("Send away", icon: .sendAway, destructive: true, irreversible: true) {}], count: 1, maxVisible: 5, entrance: false)
                MetalLabel("IMAGE · 1 SELECTED", style: .engraved)
                MetalToolStrip(label: "an image", items: [MetalToolStripItem("Lift subject", icon: .capture) {}, MetalToolStripItem("Copy", icon: .duplicate) {}, MetalToolStripItem("Crop", icon: .region, disabledReason: "This image is locked") {}, MetalToolStripItem("Send away", icon: .sendAway, destructive: true) {}], count: 1, entrance: false)
                MetalLabel("MIX · 3 SELECTED", style: .engraved)
                MetalToolStrip(label: "3 blocks", items: [MetalToolStripItem("Gather", icon: .group) {}, MetalToolStripItem("Export", icon: .share) {}, MetalToolStripItem("Send away", icon: .sendAway, destructive: true) {}], count: 3, entrance: false)
            }.padding(MetalRadius.card)
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

    func testMeter() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 24) {
                MetalMeter("Storage", value: 67)
                MetalMeter("Battery", value: 18, bad: .low)
                MetalMeter("Signal", value: 3, in: 0...5, segments: 5, showValue: false)
            }
            .frame(width: 420).padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("meter-\(colorway.rawValue)", view)
        }
    }

    func testStatus() {
        let kinds: [MetalLEDKind] = [.live, .waiting, .failed, .link, .off]
        let words = ["Sync live", "Sync waiting", "Sync failed", "Sync linked", "Sync off"]
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: 20) {
                HStack(spacing: 24) {
                    ForEach(Array(kinds.enumerated()), id: \.offset) { i, kind in
                        VStack(spacing: 8) {
                            MetalLED(kind, gesture: .steady)
                            Text(words[i]).font(.system(size: 14)).foregroundColor(colorway.tokens.ink2.color)
                        }
                    }
                }
                HStack(spacing: 12) {
                    ForEach(Array(kinds.enumerated()), id: \.offset) { i, kind in MetalStatusBadge(words[i], led: kind, gesture: .steady) }
                }
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("status-\(colorway.rawValue)", view)
            let surfaces = VStack(spacing: 24) {
                HStack(spacing: 12) {
                    MetalStatusBadge("Opaque · Sync live", led: .live)
                    MetalStatusBadge("Transparent · Sync live", led: .live, surface: .transparent)
                    MetalStatusBadge("Frosted · Sync live", led: .live, surface: .frosted)
                    MetalStatusBadge("Solid override · Sync live", led: .live, surface: .frosted, solid: true)
                }.padding(28).background {
                    GeometryReader { g in
                        ZStack {
                            Color(red: 24 / 255, green: 44 / 255, blue: 67 / 255)
                            Circle().fill(Color(red: 223 / 255, green: 163 / 255, blue: 69 / 255)).frame(width: 220, height: 220).offset(x: g.size.width * 0.25, y: -50)
                            Rectangle().fill(Color(red: 50 / 255, green: 110 / 255, blue: 128 / 255)).rotationEffect(.degrees(25)).offset(y: 80)
                        }.clipped()
                    }
                }
                HStack(spacing: 12) {
                    MetalStatusBadge("On frost · Sync live", led: .live)
                    MetalStatusBadge("Strong · Sync live", led: .live, tone: .strong)
                    MetalStatusBadge("Quiet · Sync live", led: .live, tone: .quiet)
                }.padding(20).metalFrost(.plate, in: RoundedRectangle(cornerRadius: 12))
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("status-surfaces-\(colorway.rawValue)", surfaces)
        }
    }

    /// Latching caps and a single form choice use the same button material and LED socket.
    func testRadioKeys() {
        for colorway in MetalColorway.allCases {
            capture("radio-keys-\(colorway.rawValue)", VStack(spacing: MetalRecipes.toggle.points("self.gap")) {
                MetalToggle("Grid", isOn: .constant(true))
                MetalRadioKeys("Appointment time", selection: .constant("10:00"), options: [
                    .init("10:00", "10:00"), .init("11:00", "11:00 · taken", disabled: true), .init("12:00", "12:00")
                ])
            }
            .padding(MetalRecipes.button.points("self.pad"))
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway))
        }
    }

    func testRowStates() {
        for colorway in MetalColorway.allCases {
            let view = VStack(spacing: MetalSpace.s8) {
                ForEach(0..<4) { state in
                    MetalRow(.panel, checked: state == 3, selected: state == 1 || state == 3, opened: state >= 2) {
                        MetalIcon(.note, size: 14)
                    } text: {
                        MetalRowText(["Rest", "Selected", "Opened", "Selected, opened and complete"][state])
                    } trail: {
                        EmptyView()
                    }
                }
            }
            .frame(width: MetalSpace.s64 * 6)
            .padding(MetalSpace.s24)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("row-states-\(colorway.rawValue)", view)
        }
    }

    func testToast() {
        for colorway in MetalColorway.allCases {
            // The deck as the web page deals it: five results, the last one twice; folded, then fanned out.
            let deck = MetalToastDeck()
            deck.show(MetalToastModel("Moved 3 blocks", undo: {}))
            deck.show(MetalToastModel("Pinned as a live region", sub: "it updates as you write", tone: .success))
            deck.show(MetalToastModel("Correction remembered", sub: "for this exact text", undo: {}))
            deck.show(MetalToastModel("Could not export", sub: "the clipboard is locked", tone: .error))
            deck.show(MetalToastModel("Ticked", sub: "wrote [x] into the text", undo: {}))
            deck.show(MetalToastModel("Ticked", sub: "wrote [x] into the text", undo: {}))
            let view = HStack(alignment: .bottom, spacing: 40) {
                MetalToastDeckView(deck)
                MetalToastDeckView(deck, expanded: true)
            }
            .padding(.horizontal, 28)
            .padding(.top, 40)
            .padding(.bottom, 28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("toast-\(colorway.rawValue)", view)
        }
    }

    func testToolbar() {
        for colorway in MetalColorway.allCases {
            let tools = { (variant: MetalToolbar<AnyView>.Variant) in
                MetalToolbar("Tools", variant: variant) {
                    AnyView(Group {
                        MetalToolButton("Select", icon: .select, latched: true) {}
                        MetalToolButton("Write", icon: .text) {}
                        MetalToolButton("Region", icon: .region) {}
                        MetalToolButton("Ink", icon: .draw) {}
                        MetalToolbarSeparator()
                        MetalToolButton("Undo", icon: .undo) {}
                    })
                }
            }
            let view = VStack(spacing: 20) { tools(.graphite); tools(.frost) }
                .padding(28)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
            capture("toolbar-\(colorway.rawValue)", view)
        }
    }
    func testCommandPalette() {
        let items: [MetalCommandPaletteItem] = [
            .init(id: "lens", label: "See “poster”", section: "LENS", icon: .search, hint: .readout("RULES")),
            .init(id: "tag", label: "#poster", section: "LENSES", icon: .tag),
            .init(id: "f1", label: "the font on the train poster was a condensed grotesk", section: "BLOCKS", icon: .document, hint: .readoutKey("8:52", "↩")),
            .init(id: "f2", label: "poster refs from the studio", section: "BLOCKS", icon: .document, hint: .readout("9:10")),
            .init(id: "undo", label: "Undo", section: "ACTIONS", icon: .undo, hint: .key("⌘Z")),
            .init(id: "clear", label: "Clear the poster board", section: "ACTIONS", icon: .trash, danger: true),
        ]
        for colorway in MetalColorway.allCases {
            let view = MetalCommandPalette(query: .constant("poster"), items: items, filter: false, status: "NATURAL LANGUAGE RECOGNITION", onRun: { _, _ in }, onClose: {})
                .environment(\.metalSnapshot, true)
                .padding(28)
                .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
                .metalColorway(colorway)
            capture("command-palette-\(colorway.rawValue)", view)
        }
    }
    func testTooltip() {
        for colorway in MetalColorway.allCases {
            let view = HStack(spacing: 40) {
                MetalToolbar("Tools", variant: .graphite) {
                    MetalToolButton("Select", icon: .select, latched: true) {}.metalTooltipChip("Select", shortcut: "V")
                    MetalToolButton("Undo", icon: .undo) {}
                }
                MetalToolbar("Tools", variant: .frost) {
                    MetalToolButton("Region", icon: .region) {}
                    MetalToolButton("Undo", icon: .undo) {}.metalTooltipChip("Undo", shortcut: "⌘Z")
                }
            }
            .padding(.horizontal, 28).padding(.top, 60).padding(.bottom, 28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("tooltip-\(colorway.rawValue)", view)
        }
    }
    func testMenu() {
        for colorway in MetalColorway.allCases {
            let view = HStack(alignment: .top, spacing: 28) {
                MetalMenuPanel(heading: "Note · task by recognizer 0.82", items: [
                    MetalMenuItem("Not a Task") {},
                    MetalMenuItem("Reset Corrections") {},
                    MetalMenuItem("Recognize Again") {},
                    .separator,
                    MetalMenuItem("Gather Similar", icon: .search) {},
                ], onClose: {})
                MetalMenuPanel(items: [
                    MetalMenuItem("Duplicate", icon: .duplicate, shortcut: "⌘D") {},
                    MetalMenuItem("Pin", icon: .pin, shortcut: "⇧P") {},
                    MetalMenuItem("Share", icon: .share, disabled: true) {},
                    .separator,
                    MetalMenuItem("Delete", icon: .trash, shortcut: "⌫", danger: true) {},
                ], onClose: {})
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("menu-\(colorway.rawValue)", view)
        }
    }
    func testButton() {
        for colorway in MetalColorway.allCases {
            let view = VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 12) {
                    MetalButton("Cancel") {}
                    MetalButton("New Canvas", cap: .primary) {}
                    MetalButton("Delete", cap: .destructive, action: {}) { MetalIcon(.trash, size: 16) }
                }
                HStack(spacing: 10) {
                    MetalButton("seed a sample day", size: .compact) {}
                    MetalButton("Open", size: .compact, action: {}) { MetalIcon(.search, size: 14) }
                    MetalButton("Keep", cap: .primary, size: .compact) {}
                }
            }
            .padding(28)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("button-\(colorway.rawValue)", view)
        }
    }

    func testDialog() {
        for colorway in MetalColorway.allCases {
            let view = MetalDialogPopup("Create canvas", popup: {
                Text("Give the canvas a name before placing your work.")
                    .font(.metal(MetalType.content))
                    .foregroundStyle(colorway.tokens.ink2.color)
            }, actions: {
                MetalButton("Cancel") {}
                MetalButton("Create", cap: .primary) {}
            })
            .padding(MetalRecipes.dialog.points("self.pad"))
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("dialog-\(colorway.rawValue)", view)
        }
    }

    func testWeather() {
        let hours: [MetalWeatherHour] = [
            .init(label: "Now", hour: 9, kind: .clear, temp: "19°", accessibilityLabel: "Now, 19°"),
            .init(label: "12", hour: 12, kind: .partly, temp: "24°", accessibilityLabel: "12, 24°"),
            .init(label: "15", hour: 15, kind: .drizzle, temp: "22°", accessibilityLabel: "15, 22°"),
            .init(label: "18", hour: 18, kind: .cloud, temp: "20°", accessibilityLabel: "18, 20°"),
            .init(label: "21", hour: 21, kind: .clear, temp: "17°", accessibilityLabel: "21, 17°"),
            .init(label: "00", hour: 0, kind: .partly, temp: "15°", accessibilityLabel: "00, 15°")
        ]
        let days: [MetalWeatherDay] = [
            .init(name: "Today", kind: .rain, low: 14, high: 24, accessibilityLabel: "Today: low 14°, high 24°"),
            .init(name: "Sun", kind: .partly, low: 15, high: 23, accessibilityLabel: "Sun: low 15°, high 23°"),
            .init(name: "Mon", kind: .clear, low: 16, high: 26, accessibilityLabel: "Mon: low 16°, high 26°"),
            .init(name: "Tue", kind: .heat, low: 17, high: 28, accessibilityLabel: "Tue: low 17°, high 28°"),
            .init(name: "Wed", kind: .cloud, low: 16, high: 25, accessibilityLabel: "Wed: low 16°, high 25°"),
            .init(name: "Thu", kind: .storm, low: 14, high: 20, accessibilityLabel: "Thu: low 14°, high 20°"),
            .init(name: "Fri", kind: .snow, low: 10, high: 15, accessibilityLabel: "Fri: low 10°, high 15°")
        ]
        let tiles: [(MetalWeatherKind, String, String, String, Double)] = [
            (.clear, "Clear", "21°", "Dry", 9), (.partly, "Partly", "20°", "Rain 10%", 13),
            (.rain, "Rain", "14°", "Rain 80%", 10), (.storm, "Thunder", "16°", "Rain 90%", 16),
            (.snow, "Snow", "-3°", "Snow 60%", 11), (.sleet, "Sleet", "1°", "Rain 70%", 8),
            (.mist, "Mist", "9°", "Vis 800 m", 7.6), (.windy, "Windy", "15°", "42 km/h", 14),
            (.clear, "Clear", "12°", "Moon", 23)
        ]
        for colorway in MetalColorway.allCases {
            let view = HStack(alignment: .top, spacing: 32) {
                MetalWeather(place: "Lisbon", summary: "Sunny now · partly cloudy from 11:00", clock: "09:00",
                             hour: 9, sky: .of(.clear), condition: "Sunny", temp: "19°",
                             readout: "Feels 18° · Rain 0% · 9 km/h", skyLabel: "Lisbon: Sunny, 19°",
                             hours: hours, days: days, now: 19, tick: 0)
                LazyVGrid(columns: Array(repeating: GridItem(.fixed(MetalRecipes.weather.points("tile.size")), spacing: 10), count: 3), spacing: 10) {
                    ForEach(tiles.indices, id: \.self) { i in
                        let tile = tiles[i]
                        MetalWeatherTile(sky: .of(tile.0), hour: tile.4, temp: tile.2, name: tile.1, meta: tile.3,
                                         tick: i * 5, accessibilityLabel: "\(tile.1), \(tile.2)")
                    }
                }
            }
            .padding(32)
            .background(colorway == .bone ? MetalShared.page.color : MetalShared.pageDark.color)
            .metalColorway(colorway)
            capture("weather-\(colorway.rawValue)", view)
        }
    }

    /// The Swift sky draws the web's weatherScene dot for dot (scripts/weather-fixtures.mjs).
    func testWeatherSkyMatchesWeb() throws {
        struct Fixture: Decodable {
            struct Cloud: Decodable { let x: Double, y: Double, size: Double, dark: Bool? }
            struct Sky: Decodable {
                let clouds: [Cloud]?, overcast: Bool?, rain: Double?, snow: Double?, thunder: Bool?
                let mist: Double?, wind: Double?, windFrom: Int?, heat: Double?, birds: Int?, moonPhase: Double?
            }
            struct Frame: Decodable {
                let kind: String, sky: Sky?, hour: Double, tick: Int, cols: Int, rows: Int, horizon: Int
                let dots: [UInt8]
            }
            let layers: [String]
            let cases: [Frame]
        }
        let file = try XCTUnwrap(Bundle.module.url(forResource: "weather", withExtension: "json", subdirectory: "Fixtures"))
        let fixture = try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: file))
        XCTAssertEqual(fixture.layers.count, MetalWeatherScene.Layer.allCases.count)
        XCTAssertEqual(fixture.cases.count, 128)
        for frame in fixture.cases {
            let sky: MetalWeatherSky
            if let own = frame.sky {
                sky = MetalWeatherSky(clouds: (own.clouds ?? []).map { .init(x: $0.x, y: $0.y, size: $0.size, dark: $0.dark ?? false) },
                                      overcast: own.overcast ?? false, rain: own.rain ?? 0, snow: own.snow ?? 0,
                                      thunder: own.thunder ?? false, mist: own.mist ?? 0, wind: own.wind ?? 0,
                                      windFrom: own.windFrom ?? 1, heat: own.heat ?? 0, birds: own.birds ?? 0,
                                      moonPhase: own.moonPhase)
            } else {
                sky = .of(try XCTUnwrap(MetalWeatherKind(rawValue: frame.kind)))
            }
            let actual = MetalWeatherScene.dots(cols: frame.cols, rows: frame.rows, horizon: frame.horizon,
                                                hour: frame.hour, sky: sky, tick: frame.tick)
            XCTAssertEqual(actual, frame.dots, "\(frame.kind) at \(frame.hour), tick \(frame.tick), \(frame.cols) × \(frame.rows)")
        }
    }
}
