import AppKit
import SwiftUI
import MetalUI

@main struct PersonCueProof: App {
    var body: some Scene { WindowGroup { Receipt() } }
}
struct Receipt: View {
    private let colorway: MetalColorway = ProcessInfo.processInfo.environment["METALUI_COLORWAY"] == "graphite" ? .graphite : .bone
    @StateObject private var document = MetalCueDocument("🧠 Ask Mira Chen about the poster.", selection: .init(start: 33, end: 33))
    @State private var reduced = false
    @State private var installation = 0
    @State private var disabled = false
    @State private var readOnly = false
    @State private var tailX: CGFloat = .zero
    @State private var commits = 0
    @State private var cancels = 0
    private var names: [String] { ["Mira Chen", "Alexandra Rivera", "Robin Lee", "Sam Patel"] }
    private var range: NSRange {
        let ns = document.source as NSString
        return names.map { ns.range(of: $0) }.first { $0.location != NSNotFound } ?? NSRange(location: 0, length: 0)
    }
    private var name: String { (document.source as NSString).substring(with: range) }
    var body: some View {
        VStack(alignment: .leading, spacing: MetalSpace.s24) {
            HStack(spacing: .zero) {
                Text("🧠 Ask ")
                MetalPersonCue(name, choices: names.map { .init($0, label: $0 == "Alexandra Rivera" ? "Alexandra" : nil, disabled: $0 == "Robin Lee") }, label: "Assigned person", readOnly: readOnly, editing: document.editing,
                    onBegin: { document.begin(range) }, onChange: document.replace,
                    onCommit: { commits += 1; document.commit() }, onCancel: { cancels += 1; document.cancel() })
                    .id(installation).keyboardShortcut(.defaultAction).disabled(disabled)
                Text(" about the poster.").background(GeometryReader { geometry in Color.clear.preference(key: TailFrame.self, value: geometry.frame(in: .global).minX) })
            }
            Text(document.source)
            Text("UTF16 \(document.selection.start)–\(document.selection.end) · commits \(commits) · cancels \(cancels)").font(.metal(MetalType.readout))
        }
        .padding(MetalSpace.s24).frame(width: 660, height: 220)
        .font(.metal(MetalType.content)).foregroundStyle(colorway.tokens.ink.color).background(colorway.tokens.s.color)
        .metalColorway(colorway).metalReduceMotion(reduced)
        .onPreferenceChange(TailFrame.self) { tailX = $0 }
        .task {
            try? await Task.sleep(for: .seconds(1))
            NSApp.activate(ignoringOtherApps: true)
            guard let window = NSApp.windows.first else { fatalError("Missing person window") }
            window.makeKeyAndOrderFront(nil)
            try? await Task.sleep(for: .milliseconds(400))
            let savedPointer = NSEvent.mouseLocation
            CGWarpMouseCursorPosition(.zero)
            defer { CGWarpMouseCursorPosition(CGPoint(x: savedPointer.x, y: (NSScreen.screens.first?.frame.height ?? .zero) - savedPointer.y)) }
            @MainActor func key(_ characters: String, _ code: UInt16, settle: Int = 200) async {
                let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: ProcessInfo.processInfo.systemUptime,
                    windowNumber: NSApp.keyWindow?.windowNumber ?? window.windowNumber, context: nil, characters: characters, charactersIgnoringModifiers: characters, isARepeat: false, keyCode: code)!
                NSApp.sendEvent(event); try? await Task.sleep(for: .milliseconds(settle))
            }
            @MainActor func capture(_ name: String) {
                guard let directory = ProcessInfo.processInfo.environment["METALUI_NATIVE_CAPTURE"] else { return }
                for visible in NSApp.windows.filter({ $0.isVisible }) {
                    guard let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(visible.windowNumber), [.boundsIgnoreFraming, .bestResolution]) else { continue }
                    let image = NSBitmapImageRep(cgImage: pixels)
                    try? image.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: directory).appendingPathComponent(name + (visible === window ? "-document.png" : "-picker.png")))
                }
            }
            @MainActor func renderedWords() -> Data? {
                guard let pixels = CGWindowListCreateImage(.null, .optionIncludingWindow, CGWindowID(window.windowNumber), [.boundsIgnoreFraming, .bestResolution]),
                      let words = pixels.cropping(to: CGRect(x: Double(pixels.width) * 0.415, y: Double(pixels.height) * 0.44,
                                                           width: Double(pixels.width) * 0.10, height: Double(pixels.height) * 0.04)) else { return nil }
                return NSBitmapImageRep(cgImage: words).representation(using: .png, properties: [:])
            }
            let firstTail = tailX
            await key("\r", 36); try? await Task.sleep(for: .seconds(1))
            let opened = document.editing && NSApp.windows.contains { $0 !== window && $0.isVisible }
            await key("\u{F701}", 125)
            let highlightedOnly = document.source == "🧠 Ask Mira Chen about the poster."
            capture("person-open")
            await key("\r", 36, settle: 20)
            reduced = true
            try? await Task.sleep(for: .milliseconds(120))
            let reducedWords = renderedWords()
            capture("person-live-reduced")
            try? await Task.sleep(for: .milliseconds(400))
            let settledWords = renderedWords()
            let travelStopped = reducedWords != nil && reducedWords == settledWords
            capture("person-live-settled")
            // A fresh public control is the visual reference; a retained wrong offset can also stop.
            installation += 1
            try? await Task.sleep(for: .milliseconds(300))
            let canonicalRest = settledWords != nil && settledWords == renderedWords()
            capture("person-canonical-reduced")
            let chosenState = "source=\(name) editing=\(document.editing) commits=\(commits) cancels=\(cancels)"
            let footprint = abs(tailX - firstTail) < 1
            let chose = name == "Alexandra Rivera" && commits == 1 && !document.editing
            capture("person-chosen")
            document.undo(); try? await Task.sleep(for: .milliseconds(200))
            let undo = name == "Mira Chen" && !document.canUndo && document.selection == .init(start: 33, end: 33)
            await key("\r", 36); await key("\u{F702}", 123); await key("\u{1B}", 53)
            let escaped = name == "Mira Chen" && commits == 1 && cancels == 1 && !document.editing
            reduced = true
            try? await Task.sleep(for: .milliseconds(300))
            await key("\r", 36); await key("s", 1); await key("\r", 36)
            try? await Task.sleep(for: .milliseconds(400))
            let typed = name == "Sam Patel" && commits == 2 && !document.editing
            capture("person-reduced")
            readOnly = true; try? await Task.sleep(for: .milliseconds(200)); await key("\r", 36)
            let readonlyState = "source=\(name) editing=\(document.editing) commits=\(commits) cancels=\(cancels)"
            let readonly = !document.editing && commits == 2
            readOnly = false; disabled = true; try? await Task.sleep(for: .milliseconds(200)); await key("\r", 36)
            let inert = !document.editing && commits == 2
            let passed = canonicalRest && travelStopped && opened && highlightedOnly && chose && footprint && undo && escaped && typed && readonly && inert
            let report = "canonicalRest=\(canonicalRest) liveMotionStopped=\(travelStopped) opened=\(opened) highlightOnly=\(highlightedOnly) chose=\(chose) chosenState=\(chosenState) footprint=\(footprint) undo=\(undo) escape=\(escaped) typeahead=\(typed) readOnly=\(readonly) readonlyState=\(readonlyState) disabled=\(inert) passed=\(passed)"
            try? report.write(toFile: ProcessInfo.processInfo.environment["METALUI_NATIVE_REPORT"]!, atomically: true, encoding: .utf8)
            NSApp.terminate(nil)
        }
    }
}

private struct TailFrame: PreferenceKey {
    static var defaultValue: CGFloat = .zero
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}
