import SwiftUI

/// How much a beeper's disc flexes (0...1) through an earcon, the same samples as parts/beeper.ts:
/// each note rises in rise-ms to its level, holds for its length and falls in fall-ms.
public enum MetalBeeperEnvelope {
    public static func samples(_ earcon: MetalEarcon) -> [(at: Double, v: Double)] {
        let notes = earcon.notes, rise = MetalGadgetTokens.beeperRiseMs, fall = MetalGadgetTokens.beeperFallMs
        let end = (notes.map { $0.atMs + $0.lengthMs }.max() ?? 0) + fall
        func env(_ t: Double) -> Double {
            notes.map { note -> Double in
                let top = min(1, note.level)
                if t < note.atMs { return 0 }
                if t < note.atMs + rise { return top * (t - note.atMs) / rise }
                if t <= note.atMs + note.lengthMs { return top }
                return max(0, top * (1 - (t - note.atMs - note.lengthMs) / fall))
            }.max() ?? 0
        }
        let step = MetalGadgetTokens.beeperSampleMs
        return stride(from: 0, through: end + step / 2, by: step).map { t in (min(t, end), env(min(t, end))) }
    }
}

/// A grille plate over a brass piezo disc, the only source of tones in a gadget. It never glows: when
/// `trigger` changes it plays `earcon`'s notes, the disc catching the light and the plate lifting a hair
/// (no lift with Reduce Motion). The sound is the caller's (`MetalSound.beep`). The twin of `Beeper`.
public struct MetalBeeper: View {
    let slots: Int
    let material: MetalSoundMaterial
    let color: MetalOklch
    let earcon: MetalEarcon?
    let trigger: Int
    let size: Double
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(slots: Int = MetalGadgetTokens.beeperSlots, material: MetalSoundMaterial = .metal, color: MetalOklch? = nil,
                earcon: MetalEarcon? = nil, trigger: Int = 0, size: Double = 96) {
        let metal = MetalGadgetTokens.jackMetal
        self.slots = slots; self.material = material; self.earcon = earcon; self.trigger = trigger; self.size = size
        self.color = color ?? (material == .clay
            ? MetalOklch(L: MetalGadgetTokens.plugFaceClay, C: MetalGadgetTokens.plugFaceChroma, H: MetalSoundMaterial.clay.finish.sampleHue)
            : MetalOklch(L: metal.L, C: metal.C, H: metal.H))
    }

    /// The slots on the 400-unit canvas, as the React Part draws them alone.
    private var slotRects: [CGRect] {
        let c = MetalGadgetTokens.canvas / 2, W = MetalGadgetTokens.beeperAlone, H = W * MetalGadgetTokens.beeperAspect
        let sw = W * min(MetalGadgetTokens.beeperSlot.width, MetalGadgetTokens.beeperSpan / Double(2 * slots - 1)), sh = H * MetalGadgetTokens.beeperSlot.height, span = W * MetalGadgetTokens.beeperSpan
        return (0..<slots).map { i in
            let x = slots == 1 ? c : c - span / 2 + Double(i) * span / Double(slots - 1)
            return CGRect(x: x - sw / 2, y: c - sh / 2, width: sw, height: sh)
        }
    }

    private var platePath: CGPath {
        let c = MetalGadgetTokens.canvas / 2, W = MetalGadgetTokens.beeperAlone, H = W * MetalGadgetTokens.beeperAspect
        let path = CGMutablePath()
        path.addRoundedRect(in: CGRect(x: c - W / 2, y: c - H / 2, width: W, height: H), cornerWidth: H * MetalGadgetTokens.beeperRadius, cornerHeight: H * MetalGadgetTokens.beeperRadius)
        for r in slotRects { path.addRoundedRect(in: r, cornerWidth: r.width / 2, cornerHeight: r.width / 2) }
        return path
    }

    private func floors(_ unit: Double, _ fill: Color) -> some View {
        ForEach(0..<slots, id: \.self) { i in
            let r = slotRects[i]
            Capsule().fill(fill).frame(width: r.width * unit, height: r.height * unit).position(x: r.midX * unit, y: r.midY * unit)
        }
    }

    private func body(flex v: Double) -> some View {
        let unit = size / MetalGadgetTokens.canvas, b = MetalGadgetTokens.beeperBrass
        let lift = reduceMotion ? 0 : MetalGadgetTokens.beeperAlone * MetalGadgetTokens.beeperLift * unit * v
        return ZStack(alignment: .topLeading) {
            floors(unit, MetalPigment.color(lightness: b.L, chroma: b.C, hue: b.H))
            floors(unit, MetalPigment.color(lightness: MetalGadgetTokens.beeperLitL, chroma: b.C, hue: b.H)).opacity(v)
            // The top wall of each slot hides the light, as the jack's socket does.
            ForEach(0..<slots, id: \.self) { i in
                let r = slotRects[i]
                Capsule().stroke(MetalGadgetLighting.shadow.opacity(MetalGadgetTokens.holeAlpha), lineWidth: MetalGadgetTokens.holeBlur * unit)
                    .offset(x: MetalGadgetTokens.holeOffset.dx * unit, y: MetalGadgetTokens.holeOffset.dy * unit)
                    .blur(radius: MetalGadgetTokens.holeBlur * unit / 2).clipShape(Capsule())
                    .frame(width: r.width * unit, height: r.height * unit).position(x: r.midX * unit, y: r.midY * unit)
            }
            if let image = MetalGadgetLighting.surface(platePath, key: "beeper-\(slots)-\(material.rawValue)", material: material,
                                                       lightness: color.L, chroma: color.C, hue: color.H,
                                                       size: size, scale: max(1, displayScale), colorway: colorway) {
                Image(decorative: image, scale: max(1, displayScale)).frame(width: size, height: size)
            }
        }
        .frame(width: size, height: size, alignment: .topLeading)
        .offset(y: -lift)
    }

    public var body: some View {
        let samples = earcon.map(MetalBeeperEnvelope.samples) ?? []
        KeyframeAnimator(initialValue: 0.0, trigger: trigger) { v in
            body(flex: v)
        } keyframes: { _ in
            KeyframeTrack {
                for s in samples { LinearKeyframe(s.v, duration: MetalGadgetTokens.beeperSampleMs / 1000) }
            }
        }
        .accessibilityElement()
        .accessibilityLabel(earcon.map { "beeper: \($0.label)" } ?? "beeper")
    }
}
