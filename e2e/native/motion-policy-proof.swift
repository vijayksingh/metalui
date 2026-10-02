import SwiftUI
import UIKit
import Darwin
import MetalUI

@main
struct MotionPolicyProofApp: App { var body: some Scene { WindowGroup { MotionPolicyProof() } } }

struct PolicyProbe: View {
    let label: String
    @MetalMotionPreference private var reduced
    var body: some View { Text("\(label): \(reduced ? "reduced" : "full")").font(.metal(MetalType.meta)) }
}

struct MotionPolicyProof: View {
    @State private var scoped = false
    @State private var hold: Double?
    @State private var stage = "Normal policy"
    var body: some View {
        VStack(spacing: 32) {
            Text("Native scoped motion policy").font(.metal(MetalType.ui))
            HStack(spacing: 32) {
                VStack(spacing: 16) {
                    MetalIcon(.trash, size: 72, interaction: MetalIconInteraction(holdDuration: hold))
                    PolicyProbe(label: "Outside")
                }
                VStack(spacing: 16) {
                    MetalIcon(.trash, size: 72, interaction: MetalIconInteraction(holdDuration: hold))
                    PolicyProbe(label: "Scope")
                    PolicyProbe(label: "Nested false").metalReduceMotion(false)
                }
                .metalReduceMotion(scoped)
            }
            Text(stage).font(.metal(MetalType.ui))
        }
        .padding(24).foregroundStyle(MetalColorway.bone.tokens.ink.color)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(MetalColorway.bone.tokens.s.color).metalColorway(.bone)
        .task {
            setbuf(stdout, nil)
            try? await Task.sleep(for: .seconds(2))
            hold = 5
            stage = "Both acts holding"
            print("MU_POLICY_ACTIVE")
            try? await Task.sleep(for: .seconds(2))
            scoped = true
            stage = "Scope cancels; outside continues"
            print("MU_POLICY_REDUCED")
            try? await Task.sleep(for: .seconds(2))
            scoped = false
            hold = nil
            stage = "Scope restored; clocks remain cancelled"
            print("MU_POLICY_RESTORED")
            try? await Task.sleep(for: .seconds(2))
            print("MU_POLICY_DONE")
        }
    }
}
