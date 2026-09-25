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
    @State private var roll: MetalRoll?
    @State private var shown: String?
    @State private var lampGesture: MetalLampGesture?
    @State private var beeps = 0
    @State private var earcon: MetalEarcon?
    @State private var landing = 0
    /// Where a sweep's beam stopped when its search ended: it stays there.
    @State private var frozen: [String: Double] = [:]
    /// Bumped when a looping act should play again.
    @State private var loops = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// `value` drives a held gadget (its drive port, 0 to 1 for a number): its parts move to follow it.
    public init(spec: MetalGadgetSpec, state: String? = nil, act: Int = 0, value: Double? = nil, sound: MetalSound? = nil, size: Double = 160) {
        self.spec = spec; self.wanted = state; self.act = act; self.value = value; self.sound = sound; self.size = size
    }

    /// The value may decide the state (a needle past its threshold is over).
    private var state: String { spec.derivedState(spec.state(wanted), value: value ?? spec.driveDefault) }
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
        TimelineView(.animation(paused: !(player?.playing ?? false) && !(drive?.moving ?? false) && !(roll?.moving ?? false))) { timeline in
            ZStack(alignment: .topLeading) {
                ForEach(spec.parts.filter { $0.role == "body" && $0.part == "slab" }, id: \.id) { _ in
                    MetalSlab(r.material, color: body(r), cuts: cuts, size: size)
                    // Light behind cells: in the floor of the cut it sits in, as bright as the cells are full.
                    ForEach(spec.parts.filter { $0.part == "backlight" }, id: \.id) { q in trayLight(q, r: r) }
                    ForEach(spec.parts.filter { $0.part == "cell" }, id: \.id) { q in cells(q, r: r) }
                }
                // An inset gadget: its glass in a bezel, with the light in the glass.
                ForEach(spec.parts.filter { $0.role == "body" && $0.part == "bezel" }, id: \.id) { p in
                    MetalBezel(r.material, color: body(r), glass: r.face, opening: p.params?["opening"]?.text == "square" ? .square : .round,
                               rings: spec.parts.first { $0.part == "glass-face" }?.params?["rings"].map { if case .flag(let on) = $0 { on } else { false } } ?? false, size: size) {
                        ZStack(alignment: .topLeading) {
                            ForEach(spec.parts.filter { $0.part == "backlight" }, id: \.id) { q in light(q, r: r, at: timeline.date) }
                            ForEach(spec.parts.filter { $0.part == "needle" }, id: \.id) { q in needle(q, r: r) }
                        }
                    }
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
                ForEach(spec.parts.filter { $0.part == "drum" }, id: \.id) { p in
                    drum(p, r: r)
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
            .onChange(of: timeline.date) { _, now in drive?.tick(now); roll?.tick(now) }
        }
        .accessibilityElement()
        .accessibilityLabel(spec.title)
        .accessibilityValue(spec.description(state, value: value))
        .onAppear {
            let m = MetalMechanism.all.first { $0.name == spec.mechanism.name }
            if let m, m.held?.roll == true, roll == nil {
                let d = MetalRoll(m, actors: (spec.mechanism.bind["drums"] ?? []).count, count: Int(value ?? spec.driveDefault), sound: sound,
                                  material: spec.parts.first { $0.part == "drum" }?.params?["face"]?.text == "clay" ? .clay : .ceramic)
                d?.reduced = reduceMotion
                roll = d
            }
            if let m, let held = m.held, !held.roll, drive == nil {
                // Light is silent: a glow has no knock and no scrape.
                let d = MetalDrive(m, start: spec.driveTargets(value ?? spec.driveDefault, state: state), sound: lit ? nil : sound,
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
            // A looping act is an ongoing activity: shown in the state that starts it, it runs from the start.
            if player?.mechanism.loops == true, spec.states[state]?.enter == "act", !reduceMotion { actAndLoop(bind: bind) }
        }
        .onChange(of: state) { _, next in enter(next, bind: bind) }
        .onChange(of: act) { play(bind: bind) }
        .onChange(of: value) { _, next in
            if let next, let roll { roll.reduced = reduceMotion; roll.set(Int(next.rounded())) }
            guard let next, let drive else { return }
            drive.reduced = reduceMotion
            drive.set(spec.driveTargets(next, state: state))
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
                return MetalSlabCut(kind, at: (p.at[0], p.at[1]), size: footprint(p), depth: p.params?["depth"]?.number, radius: p.params?["radius"]?.number)
            }
            return nil
        } + slots
    }

    /// A driven actor runs in a slot cut as long as its travel.
    private var slots: [MetalSlabCut] {
        guard let held = MetalMechanism.all.first(where: { $0.name == spec.mechanism.name })?.held else { return [] }
        let slot = MetalGadgetTokens.capSlot
        return (spec.mechanism.bind[held.slot] ?? []).compactMap { id in
            part(id).flatMap { $0.part == "cap" ? $0 : nil }.map { p in
                MetalSlabCut(.slot, at: (p.at[0], p.at[1] + (held.from.y + held.to.y) / 2), size: (slot.width, abs(held.to.y - held.from.y) + slot.pad))
            }
        }
    }

    /// Whether the gadget's drive lights cells rather than moving parts.
    private var lit: Bool { spec.parts.contains { $0.part == "cell" } }

    /// The share the cells are lit to: where the glow has carried them, or the value's before it runs.
    private var litShare: Double { drive?.model.x.first ?? spec.driveTargets(value ?? spec.driveDefault, state: state).first ?? 0 }

    /// Light in the floor of a slab's cut, behind the cells: as bright as they are full.
    @ViewBuilder private func trayLight(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved) -> some View {
        let cut = cuts.first { $0.at == CGPoint(x: p.at[0], y: p.at[1]) }, lv = MetalGadgetTokens.cellBacklight
        MetalBacklight(.glow, color: .glass(r.face), at: CGPoint(x: p.at[0], y: p.at[1]), diameter: footprint(p).0, size: size)
            .opacity(lv.empty + (lv.full - lv.empty) * min(1, max(0, litShare)))
            .mask { if let cut { Path(cut.path).applying(CGAffineTransform(scaleX: unit, y: unit)).fill(.black) } else { Rectangle() } }
    }

    /// Resin cells dyed in the gadget's glass colour, lit to the share.
    @ViewBuilder private func cells(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved) -> some View {
        let cols = Int(p.params?["cols"]?.number ?? 4), rows = Int(p.params?["rows"]?.number ?? 4)
        MetalCell(cols: cols, rows: rows, gap: p.params?["gap"]?.number ?? MetalGadgetTokens.cellAlone.gap, lit: litShare * Double(cols * rows),
                  color: MetalOklch(L: r.face.L, C: max(r.face.C, MetalGadgetTokens.cellDye), H: r.face.H), side: footprint(p).0,
                  center: CGPoint(x: p.at[0], y: p.at[1]), size: size)
    }

    private var driveMaterial: MetalSoundMaterial {
        spec.parts.first { $0.part == "cap" }?.material == "ceramic" ? .ceramic : .clay
    }

    /// Light in the glass: a beam turned by its mechanism (or where it stopped), blips lit by it (or
    /// as the state says, else dark).
    @ViewBuilder private func light(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved, at date: Date) -> some View {
        let shape = MetalBacklight.Shape(rawValue: p.params?["shape"]?.text ?? "glow") ?? .glow
        let tint: MetalBacklight.Tint = switch p.params?["color"]?.text { case "accent": .accent; case "signal": .signal(spec.states[state]?.lamp?.first ?? "live"); default: .glass(r.face) }
        let slot = spec.mechanism.bind.first { $0.value.contains(p.id) }
        let index = slot?.value.firstIndex(of: p.id) ?? 0
        let playing = player?.playing ?? false
        let posed = slot.flatMap { player?.pose($0.key, actor: index, at: date) }
        let form = spec.states[state]?.form?[p.id]?.alpha
        let alpha = playing ? posed?.opacity ?? (shape == .dot ? 0 : 1) : form ?? (shape == .dot ? 0 : 1)
        let heading = playing ? posed?.pose.r ?? 0 : frozen[p.id] ?? 0
        MetalBacklight(shape, color: tint, heading: heading, at: CGPoint(x: p.at[0], y: p.at[1]), diameter: footprint(p).0, size: size)
            .opacity(alpha)
    }

    /// Each phased actor's own start, ms: its angle around the part it is phased about, clockwise from
    /// up, as a share of the act (a blip lights when the beam reaches it). The web computes the same.
    private var phaseOffsets: [String: [Double]] {
        guard let m = player?.mechanism, !m.phased.isEmpty, let beam = spec.mechanism.bind["beam"]?.first.flatMap(part) else { return [:] }
        var out: [String: [Double]] = [:]
        for slot in m.phased {
            out[slot] = (spec.mechanism.bind[slot] ?? []).compactMap(part).map { q in
                let deg = atan2(q.at[0] - beam.at[0], beam.at[1] - q.at[1]) * 180 / .pi
                return (deg.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) / 360 * m.duration
            }
        }
        return out
    }

    /// A drum, showing its digit of the count (turned by the roll once it runs).
    @ViewBuilder private func drum(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved) -> some View {
        let ids = spec.mechanism.bind["drums"] ?? [], i = ids.firstIndex(of: p.id) ?? 0
        let digit = roll.map { $0.value(i) } ?? Double(MetalRollModel.digit(Int(value ?? spec.driveDefault), actor: i, actors: ids.count))
        let accent = p.material == "accent"
        MetalDrum(value: digit, accent: accent, face: p.params?["face"]?.text == "clay" ? .clay : .ceramic, color: accent ? r.accent : nil,
                  width: footprint(p).0, size: size)
            .position(x: p.at[0] * unit, y: p.at[1] * unit)
            .accessibilityHidden(true)
    }

    /// A needle in the glass, pointing where the swing has carried it (or at the value before it runs).
    @ViewBuilder private func needle(_ p: MetalGadgetSpec.Part, r: MetalGadgetResolved) -> some View {
        let i = spec.parts.filter { $0.part == "needle" }.firstIndex { $0.id == p.id } ?? 0
        let u = drive.map { $0.model.x[min(i, $0.model.x.count - 1)] } ?? spec.driveShare(value ?? spec.driveDefault)
        MetalNeedle(value: u, arc: p.params?["arc"]?.number ?? 120, ticks: Int(p.params?["ticks"]?.number ?? 9), threshold: p.params?["threshold"]?.number,
                    length: footprint(p).0, at: CGPoint(x: p.at[0], y: p.at[1]), color: r.accent, glass: r.face, size: size)
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
        // Light has no material of its own: a tick on it is the glass it shines through.
        let m = p.part == "backlight" ? .glass : p.material.flatMap(MetalSoundMaterial.init(rawValue:)) ?? .clay
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
        // A state may move a held drive (a first run fills the grid).
        if let drive { drive.reduced = reduceMotion; drive.set(spec.driveTargets(value ?? spec.driveDefault, state: next)) }
        guard let player, next != shown else {
            // A held gadget has no act: the state's news plays straight on the beeper.
            if player == nil, next != shown {
                shown = next; lampGesture = nil
                if let news = spec.states[next]?.beep.flatMap(MetalEarcon.init(rawValue:)) { beep(news) }
            }
            return
        }
        shown = next
        lampGesture = nil
        player.reduced = reduceMotion
        let away = player.pose("plug").pose, far = hypot(away.x, away.y) > 2
        // A sweep stopped mid-turn leaves its beam where it is.
        if player.playing { for (slot, ids) in spec.mechanism.bind where slot == "beam" { for id in ids { frozen[id] = player.pose(slot).pose.r } } }
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
            else { actAndLoop(bind: bind, news: news) }
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

    /// Plays the act; a looping mechanism plays again when it ends, while the state that started it holds.
    private func actAndLoop(bind: [String: String], news: MetalEarcon? = nil) {
        guard let player else { return }
        player.act(sound: sound, weight: spec.feel.w, reach: reach, strike: strikeSlot(bind), lamp: { lampGesture = $0 }, beep: { beep(news) },
                   actors: manyActors, strikeActor: strikeActor, offsets: phaseOffsets)
        guard player.mechanism.loops, !reduceMotion, let started = shown else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + player.total / 1000) {
            guard shown == started, spec.states[started]?.enter == "act" else { return }
            actAndLoop(bind: bind, news: news)
        }
    }

    private func play(bind: [String: String]) {
        guard let player else { return }
        player.reduced = reduceMotion
        player.act(sound: sound, weight: spec.feel.w, reach: reach, strike: strikeSlot(bind), lamp: { lampGesture = $0 },
                   actors: manyActors, strikeActor: strikeActor)
    }
}
