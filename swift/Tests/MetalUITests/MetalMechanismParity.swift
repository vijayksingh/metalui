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
}
