import SwiftUI

// WIP: MetalAvatar is a placeholder that keeps the React API's shape (a name, an optional image). It
// draws a circle with initials over the image, not yet the raised surface, the presence LED, the photo's
// fade or the group's spread from avatar.agent.md. Web is the reference.

/// A person as a small disc. Work in progress: see avatar.agent.md.
public struct MetalAvatar: View {
    private let name: String
    private let image: Image?
    private let label: String

    /// `name` gives the initials. The optional label names the disc independently; "" makes it decorative.
    public init(name: String, image: Image? = nil, accessibilityLabel: String? = nil) {
        self.name = name
        self.image = image
        self.label = accessibilityLabel ?? name
    }

    private var initials: String {
        let words = name.split(separator: " ")
        return ((words.first?.first.map(String.init) ?? "") + (words.count > 1 ? words.last!.first.map(String.init) ?? "" : "")).uppercased()
    }

    public var body: some View {
        let size = MetalRecipes.avatar.points("size.regular")
        ZStack {
            Circle().fill(.quaternary)
            Text(initials).foregroundStyle(.secondary)
            image?.resizable().scaledToFill().clipShape(Circle())
        }
        .frame(width: size, height: size)
        .accessibilityElement()
        .accessibilityLabel(label)
        .accessibilityHidden(label.isEmpty)
    }
}
