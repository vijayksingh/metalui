import SwiftUI

// The cue family. Mirrors the reference cue components and the colorway cue-* tokens.
// In a TextKit editor the in-flow cues are rendering attributes drawn by the host from MetalCue; the
// views here are for SwiftUI surfaces (lens rows, panels, previews) and the margin objects.

/// An in-flow cue kind.
public enum MetalCueKind: Sendable { case date, duration, amount, measurement, tag, derivedTag, hex }

extension Text {
    /// Marks recognised text with its cue. Underline cues keep the text's metrics; tags are drawn by
    /// `MetalCueTag` (a pill needs a background, which `Text` cannot carry).
    public func metalCue(_ kind: MetalCueKind, colorway: MetalColorway, hex: MetalRGBA? = nil) -> Text {
        switch kind {
        case .date:
            return underline(pattern: .dot, color: MetalCue.dateUnderline.color)
        case .duration, .amount:
            return underline(pattern: .solid, color: colorway.tokens.cueQuiet.color)
        case .measurement:
            return underline(pattern: .solid, color: MetalCue.measureUnderline.color)
        case .hex:
            let base = hex ?? colorway.tokens.ink3
            return underline(pattern: .solid, color: base.color.opacity(MetalCue.hexMix))
        case .tag:
            return foregroundColor(colorway.tokens.ink2.color)
        case .derivedTag:
            return foregroundColor(colorway.tokens.ink3.color)
        }
    }
}

/// A tag cue as a view: the soft pill (or the hollow derived pill).
public struct MetalCueTag: View {
    let text: String
    let derived: Bool
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String, derived: Bool = false) {
        self.text = text
        self.derived = derived
    }

    private var tagText: Text {
        if text.hasPrefix("#") { return Text("#").foregroundColor(colorway.tokens.ink2.color) + Text(String(text.dropFirst())).foregroundColor(colorway.tokens.ink.color) }
        return Text(text).foregroundColor(colorway.tokens.ink.color)
    }

    public var body: some View {
        tagText
            .font(.metal(MetalType.content))
            .padding(.horizontal, MetalCue.tagPadX)
            .padding(.vertical, MetalCue.tagPadY)
            .background {
                let shape = MetalCueTab()
                MetalCue.tagColor(text).color.opacity(MetalRecipes.status.scalar("badge.tint"))
                    .overlay { MetalInnerShadows(layers: colorway.tokens.cueTagSh, shape: shape) }
                    .mask(shape.fill(style: FillStyle(eoFill: true)))
                    .overlay { if derived { shape.stroke(colorway.tokens.ink2.color, style: StrokeStyle(lineWidth: MetalCue.quietThickness, dash: [MetalSpace.s2, MetalSpace.s2])) } }
            }
            .padding(.horizontal, -MetalCue.tagPadX)
            .accessibilityLabel(text)
    }
}

/* ─────────────────────────────────────────────────────────
 * DIMPLE (the task's checkbox), in step with checkbox.tsx
 *
 * The tick is the check glyph's own route (MetalTickRoute, from icons/src/acts/check.mjs),
 * drawn by a pen with trim(from: 0, to:) on the 24 grid across the well:
 *    0 ms   the key goes dark
 *   40 ms   tick.delay, a beat: the pen touches down
 *  130 ms   tick.down, easing into the corner (ease-press): the short leg
 *  160 ms   tick.pace, a dwell at the corner
 *  160 ms+  the long leg on the part spring; the tail runs a little past the tip and back
 * Unticking draws it back (tick.withdraw, shared by the legs, the same dwell), then the key
 * goes light. Mixed (`mixed`, a group parent): the dash (the tick laid flat) draws on the part
 * spring; mixed ↔ on bends the dash into the tick on the settle spring.
 * Reduce Motion: the tick or dash is whole, or gone, at once.
 * ───────────────────────────────────────────────────────── */

/// A task's checkbox: a 16 pt well that turns dark while a pen draws the check glyph's tick on.
/// `doing` shows the half-filled green square; `ghost` the hollow dimple of an inferred task;
/// `mixed` (a group parent with some rows on) the dark key with a dash.
public enum MetalDimpleSize: Sendable { case margin, row }

public struct MetalDimple: View {
    @Binding var isOn: Bool
    let doing: Bool
    let ghost: Bool
    let mixed: Bool
    let size: MetalDimpleSize
    let label: String

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @MetalMotionPreference private var reduceMotion
    @State private var hovering = false
    /// The key stays dark while the shared pen takes the tick away.
    @State private var inked: Bool

    public init(isOn: Binding<Bool>, doing: Bool = false, ghost: Bool = false, mixed: Bool = false,
                size: MetalDimpleSize = .margin, label: String) {
        _isOn = isOn
        self.doing = doing
        self.ghost = ghost
        self.mixed = mixed
        self.size = size
        self.label = label
        let mark = MetalDimple.mark(on: isOn.wrappedValue, mixed: mixed, doing: doing)
        _inked = State(initialValue: mark != nil)
    }

    static func mark(on: Bool, mixed: Bool, doing: Bool) -> MetalTickMark? {
        on ? .tick : mixed && !doing ? .dash : nil
    }

    private var mark: MetalTickMark? { MetalDimple.mark(on: isOn, mixed: mixed, doing: doing) }

    public var body: some View {
        let recipe = MetalRecipes.checkbox
        let row = size == .row && !ghost
        let side = recipe.points(ghost ? "ghost.size" : row ? "row.size" : "self.size")
        let radius = recipe.points(ghost ? "ghost.radius" : row ? "row.radius" : "self.radius")
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        let fade = recipe.durationSeconds("self.fade")
        let dark = isOn || inked || mark != nil
        Button {
            isOn.toggle()
        } label: {
            ZStack(alignment: .topLeading) {
                Color.clear
                    .frame(width: side, height: side)
                    .metalObjectRecipe(recipe, part: "self",
                                       state: dark ? "on" : ghost ? "ghost" : hovering ? "hover" : nil,
                                       in: shape)
                if ghost && hovering && !dark {
                    MetalInnerShadows(layers: recipe.shadows("self", state: "ghost-hover"), shape: shape)
                        .frame(width: side, height: side)
                }
                if !ghost {
                    MetalTickGlyph(mark: mark, side: side, color: (recipe.color("tick.color") ?? MetalCue.tick).color) { inked = $0 }
                        .rotationEffect(.degrees(Double(recipe.text("tick.rotate")?.replacingOccurrences(of: "deg", with: "") ?? "") ?? .zero),
                                        anchor: UnitPoint(x: MetalTickRoute.corner.x / MetalTickShape.grid, y: MetalTickRoute.corner.y / MetalTickShape.grid))
                        .allowsHitTesting(false)
                }
                if doing && !isOn {
                    let inset = recipe.points("doing.inset")
                    let inner = side - 2 * inset
                    Color.clear
                        .frame(width: inner, height: inner)
                        .metalObjectRecipe(recipe, part: "doing", in: RoundedRectangle(cornerRadius: recipe.points("doing.radius"), style: .continuous))
                        .opacity(recipe.scalar("doing.opacity"))
                        .offset(x: inset, y: inset)
                }
            }
            .frame(width: side, height: side)
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .animation(reduceMotion ? nil : .easeInOut(duration: fade), value: hovering)
        .animation(reduceMotion ? nil : .easeInOut(duration: fade), value: dark)
        .overlay {
            if isFocused && isEnabled {
                shape.inset(by: -(MetalButtonMetrics.focusOffset + MetalButtonMetrics.focusWidth / 2))
                    .stroke(MetalShared.focus.color, lineWidth: MetalButtonMetrics.focusWidth)
            }
        }
        .opacity(isEnabled ? .one : MetalButtonMetrics.disabled)
        .accessibilityLabel(label)
        .accessibilityValue(isOn ? "done" : doing || mixed ? "mixed" : "open")
        .accessibilityAddTraits(.isToggle)
    }

}

/// Urgency: a 5 pt amber LED in the margin of an open task that is due soon.
public struct MetalCueUrgency: View {
    public init() {}

    public var body: some View {
        Color.clear
            .frame(width: MetalCue.urgencyLed, height: MetalCue.urgencyLed)
            .metalObjectRecipe(MetalRecipes.mark, part: "urgency", in: Circle())
            .accessibilityLabel("Due soon")
    }
}

/// A URL at rest: a 20 pt host pill with the link glyph.
public struct MetalCueURLPill: View {
    let host: String
    let action: () -> Void
    @Environment(\.metalColorway) private var colorway
    @State private var hovering = false

    public init(host: String, action: @escaping () -> Void) {
        self.host = host
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: MetalCue.urlGap) {
                MetalIcon(.link, size: MetalCue.urlGlyph)
                Text(host).font(.metal(MetalType.ui))
            }
            .foregroundColor(colorway.tokens.cueUrlInk.color)
            .padding(.leading, MetalCue.urlPadStart)
            .padding(.trailing, MetalCue.urlPadEnd)
            .frame(height: MetalCue.urlHeight)
            .metalRecipe(MetalRecipe(fill: .solid(hovering ? MetalCue.urlBgHover : MetalCue.urlBg), shadows: MetalCue.urlRing), in: Capsule(style: .continuous))
            .metalAnimation(.settle, value: hovering)
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .accessibilityLabel("Link, \(host)")
    }
}

/// A value the recognizer read that is not in the text: a hollow pill in the label role.
public struct MetalCueInferred: View {
    let text: String
    let confirmed: Bool
    let onConfirm: (() -> Void)?
    @Environment(\.metalColorway) private var colorway
    @FocusState private var focused: Bool
    @State private var act = 0

    public init(_ text: String, confirmed: Bool = false, onConfirm: (() -> Void)? = nil) {
        self.text = text; self.confirmed = confirmed; self.onConfirm = onConfirm
    }
    private var face: some View {
        Text(text.uppercased())
            .font(.metal(MetalType.readout))
            .tracking(MetalType.readout.trackingPoints)
            .foregroundColor((confirmed ? colorway.tokens.ink : colorway.tokens.ink2).color)
            .padding(.horizontal, MetalCue.inferredPad)
            .frame(height: MetalCue.inferredHeight)
            .background {
                Capsule().stroke(colorway.tokens.ink2.color, style: StrokeStyle(lineWidth: MetalCue.quietThickness, dash: confirmed ? [] : [MetalSpace.s2, MetalSpace.s2]))
            }
            .overlay(alignment: .topTrailing) {
                if confirmed { MetalIcon(.check, size: MetalRecipes.button.points("compact.glyph"), act: act).offset(y: -MetalCue.inferredHeight).accessibilityHidden(true) }
            }
    }
    public var body: some View {
        Group {
            if let onConfirm {
                Button(action: onConfirm) { face }.buttonStyle(.plain).focused($focused)
                    .onChange(of: focused) { _, isFocused in if isFocused && !confirmed { onConfirm() } }
            } else { face }
        }
        .accessibilityLabel(confirmed ? text : "Suggestion, \(text)")
        .onChange(of: confirmed) { _, value in if value { act += 1 } }
    }
}

/// The life glyph trailing a block: a middle dot, then the glyph at 16 (tuned cut), ink3 at rest.
public struct MetalCueLife: View {
    let icon: MetalLifeIconName
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalIconInteraction) private var hostInteraction
    @State private var ownHover = false

    public init(_ icon: MetalLifeIconName) { self.icon = icon }

    public var body: some View {
        let hovered = hostInteraction?.isHovered ?? ownHover
        HStack(spacing: .zero) {
            Text("·").foregroundColor(colorway.tokens.ink3.color)
                .padding(.leading, MetalCue.lifeGapBefore)
                .padding(.trailing, MetalCue.lifeGapAfter)
                .accessibilityHidden(true)
            MetalLifeIcon(icon)
                .foregroundStyle((hovered ? colorway.tokens.ink2 : colorway.tokens.ink3).color)
                .offset(y: -MetalCue.lifeDrop)
        }
        .onHover { ownHover = $0 }
        .accessibilityLabel(icon.label)
    }
}

/// The display grammar on a SwiftUI text surface. TextKit hosts draw these attributes themselves.
public enum MetalCueMeaning: Sendable { case time, money, sleep, steps, colour, person }

public struct MetalCueText: View {
    private let text: String
    private let kind: MetalCueKind
    private let meaning: MetalCueMeaning?
    private let label: String?
    private let color: MetalRGBA?
    private let raw: Bool
    private let recognition: String?
    private let formatted: String?
    private let personGlyph: AnyView?
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    @State private var shown = false
    @State private var seen: String?
    @State private var act = 0

    public init(_ text: String, kind: MetalCueKind, meaning: MetalCueMeaning? = nil,
                label: String? = nil, color: MetalRGBA? = nil, raw: Bool = false, recognition: String? = nil, formatted: String? = nil, personGlyph: AnyView? = nil) {
        self.text = text; self.kind = kind; self.meaning = meaning; self.label = label
        self.color = color; self.raw = raw; self.recognition = recognition; self.formatted = formatted; self.personGlyph = personGlyph
    }
    private var side: Double { MetalRecipes.button.points("compact.glyph") }
    private var clearance: Double { side + MetalSpace.s2 }
    public var body: some View {
        Group {
            if kind == .tag || kind == .derivedTag {
                MetalCueTag(text, derived: kind == .derivedTag).opacity(raw ? .zero : .one)
                    .overlay { if raw { Text(text).font(.metal(MetalType.content)) } }
            } else if let formatted {
                ZStack(alignment: .leading) {
                    Text(text.count > formatted.count ? text : formatted).hidden().accessibilityHidden(true)
                    Text(raw ? text : formatted)
                        .contentTransition(reduceMotion ? .opacity : .numericText())
                        .metalAnimation(.settle, value: raw)
                }.font(.metal(MetalType.content)).monospacedDigit()
            } else {
                (raw ? Text(text) : Text(text).metalCue(kind, colorway: colorway, hex: color))
                    .font(.metal(MetalType.content))
                    .monospacedDigit()
            }
        }
        .foregroundStyle(colorway.tokens.ink.color)
        .overlay(alignment: .topLeading) {
            if let meaning {
                Group {
                    switch meaning {
                    case .time: MetalIcon(.clock, size: side, act: act)
                    case .money: MetalIcon(.coin, size: side, act: act)
                    case .sleep: MetalIcon(.moon, size: side, act: act)
                    case .steps: MetalLifeIcon(.steps, size: side)
                    case .colour: RoundedRectangle(cornerRadius: MetalCue.swatchRadius).fill((color ?? colorway.tokens.ink).color)
                    case .person: if let personGlyph { personGlyph }
                    }
                }
                .frame(width: side, height: side)
                .offset(y: -(side + MetalSpace.s2))
                .opacity(raw ? .zero : .one)
                .scaleEffect(shown || reduceMotion ? .one : MetalSuggestion.enterScale)
                .accessibilityHidden(true)
            }
        }
        .padding(.top, clearance)
        .help(label ?? text)
        .accessibilityLabel(text)
        .onAppear { recognise() }
        .onChange(of: recognition) { _, _ in recognise() }
        .onChange(of: raw) { _, _ in recognise() }
        .metalAnimation(.settle, value: raw)
    }
    private func recognise() {
        guard !raw else { return }
        guard let recognition, recognition != seen else { shown = true; return }
        seen = recognition
        act += 1
        withMetalAnimation(.object, reduceMotion: reduceMotion) { shown = true }
    }
}

private struct MetalCueTab: Shape {
    func path(in rect: CGRect) -> Path {
        let tip = MetalCue.tagPadX
        var path = Path()
        path.move(to: rect.origin)
        path.addLine(to: CGPoint(x: rect.maxX - tip, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.maxX - tip, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        path.addEllipse(in: CGRect(x: rect.maxX - tip - MetalSpace.s2, y: rect.midY - MetalSpace.s2,
                                  width: MetalSpace.s2 * 2, height: MetalSpace.s2 * 2))
        return path
    }
}
