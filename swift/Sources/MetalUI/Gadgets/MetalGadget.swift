import SwiftUI

/// Draws any gadget spec and runs it, the SwiftUI twin of `<Gadget spec />`. It resolves the colours
/// from the job and feel, places the Parts on the 400-unit canvas in stacking order (the body with its
/// cuts, the trims on it, the cord, the plugs, the lamp) and binds the mechanism's player to them: a
/// state change springs parts to its poses, relights the lamp and plays the beeper; an act plays the
/// mechanism with its sound. It is never a control; wrap it in a button to operate it.
public struct MetalGadget: View {
    let spec: MetalGadgetSpec
    let wanted: String?
    let act: Int
    let value: Double?
    let sound: MetalSound?
    let size: Double
    @State private var player: MetalMechanismPlayer?
    @State private var drive: MetalDrive?
    @State private var shown: String?
    @State private var lampGesture: MetalLampGesture?
    @State private var beeps = 0
    @State private var earcon: MetalEarcon?
    @State private var landing = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// `value` drives a held gadget (its drive port, 0 to 1 for a number): its parts move to follow it.
    public init(spec: MetalGadgetSpec, state: String? = nil, act: Int = 0, value: Double? = nil, sound: MetalSound? = nil, size: Double = 160) {
        self.spec = spec; self.wanted = state; self.act = act; self.value = value; self.sound = sound; self.size = size
    }

    private var state: String { spec.state(wanted) }
    private var unit: Double { size / MetalGadgetTokens.canvas }
    private func footprint(_ p: MetalGadgetSpec.Part) -> (Double, Double) {
        if let s = p.size, s.count == 2 { return (s[0], s[1]) }
        return MetalGadgetTokens.partSizes[p.part] ?? (MetalGadgetTokens.canvas, MetalGadgetTokens.canvas)
    }
    private func point(_ p: MetalGadgetSpec.Part) -> CGPoint { CGPoint(x: p.at[0], y: p.at[1]) }
    private func part(_ id: String?) -> MetalGadgetSpec.Part? { spec.parts.first { $0.id == id } }

    private var resolved: MetalGadgetResolved {
        MetalGadgetModel.resolve(MetalGadgetPlacement(job: MetalGadgetJob(rawValue: spec.job) ?? .link, feel: spec.feel, station: spec.station,
                                                      material: spec.material.flatMap(MetalSoundMaterial.init(rawValue:)), container: spec.container,
                                                      reach: spec.reach.flatMap(MetalSoundReach.init(rawValue:))))
    }
    /// The body's colour in a state: its feel override re-resolves the colour, never the material.
    private func body(_ r: MetalGadgetResolved) -> MetalOklch {
        let f = spec.states[state]?.feel
        let feel = MetalGadgetFeel(v: f?.v ?? spec.feel.v, a: f?.a ?? spec.feel.a, w: f?.w ?? spec.feel.w)
        return MetalGadgetModel.bodyColor(job: r.job, feel: feel, material: r.material, station: r.station)
    }
    private func formPose(_ id: String?, in state: String) -> MetalMechanismPose? {
        guard let id, let p = spec.states[state]?.form?[id]?.pose else { return nil }
        return MetalMechanismPose(x: p.x ?? 0, y: p.y ?? 0, r: p.r ?? 0, sx: p.sx ?? 1, sy: p.sy ?? 1)
    }
    private var lamp: (MetalLEDKind, MetalLampGesture) {
        let l = spec.states[state]?.lamp ?? ["off", "steady"]
        let kind: MetalLEDKind = switch l.first { case "live": .live; case "waiting": .waiting; case "failed": .failed; case "link": .link; default: .off }
        return (kind, lampGesture ?? (l.count > 1 ? MetalLampGesture(rawValue: l[1]) ?? .steady : .steady))
    }

    public var body: some View {
        let r = resolved, bind = spec.mechanism.first
        TimelineView(.animation(paused: !(player?.playing ?? false) && !(drive?.moving ?? false))) { timeline in
            ZStack(alignment: .topLeading) {
                ForEach(spec.parts.filter { $0.role == "body" && $0.part == "slab" }, id: \.id) { _ in
                    MetalSlab(r.material, color: body(r), cuts: cuts, size: size)
                }
                ForEach(spec.parts.filter { $0.part == "jack" }, id: \.id) { p in
                    let s = footprint(p).0 * unit * MetalGadgetTokens.canvas / MetalGadgetTokens.jackNut
                    MetalJack(size: s).position(x: p.at[0] * unit, y: p.at[1] * unit)
                }
                ForEach(spec.parts.filter { $0.part == "beeper" }, id: \.id) { p in
                    let s = footprint(p).0 * unit * MetalGadgetTokens.canvas / MetalGadgetTokens.beeperAlone
                    MetalBeeper(slots: Int(p.params?["slots"]?.number ?? Double(MetalGadgetTokens.beeperSlots)),
                                material: p.material == "clay" ? .clay : .metal, earcon: earcon, trigger: beeps, size: s)
                        .position(x: p.at[0] * unit, y: p.at[1] * unit)
                }
                ForEach(spec.parts.filter { $0.part == "key" }, id: \.id) { p in
                    key(p, r: r, at: timeline.date)
                }
                ForEach(spec.parts.filter { $0.part == "cable" }, id: \.id) { p in
                    if let a = part(p.params?["from"]?.text), let b = part(p.params?["to"]?.text) {
                        MetalCable(from: end(a, bind: bind, at: timeline.date), to: end(b, bind: bind, at: timeline.date),
                                   sag: p.params?["sag"]?.number, length: p.params?["length"]?.number, size: size, followEnds: true)
                    }
                }
                ForEach(spec.parts.filter { $0.part == "cap" }, id: \.id) { p in
                    cap(p, r: r, at: timeline.date)
                }
                ForEach(spec.parts.filter { $0.part == "plug" }, id: \.id) { p in
                    plug(p, r: r, bound: bind["plug"] == p.id, at: timeline.date)
                }
                ForEach(spec.parts.filter { $0.part == "led" }, id: \.id) { p in
                    MetalLED(lamp.0, diameter: footprint(p).0 * unit, gesture: lamp.1)
                        .id("\(state)-\(lamp.1.rawValue)")
                        .position(x: p.at[0] * unit, y: p.at[1] * unit)
                }
            }
            .frame(width: size, height: size, alignment: .topLeading)
            .onChange(of: timeline.date) { _, now in drive?.tick(now) }
        }
        .accessibilityElement()
        .accessibilityLabel(spec.title)
        .accessibilityValue(spec.description(state))
        .onAppear {
            let m = MetalMechanism.all.first { $0.name == spec.mechanism.name }
            if let m, m.held != nil, drive == nil {
                let d = MetalDrive(m, start: spec.driveTargets(value ?? spec.driveDefault), sound: sound,
                                   material: driveMaterial, partSize: MetalGadgetTokens.partSizes["cap"]?.0 ?? 60)
                d?.reduced = reduceMotion
                drive = d
            }
            if let m, m.momentary, player == nil {
                let p = MetalMechanismPlayer(m)
                p.reduced = reduceMotion
                if let held = formPose(bind["plug"], in: state) { p.holdPose("plug", held, immediate: true) }
                player = p
            }
            shown = state
        }
        .onChange(of: state) { _, next in enter(next, bind: bind) }
        .onChange(of: act) { play(bind: bind) }
        .onChange(of: value) { _, next in
            guard let next, let drive else { return }
            drive.reduced = reduceMotion
            drive.set(spec.driveTargets(next))
        }
    }

    /// Each cut the body needs: a socket under every jack, a hole for every lamp.
    private var cuts: [MetalSlabCut] {
        spec.parts.compactMap { p in
            let w = footprint(p).0
            if p.part == "jack" { return MetalSlabCut(.hole, at: (p.at[0], p.at[1]), size: (w * MetalGadgetTokens.jackHole, w * MetalGadgetTokens.jackHole)) }
            if p.part == "led" { return MetalSlabCut(.hole, at: (p.at[0], p.at[1]), size: (w + MetalGadgetTokens.holeLip * 2, w + MetalGadgetTokens.holeLip * 2)) }
            // A slab placed with the cut role is a cut into the body: a tray, a well, a slot, a hole.
            if p.part == "slab", p.role == "cut" {
                let kind = MetalSlabCut.Kind(rawValue: p.params?["cut"]?.text ?? "tray") ?? .tray
                return MetalSlabCut(kind, at: (p.at[0], p.at[1]), size: footprint(p), depth: p.params?["depth"]?.number)
            }
            return nil
        } + slots
    }

    /// A driven actor runs in a slot cut as long as its travel.
    private var slots: [MetalSlabCut] {
        guard let held = MetalMechanism.all.first(where: { $0.name == spec.mechanism.name })?.held else { return [] }
        let slot = MetalGadgetTokens.capSlot
        return (spec.mechanism.bind[held.slot] ?? []).compactMap { id in
            part(id).map { p in
                MetalSlabCut(.slot, at: (p.at[0], p.at[1] + (held.from.y + held.to.y) / 2), size: (slot.width, abs(held.to.y - held.from.y) + slot.pad))
            }
        }
    }

    private var driveMaterial: MetalSoundMaterial {
        spec.parts.first { $0.part == "cap" }?.material == "ceramic" ? .ceramic : .clay
    }

    /// A key, its face moved by the press mechanism when its slot binds it.
    @ViewBuilder private func key(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved, at date: Date) -> some View {
        let s = footprint(p).0 * unit * MetalGadgetTokens.canvas / MetalGadgetTokens.keyAlone
        let accent = p.material == "accent", ceramic = p.material == "ceramic"
        let slot = spec.mechanism.bind.first { $0.value.contains(p.id) }
        let pose = slot.flatMap { b in b.value.firstIndex(of: p.id).map { player?.pose(b.key, actor: $0, at: date).pose } } ?? nil
        MetalKey(glyph: p.params?["glyph"]?.text, accent: accent, material: ceramic ? .ceramic : .clay, color: accent ? r.accent : nil,
                 size: s, facePose: pose ?? .rest)
            .frame(width: s, height: s)
            .position(x: p.at[0] * unit, y: p.at[1] * unit)
            .accessibilityHidden(true)
    }

    /// A cap, at its place along its slot when a drive holds it.
    @ViewBuilder private func cap(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved, at date: Date) -> some View {
        let wide = footprint(p)
        // MetalCap draws its face `capAlone` units wide on its own canvas; this frame makes it the Part's width here.
        let s = wide.0 * unit * MetalGadgetTokens.canvas / MetalGadgetTokens.capAlone
        let accent = p.material == "accent", ceramic = p.material == "ceramic"
        let held = MetalMechanism.all.first(where: { $0.name == spec.mechanism.name })?.held
        let index = held.flatMap { spec.mechanism.bind[$0.slot]?.firstIndex(of: p.id) }
        // Before the drive exists (the first frame, a capture) a cap sits at its start place, as the web draws it.
        let start = spec.driveTargets(value ?? spec.driveDefault)
        let y = index.flatMap { i in drive?.pose(i).y ?? held.map { $0.from.y + ($0.to.y - $0.from.y) * start[i] } } ?? 0
        MetalCap(shape: p.params?["shape"]?.text == "knob" ? .knob : .fader, ribs: Int(p.params?["ribs"]?.number ?? Double(MetalGadgetTokens.capRibs)),
                 accent: accent, material: ceramic ? .ceramic : .clay, color: accent ? r.accent : nil, size: s)
            .frame(width: s, height: s)
            .position(x: p.at[0] * unit, y: (p.at[1] + y) * unit)
            .accessibilityHidden(true)
    }

    /// Where a cord's end is: at its plug, which carries it wherever the mechanism moves the plug.
    private func end(_ p: MetalGadgetSpec.Part, bind: [String: String], at date: Date) -> CGPoint {
        guard bind["plug"] == p.id, let q = player?.pose("plug", at: date).pose else { return point(p) }
        return CGPoint(x: p.at[0] + q.x, y: p.at[1] + q.y)
    }

    @ViewBuilder private func plug(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved, bound: Bool, at date: Date) -> some View {
        let s = footprint(p).0 * unit * MetalGadgetTokens.canvas / MetalGadgetTokens.plugAlone
        let lift = (MetalGadgetTokens.plugCentreY - MetalGadgetTokens.canvas / 2) * s / MetalGadgetTokens.canvas
        let accent = p.material == "accent"
        let color: MetalOklch? = accent ? r.accent : nil
        let body = bound ? player?.pose("plug", at: date).pose ?? .rest : .rest
        let shade = bound ? player?.pose("plug.shadow", at: date).pose ?? .rest : .rest
        let stub = MetalPlug.Stub(rawValue: p.params?["stub"]?.text ?? "none") ?? .none
        ZStack {
            MetalPlug(accent: accent, color: color, stub: stub, size: s, layer: .shadow)
                .scaleEffect(x: shade.sx, y: shade.sy)
                .offset(x: shade.x * unit, y: shade.y * unit)
            MetalPlug(accent: accent, color: color, stub: stub, size: s, layer: .body)
                .rotationEffect(.degrees(body.r), anchor: UnitPoint(x: 0.5, y: MetalGadgetTokens.plugCentreY / MetalGadgetTokens.canvas))
                .scaleEffect(x: body.sx, y: body.sy)
                .offset(x: body.x * unit, y: body.y * unit)
        }
        .frame(width: s, height: s)
        .position(x: p.at[0] * unit, y: p.at[1] * unit - lift)
    }

    // MARK: - States and acts

    private func strikeSlot(_ bind: [String: String]) -> (String) -> (material: MetalSoundMaterial, size: Double)? {
        { slot in
            guard let p = part(bind[slot]) else { return nil }
            let m = p.material == "accent" || p.material == nil ? MetalSoundMaterial.clay : MetalSoundMaterial(rawValue: p.material!) ?? .clay
            return (m, footprint(p).0)
        }
    }
    /// The most actors any slot binds: a chord's keys.
    private var manyActors: Int { spec.mechanism.bind.values.map(\.count).max() ?? 1 }

    /// The i-th part a slot binds, as it sounds when struck: its own material (an accent part sounds
    /// as its Part's first material) at its own size.
    private func strikeActor(_ slot: String, _ i: Int) -> (material: MetalSoundMaterial, size: Double)? {
        guard let ids = spec.mechanism.bind[slot], i < ids.count, let p = part(ids[i]) else { return nil }
        let m = p.material.flatMap(MetalSoundMaterial.init(rawValue:)) ?? .clay
        return (m, footprint(p).0)
    }

    private func beep(_ e: MetalEarcon?) {
        guard let e else { return }
        _ = sound?.beep(e, rendered: size)
        earcon = e
        beeps += 1
    }
    private var reach: MetalSoundReach { spec.reach.flatMap(MetalSoundReach.init(rawValue:)) ?? .world }

    private func enter(_ next: String, bind: [String: String]) {
        guard let player, next != shown else { return }
        shown = next
        lampGesture = nil
        player.reduced = reduceMotion
        let away = player.pose("plug").pose, far = hypot(away.x, away.y) > 2
        player.holdPose("plug", formPose(bind["plug"], in: next))
        let st = spec.states[next], news = st?.beep.flatMap(MetalEarcon.init(rawValue:))
        landing += 1
        if st?.enter == "act" {
            if far && !reduceMotion {                                         // it flies home, then lands
                let flight = landing, spring = player.mechanism.spring.spring
                DispatchQueue.main.asyncAfter(deadline: .now() + Self.firstHome(spring)) {
                    guard flight == landing, shown == next else { return }
                    player.land(sound: sound, weight: spec.feel.w, reach: reach, strike: strikeSlot(bind), lamp: { lampGesture = $0 }, beep: { beep(news) })
                }
                return
            }
            if far { player.land(sound: sound, weight: spec.feel.w, reach: reach, strike: strikeSlot(bind), lamp: { lampGesture = $0 }, beep: { beep(news) }) }
            else { player.act(sound: sound, weight: spec.feel.w, reach: reach, strike: strikeSlot(bind), lamp: { lampGesture = $0 }, beep: { beep(news) }, actors: manyActors, strikeActor: strikeActor) }
        } else if let news { beep(news) }
    }

    /// When a spring released from rest first reaches home, in seconds: for an underdamped spring
    /// (mass 1) that moment is the same from any distance. The plug lands then, as it does on the web.
    static func firstHome(_ spring: MetalSpring) -> Double {
        let w = spring.stiffness.squareRoot(), zeta = spring.damping / (2 * w)
        guard zeta < 1 else { return spring.duration }
        let wd = w * (1 - zeta * zeta).squareRoot()
        return (Double.pi - atan(wd / (zeta * w))) / wd
    }

    private func play(bind: [String: String]) {
        guard let player else { return }
        player.reduced = reduceMotion
        player.act(sound: sound, weight: spec.feel.w, reach: reach, strike: strikeSlot(bind), lamp: { lampGesture = $0 },
                   actors: manyActors, strikeActor: strikeActor)
    }
}
