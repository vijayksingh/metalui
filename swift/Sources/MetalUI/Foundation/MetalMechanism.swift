import Foundation
import Observation
import SwiftUI

// Mechanisms in SwiftUI: the same tracks and cues as the web player (MetalMechanisms.generated.swift),
// sampled with the same cubic-bezier maths, so a gadget moves, lights and sounds identically on
// both platforms. fixtures/mechanism-samples.json is the shared answer (MetalMechanismParity).

public struct MetalMechanismPose: Sendable, Hashable {
    public var x: Double, y: Double, r: Double, sx: Double, sy: Double
    public init(x: Double = 0, y: Double = 0, r: Double = 0, sx: Double = 1, sy: Double = 1) { self.x = x; self.y = y; self.r = r; self.sx = sx; self.sy = sy }
    public static let rest = MetalMechanismPose()
}

public struct MetalMechanism: Sendable {
    public struct Frame: Sendable {
        public let at: Double, pose: MetalMechanismPose, opacity: Double?, ease: (Double, Double, Double, Double)
        public init(at: Double, pose: MetalMechanismPose, opacity: Double?, ease: (Double, Double, Double, Double)) { self.at = at; self.pose = pose; self.opacity = opacity; self.ease = ease }
    }
    public struct Track: Sendable {
        public let part: String, frames: [Frame]
        public init(part: String, frames: [Frame]) { self.part = part; self.frames = frames }
    }
    public enum CueKind: String, Sendable { case strike, lamp, beep, friction, detent }
    public struct Cue: Sendable {
        public let at: Double?, until: Double?, kind: CueKind, slot: String?, level: Double, pitch: Double, gesture: MetalLampGesture?
        public init(at: Double?, until: Double?, kind: CueKind, slot: String?, level: Double, pitch: Double, gesture: MetalLampGesture?) {
            self.at = at; self.until = until; self.kind = kind; self.slot = slot; self.level = level; self.pitch = pitch; self.gesture = gesture
        }
    }
    public struct HeldPose: Sendable {
        public let hold: String, pose: MetalMechanismPose
        public init(hold: String, pose: MetalMechanismPose) { self.hold = hold; self.pose = pose }
    }

    public let name: String
    public let momentary: Bool
    /// Milliseconds.
    public let duration: Double
    public let spring: MetalSpringClass
    public let tracks: [Track]
    public let cues: [Cue]
    public let states: [String: HeldPose]
    /// What survives reduced motion: "lamp", "sound", "press".
    public let reduced: [String]

    public init(name: String, momentary: Bool, duration: Double, spring: MetalSpringClass, tracks: [Track], cues: [Cue], states: [String: HeldPose], reduced: [String]) {
        self.name = name; self.momentary = momentary; self.duration = duration; self.spring = spring
        self.tracks = tracks; self.cues = cues; self.states = states; self.reduced = reduced
    }

    /// A cubic-bezier easing at x (the web player's Newton solve).
    static func bezier(_ e: (Double, Double, Double, Double), _ x: Double) -> Double {
        let (x1, y1, x2, y2) = e
        if x1 == y1, x2 == y2 { return x }
        var t = x
        for _ in 0..<8 {
            let cx = 3 * x1 * t * pow(1 - t, 2) + 3 * x2 * t * t * (1 - t) + pow(t, 3) - x
            let d = 3 * x1 * pow(1 - t, 2) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t
            if abs(cx) < 1e-6 || d == 0 { break }
            t = min(1, max(0, t - cx / d))
        }
        return 3 * y1 * t * pow(1 - t, 2) + 3 * y2 * t * t * (1 - t) + pow(t, 3)
    }

    /// A part's pose and opacity at `at` milliseconds into the act.
    public func sample(_ part: String, at: Double) -> (pose: MetalMechanismPose, opacity: Double?) {
        guard let frames = tracks.first(where: { $0.part == part })?.frames, let first = frames.first else { return (.rest, nil) }
        guard let i = frames.firstIndex(where: { $0.at >= at }) else { let l = frames[frames.count - 1]; return (l.pose, l.opacity) }
        if i == 0 { return (first.pose, first.opacity) }
        let a = frames[i - 1], b = frames[i], k = Self.bezier(a.ease, (at - a.at) / (b.at - a.at))
        func lerp(_ u: Double, _ v: Double) -> Double { u + (v - u) * k }
        let p = MetalMechanismPose(x: lerp(a.pose.x, b.pose.x), y: lerp(a.pose.y, b.pose.y), r: lerp(a.pose.r, b.pose.r),
                                   sx: lerp(a.pose.sx, b.pose.sx), sy: lerp(a.pose.sy, b.pose.sy))
        return (p, a.opacity.map { lerp($0, b.opacity ?? $0) })
    }
}

/// Plays a mechanism: one act at a time on a clock, its cues into sound and light; state poses on
/// the mechanism's own spring (SwiftUI keeps velocity when a spring is retargeted, as the web does).
@MainActor @Observable
public final class MetalMechanismPlayer {
    public let mechanism: MetalMechanism
    /// When the current act began; nil at rest.
    public private(set) var actStart: Date?
    /// The held pose per part, animated on the mechanism's spring.
    public private(set) var held: [String: MetalMechanismPose] = [:]
    public var reduced = false
    private var pending: [DispatchWorkItem] = []

    public init(_ mechanism: MetalMechanism) { self.mechanism = mechanism }

    public var playing: Bool { actStart.map { Date().timeIntervalSince($0) * 1000 < mechanism.duration } ?? false }

    /// The cue times this act schedules, in ms: reduced motion collapses kept cues to the start.
    public func schedule() -> [(at: Double, cue: MetalMechanism.Cue, skipped: Bool)] {
        let keep = Set(mechanism.reduced)
        return mechanism.cues.compactMap { cue in
            guard let at = cue.at, cue.kind != .detent else { return nil }
            if cue.kind == .friction { return (at, cue, reduced) }
            let kept = keep.contains(cue.kind == .lamp ? "lamp" : "sound")
            if reduced { return kept ? (0, cue, false) : (at, cue, true) }
            return (at, cue, false)
        }
    }

    /// Plays the act; a second act while one plays is ignored. `strike` says what a slot is made of.
    @discardableResult
    public func act(sound: MetalSound? = nil, weight: Double = 0, reach: MetalSoundReach = .own,
                    strike: (String) -> (material: MetalSoundMaterial, size: Double)? = { _ in nil },
                    lamp: ((MetalLampGesture) -> Void)? = nil, beep: (() -> Void)? = nil,
                    onCue: ((MetalMechanism.Cue, Double) -> Void)? = nil) -> Bool {
        guard mechanism.momentary, !playing else { return false }
        for item in pending { item.cancel() }
        pending = []
        for (at, cue, skipped) in schedule() where !skipped {
            if cue.kind == .strike, let slot = cue.slot, let part = strike(slot) {
                sound?.strike(part.material, size: part.size, weight: weight, reach: reach, level: cue.level, delay: at / 1000, pitch: cue.pitch)
            }
            let item = DispatchWorkItem {
                if cue.kind == .lamp, let g = cue.gesture { lamp?(g) }
                if cue.kind == .beep { beep?() }
                onCue?(cue, at)
            }
            pending.append(item)
            DispatchQueue.main.asyncAfter(deadline: .now() + at / 1000, execute: item)
        }
        actStart = reduced ? nil : Date()
        return true
    }

    /// Springs to a state's held pose, or rest; a state change mid-act cancels the pending lamp and beep.
    public func hold(_ state: String?) {
        for item in pending { item.cancel() }
        pending = []
        actStart = nil
        var next: [String: MetalMechanismPose] = [:]
        if let state, let h = mechanism.states[state] { next[h.hold] = h.pose }
        let spring = mechanism.spring.spring
        if reduced { held = next } else { withAnimation(.interpolatingSpring(mass: 1, stiffness: spring.stiffness, damping: spring.damping)) { held = next } }
    }

    /// Where a part is now: the act's track while it plays, else its held pose.
    public func pose(_ part: String, at date: Date = Date()) -> (pose: MetalMechanismPose, opacity: Double?) {
        if let start = actStart {
            let t = date.timeIntervalSince(start) * 1000
            if t < mechanism.duration { return mechanism.sample(part, at: t) }
        }
        return (held[part.components(separatedBy: ".")[0]] ?? .rest, part.contains(".") ? 1 : nil)
    }
}
