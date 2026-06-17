package app.dovo.feature

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.OTP
import kotlinx.coroutines.launch
import app.dovo.core.Dovo
import app.dovo.core.supabase

// Fase 0 · login con magic link. Chrome calmado (papel/ink) — sin motion.
@Composable
fun SignInScreen() {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var enviando by remember { mutableStateOf(false) }
    var enviado by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Surface(color = Dovo.papel, modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().padding(28.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text("dovo", fontSize = 44.sp, fontWeight = FontWeight.Black, color = Dovo.ink)
            Spacer(Modifier.height(4.dp))
            Text("más fuertes en pareja", fontSize = 15.sp, color = Dovo.inkSoft)
            Spacer(Modifier.height(20.dp))

            if (enviado) {
                Text(
                    "te mandamos un enlace a $email. ábrelo en este teléfono para entrar.",
                    fontSize = 15.sp, color = Dovo.inkSoft,
                )
            } else {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("tu correo") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        error = null; enviando = true
                        scope.launch {
                            try {
                                supabase.auth.signInWith(OTP) { this.email = email.trim() }
                                enviado = true
                            } catch (e: Exception) {
                                error = "no se pudo enviar — revisa el correo e intenta de nuevo"
                            }
                            enviando = false
                        }
                    },
                    enabled = !enviando && email.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Dovo.ink, contentColor = Dovo.papel),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (enviando) "enviando…" else "enviar enlace mágico")
                }
            }

            error?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, fontSize = 13.sp, color = Dovo.rival)
            }
        }
    }
}
