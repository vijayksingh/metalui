import SwiftUI

// The same object recipe as components/toast.

/// One toast: what happened, an optional detail, Undo, and a tone.
public struct MetalToastModel: Identifiable, Equatable {
    public enum Tone: Sendable { case `default`, success, error }
    public let id = UUID()
    public let title: String
    public let sub: String?
    public let tone: Tone
    /// The toast's one action (Undo unless named otherwise).
    public let undo: (() -> Void)?
    /// The action cap's label; only Undo carries ⌘Z.
    public let actionLabel: String
    public let undoShortcut: Bool
    var isUndo: Bool { actionLabel == Self.undoLabel }
    static let undoLabel = "Undo"

    public init(_ title: String, sub: String? = nil, tone: Tone = .default, undo: (() -> Void)? = nil, undoShortcut: Bool = true) {
        self.title = title
        self.sub = sub
        self.tone = tone
        self.undo = undo
        self.actionLabel = Self.undoLabel
        self.undoShortcut = undoShortcut
    }

    /// A toast whose action is not Undo ("Back to Now").
    public init(_ title: String, sub: String? = nil, tone: Tone = .default, action: String, perform: @escaping () -> Void) {
        self.title = title
        self.sub = sub
        self.tone = tone
        self.undo = perform
        self.actionLabel = action
        self.undoShortcut = false
    }

    public static func == (a: Self, b: Self) -> Bool { a.id == b.id }
}

/// The toast pill: glass in the colorway, the result with its Undo cap, a count after a repeat (×3)
/// and, when it can be dismissed, a quiet close key.
public struct MetalToast: View {
    let model: MetalToastModel
    let count: Int
    let onUndo: () -> Void
    let onClose: (() -> Void)?
    /// A card behind the front of a folded deck: the pill shows, its words don't.
    var concealed = false
    var bindsUndoShortcut = true
    var onFocusChange: ((Bool) -> Void)?
    private enum FocusControl: Hashable { case undo, close }
    @FocusState private var focusedControl: FocusControl?
    @Environment(\.metalColorway) private var colorway

    public init(_ model: MetalToastModel, count: Int = 1, onUndo: @escaping () -> Void = {}, onClose: (() -> Void)? = nil) {
        self.model = model
        self.count = count
        self.onUndo = onUndo
        self.onClose = onClose
    }

    public var body: some View {
        let recipe = MetalRecipes.toast
        let cw = MetalRecipeColorway(colorway)
        return HStack(spacing: recipe.points("self.gap")) {
            HStack(spacing: recipe.points("text.gap")) {
                if model.tone == .success { MetalIcon(.check, size: 14).foregroundColor(MetalShared.success.color).accessibilityLabel("Done") }
                if model.tone == .error { MetalIcon(.warning, size: 14).foregroundColor(MetalShared.red.color).accessibilityLabel("Error") }
                Text(model.title)
                if let sub = model.sub { Text("· \(sub)").foregroundColor((recipe.color("sub.ink", colorway: cw) ?? colorway.tokens.ink2).color) }
                if count > 1 {
                    Text("×\(count)").monospacedDigit()
                        .foregroundColor((recipe.color("sub.ink", colorway: cw) ?? colorway.tokens.ink2).color)
                        .accessibilityLabel("\(count) times")
                }
            }
            .font(recipe.font("self.font"))
            .tracking(recipe.tracking("self.tracking", size: recipe.fontSize("self.font")))
            if model.undo != nil {
                Button {
                    model.undo?()
                    onUndo()
                } label: {
                    HStack(spacing: recipe.points("undo.gap")) {
                        Text(model.actionLabel).font(recipe.font("undo.font"))
                        if model.isUndo && model.undoShortcut { MetalKbd("⌘Z", surface: .sunk) }
                    }
                    .padding(.leading, recipe.points("undo.pad-left"))
                    .padding(.trailing, recipe.points("undo.pad-right"))
                    .frame(height: recipe.points("undo.height"))
                    .metalObjectRecipe(recipe, part: "undo", in: Capsule(style: .continuous))
                }
                .buttonStyle(.plain)
                .keyboardShortcut(model.isUndo && model.undoShortcut && bindsUndoShortcut ? KeyboardShortcut("z", modifiers: .command) : nil)
                .focusable()
                .focused($focusedControl, equals: .undo)
            }
            if let onClose {
                Button(action: onClose) {
                    MetalIcon(.close, size: 14)
                        .frame(width: recipe.points("close.size"), height: recipe.points("close.size"))
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .foregroundColor((recipe.color("close.ink", colorway: cw) ?? colorway.tokens.ink2).color)
                .accessibilityLabel("Dismiss")
                .focusable()
                .focused($focusedControl, equals: .close)
            }
        }
        .opacity(concealed ? Double.zero : .one)
        .foregroundColor((recipe.color("self.ink", colorway: cw) ?? colorway.tokens.ink).color)
        .padding(.leading, recipe.points("self.pad-left"))
        .padding(.trailing, model.undo != nil || onClose != nil ? recipe.points("self.pad-right") : recipe.points("self.pad-left"))
        .frame(height: recipe.points("self.height"))
        .fixedSize(horizontal: !concealed, vertical: true)
        .frame(maxWidth: concealed ? .infinity : nil)
        .metalObjectRecipe(recipe, part: "self", in: Capsule(style: .continuous))
        .background(.ultraThinMaterial, in: Capsule(style: .continuous))
        .accessibilityElement(children: .contain)
        .onChange(of: focusedControl) { onFocusChange?(focusedControl != nil) }
        .onDisappear { onFocusChange?(false) }
    }
}

private struct MetalToastHost: ViewModifier {
    @Binding var toast: MetalToastModel?
    @State private var hovering = false
    @MetalMotionPreference private var reduceMotion

    func body(content: Content) -> some View {
        let travel = MetalMotion.resolve(.settle, reduceMotion: reduceMotion).allowsTravel
        content.overlay(alignment: .bottom) {
            ZStack {
                if let t = toast {
                    MetalToast(t, onUndo: { dismiss() })
                        .id(t.id)
                        // A host that passes presses through (a canvas under its chrome)
                        // must know an actionable toast is there.
                        .metalHitRegion(t.undo != nil)
                        .onHover { hovering = $0 }
                        .transition(.asymmetric(
                            insertion: .opacity.combined(with: travel ? .offset(y: MetalRecipes.toast.points("self.rise")).combined(with: .scale(scale: MetalRecipes.toast.scalar("self.scale"))) : .identity),
                            removal: .opacity.combined(with: travel ? .offset(y: MetalRecipes.toast.points("self.rise")) : .identity)))
                        .task(id: t.id) {
                            guard t.tone != .error else { return }
                            // The clock stops while the pointer is on the toast, so its
                            // Undo is never pulled away mid-reach.
                            var remaining = t.undo != nil ? MetalToastMetrics.undoMs : MetalToastMetrics.plainMs
                            let step = 100.0
                            while remaining > 0 {
                                try? await Task.sleep(nanoseconds: UInt64(step * 1_000_000))
                                if Task.isCancelled { return }
                                if !hovering { remaining -= step }
                            }
                            if toast?.id == t.id { dismiss() }
                        }
                }
            }
            .padding(.bottom, MetalRecipes.toast.points("self.bottom"))
            .metalAnimation(.settle, value: toast)
        }
    }

    private func dismiss() {
        withMetalAnimation(.release, reduceMotion: reduceMotion) { toast = nil }
    }
}

extension View {
    /// Shows one toast at the bottom centre: arrives on settle, leaves on release; undoable toasts stay 5 s,
    /// plain ones 2.6 s, errors until dismissed. The clock pauses while the pointer is on the toast.
    public func metalToast(_ toast: Binding<MetalToastModel?>) -> some View {
        modifier(MetalToastHost(toast: toast))
    }
}

// ─────────────────────────────────────────────────────────
// TOAST DECK: toasts stack in depth, newest in front (the web toast's deck, same recipe)
//
// rest      each card behind is a step smaller (deck.step-scale), peeks deck.peek upward
//           past the card in front, is deck.dim dimmer, its words hidden; deck.visible
//           drawn, the rest counted (+2) above the back card
// arrive    the new card rises self.rise from below, from self.scale, into the front on the
//           object spring; the cards behind step back one on the same spring, together
// fan out   the pointer on the deck: a column deck.gap apart on the surface spring; every
//           clock pauses. The pointer leaves: back into the deck on the surface spring
// swipe     the front card follows the finger (down or right); past deck.swipe on release
//           it leaves on release; short of it, it settles home
// close     its close key: it leaves on release; the next card comes forward
// repeat    the same result as the front card adds no card: it presses to deck.press and
//           springs back on the part spring, and counts (×2); its clock starts over
// Reduce Motion: no travel or scale; cards cross-fade into place.
// ─────────────────────────────────────────────────────────

/// The toasts a host shows as a deck, newest first. Show results into it from the main actor.
@MainActor
@Observable
public final class MetalToastDeck {
    /// One card: the latest model for it and how many times it has been said in a row.
    public struct Card: Identifiable, Equatable {
        public let id: UUID
        public var model: MetalToastModel
        public var count: Int
    }

    /// Newest first.
    public private(set) var cards: [Card] = []
    /// True while the deck is fanned out: every card's clock stops.
    var paused = false
    var focusedCard: UUID?

    public init() {}

    /// Shows a result in front. The same title, detail and tone as the front card counts instead of adding a card.
    public func show(_ model: MetalToastModel) {
        if let front = cards.first, front.model.title == model.title, front.model.sub == model.sub, front.model.tone == model.tone {
            cards[0].model = model
            cards[0].count += 1
            return
        }
        cards.insert(Card(id: model.id, model: model, count: 1), at: 0)
    }

    public func dismiss(_ id: UUID) {
        cards.removeAll { $0.id == id }
        if focusedCard == id { focusedCard = nil }
    }
}

/// The deck at rest or fanned out, without a host: for stills (docs captures, previews).
public struct MetalToastDeckView: View {
    let deck: MetalToastDeck
    let expanded: Bool
    @State private var drag: CGSize = .zero
    @MetalMotionPreference private var reduceMotion

    public init(_ deck: MetalToastDeck, expanded: Bool = false) {
        self.deck = deck
        self.expanded = expanded
    }

    public var body: some View {
        let recipe = MetalRecipes.toast
        let visible = max(1, Int(recipe.scalar("deck.visible")))
        let drawn = Array(deck.cards.prefix(visible))
        let more = deck.cards.count - drawn.count
        let height = recipe.points("self.height")
        let rows = CGFloat(max(1, drawn.count))
        // The deck's area grows with it, so the pointer stays on the deck while it fans out.
        let area = expanded ? rows * height + (rows - 1) * recipe.points("deck.gap") : height + (rows - 1) * recipe.points("deck.peek")
        let travel = MetalMotion.resolve(.object, reduceMotion: reduceMotion).allowsTravel
        let rise = recipe.points("self.rise")
        return ToastDeckLayout(expanded: expanded, height: area) {
            ForEach(Array(drawn.enumerated()), id: \.element.id) { index, card in
                MetalToastDeckCard(deck: deck, card: card, index: index, expanded: expanded,
                                   drag: index == 0 ? drag : .zero, travel: travel,
                                   more: index == drawn.count - 1 ? more : 0,
                                   onDismiss: { dismiss(card.id) })
                    .zIndex(Double(visible - index))
                    .gesture(swipe(card.id), including: index == 0 ? .all : .subviews)
                    .transition(.asymmetric(
                        insertion: .opacity.combined(with: travel ? .offset(y: rise).combined(with: .scale(scale: recipe.scalar("self.scale"), anchor: .top)) : .identity),
                        removal: .opacity.combined(with: travel ? .offset(y: rise) : .identity)))
            }
        }
        .frame(height: area, alignment: .bottom)
        .animation((MetalMotion.resolve(.object, reduceMotion: reduceMotion).animation) ?? MetalMotion.resolve(.settle, reduceMotion: reduceMotion).animation, value: deck.cards.map(\.id))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Notifications")
        .background {
            let undoable = deck.cards.filter { $0.model.undo != nil && $0.model.isUndo && $0.model.undoShortcut }
            if let owner = undoable.first(where: { $0.id == deck.focusedCard }) ?? undoable.first {
                // The shortcut remains available when its card is folded and disabled.
                // EmptyView contributes no extra hit area or keyboard traversal stop.
                Button {
                    owner.model.undo?()
                    dismiss(owner.id)
                } label: { EmptyView() }
                .keyboardShortcut("z", modifiers: .command)
                .accessibilityHidden(true)
                .allowsHitTesting(false)
            }
        }
    }

    private func swipe(_ id: UUID) -> some Gesture {
        let threshold = MetalRecipes.toast.points("deck.swipe")
        return DragGesture(minimumDistance: 1)
            .onChanged { value in
                drag = CGSize(width: max(0, value.translation.width), height: max(0, value.translation.height))
            }
            .onEnded { _ in
                if drag.width > threshold || drag.height > threshold {
                    dismiss(id)
                } else {
                    withMetalAnimation(.settle, reduceMotion: reduceMotion) { drag = .zero }
                }
            }
    }

    private func dismiss(_ id: UUID) {
        withMetalAnimation(.release, reduceMotion: reduceMotion) {
            deck.dismiss(id)
            drag = .zero
        }
    }
}

// Measuring the front during layout also works in still captures: no deferred state or clock.
private struct ToastDeckLayout: Layout {
    let expanded: Bool
    let height: CGFloat
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let widths = subviews.map { $0.sizeThatFits(.unspecified).width }
        return CGSize(width: expanded ? (widths.max() ?? 0) : (widths.first ?? 0), height: height)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let width = subviews.first?.sizeThatFits(.unspecified).width ?? 0
        for (index, view) in subviews.enumerated() {
            view.place(at: CGPoint(x: bounds.midX, y: bounds.maxY), anchor: .bottom,
                       proposal: !expanded && index > 0 ? ProposedViewSize(width: width, height: nil) : .unspecified)
        }
    }
}

/// One card in the deck at its place: its step back (or its row when fanned out), its clock and its press.
private struct MetalToastDeckCard: View {
    let deck: MetalToastDeck
    let card: MetalToastDeck.Card
    let index: Int
    let expanded: Bool
    let drag: CGSize
    let travel: Bool
    let more: Int
    let onDismiss: () -> Void
    @State private var pressed = false
    @MetalMotionPreference private var reduceMotion
    @Environment(\.metalColorway) private var colorway

    var body: some View {
        let recipe = MetalRecipes.toast
        let step = CGFloat(index)
        let scale = expanded ? 1 : 1 - (1 - recipe.scalar("deck.step-scale")) * step
        let lift = expanded ? step * (recipe.points("self.height") + recipe.points("deck.gap")) : step * recipe.points("deck.peek")
        var toast = MetalToast(card.model, count: card.count, onUndo: onDismiss, onClose: onDismiss)
        toast.concealed = index > 0 && !expanded
        toast.bindsUndoShortcut = false
        toast.onFocusChange = { focused in
            if focused { deck.focusedCard = card.id }
            else if deck.focusedCard == card.id { deck.focusedCard = nil }
        }
        return toast
            .overlay(alignment: .topTrailing) {
                if more > 0 {
                    Text("+\(more)")
                        .metalType(MetalType.meta)
                        .foregroundColor((recipe.color("sub.ink", colorway: MetalRecipeColorway(colorway)) ?? colorway.tokens.ink2).color)
                        .padding(.horizontal, recipe.points("text.gap"))
                        .metalObjectRecipe(recipe, part: "undo", in: Capsule(style: .continuous))
                        .fixedSize()
                        .offset(x: -recipe.points("self.pad-left"), y: -MetalType.meta.line / 2)
                        .accessibilityHidden(true)
                }
            }
            .disabled(index > 0 && !expanded)
            .metalHitRegion(true)
            .scaleEffect(pressed && travel ? recipe.scalar("deck.press") : 1)
            .scaleEffect(scale, anchor: .top)
            .offset(x: drag.width, y: drag.height - lift)
            // Stepping back rides the object spring, fanning out the surface spring; Reduce Motion: no travel.
            .animation(travel ? MetalSpringClass.object.spring.animation : nil, value: index)
            .animation(travel ? MetalSpringClass.surface.spring.animation : nil, value: expanded)
            .opacity(expanded ? Double.one : .one - recipe.scalar("deck.dim") * step)
            .accessibilityHidden(index > 0 && !expanded)
            .onChange(of: card.count) {
                // A repeat: a small press, springing back on the part spring.
                pressed = true
                withMetalAnimation(.part, reduceMotion: reduceMotion) { pressed = false }
            }
            .task(id: "\(card.id)-\(card.count)") {
                guard card.model.tone != .error else { return }
                // The clock stops while the deck is fanned out, so an Undo is never pulled away mid-reach.
                var remaining = card.model.undo != nil ? MetalToastMetrics.undoMs : MetalToastMetrics.plainMs
                let tick = 100.0
                while remaining > 0 {
                    try? await Task.sleep(nanoseconds: UInt64(tick * 1_000_000))
                    if Task.isCancelled { return }
                    if !deck.paused { remaining -= tick }
                }
                onDismiss()
            }
    }
}

private struct MetalToastDeckHost: ViewModifier {
    let deck: MetalToastDeck
    @State private var hovering = false
    private var expanded: Bool { hovering || deck.focusedCard != nil }
    @MetalMotionPreference private var reduceMotion

    func body(content: Content) -> some View {
        content.overlay(alignment: .bottom) {
            MetalToastDeckView(deck, expanded: expanded)
                .contentShape(Rectangle())
                .onHover { inside in
                    withMetalAnimation(.surface, reduceMotion: reduceMotion) { hovering = inside }
                }
                .onChange(of: expanded) { deck.paused = expanded }
                .onDisappear { deck.paused = false; deck.focusedCard = nil }
                .padding(.bottom, MetalRecipes.toast.points("self.bottom"))
        }
    }
}

extension View {
    /// Shows a deck of toasts at the bottom centre, newest in front: older ones step back behind it, the pointer
    /// fans them out and pauses their clocks, a swipe or the close key dismisses, a repeat counts.
    public func metalToastDeck(_ deck: MetalToastDeck) -> some View {
        modifier(MetalToastDeckHost(deck: deck))
    }
}
