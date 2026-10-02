import SwiftUI

public enum MetalLinkKind: Sendable { case inline, quiet, standalone }

/// Inline destination with a persistent hairline, physical hover/press and route state.
public struct MetalLink: View {
    private let title: String
    private let destination: URL
    private let external: Bool
    private let visited: Bool
    private let current: Bool
    private let disabled: Bool
    private let reason: String?
    private let loading: Bool
    private let download: Bool
    private let fileSize: String?
    private let kind: MetalLinkKind
    private let action: (() -> Void)?
    @Environment(\.openURL) private var openURL
    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false
    @State private var followed = false
    @State private var visible = false
    @FocusState private var focused: Bool

    public init(_ title: String, destination: URL, external: Bool = false, visited: Bool = false,
                current: Bool = false, disabled: Bool = false, disabledReason: String? = nil,
                loading: Bool = false, download: Bool = false, fileSize: String? = nil,
                kind: MetalLinkKind = .inline, action: (() -> Void)? = nil) {
        self.title = title; self.destination = destination; self.external = external; self.visited = visited
        self.current = current; self.disabled = disabled; self.reason = disabledReason
        self.loading = loading; self.download = download; self.fileSize = fileSize; self.kind = kind; self.action = action
    }
    public var body: some View {
        let r = MetalRecipes.link
        let ink = disabled ? colorway.tokens.ink3.color : colorway.tokens.ink.color
        let quiet = kind == .quiet || (visited && followed)
        let emphasisHeight = r.points("underline.thickness") * 2
        let underline = quiet ? colorway.tokens.ink3.color : r.color("underline.ink", colorway: MetalRecipeColorway(colorway))?.color ?? ink
        Button {
            guard !disabled else { return }
            followed = true
            if let action { action() } else { openURL(destination) }
        } label: {
            HStack(alignment: .firstTextBaseline, spacing: .zero) {
                Text(title).foregroundStyle(ink)
                    .background { if hovering && !disabled && !current { colorway.tokens.menuRowHover.color } }
                    .overlay(alignment: .bottomLeading) {
                        if !current && !disabled {
                            Rectangle().fill(underline).frame(height: r.points("underline.thickness"))
                                .offset(y: r.points("underline.offset"))
                            Rectangle().fill(ink).frame(height: emphasisHeight)
                                .scaleEffect(x: hovering || reduceMotion ? 1 : 0, y: 1, anchor: .leading)
                                .opacity(hovering ? .one : .zero)
                                .offset(y: r.points("underline.offset"))
                        }
                        if loading && visible && !current && !disabled {
                            MetalLinkLoading(ink: ink, reduced: reduceMotion)
                                .frame(height: emphasisHeight).offset(y: r.points("underline.offset"))
                        }
                    }
                if download || external || kind == .standalone {
                    MetalIcon(download ? .download : external ? .external : .arrow, size: MetalRecipes.button.points("compact.glyph"))
                        .padding(.leading, (Double((r.text("out.gap") ?? "").replacingOccurrences(of: "em", with: "")) ?? .zero) * MetalType.ui.size)
                }
                if download, let fileSize { Text(" · \(fileSize)").foregroundStyle(colorway.tokens.ink3.color) }
            }
        }
        .buttonStyle(MetalLinkPressStyle(disabled: disabled))
        .focused($focused).focusEffectDisabled()
        .overlay { if focused { RoundedRectangle(cornerRadius: MetalRecipes.button.points("self.radius")).stroke(MetalShared.focus.color, lineWidth: MetalRecipes.switcher.points("self.focus-width")).padding(-r.points("underline.offset")) } }
        .accessibilityLabel(title + (external && !download ? " (opens externally)" : "") + (disabled ? reason.map { " (\($0))" } ?? " (unavailable)" : ""))
        .accessibilityAddTraits(.isLink)
        .accessibilityValue(current ? "Current page" : loading ? "Loading" : disabled ? "Unavailable" : "")
        .metalTooltip(disabled ? reason ?? "Unavailable" : title)
        .onHover { hovering = $0 }
        .animation(MetalMotion.resolve(.settle, reduceMotion: reduceMotion).animation, value: hovering)
        .onAppear { visible = true }.onDisappear { visible = false }
    }
}
private struct MetalLinkPressStyle: ButtonStyle {
    let disabled: Bool
    @State private var hovering = false
    @Environment(\.accessibilityReduceMotion) private var reduced
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed && !disabled ? MetalRecipes.link.scalar("self.pressed") : .one)
            .offset(y: configuration.isPressed && !disabled && !reduced ? MetalRecipes.button.points("self.travel") : .zero)
            .metalIconInteraction(MetalIconInteraction(isHovered: hovering && !disabled, isPressed: configuration.isPressed && !disabled))
            .onHover { hovering = $0 }
    }
}
private struct MetalLinkLoading: View {
    let ink: Color
    let reduced: Bool
    var body: some View {
        if reduced { Rectangle().fill(ink) }
        else { TimelineView(.animation) { timeline in
            GeometryReader { geometry in
                let r = MetalRecipes.progress
                let ratio = r.scalar("segment.ratio")
                let duration = (Double((r.text("segment.sweep") ?? "").replacingOccurrences(of: "ms", with: "")) ?? .zero) / 1000
                let phase = timeline.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: duration) / duration
                Rectangle().fill(ink).frame(width: geometry.size.width * ratio)
                    .offset(x: geometry.size.width * ((1 + ratio) * phase - ratio))
            }
        }.clipped() }
    }
}
