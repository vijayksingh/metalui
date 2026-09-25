import SwiftUI

// Recipe props as typed values: a font shorthand as a type role in the bundled families, a CSS
// color prop, and hex colors.

extension MetalObjectRecipe {
    /// The font shorthand prop as a type role (weight, family, size, tracking from `<part>.tracking`).
    public func typeRole(_ key: String, trackingKey: String? = nil) -> MetalTypeRole {
        let parts = (text(key) ?? "").split(separator: " ")
        let weight = parts.first.flatMap { Int($0) } ?? 400
        let mono = parts.last == "mono"
        let size = fontSize(key)
        // MetalTypeRole stores tracking in em; recipe tracking may be px.
        let trackingEm = trackingKey.map { tracking($0, size: size) / size } ?? 0
        return MetalTypeRole(
            name: name + "." + key, family: mono ? .mono : .sans, size: size, line: size, weight: weight,
            tracking: trackingEm, stretch: mono ? MetalType.label.stretch : 1, uppercase: false, tabular: false, maxSize: nil
        )
    }

    /// A color prop written as CSS (`rgba(r,g,b,a)` or `#RRGGBB`).
    public func color(_ key: String, colorway: MetalRecipeColorway = .bone) -> MetalRGBA? {
        guard let raw = text(key, colorway: colorway)?.replacingOccurrences(of: " ", with: "") else { return nil }
        if raw.hasPrefix("#") { return MetalRGBA(hex: raw) }
        guard raw.hasPrefix("rgb"), let open = raw.firstIndex(of: "("), let close = raw.lastIndex(of: ")") else { return nil }
        let values = raw[raw.index(after: open)..<close].split(separator: ",").compactMap { Double($0) }
        guard values.count >= 3 else { return nil }
        return MetalRGBA(values[0], values[1], values[2], values.count > 3 ? values[3] : 1)
    }
}

extension MetalRGBA {
    /// `#RGB` or `#RRGGBB`, opaque; nil when it is not a hex color.
    public init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        if s.count == 3 { s = s.map { "\($0)\($0)" }.joined() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(Double((v >> 16) & 0xFF), Double((v >> 8) & 0xFF), Double(v & 0xFF), 1)
    }

    /// Rec. 601 luma on the 0–255 scale.
    public var luma: Double { 0.299 * red + 0.587 * green + 0.114 * blue }
}
