import Foundation

// The feel model in SwiftUI: a gadget's job and feel resolve to its material, body colour, accent,
// beeper key and lightness band, with the same rules and numbers as resolve.ts (the generated tables
// in MetalGadgetFeel.generated.swift). placements.resolved.json is the shared answer both must give.

public enum MetalGadgetAxis: Sendable { case v, a, w }

/// What a gadget should make a person feel, each 0–1: valence, arousal, weight.
public struct MetalGadgetFeel: Sendable, Hashable, Codable {
    public var v: Double, a: Double, w: Double
    public init(v: Double, a: Double, w: Double) { self.v = v; self.a = a; self.w = w }
    subscript(axis: MetalGadgetAxis) -> Double { switch axis { case .v: return v; case .a: return a; case .w: return w } }
}

/// The part of a spec the model reads.
public struct MetalGadgetPlacement: Sendable {
    public var job: MetalGadgetJob
    public var feel: MetalGadgetFeel
    public var station: Double?
    public var material: MetalSoundMaterial?
    public var container: String?
    public var reach: MetalSoundReach?
    public init(job: MetalGadgetJob, feel: MetalGadgetFeel, station: Double? = nil, material: MetalSoundMaterial? = nil,
                container: String? = nil, reach: MetalSoundReach? = nil) {
        self.job = job; self.feel = feel; self.station = station; self.material = material; self.container = container; self.reach = reach
    }
}

public struct MetalOklch: Sendable, Hashable {
    public var L: Double, C: Double, H: Double
}

public struct MetalGadgetResolved: Sendable {
    public let job: MetalGadgetJob
    public let feel: MetalGadgetFeel
    public let material: MetalSoundMaterial
    /// "pin", "job" or the rule that matched.
    public let materialBy: String
    public let station: Double
    public let container: String
    public let reach: MetalSoundReach
    public let body: MetalOklch
    public let accent: MetalOklch
    public let register: Int
    public let scale: String
    public let band: Int
}

public enum MetalGadgetModel {
    private static func clamp(_ x: Double, _ lo: Double, _ hi: Double) -> Double { min(hi, max(lo, x)) }
    private static func wrap(_ h: Double) -> Double { (h.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) }

    public static func material(for p: MetalGadgetPlacement) -> (MetalSoundMaterial, String) {
        if let m = p.material { return (m, "pin") }
        if let m = p.job.pin { return (m, "job") }
        for r in MetalGadgetFeelTokens.materialRules where r.terms.allSatisfy({ axis, atLeast, t in atLeast ? p.feel[axis] >= t : p.feel[axis] <= t }) {
            return (r.material, r.rule)
        }
        return (.clay, "*")
    }

    public static func bodyColor(job: MetalGadgetJob, feel f: MetalGadgetFeel, material: MetalSoundMaterial, station: Double) -> MetalOklch {
        let fin = material.finish, t = MetalGadgetFeelTokens.self
        let L = clamp(t.lightness.base + t.lightness.weight * f.w + t.lightness.valence * (f.v - 0.5), fin.lightness.0, fin.lightness.1)
        var C = clamp(t.chroma.base + t.chroma.arousal * f.a * (t.chroma.mix.0 + t.chroma.mix.1 * f.v), 0, fin.chromaCap)
        if let cap = job.bodyChromaMax { C = min(C, cap) }
        return MetalOklch(L: L, C: C, H: wrap(station + t.hue.valence * (f.v - 0.5) + t.hue.weight * f.w))
    }

    /// House orange, or sky when the body sits near orange and is colourful enough to clash.
    public static func accent(bodyHue: Double, bodyChroma: Double = .infinity) -> MetalOklch {
        let t = MetalGadgetFeelTokens.self
        let d = abs((bodyHue - t.accentWarm.H + 540).truncatingRemainder(dividingBy: 360) - 180)
        let a = bodyChroma >= t.accentFlipMinChroma && d <= t.accentFlipWithin ? t.accentCool : t.accentWarm
        return MetalOklch(L: a.L, C: max(a.C, t.accentMinChroma), H: a.H)
    }

    public static func resolve(_ p: MetalGadgetPlacement) -> MetalGadgetResolved {
        let (m, by) = material(for: p)
        let station = p.station ?? p.job.stations[0]
        let b = bodyColor(job: p.job, feel: p.feel, material: m, station: station)
        let t = MetalGadgetFeelTokens.self
        let register = p.feel.w <= t.registerThresholds.0 ? t.registerMidi.0 : p.feel.w <= t.registerThresholds.1 ? t.registerMidi.1 : t.registerMidi.2
        let band = b.L >= t.setBands.0 ? 0 : b.L >= t.setBands.1 ? 1 : 2
        return MetalGadgetResolved(job: p.job, feel: p.feel, material: m, materialBy: by, station: station,
                                   container: p.container ?? p.job.containers[0], reach: p.reach ?? p.job.reach,
                                   body: b, accent: accent(bodyHue: b.H, bodyChroma: b.C), register: register,
                                   scale: p.feel.v >= 0.5 ? "major" : "minor", band: band)
    }

    // MARK: Set rules

    public struct SetProblem: Sendable { public let code: String; public let members: [String]; public let message: String }

    /// Gadgets side by side must not repeat themselves (the same rules as checkSet in resolve.ts).
    public static func checkSet(_ members: [(name: String, resolved: MetalGadgetResolved)]) -> [SetProblem] {
        let t = MetalGadgetFeelTokens.self
        var out: [SetProblem] = []
        for i in members.indices { for j in members.indices where j > i {
            let (a, b) = (members[i], members[j]), (ra, rb) = (a.resolved, b.resolved), pair = [a.name, b.name]
            let gap = abs((ra.station - rb.station + 540).truncatingRemainder(dividingBy: 360) - 180)
            let colourful = ra.body.C >= t.setHueMinChroma && rb.body.C >= t.setHueMinChroma      // a grey's hue is not seen
            if colourful, gap < t.setHueGap { out.append(.init(code: "set.hue", members: pair, message: "\(a.name) and \(b.name) sit \(Int(gap))° apart.")) }
            if ra.material == rb.material, ra.band == rb.band { out.append(.init(code: "set.band", members: pair, message: "\(a.name) and \(b.name) share a material and lightness band.")) }
            if MetalColorMath.deltaE(ra.body, rb.body) < t.setDeltaE { out.append(.init(code: "set.deltaE", members: pair, message: "\(a.name) and \(b.name) are too close in colour.")) }
            let cvd = [MetalColorMath.Deficiency.deuteranopia, .protanopia].map { MetalColorMath.deltaE(MetalColorMath.simulate(ra.body, $0), MetalColorMath.simulate(rb.body, $0)) }.min() ?? 1
            if cvd < t.setCvdDeltaE { out.append(.init(code: "set.cvd", members: pair, message: "\(a.name) and \(b.name) look alike to red–green colour blindness.")) }
        } }
        var run = 0
        for m in members {
            run = m.resolved.container == "slab" ? run + 1 : 0
            if run > t.setSlabRun { out.append(.init(code: "set.container", members: [m.name], message: "More than \(t.setSlabRun) slab gadgets in a row.")); run = 0 }
        }
        return out
    }
}

/// OKLCH ↔ sRGB, ΔE and colour-vision simulation (color.ts).
public enum MetalColorMath {
    public enum Deficiency: Sendable { case deuteranopia, protanopia }

    static func linearSrgb(_ c: MetalOklch) -> (Double, Double, Double) {
        let h = c.H * .pi / 180, a = c.C * cos(h), b = c.C * sin(h)
        let l = pow(c.L + 0.3963377774 * a + 0.2158037573 * b, 3)
        let m = pow(c.L - 0.1055613458 * a - 0.0638541728 * b, 3)
        let s = pow(c.L - 0.0894841775 * a - 1.291485548 * b, 3)
        return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
    }

    static func inside(_ v: (Double, Double, Double)) -> Bool { [v.0, v.1, v.2].allSatisfy { $0 >= -1e-5 && $0 <= 1 + 1e-5 } }

    /// The largest chroma ≤ C that sRGB holds at this lightness and hue.
    static func fitSrgb(_ c: MetalOklch) -> MetalOklch {
        let L = min(1, max(0, c.L)), H = (c.H.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)
        var col = MetalOklch(L: L, C: max(0, c.C), H: H)
        if inside(linearSrgb(col)) { return col }
        var lo = 0.0, hi = col.C
        for _ in 0..<12 { let mid = (lo + hi) / 2; if inside(linearSrgb(MetalOklch(L: L, C: mid, H: H))) { lo = mid } else { hi = mid } }
        col.C = lo
        return col
    }

    /// "#rrggbb", as pigment().srgb gives it on the web.
    public static func srgbHex(_ c: MetalOklch) -> String {
        let v = linearSrgb(fitSrgb(c))
        func g(_ x: Double) -> Int { let x = min(1, max(0, x)); return Int(((x <= 0.0031308 ? 12.92 * x : 1.055 * pow(x, 1 / 2.4) - 0.055) * 255).rounded()) }
        return String(format: "#%02x%02x%02x", g(v.0), g(v.1), g(v.2))
    }

    public static func deltaE(_ a: MetalOklch, _ b: MetalOklch) -> Double {
        func lab(_ c: MetalOklch) -> (Double, Double, Double) { (c.L, c.C * cos(c.H * .pi / 180), c.C * sin(c.H * .pi / 180)) }
        let (x, y) = (lab(a), lab(b))
        return sqrt(pow(x.0 - y.0, 2) + pow(x.1 - y.1, 2) + pow(x.2 - y.2, 2))
    }

    /// Machado, Oliveira & Fernandes 2009, severity 1.
    public static func simulate(_ c: MetalOklch, _ kind: Deficiency) -> MetalOklch {
        let m: [[Double]] = kind == .deuteranopia
            ? [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]]
            : [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]
        let lin = linearSrgb(fitSrgb(c)), v = [lin.0, lin.1, lin.2].map { min(1, max(0, $0)) }
        let s = m.map { row in min(1, max(0, row[0] * v[0] + row[1] * v[1] + row[2] * v[2])) }
        let l = cbrt(0.4122214708 * s[0] + 0.5363325363 * s[1] + 0.0514459929 * s[2])
        let mm = cbrt(0.2119034982 * s[0] + 0.6806995451 * s[1] + 0.1073969566 * s[2])
        let ss = cbrt(0.0883024619 * s[0] + 0.2817188376 * s[1] + 0.6299787005 * s[2])
        let L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * ss
        let A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * ss
        let B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * ss
        return MetalOklch(L: L, C: hypot(A, B), H: (atan2(B, A) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360))
    }
}
