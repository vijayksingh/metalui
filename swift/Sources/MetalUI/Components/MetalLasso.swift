import SwiftUI

/// A world-coordinate selection box while dragging on empty canvas.
/// Place inside the transformed world and pass that transform's scale. The host owns selection
/// semantics; this overlay does not handle input or add accessibility content.
public struct MetalLasso: View {
    public let rect: CGRect?
    public let count: Int
    public let scale: CGFloat
    public let unit: (Int) -> String

    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var last: Drawing?
    @State private var isLeaving = false
    @State private var clearTask: Task<Void, Never>?

    private struct Drawing: Equatable {
        let rect: CGRect
        let count: Int
    }

    public init(rect: CGRect?, count: Int, scale: CGFloat = 1, unit: @escaping (Int) -> String = { $0 == 1 ? "block" : "blocks" }) {
        self.rect = rect
        self.count = count
        self.scale = scale
        self.unit = unit
    }

    public var body: some View {
        let active = rect.map { Drawing(rect: $0, count: count) }
        let draw = active ?? last
        let zoom = scale.isFinite && scale > 0 ? scale : 1

        return GeometryReader { _ in
            if let draw {
                // CGRect exposes positive width and height even when constructed from a reverse drag.
                let r = draw.rect.standardized
                let width = r.width
                let height = r.height
                let x = r.minX
                let y = r.minY
                Rectangle()
                    .fill((colorway == .graphite ? MetalPresence.lassoFillDark : MetalPresence.lassoFill).color)
                    .overlay {
                        Rectangle()
                            .strokeBorder((colorway == .graphite ? MetalPresence.guideDark : MetalPresence.guide).color,
                                          lineWidth: MetalPresence.lassoWidth / zoom)
                    }
                    .frame(width: width, height: height)
                    .overlay(alignment: .top) {
                        if draw.count > 0 {
                            MetalSizeReadout(value: String(draw.count), unit: unit(draw.count))
                                .scaleEffect(1 / zoom, anchor: .top)
                                .offset(y: height + MetalPresence.readoutGap / (2 * zoom))
                        }
                    }
                    .offset(x: x, y: y)
                    .opacity(isLeaving && active == nil ? MetalShared.zero : MetalPresence.guide.alpha)
                    .transaction { if active != nil { $0.animation = nil } }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear { last = active }
        .onChange(of: active) { _, next in update(next) }
        .onChange(of: reduceMotion) { _, enabled in
            if enabled && isLeaving { clearImmediately() }
        }
        .onDisappear { clearTask?.cancel() }
    }

    private func update(_ next: Drawing?) {
        clearTask?.cancel()
        clearTask = nil
        if let next {
            // Pointer changes stay in the same frame, even inside an animated canvas.
            withAnimation(nil) {
                last = next
                isLeaving = false
            }
        } else if reduceMotion {
            clearImmediately()
        } else if last != nil {
            withMetalAnimation(.release, reduceMotion: false) { isLeaving = true }
            clearTask = Task { @MainActor in
                do { try await Task.sleep(for: .seconds(MetalSprings.release.duration)) }
                catch { return }
                last = nil
                clearTask = nil
            }
        }
    }

    private func clearImmediately() {
        clearTask?.cancel()
        clearTask = nil
        withAnimation(nil) {
            last = nil
            isLeaving = false
        }
    }
}
