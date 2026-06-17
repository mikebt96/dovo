// Mergea en app/build.gradle.kts para exponer las llaves de local.properties
// como BuildConfig (lo que lee core/Supabase.kt). local.properties está
// gitignored por defecto en proyectos de Android Studio.

// 1) arriba del bloque android { }, lee local.properties:
import java.util.Properties
val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    // 2) habilita BuildConfig (en AGP reciente NO viene por default):
    buildFeatures {
        compose = true
        buildConfig = true
    }
    defaultConfig {
        // 3) inyecta las llaves (con fallback vacío para que el build no truene
        //    si faltan; el cliente fallará en runtime con mensaje claro):
        buildConfigField(
            "String", "SUPABASE_URL",
            "\"${localProps.getProperty("SUPABASE_URL", "")}\""
        )
        buildConfigField(
            "String", "SUPABASE_ANON_KEY",
            "\"${localProps.getProperty("SUPABASE_ANON_KEY", "")}\""
        )
    }
}
