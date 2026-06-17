import SwiftUI

// Fase 0 · login con magic link contra el Supabase real. Chrome calmado
// (papel/ink) — esta pantalla NO es "lo que está en juego", así que sin motion.
struct SignInView: View {
    @EnvironmentObject private var supa: SupabaseManager
    @State private var email = ""
    @State private var enviando = false
    @State private var enviado = false
    @State private var error: String?

    var body: some View {
        ZStack {
            Color.dvPapel.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 20) {
                Spacer()
                Text("dovo")
                    .font(.system(size: 44, weight: .heavy))
                    .foregroundStyle(Color.dvInk)
                Text("más fuertes en pareja")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.dvInkSoft)

                if enviado {
                    Text("te mandamos un enlace a \(email). ábrelo en este teléfono para entrar.")
                        .font(.system(size: 15))
                        .foregroundStyle(Color.dvInkSoft)
                        .padding(.top, 12)
                } else {
                    TextField("tu correo", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding(.vertical, 10)
                        .overlay(alignment: .bottom) {
                            Rectangle().fill(Color.dvInk.opacity(0.25)).frame(height: 1)
                        }
                        .padding(.top, 16)

                    Button(action: enviar) {
                        Text(enviando ? "enviando…" : "enviar enlace mágico")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.dvInk)
                            .foregroundStyle(Color.dvPapel)
                            .clipShape(Capsule())
                    }
                    .disabled(enviando || email.isEmpty)
                    .opacity(enviando || email.isEmpty ? 0.5 : 1)
                }

                if let error {
                    Text(error).font(.system(size: 13)).foregroundStyle(Color.dvRival)
                }
                Spacer()
            }
            .padding(28)
        }
    }

    private func enviar() {
        error = nil
        enviando = true
        Task {
            do {
                try await supa.enviarMagicLink(email: email.trimmingCharacters(in: .whitespaces))
                enviado = true
            } catch {
                self.error = "no se pudo enviar — revisa el correo e intenta de nuevo"
            }
            enviando = false
        }
    }
}
