import SwiftUI

/// A person's attached file, filling its host's column with a raised plate.
public struct MetalAttachment: View {
    private let name: String
    private let size: Int?
    private let progress: Double?
    private let error: String?
    private let retry: (() -> Void)?
    private let remove: (() -> Void)?
    private let onLeaveStart: (() -> Void)?
    @Environment(\.metalColorway) private var colorway
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var landed = false
    @State private var leaving = false
    @State private var leaveTask: Task<Void, Never>?

    public init(name: String, size: Int? = nil, progress: Double? = nil, error: String? = nil,
                retry: (() -> Void)? = nil, remove: (() -> Void)? = nil, onLeaveStart: (() -> Void)? = nil) {
        self.name = name; self.size = size; self.progress = progress; self.error = error
        self.retry = retry; self.remove = remove; self.onLeaveStart = onLeaveStart
    }

    public var body: some View {
        let recipe = MetalRecipes.attachment
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        let ext = (name as NSString).pathExtension
        let retryGap = MetalSpace.s4
        let fraction = min(100, max(.zero, progress ?? .zero)) / 100
        HStack(spacing: recipe.points("self.gap")) {
            Text(ext.isEmpty ? "FILE" : String(ext.prefix(4)).uppercased())
                .font(.metal(MetalType.label)).foregroundStyle(colorway.tokens.ink2.color)
                .frame(width: recipe.points("type.size"), height: recipe.points("type.size"))
                .metalObjectRecipe(MetalRecipes.well, part: "self", state: "field", in: RoundedRectangle(cornerRadius: recipe.points("type.radius"), style: .continuous))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: recipe.points("body.gap")) {
                Text(name).font(.metal(MetalType.ui)).foregroundStyle(colorway.tokens.ink.color)
                    .lineLimit(1).truncationMode(.middle).frame(maxWidth: .infinity, alignment: .leading)
                if let progress, error == nil {
                    GeometryReader { bounds in
                        ZStack(alignment: .leading) {
                            Color.clear.metalObjectRecipe(MetalRecipes.`switch`, part: "self", in: Capsule())
                            Color.clear
                                .frame(width: bounds.size.width * fraction)
                                .metalObjectRecipe(MetalRecipes.`switch`, part: "self", state: "on", in: Capsule())
                        }
                    }
                    .frame(height: recipe.points("track.height"))
                    .metalAnimation(.settle, value: progress)
                    .accessibilityLabel("Uploading \(name)")
                    .accessibilityValue("\(Int(progress.rounded())) percent")
                    Text("Uploading · \(Int(progress.rounded())) %").font(.metal(MetalType.meta))
                        .foregroundStyle(colorway.tokens.ink3.color)
                } else if let error {
                    Text(error).font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.invalid.color)
                        .fixedSize(horizontal: false, vertical: true)
                    if let retry {
                        MetalButton("Try again", size: .compact, action: retry).disabled(leaving)
                            .padding(.top, retryGap)
                    }
                } else if let size {
                    Text(ByteCountFormatter.string(fromByteCount: Int64(size), countStyle: .decimal))
                        .font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink3.color)
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
        .accessibilityElement(children: .contain).accessibilityLabel(name)
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
