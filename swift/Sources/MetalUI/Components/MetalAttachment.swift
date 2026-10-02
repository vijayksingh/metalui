import SwiftUI
import Accessibility

/// Upload meaning is controlled by the host; only an explicit complete state acknowledges delivery.
public enum MetalAttachmentUploadState: Sendable, Equatable { case idle, uploading, complete, error }


/// A person's attached file, filling its host's column with a raised plate.
public struct MetalAttachment: View {
    private let name: String
    private let size: Int?
    private let progress: Double?
    private let error: String?
    private let uploadState: MetalAttachmentUploadState?
    private let retry: (() -> Void)?
    private let remove: (() -> Void)?
    private let onLeaveStart: (() -> Void)?
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    @State private var landed = false
    @State private var leaving = false
    @State private var leaveTask: Task<Void, Never>?

    public init(name: String, size: Int? = nil, progress: Double? = nil, uploadState: MetalAttachmentUploadState? = nil, error: String? = nil,
                retry: (() -> Void)? = nil, remove: (() -> Void)? = nil, onLeaveStart: (() -> Void)? = nil) {
        self.name = name; self.size = size; self.progress = progress; self.uploadState = uploadState; self.error = error
        self.retry = retry; self.remove = remove; self.onLeaveStart = onLeaveStart
    }

    public var body: some View {
        let recipe = MetalRecipes.attachment
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        let ext = (name as NSString).pathExtension
        let retryGap = MetalSpace.s4
        let amount = progress.map { min(100, max(.zero, $0)) }
        let fraction = (amount ?? .zero) / 100
        let state = uploadState ?? (error != nil ? .error : progress != nil ? .uploading : .idle)
        let bytes = size.map { ByteCountFormatter.string(fromByteCount: Int64($0), countStyle: .decimal) } ?? ""
        let failure = error.flatMap { $0.isEmpty ? nil : $0 } ?? "Upload failed"
        let metadata = state == .error ? failure : state == .uploading ? (amount.map { "Uploading · \(Int($0.rounded())) %" } ?? "Uploading") : state == .complete ? "Uploaded\(bytes.isEmpty ? "" : " · " + bytes)" : bytes
        let receipt = state == .error || state == .complete ? metadata : ""
        let glyph: MetalIconName = state == .error ? .syncError : state == .uploading ? .upload : state == .complete ? .check : .document
        HStack(spacing: recipe.points("self.gap")) {
            Text(ext.isEmpty ? "FILE" : String(ext.prefix(4)).uppercased())
                .font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.ink2.color)
                .frame(width: recipe.points("type.size"), height: recipe.points("type.size"))
                .metalObjectRecipe(MetalRecipes.well, part: "self", state: "field", in: RoundedRectangle(cornerRadius: recipe.points("type.radius"), style: .continuous))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: recipe.points("body.gap")) {
                Text(name).font(.metal(MetalType.ui)).foregroundStyle(colorway.tokens.ink.color)
                    .lineLimit(1).truncationMode(.middle).frame(maxWidth: .infinity, alignment: .leading)
                if state == .uploading {
                    if let amount {
                        GeometryReader { bounds in
                            ZStack(alignment: .leading) {
                                Color.clear.metalObjectRecipe(MetalRecipes.`switch`, part: "self", in: Capsule())
                                Color.clear.frame(width: bounds.size.width * fraction)
                                    .metalObjectRecipe(MetalRecipes.`switch`, part: "self", state: "on", in: Capsule())
                            }
                        }
                        .frame(height: recipe.points("track.height"))
                        .metalAnimation(.settle, value: amount)
                        .accessibilityLabel("Uploading \(name)").accessibilityValue("\(Int(amount.rounded())) percent")
                    }
                }
                HStack(alignment: .top, spacing: MetalSpace.s4) {
                    MetalMorphIcon(glyph, size: MetalRecipes.button.points("compact.glyph"))
                    Text(metadata).id(metadata)
                        .font(.metal(MetalType.meta))
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(reduceMotion ? .identity : .asymmetric(insertion: .offset(y: MetalSpace.s4).combined(with: .opacity), removal: .offset(y: -MetalSpace.s4).combined(with: .opacity)))
                }
                .foregroundStyle((state == .error ? colorway.tokens.invalid : colorway.tokens.ink3).color)
                .accessibilityElement(children: .ignore).accessibilityLabel(metadata)
                .metalAnimation(.settle, value: metadata)
                .transaction { if reduceMotion { $0.animation = nil; $0.disablesAnimations = true } }
                if state == .error, let retry {
                    MetalButton("Try again", icon: .retry, size: .compact, action: retry).disabled(leaving)
                        .padding(.top, retryGap)
                }
            }
            if remove != nil {
                MetalIconButton("Remove \(name)", icon: .close, variant: .mini, action: leave).disabled(leaving)
            }
        }
        .padding(recipe.points("self.pad"))
        .frame(maxWidth: .infinity, minHeight: recipe.points("self.height"))
        .metalObjectRecipe(MetalRecipes.surface, part: "self", state: "raise-sm", in: shape)
        .opacity(leaving || !landed ? .zero : .one)
        .offset(y: reduceMotion ? .zero : leaving ? MetalMotionTokens.nest : landed ? .zero : -MetalMotionTokens.nest)
        .accessibilityElement(children: .contain).accessibilityLabel(name).accessibilityValue(metadata)
        .onChange(of: receipt) { _, value in
            if !value.isEmpty { AccessibilityNotification.Announcement("\(name): \(value)").post() }
        }
        .onAppear { withAnimation(reduceMotion ? nil : MetalSprings.object.animation) { landed = true } }
        .onDisappear { leaveTask?.cancel() }
        .onChange(of: reduceMotion) { _, reduced in
            if reduced && leaving { leaveTask?.cancel(); remove?() }
        }
    }

    private func leave() {
        guard !leaving, let remove else { return }
        onLeaveStart?()
        if reduceMotion { remove(); return }
        withAnimation(MetalSprings.release.animation) { leaving = true }
        leaveTask = Task { @MainActor in
            try? await Task.sleep(for: .seconds(MetalSprings.release.duration))
            guard !Task.isCancelled else { return }
            remove()
        }
    }
}
