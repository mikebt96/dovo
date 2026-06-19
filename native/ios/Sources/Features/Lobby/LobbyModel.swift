import Foundation
import Supabase

// Fase 1 · carga el lobby (solo lectura sobre `core`, con RLS): el personaje +
// racha, el primer dúo y sus miembros, y la apuesta más reciente de ese dúo.
// Las mutaciones (sellar apuesta, check-in) llegan en fases posteriores.
@MainActor
final class LobbyModel: ObservableObject {
    @Published var character: CharacterRow?
    @Published var racha: Int = 0
    @Published var grupo: GrupoRow?
    @Published var miembros: [MiembroConNombre] = []
    @Published var apuesta: ApuestaRow?
    @Published var cargando = true
    @Published var error: String?

    private let client = SupabaseManager.shared.client

    func cargar() async {
        cargando = true
        error = nil
        do {
            guard let uid = client.auth.currentUser?.id.uuidString else {
                cargando = false
                return
            }

            // personaje
            let chars: [CharacterRow] = try await client
                .from("user_character")
                .select("fue,res,flex,vel,equ,vit,nivel,prestige,class_name")
                .eq("user_id", value: uid)
                .limit(1)
                .execute()
                .value
            character = chars.first

            // racha
            let streaks: [StreakRow] = try await client
                .from("user_streak")
                .select("current_streak_weeks")
                .eq("user_id", value: uid)
                .limit(1)
                .execute()
                .value
            racha = streaks.first?.current_streak_weeks ?? 0

            // primer dúo (trato embebido)
            let memberships: [MembershipWithTrato] = try await client
                .from("trato_miembros")
                .select("trato_id, tratos(id,nombre_grupo,tipo_grupo,estado)")
                .eq("user_id", value: uid)
                .execute()
                .value
            grupo = memberships.first(where: { $0.tratos != nil })?.tratos

            if let g = grupo {
                miembros = try await client
                    .from("trato_miembros")
                    .select("user_id, role, users(nombre)")
                    .eq("trato_id", value: g.id)
                    .execute()
                    .value

                let apuestas: [ApuestaRow] = try await client
                    .from("apuestas")
                    .select("id,week_start,premio_text,apuesta_text,estado,saldada")
                    .eq("trato_id", value: g.id)
                    .order("week_start", ascending: false)
                    .limit(1)
                    .execute()
                    .value
                apuesta = apuestas.first
            }
        } catch {
            self.error = "no se pudo cargar el lobby — desliza para reintentar"
            print("[lobby]", error)
        }
        cargando = false
    }
}
