import SwiftUI

// Fase 1 · el lobby. Chrome calmado (papel/ink) para personaje y grupo; la
// apuesta — "lo que está en juego" — va en tarjeta oscura (Mesa Nocturna §2).
struct LobbyView: View {
    @EnvironmentObject private var supa: SupabaseManager
    @StateObject private var model = LobbyModel()

    private let stats: [(String, KeyPath<CharacterRow, Double>)] = [
        ("FUE", \.fue), ("RES", \.res), ("FLE", \.flex),
        ("VEL", \.vel), ("EQU", \.equ), ("VIT", \.vit),
    ]

    var body: some View {
        ZStack {
            Color.dvPapel.ignoresSafeArea()
            if model.cargando {
                ProgressView().tint(.dvSignal)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        personaje
                        if let g = model.grupo { grupoCard(g) } else { sinGrupo }
                        apuestaCard

                        if let error = model.error {
                            Text(error).font(.system(size: 13)).foregroundStyle(Color.dvRival)
                        }

                        Button("cerrar sesión") {
                            Task { await supa.cerrarSesion() }
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.dvSignal)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 8)
                    }
                    .padding(24)
                }
            }
        }
        .task { await model.cargar() }
        .refreshable { await model.cargar() }
    }

    // ── personaje ──
    private var personaje: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                Text("tu personaje")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(2)
                    .foregroundStyle(Color.dvInkSoft)
                Spacer()
                Text("racha · \(model.racha) sem")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.dvInkSoft)
            }

            if let c = model.character {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\(c.nivel)")
                        .font(.system(size: 44, weight: .black))
                        .foregroundStyle(Color.dvInk)
                    Text("nivel")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.dvInkSoft)
                    if c.prestige > 0 {
                        Text("· prestige \(c.prestige)")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.dvSignal)
                    }
                }
                ForEach(stats, id: \.0) { (label, kp) in
                    statRow(label, value: c[keyPath: kp])
                }
            } else {
                Text("aún no tienes personaje — registra tu primer entreno.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.dvInkSoft)
            }
        }
    }

    private func statRow(_ label: String, value: Double) -> some View {
        HStack(spacing: 10) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.dvInkSoft)
                .frame(width: 36, alignment: .leading)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.dvInk.opacity(0.08))
                    Capsule().fill(Color.dvSignal)
                        .frame(width: max(6, geo.size.width * min(1, value / 150)))
                }
            }
            .frame(height: 6)
            Text("\(Int(value))")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.dvInk)
                .frame(width: 34, alignment: .trailing)
        }
    }

    // ── grupo ──
    private func grupoCard(_ g: GrupoRow) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("tu dúo")
                .font(.system(size: 11, weight: .semibold)).tracking(2)
                .foregroundStyle(Color.dvInkSoft)
            Text(g.nombre_grupo)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color.dvInk)
            ForEach(model.miembros) { m in
                HStack(spacing: 12) {
                    Text(inicial(m.users?.nombre))
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color.dvSignal)
                        .frame(width: 38, height: 38)
                        .background(Color.dvSignal.opacity(0.12))
                        .clipShape(Circle())
                    Text(m.users?.nombre ?? "miembro")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.dvInk)
                    Spacer()
                    if m.role == "creator" {
                        Text("creador")
                            .font(.system(size: 10, weight: .semibold)).tracking(1)
                            .foregroundStyle(Color.dvSignal)
                    }
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.dvInk.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private var sinGrupo: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("aún no tienes dúo")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(Color.dvInk)
            Text("dovo es entre dos. crea tu grupo o únete con un código.")
                .font(.system(size: 14))
                .foregroundStyle(Color.dvInkSoft)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.dvInk.opacity(0.04))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    // ── apuesta (lo que está en juego: tarjeta oscura) ──
    private var apuestaCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("la apuesta")
                .font(.system(size: 10, weight: .semibold)).tracking(3)
                .foregroundStyle(.white.opacity(0.5))
            if let a = model.apuesta {
                Text(a.premio_text)
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(Color.dvGold)
                Text(a.apuesta_text)
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.65))
                Text(estadoApuesta(a.estado))
                    .font(.system(size: 10, weight: .semibold)).tracking(2)
                    .foregroundStyle(a.estado == "viva" ? Color.dvGold : .white.opacity(0.5))
                    .padding(.top, 2)
            } else {
                Text("¿qué se juegan esta semana?")
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundStyle(.white)
                Text("el premio lo ganan juntos; la apuesta la paga quien le eche menos ganas.")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color.dvNight1, Color.dvNight3],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func estadoApuesta(_ e: String) -> String {
        switch e {
        case "viva": return "viva"
        case "ganada": return "ganada ✓"
        case "perdida": return "no cumplida"
        default: return e
        }
    }

    private func inicial(_ nombre: String?) -> String {
        guard let n = nombre?.trimmingCharacters(in: .whitespaces), let f = n.first else { return "·" }
        return String(f).uppercased()
    }
}
