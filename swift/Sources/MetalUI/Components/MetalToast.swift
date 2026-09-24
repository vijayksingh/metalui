import SwiftUI

// The same object recipe as components/toast.

/// One toast: what happened, an optional detail, Undo, and a tone.
public struct MetalToastModel: Identifiable, Equatable {
    public enum Tone: Sendable { case `default`, success, error }
    public let id = UUID()
    public let title: String
    public let sub: String?
    public let tone: Tone
    public let undo: (() -> Void)?

    public init(_ title: String, sub: String? = nil, tone: Tone = .default, undo: (() -> Void)? = nil) {
        self.title = title
        self.sub = sub
        self.tone = tone
        self.undo = undo
    }

    public static func == (a: Self, b: Self) -> Bool { a.id == b.id }
}

/// The toast pill: smoked glass, the result with its Undo cap.
public struct MetalToast: View {
    let model: MetalToastModel
    let onUndo: () -> Void

    public init(_ model: MetalToastModel, onUndo: @escaping () -> Void = {}) {
        self.model = model
        self.onUndo = onUndo
    }

    public var body: some View {
        let recipe = MetalRecipes.toast
        HStack(spacing: recipe.points("self.gap")) {
            HStack(spacing: recipe.points("text.gap")) {
                if model.tone == .success { Text("✓").foregroundColor(MetalShared.success.color).accessibilityLabel("Done") }
                if model.tone == .error { Text("!").foregroundColor(MetalShared.red.color).accessibilityLabel("Error") }
                Text(model.title)
                if let sub = model.sub { Text("· \(sub)").foregroundColor((recipe.color("sub.ink") ?? MetalToastMetrics.sub).color) }
            }
            .font(recipe.font("self.font"))
            .tracking(recipe.tracking("self.tracking", size: recipe.fontSize("self.font")))
            if model.undo != nil {
                Button {
                    model.undo?()
                    onUndo()
                } label: {
                    HStack(spacing: recipe.points("undo.gap")) {
                        Text("Undo").font(recipe.font("undo.font"))
                        MetalKbd("⌘Z", surface: .sunk)
                    }
                    .padding(.leading, recipe.points("undo.pad-left"))
                    .padding(.trailing, recipe.points("undo.pad-right"))
                    .frame(height: recipe.points("undo.height"))
                    .metalObjectRecipe(recipe, part: "undo", in: Capsule(style: .continuous))
                }
                .buttonStyle(.plain)
                .keyboardShortcut("z", modifiers: .command)
            }
        }
        .foregroundColor((recipe.color("self.ink") ?? MetalToastMetrics.ink).color)
        .padding(.leading, recipe.points("self.pad-left"))
        .padding(.trailing, model.undo != nil ? recipe.points("self.pad-right") : recipe.points("self.pad-left"))
        .frame(height: recipe.points("self.height"))
        .fixedSize()
        .background(.ultraThinMaterial, in: Capsule(style: .continuous))
        .metalObjectRecipe(recipe, part: "self", in: Capsule(style: .continuous))
        .accessibilityElement(children: .contain)
    }
}

private struct MetalToastHost: ViewModifier {
    @Binding var toast: MetalToastModel?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        let travel = MetalMotion.resolve(.settle, reduceMotion: reduceMotion).allowsTravel
        content.overlay(alignment: .bottom) {
            ZStack {
                if let t = toast {
                    MetalToast(t) { dismiss() }
                        .id(t.id)
                        .transition(.asymmetric(
                            insertion: .opacity.combined(with: travel ? .offset(y: MetalRecipes.toast.points("self.rise")).combined(with: .scale(scale: MetalRecipes.toast.scalar("self.scale"))) : .identity),
                            removal: .opacity.combined(with: travel ? .offset(y: MetalRecipes.toast.points("self.rise")) : .identity)))
                        .task(id: t.id) {
                            guard t.tone != .error else { return }
                            let ms = t.undo != nil ? MetalToastMetrics.undoMs : MetalToastMetrics.plainMs
                            try? await Task.sleep(nanoseconds: UInt64(ms * 1_000_000))
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
    /// plain ones 2.6 s, errors until dismissed.
    public func metalToast(_ toast: Binding<MetalToastModel?>) -> some View {
        modifier(MetalToastHost(toast: toast))
    }
}
