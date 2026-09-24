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

    public var body: some View {
        let t = colorway.tokens
        Text(text)
            .font(.metal(MetalType.content))
            .foregroundColor((derived ? t.ink3 : t.ink2).color)
            .padding(.horizontal, MetalCue.tagPadX)
            .padding(.vertical, MetalCue.tagPadY)
            .background {
                let shape = Capsule(style: .continuous)
                if derived {
                    Color.clear.metalRecipe(MetalRecipe(fill: .solid(MetalRGBA(0, 0, 0, 0)), shadows: t.cueDerivedSh), in: shape)
                } else {
                    Color.clear.metalRecipe(MetalRecipe(fill: .solid(t.cueTagBg), shadows: t.cueTagSh), in: shape)
                }
            }
            // The pill's padding is paid back, as on the web, so a row of text keeps its advance.
            .padding(.horizontal, -MetalCue.tagPadX)
    }
}

/// A task's checkbox: a 16 pt well that turns dark with a white tick drawn on (not sprung, DS-21).
/// `doing` shows the half-filled green square; `ghost` the hollow dimple of an inferred task.
public enum MetalDimpleSize: Sendable { case margin, row }

public struct MetalDimple: View {
    @Binding var isOn: Bool
    let doing: Bool
    let ghost: Bool
    let size: MetalDimpleSize
    let label: String

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var hovering = false
    @State private var drawn: CGFloat = 1

    public init(isOn: Binding<Bool>, doing: Bool = false, ghost: Bool = false,
                size: MetalDimpleSize = .margin, label: String) {
        _isOn = isOn
        self.doing = doing
        self.ghost = ghost
        self.size = size
        self.label = label
    }

    public var body: some View {
        let recipe = MetalRecipes.checkbox
        let row = size == .row && !ghost
        let side = recipe.points(ghost ? "ghost.size" : row ? "row.size" : "self.size")
        let radius = recipe.points(ghost ? "ghost.radius" : row ? "row.radius" : "self.radius")
        let tick = row ? "row.tick-" : "tick."
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        let fade = (Double(recipe.text("self.fade")?.replacingOccurrences(of: "ms", with: "") ?? "") ?? .zero) / 1000
        Button {
            isOn.toggle()
            guard isOn else { return }
            drawn = 0
            // 220 ms after a 40 ms beat, ease-out; instant under Reduce Motion.
            let draw = MetalCue.tickMs / 1000
            let wait = MetalCue.tickDelayMs / 1000
            withAnimation(reduceMotion ? nil : .easeOut(duration: draw).delay(wait)) { drawn = 1 }
        } label: {
            ZStack(alignment: .topLeading) {
                Color.clear
                    .frame(width: side, height: side)
                    .metalObjectRecipe(recipe, part: "self",
                                       state: isOn ? "on" : ghost ? "ghost" : hovering ? "hover" : nil,
                                       in: shape)
                if ghost && hovering && !isOn {
                    MetalInnerShadows(layers: recipe.shadows("self", state: "ghost-hover"), shape: shape)
                        .frame(width: side, height: side)
                }
                if isOn {
                    MetalTickShape()
                        .trim(from: 0, to: drawn)
                        .stroke((recipe.color("tick.color") ?? MetalCue.tick).color,
                                style: StrokeStyle(lineWidth: recipe.points("tick.stroke"), lineCap: .round, lineJoin: .round))
                        .frame(width: recipe.points(tick + "w"),
                               height: recipe.points(tick + "h"))
                        .offset(x: recipe.points(tick + "x"), y: recipe.points(tick + "y"))
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
        .overlay {
            if isFocused && isEnabled {
                shape.inset(by: -(MetalButtonMetrics.focusOffset + MetalButtonMetrics.focusWidth / 2))
                    .stroke(MetalShared.focus.color, lineWidth: MetalButtonMetrics.focusWidth)
            }
        }
        .opacity(isEnabled ? .one : MetalButtonMetrics.disabled)
        .accessibilityLabel(label)
        .accessibilityValue(isOn ? "done" : doing ? "mixed" : "open")
        .accessibilityAddTraits(.isToggle)
    }
}

/// The dimple's tick, drawn with trim(0 → 1).
struct MetalTickShape: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.minX, y: rect.minY + rect.height * 0.55))
        p.addLine(to: CGPoint(x: rect.minX + rect.width * 0.38, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        return p
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
    @Environment(\.metalColorway) private var colorway

    public init(_ text: String) { self.text = text }

    public var body: some View {
        Text(text.uppercased())
            .font(.metal(MetalType.label))
            .tracking(MetalType.label.trackingPoints)
            .foregroundColor(colorway.tokens.ink3.color)
            .padding(.horizontal, MetalCue.inferredPad)
            .frame(height: MetalCue.inferredHeight)
            .metalRecipe(MetalRecipe(fill: .solid(MetalRGBA(0, 0, 0, 0)), shadows: MetalCue.inferredRing), in: Capsule(style: .continuous))
    }
}

/// The life glyph trailing a block: a middle dot, then the glyph at 16 (tuned cut), ink3 at rest.
public struct MetalCueLife: View {
    let icon: MetalLifeIconName
    @Environment(\.metalColorway) private var colorway

    public init(_ icon: MetalLifeIconName) { self.icon = icon }

    public var body: some View {
        HStack(spacing: 0) {
            Text("·").foregroundColor(colorway.tokens.ink3.color)
                .padding(.leading, MetalCue.lifeGapBefore)
                .padding(.trailing, MetalCue.lifeGapAfter)
                .accessibilityHidden(true)
            MetalLifeIcon(icon, size: 16)
                .foregroundStyle(colorway.tokens.ink3.color)
                .offset(y: -MetalCue.lifeDrop)
        }
        .accessibilityLabel(icon.label)
    }
}
