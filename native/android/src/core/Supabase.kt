package app.dovo.core

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.FlowType
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import app.dovo.BuildConfig

// Cliente Supabase de la app Android. Mismo backend de prod que web e iOS.
// schema `core` global (defaultSchema) para que rpc()/from() apunten a core
// sin encadenar. Auth PKCE + deep link io.dovo.app://login-callback (el mismo
// que iOS — un solo Redirect URL en el dashboard).
// Spec: docs/specs/2026-06-16-app-nativa-swift-kotlin.md.
val supabase: SupabaseClient by lazy {
    createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
    ) {
        install(Auth) {
            scheme = "io.dovo.app"
            host = "login-callback"
            flowType = FlowType.PKCE
        }
        install(Postgrest) {
            defaultSchema = "core"
        }
    }
}
