import XCTest
@testable import MetalUI

/// The scrape as a caller meets it: off until sound is on, and safe to drive either way.
final class MetalSoundScrape: XCTestCase {
    func testAScrapeIsSilentAndSafeUntilSoundIsOn() {
        let sound = MetalSound()
        let s = sound.scrape(.stone, reach: .own)
        XCTAssertFalse(s.playing)
        s.set(1); s.set(0.4); s.stop(); s.set(1)          // driving a silent scrape does nothing, and never traps
        XCTAssertFalse(s.playing)
    }

    func testEveryMaterialSlidesInItsOwnBand() {
        let bands = MetalSoundMaterial.allCases.map(\.scrape.f)
        XCTAssertEqual(Set(bands).count, bands.count)                     // no two materials scrape alike
        XCTAssertGreaterThan(MetalSoundMaterial.stone.scrape.grit, MetalSoundMaterial.ceramic.scrape.grit)   // stone is rough, ceramic smooth
    }
}
