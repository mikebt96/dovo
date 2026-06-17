import Foundation
import Supabase

// Cliente Supabase de la app iOS. Mismo backend de prod que la web; el schema
// `core` se fija GLOBAL (rpc/from apuntan a core sin encadenar por llamada).
// Auth en PKCE (móvil). Sesión persiste en Keychain + auto-refresh (defaults
// de supabase-swift). Spec: docs/specs/2026-06-16-app-nativa-swift-kotlin.md.
@MainActor
final class SupabaseManager: ObservableObject {
    static let shared = SupabaseManager()

    let client: SupabaseClient
    @Published var session: Session?
    @Published var cargando = true

    private init() {
        let url = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_PUBLISHABLE_KEY") as? String ?? ""
        guard let supabaseURL = URL(string: url) else {
            fatalError("SUPABASE_URL inválida en Secrets.xcconfig — ¿usaste el truco https:/$()/ ?")
        }
        client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: key,
            options: SupabaseClientOptions(
                db: .init(schema: "core"),
                auth: .init(flowType: .pkce)
            )
        )
    }

    /// Escucha cambios de sesión: define si mostramos login o la app.
    func escuchar() async {
        for await (event, session) in client.auth.authStateChanges {
            switch event {
            case .initialSession, .signedIn, .signedOut, .tokenRefreshed, .userUpdated:
                self.session = session
                self.cargando = false
            default:
                break
            }
        }
    }

    func enviarMagicLink(email: String) async throws {
        try await client.auth.signInWithOTP(
            email: email,
            redirectTo: URL(string: "io.dovo.app://login-callback")
        )
    }

    /// El magic link abre la app con esta URL; aquí se canjea por sesión.
    func manejarURL(_ url: URL) async {
        do {
            try await client.auth.session(from: url)
        } catch {
            print("[supabase] deep link:", error.localizedDescription)
        }
    }

    func cerrarSesion() async {
        try? await client.auth.signOut()
    }
}
