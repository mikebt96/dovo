import SwiftUI

@main
struct DovoApp: App {
    @StateObject private var supa = SupabaseManager.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if supa.cargando {
                    ZStack {
                        Color.dvPapel.ignoresSafeArea()
                        ProgressView().tint(.dvSignal)
                    }
                } else if supa.session != nil {
                    LobbyView()
                } else {
                    SignInView()
                }
            }
            .environmentObject(supa)
            .task { await supa.escuchar() }
            .onOpenURL { url in
                Task { await supa.manejarURL(url) }
            }
        }
    }
}
