import SwiftUI
import UIKit
import Darwin
@testable import MetalUI

@main
struct MorphProofApp: App { var body: some Scene { WindowGroup { MorphProof() } } }

struct MorphProof: View {
    @State private var name: MetalIconName = .copy
    @State private var turn = MetalMorphTurn.down
    @State private var reduced = false
    @State private var stage = "Rest"
    @State private var value = 2
    @State private var comparison: MetalMorphFrame?
    @State private var smallComparison: MetalMorphFrame?
    @State private var comparisonName: MetalIconName = .copy
    @State private var colorway = MetalColorway.bone
    let samples: [(MetalIconName, MetalIconName)] = [(.copy, .check), (.lock, .warning), (.send, .stop), (.eye, .eyeOff)]
    var body: some View {
        VStack(spacing: 24) {
            Text("Native shared glyph morph").font(.metal(MetalType.ui))
            Text(stage).font(.metal(MetalType.meta))
            HStack(spacing: 48) {
                ForEach([16, 24], id: \.self) { size in
                    VStack(spacing: 20) {
                        MetalMorphIcon(name, size: CGFloat(size), interaction: MetalIconInteraction())
                            .metalReduceMotion(reduced)
                        MetalMorphIcon(.chevron, size: CGFloat(size), turn: turn, interaction: MetalIconInteraction())
                            .metalReduceMotion(reduced)
                        Text("\(size) pt").font(.metal(MetalType.meta))
                    }
                }
                // This instance never changes: another instance's flight must not affect it.
                MetalMorphIcon(.lock, size: 24, interaction: MetalIconInteraction())
            }
            Divider()
            Text("Prepared final frame / authored resting glyph").font(.metal(MetalType.meta))
            if let comparison {
                HStack(spacing: 48) {
                    ForEach([16, 24], id: \.self) { size in
                        HStack(spacing: 12) {
                            MetalMorphCanvas(frame: size == 16 ? (smallComparison ?? comparison) : comparison, box: CGFloat(size), duoK: colorway.tokens.duoK)
                            MetalIcon(comparisonName, size: CGFloat(size), interaction: MetalIconInteraction())
                        }
                    }
                }
            }
            MetalNumberField("Copies", value: $value, in: 1...3)
                .frame(width: 240)
            Text("Tap step keys: bounds disable at 1 and 3.").font(.metal(MetalType.meta))
        }
        .padding(24).foregroundStyle(colorway.tokens.ink.color)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(colorway.tokens.s.color)
        .metalColorway(colorway)
        .task {
            setbuf(stdout, nil)
            for pair in samples {
                let source = MetalMorphTarget(name: pair.0.rawValue, turn: 0, line: 1.7)
                let destination = MetalMorphTarget(name: pair.1.rawValue, turn: 0, line: 1.7)
                guard let frames = try? await MetalMorphPlanner.shared.plan(from: source, to: destination, seed: nil) else {
                    print("MU_MORPH_FAILURE \(pair)"); continue
                }
                let planning = await MetalMorphPlanner.shared.lastPlanningSeconds
                let paths = await MetalMorphPlanner.shared.lastPathSeconds
                let renderStart = cpuTime()
                for frame in frames.frames {
                    let renderer = ImageRenderer(content: MetalMorphCanvas(frame: frame, box: 24, duoK: 1))
                    renderer.scale = 3
                    _ = renderer.cgImage
                }
                let perFrame = (cpuTime() - renderStart) / Double(frames.frames.count)
                print("MU_MORPH_CPU \(pair.0.rawValue)->\(pair.1.rawValue) plan=\(planning) paths=\(paths) render=\(perFrame) frames=\(frames.frames.count)")
            }
            for color in [MetalColorway.bone, .graphite] {
                colorway = color
                for pair in samples {
                    name = pair.0
                    try? await Task.sleep(for: .seconds(1.5))
                    name = pair.1
                    stage = "\(pair.0.rawValue) → \(pair.1.rawValue)"
                    let final = try? await MetalMorphPlanner.shared.plan(
                        from: MetalMorphTarget(name: pair.0.rawValue, turn: 0, line: 1.7),
                        to: MetalMorphTarget(name: pair.1.rawValue, turn: 0, line: 1.7), seed: nil)
                    let small = try? await MetalMorphPlanner.shared.plan(
                        from: MetalMorphTarget(name: pair.0.rawValue, turn: 0, line: pair.0.smallStrokeUnits),
                        to: MetalMorphTarget(name: pair.1.rawValue, turn: 0, line: pair.1.smallStrokeUnits), seed: nil)
                    comparison = final?.frames.last
                    smallComparison = small?.frames.last
                    comparisonName = pair.1
                    print("MU_MORPH_COMPARE \(color.rawValue)-\(pair.1.rawValue)")
                    try? await Task.sleep(for: .seconds(1.5))
                }
            }
            colorway = .bone
            name = .copy
            try? await Task.sleep(for: .seconds(1.5))
            name = .check
            try? await Task.sleep(for: .seconds(0.1))
            name = .eye
            stage = "Interrupted: current ink → eye"
            print("MU_MORPH_INTERRUPTED")
            try? await Task.sleep(for: .seconds(1.5))
            name = .eyeOff
            try? await Task.sleep(for: .seconds(0.1))
            reduced = true
            stage = "Reduced during flight: eye-off immediately"
            print("MU_MORPH_REDUCED")
            try? await Task.sleep(for: .seconds(1.5))
            reduced = false
            turn = .up
            stage = "Chevron flips / lock remains independent"
            print("MU_MORPH_TURN")
            try? await Task.sleep(for: .seconds(1.5))
            name = MetalIconName.allCases.first { !MetalMorphCatalog.names.contains($0) } ?? .copy
            stage = "Solid glyph uses its authored rendering"
            print("MU_MORPH_FALLBACK")
            try? await Task.sleep(for: .seconds(3))
            print("MU_MORPH_DONE")
        }
    }
}

private func cpuTime() -> Double {
    var time = timespec()
    clock_gettime(CLOCK_THREAD_CPUTIME_ID, &time)
    return Double(time.tv_sec) + Double(time.tv_nsec) / 1_000_000_000
}
