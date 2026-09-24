import AppKit
import CoreText
import SwiftUI

/// The type families, as the tokens name them: the system faces (SF Pro Text for UI and
/// reading, the browser's resolved mono face for engravings, readouts, keycaps and code)
/// as the web's -apple-system / ui-monospace stacks render them, and the bundled Doto (SIL OFL 1.1) for
/// dot-matrix display readouts. Geist and Martian Mono stay bundled for hosts that ask for them.
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

    /// A CSS weight (100–900) as the system font's weight trait (−1…1), interpolated between the
    /// named weights so 620 or 660 land where the browser draws them.
    static func systemWeight(_ css: Int) -> CGFloat {
        let table: [(Double, CGFloat)] = [
            (100, NSFont.Weight.ultraLight.rawValue), (200, NSFont.Weight.thin.rawValue), (300, NSFont.Weight.light.rawValue),
            (400, NSFont.Weight.regular.rawValue), (500, 0.23 /* NSFont.Weight for 500 */), (600, NSFont.Weight.semibold.rawValue),
            (700, NSFont.Weight.bold.rawValue), (800, NSFont.Weight.heavy.rawValue), (900, NSFont.Weight.black.rawValue),
        ]
        let w = min(max(Double(css), 100), 900)
        for i in 0..<(table.count - 1) where w <= table[i + 1].0 {
            let (a, fa) = table[i], (b, fb) = table[i + 1]
            return fa + (fb - fa) * CGFloat((w - a) / (b - a))
        }
        return NSFont.Weight.black.rawValue
    }

    /// A CoreText font for a type role at a size. Chrome resolves the demo's
    /// `"SF Mono", ui-monospace, SFMono-Regular, Menlo, monospace` stack to
    /// Courier on macOS; use that same available face for the Swift mono role.
    /// Doto keeps its variable axes for pixel labels.
    public static func ctFont(_ role: MetalTypeRole, size: Double) -> CTFont {
        let base: CTFont
        switch role.family {
        case .pixel:
            register()
            let attributes: [CFString: Any] = [
                kCTFontFamilyNameAttribute: familyNames[.pixel] ?? "Doto",
                kCTFontVariationAttribute: [weightAxis: Double(role.weight)],
            ]
            base = CTFontCreateWithFontDescriptor(CTFontDescriptorCreateWithAttributes(attributes as CFDictionary), size, nil)
        case .mono:
            let name = role.weight > 500 ? "Courier-Bold" : "Courier"
            base = (NSFont(name: name, size: size) ??
                    NSFont.monospacedSystemFont(ofSize: size, weight: NSFont.Weight(systemWeight(role.weight)))) as CTFont
        default:
            base = NSFont.systemFont(ofSize: size, weight: NSFont.Weight(systemWeight(role.weight))) as CTFont
        }
        guard role.tabular else { return base }
        // Tabular figures, like font-variant-numeric: tabular-nums.
        let features: [CFString: Any] = [kCTFontFeatureSettingsAttribute: [[
            kCTFontFeatureTypeIdentifierKey: kNumberSpacingType,
            kCTFontFeatureSelectorIdentifierKey: kMonospacedNumbersSelector,
        ]]]
        let descriptor = CTFontDescriptorCreateCopyWithAttributes(CTFontCopyFontDescriptor(base), features as CFDictionary)
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
