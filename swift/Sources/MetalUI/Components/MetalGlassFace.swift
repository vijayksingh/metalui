import SwiftUI

// Glass faces. Mirrors the glass-face recipe (MetalRecipes.glassFace): a dark bezel around a
// screen with a glare and a shaded rim, a tag with an LED. A link face glows in a hue taken from
// its host; a code face shows numbered lines. Every value is the recipe's.

/// A tag on a glass screen: an LED and a condensed mono label on a smoked chip.
private struct MetalGlassTag: View {
    let text: String
    let led: String
    var part = "tag"

    var body: some View {
        let r = MetalRecipes.glassFace
        let role = r.typeRole("tag.font", trackingKey: "tag.tracking")
        let ledSize = r.points("tag.led")
        HStack(spacing: r.points("tag.gap")) {
            if !led.isEmpty {
                Color.clear
                    .frame(width: ledSize, height: ledSize)
                    .metalObjectRecipe(r, part: "tag-led", state: led, in: Circle())
            }
            Text(text.uppercased())
                .font(.metal(role))
                .tracking(role.trackingPoints)
                .foregroundStyle((r.color(part == "tag" ? "tag.ink" : "open.ink") ?? MetalRGBA(0, 0, 0, 0)).color)
        }
        .padding(.horizontal, r.points("tag.pad-x"))
        .frame(height: r.points("tag.height"))
        .metalObjectRecipe(r, part: part, in: RoundedRectangle(cornerRadius: r.points("tag.radius"), style: .continuous))
    }
}

/// The bezel and screen every glass face shares; `screen` names the screen's fill part.
private struct MetalGlassBody<Content: View>: View {
    let screen: String
    let own: MetalRGBA?
    let screenRecipe: MetalObjectRecipe?
    let content: Content

    init(screen: String, own: MetalRGBA? = nil, screenRecipe: MetalObjectRecipe? = nil, @ViewBuilder content: () -> Content) {
        self.screen = screen
        self.own = own
        self.screenRecipe = screenRecipe
        self.content = content()
    }

    /// The screen's radial glow as an ellipse sized like the CSS one (its `reach` is the ellipse's
    /// horizontal radius over the screen's width, the recipe's `<screen>.reach`).
    private var glow: (stops: [MetalRecipeStop], center: UnitPoint, reach: CGFloat)? {
        let r = MetalRecipes.glassFace
        guard let reach = r.number(screen + ".reach"),
              case .radial(let center, let stops)? = r.fills(screen).first else { return nil }
        return (stops, UnitPoint(x: center.x, y: center.y), reach)
    }

    var body: some View {
        let r = MetalRecipes.glassFace
        let screenShape = RoundedRectangle(cornerRadius: r.points("screen.radius"), style: .continuous)
        ZStack {
            Color.clear.metalObjectRecipe(r, part: "screen", in: screenShape)
            if let glow {
                // CSS `radial-gradient(120% 90% at 85% 0%, …)`: an ellipse wider than the screen.
                screenShape.fill(EllipticalGradient(
                    stops: glow.stops.map { Gradient.Stop(color: $0.paint.resolved(self: own).color, location: $0.location) },
                    center: glow.center, startRadiusFraction: 0, endRadiusFraction: glow.reach))
            } else {
                Color.clear.metalObjectRecipe(r, part: screen, in: screenShape, self: own)
            }
            if let screenRecipe {
                Color.clear.metalObjectRecipe(screenRecipe, part: "screen", in: screenShape)
            }
            Color.clear.metalObjectRecipe(r, part: "glare", in: screenShape)
            content
        }
        .clipShape(screenShape)
        .padding(r.points("self.pad"))
        .metalObjectRecipe(r, part: "self", in: RoundedRectangle(cornerRadius: r.points("self.radius"), style: .continuous))
    }
}

/// An image inside the shared glass bezel. The screen glare sits over the
/// pixels, as the reference's `.glass .screen::after` does.
public struct MetalImageFace<Content: View>: View {
    public let size: CGSize
    private let content: Content

    public init(size: CGSize, @ViewBuilder content: () -> Content) {
        self.size = size
        self.content = content()
    }

    public var body: some View {
        let recipe = MetalRecipes.glassFace
        let pad = recipe.points("self.pad")
        let screen = RoundedRectangle(cornerRadius: recipe.points("screen.radius"), style: .continuous)
        ZStack {
            Color.clear.metalObjectRecipe(recipe, part: "screen", in: screen)
            content
                .frame(width: max(.zero, size.width - pad - pad), height: max(.zero, size.height - pad - pad))
                .clipped()
            Color.clear.metalObjectRecipe(recipe, part: "glare", in: screen)
                .allowsHitTesting(false)
        }
        .frame(width: max(.zero, size.width - pad - pad), height: max(.zero, size.height - pad - pad))
        .clipShape(screen)
        .padding(pad)
        .metalObjectRecipe(recipe, part: "self", in: RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous))
        .frame(width: size.width, height: size.height)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Image")
    }
}

/// A link as a glass object: its host large, its path engraved, a LINK tag and an OPEN key.
public struct MetalLinkFace: View {
    let url: URL?
    let raw: String
    let open: (() -> Void)?

    public init(_ href: String, open: (() -> Void)? = nil) {
        self.raw = href
        self.url = URL(string: href)
        self.open = open
    }

    public var body: some View {
        let r = MetalRecipes.glassFace
        let host = Self.host(url, raw: raw)
        let path = Self.path(url)
        let domain = r.typeRole("domain.font", trackingKey: "domain.tracking")
        let pathRole = r.typeRole("path.font", trackingKey: "path.tracking")
        let inset = r.points("tag.inset")
        let pad = r.points("self.pad")
        MetalGlassBody(screen: "link-screen", own: Self.hue(for: host)) {
            ZStack(alignment: .topLeading) {
                MetalGlassTag(text: "Link", led: "link").padding(inset)
                HStack {
                    Spacer(minLength: 0)
                    Button { open?() } label: { MetalGlassTag(text: "Open ↗", led: "", part: "open") }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Open \(host)")
                }
                .padding(inset)
                VStack(alignment: .leading, spacing: 0) {
                    Spacer(minLength: 0)
                    Text(host).font(.metal(domain)).tracking(domain.trackingPoints)
                        .foregroundStyle((r.color("domain.ink") ?? MetalRGBA(0, 0, 0, 0)).color).lineLimit(1)
                    Text(path.uppercased()).font(.metal(pathRole)).tracking(pathRole.trackingPoints)
                        .foregroundStyle((r.color("path.ink") ?? MetalRGBA(0, 0, 0, 0)).color)
                        .lineLimit(1).truncationMode(.tail)
                }
                .padding(.horizontal, r.points("link.pad-x"))
                .padding(.vertical, r.points("link.pad-y"))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            }
        }
        .frame(width: r.points("link.width"), height: (r.points("link.height")) + (pad + pad))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Link \(host)")
    }

    /// The face's size for layout.
    public static var size: CGSize {
        let r = MetalRecipes.glassFace
        return CGSize(width: r.points("link.width"), height: (r.points("link.height")) + 2 * (r.points("self.pad")))
    }

    static func host(_ url: URL?, raw: String) -> String {
        let h = url?.host ?? raw
        return h.hasPrefix("www.") ? String(h.dropFirst(4)) : h
    }

    static func path(_ url: URL?) -> String {
        let p = ((url?.path ?? "") + (url?.query.map { "?" + $0 } ?? "")).removingPercentEncoding ?? ""
        return p.isEmpty ? "/" : p
    }

    /// The host's hue: a stable hash of its UTF-16 units into hsl(h 38% 32%).
    public static func hue(for host: String) -> MetalRGBA {
        var h = 0
        for unit in host.utf16 { h = (h * 31 + Int(unit)) % 360 }
        let s = 0.38, l = 0.32
        let c = (1 - abs(2 * l - 1)) * s
        let x = c * (1 - abs((Double(h) / 60).truncatingRemainder(dividingBy: 2) - 1))
        let m = l - c / 2
        let (r, g, b): (Double, Double, Double)
        switch h {
        case 0..<60: (r, g, b) = (c, x, 0)
        case 60..<120: (r, g, b) = (x, c, 0)
        case 120..<180: (r, g, b) = (0, c, x)
        case 180..<240: (r, g, b) = (0, x, c)
        case 240..<300: (r, g, b) = (x, 0, c)
        default: (r, g, b) = (c, 0, x)
        }
        return MetalRGBA((r + m) * 255, (g + m) * 255, (b + m) * 255, 1)
    }
}

/// Code as a glass object: a CODE tag (language, line count) and numbered lines.
public enum MetalCodeDiffClass: String, Sendable {
    case add, remove, context
}

public struct MetalCodeFace: View {
    let code: String
    let language: String?
    let diff: [MetalCodeDiffClass]?

    public init(_ code: String, language: String? = nil, diff: [MetalCodeDiffClass]? = nil) {
        self.code = code
        self.language = language
        self.diff = diff
    }

    public var body: some View {
        let r = MetalRecipes.codeCard
        let role = r.typeRole("code.font", trackingKey: "code.tracking")
        let all = code.components(separatedBy: "\n")
        let lines = Array(all.prefix(Int(r.points("code.number"))))
        let classes = diff ?? (language == "diff" ? Self.diffClasses(code) : [])
        let label = "Code" + (language.map { " · " + $0 } ?? "") + " · \(all.count) " + (all.count == 1 ? "line" : "lines")
        let lineHeight = r.lineHeight("code.font")
        MetalGlassBody(screen: "screen", screenRecipe: r) {
            ZStack(alignment: .topLeading) {
                MetalChip(.glass) {
                    MetalChipLead(led: .code) { EmptyView() }
                    MetalChipText { Text(label.uppercased()) }
                }
                .padding(r.points("chip.inset"))
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(lines.enumerated()), id: \.offset) { index, line in
                        let rowClass = index < classes.count ? classes[index] : .context
                        let signed = rowClass == .add || rowClass == .remove
                        HStack(spacing: 0) {
                            Text("\(index + 1)")
                                .foregroundStyle((r.color("tint.line") ?? MetalRGBA(0, 0, 0, 0)).color)
                                .frame(width: r.points("code.number"), alignment: .leading)
                            if signed {
                                Text(String(line.prefix(1)))
                                    .foregroundStyle((r.color(rowClass == .add ? "diff.add-ink" : "diff.remove-ink") ?? MetalRGBA(0, 0, 0, 0)).color)
                            }
                            Self.highlighted(signed ? String(line.dropFirst()) : line)
                        }
                        .font(.metal(role))
                        .tracking(role.trackingPoints)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(height: lineHeight, alignment: .leading)
                        .background {
                            if rowClass == .add || rowClass == .remove {
                                (r.color(rowClass == .add ? "diff.add-bg" : "diff.remove-bg") ?? MetalRGBA(0, 0, 0, 0)).color
                            }
                        }
                        .lineLimit(1)
                    }
                }
                .padding(.top, r.points("screen.pad-top"))
                .padding(.horizontal, r.points("screen.pad-x"))
                .padding(.bottom, r.points("screen.pad-bottom"))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .accessibilityElement(children: .combine)
        .frame(width: Self.size(for: code).width, height: Self.size(for: code).height)
        .accessibilityLabel(label)
    }

    /// Core-compatible fallback when a host has no diff classes.
    public static func diffClasses(_ code: String) -> [MetalCodeDiffClass] {
        code.components(separatedBy: "\n").map { line in
            if line.hasPrefix("+") && !line.hasPrefix("+++") { return .add }
            if line.hasPrefix("-") && !line.hasPrefix("---") { return .remove }
            return .context
        }
    }

    // Match each source token once. SwiftUI Text runs never become input to later matches.
    private static let tokenPattern = try! NSRegularExpression(
        pattern: "(\".*?\"|'.*?')|(\\/\\/.*$|#(?!\\d).*$)|(\\b(?:func|let|var|if|else|return|for|in|while|const|function|import|export|from|class|struct|enum|case|switch|guard|def|async|await|new|true|false|nil|null|self|this)\\b)|(\\b[A-Z][A-Za-z0-9]+\\b)|((?<![\\w#&])\\d+(?:\\.\\d+)?\\b)"
    )

    /// One line with the recipe's syntax inks: strings, a trailing comment, keywords, Types, numbers.
    static func highlighted(_ line: String) -> Text {
        let r = MetalRecipes.codeCard
        func ink(_ key: String) -> Color { (r.color(key) ?? MetalRGBA(0, 0, 0, 0)).color }
        let source = line as NSString
        var out = Text("")
        var cursor = 0
        let keys = ["tint.string", "tint.comment", "tint.keyword", "tint.type", "tint.number"]
        for match in tokenPattern.matches(in: line, range: NSRange(location: 0, length: source.length)) {
            if match.range.location > cursor {
                out = out + Text(source.substring(with: NSRange(location: cursor, length: match.range.location - cursor))).foregroundColor(ink("code.ink"))
            }
            let group = (1...keys.count).first { match.range(at: $0).location != NSNotFound }
            out = out + Text(source.substring(with: match.range)).foregroundColor(ink(group.map { keys[$0 - 1] } ?? "code.ink"))
            cursor = NSMaxRange(match.range)
        }
        if cursor < source.length {
            out = out + Text(source.substring(from: cursor)).foregroundColor(ink("code.ink"))
        }
        return out
    }

    /// The face's size for `code`: the widest line (clamped to the recipe's width range) by its lines.
    public static func size(for code: String) -> CGSize {
        let r = MetalRecipes.codeCard
        let role = r.typeRole("code.font", trackingKey: "code.tracking")
        let font = MetalFonts.ctFont(role, size: role.size)
        let lines = Array(code.components(separatedBy: "\n").prefix(Int(r.points("code.number"))))
        let widest = lines.map { line -> Double in
            let attributed = NSAttributedString(string: line, attributes: [
                NSAttributedString.Key(kCTFontAttributeName as String): font,
                NSAttributedString.Key(kCTKernAttributeName as String): role.trackingPoints,
            ])
            return Double(CTLineGetTypographicBounds(CTLineCreateWithAttributedString(attributed), nil, nil, nil))
        }.max() ?? 0
        let pad = MetalRecipes.glassFace.points("self.pad")
        let inner = widest.rounded(.up) + r.points("code.number") + 2 * r.points("screen.pad-x")
        let width = min(r.points("self.max-width"), max(r.points("self.min-width"), inner + (pad + pad)))
        let height = (pad + pad) + r.points("screen.pad-top") + Double(max(Int(Double.one), lines.count)) * r.lineHeight("code.font")
            + r.points("screen.pad-bottom")
        return CGSize(width: width, height: height.rounded())
    }
}
