import Foundation

/// A value on a port: a switch, a number, a word, or a pulse (delivered once, never stored).
public enum MetalGadgetValue: Sendable, Hashable, Codable {
    case bool(Bool), number(Double), text(String), pulse
    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let b = try? c.decode(Bool.self) { self = .bool(b) }
        else if let n = try? c.decode(Double.self) { self = .number(n) }
        else if let s = try? c.decode(String.self) { self = .text(s) }
        else { self = .pulse }
    }
    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self { case .bool(let b): try c.encode(b); case .number(let n): try c.encode(n); case .text(let s): try c.encode(s); case .pulse: try c.encode(["pulse": true]) }
    }
    var number: Double? { if case .number(let n) = self { return n }; return nil }
    var isPulse: Bool { if case .pulse = self { return true }; return false }
}

/// A rig spec (`metalui/rig@1`): gadgets on a grid, wired by cables from out ports to in ports.
public struct MetalRigSpec: Decodable, Sendable {
    public struct Slot: Decodable, Sendable {
        public let gadget: MetalGadgetSpec?
        public let named: String?
        public let at: [Int]
        public let set: [String: MetalGadgetValue]?
        enum CodingKeys: String, CodingKey { case gadget, at, set }
        public init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            named = try? c.decode(String.self, forKey: .gadget)
            gadget = named == nil ? try c.decode(MetalGadgetSpec.self, forKey: .gadget) : nil
            at = try c.decode([Int].self, forKey: .at)
            set = try c.decodeIfPresent([String: MetalGadgetValue].self, forKey: .set)
        }
    }
    /// What a cable does to the value it carries.
    public enum Map: Decodable, Sendable {
        case threshold(at: Double, above: MetalGadgetValue, below: MetalGadgetValue)
        case scale(from: [Double], to: [Double])
        case match(when: MetalGadgetValue)
        case count(step: Double)
        case select(table: [String: String])
        enum CodingKeys: String, CodingKey { case kind, at, above, below, from, to, when, step, table }
        public init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            switch try c.decode(String.self, forKey: .kind) {
            case "threshold": self = .threshold(at: try c.decode(Double.self, forKey: .at), above: try c.decode(MetalGadgetValue.self, forKey: .above), below: try c.decode(MetalGadgetValue.self, forKey: .below))
            case "scale": self = .scale(from: try c.decode([Double].self, forKey: .from), to: try c.decode([Double].self, forKey: .to))
            case "match": self = .match(when: try c.decode(MetalGadgetValue.self, forKey: .when))
            case "count": self = .count(step: try c.decode(Double.self, forKey: .step))
            default: self = .select(table: try c.decode([String: String].self, forKey: .table))
            }
        }
    }
    public struct Cable: Decodable, Sendable { public let from: String; public let to: String; public let map: Map? }

    public let name: String
    public let title: String
    public let job: String
    public let feel: MetalGadgetFeel
    public let grid: [Int]
    public let gadgets: [String: Slot]
    public let cables: [Cable]

    public static func decode(_ data: Data) throws -> MetalRigSpec { try JSONDecoder().decode(MetalRigSpec.self, from: data) }
}

/// The rig engine, the twin of rig-engine.ts: layout (modules in grid order, a jack per wired port,
/// a hanging cord between each pair) and the flow of values along the cables, hop by hop.
public struct MetalRigEngine: Sendable {
    public struct Module: Sendable { public let inst: String; public let spec: MetalGadgetSpec; public let at: CGPoint }
    public struct Jack: Sendable { public let inst: String; public let port: String; public let out: Bool; public let at: CGPoint }
    public struct Cord: Sendable { public let index: Int; public let from: String; public let to: String; public let a: CGPoint; public let b: CGPoint; public let length: Double }
    public struct Hop: Sendable, Equatable { public let cable: Int; public let from: String; public let to: String; public let value: MetalGadgetValue; public let hop: Int }

    public let spec: MetalRigSpec
    public let width: Double, height: Double
    public let modules: [Module]
    public let jacks: [Jack]
    public let cords: [Cord]
    public private(set) var inputs: [String: [String: MetalGadgetValue]] = [:]
    public private(set) var states: [String: String] = [:]

    public init(_ spec: MetalRigSpec, catalog: [String: MetalGadgetSpec] = [:]) {
        self.spec = spec
        let t = MetalGadgetTokens.self, canvas = t.canvas
        width = 2 * t.rigPadding + Double(spec.grid[0]) * t.rigPitch - (t.rigPitch - canvas)
        height = 2 * t.rigPadding + Double(spec.grid[1]) * t.rigPitch - (t.rigPitch - canvas)
        modules = spec.gadgets.compactMap { inst, slot -> Module? in
            guard let g = slot.gadget ?? slot.named.flatMap({ catalog[$0] }) else { return nil }
            return Module(inst: inst, spec: g, at: CGPoint(x: t.rigPadding + Double(slot.at[0]) * t.rigPitch, y: t.rigPadding + Double(slot.at[1]) * t.rigPitch))
        }.sorted { $0.at.y != $1.at.y ? $0.at.y < $1.at.y : $0.at.x < $1.at.x }
        // One jack per wired port, beside the gadget's body: outs on its right, ins on its left, top down.
        var wired: [Bool: [String: [String]]] = [true: [:], false: [:]]
        func note(_ out: Bool, _ end: String) {
            let p = end.split(separator: ".").map(String.init)
            var l = wired[out]![p[0]] ?? []
            if !l.contains(p[1]) { l.append(p[1]) }
            wired[out]![p[0]] = l
        }
        for c in spec.cables { note(true, c.from); note(false, c.to) }
        let body = t.bodyRect
        var jacks: [Jack] = []
        for m in modules { for out in [true, false] {
            for (i, port) in (wired[out]![m.inst] ?? []).enumerated() {
                let x = out ? m.at.x + body.x + body.width + t.rigGap : m.at.x + body.x - t.rigGap
                jacks.append(Jack(inst: m.inst, port: port, out: out, at: CGPoint(x: x, y: m.at.y + t.rigTop + Double(i) * t.rigSpacing)))
            }
        } }
        self.jacks = jacks
        func jackAt(_ out: Bool, _ end: String) -> CGPoint {
            let p = end.split(separator: ".").map(String.init)
            return jacks.first { $0.out == out && $0.inst == p[0] && $0.port == p[1] }!.at
        }
        cords = spec.cables.enumerated().map { i, c in
            let a = jackAt(true, c.from), b = jackAt(false, c.to)
            return Cord(index: i, from: c.from, to: c.to, a: a, b: b, length: hypot(b.x - a.x, b.y - a.y) + t.rigSlack)
        }
        for m in modules {
            var ins: [String: MetalGadgetValue] = [:]
            for (p, ch) in m.spec.ports?.in ?? [:] { if let d = ch.default?.number { ins[p] = .number(d) } }
            for (p, v) in spec.gadgets[m.inst]?.set ?? [:] { ins[p] = v }
            inputs[m.inst] = ins
            states[m.inst] = m.spec.state(nil)
        }
    }

    private func spec(_ inst: String) -> MetalGadgetSpec? { modules.first { $0.inst == inst }?.spec }

    /// What a gadget puts out, from its inputs and state, the same rules as deriveOutputs in rig-engine.ts.
    static func outputs(_ g: MetalGadgetSpec, now: [String: MetalGadgetValue], before: [String: MetalGadgetValue], state: String, last: String) -> [String: MetalGadgetValue] {
        var out: [String: MetalGadgetValue] = [:]
        let outs = g.ports?.out ?? [:]
        let drive = g.mechanism.drive ?? g.ports?.in?.keys.sorted().first ?? ""
        let v = now[drive]?.number ?? g.driveDefault, was = before[drive]?.number ?? g.driveDefault
        if let t = g.parts.first(where: { $0.part == "needle" })?.params?["threshold"]?.number {
            let above = g.driveShare(v) >= t
            if outs["above"] != nil { out["above"] = .bool(above) }
            if outs["over"] != nil, above, g.driveShare(was) < t { out["over"] = .pulse }
        }
        if g.mechanism.name == "roll" {
            if outs["count"] != nil { out["count"] = .number(v) }
            if outs["rolled"] != nil, let max = g.ports?.in?[drive]?.max, v < was, was >= max { out["rolled"] = .pulse }
        }
        for (name, ch) in outs where ch.kind == "pulse" && g.states[name] != nil && state == name && last != name { out[name] = .pulse }
        // A switch named after a state is on while the gadget shows it (a drawer full, a grid full).
        let shown = g.derivedState(state, value: v)
        for (name, ch) in outs where ch.kind == "boolean" && g.states[name] != nil && out[name] == nil { out[name] = .bool(shown == name) }
        return out
    }

    static func map(_ m: MetalRigSpec.Map?, _ v: MetalGadgetValue, current: MetalGadgetValue?) -> MetalGadgetValue? {
        guard let m else { return v }
        switch m {
        case .threshold(let at, let above, let below): return (v.number ?? 0) >= at ? above : below
        case .scale(let f, let t): return .number(t[0] + ((v.number ?? 0) - f[0]) / (f[1] - f[0] == 0 ? 1 : f[1] - f[0]) * (t[1] - t[0]))
        case .match(let when): return v == when ? .pulse : nil
        case .count(let step): return v.isPulse ? .number(max(0, (current?.number ?? 0) + step)) : nil
        case .select(let table): if case .text(let s) = v, let r = table[s] { return .text(r) }; return nil
        }
    }

    private mutating func run(_ inst: String, before: [String: MetalGadgetValue], last: String, hop: Int, into out: inout [Hop]) {
        guard let g = spec(inst) else { return }
        let outs = Self.outputs(g, now: inputs[inst] ?? [:], before: before, state: states[inst] ?? "", last: last)
        for (i, c) in spec.cables.enumerated() {
            let f = c.from.split(separator: ".").map(String.init), t = c.to.split(separator: ".").map(String.init)
            guard f[0] == inst, let v = outs[f[1]], let arrived = Self.map(c.map, v, current: inputs[t[0]]?[t[1]]) else { continue }
            out.append(Hop(cable: i, from: c.from, to: c.to, value: arrived, hop: hop))
            let prev = inputs[t[0]] ?? [:]
            if !arrived.isPulse { inputs[t[0], default: [:]][t[1]] = arrived }
            run(t[0], before: prev, last: states[t[0]] ?? "", hop: hop + 1, into: &out)
        }
    }

    /// Sets one gadget's input from outside, and returns what then travels along the cables, in order.
    public mutating func set(_ inst: String, _ port: String, _ value: MetalGadgetValue) -> [Hop] {
        let before = inputs[inst] ?? [:]
        if !value.isPulse { inputs[inst, default: [:]][port] = value }
        var out: [Hop] = []
        run(inst, before: before, last: states[inst] ?? "", hop: 1, into: &out)
        return out
    }
}
