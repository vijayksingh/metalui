import SwiftUI

/// One track winds from bar to ring. Turn anticlockwise to lower its bound value.
public struct MetalDial: View {
    @Binding private var value: Double
    private let range: ClosedRange<Double>
    private let step: Double
    private let largeStep: Double
    private let curl: Double
    private let barLength: Double?
    private let marks: [Double]
    private let ticks: [MetalSliderTick]
    private let tickStyle: MetalSliderTickStyle
    private let label: String
    private let valueText: (Double) -> String
    private let onCurlRest: ((Double) -> Void)?
    private let onFocusChange: ((Bool) -> Void)?
    private let onDragChange: ((Bool) -> Void)?
    @State private var shownCurl: Double
    @MetalMotionPreference private var reduceMotion

    public init(value: Binding<Double>, in range: ClosedRange<Double> = 0...1,
                step: Double = .one, largeStep: Double? = nil,
                curl: Double = .one, initialCurl: Double? = nil,
                barLength: Double? = nil, marks: [Double] = [], ticks: [MetalSliderTick] = [],
                tickStyle: MetalSliderTickStyle = .meta, label: String,
                valueText: @escaping (Double) -> String = { String($0) },
                onCurlRest: ((Double) -> Void)? = nil,
                onFocusChange: ((Bool) -> Void)? = nil, onDragChange: ((Bool) -> Void)? = nil) {
        _value = value; self.range = range; self.step = step; self.largeStep = largeStep ?? step * 10
        self.curl = min(.one, max(.zero, curl)); self.barLength = barLength
        self.marks = marks; self.ticks = ticks; self.tickStyle = tickStyle
        self.label = label; self.valueText = valueText; self.onCurlRest = onCurlRest
        self.onFocusChange = onFocusChange; self.onDragChange = onDragChange
        _shownCurl = State(initialValue: min(.one, max(.zero, initialCurl ?? curl)))
    }

    public var body: some View {
        MetalDialBody(value: $value, range: range, step: step, largeStep: largeStep,
                      curl: shownCurl, barLength: barLength, marks: marks, ticks: ticks,
                      tickStyle: tickStyle, label: label, valueText: valueText,
                      onFocusChange: onFocusChange, onDragChange: onDragChange)
            .transaction { if reduceMotion { $0.animation = nil; $0.disablesAnimations = true } }
            .onAppear { wind(to: curl) }
            .onChange(of: curl) { _, next in wind(to: next) }
            .onChange(of: reduceMotion) { _, reduced in if reduced { wind(to: curl) } }
    }

    private func wind(to target: Double) {
        guard shownCurl != target else { onCurlRest?(target); return }
        // Only the curve interpolates; Reduce Motion resolves its geometry immediately.
        withAnimation(reduceMotion ? nil : MetalSprings.surface.animation, completionCriteria: .removed) {
            shownCurl = target
        } completion: {
            // An interrupted spring must not report a stale destination.
            if shownCurl == target && curl == target { onCurlRest?(target) }
        }
    }
}

private struct MetalDialBody: View, Animatable {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let largeStep: Double
    var curl: Double
    let barLength: Double?
    let marks: [Double]
    let ticks: [MetalSliderTick]
    let tickStyle: MetalSliderTickStyle
    let label: String
    let valueText: (Double) -> String
    let onFocusChange: ((Bool) -> Void)?
    let onDragChange: ((Bool) -> Void)?
    @State private var dragging = false
    @State private var hovering = false
    @FocusState private var focused: Bool
    @Environment(\.isEnabled) private var enabled
    @Environment(\.metalColorway) private var colorway
    @Environment(\.metalSnapshot) private var snapshot

    var animatableData: Double {
        get { curl }
        set { curl = newValue }
    }
    private var span: Double { max(Double.leastNonzeroMagnitude, range.upperBound - range.lowerBound) }
    private var fraction: Double { min(.one, max(.zero, (value - range.lowerBound) / span)) }
    private func set(_ next: Double) { if enabled { value = min(range.upperBound, max(range.lowerBound, next)) } }

    var body: some View {
        let geometry = MetalDialGeometry(curl: curl, barLength: barLength)
        let recipe = MetalRecipes.dial
        let knob = geometry.knob(at: fraction)
        let finish = MetalRecipeColorway(colorway)
        ZStack(alignment: .topLeading) {
            Canvas { context, _ in
                let track = geometry.path()
                let stroke = StrokeStyle(lineWidth: geometry.track, lineCap: .round, lineJoin: .round)
                context.stroke(track, with: .color(recipe.color("track.edge", colorway: finish)?.color ?? .clear),
                               style: StrokeStyle(lineWidth: geometry.track + MetalRecipes.slider.points("tick.w"), lineCap: .round, lineJoin: .round))
                context.stroke(track, with: .color(recipe.color("track.color", colorway: finish)?.color ?? .clear), style: stroke)
                if fraction > .zero {
                    context.stroke(geometry.path(to: fraction), with: .color(recipe.color("fill.color", colorway: finish)?.color ?? .clear), style: stroke)
                }
                for mark in marks {
                    let point = geometry.at(mark), normal = geometry.normal(at: mark)
                    let half = max(.zero, geometry.track / 2 - MetalRecipes.slider.points("mark.w"))
                    var path = Path()
                    path.move(to: CGPoint(x: point.x - normal.dx * half, y: point.y - normal.dy * half))
                    path.addLine(to: CGPoint(x: point.x + normal.dx * half, y: point.y + normal.dy * half))
                    context.stroke(path, with: .color(recipe.color("mark.color", colorway: finish)?.color ?? .clear),
                                   style: StrokeStyle(lineWidth: MetalRecipes.slider.points("mark.w"), lineCap: .round))
                }
                for tick in ticks {
                    let point = geometry.at(tick.at), normal = geometry.normal(at: tick.at)
                    let side: Double = geometry.curl < 0.5 ? .one : -.one
                    let outset = geometry.track / 2 + recipe.points("self.tick-out")
                    var path = Path()
                    path.move(to: CGPoint(x: point.x + normal.dx * outset * side, y: point.y + normal.dy * outset * side))
                    path.addLine(to: CGPoint(x: point.x + normal.dx * (outset + recipe.points("self.tick")) * side,
                                            y: point.y + normal.dy * (outset + recipe.points("self.tick")) * side))
                    var tickContext = context
                    tickContext.opacity = abs(1 - geometry.curl * 2)
                    tickContext.stroke(path, with: .color(recipe.color("tick.color", colorway: finish)?.color ?? .clear),
                                       lineWidth: MetalRecipes.slider.points("tick.w"))
                }
            }
            .allowsHitTesting(false).accessibilityHidden(true)
            ForEach(Array(ticks.enumerated()), id: \.offset) { _, tick in
                let point = geometry.at(tick.at)
                Group {
                    if tickStyle == .engraved { MetalLabel(tick.label, style: .engraved) }
                    else { Text(tick.label).font(.metal(MetalType.meta)).foregroundStyle(colorway.tokens.ink2.color) }
                }
                .fixedSize().frame(width: .zero, height: .zero, alignment: .top)
                .position(x: point.x, y: point.y + geometry.track / 2 + recipe.points("self.tick-out") + recipe.points("self.tick") + MetalRecipes.slider.points("mark.w"))
                .opacity(geometry.labelOpacity)
                .allowsHitTesting(false).accessibilityHidden(true)
            }
            ZStack(alignment: .top) {
                Color.clear.metalObjectRecipe(MetalRecipes.slider, part: "knob", state: enabled ? (dragging ? "press" : hovering ? "hover" : nil) : nil, in: Circle())
                Circle().fill(recipe.color("fill.color", colorway: finish)?.color ?? .clear)
                    .frame(width: recipe.points("self.dot"), height: recipe.points("self.dot"))
                    .offset(y: recipe.points("self.dot-inset"))
                    .opacity(geometry.disc)
            }
            .frame(width: knob.diameter, height: knob.diameter)
            .rotationEffect(.degrees(knob.facing))
            .overlay {
                if focused {
                    Circle().inset(by: -(MetalRing.focusOffset + MetalRing.focusWidth / 2))
                        .stroke(MetalShared.focus.color, lineWidth: MetalRing.focusWidth)
                }
            }
            .contentShape(Circle())
            .focusable(enabled, interactions: .edit).focusEffectDisabled().focused($focused)
            .onKeyPress(keys: [.leftArrow, .rightArrow, .upArrow, .downArrow, .pageUp, .pageDown, .home, .end], phases: [.down, .repeat]) { press in
                guard enabled else { return .ignored }
                let by = press.modifiers.contains(.shift) ? largeStep : step
                switch press.key {
                case .leftArrow, .downArrow: set(value - by)
                case .rightArrow, .upArrow: set(value + by)
                case .pageUp: set(value + largeStep)
                case .pageDown: set(value - largeStep)
                case .home: set(range.lowerBound)
                case .end: set(range.upperBound)
                default: return .ignored
                }
                return .handled
            }
            .accessibilityElement(children: .ignore).accessibilityLabel(label).accessibilityValue(valueText(value))
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: set(value + step)
                case .decrement: set(value - step)
                @unknown default: break
                }
            }
            .position(knob.position)
        }
        .frame(width: geometry.size.width, height: geometry.size.height)
        .contentShape(Rectangle())
        .onHover { hovering = $0 }
        .gesture(DragGesture(minimumDistance: .zero).onChanged { gesture in
            guard enabled else { return }
            if !dragging { dragging = true; focused = true; onDragChange?(true) }
            set(range.lowerBound + geometry.nearest(to: gesture.location, previous: fraction) * span)
        }.onEnded { _ in dragging = false; onDragChange?(false) })
        .background {
            if !snapshot && enabled { MetalDialScroll { direction in set(value + direction * step) } }
        }
        .opacity(enabled ? .one : MetalRecipes.slider.scalar("self.disabled"))
        .onChange(of: focused) { _, next in onFocusChange?(next) }
        .onChange(of: enabled) { _, next in if !next && dragging { dragging = false; onDragChange?(false) } }
        .onDisappear { if dragging { onDragChange?(false) }; onFocusChange?(false) }
    }
}


/// The web dial's constant-curvature construction, sampled for drawing and pointer projection.
/// Numbers here are mathematical fractions/sample counts; all physical dimensions are recipes.
struct MetalDialGeometry {
    static let samples = 96
    let curl: Double
    let length: Double
    let sweep: Double
    let disc: Double
    let track: Double
    let size: CGSize
    private let curvature: Double
    private let origin: CGPoint
    var labelOpacity: Double { max(.zero, 1 - curl * 4) }

    init(curl: Double, barLength: Double?) {
        let recipe = MetalRecipes.dial
        let curl = min(Double.one, max(.zero, curl))
        let ring = recipe.points("self.length")
        let sweep = (Double(recipe.text("self.sweep")?.replacingOccurrences(of: "deg", with: "") ?? "") ?? .zero) * .pi / 180
        let length = (barLength ?? ring) + (ring - (barLength ?? ring)) * curl
        let phase = min(Double.one, max(.zero, (curl - 0.15) / 0.85))
        let disc = phase * phase * (3 - 2 * phase)
        let track = recipe.points("self.track") + (recipe.points("self.groove") - recipe.points("self.track")) * disc
        let curvature = sweep * curl / max(Double.leastNonzeroMagnitude, length)
        let knob = recipe.points("self.knob")
        let pad = knob / 2 + (track / 2 + recipe.points("self.tick-out") + recipe.points("self.tick") + MetalRecipes.slider.points("tick.w") - knob / 2) * disc
        let points = (0...Self.samples).map { Self.raw(Double($0) / Double(Self.samples), length: length, curvature: curvature, theta: sweep * curl) }
        let minX = points.map(\.x).min() ?? .zero, maxX = points.map(\.x).max() ?? .zero
        let minY = points.map(\.y).min() ?? .zero, maxY = points.map(\.y).max() ?? .zero
        origin = CGPoint(x: pad - minX, y: pad - minY)
        size = CGSize(width: maxX - minX + pad * 2, height: maxY - minY + pad * 2)
        self.curl = curl; self.length = length; self.sweep = sweep
        self.disc = disc; self.track = track; self.curvature = curvature
    }

    private static func raw(_ fraction: Double, length: Double, curvature: Double, theta: Double) -> CGPoint {
        let distance = min(.one, max(.zero, fraction)) * length
        guard curvature > Double.ulpOfOne.squareRoot() else { return CGPoint(x: distance, y: .zero) }
        let x = sin(curvature * distance) / curvature
        let y = (1 - cos(curvature * distance)) / curvature
        let turn = -theta / 2
        return CGPoint(x: x * cos(turn) - y * sin(turn), y: x * sin(turn) + y * cos(turn))
    }

    func at(_ fraction: Double) -> CGPoint {
        let point = Self.raw(fraction, length: length, curvature: curvature, theta: sweep * curl)
        return CGPoint(x: point.x + origin.x, y: point.y + origin.y)
    }

    var centre: CGPoint? {
        guard curvature > Double.ulpOfOne.squareRoot() else { return nil }
        let turn = -sweep * curl / 2
        return CGPoint(x: -sin(turn) / curvature + origin.x, y: cos(turn) / curvature + origin.y)
    }

    func normal(at fraction: Double) -> CGVector {
        let epsilon = 1 / Double(Self.samples * 4)
        let a = at(fraction - epsilon), b = at(fraction + epsilon)
        let dx = b.x - a.x, dy = b.y - a.y
        let magnitude = max(Double.leastNonzeroMagnitude, hypot(dx, dy))
        return CGVector(dx: -dy / magnitude, dy: dx / magnitude)
    }

    func nearest(to point: CGPoint, previous: Double) -> Double {
        let fraction = (0...Self.samples).min { a, b in
            let pa = at(Double(a) / Double(Self.samples)), pb = at(Double(b) / Double(Self.samples))
            return hypot(pa.x - point.x, pa.y - point.y) < hypot(pb.x - point.x, pb.y - point.y)
        }.map { Double($0) / Double(Self.samples) } ?? previous
        // A straight bar has no gap; a wound track retains the end it left rather than jumping.
        if curl > .zero && abs(fraction - previous) > 0.5 { return previous > 0.5 ? .one : .zero }
        return fraction
    }

    func path(to fraction: Double = .one) -> Path {
        Path { path in
            path.move(to: at(.zero))
            let stop = min(.one, max(.zero, fraction))
            for index in 1...Self.samples {
                let next = Double(index) / Double(Self.samples)
                if next >= stop { path.addLine(to: at(stop)); break }
                path.addLine(to: at(next))
            }
        }
    }

    func knob(at fraction: Double) -> (position: CGPoint, diameter: Double, facing: Double) {
        let recipe = MetalRecipes.dial
        let point = at(fraction), centre = centre ?? point
        let position = CGPoint(x: point.x + (centre.x - point.x) * disc, y: point.y + (centre.y - point.y) * disc)
        let knob = recipe.points("self.knob")
        let rest = 2 * (recipe.points("self.length") / sweep - recipe.points("self.groove") / 2 - recipe.points("self.disc-gap"))
        let discSize = curvature > Double.ulpOfOne.squareRoot()
            ? max(knob, min(rest, 2 * (1 / curvature - track / 2 - recipe.points("self.disc-gap")))) : knob
        let facing = self.centre == nil ? .zero : (atan2(point.y - centre.y, point.x - centre.x) * 180 / .pi + 90) * disc
        return (position, knob + (discSize - knob) * disc, facing)
    }
}

#if canImport(AppKit)
import AppKit

struct MetalDialScroll: NSViewRepresentable {
    let turn: (Double) -> Void
    func makeNSView(context: Context) -> MetalDialScrollView { MetalDialScrollView() }
    func updateNSView(_ view: MetalDialScrollView, context: Context) { view.turn = turn }
    static func dismantleNSView(_ view: MetalDialScrollView, coordinator: ()) { view.detach() }
}

final class MetalDialScrollView: NSView {
    var turn: ((Double) -> Void)?
    private var monitor: Any?
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow(); detach()
        guard window != nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: .scrollWheel) { [weak self] event in
            guard let self, self.window === event.window,
                  self.bounds.contains(self.convert(event.locationInWindow, from: nil)) else { return event }
            let delta = event.scrollingDeltaY == .zero ? event.scrollingDeltaX : event.scrollingDeltaY
            if delta != .zero { self.turn?(delta > .zero ? .one : -.one) }
            return nil
        }
    }
    func detach() { if let monitor { NSEvent.removeMonitor(monitor) }; monitor = nil }
}
#elseif canImport(UIKit)
import UIKit

/// Trackpad/mouse scrolling on iPad. Touch dragging remains the SwiftUI dial's gesture.
struct MetalDialScroll: UIViewRepresentable {
    let turn: (Double) -> Void
    func makeUIView(context: Context) -> MetalDialScrollView { MetalDialScrollView() }
    func updateUIView(_ view: MetalDialScrollView, context: Context) { view.turn = turn }
    static func dismantleUIView(_ view: MetalDialScrollView, coordinator: ()) { view.detach() }
}

final class MetalDialScrollView: UIView, UIGestureRecognizerDelegate {
    var turn: ((Double) -> Void)?
    private weak var observedWindow: UIWindow?
    private var previous: CGPoint = .zero
    private lazy var scroll: UIPanGestureRecognizer = {
        let recognizer = UIPanGestureRecognizer(target: self, action: #selector(scrolled))
        recognizer.allowedScrollTypesMask = .all
        recognizer.cancelsTouchesInView = false
        recognizer.delegate = self
        return recognizer
    }()
    override init(frame: CGRect) { super.init(frame: frame); isUserInteractionEnabled = false; isAccessibilityElement = false }
    @available(*, unavailable) required init?(coder: NSCoder) { fatalError() }
    override func didMoveToWindow() { super.didMoveToWindow(); detach(); window?.addGestureRecognizer(scroll); observedWindow = window }
    func detach() { observedWindow?.removeGestureRecognizer(scroll); observedWindow = nil }
    func gestureRecognizer(_ recognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool { false }
    override func gestureRecognizerShouldBegin(_ recognizer: UIGestureRecognizer) -> Bool {
        guard let window else { return false }
        previous = .zero
        return bounds.contains(convert(recognizer.location(in: window), from: window))
    }
    @objc private func scrolled() {
        let point = scroll.translation(in: observedWindow)
        let dy = point.y - previous.y, dx = point.x - previous.x
        let delta = dy == .zero ? dx : dy
        if delta != .zero { turn?(delta < .zero ? .one : -.one) }
        previous = point
    }
}
#endif
