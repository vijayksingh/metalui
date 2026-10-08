import SwiftUI

/// A place with nothing in it yet, and how to start.
///
///   rest      a glyph engraved in a sunk well, what would be here, how to start, one action
///   arrive    when a place empties it rises one nest from below on the settle spring, so it
///             never snaps in; content arriving replaces it
///   compact   one quiet line and the action, for small places (a panel, a table)
/// Reduce Motion: it fades in without travel. When it arrives, assistive tech hears what would
/// be here (the web's polite status).
public struct MetalEmptyState<Icon: View, Action: View>: View {
    private let title: String
    private let description: String?
    private let compact: Bool
    private let icon: Icon?
    private let action: Action
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalSnapshot) private var snapshot
    @MetalMotionPreference private var reduceMotion
    @State private var arrived = false

    /// Any glyph or mark for the well, such as a host's own character.
    public init(_ title: String, description: String? = nil, compact: Bool = false,
                @ViewBuilder icon: () -> Icon, @ViewBuilder action: () -> Action = { EmptyView() }) {
        self.title = title; self.description = description; self.compact = compact
        self.icon = icon(); self.action = action()
    }

    private var recipe: MetalObjectRecipe { MetalRecipes.emptyState }
    private var spoken: String { [title, description].compactMap { $0 }.joined(separator: ". ") }

    public var body: some View {
        Group { if compact { line } else { full } }
            .opacity(arrived || snapshot ? .one : .zero)
            .offset(y: arrived || snapshot || !MetalMotion.resolve(.settle, reduceMotion: reduceMotion).allowsTravel
                    ? .zero : MetalMotionTokens.nest)
            .onAppear {
                withMetalAnimation(.settle, reduceMotion: reduceMotion) { arrived = true }
                if !snapshot { AccessibilityNotification.Announcement(spoken).post() }
            }
    }

    private var full: some View {
        VStack(spacing: recipe.points("self.gap")) {
            if let icon {
                MetalWell(.field, radius: recipe.points("well.radius")) {
                    icon
                        .foregroundStyle(colorway.tokens.ink3.color)
                        .frame(width: recipe.points("well.size"), height: recipe.points("well.size"))
                }
                .accessibilityHidden(true)
            }
            Text(title)
                .metalType(MetalType.title)
                .foregroundStyle(colorway.tokens.ink.color)
                .frame(maxWidth: .infinity)
                .fixedSize(horizontal: false, vertical: true)
            if let description {
                Text(description)
                    .metalType(MetalType.body)
                    .foregroundStyle(colorway.tokens.ink2.color)
                    .frame(maxWidth: .infinity)
                    .fixedSize(horizontal: false, vertical: true)
            }
            HStack(spacing: recipe.points("self.gap")) { action }
                .padding(.top, recipe.points("self.action-gap"))
        }
        .multilineTextAlignment(.center)
        .padding(recipe.points("self.pad"))
        .frame(maxWidth: recipe.points("self.max-width"))
        .accessibilityElement(children: .contain)
    }

    private var line: some View {
        HStack(spacing: recipe.points("self.gap")) {
            Text(description.map { "\(title) · \($0)" } ?? title)
                .metalType(MetalType.body)
                .foregroundStyle(colorway.tokens.ink3.color)
                .fixedSize()
            action
        }
        .padding(.vertical, recipe.points("self.gap"))
        .accessibilityElement(children: .contain)
    }
}

extension MetalEmptyState where Icon == MetalIcon {
    /// A glyph from the icon set, engraved in the well.
    public init(_ title: String, description: String? = nil, icon: MetalIconName,
                @ViewBuilder action: () -> Action = { EmptyView() }) {
        self.init(title, description: description, icon: {
            MetalIcon(icon, size: MetalRecipes.emptyState.points("well.glyph"))
        }, action: action)
    }
}

extension MetalEmptyState where Icon == EmptyView {
    /// No well: the words and the action.
    public init(_ title: String, description: String? = nil, compact: Bool = false,
                @ViewBuilder action: () -> Action = { EmptyView() }) {
        self.title = title; self.description = description; self.compact = compact
        self.icon = nil; self.action = action()
    }
}
