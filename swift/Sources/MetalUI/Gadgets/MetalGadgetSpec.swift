import Foundation

/// A gadget spec (`metalui/gadget@1`), the same JSON the web renderer draws: its Parts on the 400-unit
/// canvas, a job and a feel the colours come from, a mechanism bound to the Parts it moves, and states.
public struct MetalGadgetSpec: Codable, Sendable, Hashable {
    public struct Part: Codable, Sendable, Hashable {
        public let id: String
        public let part: String
        public let at: [Double]
        public let size: [Double]?
        public let role: String
        public let material: String?
        public let params: [String: MetalGadgetParam]?
    }
    public struct Mechanism: Codable, Sendable, Hashable {
        public let name: String
        /// A held mechanism's drive port.
        public let drive: String?
        /// Slot → the Parts it moves: one part, or several (a counter's drums).
        public let bind: [String: [String]]
        /// Each slot's first Part.
        public var first: [String: String] { bind.compactMapValues(\.first) }

        enum CodingKeys: String, CodingKey { case name, bind, drive }
        private struct OneOrMany: Codable, Hashable {
            let ids: [String]
            init(from decoder: Decoder) throws {
                let c = try decoder.singleValueContainer()
                if let many = try? c.decode([String].self) { ids = many } else { ids = [try c.decode(String.self)] }
            }
            func encode(to encoder: Encoder) throws { var c = encoder.singleValueContainer(); try c.encode(ids) }
        }
        public init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            name = try c.decode(String.self, forKey: .name)
            drive = try c.decodeIfPresent(String.self, forKey: .drive)
            bind = try c.decode([String: OneOrMany].self, forKey: .bind).mapValues(\.ids)
        }
        public func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(name, forKey: .name)
            try c.encodeIfPresent(drive, forKey: .drive)
            try c.encode(bind, forKey: .bind)
        }
    }
    public struct Pose: Codable, Sendable, Hashable { public let x: Double?, y: Double?, r: Double?, sx: Double?, sy: Double? }
    public struct Form: Codable, Sendable, Hashable {
        public let pose: Pose?
        /// A param a state sets (a blip's `alpha`): its name and value.
        public let param: String?
        public let value: MetalGadgetParam?
        /// The light a state gives a part (`alpha`), if it sets one.
        var alpha: Double? { param == "alpha" ? value?.number : nil }
    }
    public struct PartialFeel: Codable, Sendable, Hashable { public let v: Double?, a: Double?, w: Double? }
    public struct State: Codable, Sendable, Hashable {
        public let feel: PartialFeel?
        public let lamp: [String]?
        public let form: [String: Form]?
        public let beep: String?
        public let enter: String?
        public let hint: String?
    }

    public let name: String
    public let title: String
    public let job: String
    public let reach: String?
    public let feel: MetalGadgetFeel
    public let container: String?
    public let material: String?
    public let station: Double?
    public let parts: [Part]
    public let mechanism: Mechanism
    public let states: [String: State]
    public let initial: String?
    public let describe: String?
    public let ports: Ports?

    /// What flows in and out: a channel's kind and, for a number, its default.
    public struct Channel: Codable, Sendable, Hashable { public let kind: String; public let `default`: MetalGadgetParam?; public let min: Double?; public let max: Double?; public let unit: String? }
    public struct Ports: Codable, Sendable, Hashable { public let `in`: [String: Channel]?; public let out: [String: Channel]? }

    /// The value a held gadget's drive port starts at: the port's default, else the middle.
    public var driveDefault: Double {
        let port = mechanism.drive ?? ports?.in?.keys.sorted().first
        let d = port.flatMap { ports?.in?[$0]?.default }
        if case .flag(let on)? = d { return on ? 1 : 0 }
        return d?.number ?? 0.5
    }

    /// The drive port's range: [min, max] for a number, else 0...1.
    public var driveRange: (min: Double, max: Double, unit: String?) {
        let port = mechanism.drive ?? ports?.in?.keys.sorted().first
        let ch = port.flatMap { ports?.in?[$0] }
        return (ch?.min ?? 0, ch?.max ?? 1, ch?.unit)
    }
    /// A value as a share of the drive port's range, 0 to 1.
    public func driveShare(_ value: Double) -> Double { let r = driveRange; return Swift.min(1, Swift.max(0, (value - r.min) / (r.max - r.min == 0 ? 1 : r.max - r.min))) }

    /// The state it shows for a value: a needle past its threshold makes it `over`; back under, `over`
    /// falls back to its initial state (or rest). The same rule as draw.ts.
    public func derivedState(_ state: String, value: Double?) -> String {
        // A switch that names a state: on, it is that state; off, back to rest. A state entered by an act
        // (a bin emptied) is the host's and stands.
        if let port = mechanism.drive, ports?.in?[port]?.kind == "boolean", states[port] != nil, let value, states[state]?.enter != "act" {
            return value >= 0.5 ? port : state == port ? "rest" : state
        }
        // A drawer too full to close is full; opened by the host it is open. Emptied, back to rest.
        if parts.contains(where: { $0.part == "slab" && $0.role == "actor" }), states["full"] != nil, let value {
            if driveShare(value) >= MetalGadgetTokens.trayFull { return state == "open" ? "open" : "full" }
            return state == "full" ? "rest" : state
        }
        // Cells that fill: none lit is rest, some filling, all full. A first run is the host's.
        if parts.contains(where: { $0.part == "cell" }), states["filling"] != nil, states["full"] != nil, let value, state != "first-run" {
            let u = driveShare(value)
            return u <= 0 ? "rest" : u >= 1 ? "full" : "filling"
        }
        guard let t = parts.first(where: { $0.part == "needle" })?.params?["threshold"]?.number, states["over"] != nil, let value else { return state }
        if driveShare(value) >= t { return "over" }
        let initial = self.state(nil)
        return state == "over" ? (initial == "over" ? "rest" : initial) : state
    }

    /// Where each actor of a held gadget goes for a drive value: a needle points at the value's share of
    /// its range; a cap goes to its rest place (its `value` param) shifted by how far the value sits
    /// from the middle. The same rule as draw.ts.
    public func driveTargets(_ value: Double, state: String? = nil) -> [Double] {
        guard let held = MetalMechanism.all.first(where: { $0.name == mechanism.name })?.held else { return [] }
        let ids = mechanism.bind[held.slot] ?? []
        // A lid goes where the state holds it (its form's turn, a share of the mechanism's full swing).
        if ids.allSatisfy({ id in parts.first { $0.id == id }?.part == "lid" }) {
            let s = state ?? self.state(nil)
            return ids.map { id in held.to.r == 0 ? 0 : min(1, max(0, (states[s]?.form?[id]?.pose?.r ?? 0) / held.to.r)) }
        }
        // Cells light to the value's share; on a first run the grid rises all the way.
        if ids.allSatisfy({ id in parts.first { $0.id == id }?.part == "cell" }) { return ids.map { _ in state == "first-run" ? 1 : driveShare(value) } }
        if ids.allSatisfy({ id in parts.first { $0.id == id }?.part == "needle" }) { return ids.map { _ in driveShare(value) } }
        return ids.map { id in
            let rest = parts.first { $0.id == id }?.params?["value"]?.number ?? 0.5
            return min(1, max(0, rest + (value - 0.5)))
        }
    }

    /// Decodes a spec from its JSON.
    public static func decode(_ data: Data) throws -> MetalGadgetSpec { try JSONDecoder().decode(MetalGadgetSpec.self, from: data) }

    /// The state it shows: the one asked for if it has it, else its initial state.
    public func state(_ wanted: String?) -> String {
        if let wanted, states[wanted] != nil { return wanted }
        if let initial, states[initial] != nil { return initial }
        return states.keys.sorted().first ?? "rest"
    }

    /// Its spoken description: `describe` with {title} and {state}, then the state's hint.
    public func description(_ state: String, value: Double? = nil) -> String {
        let v = Int((value ?? driveDefault).rounded())
        let text = (describe ?? "{title}: {state}").replacingOccurrences(of: "{title}", with: title).replacingOccurrences(of: "{state}", with: state)
            .replacingOccurrences(of: "{value}", with: String(v))
            .replacingOccurrences(of: "{max}", with: String(Int(driveRange.max))).replacingOccurrences(of: "{unit}", with: driveRange.unit ?? "")
            .replacingOccurrences(of: "{share}", with: "\(Int((driveShare(value ?? driveDefault) * 100).rounded()))%")
            .trimmingCharacters(in: .whitespaces)
        return states[state]?.hint.map { "\(text), \($0)" } ?? text
    }
}

/// A Part's parameter: a number, a word or a switch.
public enum MetalGadgetParam: Codable, Sendable, Hashable {
    case number(Double), text(String), flag(Bool)
    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let n = try? c.decode(Double.self) { self = .number(n) } else if let b = try? c.decode(Bool.self) { self = .flag(b) } else { self = .text(try c.decode(String.self)) }
    }
    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self { case .number(let n): try c.encode(n); case .text(let s): try c.encode(s); case .flag(let b): try c.encode(b) }
    }
    var number: Double? { if case .number(let n) = self { return n }; return nil }
    var text: String? { if case .text(let s) = self { return s }; return nil }
}
