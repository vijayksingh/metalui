import AVFoundation
import Foundation
import os

// The sound foundation for SwiftUI: plays the material and beeper recipes from
// tokens.json (MetalSound.generated.swift) on AVAudioEngine, with the same modal
// synthesis as the web engine: a strike is the material's modes plus its contact
// noise; a beep is a piezo. Off until a person opts in.

// MARK: - Recipe types (filled by MetalSound.generated.swift)

public struct MetalSoundMode: Sendable {
    public let ratio: Double
    public let gain: Double
    public let decayMs: Double
    public let glideTo: Double?
    public let glideMs: Double?
}

public struct MetalSoundNoise: Sendable {
    public enum Kind: Sendable { case bandpass, lowpass, highpass }
    public let kind: Kind
    public let frequency: Double
    public let q: Double?
    public let ms: Double
    public let gain: Double
}

public struct MetalSoundGrit: Sendable {
    public let count: Int
    public let spreadMs: Double
    public let frequency: Double
    public let level: Double
}

public struct MetalSoundBounce: Sendable {
    public let ms: Double
    public let level: Double
}

public struct MetalMaterialSound: Sendable {
    public let f0x: Double
    public let tone: Double
    public let loud: Double
    public let attackMs: Double
    public let maxMs: Double
    public let noisyModes: Bool
    public let thump: Bool
    public let modes: [MetalSoundMode]
    public let noise: [MetalSoundNoise]
    public let grit: MetalSoundGrit?
    public let bounce: MetalSoundBounce?
}

public struct MetalEarconNote: Sendable {
    public let midi: Int
    public let atMs: Double
    public let lengthMs: Double
    public let level: Double
}

// MARK: - The engine

/// Plays Soft Hardware sounds. Off by default: call `enable()` once the person opts in.
///
///     MetalSound.shared.strike(.clay, size: 72, weight: 0.3)   // a cap pressed into a panel
///     MetalSound.shared.beep(.done)                            // a change of state
public final class MetalSound: @unchecked Sendable {
    public static let shared = MetalSound()

    /// `.acts`: acts and changes of state make sound. `.states`: only changes of state.
    public enum Plays: String, CaseIterable, Sendable { case acts, states }

    public private(set) var isOn = false
    public var plays: Plays = .acts
    public var materials: Set<MetalSoundMaterial> = Set(MetalSoundMaterial.allCases)

    private var engine: AVAudioEngine?
    private let synth = Synth()
    private var playTimes: [String: [Date]] = [:]
    private var playCounts: [String: Int] = [:]

    public init() {}

    /// Starts the audio engine and turns sound on.
    public func enable() throws {
        if engine == nil { try boot() }
        try engine?.start()
        isOn = true
    }

    public func disable() {
        isOn = false
        engine?.pause()
    }

    /// The fundamental a part would ring at: bigger and heavier ring lower.
    public func fundamental(_ material: MetalSoundMaterial, size: Double = MetalSoundTokens.bodySize, weight: Double = 0) -> Double {
        MetalSoundTokens.pitchBase * (MetalSoundTokens.pitchRef / size).squareRoot()
            * (1 - MetalSoundTokens.pitchHeavy * weight) * material.recipe.f0x
    }

    /// Strikes a part of a material. `size` is the part's longest side in the 400-unit drawing
    /// (the body is 320); `rendered` is the drawn size in points. Returns whether it played.
    @discardableResult
    public func strike(_ material: MetalSoundMaterial, size: Double = MetalSoundTokens.bodySize, weight: Double = 0,
                       reach: MetalSoundReach = .own, level: Double = 1, delay: Double = 0,
                       rendered: Double = 160, key: String? = nil) -> Bool {
        guard isOn, plays == .acts, materials.contains(material), engine != nil else { return false }
        let gate = key.map(allow) ?? 1
        guard gate > 0 else { return false }
        let recipe = material.recipe
        let peak = db(MetalSoundTokens.actDb) * level * recipe.loud * sizeGain(rendered) * gate
        let f0 = vary(fundamental(material, size: size, weight: weight), MetalSoundTokens.varyF0)
        var voices: [Voice] = []
        render(recipe, f0: f0, peak: peak, at: delay, size: size, reach: reach, into: &voices, echo: false)
        if weight > MetalSoundTokens.thumpAbove, recipe.thump {
            voices.append(.tone(Tone(
                frequency: MetalSoundTokens.thumpFrom, glideTo: MetalSoundTokens.thumpTo / MetalSoundTokens.thumpFrom,
                glideSeconds: MetalSoundTokens.thumpMs / 1000, peak: db(MetalSoundTokens.actDb) * level * MetalSoundTokens.thumpLevel * weight,
                attack: 0.003, decay: (MetalSoundTokens.thumpMs + 10) / 1000, delay: delay, reach: .own)))
        }
        synth.add(voices)
        return true
    }

    /// Plays a change of state on the beeper. Returns whether it played.
    @discardableResult
    public func beep(_ earcon: MetalEarcon, rendered: Double = 160, key: String? = nil) -> Bool {
        guard isOn, engine != nil else { return false }
        let gate = key.map(allow) ?? 1
        guard gate > 0 else { return false }
        let peak = db(earcon.levelDb) * sizeGain(rendered) * gate
        synth.add(earcon.notes.map { note in
            .beep(Beep(frequency: 440 * pow(2, Double(note.midi - 69) / 12), peak: peak * note.level,
                       length: note.lengthMs / 1000, delay: note.atMs / 1000))
        })
        return true
    }

    // MARK: Private

    private func boot() throws {
        #if os(iOS)
        // Ambient: mixes with other audio and respects the silent switch, as interface sounds should.
        try AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
        #endif
        let engine = AVAudioEngine()
        let rate = engine.outputNode.outputFormat(forBus: 0).sampleRate
        let format = AVAudioFormat(standardFormatWithSampleRate: rate > 0 ? rate : 48_000, channels: 2)!
        synth.prepare(sampleRate: format.sampleRate)
        let source = AVAudioSourceNode(format: format) { [synth] _, _, frames, list -> OSStatus in
            let buffers = UnsafeMutableAudioBufferListPointer(list)
            guard buffers.count >= 2,
                  let left = buffers[0].mData?.assumingMemoryBound(to: Float.self),
                  let right = buffers[1].mData?.assumingMemoryBound(to: Float.self) else { return noErr }
            synth.render(left: left, right: right, frames: Int(frames))
            return noErr
        }
        engine.attach(source)
        engine.connect(source, to: engine.mainMixerNode, format: format)
        self.engine = engine
    }

    private func render(_ m: MetalMaterialSound, f0: Double, peak: Double, at delay: Double, size: Double,
                        reach: MetalSoundReach, into voices: inout [Voice], echo: Bool) {
        let damp = (size / MetalSoundTokens.bodySize).squareRoot()
        let attack = m.attackMs / 1000
        for mode in m.modes {
            let f = f0 * mode.ratio
            guard f <= MetalSoundTokens.ceilingHz else { continue }
            let t = min(m.maxMs / 1000, vary(mode.decayMs, MetalSoundTokens.varyDecay) / 1000 * damp)
            if m.noisyModes {
                voices.append(.noise(Noise(kind: .bandpass, frequency: f, q: MetalSoundTokens.bandQ, peak: peak * mode.gain * m.tone * MetalSoundTokens.bandGain,
                                           seconds: t, delay: delay, reach: reach)))
            } else {
                voices.append(.tone(Tone(frequency: f, glideTo: mode.glideTo ?? 1, glideSeconds: (mode.glideMs ?? 0) / 1000,
                                         peak: peak * mode.gain * m.tone, attack: attack, decay: t, delay: delay, reach: reach)))
            }
        }
        for layer in m.noise {
            voices.append(.noise(Noise(kind: layer.kind, frequency: vary(layer.frequency, MetalSoundTokens.varyFilter), q: layer.q,
                                       peak: peak * layer.gain, seconds: vary(layer.ms, MetalSoundTokens.varyDecay) / 1000,
                                       delay: delay, reach: reach)))
        }
        if let grit = m.grit {
            for _ in 0..<grit.count {
                voices.append(.noise(Noise(kind: .bandpass, frequency: vary(grit.frequency, MetalSoundTokens.gritSpread), q: MetalSoundTokens.gritQ,
                                           peak: peak * grit.level * Double.random(in: 0.5...1.5), seconds: MetalSoundTokens.gritMs / 1000,
                                           delay: delay + Double.random(in: 0...grit.spreadMs) / 1000, reach: reach)))
            }
        }
        if let bounce = m.bounce, !echo {
            render(m, f0: f0 * MetalSoundTokens.bouncePitch, peak: peak * bounce.level, at: delay + bounce.ms / 1000, size: size,
                   reach: reach, into: &voices, echo: true)
        }
    }

    /// The rate limit and the session decay per playing thing: a gain, or 0 to skip.
    private func allow(_ key: String) -> Double {
        let now = Date()
        var times = (playTimes[key] ?? []).filter { now.timeIntervalSince($0) * 1000 < MetalSoundTokens.burstWindowMs }
        if let last = times.last, now.timeIntervalSince(last) * 1000 < MetalSoundTokens.gapMs { return 0 }
        if times.count >= MetalSoundTokens.burst { return 0 }
        times.append(now)
        playTimes[key] = times
        let count = (playCounts[key] ?? 0) + 1
        playCounts[key] = count
        let drop = MetalSoundTokens.decayAfter.last(where: { count > $0.plays })?.db ?? 0
        return db(drop)
    }

    private func sizeGain(_ rendered: Double) -> Double {
        let steps = MetalSoundTokens.sizeGain
        guard let first = steps.first, let last = steps.last else { return 1 }
        if rendered <= first.size { return first.gain }
        for (a, b) in zip(steps, steps.dropFirst()) where rendered <= b.size {
            return a.gain + (b.gain - a.gain) * (rendered - a.size) / (b.size - a.size)
        }
        return last.gain
    }
}

private func db(_ d: Double) -> Double { pow(10, d / 20) }
private func vary(_ x: Double, _ pct: Double) -> Double { x * (1 + Double.random(in: -pct...pct)) }

// MARK: - Voices and the render loop (audio thread)

private struct Tone {
    var frequency: Double, glideTo: Double, glideSeconds: Double
    var peak: Double, attack: Double, decay: Double, delay: Double
    var reach: MetalSoundReach
}

private struct Noise {
    var kind: MetalSoundNoise.Kind, frequency: Double, q: Double?
    var peak: Double, seconds: Double, delay: Double
    var reach: MetalSoundReach
}

private struct Beep {
    var frequency: Double, peak: Double, length: Double, delay: Double
}

private enum Voice {
    case tone(Tone), noise(Noise), beep(Beep)
}

/// A biquad in the forms Web Audio uses (RBJ cookbook).
private struct Biquad {
    var b0 = 1.0, b1 = 0.0, b2 = 0.0, a1 = 0.0, a2 = 0.0
    var x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0

    init(kind: MetalSoundNoise.Kind, frequency: Double, q: Double?, rate: Double) {
        let w = 2 * Double.pi * min(frequency, rate * 0.45) / rate, cw = cos(w)
        switch kind {
        case .bandpass:
            let alpha = sin(w) / (2 * (q ?? 1))
            self.set(alpha, -2 * cw, 1 - alpha, b0: alpha, b1: 0, b2: -alpha, a0: 1 + alpha)
        case .lowpass, .highpass:
            let alpha = sin(w) / (2 * pow(10, (q ?? 1) / 20))        // Web Audio's lowpass/highpass Q is in dB
            let lp = kind == .lowpass
            let b1 = lp ? 1 - cw : -(1 + cw)
            self.set(alpha, -2 * cw, 1 - alpha, b0: b1.magnitude / 2, b1: b1, b2: b1.magnitude / 2, a0: 1 + alpha)
        }
    }

    init(peakingAt frequency: Double, q: Double, gainDb: Double, rate: Double) {
        let w = 2 * Double.pi * frequency / rate, cw = cos(w), a = pow(10, gainDb / 40), alpha = sin(w) / (2 * q)
        self.set(alpha, -2 * cw, 1 - alpha / a, b0: 1 + alpha * a, b1: -2 * cw, b2: 1 - alpha * a, a0: 1 + alpha / a)
    }

    private mutating func set(_ alpha: Double, _ a1: Double, _ a2: Double, b0: Double, b1: Double, b2: Double, a0: Double) {
        self.b0 = b0 / a0; self.b1 = b1 / a0; self.b2 = b2 / a0; self.a1 = a1 / a0; self.a2 = a2 / a0
    }

    mutating func process(_ x: Double) -> Double {
        let y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2 = x1; x1 = x; y2 = y1; y1 = y
        return y
    }
}

/// One playing voice, reduced to per-sample state.
private struct Active {
    var start: Int, length: Int, attack: Int
    var peak: Double, fall: Double, level = 0.0
    var phase = 0.0, step = 0.0, stepEnd = 0.0, glide = 0
    var filter: Biquad?, square = 0.0, release = 0
    var left: Double, right: Double, send: Double
    var isBeep = false, isNoise = false
    var age = 0
}

private final class Synth: @unchecked Sendable {
    private let lock = OSAllocatedUnfairLock()
    private var pending: [Voice] = []
    private var active: [Active] = []
    private var rate = 48_000.0
    private var rng: UInt64 = 0x9E37_79B9_7F4A_7C15
    private var room = Room()

    func prepare(sampleRate: Double) { rate = sampleRate; room = Room(rate: sampleRate) }

    func add(_ voices: [Voice]) { lock.withLock { pending.append(contentsOf: voices) } }

    private func noise() -> Double {
        rng ^= rng << 13; rng ^= rng >> 7; rng ^= rng << 17
        return Double(rng % 2_000_000) / 1_000_000 - 1
    }

    private func pan(_ reach: MetalSoundReach) -> (Double, Double, Double) {
        let x = (reach.pan + 1) / 2 * Double.pi / 2          // equal power, as StereoPannerNode
        return (cos(x), sin(x), reach.send)
    }

    private func activate(_ v: Voice) -> Active {
        switch v {
        case .tone(let t):
            let (l, r, s) = pan(t.reach), length = Int((t.attack + t.decay) * rate)
            var a = Active(start: Int(t.delay * rate), length: length, attack: max(1, Int(t.attack * rate)), peak: t.peak,
                           fall: pow(1e-4 / max(t.peak, 1e-6), 1 / max(1, t.decay * rate)), left: l, right: r, send: s)
            a.step = t.frequency / rate; a.stepEnd = t.frequency * t.glideTo / rate; a.glide = Int(t.glideSeconds * rate)
            return a
        case .noise(let n):
            let (l, r, s) = pan(n.reach), length = Int(n.seconds * rate)
            var a = Active(start: Int(n.delay * rate), length: length, attack: max(1, Int(MetalSoundTokens.contactAttackMs / 1000 * rate)), peak: n.peak,
                           fall: pow(1e-4 / max(n.peak, 1e-6), 1 / max(1, n.seconds * rate)), left: l, right: r, send: s)
            a.filter = Biquad(kind: n.kind, frequency: n.frequency, q: n.q, rate: rate); a.isNoise = true
            return a
        case .beep(let b):
            let (l, r, s) = pan(.own)
            var a = Active(start: Int(b.delay * rate), length: Int(b.length * rate),
                           attack: max(1, Int(MetalSoundTokens.beeperAttackMs / 1000 * rate)), peak: b.peak, fall: 1,
                           left: l, right: r, send: s)
            a.step = b.frequency / rate; a.stepEnd = a.step; a.isBeep = true; a.square = MetalSoundTokens.beeperSquare
            a.release = Int(0.02 * rate)
            a.filter = Biquad(peakingAt: MetalSoundTokens.beeperResonance, q: MetalSoundTokens.beeperQ,
                              gainDb: MetalSoundTokens.beeperBoostDb, rate: rate)
            return a
        }
    }

    func render(left: UnsafeMutablePointer<Float>, right: UnsafeMutablePointer<Float>, frames: Int) {
        if let incoming = lock.withLockIfAvailable({ () -> [Voice] in defer { pending.removeAll(keepingCapacity: true) }; return pending }) {
            active.append(contentsOf: incoming.map(activate))
        }
        let limit = db(MetalSoundTokens.limitDb)
        for i in 0..<frames {
            var l = 0.0, r = 0.0, wet = 0.0
            for j in active.indices {
                var a = active[j]
                defer { active[j] = a }
                if a.start > 0 { a.start -= 1; continue }
                guard a.age < a.length else { continue }
                // envelope: linear attack, then exponential fall (a beep holds, then releases linearly)
                if a.age < a.attack { a.level = a.peak * Double(a.age) / Double(a.attack) }
                else if a.isBeep { a.level = a.age > a.length - a.release ? a.peak * Double(a.length - a.age) / Double(a.release) : a.peak }
                else { a.level = a.age == a.attack ? a.peak : a.level * a.fall }
                var x: Double
                if a.isNoise { x = a.filter!.process(noise()) }
                else {
                    let step = a.glide > 0 ? a.step * pow(a.stepEnd / a.step, min(1, Double(a.age) / Double(a.glide))) : a.step
                    a.phase += step; if a.phase >= 1 { a.phase -= 1 }
                    x = sin(2 * Double.pi * a.phase)
                    if a.isBeep { x = a.filter!.process(x + a.square * (a.phase < 0.5 ? 1 : -1)) }
                }
                x *= a.level
                l += x * a.left; r += x * a.right; wet += x * a.send
                a.age += 1
            }
            let (rl, rr) = room.process(wet)
            // a soft limit above the ceiling, never a hard clip
            left[i] = Float(soft(l + rl, limit)); right[i] = Float(soft(r + rr, limit))
        }
        active.removeAll { $0.start <= 0 && $0.age >= $0.length }
    }

    private func soft(_ x: Double, _ ceiling: Double) -> Double {
        abs(x) <= ceiling ? x : (x > 0 ? 1 : -1) * (ceiling + (1 - ceiling) * tanh((abs(x) - ceiling) / (1 - ceiling)))
    }
}

/// The room: a small Schroeder reverb (four combs, two allpasses) tuned to the room's length.
/// The web renders the same room as a convolution with decaying noise.
private struct Room {
    private var combs: [[Double]] = [], combIndex: [Int] = [], combGain: [Double] = []
    private var passes: [[Double]] = [], passIndex: [Int] = []

    init(rate: Double = 48_000) {
        let lengths = [1557, 1617, 1491, 1422].map { Int(Double($0) * rate / 44_100) }
        combs = lengths.map { [Double](repeating: 0, count: $0) }
        combIndex = lengths.map { _ in 0 }
        combGain = lengths.map { pow(10, -3 * Double($0) / (MetalSoundTokens.roomSeconds * rate)) }
        let passLengths = [225, 556].map { Int(Double($0) * rate / 44_100) }
        passes = passLengths.map { [Double](repeating: 0, count: $0) }
        passIndex = passLengths.map { _ in 0 }
    }

    mutating func process(_ x: Double) -> (Double, Double) {
        var sum = 0.0
        for c in combs.indices {
            let y = combs[c][combIndex[c]]
            combs[c][combIndex[c]] = x + y * combGain[c]
            combIndex[c] = (combIndex[c] + 1) % combs[c].count
            sum += y
        }
        var y = sum * 0.25
        for p in passes.indices {
            let b = passes[p][passIndex[p]]
            passes[p][passIndex[p]] = y + b * 0.5
            y = b - y * 0.5
            passIndex[p] = (passIndex[p] + 1) % passes[p].count
        }
        return (y, y * 0.96)
    }
}
