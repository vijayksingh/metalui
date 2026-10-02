#if os(macOS)
import AppKit
#elseif os(iOS)
import UIKit
#endif

/// A physical catch, independent of visual motion preferences. Call only after an accepted
/// interaction; disabled and read-only controls must never request feedback.
public enum MetalHaptic: String, Sendable {
    case alignment, detent, refusal

    #if os(macOS)
    public var feedbackPattern: NSHapticFeedbackManager.FeedbackPattern {
        switch self {
        case .alignment: return .alignment
        case .detent: return .levelChange
        case .refusal: return .generic
        }
    }
    #endif

    @MainActor public func perform() {
        #if os(macOS)
        NSHapticFeedbackManager.defaultPerformer.perform(feedbackPattern, performanceTime: .now)
        #elseif os(iOS)
        switch self {
        case .alignment, .detent: UISelectionFeedbackGenerator().selectionChanged()
        case .refusal: UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
        #endif
    }
}

/// The web transport and native controls use the same semantic request.
public typealias MetalWebHaptic = MetalHaptic
