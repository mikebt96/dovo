import SwiftUI

// Fase 0 · prueba de vida: si llegaste aquí, el login real funcionó y la sesión
// persiste. El lobby de verdad (trato/apuesta/misiones) llega en la Fase 1.
struct HomeView: View {
    @EnvironmentObject private var supa: SupabaseManager

    var body: some View {
        ZStack {
            Color.dvPapel.ignoresSafeArea()
            VStack(spacing: 14) {
                Text("estás dentro ✓")
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(Color.dvInk)
                if let email = supa.session?.user.email {
                    Text(email)
                        .font(.system(size: 15))
                        .foregroundStyle(Color.dvInkSoft)
                }
                Text("(fase 0 — el lobby llega en la fase 1)")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.dvInkSoft.opacity(0.7))
                    .padding(.top, 4)

                Button("cerrar sesión") {
                    Task { await supa.cerrarSesion() }
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.dvSignal)
                .padding(.top, 20)
            }
            .padding(28)
        }
    }
}
