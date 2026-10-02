import SwiftUI
import JavaScriptCore
import Darwin

/// Quarter turns clockwise on the icon's 24-unit grid.
public enum MetalMorphTurn: Int, Sendable { case down = 0, left = 90, up = 180, right = 270 }

/// A shared-set glyph that becomes the next glyph, starting from the ink currently displayed.
/// The native renderer executes the exact web planner only when meaning or turn changes;
/// paths are prepared once, and the display clock exists only during the settle.
public struct MetalMorphIcon: View {
    private let icon: MetalIconName
    private let size: CGFloat
    private let weight: Font.Weight
    private let turn: MetalMorphTurn
    private let interaction: MetalIconInteraction?
    private let act: Int
    @MetalMotionPreference private var reduceMotion
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.metalColorway) private var colorway
    @State private var landed: MetalMorphTarget
    @State private var flight: MetalMorphFlight?
    @State private var resultActs = 0

    public init(_ icon: MetalIconName, size: CGFloat = 16, weight: Font.Weight = .regular,
                turn: MetalMorphTurn = .down, interaction: MetalIconInteraction? = nil, act: Int = 0) {
        self.icon = icon; self.size = size; self.weight = weight; self.turn = turn
        self.interaction = interaction; self.act = act
        _landed = State(initialValue: MetalMorphTarget(name: icon.rawValue, turn: turn.rawValue,
            line: Double(MetalIconMetrics.strokeUnits(for: weight, regular: size <= 16 ? icon.smallStrokeUnits : 1.7))))
    }

    private var target: MetalMorphTarget {
        MetalMorphTarget(name: icon.rawValue, turn: turn.rawValue,
            line: Double(MetalIconMetrics.strokeUnits(for: weight, regular: size <= 16 ? icon.smallStrokeUnits : 1.7)))
    }
    private var request: MetalMorphRequest {
        MetalMorphRequest(target: target, still: reduceMotion || !isEnabled || scenePhase != .active)
    }

    public var body: some View {
        ZStack {
            MetalIcon(MetalIconName(rawValue: landed.name) ?? icon, size: size, weight: weight,
                      interaction: flight == nil ? interaction : MetalIconInteraction(), act: act &+ resultActs)
                .rotationEffect(.degrees(Double(landed.turn)))
                .opacity(flight == nil || request.still ? 1 : 0)
                .allowsHitTesting(flight == nil)
                .disabled(flight != nil || target != landed)
            if let flight, !request.still {
                TimelineView(.animation) { timeline in
                    MetalMorphCanvas(frame: flight.frame(at: timeline.date), box: size, duoK: colorway.tokens.duoK)
                }
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
        .task(id: request) { await transition() }
        .onDisappear { flight = nil }
    }

    private func transition() async {
        let next = target
        if request.still || !MetalMorphCatalog.names.contains(icon) || !MetalMorphCatalog.names.contains(MetalIconName(rawValue: landed.name) ?? icon) {
            flight = nil; landed = next; return
        }
        guard next != landed || flight != nil else { return }
        let seed = flight?.displayedFrame.source
        let from = landed
        // A change while planning cancels this task; the planner actor serializes its single context.
        let planned = try? await MetalMorphPlanner.shared.plan(from: from, to: next, seed: seed)
        guard !Task.isCancelled else { return }
        guard let frames = planned else { flight = nil; landed = next; return }
        let journey = MetalMorphFlight(start: Date(), duration: frames.duration, frames: frames.frames)
        flight = journey; landed = next
        do { try await Task.sleep(for: .seconds(frames.duration)) } catch { return }
        guard !Task.isCancelled else { return }
        flight = nil
        resultActs &+= 1
    }

}

struct MetalMorphTarget: Hashable, Sendable { let name: String; let turn: Int; let line: Double }
private struct MetalMorphRequest: Hashable { let target: MetalMorphTarget; let still: Bool }

private final class MetalMorphDisplay { var index = 0 }

private struct MetalMorphFlight {
    private let display = MetalMorphDisplay()
    let start: Date
    let duration: Double
    let frames: [MetalMorphFrame]
    init(start: Date, duration: Double, frames: [MetalMorphFrame]) {
        self.start = start; self.duration = duration; self.frames = frames
    }
    func frame(at date: Date) -> MetalMorphFrame {
        let p = min(max(date.timeIntervalSince(start) / duration, 0), 1)
        display.index = min(Int(p * Double(frames.count - 1)), frames.count - 1)
        return frames[display.index]
    }
    var displayedFrame: MetalMorphFrame { frames[display.index] }
}

struct MetalMorphFrames { let duration: Double; let frames: [MetalMorphFrame] }
struct MetalMorphFrame { let source: String; let parts: [MetalMorphPart] }
struct MetalMorphPart {
    let path: Path
    let outline: Path
    let weight: Double, tint: Double, solid: Double, opacity: Double
    let body: Bool, holes: Bool
    let behind: [MetalMorphRelation], inside: [MetalMorphRelation]
}
struct MetalMorphRelation: Decodable { let part: Int; let r: Double }
private struct MetalMorphPayload: Decodable {
    let duration: Double
    let frames: [Frame]
    struct Frame: Decodable { let source: String; let parts: [Part] }
    struct Part: Decodable {
        let path: String, outline: String
        let weight: Double, tint: Double, solid: Double, opacity: Double
        let body: Bool, holes: Bool
        let behind: [MetalMorphRelation], inside: [MetalMorphRelation]
    }
}

/// One bounded JS context, shared canonical geometry and no retained pair/frame cache.
/// Each component owns its prepared frames; they are released when it lands or cancels.
actor MetalMorphPlanner {
    static let shared = MetalMorphPlanner()
    private var context: JSContext?
    private(set) var lastPlanningSeconds = 0.0
    private(set) var lastPathSeconds = 0.0

    private static func cpuTime() -> Double {
        var time = timespec()
        clock_gettime(CLOCK_THREAD_CPUTIME_ID, &time)
        return Double(time.tv_sec) + Double(time.tv_nsec) / 1_000_000_000
    }

    func plan(from: MetalMorphTarget, to: MetalMorphTarget, seed: String?) throws -> MetalMorphFrames {
        let started = Self.cpuTime()
        let js: JSContext
        if let context { js = context } else {
            guard let created = JSContext(),
                  let url = Bundle.module.url(forResource: "MetalMorph.generated", withExtension: "js") else {
                throw CocoaError(.fileNoSuchFile)
            }
            created.evaluateScript(try String(contentsOf: url))
            guard created.exception == nil else { throw CocoaError(.coderInvalidValue) }
            context = created; js = created
        }
        js.exception = nil
        let input: [String: Any] = ["name": from.name, "turn": from.turn, "weight": from.line]
        guard let result = js.objectForKeyedSubscript("MetalMorph")?.invokeMethod("plan", withArguments: [input, to.name, to.line, to.turn, seed as Any? ?? NSNull()]),
              js.exception == nil, let text = result.toString(), let data = text.data(using: .utf8) else {
            throw CocoaError(.coderInvalidValue)
        }
        let payload = try JSONDecoder().decode(MetalMorphPayload.self, from: data)
        lastPlanningSeconds = Self.cpuTime() - started
        let pathStart = Self.cpuTime()
        let frames = payload.frames.map { frame in
            MetalMorphFrame(source: frame.source, parts: frame.parts.map { part in
                MetalMorphPart(path: MetalSVGPath.parse(part.path), outline: MetalSVGPath.parse(part.outline),
                    weight: part.weight, tint: part.tint, solid: part.solid, opacity: part.opacity,
                    body: part.body, holes: part.holes, behind: part.behind, inside: part.inside)
            })
        }
        lastPathSeconds = Self.cpuTime() - pathStart
        return MetalMorphFrames(duration: payload.duration, frames: frames)
    }
}

struct MetalMorphCanvas: View {
    let frame: MetalMorphFrame
    let box: CGFloat
    let duoK: Double
    var body: some View {
        Canvas { context, _ in
            context.scaleBy(x: box / 24, y: box / 24)
            for part in frame.parts {
                var ink = context
                for relation in part.inside {
                    let caster = frame.parts[relation.part]
                    ink.clip(to: caster.outline, style: FillStyle(eoFill: caster.holes))
                    if relation.r > 0 {
                        ink.clip(to: caster.outline.strokedPath(StrokeStyle(lineWidth: 2 * relation.r, lineCap: .round, lineJoin: .round)), options: .inverse)
                    }
                }
                for relation in part.behind {
                    let caster = frame.parts[relation.part]
                    if caster.body { ink.clip(to: caster.outline, style: FillStyle(eoFill: caster.holes), options: .inverse) }
                    if relation.r > 0 {
                        ink.clip(to: caster.outline.strokedPath(StrokeStyle(lineWidth: 2 * relation.r, lineCap: .round, lineJoin: .round)), options: .inverse)
                    }
                }
                ink.opacity = part.opacity
                if part.tint > 0 || part.solid > 0 {
                    var fill = ink
                    fill.opacity = part.opacity * (part.tint * duoK + part.solid)
                    fill.fill(part.path, with: .foreground, style: FillStyle(eoFill: part.holes))
                }
                if part.weight > 0 {
                    ink.stroke(part.path, with: .foreground, style: StrokeStyle(lineWidth: part.weight, lineCap: .round, lineJoin: .round))
                }
            }
        }
        .frame(width: box, height: box)
    }
}
