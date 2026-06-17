package app.dovo.feature

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import app.dovo.core.Dovo
import app.dovo.core.supabase

// Fase 0 · prueba de vida: si llegaste aquí, el login real funcionó. El lobby
// (trato/apuesta/misiones) llega en la Fase 1.
@Composable
fun HomeScreen() {
    val scope = rememberCoroutineScope()
    val email = supabase.auth.currentSessionOrNull()?.user?.email

    Surface(color = Dovo.papel, modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().padding(28.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("estás dentro ✓", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Dovo.ink)
            Spacer(Modifier.height(8.dp))
            if (email != null) Text(email, fontSize = 15.sp, color = Dovo.inkSoft)
            Spacer(Modifier.height(4.dp))
            Text("(fase 0 — el lobby llega en la fase 1)", fontSize = 13.sp, color = Dovo.inkSoft)
            Spacer(Modifier.height(20.dp))
            TextButton(onClick = { scope.launch { supabase.auth.signOut() } }) {
                Text("cerrar sesión", color = Dovo.signal)
            }
        }
    }
}
