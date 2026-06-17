package app.dovo.core

import androidx.compose.ui.graphics.Color

// "Mesa Nocturna" — valores EXACTOS de app/globals.css (sincronizar si cambian).
// Chrome calmado (papel/ink); color/motion solo en lo que está en juego.
object Dovo {
    val papel = Color(0xFFF4F4F6)       // near-white frío
    val ink = Color(0xFF08070D)         // blue-black
    val inkSoft = Color(0xFF2C2B36)
    val signal = Color(0xFF6D4AFF)      // violeta eléctrico — el único acento
    val signalDeep = Color(0xFF5A37E0)
    val signalOnGame = Color(0xFF8F70FF)
    val night1 = Color(0xFF16132A)      // superficies de juego (oscuras)
    val night2 = Color(0xFF0B0A14)
    val night3 = Color(0xFF07060D)
    val coop = Color(0xFF3AC49A)        // pacto/boost/escudo
    val rival = Color(0xFFFF3D5E)       // duelo/ataque/deuda
    val gold = Color(0xFFF0C75A)        // ceremonia (solo sobre oscuro)
}
