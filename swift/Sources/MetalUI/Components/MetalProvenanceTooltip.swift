import SwiftUI

// Provenance tooltip. Mirrors components/provenance-tooltip from MetalProvenance and the graphite frost.

/// The provenance tag: "RECOGNIZER · 0.82", source in ink, detail dimmed, in the readout role, uppercase.
public struct MetalProvenanceTooltip: View {
    let source: String
    let detail: [String]
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    public init(source: String, detail: [String] = []) {
        self.source = source
        self.detail = detail
    }

    public var body: some View {
        let role = MetalType.readout
        let text = Text(source.uppercased()).foregroundColor(MetalProvenance.ink.color)
            + Text(detail.isEmpty ? "" : " · " + detail.joined(separator: " · ").uppercased()).foregroundColor(MetalProvenance.dim.color)
        text
            .font(.metal(role))
            .tracking(MetalProvenance.tracking * role.size)
            .lineLimit(1)
            .padding(.vertical, MetalProvenance.padY)
            .padding(.horizontal, MetalProvenance.padX)
            .frame(maxWidth: MetalProvenance.maxWidth)
            .fixedSize()
            .metalFrost(.graphite, in: RoundedRectangle(cornerRadius: MetalProvenance.radius, style: .continuous))
            .allowsHitTesting(false)
    }
}

private struct MetalProvenanceModifier: ViewModifier {
    let source: String
    let detail: [String]
    let clearsChip: Bool
    let enabled: Bool
    @MetalMotionPreference private var reduceMotion
    @State private var shown = false
    @State private var dwell: Task<Void, Never>?

    func body(content: Content) -> some View {
        content
            .onHover { hovering in
                dwell?.cancel()
                guard hovering && enabled else { withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = false }; return }
                dwell = Task { @MainActor in
                    try? await Task.sleep(nanoseconds: UInt64(MetalProvenance.delayMs * 1_000_000))
                    guard !Task.isCancelled else { return }
                    withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = true }
                }
            }
            .onChange(of: enabled) { _, next in if !next { dwell?.cancel(); dwell = nil; withMetalAnimation(.settle, reduceMotion: reduceMotion) { shown = false } } }
            .onDisappear { dwell?.cancel(); dwell = nil }
            .overlay(alignment: .top) {
                MetalProvenanceTooltip(source: source, detail: detail)
                    .alignmentGuide(.top) { d in d[.bottom] + (clearsChip ? MetalProvenance.chipOffset : MetalProvenance.offset) }
                    .opacity(shown ? .one : .zero)
            }
            .accessibilityCustomContent(LocalizedStringKey("Source"), [source, detail.joined(separator: ", ")].filter { !$0.isEmpty }.joined(separator: ", "), importance: .high)
    }
}

extension View {
    /// Says where this cue came from after a 380 ms hover: "Recognizer · 0.82". Show the number whenever the app guessed.
    public func metalProvenance(_ source: String, detail: [String] = [], clearsChip: Bool = false, enabled: Bool = true) -> some View {
        modifier(MetalProvenanceModifier(source: source, detail: detail, clearsChip: clearsChip, enabled: enabled))
    }
}
