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
        /// Slot → the Parts it moves: one part, or several (a counter's drums).
        public let bind: [String: [String]]
        /// Each slot's first Part.
        public var first: [String: String] { bind.compactMapValues(\.first) }

        enum CodingKeys: String, CodingKey { case name, bind }
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
            bind = try c.decode([String: OneOrMany].self, forKey: .bind).mapValues(\.ids)
        }
        public func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(name, forKey: .name)
            try c.encode(bind, forKey: .bind)
        }
    }
    public struct Pose: Codable, Sendable, Hashable { public let x: Double?, y: Double?, r: Double?, sx: Double?, sy: Double? }
    public struct Form: Codable, Sendable, Hashable { public let pose: Pose? }
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

    /// Decodes a spec from its JSON.
    public static func decode(_ data: Data) throws -> MetalGadgetSpec { try JSONDecoder().decode(MetalGadgetSpec.self, from: data) }

    /// The state it shows: the one asked for if it has it, else its initial state.
    public func state(_ wanted: String?) -> String {
        if let wanted, states[wanted] != nil { return wanted }
        if let initial, states[initial] != nil { return initial }
        return states.keys.sorted().first ?? "rest"
    }

    /// Its spoken description: `describe` with {title} and {state}, then the state's hint.
    public func description(_ state: String) -> String {
        let text = (describe ?? "{title}: {state}").replacingOccurrences(of: "{title}", with: title).replacingOccurrences(of: "{state}", with: state)
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
