import Foundation

// DTOs que mapean filas de `core` (nombres en snake_case = exactos a las
// columnas; el decoder de PostgREST devuelve snake_case, así no dependemos de
// keyDecodingStrategy). Columnas verificadas contra el schema 2026-06-17.

struct CharacterRow: Decodable {
    let fue, res, flex, vel, equ, vit: Double
    let nivel: Int
    let prestige: Int
    let class_name: String
}

struct StreakRow: Decodable {
    let current_streak_weeks: Int
}

struct GrupoRow: Decodable, Identifiable {
    let id: String
    let nombre_grupo: String
    let tipo_grupo: String
    let estado: String
}

// trato_miembros con el trato embebido (PostgREST: tratos(...))
struct MembershipWithTrato: Decodable {
    let trato_id: String
    let tratos: GrupoRow?
}

// trato_miembros con el nombre del user embebido (users(nombre))
struct MiembroConNombre: Decodable, Identifiable {
    let user_id: String
    let role: String
    let users: NombreWrap?
    var id: String { user_id }
    struct NombreWrap: Decodable { let nombre: String }
}

struct ApuestaRow: Decodable, Identifiable {
    let id: String
    let week_start: String
    let premio_text: String
    let apuesta_text: String
    let estado: String       // viva | ganada | perdida
    let saldada: Bool
}
