import SwiftUI

/// A six-digit source colour opens the shared well and hue slider. No separate material or motion.
/// The native popover retains MetalPopover's documented material WIP; text, well and slider share recipes.
public struct MetalColourCue: View {
    @Binding private var value: String
    private let label: String
    private let readOnly: Bool
    private let raw: Bool
    private let onBegin: (() -> Bool)?
    private let onSourceChange: ((String) -> Bool)?
    private let onCommit: (() -> Void)?
    private let onCancel: ((String) -> Void)?
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.metalColorway) private var colorway
    @MetalMotionPreference private var reduceMotion
    @FocusState private var focused: Bool
    @State private var presented = false
    @State private var held: Held?
    @State private var dragging = false
    @State private var staleDrag = false
    private struct Held { let before: String; var last: String; let basis: ColourChannels }

    public init(_ label: String, value: Binding<String>, readOnly: Bool = false, raw: Bool = false,
                onBegin: (() -> Bool)? = nil, onSourceChange: ((String) -> Bool)? = nil,
                onCommit: (() -> Void)? = nil, onCancel: ((String) -> Void)? = nil) {
        precondition(Self.valid(value.wrappedValue), "MetalColourCue needs a full six-digit hex value")
        self.label = label; _value = value; self.readOnly = readOnly; self.raw = raw
        self.onBegin = onBegin; self.onSourceChange = onSourceChange; self.onCommit = onCommit; self.onCancel = onCancel
    }
    private static let footprint = "#" + String(repeating: "F", count: 6)
    private var basis: ColourChannels { ColourChannels(value) }
    private var trigger: some View {
        Button { if !readOnly && isEnabled { presented.toggle() } } label: {
            ZStack(alignment: .leading) {
                Text(Self.footprint).font(.metal(MetalType.readout)).hidden().accessibilityHidden(true)
                (raw ? Text(value) : Text(value).metalCue(.hex, colorway: colorway, hex: MetalRGBA(hex: value)))
                    .font(.metal(MetalType.readout)).monospacedDigit()
                    .contentTransition(reduceMotion ? .opacity : .numericText())
                    .metalAnimation(.settle, value: value)
                    .overlay(alignment: .topLeading) {
                        RoundedRectangle(cornerRadius: MetalCue.swatchRadius)
                            .fill((MetalRGBA(hex: value) ?? colorway.tokens.ink).color)
                            .frame(width: MetalRecipes.button.points("compact.glyph"), height: MetalRecipes.button.points("compact.glyph"))
                            .offset(y: -(MetalRecipes.button.points("compact.glyph") + MetalSpace.s2))
                            .opacity(raw ? .zero : .one).accessibilityHidden(true)
                    }

            }.fixedSize().padding(.top, MetalRecipes.button.points("compact.glyph") + MetalSpace.s2)
        }
        .buttonStyle(.plain).focused($focused)
        .overlay {
            if focused && isEnabled {
                RoundedRectangle(cornerRadius: MetalRecipes.well.points("radius.field"))
                    .inset(by: -(MetalButtonMetrics.focusOffset + MetalButtonMetrics.focusWidth / 2))
                    .stroke(MetalShared.focus.color, lineWidth: MetalButtonMetrics.focusWidth)
            }
        }
        .foregroundStyle(colorway.tokens.ink.color)
        .accessibilityLabel("\(label), \(value)\(readOnly ? ", read only" : "")")
        .help(readOnly ? "Read only" : "Open colour well; drag hue or use arrow keys")
    }
    public var body: some View {
        let padding = MetalSpace.s16
        return MetalPopover(label, isPresented: $presented, trigger: { trigger }) {
            MetalWell(.field) {
                VStack(alignment: .leading, spacing: MetalSpace.s16) {
                    MetalCueText(value, kind: .hex, meaning: .colour, label: label, color: MetalRGBA(hex: value))
                    MetalSlider(value: Binding(get: { min(basis.hue ?? .zero, Self.turn - 1) }, set: change),
                                in: .zero...(Self.turn - 1), step: 1, largeStep: 15, showsValue: true,
                                tone: .neutral, label: "\(label) hue", valueText: { "\(Int($0.rounded()))°" },
                                onDragChange: { down in
                                    dragging = down
                                    if down { staleDrag = !begin() }
                                    else { commit(); staleDrag = false }
                                })
                    if basis.hue == nil { Text("This colour is achromatic; hue alone keeps it unchanged.").font(.metal(MetalType.meta)) }
                }.padding(padding)
            }
            .onKeyPress(.escape) { cancel(); presented = false; return .handled }
            .disabled(readOnly || !isEnabled)
        }
        .onChange(of: value) { _, next in
            if let held, next != held.last { self.held = nil; staleDrag = dragging; onCancel?("external") }
        }
        .onChange(of: isEnabled) { _, enabled in if !enabled { let active = held != nil; held = nil; staleDrag = dragging; presented = false; if active { onCancel?("external") } } }
        .onChange(of: readOnly) { _, locked in if locked { let active = held != nil; held = nil; staleDrag = dragging; presented = false; if active { onCancel?("external") } } }
        .onChange(of: presented) { _, open in if !open { commit(); dragging = false; staleDrag = false } }
        .onDisappear { if held != nil { held = nil; onCancel?("unmount") } }
        .transaction { if reduceMotion { $0.animation = nil; $0.disablesAnimations = true } }
    }
    private func begin() -> Bool {
        if held != nil { return true }
        guard isEnabled, !readOnly, onBegin?() != false else { return false }
        held = Held(before: value, last: value, basis: basis); return true
    }
    private func commit() { guard held != nil else { return }; held = nil; onCommit?() }
    private func cancel() {
        guard let previous = held else { return }; held = nil; staleDrag = dragging
        if onSourceChange?(previous.before) != false { value = previous.before }
        onCancel?("escape")
    }
    private func change(_ hue: Double) {
        guard isEnabled, !readOnly, !staleDrag else { return }
        let hsl = held?.basis ?? basis
        let next = hsl.hex(hue)
        guard next != value, begin() else { return }
        guard onSourceChange?(next) != false else { held = nil; staleDrag = dragging; onCancel?("external"); return }
        held?.last = next; value = next; MetalHaptic.detent.perform()
        if !dragging { commit() }
    }
    private static let turn = 360.0, channel = 255.0, sector = 60.0
    private static func valid(_ value: String) -> Bool {
        value.count == 7 && value.hasPrefix("#") && UInt32(value.dropFirst(), radix: 16) != nil
    }
    private struct ColourChannels {
        let hue: Double?, saturation: Double, lightness: Double
        init(_ hex: String) {
            let color = MetalRGBA(hex: hex) ?? MetalRGBA(0, 0, 0, 1)
            let r = color.red / channel, g = color.green / channel, b = color.blue / channel
            let hi = max(r, g, b), lo = min(r, g, b), delta = hi - lo
            lightness = (hi + lo) / 2
            saturation = delta == .zero ? .zero : delta / (1 - abs(2 * lightness - 1))
            let sectorIndex = hi == r ? (g - b) / delta : hi == g ? (b - r) / delta + 2 : (r - g) / delta + 4
            hue = delta == .zero ? nil : (sectorIndex * sector + turn).truncatingRemainder(dividingBy: turn)
        }
        func hex(_ hue: Double) -> String {
            let c = (1 - abs(2 * lightness - 1)) * saturation
            let h = (hue.truncatingRemainder(dividingBy: turn) + turn).truncatingRemainder(dividingBy: turn) / sector
            let x = c * (1 - abs(h.truncatingRemainder(dividingBy: 2) - 1)), m = lightness - c / 2
            let rgb: [Double] = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x]
            return "#" + rgb.map { String(format: "%02X", Int((($0 + m) * channel).rounded())) }.joined()
        }
    }
}
