#if os(macOS)
import AppKit
import WebKit

/// Retain one bridge per trusted WKUserContentController; detach when its host closes.
/// Ordinary browsers do not install it. The weak handler never retains this bridge.
@MainActor
public final class MetalHapticWebViewBridge {
    public static let handlerName = "metaluiHaptic"
    private let controller: WKUserContentController
    private let handler = MetalHapticScriptHandler()
    private let perform: (MetalHaptic) -> Void
    private var attached = true

    /// `perform` may route requests to another native device; the default uses the Mac trackpad.
    public init(_ controller: WKUserContentController,
                perform: ((NSHapticFeedbackManager.FeedbackPattern) -> Void)? = nil) {
        self.controller = controller
        self.perform = { kind in
            if let perform { perform(kind.feedbackPattern) }
            else { kind.perform() }
        }
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
        perform(kind)
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
