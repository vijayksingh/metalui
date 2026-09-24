import CoreText
import SwiftUI

/// The bundled type families (SIL OFL 1.1): Geist for UI and reading, Martian Mono for
/// engravings, readouts and code, Doto for dot-matrix display readouts.
public enum MetalFonts {
    /// PostScript family names as the variable fonts declare them.
    static let familyNames: [MetalFontFamily: String] = [.sans: "Geist", .mono: "Martian Mono", .pixel: "Doto"]

    private static let registration: Bool = {
        guard let folder = Bundle.module.url(forResource: "Fonts", withExtension: nil),
              let files = try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
        else { return false }
        let fonts = files.filter { $0.pathExtension == "ttf" } as CFArray
        // Process scope: nothing is installed system-wide. Already-registered fonts are fine.
        CTFontManagerRegisterFontURLs(fonts, .process, true, nil)
        return true
    }()

    /// Registers the fonts once per process. Font.metal calls it; calling it early is harmless.
    @discardableResult
    public static func register() -> Bool { registration }

    private static let weightAxis = 0x7767_6874 // 'wght'
    private static let widthAxis = 0x7764_7468 // 'wdth'

    /// A CoreText font for a type role at a size, with its weight and width set on the variable axes.
    public static func ctFont(_ role: MetalTypeRole, size: Double) -> CTFont {
        register()
        var variation: [Int: Double] = [weightAxis: Double(role.weight)]
        if role.family == .mono { variation[widthAxis] = role.stretch * 100 }
        var attributes: [CFString: Any] = [
            kCTFontFamilyNameAttribute: familyNames[role.family] ?? "Geist",
            kCTFontVariationAttribute: variation,
        ]
        if role.tabular {
            // Tabular figures, like font-variant-numeric: tabular-nums.
            attributes[kCTFontFeatureSettingsAttribute] = [[
                kCTFontFeatureTypeIdentifierKey: kNumberSpacingType,
                kCTFontFeatureSelectorIdentifierKey: kMonospacedNumbersSelector,
            ]]
        }
        let descriptor = CTFontDescriptorCreateWithAttributes(attributes as CFDictionary)
        return CTFontCreateWithFontDescriptor(descriptor, size, nil)
    }
}

extension Font {
    /// The font for a type role. `scale` follows the host's text size; a role with a cap
    /// (label, DS-41) never grows past it.
    public static func metal(_ role: MetalTypeRole, scale: Double = 1) -> Font {
        let scaled = role.size * scale
        let size = role.maxSize.map { min(scaled, $0) } ?? scaled
        return Font(MetalFonts.ctFont(role, size: size))
    }
}

extension View {
    /// Sets a type role in full, like the CSS `.mu-type-*` class: font, tracking and case.
    public func metalType(_ role: MetalTypeRole, scale: Double = 1) -> some View {
        let size = role.maxSize.map { min(role.size * scale, $0) } ?? role.size * scale
        return font(.metal(role, scale: scale))
            .tracking(role.tracking * size)
            .textCase(role.uppercase ? .uppercase : nil)
    }
}
