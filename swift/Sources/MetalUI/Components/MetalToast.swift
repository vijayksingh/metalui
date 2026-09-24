import SwiftUI

// Toast (KAMUI-20). Mirrors components/toast from MetalToastMetrics.

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

/// The toast pill: 44 tall, smoked, the result with its Undo cap.
public struct MetalToast: View {
    let model: MetalToastModel
    let onUndo: () -> Void

    public init(_ model: MetalToastModel, onUndo: @escaping () -> Void = {}) {
        self.model = model
        self.onUndo = onUndo
    }

    public var body: some View {
        HStack(spacing: MetalToastMetrics.gap) {
            HStack(spacing: 6) {
                if model.tone == .success { Text("✓").foregroundColor(MetalShared.success.color).accessibilityLabel("Done") }
                Text(model.title)
                if let sub = model.sub { Text("· \(sub)").foregroundColor(MetalToastMetrics.sub.color) }
            }
            .font(.metal(MetalType.ui)).tracking(MetalType.ui.trackingPoints)
            if model.undo != nil {
                Button {
                    model.undo?()
                    onUndo()
                } label: {
                    HStack(spacing: MetalToastMetrics.undoGap) {
                        Text("Undo").font(.metal(MetalType.ui))
                        MetalKbd("⌘Z", surface: .sunk)
                    }
                    .padding(.leading, MetalToastMetrics.undoPadStart)
                    .padding(.trailing, MetalToastMetrics.undoPadEnd)
                    .frame(height: MetalToastMetrics.undoHeight)
                    .metalRecipe(MetalRecipe(fill: MetalToastMetrics.undoBg, shadows: MetalToastMetrics.undoSh), in: Capsule(style: .continuous))
                }
                .buttonStyle(.plain)
                .keyboardShortcut("z", modifiers: .command)
            }
        }
        .foregroundColor(MetalToastMetrics.ink.color)
        .padding(.leading, MetalToastMetrics.padStart)
        .padding(.trailing, model.undo != nil ? MetalToastMetrics.padEnd : MetalToastMetrics.padStart)
        .frame(height: MetalToastMetrics.height)
        .fixedSize()
        .metalRecipe(MetalRecipe(fill: .solid(MetalToastMetrics.bg), shadows: MetalToastMetrics.sh, backdrop: MetalBackdrop(blur: MetalFrost.blur, saturation: MetalFrost.saturation, dark: true), opaqueFill: MetalFrost.graphite.recipe(in: .graphite).opaqueFill), in: Capsule(style: .continuous))
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
                            insertion: .opacity.combined(with: travel ? .offset(y: MetalToastMetrics.enterRise).combined(with: .scale(scale: MetalToastMetrics.enterScale)) : .identity),
                            removal: .opacity.combined(with: travel ? .offset(y: MetalToastMetrics.enterRise) : .identity)))
                        .task(id: t.id) {
                            guard t.tone != .error else { return }
                            let ms = t.undo != nil ? MetalToastMetrics.undoMs : MetalToastMetrics.plainMs
                            try? await Task.sleep(nanoseconds: UInt64(ms * 1_000_000))
                            if toast?.id == t.id { dismiss() }
                        }
                }
            }
            .padding(.bottom, MetalToastMetrics.bottom)
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
