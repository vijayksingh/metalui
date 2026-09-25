import SwiftUI

/// Gadgets on a grid in one panel, wired by patch cables: the SwiftUI twin of `<Rig>`. Each gadget sits
/// in a tray and is drawn by `MetalGadget`; every wired port has a jack with a plug in it and a rubber
/// cord hangs between them. Set a gadget's input (`values`) and the rig carries it: a bead of light runs
/// along each cord it crosses, and the gadget at the far end answers when it arrives. Never a control.
public struct MetalRig: View {
    let width: Double
    let values: [String: [String: Double]]
    let sound: MetalSound?
    @State private var engine: MetalRigEngine
    @State private var shown: [String: [String: MetalGadgetValue]]
    @State private var beads: [(id: UUID, cable: Int, start: Date)] = []
    @Environment(\.metalColorway) private var colorway
    @Environment(\.displayScale) private var displayScale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(spec: MetalRigSpec, catalog: [String: MetalGadgetSpec] = [:], values: [String: [String: Double]] = [:], sound: MetalSound? = nil, width: Double = 560) {
        let e = MetalRigEngine(spec, catalog: catalog)
        self.width = width; self.values = values; self.sound = sound
        _engine = State(initialValue: e); _shown = State(initialValue: e.inputs)
    }

    public var body: some View {
        let t = MetalGadgetTokens.self, unit = width / engine.width, height = engine.height * unit, s = t.canvas / engine.width
        let r = MetalGadgetModel.resolve(MetalGadgetPlacement(job: MetalGadgetJob(rawValue: engine.spec.job) ?? .keep, feel: engine.spec.feel))
        TimelineView(.animation(paused: beads.isEmpty)) { timeline in
            ZStack(alignment: .topLeading) {
                // The panel, lit by the one light, with a tray for each gadget (their floors below it).
                ForEach(engine.modules, id: \.inst) { m in
                    RoundedRectangle(cornerRadius: t.bodyRadius * unit, style: .continuous)
                        .fill(MetalPigment.color(lightness: r.body.L - t.holeFloorDrop, chroma: r.body.C * t.holeFloorChroma, hue: r.body.H))
                        .frame(width: (t.bodyRect.width + t.rigTray) * unit, height: (t.bodyRect.height + t.rigTray) * unit)
                        .position(x: (m.at.x + t.bodyRect.x + t.bodyRect.width / 2) * unit, y: (m.at.y + t.bodyRect.y + t.bodyRect.height / 2) * unit)
                }
                if let image = MetalGadgetLighting.surface(panelPath(scale: s), key: "rig-\(engine.spec.name)", material: r.material,
                                                           lightness: r.body.L, chroma: r.body.C, hue: r.body.H,
                                                           size: width, scale: max(1, displayScale), colorway: colorway) {
                    // Square and mostly clear below the panel: its shadow may fall past the rig's edge, so no clip.
                    Image(decorative: image, scale: max(1, displayScale)).frame(width: width, height: width, alignment: .topLeading)
                        .frame(width: width, height: height, alignment: .topLeading)
                }
                ForEach(Array(engine.jacks.enumerated()), id: \.offset) { _, j in
                    MetalJack(size: t.rigJack * unit * t.canvas / t.jackNut).position(x: j.at.x * unit, y: j.at.y * unit)
                }
                ForEach(engine.modules, id: \.inst) { m in
                    let drive = m.spec.mechanism.drive ?? m.spec.ports?.in?.keys.sorted().first ?? ""
                    MetalGadget(spec: m.spec, value: shown[m.inst]?[drive]?.number, sound: engine.modules.prefix(t.rigVoices).contains { $0.inst == m.inst } ? sound : nil,
                                size: t.canvas * unit)
                        .position(x: (m.at.x + t.canvas / 2) * unit, y: (m.at.y + t.canvas / 2) * unit)
                }
                ForEach(engine.cords, id: \.index) { c in
                    MetalCable(from: CGPoint(x: c.a.x * s, y: c.a.y * s), to: CGPoint(x: c.b.x * s, y: c.b.y * s), length: c.length * s, size: width, width: t.cableWidth * s)
                        .frame(width: width, height: width, alignment: .topLeading)
                    ForEach([c.a, c.b], id: \.x) { at in
                        let px = t.rigJack * t.plugFace * unit * t.canvas / t.plugAlone
                        MetalPlug(size: px).position(x: at.x * unit, y: at.y * unit - (t.plugCentreY - t.canvas / 2) * px / t.canvas)
                    }
                }
                ForEach(beads, id: \.id) { b in
                    if let c = engine.cords.first(where: { $0.index == b.cable }) {
                        let p = Self.point(on: c, share: min(1, timeline.date.timeIntervalSince(b.start) * 1000 / t.rigTravel))
                        let span = t.rigBead.radius * 2 * unit
                        Circle().fill(Color(.sRGB, red: t.lampColors["live"]!.0.0, green: t.lampColors["live"]!.0.1, blue: t.lampColors["live"]!.0.2).opacity(t.rigBead.alpha))
                            .frame(width: span, height: span).position(x: p.x * unit, y: p.y * unit)
                    }
                }
            }
            .frame(width: width, height: height, alignment: .topLeading)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(engine.spec.title)
        .onChange(of: values) { before, after in carry(before: before, after: after) }
    }

    /// The panel's outline on the 400-unit canvas: the rig scaled to fit, with a tray hole per gadget.
    private func panelPath(scale s: Double) -> CGPath {
        let t = MetalGadgetTokens.self, path = CGMutablePath()
        path.addRoundedRect(in: CGRect(x: 0, y: 0, width: engine.width * s, height: engine.height * s), cornerWidth: t.rigRadius * s, cornerHeight: t.rigRadius * s)
        for m in engine.modules {
            let rect = CGRect(x: (m.at.x + t.bodyRect.x - t.rigTray / 2) * s, y: (m.at.y + t.bodyRect.y - t.rigTray / 2) * s,
                              width: (t.bodyRect.width + t.rigTray) * s, height: (t.bodyRect.height + t.rigTray) * s)
            path.addRoundedRect(in: rect, cornerWidth: t.bodyRadius * s, cornerHeight: t.bodyRadius * s)
        }
        for j in engine.jacks { let d = t.rigJack * t.jackHole * s; path.addEllipse(in: CGRect(x: j.at.x * s - d / 2, y: j.at.y * s - d / 2, width: d, height: d)) }
        return path
    }

    /// A point a share of the way along a cord, by its length (sampled), as the web's getPointAtLength.
    static func point(on c: MetalRigEngine.Cord, share: Double) -> CGPoint {
        let sag = MetalCableGeometry.sag(from: c.a, to: c.b, length: c.length), (c1, c2) = MetalCableGeometry.controls(from: c.a, to: c.b, sag: sag)
        let at = { (u: Double) -> CGPoint in
            let v = 1 - u
            return CGPoint(x: v * v * v * c.a.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * c.b.x,
                           y: v * v * v * c.a.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * c.b.y)
        }
        let n = 48, pts = (0...n).map { at(Double($0) / Double(n)) }
        let lens = zip(pts, pts.dropFirst()).map { hypot($1.x - $0.x, $1.y - $0.y) }, total = lens.reduce(0, +)
        var goal = share * total
        for (i, l) in lens.enumerated() {
            if goal <= l { let k = l == 0 ? 0 : goal / l; return CGPoint(x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k) }
            goal -= l
        }
        return c.b
    }

    /// A change from outside: carry it along the cables; each hop's bead runs, then its value arrives.
    private func carry(before: [String: [String: Double]], after: [String: [String: Double]]) {
        for (inst, ports) in after { for (port, v) in ports where before[inst]?[port] != v {
            shown[inst, default: [:]][port] = .number(v)
            for hop in engine.set(inst, port, .number(v)) {
                let to = hop.to.split(separator: ".").map(String.init)
                let deliver = { if !hop.value.isPulse { shown[to[0], default: [:]][to[1]] = hop.value } }
                if reduceMotion { deliver(); continue }
                let id = UUID(), travel = MetalGadgetTokens.rigTravel / 1000
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(hop.hop - 1) * travel) {
                    beads.append((id, hop.cable, Date()))
                    DispatchQueue.main.asyncAfter(deadline: .now() + travel) { beads.removeAll { $0.id == id }; deliver() }
                }
            }
        } }
    }
}
