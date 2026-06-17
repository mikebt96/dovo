import SwiftUI

// "Mesa Nocturna" — valores EXACTOS de app/globals.css (mantener sincronizados
// si cambian en la web). Tesis: chrome calmado (papel/ink); el color y el
// movimiento viven SOLO en lo que está en juego (trato/apuesta/resultado).
extension Color {
    static let dvPapel        = Color(dvHex: 0xF4F4F6) // near-white frío
    static let dvInk          = Color(dvHex: 0x08070D) // blue-black
    static let dvInkSoft      = Color(dvHex: 0x2C2B36)
    static let dvSignal       = Color(dvHex: 0x6D4AFF) // violeta eléctrico — el único acento
    static let dvSignalDeep   = Color(dvHex: 0x5A37E0)
    static let dvSignalOnGame = Color(dvHex: 0x8F70FF) // signal legible sobre panel oscuro
    static let dvNight1       = Color(dvHex: 0x16132A) // superficies de juego (oscuras)
    static let dvNight2       = Color(dvHex: 0x0B0A14)
    static let dvNight3       = Color(dvHex: 0x07060D)
    static let dvCoop         = Color(dvHex: 0x3AC49A) // pacto/boost/escudo
    static let dvRival        = Color(dvHex: 0xFF3D5E) // duelo/ataque/deuda
    static let dvGold         = Color(dvHex: 0xF0C75A) // ceremonia (solo sobre oscuro)
}

extension Color {
    init(dvHex hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}
