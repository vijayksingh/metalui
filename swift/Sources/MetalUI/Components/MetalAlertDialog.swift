import SwiftUI

/// The question uses the shared dialog plate. Cancel receives initial keyboard focus;
/// native sheet containment and Escape remain supplied by the platform.
private struct MetalAlertQuestion: View {
    let title: String
    let message: String
    @Binding var isPresented: Bool
    let confirm: String
    let role: ButtonRole?
    let cancel: String
    let hold: Bool
    let onConfirm: () -> Void
    @FocusState private var cancelFocused: Bool
    @Environment(\.metalColorway) private var colorway

    var body: some View {
        MetalDialogPopup(title) {
            Text(message)
                .font(.metal(MetalType.body))
                .foregroundStyle(colorway.tokens.ink2.color)
        } actions: {
            MetalButton(cancel) { isPresented = false }
                .focused($cancelFocused)
                .keyboardShortcut(.cancelAction)
            MetalButton(confirm, icon: role == .destructive ? .trash : .check,
                        cap: role == .destructive ? .destructive : .primary, hold: hold) {
                onConfirm()
                isPresented = false
            }
        }
        .onAppear { cancelFocused = true }
    }
}

public extension View {
    /// Use `MetalButton("Delete regions…", icon: .trash)` for the launcher; the destructive
    /// confirm uses the same canonical glyph while Cancel stays a plain choice.
    /// Set `hold` only for irreversible loss. Undoable deletion uses an ordinary press.
    /// Hosts may set it false when a pointer cannot sustain a hold; the question still guards loss.
    func metalAlertDialog(
        _ title: String,
        message: String,
        isPresented: Binding<Bool>,
        confirm: String,
        role: ButtonRole? = .destructive,
        cancel: String = "Cancel",
        hold: Bool = false,
        onConfirm: @escaping () -> Void
    ) -> some View {
        sheet(isPresented: isPresented) {
            MetalAlertQuestion(title: title, message: message, isPresented: isPresented,
                               confirm: confirm, role: role, cancel: cancel, hold: hold,
                               onConfirm: onConfirm)
                .interactiveDismissDisabled()
        }
    }
}

/// The alert dialog as a type, for the registry and parity checks.
public enum MetalAlertDialog {}
