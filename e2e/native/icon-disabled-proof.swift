import SwiftUI
import UIKit
import Darwin
import MetalUI

@main
struct ProofApp: App { var body: some Scene { WindowGroup { DisabledProof() } } }

struct DisabledProof: View {
    @State private var hold: Double?
    @State private var cancelled = false
    @State private var stage = "Rest"
    var body: some View {
        VStack(spacing: 36) {
            Text("Native glyph policy").font(.metal(MetalType.ui))
            HStack(spacing: 28) {
                VStack(spacing: 16) {
                    MetalIcon(.trash, size: 72, interaction: MetalIconInteraction(holdDuration: hold))
                    Text("Enabled").font(.metal(MetalType.meta))
                }
                VStack(spacing: 16) {
                    MetalIcon(.trash, size: 72, interaction: MetalIconInteraction(holdDuration: hold)).disabled(true)
                    Text("Disabled").font(.metal(MetalType.meta))
                }
                VStack(spacing: 16) {
                    MetalIcon(.trash, size: 72, interaction: MetalIconInteraction(holdDuration: hold)).disabled(cancelled)
                    Text("Cancel during hold").font(.metal(MetalType.meta))
                }
            }
            Text(stage).font(.metal(MetalType.ui))
            Text("All three receive the same hold request.")
                .font(.metal(MetalType.meta))
        }
        .padding(20).foregroundStyle(MetalColorway.bone.tokens.ink.color)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(MetalColorway.bone.tokens.s.color)
        .metalColorway(.bone)
        .task {
            setbuf(stdout, nil)
            try? await Task.sleep(for: .seconds(2))
            hold = 4
            stage = "Holding · disabled remains still"
            print("MU_PROOF_ACTIVE")
            try? await Task.sleep(for: .seconds(3))
            cancelled = true
            stage = "Disabled during hold · returned to rest"
            print("MU_PROOF_DISABLED")
        }
    }
}
