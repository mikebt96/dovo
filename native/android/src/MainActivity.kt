package app.dovo

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import app.dovo.core.supabase
import app.dovo.feature.HomeScreen
import app.dovo.feature.SignInScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // el magic link vuelve a la app por el deep link: lo canjea por sesión
        supabase.handleDeeplinks(intent)

        setContent {
            val status by supabase.auth.sessionStatus.collectAsState()
            when (status) {
                is SessionStatus.Authenticated -> HomeScreen()
                else -> SignInScreen()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        supabase.handleDeeplinks(intent) // deep link cuando la app ya está viva
    }
}
