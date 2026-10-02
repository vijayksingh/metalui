import SwiftUI
import UniformTypeIdentifiers

/// A file the receiving place refused. The host can name it and explain why beside the tray.
public struct MetalDropRefusal {
    public enum Reason: String { case type, size, count }
    public let url: URL
    public let reason: Reason
}

/// A recipe-painted place that receives files through the native picker or drop destination.
public struct MetalDropZone: View {
    private let title: String
    private let description: String?
    private let icon: MetalIconName
    private let systemImage: String?
    private let accept: [UTType]
    private let maxSize: Int?
    private let multiple: Bool
    private let onFiles: ([URL]) -> Void
    private let onRefused: ([MetalDropRefusal]) -> Void
    private let compact: Bool
    @Environment(\.metalColorway) private var colorway
    @Environment(\.isEnabled) private var isEnabled
    @MetalMotionPreference private var reduceMotion
    @State private var over = false
    @State private var picking = false
    @State private var result: ResultMark?
    @State private var announcement = ""
    @State private var resultID = 0
    @State private var refusal: CGFloat = 0
    private enum ResultMark { case accepted, refused }

    /// Canonical icon defaults to document. systemImage remains a custom-art compatibility escape hatch.
    public init(_ title: String = "Drop files here", description: String? = nil, icon: MetalIconName = .document,
                systemImage: String? = nil, accept: [UTType] = [.item], maxSize: Int? = nil, multiple: Bool = true,
                compact: Bool = false, onRefused: @escaping ([MetalDropRefusal]) -> Void = { _ in },
                onFiles: @escaping ([URL]) -> Void) {
        self.title = title; self.description = description; self.icon = icon; self.systemImage = systemImage
        self.accept = accept; self.maxSize = maxSize; self.multiple = multiple; self.compact = compact
        self.onRefused = onRefused; self.onFiles = onFiles
    }

    public var body: some View {
        let recipe = MetalRecipes.dropZone
        let t = colorway.tokens
        let shape = RoundedRectangle(cornerRadius: recipe.points("self.radius"), style: .continuous)
        Button { picking = true } label: {
            Group {
                if compact {
                    HStack(spacing: recipe.points("compact.gap")) {
                        glyph
                        words.frame(maxWidth: .infinity, alignment: .leading)
                        choose.fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, recipe.points("compact.pad-x"))
                    .frame(maxWidth: .infinity, minHeight: recipe.points("compact.height"))
                } else {
                    VStack(spacing: recipe.points("self.gap")) { glyph; words; choose }
                        .padding(recipe.points("self.pad"))
                        .frame(maxWidth: .infinity, minHeight: recipe.points("self.min-height"))
                }
            }
            .metalObjectRecipe(MetalRecipes.well, part: "self", state: "field", in: shape)
            .overlay { shape.strokeBorder(result == .refused ? t.invalid.color : over ? MetalShared.green.color : .clear,
                                           lineWidth: recipe.points("self.edge")) }
            .scaleEffect(over && !reduceMotion ? recipe.scalar("self.sink") : .one)
            .metalAnimation(over ? .part : .object, value: over)
            .metalAnimation(.settle, value: result)
            .offset(x: reduceMotion ? 0 : refusal)
            .opacity(isEnabled ? .one : recipe.scalar("self.disabled"))
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityHint(description ?? "Choose files")
        .accessibilityValue(announcement)
        .dropDestination(for: URL.self) { urls, _ in
            guard isEnabled else { return false }
            return take(urls)
        } isTargeted: { target in
            guard isEnabled else { return }
            over = target
            if target { resultID += 1; result = nil }
        }
        .fileImporter(isPresented: $picking, allowedContentTypes: accept, allowsMultipleSelection: multiple) { response in
            guard isEnabled else { return }
            if case .success(let urls) = response { _ = take(urls) }
        }
        .task(id: resultID) {
            guard result != nil else { return }
            try? await Task.sleep(for: .seconds(recipe.durationSeconds("result.pause")))
            guard !Task.isCancelled else { return }
            result = nil
        }
        .onChange(of: isEnabled) { _, enabled in
            if !enabled { resultID += 1; result = nil; over = false; picking = false; refusal = 0 }
        }
        .onChange(of: reduceMotion) { _, reduced in if reduced { refusal = 0 } }
    }

    private var glyph: some View {
        let recipe = MetalRecipes.dropZone
        return Group {
            if let systemImage { Image(systemName: systemImage).font(.system(size: recipe.points("well.glyph"))) }
            else { MetalMorphIcon(result == .refused ? .close : result == .accepted ? .check : icon, size: recipe.points("well.glyph")) }
        }
        .foregroundStyle(colorway.tokens.ink2.color)
        .frame(width: recipe.points("well.size"), height: recipe.points("well.size"))
        .metalObjectRecipe(MetalRecipes.surface, part: "self", state: "raise-sm",
                           in: RoundedRectangle(cornerRadius: recipe.points("well.radius"), style: .continuous))
        .offset(y: over && !reduceMotion ? -MetalSpace.s4 : 0)
        .metalAnimation(over ? .part : .object, value: over)
        .accessibilityHidden(true)
    }

    private var words: some View {
        let line = result == .refused ? "This file isn’t taken here" : over ? "Let go to attach" : title
        return VStack(alignment: compact ? .leading : .center, spacing: MetalRecipes.dropZone.points("words.gap")) {
            ZStack(alignment: compact ? .leading : .center) {
                Text(title).hidden()
                Text(line).id(line)
                    .transition(reduceMotion ? .opacity : .asymmetric(insertion: .offset(y: MetalSpace.s4).combined(with: .opacity), removal: .offset(y: -MetalSpace.s4).combined(with: .opacity)))
            }
            .font(.metal(MetalType.ui)).foregroundStyle(colorway.tokens.ink.color)
            .metalAnimation(.settle, value: over)
            if let description { Text(description).font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink3.color) }
        }.lineLimit(compact ? 1 : nil)
    }
    private var choose: some View {
        Text("or choose files").font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink2.color).underline()
            .opacity(isEnabled ? .one : .zero)
    }

    @MainActor private func take(_ urls: [URL]) -> Bool {
        guard !urls.isEmpty, isEnabled else { return false }
        var files: [URL] = [], refused: [MetalDropRefusal] = []
        for url in urls {
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            let values = try? url.resourceValues(forKeys: [.contentTypeKey, .fileSizeKey])
            let type = values?.contentType ?? UTType(filenameExtension: url.pathExtension)
            let reason: MetalDropRefusal.Reason?
            if !url.isFileURL || !accept.contains(where: { accepted in accepted == .item || type?.conforms(to: accepted) == true }) { reason = .type }
            else if let maxSize, let size = values?.fileSize, size > maxSize { reason = .size }
            else if !multiple && !files.isEmpty { reason = .count }
            else { reason = nil }
            if let reason { refused.append(MetalDropRefusal(url: url, reason: reason)) } else { files.append(url) }
        }
        onFiles(files); onRefused(refused)
        over = false
        result = refused.isEmpty ? .accepted : .refused
        resultID += 1
        announcement = "\(files.count) \(files.count == 1 ? "file" : "files") attached" + (refused.isEmpty ? "" : "; \(refused.count) not attached")
        if !refused.isEmpty && !reduceMotion {
            refusal = CGFloat(MetalMotionTokens.nest)
            DispatchQueue.main.async { withAnimation(MetalMotion.resolve(.refusal, reduceMotion: reduceMotion).animation) { refusal = 0 } }
        }
        return !files.isEmpty
    }
}
