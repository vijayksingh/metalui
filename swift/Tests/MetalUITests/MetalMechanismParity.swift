import Foundation
import XCTest
@testable import MetalUI

/// Parity gate: SwiftUI samples every mechanism's tracks to the same poses as the web player
/// (fixtures/mechanism-samples.json, every 20 ms) and schedules the same cues at the same times.
@MainActor
final class MetalMechanismParity: XCTestCase {
    private let fixtures = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("packages/metalui/src/gadgets/fixtures")

    func testTracksSampleLikeTheWeb() throws {
        let samples = try JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("mechanism-samples.json"))) as! [String: [String: [[Any]]]]
        for mechanism in MetalMechanism.all where mechanism.momentary {
            let web = try XCTUnwrap(samples[mechanism.name], "\(mechanism.name) has no web samples")
            for (part, rows) in web {
                for row in rows {
                    let at = row[0] as! Double, s = mechanism.sample(part, at: at)
                    let expected = [row[1], row[2], row[3], row[4], row[5]].map { $0 as! Double }
                    let got = [s.pose.x, s.pose.y, s.pose.r, s.pose.sx, s.pose.sy]
                    for (g, e) in zip(got, expected) { XCTAssertEqual(g, e, accuracy: 1e-3, "\(mechanism.name)/\(part) at \(at) ms") }
                    if let o = row[6] as? Double { XCTAssertEqual(s.opacity ?? -1, o, accuracy: 1e-3, "\(mechanism.name)/\(part) opacity at \(at) ms") }
                }
            }
        }
    }

    func testSeatSchedulesItsCuesWhereThePlugLands() {
        let player = MetalMechanismPlayer(.seat)
        let times = player.schedule().filter { !$0.skipped }.map { "\($0.cue.kind.rawValue)@\(Int($0.at))" }
        XCTAssertEqual(times, ["strike@120", "strike@517", "lamp@517", "beep@537"])
        player.reduced = true
        XCTAssertEqual(player.schedule().filter { !$0.skipped }.map { "\($0.cue.kind.rawValue)@\(Int($0.at))" }, ["strike@0", "strike@0", "lamp@0", "beep@0"])
        XCTAssertTrue(player.act())
        player.reduced = false
        XCTAssertTrue(player.act())          // reduced acts have no travel, so the next act is not blocked
        XCTAssertFalse(player.act())         // a second act while one plays is ignored
    }

    func testBeeperFlexesLikeTheWeb() throws {
        let web = try JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("beeper-envelopes.json"))) as! [String: [[Double]]]
        for earcon in MetalEarcon.allCases {
            let rows = try XCTUnwrap(web[earcon.rawValue], "\(earcon) has no web envelope"), got = MetalBeeperEnvelope.samples(earcon)
            XCTAssertEqual(got.count, rows.count, "\(earcon) sample count")
            for (g, r) in zip(got, rows) {
                XCTAssertEqual(g.at, r[0], accuracy: 1e-6, "\(earcon) at")
                XCTAssertEqual(g.v, r[1], accuracy: 1e-3, "\(earcon) at \(r[0]) ms")
            }
        }
    }

    func testGadgetSpecsReadLikeTheWeb() throws {
        for name in ["patch-bay", "counter-drum", "needle-gauge", "fader-bank", "keycap-chord", "scope"] {
            let spec = try MetalGadgetSpec.decode(Data(contentsOf: fixtures.appendingPathComponent("\(name).gadget.json")))
            XCTAssertEqual(spec.name, name)
        }
        let bay = try MetalGadgetSpec.decode(Data(contentsOf: fixtures.appendingPathComponent("patch-bay.gadget.json")))
        XCTAssertEqual(bay.description("failed"), "Sync: failed, check your connection")
        XCTAssertEqual(bay.description("done"), "Sync: done")
        XCTAssertEqual(bay.state("nonsense"), bay.state(nil))
        // A held gadget's places for a mix, by the same rule as draw.ts.
        let bank = try MetalGadgetSpec.decode(Data(contentsOf: fixtures.appendingPathComponent("fader-bank.gadget.json")))
        XCTAssertEqual(bank.driveDefault, 0.5)
        XCTAssertEqual(bank.driveTargets(0.5), [0.3, 0.72, 0.5])
        let up = bank.driveTargets(1)
        XCTAssertEqual(up[0], 0.8, accuracy: 1e-12); XCTAssertEqual(up[1], 1); XCTAssertEqual(up[2], 1)
        // A plug springing home lands when the part spring first reaches home, as the web sees it (~212 ms).
        XCTAssertEqual(MetalGadget.firstHome(MetalSprings.part), 0.217, accuracy: 0.005)
    }

    func testTheDriveMovesLikeTheWeb() throws {
        let scenes = try JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("drive-samples.json"))) as! [String: [String: Any]]
        XCTAssertEqual(scenes.count, 2)
        for (name, scene) in scenes {
            let start = scene["start"] as! [Double], steps = scene["steps"] as! [[Any]]
            var model = try XCTUnwrap(MetalDriveModel(.slide, start: start))
            var next = 0, events: [MetalDriveModel.Event] = []
            for row in scene["samples"] as! [[Double]] {
                let t = row[0]
                while next < steps.count, (steps[next][0] as! Double) <= t {
                    _ = model.advance(to: steps[next][0] as! Double); model.retarget(steps[next][1] as! [Double]); next += 1
                }
                events += model.advance(to: t)
                for (i, x) in model.x.enumerated() { XCTAssertEqual(x, row[i + 1], accuracy: 1e-7, "\(name): cap \(i) at \(t) ms") }
            }
            let web = (scene["events"] as! [[Any]]).map { e -> MetalDriveModel.Event in
                let actor = e[1] as! Int, at = e[2] as! Double, level = e[3] as! Double
                return (e[0] as! String) == "stop" ? .stop(actor: actor, at: at, level: level, end: e[4] as! Int) : .detent(actor: actor, at: at, level: level)
            }
            XCTAssertEqual(events.count, web.count, "\(name): the same ticks and knocks")
            for (a, b) in zip(events, web) {
                switch (a, b) {
                case let (.detent(i, t, l), .detent(j, u, m)): XCTAssertEqual(i, j); XCTAssertEqual(t, u, accuracy: 1e-5); XCTAssertEqual(l, m, accuracy: 1e-5)
                case let (.stop(i, t, l, e), .stop(j, u, m, f)): XCTAssertEqual(i, j); XCTAssertEqual(e, f); XCTAssertEqual(t, u, accuracy: 1e-5); XCTAssertEqual(l, m, accuracy: 1e-5)
                default: XCTFail("\(name): \(a) where the web has \(b)")
                }
            }
        }
    }

    func testTheRollTurnsLikeTheWeb() throws {
        let scenes = try JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("roll-samples.json"))) as! [String: [String: Any]]
        XCTAssertEqual(scenes.count, 4)
        for (name, scene) in scenes {
            let steps = scene["steps"] as! [[Double]]
            var model = try XCTUnwrap(MetalRollModel(.roll, actors: scene["actors"] as! Int, count: scene["start"] as! Int))
            var next = 0, events: [MetalRollModel.Event] = []
            for row in scene["samples"] as! [[Double]] {
                let t = row[0]
                while next < steps.count, steps[next][0] <= t { _ = model.advance(to: steps[next][0]); model.retarget(Int(steps[next][1])); next += 1 }
                events += model.advance(to: t)
                for (i, x) in model.x.enumerated() { XCTAssertEqual(x, row[i + 1], accuracy: 1e-7, "\(name): drum \(i) at \(t) ms") }
            }
            let web = (scene["events"] as! [[Any]]).map { e -> MetalRollModel.Event in
                let actor = e[1] as! Int, at = e[2] as! Double, level = e[3] as! Double
                return (e[0] as! String) == "settle" ? .settle(actor: actor, at: at, level: level) : .detent(actor: actor, at: at, level: level)
            }
            XCTAssertEqual(events.count, web.count, "\(name): the same ticks and knocks")
            for (a, b) in zip(events, web) {
                switch (a, b) {
                case let (.detent(i, t, _), .detent(j, u, _)), let (.settle(i, t, _), .settle(j, u, _)): XCTAssertEqual(i, j); XCTAssertEqual(t, u, accuracy: 1e-5)
                default: XCTFail("\(name): \(a) where the web has \(b)")
                }
            }
        }
    }

    func testTheRigLaysOutAndCarriesLikeTheWeb() throws {
        let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent("rig-samples.json"))) as! [String: Any]
        let catalog = try ["needle-gauge", "counter-drum"].reduce(into: [String: MetalGadgetSpec]()) { $0[$1] = try MetalGadgetSpec.decode(Data(contentsOf: fixtures.appendingPathComponent("\($1).gadget.json"))) }
        var rig = MetalRigEngine(try MetalRigSpec.decode(Data(contentsOf: fixtures.appendingPathComponent("reading.rig.json"))), catalog: catalog)
        let layout = fixture["layout"] as! [String: Any]
        XCTAssertEqual(rig.width, layout["width"] as! Double); XCTAssertEqual(rig.height, layout["height"] as! Double)
        XCTAssertEqual(rig.modules.map { [$0.inst, "\(Int($0.at.x))", "\(Int($0.at.y))"] }, (layout["modules"] as! [[Any]]).map { ["\($0[0])", "\($0[1])", "\($0[2])"] })
        XCTAssertEqual(rig.jacks.map { "\($0.inst).\($0.port)/\($0.out ? "out" : "in")@\(Int($0.at.x)),\(Int($0.at.y))" }, (layout["jacks"] as! [[Any]]).map { "\($0[0]).\($0[1])/\($0[2])@\($0[3]),\($0[4])" })
        for (cord, web) in zip(rig.cords, layout["cables"] as! [[Any]]) { XCTAssertEqual(cord.length, web[6] as! Double, accuracy: 1e-6) }
        for step in fixture["script"] as! [[String: Any]] {
            let set = step["set"] as! [Any]
            let hops = rig.set(set[0] as! String, set[1] as! String, .number(set[2] as! Double))
            let web = step["hops"] as! [[Any]]
            XCTAssertEqual(hops.count, web.count, "\(set)")
            for (h, w) in zip(hops, web) { XCTAssertEqual(h.cable, w[0] as! Int); XCTAssertEqual(h.to, w[2] as! String); XCTAssertEqual(h.value, .number(w[3] as! Double)); XCTAssertEqual(h.hop, w[4] as! Int) }
            XCTAssertEqual(rig.inputs["streak"]?["count"], .number(step["streak"] as! Double))
        }
    }
}
