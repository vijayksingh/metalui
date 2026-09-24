import SwiftUI

// Selection frame. Mirrors components/selection-frame: every value is MetalPresence
// (tokens.json presence). The frame overlays its object and reads the object's own frame, so it
// tracks a resize or a keystroke in the same layout pass.

/// Which part of the selection frame is showing.
public enum MetalSelectionState: Sendable {
    /// Nothing: a borderless object has no edge at rest.
    case rest
    /// Faint corner dots where the handles will be.
    case hover
    /// Ring, handles and readout.
    case selected
}

/// The one selection, or its quiet form (a multi-selection member, or a selection made by finishing).
public enum MetalSelectionVariant: Sendable { case ring, lite }

/// Writing dims the readout to .78; moving returns it to 1.
public enum MetalSelectionMode: Sendable { case idle, writing, moving }

/// Eight handles on the ring line.
public enum MetalSelectionHandle: String, CaseIterable, Sendable {
    case nw, n, ne, e, se, s, sw, w

    /// Position on the object's frame (0…1) and the outward direction of the ring offset.
    var anchor: (x: CGFloat, y: CGFloat, ox: CGFloat, oy: CGFloat) {
        switch self {
        case .nw: return (0, 0, -1, -1)
        case .n: return (0.5, 0, 0, -1)
        case .ne: return (1, 0, 1, -1)
        case .e: return (1, 0.5, 1, 0)
        case .se: return (1, 1, 1, 1)
        case .s: return (0.5, 1, 0, 1)
        case .sw: return (0, 1, -1, 1)
        case .w: return (0, 0.5, -1, 0)
        }
    }

    var isCorner: Bool { [.nw, .ne, .se, .sw].contains(self) }
}

/// Which handles show: all eight resize (object), n and s are grips that move a text block (text), or none.
public enum MetalSelectionHandles: Sendable { case object, text, none }

/// A band edge under the pointer, for the edge light.
public enum MetalSelectionEdge: Sendable { case n, e, s, w }

/// A band corner under the pointer, including while selected.
public enum MetalSelectionCorner: Sendable {
    case nw, ne, se, sw

    var handle: MetalSelectionHandle {
        switch self {
        case .nw: return .nw
        case .ne: return .ne
        case .se: return .se
        case .sw: return .sw
        }
    }
}

private struct MetalSelectionFrameModifier: ViewModifier {
    let state: MetalSelectionState
    let variant: MetalSelectionVariant
    let mode: MetalSelectionMode
    let radius: CGFloat
    let handles: MetalSelectionHandles
    let readout: Bool
    let count: Int?
    let copied: String?
    let edge: MetalSelectionEdge?
    let corner: MetalSelectionCorner?
    let onHandleDrag: ((MetalSelectionHandle, DragGesture.Value) -> Void)?

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var entered = false

    private var offset: CGFloat { MetalRing.selectOffset }

    func body(content: Content) -> some View {
        content.overlay {
            GeometryReader { geo in
                let size = geo.size
                ZStack(alignment: .topLeading) {
                    ring(size)
                    if state == .hover { dots(size) }
                    cornerGlows(size)
                    if let edge, state != .selected { edgeLight(edge, size) }
                    if state == .selected, variant == .ring, handles != .none { handleViews(size) }
                    if state == .selected, readout { readoutView(size) }
                }
            }
            .allowsHitTesting(state == .selected && handles != .none)
        }
        .onChange(of: state == .selected, initial: true) { _, selected in
            // Entrance: 1.02 → 1 on the part spring, once per selection; resizing never replays it.
            guard selected, variant == .ring else { entered = selected; return }
            entered = false
            withMetalAnimation(.part, reduceMotion: reduceMotion) { entered = true }
        }
    }

    private func ring(_ size: CGSize) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius + offset, style: .continuous)
        let rect = CGRect(x: -offset, y: -offset, width: size.width + 2 * offset, height: size.height + 2 * offset)
        let lite = variant == .lite
        return ZStack {
            if !lite {
                // The collar: a flat band outside the ring, never a blur.
                shape.inset(by: -(MetalPresence.ringWidth + MetalPresence.collarWidth / 2))
                    .stroke(MetalPresence.collar.color, lineWidth: MetalPresence.collarWidth)
            }
            shape.inset(by: -(lite ? MetalPresence.liteWidth : MetalPresence.ringWidth) / 2)
                .stroke((lite ? MetalPresence.lite : MetalPresence.ringColor(in: colorway)).color, lineWidth: lite ? MetalPresence.liteWidth : MetalPresence.ringWidth)
        }
        .frame(width: rect.width, height: rect.height)
        .scaleEffect(state == .selected && !entered && variant == .ring ? MetalPresence.enterScale : 1)
        .opacity(state == .selected && (entered || variant == .lite) ? MetalPresence.guide.alpha : MetalShared.zero)
        .offset(x: rect.minX, y: rect.minY)
        .accessibilityHidden(true)
    }

    private func point(_ handle: MetalSelectionHandle, _ size: CGSize) -> CGPoint {
        let a = handle.anchor
        return CGPoint(x: a.x * size.width + a.ox * offset, y: a.y * size.height + a.oy * offset)
    }

    private func dots(_ size: CGSize) -> some View {
        ForEach([MetalSelectionHandle.nw, .ne, .se, .sw], id: \.self) { corner in
            Circle()
                .fill(colorway.tokens.presenceDot.color)
                .frame(width: MetalPresence.hoverDot, height: MetalPresence.hoverDot)
                .position(point(corner, size))
        }
        .transition(.opacity)
    }

    private func edgeLight(_ edge: MetalSelectionEdge, _ size: CGSize) -> some View {
        let horizontal = edge == .n || edge == .s
        let light = MetalPresence.edgeLight.color
        let fade = Gradient(stops: [.init(color: light.opacity(MetalShared.zero), location: 0), .init(color: light, location: 0.22), .init(color: light, location: 0.78), .init(color: light.opacity(MetalShared.zero), location: 1)])
        return Rectangle()
            .fill(LinearGradient(gradient: fade, startPoint: horizontal ? .leading : .top, endPoint: horizontal ? .trailing : .bottom))
            .frame(width: horizontal ? size.width : MetalPresence.edgeLightWidth, height: horizontal ? MetalPresence.edgeLightWidth : size.height)
            .position(x: edge == .e ? size.width : edge == .w ? 0 : size.width / 2, y: edge == .s ? size.height : edge == .n ? 0 : size.height / 2)
    }

    private func cornerGlows(_ size: CGSize) -> some View {
        let diameter = MetalPresence.handle * 2
        // CSS box-shadow blur is twice SwiftUI's shadow radius.
        let blur = MetalPresence.handle / 6
        return ForEach([MetalSelectionCorner.nw, .ne, .se, .sw], id: \.self) { position in
            Circle()
                .fill(MetalPresence.edgeLight.color)
                .frame(width: diameter, height: diameter)
                .shadow(color: MetalPresence.edgeLight.color, radius: blur)
                .position(point(position.handle, size))
                .opacity(corner == position ? MetalPresence.cornerGlow : MetalShared.zero)
                .metalAnimation(.settle, value: corner)
                .accessibilityHidden(true)
        }
    }

    private func handleViews(_ size: CGSize) -> some View {
        ForEach(MetalSelectionHandle.allCases, id: \.self) { handle in
            let grip = handles == .text && (handle == .n || handle == .s)
            let vertical = handle == .e || handle == .w
            let w = handle.isCorner ? MetalPresence.handle : vertical ? MetalPresence.capsuleThickness : MetalPresence.capsuleLength
            let h = handle.isCorner ? MetalPresence.handle : vertical ? MetalPresence.capsuleLength : MetalPresence.capsuleThickness
            let shape = Capsule(style: .continuous)
            Group {
                if grip {
                    Color.clear.metalRecipe(MetalRecipe(fill: MetalPresence.gripBg, shadows: MetalPresence.gripSh), in: shape)
                } else {
                    shape.fill(MetalPresence.handleBg.gradient(diameter: max(w, h)))
                        .background { MetalOuterShadows(layers: MetalPresence.handleSh.filter { !$0.inset }, shape: shape) }
                        .overlay { MetalInnerShadows(layers: MetalPresence.handleSh.filter(\.inset), shape: shape) }
                }
            }
            .frame(width: w, height: h)
            // Each handle's hit area reaches 7 pt past its drawn shape.
            .contentShape(Rectangle().inset(by: -MetalPresence.handleHit))
            .position(point(handle, size))
            .opacity(entered || variant == .lite ? MetalPresence.guide.alpha : MetalShared.zero)
            .gesture(DragGesture(minimumDistance: 0, coordinateSpace: .global).onChanged { onHandleDrag?(handle, $0) })
            .help(grip ? "Drag to move" : handles == .text ? "Drag to set the width · double-click to fit the text" : "")
        }
    }

    private func readoutView(_ size: CGSize) -> some View {
        MetalSizeReadout(size: size, count: count, copied: copied)
            .opacity(mode == .writing ? MetalPresence.readoutWriting : MetalPresence.guide.alpha)
            .metalAnimation(.settle, value: mode)
            .position(x: size.width / 2, y: size.height + MetalPresence.readoutGap + MetalPresence.readoutHeight / 2)
            .accessibilityHidden(true)
    }
}

extension View {
    /// A selection frame around this view: the one selection for every kind of object.
    ///
    ///     note.metalSelectionFrame(isSelected ? .selected : isHovered ? .hover : .rest, radius: MetalRadius.plate)
    ///
    /// The object keeps its own accessibility: mark it `.accessibilityAddTraits(.isSelected)` while selected.
    public func metalSelectionFrame(
        _ state: MetalSelectionState,
        variant: MetalSelectionVariant = .ring,
        mode: MetalSelectionMode = .idle,
        radius: CGFloat = 0,
        handles: MetalSelectionHandles = .object,
        readout: Bool = true,
        count: Int? = nil,
        copied: String? = nil,
        edge: MetalSelectionEdge? = nil,
        corner: MetalSelectionCorner? = nil,
        onHandleDrag: ((MetalSelectionHandle, DragGesture.Value) -> Void)? = nil
    ) -> some View {
        modifier(MetalSelectionFrameModifier(
            state: state, variant: variant, mode: mode, radius: radius, handles: handles, readout: readout,
            count: count, copied: copied, edge: edge, corner: corner, onHandleDrag: onHandleDrag
        ))
    }
}

/// A standalone frame of a given size, for overlays drawn apart from the object.
public struct MetalSelectionFrame: View {
    let size: CGSize
    let state: MetalSelectionState
    let variant: MetalSelectionVariant
    let mode: MetalSelectionMode
    let radius: CGFloat
    let handles: MetalSelectionHandles
    let count: Int?
    let corner: MetalSelectionCorner?

    public init(size: CGSize, state: MetalSelectionState = .selected, variant: MetalSelectionVariant = .ring, mode: MetalSelectionMode = .idle, radius: CGFloat = 0, handles: MetalSelectionHandles = .object, count: Int? = nil, corner: MetalSelectionCorner? = nil) {
        self.size = size
        self.state = state
        self.variant = variant
        self.mode = mode
        self.radius = radius
        self.handles = handles
        self.count = count
        self.corner = corner
    }

    public var body: some View {
        Color.clear
            .frame(width: size.width, height: size.height)
            .metalSelectionFrame(state, variant: variant, mode: mode, radius: radius, handles: handles, count: count, corner: corner)
    }
}
