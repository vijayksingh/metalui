import SwiftUI

/// The drive: how a held mechanism moves, the twin of drive.ts. Each actor has a value from 0 to 1
/// (a place along its travel), carried to a new target on the mechanism's spring with its velocity
/// kept; the ends of the travel are walls it knocks against; crossing a detent at speed ticks; actors
/// start `stagger` ms apart. It advances in fixed steps, so it lands on the web's numbers exactly.
public struct MetalDriveModel: Sendable {
    public enum Event: Sendable, Equatable {
        case detent(actor: Int, at: Double, level: Double)
        case stop(actor: Int, at: Double, level: Double, end: Int)
    }

    public let held: MetalMechanism.Held
    let k: Double, c: Double
    let detentLevel: Double, stopLevel: Double, scrapeLevel: Double
    let keepsSound: Bool
    public private(set) var x: [Double]
    public private(set) var v: [Double]
    public private(set) var target: [Double]
    private var pending: [(value: Double, at: Double)?]
    private var lastTick: [Double]
    public private(set) var t = 0.0

    public init?(_ mechanism: MetalMechanism, start: [Double]) {
        guard let held = mechanism.held else { return nil }
        self.held = held
        let spring = mechanism.spring.spring
        k = spring.stiffness; c = spring.damping
        func level(_ kind: MetalMechanism.CueKind) -> Double { mechanism.cues.first { $0.kind == kind }?.level ?? 0 }
        detentLevel = level(.detent); stopLevel = level(.stop); scrapeLevel = level(.friction)
        keepsSound = mechanism.reduced.contains("sound")
        x = start.map(Self.clamp01); v = start.map { _ in 0 }; target = x
        pending = start.map { _ in nil }; lastTick = start.map { _ in -.infinity }
    }

    static func clamp01(_ u: Double) -> Double { min(1, max(0, u)) }

    /// New targets from now: each actor starts `stagger` ms after the one before it.
    public mutating func retarget(_ values: [Double]) {
        var order = 0.0
        for (i, raw) in values.enumerated() where i < x.count {
            let value = Self.clamp01(raw), now = pending[i]?.value ?? target[i]
            guard abs(value - now) >= 1e-9 else { continue }
            pending[i] = (value, t + order * held.stagger)
            order += 1
        }
    }

    /// Jumps every actor to its target (Reduce Motion). Each one that moved ticks once, if the
    /// mechanism keeps its sound under Reduce Motion: it arrived, without the travel.
    public mutating func snap(_ values: [Double]) -> [Event] {
        var out: [Event] = []
        for (i, raw) in values.enumerated() where i < x.count {
            let value = Self.clamp01(raw)
            if abs(value - x[i]) > 1e-9, keepsSound { out.append(.detent(actor: i, at: t, level: detentLevel)) }
            x[i] = value; target[i] = value; v[i] = 0; pending[i] = nil
        }
        return out
    }

    /// Steps to `to` ms, returning what happened on the way.
    public mutating func advance(to: Double) -> [Event] {
        var out: [Event] = []
        let h = 1 / held.step, hms = 1000 / held.step
        func cell(_ u: Double) -> Int { min(held.detents - 1, Int(floor(u * Double(held.detents) + 1e-9))) }
        while t + hms <= to + 1e-9 {
            t += hms
            for i in x.indices {
                if let p = pending[i], t >= p.at { target[i] = p.value; pending[i] = nil }
                let before = x[i]
                v[i] += (-k * (x[i] - target[i]) - c * v[i]) * h
                x[i] += v[i] * h
                for end in [0, 1] where (end == 0 ? x[i] < 0 : x[i] > 1) {
                    let impact = abs(v[i])
                    x[i] = Double(end); v[i] = -v[i] * held.wall
                    if impact >= held.tickMin { out.append(.stop(actor: i, at: t, level: stopLevel * min(1, impact / held.impactFull), end: end)) }
                }
                if held.detents > 0, cell(before) != cell(x[i]), abs(v[i]) >= held.tickMin, t - lastTick[i] >= held.tickGap {
                    lastTick[i] = t
                    out.append(.detent(actor: i, at: t, level: detentLevel))
                }
            }
        }
        return out
    }

    public var settled: Bool {
        pending.allSatisfy { $0 == nil } && x.indices.allSatisfy { abs(x[$0] - target[$0]) < 1e-3 && abs(v[$0]) < 1e-2 }
    }
    /// How fast the fastest actor slides, 0 to 1 of the scrape's full speed.
    public var scrapeSpeed: Double { min(1, (v.map(abs).max() ?? 0) / held.scrapeFull) }

    /// An actor's pose at its value: between `from` and `to`.
    public func pose(_ i: Int) -> MetalMechanismPose {
        let f = held.from, g = held.to, u = x[i]
        return MetalMechanismPose(x: f.x + (g.x - f.x) * u, y: f.y + (g.y - f.y) * u, r: f.r + (g.r - f.r) * u,
                                  sx: f.sx + (g.sx - f.sx) * u, sy: f.sy + (g.sy - f.sy) * u)
    }
}

/// Runs a held mechanism for SwiftUI: set values, then read `pose(_:)` inside a
/// `TimelineView(.animation(paused: !drive.moving))` and call `tick(_:)` with its date.
/// Detents tick and ends knock through `sound`; the scrape follows the fastest actor.
@MainActor @Observable
public final class MetalDrive {
    public private(set) var model: MetalDriveModel
    public var reduced = false
    public private(set) var moving = false
    public var onEvent: ((MetalDriveModel.Event) -> Void)?
    @ObservationIgnored private var start = Date()
    @ObservationIgnored private var scrape: MetalScrape?
    @ObservationIgnored private let sound: MetalSound?
    @ObservationIgnored private let material: MetalSoundMaterial
    @ObservationIgnored private let partSize: Double
    @ObservationIgnored private let weight: Double

    /// `weight` is how heavy the gadget is (its feel's w): a heavy knock thumps.
    public init?(_ mechanism: MetalMechanism, start values: [Double], sound: MetalSound? = nil, material: MetalSoundMaterial = .clay, partSize: Double = 60, weight: Double = 0) {
        guard let model = MetalDriveModel(mechanism, start: values) else { return nil }
        self.model = model; self.sound = sound; self.material = material; self.partSize = partSize; self.weight = weight
    }

    public func set(_ values: [Double]) {
        if reduced { for e in model.snap(values) { play(e); onEvent?(e) }; return }
        if !moving { start = Date().addingTimeInterval(-model.t / 1000); moving = true }
        model.retarget(values)
    }

    /// Advances to `date` (each frame), playing what happened.
    public func tick(_ date: Date) {
        guard moving else { return }
        for e in model.advance(to: date.timeIntervalSince(start) * 1000) { play(e); onEvent?(e) }
        if model.settled {
            moving = false
            scrape?.stop(); scrape = nil
        } else {
            if scrape == nil, let sound { scrape = sound.scrape(material, level: model.scrapeLevel) }
            scrape?.set(model.scrapeSpeed)
        }
    }

    public func pose(_ i: Int) -> MetalMechanismPose { model.pose(i) }

    private func play(_ e: MetalDriveModel.Event) {
        switch e {
        case .detent(_, _, let level): sound?.strike(material, size: partSize * MetalGadgetTokens.detentSize, level: level, pitch: MetalGadgetTokens.detentPitch)
        case .stop(_, _, let level, let end): sound?.strike(material, size: partSize, weight: weight, level: level, pitch: end == 1 ? MetalGadgetTokens.stopPitch.top : MetalGadgetTokens.stopPitch.bottom)
        }
    }
}

/// A roll: drums that turn round and round (a counter), the twin of RollModel in drive.ts. Each drum's
/// position is unbounded, so counting up it only ever turns forward (9 runs on into 0).
public struct MetalRollModel: Sendable {
    public enum Event: Sendable, Equatable {
        case detent(actor: Int, at: Double, level: Double)
        case settle(actor: Int, at: Double, level: Double)
    }
    public let held: MetalMechanism.Held
    let k: Double, c: Double, detentLevel: Double, settleLevel: Double, keepsSound: Bool
    public private(set) var x: [Double]
    public private(set) var v: [Double]
    public private(set) var target: [Double]
    private var pending: [(value: Double, at: Double)?]
    private var lastTick: [Double]
    private var moving: [Bool]
    private var count: Int
    public private(set) var t = 0.0

    /// A count's digit for a drum: actors are listed highest place first, as a number is written.
    public static func digit(_ count: Int, actor: Int, actors: Int) -> Int { (max(0, count) / Int(pow(10, Double(actors - 1 - actor)))) % 10 }

    public init?(_ mechanism: MetalMechanism, actors: Int, count: Int) {
        guard let held = mechanism.held else { return nil }
        self.held = held
        let spring = mechanism.spring.spring
        k = spring.stiffness; c = spring.damping
        func level(_ kind: MetalMechanism.CueKind) -> Double { mechanism.cues.first { $0.kind == kind }?.level ?? 0 }
        detentLevel = level(.detent); settleLevel = level(.settle); keepsSound = mechanism.reduced.contains("sound")
        self.count = max(0, count)
        x = (0..<actors).map { Double(Self.digit(count, actor: $0, actors: actors)) }
        v = x.map { _ in 0 }; target = x; pending = x.map { _ in nil }; lastTick = x.map { _ in -.infinity }; moving = x.map { _ in false }
    }

    public mutating func retarget(_ next: Int) {
        let n = x.count, up = next >= count
        count = max(0, next)
        var delay = 0.0
        for i in stride(from: n - 1, through: 0, by: -1) {
            let from = pending[i]?.value ?? target[i], d = Double(Self.digit(count, actor: i, actors: n))
            let now = (from.truncatingRemainder(dividingBy: 10) + 10).truncatingRemainder(dividingBy: 10)
            let step = up ? (d - now + 10).truncatingRemainder(dividingBy: 10) : -((now - d + 10).truncatingRemainder(dividingBy: 10))
            guard step != 0 else { continue }
            pending[i] = (from + step, t + delay)
            delay += held.stagger
        }
    }

    public mutating func snap(_ next: Int) -> [Event] {
        var out: [Event] = []
        let n = x.count
        count = max(0, next)
        for i in 0..<n {
            let d = Double(Self.digit(count, actor: i, actors: n))
            if keepsSound, (x[i].truncatingRemainder(dividingBy: 10) + 10).truncatingRemainder(dividingBy: 10) != d { out.append(.detent(actor: i, at: t, level: detentLevel)) }
            x[i] = d; target[i] = d; v[i] = 0; pending[i] = nil; moving[i] = false
        }
        return out
    }

    public mutating func advance(to: Double) -> [Event] {
        var out: [Event] = []
        let h = 1 / held.step, hms = 1000 / held.step
        while t + hms <= to + 1e-9 {
            t += hms
            for i in x.indices {
                if let p = pending[i], t >= p.at { target[i] = p.value; pending[i] = nil; moving[i] = true }
                let before = x[i]
                v[i] += (-k * (x[i] - target[i]) - c * v[i]) * h
                x[i] += v[i] * h
                if floor(before + 0.5) != floor(x[i] + 0.5), abs(v[i]) >= held.tickMin, t - lastTick[i] >= held.tickGap {
                    lastTick[i] = t
                    out.append(.detent(actor: i, at: t, level: detentLevel))
                }
                if moving[i], pending[i] == nil, abs(x[i] - target[i]) < held.rest, abs(v[i]) < held.tickMin {
                    moving[i] = false
                    out.append(.settle(actor: i, at: t, level: settleLevel))
                }
            }
        }
        return out
    }

    public var settled: Bool { pending.allSatisfy { $0 == nil } && moving.allSatisfy { !$0 } && v.allSatisfy { abs($0) < 1e-2 } }
}

/// Runs a roll for SwiftUI: set a count, read `value(_:)` inside a TimelineView and `tick(_:)` each frame.
@MainActor @Observable
public final class MetalRoll {
    public private(set) var model: MetalRollModel
    public var reduced = false
    public private(set) var moving = false
    @ObservationIgnored private var start = Date()
    @ObservationIgnored private let sound: MetalSound?
    @ObservationIgnored private let material: MetalSoundMaterial
    @ObservationIgnored private let partSize: Double

    public init?(_ mechanism: MetalMechanism, actors: Int, count: Int, sound: MetalSound? = nil, material: MetalSoundMaterial = .ceramic,
                 partSize: Double = MetalGadgetTokens.partSizes["drum"]?.1 ?? 88) {
        guard let model = MetalRollModel(mechanism, actors: actors, count: count) else { return nil }
        self.model = model; self.sound = sound; self.material = material; self.partSize = partSize
    }

    public func set(_ count: Int) {
        if reduced { for e in model.snap(count) { play(e) }; return }
        if !moving { start = Date().addingTimeInterval(-model.t / 1000); moving = true }
        model.retarget(count)
    }

    public func tick(_ date: Date) {
        guard moving else { return }
        for e in model.advance(to: date.timeIntervalSince(start) * 1000) { play(e) }
        if model.settled { moving = false }
    }

    /// A drum's digit in the window now (0 to 10, wrapping).
    public func value(_ i: Int) -> Double { (model.x[i].truncatingRemainder(dividingBy: 10) + 10).truncatingRemainder(dividingBy: 10) }

    private func play(_ e: MetalRollModel.Event) {
        switch e {
        case .detent(_, _, let level): sound?.strike(material, size: partSize * MetalGadgetTokens.detentSize, level: level, pitch: MetalGadgetTokens.detentPitch)
        case .settle(_, _, let level): sound?.strike(material, size: partSize, level: level)
        }
    }
}
