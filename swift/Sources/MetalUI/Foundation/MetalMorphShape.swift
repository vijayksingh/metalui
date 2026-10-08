import SwiftUI

/// The material a morphing shape paints while it travels (the web's `mu-morph-<material>`).
public enum MetalMorphMaterial: Sendable {
    /// The graphite-deep surface (Island).
    case graphiteDeep
    /// The tool cap (Fan trays).
    case tool
}

/// Which way a morph goes: `open` rides the part spring, `close` the release spring.
public enum MetalMorphKind: Sendable { case open, close }

/// Change a shape's state as a morph (the web's `morphTo`): the body, its contents and its parts
/// share one spring, the part spring to open and the release spring to close, so nothing inside
/// drifts against the outline. Reduce Motion leaves the crossfade. A change during a running
/// morph starts from the frame on screen (SwiftUI springs keep their velocity).
@MainActor
public func withMetalMorph<Result>(_ kind: MetalMorphKind, reduceMotion: Bool, _ body: () throws -> Result) rethrows -> Result {
    try withMetalAnimation(kind == .open ? .part : .release, reduceMotion: reduceMotion, body)
}

/// ONE SHAPE, MANY STATES (docs/ONE-SHAPE.md), for SwiftUI.
///
/// One body that is always the same view: closed it is the part alone (a capsule, a cap), open it
/// is the part with its contents. Its size follows its layout inside the morph's spring, and its
/// outline is one rounded rectangle whose radius travels with it, so the platform moves a true
/// outline: nothing is swapped, stretched or scaled to fake a size.
///
///     0 ms   the outline travels from the old box to the new, corners true, painted in its material
///     0 ms   the part (in both states) travels with the body; it never dissolves
///     0 ms   arriving contents rise one nest from the growing edge at the popover's enter scale;
///            leaving contents fade (the transaction's spring: part to open, release to close)
/// Reduce Motion: the crossfade, no travel.
///
/// Drive it with `withMetalMorph(_:reduceMotion:)`. Contents that replace one another inside an
/// open shape (a second page) take `.metalMorphContents(from:reduceMotion:)` and their own `id`.
public struct MetalMorphShape<Part: View, Contents: View>: View {
    private let open: Bool
    private let material: MetalMorphMaterial
    private let edge: Edge
    private let closedRadius: CGFloat
    private let openRadius: CGFloat
    private let openWidth: CGFloat?
    private let part: Part
    private let contents: Contents
    @MetalMotionPreference private var reduceMotion

    /// - Parameters:
    ///   - from: the edge the body grows from, where the part and the contents stay pinned:
    ///     `.top` (drops down) or `.leading` (opens sideways).
    ///   - closedRadius: the part's own radius (a capsule's half height); nil keeps `openRadius`.
    ///   - openWidth: the open body's width; nil lets the contents decide.
    public init(open: Bool, material: MetalMorphMaterial, from: Edge = .top,
                closedRadius: CGFloat? = nil, openRadius: CGFloat, openWidth: CGFloat? = nil,
                @ViewBuilder part: () -> Part, @ViewBuilder contents: () -> Contents) {
        self.open = open; self.material = material; self.edge = from
        self.closedRadius = closedRadius ?? openRadius; self.openRadius = openRadius
        self.openWidth = openWidth; self.part = part(); self.contents = contents()
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: open ? openRadius : closedRadius, style: .continuous)
        let layout = edge == .leading || edge == .trailing
            ? AnyLayout(HStackLayout(alignment: .center, spacing: .zero))
            : AnyLayout(VStackLayout(alignment: .center, spacing: .zero))
        layout {
            part
            if open {
                contents
                    .transition(.metalMorphContents(from: edge, reduceMotion: reduceMotion))
            }
        }
        .frame(width: open ? openWidth : nil, alignment: edge == .leading ? .leading : .top)
        .background { paint(shape) }
        .clipShape(shape)
        .contentShape(shape)
    }

    @ViewBuilder private func paint(_ shape: RoundedRectangle) -> some View {
        switch material {
        case .graphiteDeep:
            Color.clear.metalObjectRecipe(MetalRecipes.surface, part: "self", state: "graphite-deep", in: shape)
        case .tool:
            Color.clear.metalObjectRecipe(MetalRecipes.iconButton, part: "tool", in: shape)
        }
    }
}

extension AnyTransition {
    /// Contents arriving in a morphing shape: one nest from the growing edge at the popover's
    /// enter scale, fading in; leaving, they only fade. Reduce Motion: the fade alone.
    public static func metalMorphContents(from edge: Edge, reduceMotion: Bool) -> AnyTransition {
        guard !reduceMotion else { return .opacity }
        let nest = MetalMotionTokens.nest
        let offset: CGSize = switch edge {
        case .top: CGSize(width: .zero, height: -nest)
        case .bottom: CGSize(width: .zero, height: nest)
        case .leading: CGSize(width: -nest, height: .zero)
        case .trailing: CGSize(width: nest, height: .zero)
        }
        let anchor: UnitPoint = switch edge {
        case .top: .top
        case .bottom: .bottom
        case .leading: .leading
        case .trailing: .trailing
        }
        return .asymmetric(
            insertion: .opacity
                .combined(with: .offset(offset))
                .combined(with: .scale(scale: MetalRecipes.popover.scalar("self.enter-scale"), anchor: anchor)),
            removal: .opacity)
    }
}
