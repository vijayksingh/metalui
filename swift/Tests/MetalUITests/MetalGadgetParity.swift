import Foundation
import XCTest
@testable import MetalUI

/// Parity gate: SwiftUI resolves the worked placements (fixtures/placements.json) to the same material,
/// hue station, band, beeper key and colours the web resolver wrote to placements.resolved.json.
final class MetalGadgetParity: XCTestCase {
    private let fixtures = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("packages/metalui/src/gadgets/fixtures")

    private func json(_ name: String) throws -> [String: Any] {
        try JSONSerialization.jsonObject(with: Data(contentsOf: fixtures.appendingPathComponent(name))) as! [String: Any]
    }

    func testWorkedPlacementsResolveLikeTheWeb() throws {
        let placements = try json("placements.json"), expected = try json("placements.resolved.json")
        var members: [(name: String, resolved: MetalGadgetResolved)] = []
        for (name, raw) in placements where !name.hasPrefix("$") {
            let p = raw as! [String: Any], f = p["feel"] as! [String: Double]
            let placement = MetalGadgetPlacement(
                job: MetalGadgetJob(rawValue: p["job"] as! String)!, feel: MetalGadgetFeel(v: f["v"]!, a: f["a"]!, w: f["w"]!),
                station: p["station"] as? Double, material: (p["material"] as? String).flatMap(MetalSoundMaterial.init(rawValue:)))
            let r = MetalGadgetModel.resolve(placement), e = expected[name] as! [String: Any]
            members.append((name, r))
            XCTAssertEqual(r.material.rawValue, e["material"] as? String, "\(name) material")
            XCTAssertEqual(r.station, e["station"] as? Double, "\(name) station")
            XCTAssertEqual(r.band, e["band"] as? Int, "\(name) band")
            XCTAssertEqual(r.register, e["register"] as? Int, "\(name) register")
            XCTAssertEqual(r.scale, e["scale"] as? String, "\(name) scale")
            XCTAssertEqual(r.container, e["container"] as? String, "\(name) container")
            XCTAssertEqual(r.reach.rawValue, e["reach"] as? String, "\(name) reach")
            for (key, value) in [("body", r.body), ("accent", r.accent), ("face", r.face)] {
                let ex = e[key] as! [String: Any]
                XCTAssertEqual(value.L, ex["L"] as! Double, accuracy: 1e-3, "\(name) \(key) L")
                XCTAssertEqual(value.C, ex["C"] as! Double, accuracy: 1e-3, "\(name) \(key) C")
                XCTAssertEqual(value.H, ex["H"] as! Double, accuracy: 1e-2, "\(name) \(key) H")
                XCTAssertEqual(MetalColorMath.srgbHex(value), ex["srgb"] as? String, "\(name) \(key) sRGB")
            }
        }
        // The same set problems the web page lists for these eleven side by side.
        XCTAssertFalse(MetalGadgetModel.checkSet(members.sorted { $0.name < $1.name }).isEmpty)
    }
}
