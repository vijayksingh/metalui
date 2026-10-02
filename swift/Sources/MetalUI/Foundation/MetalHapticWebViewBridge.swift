#if os(macOS)
import AppKit
import WebKit

/// The semantic request sent by the optional web-view transport.
public enum MetalWebHaptic: String { case alignment, detent, refusal }

/// Retain one bridge per trusted WKUserContentController; detach when its host closes.
/// Ordinary browsers do not install it. The weak handler never retains this bridge.
@MainActor
public final class MetalHapticWebViewBridge {
    public static let handlerName = "metaluiHaptic"
    private let controller: WKUserContentController
    private let handler = MetalHapticScriptHandler()
    private let perform: (NSHapticFeedbackManager.FeedbackPattern) -> Void
    private var attached = true

    /// `perform` may route requests to another native device; the default uses the Mac trackpad.
    public init(_ controller: WKUserContentController,
                perform: @escaping (NSHapticFeedbackManager.FeedbackPattern) -> Void = { NSHapticFeedbackManager.defaultPerformer.perform($0, performanceTime: .now) }) {
        self.controller = controller
        self.perform = perform
        handler.owner = self
        controller.add(handler, name: Self.handlerName)
    }

    public func detach() {
        guard attached else { return }
        attached = false
        handler.owner = nil
        controller.removeScriptMessageHandler(forName: Self.handlerName)
    }

    fileprivate func receive(_ message: WKScriptMessage) {
        guard attached, message.frameInfo.isMainFrame,
              let value = message.body as? String, let kind = MetalWebHaptic(rawValue: value) else { return }
        switch kind {
        case .alignment: perform(.alignment)
        case .detent: perform(.levelChange)
        case .refusal: perform(.generic)
        }
    }
}

private final class MetalHapticScriptHandler: NSObject, WKScriptMessageHandler {
    weak var owner: MetalHapticWebViewBridge?
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // WebKit delivers user-content messages on the main thread.
        MainActor.assumeIsolated { owner?.receive(message) }
    }
}
#endif
