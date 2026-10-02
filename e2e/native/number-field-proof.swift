import SwiftUI
import Darwin
import MetalUI

@main
struct NumberFieldProofApp: App {
    var body: some Scene { WindowGroup { NumberFieldProof() } }
}
struct NumberFieldProof: View {
    @State private var value = 2
    var body: some View {
        VStack(spacing: 24) {
            Text("Native step keys").font(.metal(MetalType.ui))
            MetalNumberField("Copies", value: $value, in: 1...3).frame(width: 260)
            Text(value == 1 ? "Minimum: decrease disabled" : value == 3 ? "Maximum: increase disabled" : "Both keys enabled")
                .font(.metal(MetalType.meta))
        }
        .padding(24).foregroundStyle(MetalColorway.bone.tokens.ink.color)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(MetalColorway.bone.tokens.s.color).metalColorway(.bone)
        .task {
            setbuf(stdout, nil)
            print("MU_NUMBER_READY")
            try? await Task.sleep(for: .seconds(60))
            print("MU_NUMBER_DONE")
        }
    }
}
