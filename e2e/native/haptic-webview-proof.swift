import AppKit
import SwiftUI
import WebKit
import MetalUI

@MainActor
final class HapticHost: ObservableObject {
    var requests: [Int] = []
    var bridge: MetalHapticWebViewBridge?
    weak var webView: WKWebView?
}

struct BridgePage: NSViewRepresentable {
    let host: HapticHost
    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        host.bridge = MetalHapticWebViewBridge(configuration.userContentController) { host.requests.append($0.rawValue) }
        let view = WKWebView(frame: .zero, configuration: configuration)
        host.webView = view
        view.loadHTMLString("""
        <p>Native haptic transport</p>
        <script>
        const h = window.webkit.messageHandlers.metaluiHaptic;
        ['alignment', 'detent', 'refusal', 'invalid'].forEach(k => h.postMessage(k));
        </script>
        <iframe srcdoc="<script>window.webkit.messageHandlers.metaluiHaptic.postMessage('alignment')</script>"></iframe>
        """, baseURL: nil)
        return view
    }
    func updateNSView(_ view: WKWebView, context: Context) {}
}

@main
struct HapticWebViewProof: App {
    var body: some Scene { WindowGroup { DeliveryProof() } }
}

struct DeliveryProof: View {
    @StateObject private var host = HapticHost()
    var body: some View {
        BridgePage(host: host).frame(width: 600, height: 240)
            .task {
                for _ in 0..<20 {
                    try? await Task.sleep(for: .milliseconds(200))
                    if host.requests.count >= 3 { break }
                }
                try? await Task.sleep(for: .milliseconds(300))
                let patterns: [NSHapticFeedbackManager.FeedbackPattern] = [.alignment, .levelChange, .generic]
                let expected = patterns.map(\.rawValue)
                let mapped = host.requests == expected
                host.bridge?.detach()
                host.bridge?.detach()
                _ = try? await host.webView?.evaluateJavaScript("window.webkit?.messageHandlers?.metaluiHaptic?.postMessage('alignment')")
                try? await Task.sleep(for: .milliseconds(300))
                let detached = host.requests == expected
                let result = "patterns=\(host.requests) mapped=\(mapped) detached=\(detached) passed=\(mapped && detached)"
                try? result.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
            }
    }
}
