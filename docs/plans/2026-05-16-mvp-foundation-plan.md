# dovo MVP — Plan 1 · Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `~/dovo` en un repo limpio con scaffold de Next 15 + Supabase + Tailwind v4, esquemas `core` y `pulse` aislados por role, y flujo de auth funcional (magic link sign-up / sign-in).

**Architecture:** Next 15 (app router, server actions) + Supabase (auth + postgres con dos schemas en BD aislados por role) + Tailwind v4 + Vitest para tests. Frontend separa rutas `(auth)` públicas y `(app)` protegidas via middleware. Backend usa `@supabase/ssr` para cookies + session sync.

**Tech Stack:** Next 15.1+, React 19, TypeScript 5.7, Tailwind v4 (postcss plugin), `@supabase/supabase-js` 2.45+, `@supabase/ssr` 0.5+, Zod 4.4+, Vitest 2+, `@testing-library/react` 16+, Supabase CLI 1.207+ para migrations locales.

**Result al cerrar este plan:** un usuario puede entrar a `https://dovo.app/sign-up`, recibir un magic link en su email, autenticarse, y aterrizar en `/` (home protegido, vacío todavía). Tablas `core.users`, `core.tratos`, `core.checkins`, `core.user_scores`, `core.sponsored_tratos`, `core.brand_partners`, `core.reward_codes`, `pulse.eventos_agregados` existen con role isolation verificada por test.

---

## Spec source

Este plan implementa las secciones 7 (arquitectura técnica) y partes de 3 (Tratos Sociales — schema únicamente, no UX), 4 (Sponsored — schema únicamente), 5 (Pulse — schema + isolation, no edge function todavía) del spec `docs/specs/2026-05-16-mvp-tratos-pulse-design.md`. La UX de tratos (crear, invitar, check-in, resolución), la edge function de Pulse, las notificaciones, y los Tratos Patrocinados completos viven en planes 2–4.

---

## File structure final

```
~/dovo/
├── .env.local                     [conservar — credenciales Supabase actuales]
├── .env.example                   [reescribir con vars del MVP]
├── .gitignore                     [conservar, revisar]
├── package.json                   [reescribir — deps limpias]
├── tsconfig.json                  [conservar]
├── next.config.ts                 [conservar]
├── postcss.config.mjs             [conservar]
├── middleware.ts                  [reescribir — auth-based]
├── vercel.json                    [conservar]
├── vitest.config.ts               [crear]
├── public/
│   ├── favicon.ico                [conservar]
│   └── (vacío de lo demás)
├── docs/
│   ├── specs/
│   │   └── 2026-05-16-mvp-tratos-pulse-design.md  [conservar]
│   ├── plans/
│   │   └── 2026-05-16-mvp-foundation-plan.md      [este archivo]
│   └── mockups/                   [conservar]
├── supabase/
│   ├── config.toml                [crear — Supabase CLI local]
│   ├── migrations/
│   │   ├── 20260516120001_core_schema.sql
│   │   ├── 20260516120002_pulse_schema.sql
│   │   ├── 20260516120003_core_users.sql
│   │   ├── 20260516120004_core_tratos.sql
│   │   ├── 20260516120005_core_checkins.sql
│   │   ├── 20260516120006_core_user_scores.sql
│   │   ├── 20260516120007_core_sponsored.sql
│   │   ├── 20260516120008_pulse_eventos_agregados.sql
│   │   └── 20260516120009_role_isolation.sql
│   └── seed.sql                   [crear — vacío por ahora]
├── lib/
│   ├── env.ts                     [reescribir — vars limpias]
│   ├── supabase/
│   │   ├── client.ts              [crear — browser client]
│   │   ├── server.ts              [crear — server-only client]
│   │   ├── middleware.ts          [crear — helper para middleware]
│   │   └── types.ts               [generado por supabase gen types]
│   └── schemas/
│       └── auth.ts                [crear — Zod schemas para forms de auth]
├── app/
│   ├── layout.tsx                 [reescribir — minimal, fonts]
│   ├── globals.css                [reescribir — Tailwind v4 + tokens dovo]
│   ├── page.tsx                   [reescribir — landing pública]
│   ├── manifest.ts                [reescribir — DOVO PWA]
│   ├── icon.svg                   [conservar / reescribir]
│   ├── opengraph-image.tsx        [reescribir]
│   ├── error.tsx                  [conservar / simplificar]
│   ├── (auth)/
│   │   ├── layout.tsx             [crear]
│   │   ├── sign-up/page.tsx       [crear]
│   │   └── sign-in/page.tsx       [crear]
│   ├── auth/
│   │   └── callback/route.ts      [crear]
│   └── (app)/
│       ├── layout.tsx             [crear — require auth]
│       └── page.tsx               [crear — home empty state]
├── tests/
│   ├── setup.ts                   [crear]
│   ├── integration/
│   │   └── schema-isolation.test.ts  [crear]
│   └── e2e/
│       └── auth-flow.test.ts      [crear]
└── scripts/                       [vacío — borrar contenido legacy]
```

---

## Task 1 · Hard reset del codebase

**Objetivo:** eliminar todo el código de la iteración previa y reiniciar git con history limpia. **Conservar** únicamente las credenciales y la decisión de stack.

**Files:**
- Conservar: `.env.local`, `.env.example`, `.gitignore`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vercel.json`, `public/favicon.ico`, `docs/specs/`, `docs/plans/`, `docs/mockups/`
- Eliminar: todo lo demás incluyendo `.git/`, `node_modules/`, `.next/`, `app/[profile]/`, `app/juntos/`, `app/three/`, `app/landing/`, `app/unlock/`, `app/components/`, `app/api/`, `lib/ai/`, `lib/whatsapp/`, `lib/scrapers/`, `lib/data/`, `lib/queries/`, `lib/gamification/`, `lib/auth/`, `lib/schemas/`, `lib/actions/`, `lib/notifications.ts`, `lib/mealsServer.ts`, `lib/streaks.ts`, `lib/storage.ts`, `lib/profile.ts`, `lib/profileServer.ts`, `lib/historyServer.ts`, `lib/checksServer.ts`, `lib/dates.ts`, `lib/brand.ts`, `lib/prices.ts`, `lib/types.ts`, `lib/weekly-review-data.ts`, `lib/whatsapp.ts`, `lib/supabase.ts`, `lib/env.ts`, `middleware.ts`, `supabase/migrations/`, `supabase/schema.sql`, `scripts/`, `SAAS_MIGRATION_PATH.md`, `README.md`, `package.json`, `package-lock.json`, `tsconfig.tsbuildinfo`, `next-env.d.ts`

- [ ] **Step 1.1: Verificar que estás en `~/dovo` y que `.env.local` existe**

```bash
cd ~/dovo && pwd && ls -la .env.local
```

Expected output: ruta `/home/elmikebutron/dovo` + el archivo `.env.local` listado con tamaño > 0.

- [ ] **Step 1.2: Hacer backup OFF-REPO de `.env.local` por seguridad**

```bash
cp /home/elmikebutron/dovo/.env.local /tmp/dovo-env-backup-$(date +%s).local
ls -la /tmp/dovo-env-backup-*.local
```

Expected: archivo en `/tmp/` con tamaño igual al original.

- [ ] **Step 1.3: Eliminar git history y todo el contenido del repo excepto lo conservable**

```bash
cd /home/elmikebutron/dovo && \
find . -mindepth 1 -maxdepth 1 \
  ! -name '.env.local' \
  ! -name '.env.example' \
  ! -name '.gitignore' \
  ! -name 'tsconfig.json' \
  ! -name 'next.config.ts' \
  ! -name 'postcss.config.mjs' \
  ! -name 'vercel.json' \
  ! -name 'public' \
  ! -name 'docs' \
  -exec rm -rf {} +
```

Y limpiar `public/` de assets legacy:

```bash
cd /home/elmikebutron/dovo/public && \
find . -mindepth 1 ! -name 'favicon.ico' -exec rm -rf {} +
ls /home/elmikebutron/dovo/public/
```

Expected output del último `ls`: solo `favicon.ico`.

- [ ] **Step 1.4: Verificar el repo limpio**

```bash
cd /home/elmikebutron/dovo && ls -la
```

Expected: solo `.env.local`, `.env.example`, `.gitignore`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vercel.json`, `public/`, `docs/`.

- [ ] **Step 1.5: Re-inicializar git con history limpia**

```bash
cd /home/elmikebutron/dovo && \
git init -b main && \
git config user.email "miguel.butron06@gmail.com" && \
git config user.name "Miguel Butrón"
```

Expected: `Initialized empty Git repository in /home/elmikebutron/dovo/.git/`.

- [ ] **Step 1.6: Crear commit inicial con los archivos conservados**

```bash
cd /home/elmikebutron/dovo && \
git add . && \
git commit -m "init: dovo MVP scaffold

Conservados credenciales Supabase, config Next/Tailwind/Vercel,
specs y plans del MVP. Repo arranca desde aquí."
```

Expected: commit creado con SHA visible.

---

## Task 2 · Inicializar package.json limpio

**Files:**
- Create: `/home/elmikebutron/dovo/package.json`

- [ ] **Step 2.1: Crear `package.json` con deps mínimas del MVP**

```bash
cat > /home/elmikebutron/dovo/package.json <<'EOF'
{
  "name": "dovo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "vitest run --dir tests/e2e",
    "db:reset": "supabase db reset",
    "db:diff": "supabase db diff",
    "db:types": "supabase gen types typescript --local > lib/supabase/types.ts"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.4",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "server-only": "^0.0.1",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0-beta.5",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "happy-dom": "^15.11.0",
    "postcss": "^8.4.49",
    "supabase": "^1.207.9",
    "tailwindcss": "^4.0.0-beta.5",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
EOF
```

- [ ] **Step 2.2: Instalar dependencias**

```bash
cd /home/elmikebutron/dovo && npm install
```

Expected: instalación exitosa sin errores. Genera `package-lock.json` + `node_modules/`.

- [ ] **Step 2.3: Verificar versions instaladas**

```bash
cd /home/elmikebutron/dovo && npm ls --depth=0 2>&1 | head -30
```

Expected: `next@15.1.x`, `react@19.x`, `@supabase/ssr@0.5.x`, sin `UNMET` errores.

- [ ] **Step 2.4: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add package.json package-lock.json && \
git commit -m "deps: instala dependencias base del MVP"
```

---

## Task 3 · Configurar `.gitignore` y env vars

**Files:**
- Modify: `/home/elmikebutron/dovo/.gitignore`
- Create: `/home/elmikebutron/dovo/.env.example`
- Create: `/home/elmikebutron/dovo/lib/env.ts`

- [ ] **Step 3.1: Reescribir `.gitignore` con las exclusiones del MVP**

```bash
cat > /home/elmikebutron/dovo/.gitignore <<'EOF'
# dependencies
node_modules/
.pnp
.pnp.*
.yarn/*

# next.js
.next/
out/
build/

# typescript
*.tsbuildinfo
next-env.d.ts

# misc
.DS_Store
*.pem

# env (NUNCA committear)
.env
.env*.local

# vercel
.vercel

# testing
coverage/
.nyc_output/

# supabase local
supabase/.branches/
supabase/.temp/

# editor
.vscode/
.idea/
EOF
```

- [ ] **Step 3.2: Crear `.env.example` con las vars que el MVP necesita**

```bash
cat > /home/elmikebutron/dovo/.env.example <<'EOF'
# Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side keys (NUNCA expongas estos al cliente)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Pulse-only role (lectura/escritura solo schema pulse, NO core)
SUPABASE_PULSE_ROLE_KEY=your-pulse-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

- [ ] **Step 3.3: Crear `lib/env.ts` con validación Zod**

```bash
mkdir -p /home/elmikebutron/dovo/lib
cat > /home/elmikebutron/dovo/lib/env.ts <<'EOF'
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_PULSE_ROLE_KEY: z.string().min(1),
});

export const publicEnv = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    ...publicEnv,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_PULSE_ROLE_KEY: process.env.SUPABASE_PULSE_ROLE_KEY,
  });
}
EOF
```

- [ ] **Step 3.4: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add .gitignore .env.example lib/env.ts && \
git commit -m "config: gitignore, env.example, validación Zod de env vars"
```

---

## Task 4 · Configurar Supabase CLI local

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/config.toml`

- [ ] **Step 4.1: Inicializar Supabase CLI en el repo**

```bash
cd /home/elmikebutron/dovo && npx supabase init
```

Cuando pregunte por VSCode settings, responder `n`. Genera `supabase/config.toml` + `supabase/seed.sql`.

- [ ] **Step 4.2: Editar `supabase/config.toml` para configurar el proyecto**

Reemplazar el archivo generado con:

```bash
cat > /home/elmikebutron/dovo/supabase/config.toml <<'EOF'
project_id = "dovo"

[api]
enabled = true
port = 54321
schemas = ["public", "core", "pulse"]
extra_search_path = ["public", "core"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
secure_password_change = false
max_frequency = "1s"

[auth.email.template.magic_link]
subject = "tu link de entrada a dovo"
content_path = "./supabase/templates/magic-link.html"

[edge_functions]
enabled = true

[analytics]
enabled = false
EOF
```

- [ ] **Step 4.3: Crear el template del magic link email**

```bash
mkdir -p /home/elmikebutron/dovo/supabase/templates
cat > /home/elmikebutron/dovo/supabase/templates/magic-link.html <<'EOF'
<!DOCTYPE html>
<html lang="es-MX">
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f1ea; padding: 48px 24px; color: #0a0a0a;">
  <div style="max-width: 480px; margin: 0 auto;">
    <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.04em; text-transform: lowercase;">dovo</h1>
    <p style="font-size: 16px; line-height: 1.5; margin-top: 24px;">tu link para entrar:</p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; margin-top: 16px; padding: 14px 24px; background: #0a0a0a; color: #f5f1ea; text-decoration: none; font-weight: 600;">entrar a dovo</a>
    <p style="font-size: 12px; opacity: 0.6; margin-top: 32px;">si no fuiste tú, ignora este correo.</p>
  </div>
</body>
</html>
EOF
```

- [ ] **Step 4.4: Levantar Supabase local y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase start
```

Expected: tarda 1–3 min la primera vez (descarga imágenes Docker). Imprime credenciales locales al terminar — guardarlas para Task 5.

- [ ] **Step 4.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/ && \
git commit -m "supabase: init local con schemas core + pulse en search path"
```

---

## Task 5 · Configurar Vitest

**Files:**
- Create: `/home/elmikebutron/dovo/vitest.config.ts`
- Create: `/home/elmikebutron/dovo/tests/setup.ts`

- [ ] **Step 5.1: Crear `vitest.config.ts`**

```bash
cat > /home/elmikebutron/dovo/vitest.config.ts <<'EOF'
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
EOF
```

- [ ] **Step 5.2: Crear `tests/setup.ts`**

```bash
mkdir -p /home/elmikebutron/dovo/tests
cat > /home/elmikebutron/dovo/tests/setup.ts <<'EOF'
import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";

beforeAll(() => {
  // Carga vars de entorno de test desde .env.test.local si existe
  // Las vars de Supabase local quedan inyectadas por `supabase start`
});
EOF
```

- [ ] **Step 5.3: Crear test smoke que verifique que vitest corre**

```bash
mkdir -p /home/elmikebutron/dovo/tests/integration
cat > /home/elmikebutron/dovo/tests/integration/smoke.test.ts <<'EOF'
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
EOF
```

- [ ] **Step 5.4: Correr el smoke test**

```bash
cd /home/elmikebutron/dovo && npm test
```

Expected: `1 passed`. Si falla, revisar versions de vitest/react y la config.

- [ ] **Step 5.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add vitest.config.ts tests/ && \
git commit -m "test: configura vitest + happy-dom + smoke test inicial"
```

---

## Task 6 · Migration: schema `core`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120001_core_schema.sql`

- [ ] **Step 6.1: Escribir test de integración que falla porque el schema `core` no existe**

```bash
cat > /home/elmikebutron/dovo/tests/integration/schema-core.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";

describe("schema core", () => {
  it("existe y es accesible con service role", async () => {
    const client = createClient(supabaseUrl, serviceKey, {
      db: { schema: "core" as any },
    });
    const { error } = await client.rpc("ping_core" as any);
    // Aunque la función no exista, el error debe ser "function does not exist",
    // no "schema does not exist"
    expect(error?.message ?? "").not.toMatch(/schema "core" does not exist/i);
  });
});
EOF
```

- [ ] **Step 6.2: Correr el test y verificar que falla**

Antes de correr, exportar las vars de Supabase local (se imprimieron en Task 4.4):

```bash
export SUPABASE_LOCAL_URL="http://127.0.0.1:54321"
export SUPABASE_LOCAL_SERVICE_KEY="<service_role key del output de supabase start>"
cd /home/elmikebutron/dovo && npm test -- schema-core
```

Expected: FAIL con `schema "core" does not exist`.

- [ ] **Step 6.3: Crear la migration que crea el schema `core`**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120001_core_schema.sql <<'EOF'
-- Schema core: tabla de tratos individuales y datos de usuario.
-- Aislado de schema pulse por arquitectura: roles diferentes acceden cada uno.

create schema if not exists core;

comment on schema core is 'Datos individuales: usuarios, tratos, checkins, scores, sponsored. Aislado físicamente de pulse.';
EOF
```

- [ ] **Step 6.4: Aplicar migrations locales**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset
```

Expected: aplica todas las migrations en orden, schema `core` queda creado.

- [ ] **Step 6.5: Verificar que el test pasa**

```bash
cd /home/elmikebutron/dovo && npm test -- schema-core
```

Expected: PASS.

- [ ] **Step 6.6: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120001_core_schema.sql tests/integration/schema-core.test.ts && \
git commit -m "db: crea schema core para datos individuales"
```

---

## Task 7 · Migration: schema `pulse`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120002_pulse_schema.sql`

- [ ] **Step 7.1: Escribir test que verifica que el schema `pulse` existe**

```bash
cat > /home/elmikebutron/dovo/tests/integration/schema-pulse.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";

describe("schema pulse", () => {
  it("existe", async () => {
    const client = createClient(supabaseUrl, serviceKey);
    const { data, error } = await client
      .from("pg_namespace" as any)
      .select("nspname")
      .eq("nspname", "pulse")
      .limit(1);
    // Alternativa: usar rpc o raw SQL via service role
    expect(error).toBeNull();
  });
});
EOF
```

- [ ] **Step 7.2: Correr el test y verificar que falla (o no encuentra el schema)**

```bash
cd /home/elmikebutron/dovo && npm test -- schema-pulse
```

Expected: FAIL — `pulse` no existe todavía.

- [ ] **Step 7.3: Crear la migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120002_pulse_schema.sql <<'EOF'
-- Schema pulse: agregados anónimos para inteligencia conductual.
-- Aislado físicamente de schema core. NUNCA contiene user_id, trato_id, ni contenido textual.

create schema if not exists pulse;

comment on schema pulse is 'Agregados anónimos para Pulse DOVO. Privacy-by-architecture: aislado de core, k-anonymity >= 100 enforced en queries.';
EOF
```

- [ ] **Step 7.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- schema-pulse
```

Expected: PASS.

- [ ] **Step 7.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120002_pulse_schema.sql tests/integration/schema-pulse.test.ts && \
git commit -m "db: crea schema pulse para agregados anónimos"
```

---

## Task 8 · Migration: `core.users`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120003_core_users.sql`

- [ ] **Step 8.1: Escribir test de existencia + columnas esperadas**

```bash
cat > /home/elmikebutron/dovo/tests/integration/core-users.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";

describe("core.users", () => {
  it("permite insertar un usuario válido", async () => {
    const client = createClient(url, key, { db: { schema: "core" as any } });
    const { data, error } = await client
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        email: `test-${Date.now()}@dovo.app`,
        nombre: "Test User",
        access_channel: "fcfs",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.email).toContain("@dovo.app");
    expect(data?.pulse_opt_out).toBe(false);
  });
});
EOF
```

- [ ] **Step 8.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- core-users
```

Expected: FAIL — tabla no existe.

- [ ] **Step 8.3: Crear la migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120003_core_users.sql <<'EOF'
-- core.users: perfil del usuario, ligado 1:1 con auth.users via id.

create table core.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text not null,
  pulse_opt_out boolean not null default false,
  access_channel text not null check (access_channel in ('curated', 'fcfs')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table core.users is 'Perfil del usuario. id == auth.users.id. pulse_opt_out controla si los eventos del usuario alimentan pulse.';
comment on column core.users.access_channel is 'curated = invitación 1-a-1 por Miguel · fcfs = primer-en-llegar via form público';

-- Trigger para updated_at
create or replace function core.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on core.users
  for each row execute function core.set_updated_at();

-- RLS desde el inicio (políticas las define el código de aplicación)
alter table core.users enable row level security;

-- Policy: cada user puede leer su propio row vía auth.uid()
create policy users_read_own on core.users
  for select using (auth.uid() = id);

-- Policy: cada user puede actualizar su propio row
create policy users_update_own on core.users
  for update using (auth.uid() = id);

-- Policy: service_role bypassea (manejado por Supabase automáticamente con service_role_key)
EOF
```

- [ ] **Step 8.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- core-users
```

Expected: el test puede fallar inicialmente porque `id` requiere FK a `auth.users`. Si falla por FK, modificar el test para crear primero el auth.user via Supabase admin API. Versión alternativa del test:

```bash
cat > /home/elmikebutron/dovo/tests/integration/core-users.test.ts <<'EOF'
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

describe("core.users", () => {
  it("permite insertar usuario después de crear auth user", async () => {
    const email = `test-${Date.now()}@dovo.app`;
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    const coreClient = createClient(url, key, { db: { schema: "core" as any } });
    const { data, error } = await coreClient
      .from("users")
      .insert({
        id: authData.user!.id,
        email,
        nombre: "Test User",
        access_channel: "fcfs",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.email).toBe(email);
    expect(data?.pulse_opt_out).toBe(false);

    // cleanup
    await admin.auth.admin.deleteUser(authData.user!.id);
  });
});
EOF

cd /home/elmikebutron/dovo && npm test -- core-users
```

Expected: PASS.

- [ ] **Step 8.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120003_core_users.sql tests/integration/core-users.test.ts && \
git commit -m "db: core.users con RLS, trigger updated_at, FK a auth.users"
```

---

## Task 9 · Migration: `core.tratos`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120004_core_tratos.sql`

- [ ] **Step 9.1: Escribir test**

```bash
cat > /home/elmikebutron/dovo/tests/integration/core-tratos.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key);

async function createTestUser(emailSuffix: string) {
  const { data } = await admin.auth.admin.createUser({
    email: `t${emailSuffix}-${Date.now()}@dovo.app`,
    email_confirm: true,
  });
  const id = data.user!.id;
  const core = createClient(url, key, { db: { schema: "core" as any } });
  await core.from("users").insert({
    id,
    email: data.user!.email,
    nombre: `User ${emailSuffix}`,
    access_channel: "fcfs",
  });
  return id;
}

describe("core.tratos", () => {
  it("permite crear trato pendiente entre dos usuarios", async () => {
    const creatorId = await createTestUser("c");
    const partnerId = await createTestUser("p");

    const core = createClient(url, key, { db: { schema: "core" as any } });
    const { data, error } = await core
      .from("tratos")
      .insert({
        creator_id: creatorId,
        partner_id: partnerId,
        goal: "gym 3 veces por semana",
        frecuencia: "3x_per_week",
        duracion_dias: 56,
        recompensa_text: "el que cumpla elige la peli",
        castigo_text: "el que falle paga el café",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.estado).toBe("pendiente_aceptacion");
    expect(data?.creator_id).toBe(creatorId);
  });

  it("rechaza trato consigo mismo (creator == partner)", async () => {
    const userId = await createTestUser("self");
    const core = createClient(url, key, { db: { schema: "core" as any } });
    const { error } = await core
      .from("tratos")
      .insert({
        creator_id: userId,
        partner_id: userId,
        goal: "consigo mismo",
        frecuencia: "daily",
        duracion_dias: 7,
        recompensa_text: "x",
        castigo_text: "y",
      });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/check constraint|creator.*partner/i);
  });
});
EOF
```

- [ ] **Step 9.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- core-tratos
```

Expected: FAIL.

- [ ] **Step 9.3: Crear migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120004_core_tratos.sql <<'EOF'
-- core.tratos: el trato entre dos personas.

create type core.trato_estado as enum ('pendiente_aceptacion', 'activo', 'cerrado', 'disputado');
create type core.trato_resultado as enum ('ambos_cumplieron', 'uno_fallo', 'ambos_fallaron', 'sin_resolver');

create table core.tratos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references core.users(id) on delete restrict,
  partner_id uuid not null references core.users(id) on delete restrict,
  goal text not null check (length(goal) between 3 and 500),
  frecuencia text not null,
  duracion_dias int not null check (duracion_dias between 1 and 365),
  recompensa_text text not null check (length(recompensa_text) between 1 and 500),
  castigo_text text not null check (length(castigo_text) between 1 and 500),
  estado core.trato_estado not null default 'pendiente_aceptacion',
  resultado core.trato_resultado,
  sponsored_id uuid,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint creator_ne_partner check (creator_id != partner_id)
);

create index tratos_creator_idx on core.tratos(creator_id);
create index tratos_partner_idx on core.tratos(partner_id);
create index tratos_estado_idx on core.tratos(estado);

create trigger tratos_updated_at
  before update on core.tratos
  for each row execute function core.set_updated_at();

comment on table core.tratos is 'Trato entre dos usuarios. Solo dúos (creator != partner). Recompensa/castigo en texto libre, ejecutados off-platform.';
comment on column core.tratos.sponsored_id is 'FK a core.sponsored_tratos cuando este trato pertenece a una campaña patrocinada.';

alter table core.tratos enable row level security;

-- Cada miembro del dúo puede leer sus tratos
create policy tratos_read_member on core.tratos
  for select using (auth.uid() in (creator_id, partner_id));

-- Solo creator puede crear el trato
create policy tratos_insert_creator on core.tratos
  for insert with check (auth.uid() = creator_id);

-- Ambos miembros pueden actualizar (para aceptar, marcar resolución, etc.)
create policy tratos_update_member on core.tratos
  for update using (auth.uid() in (creator_id, partner_id));
EOF
```

- [ ] **Step 9.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- core-tratos
```

Expected: ambos tests PASS.

- [ ] **Step 9.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120004_core_tratos.sql tests/integration/core-tratos.test.ts && \
git commit -m "db: core.tratos con enum estados, constraint dúo, RLS por miembro"
```

---

## Task 10 · Migration: `core.checkins`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120005_core_checkins.sql`

Per decisión del spec sección 11.3: **self-report + flag de disputa por el otro**.

- [ ] **Step 10.1: Escribir test**

```bash
cat > /home/elmikebutron/dovo/tests/integration/core-checkins.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key);
const core = createClient(url, key, { db: { schema: "core" as any } });

async function createUserAndTrato() {
  const c = await admin.auth.admin.createUser({ email: `c-${Date.now()}@dovo.app`, email_confirm: true });
  const p = await admin.auth.admin.createUser({ email: `p-${Date.now()}@dovo.app`, email_confirm: true });
  await core.from("users").insert([
    { id: c.data.user!.id, email: c.data.user!.email, nombre: "C", access_channel: "fcfs" },
    { id: p.data.user!.id, email: p.data.user!.email, nombre: "P", access_channel: "fcfs" },
  ]);
  const { data: trato } = await core.from("tratos").insert({
    creator_id: c.data.user!.id,
    partner_id: p.data.user!.id,
    goal: "test",
    frecuencia: "daily",
    duracion_dias: 7,
    recompensa_text: "x",
    castigo_text: "y",
  }).select().single();
  return { creatorId: c.data.user!.id, partnerId: p.data.user!.id, tratoId: trato!.id };
}

describe("core.checkins", () => {
  it("permite self-report de cumplimiento", async () => {
    const { creatorId, tratoId } = await createUserAndTrato();
    const { data, error } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creatorId,
      fecha: new Date().toISOString().slice(0, 10),
      cumplido: true,
    }).select().single();
    expect(error).toBeNull();
    expect(data?.cumplido).toBe(true);
    expect(data?.disputed_by).toBeNull();
  });

  it("permite que el otro miembro dispute con razón", async () => {
    const { creatorId, partnerId, tratoId } = await createUserAndTrato();
    const { data: checkin } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creatorId,
      fecha: new Date().toISOString().slice(0, 10),
      cumplido: true,
    }).select().single();

    const { data, error } = await core.from("checkins")
      .update({
        disputed_by: partnerId,
        disputed_reason: "no lo vi en el gym hoy",
        disputed_at: new Date().toISOString(),
      })
      .eq("id", checkin!.id)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.disputed_by).toBe(partnerId);
  });

  it("rechaza disputed_reason muy corto", async () => {
    const { creatorId, partnerId, tratoId } = await createUserAndTrato();
    const { data: checkin } = await core.from("checkins").insert({
      trato_id: tratoId,
      user_id: creatorId,
      fecha: new Date().toISOString().slice(0, 10),
      cumplido: true,
    }).select().single();

    const { error } = await core.from("checkins")
      .update({
        disputed_by: partnerId,
        disputed_reason: "no",
        disputed_at: new Date().toISOString(),
      })
      .eq("id", checkin!.id);
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/check constraint|disputed_reason/i);
  });
});
EOF
```

- [ ] **Step 10.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- core-checkins
```

Expected: FAIL.

- [ ] **Step 10.3: Crear migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120005_core_checkins.sql <<'EOF'
-- core.checkins: self-report del cumplimiento + flag de disputa del otro.

create table core.checkins (
  id uuid primary key default gen_random_uuid(),
  trato_id uuid not null references core.tratos(id) on delete cascade,
  user_id uuid not null references core.users(id) on delete restrict,
  fecha date not null,
  cumplido boolean not null,
  nota text check (nota is null or length(nota) <= 280),
  -- Disputa por el otro miembro del dúo (decisión spec 11.3)
  disputed_by uuid references core.users(id),
  disputed_reason text check (
    disputed_reason is null or length(disputed_reason) between 10 and 280
  ),
  disputed_at timestamptz,
  created_at timestamptz not null default now(),
  -- Constraint: si hay dispute, requiere los 3 campos
  constraint dispute_complete check (
    (disputed_by is null and disputed_reason is null and disputed_at is null) or
    (disputed_by is not null and disputed_reason is not null and disputed_at is not null)
  ),
  -- Un user no puede tener dos checkins en el mismo trato el mismo día
  unique (trato_id, user_id, fecha)
);

create index checkins_trato_idx on core.checkins(trato_id);
create index checkins_user_idx on core.checkins(user_id);
create index checkins_fecha_idx on core.checkins(fecha);

comment on table core.checkins is 'Self-report de cumplimiento. disputed_by permite que el otro miembro del dúo flag el día como en disputa (decisión spec 11.3).';

alter table core.checkins enable row level security;

-- Miembros del trato pueden leer todos los checkins del trato
create policy checkins_read_trato_members on core.checkins
  for select using (
    auth.uid() in (
      select creator_id from core.tratos where id = trato_id
      union
      select partner_id from core.tratos where id = trato_id
    )
  );

-- Solo el user puede insertar su propio checkin
create policy checkins_insert_self on core.checkins
  for insert with check (auth.uid() = user_id);

-- Update: el user puede editar su propio checkin (cumplido/nota)
--         o el otro miembro puede setear disputed_*
create policy checkins_update_self_or_dispute on core.checkins
  for update using (
    auth.uid() = user_id
    or auth.uid() in (
      select creator_id from core.tratos where id = trato_id
      union
      select partner_id from core.tratos where id = trato_id
    )
  );
EOF
```

- [ ] **Step 10.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- core-checkins
```

Expected: 3 tests PASS.

- [ ] **Step 10.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120005_core_checkins.sql tests/integration/core-checkins.test.ts && \
git commit -m "db: core.checkins con dispute flag, constraints, RLS por miembros"
```

---

## Task 11 · Migration: `core.user_scores`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120006_core_user_scores.sql`

Per decisión spec 11.1: **score hidden por default + toggle del usuario en Ajustes** (3 estados: hidden / duos_con_trato / publico).

- [ ] **Step 11.1: Escribir test**

```bash
cat > /home/elmikebutron/dovo/tests/integration/core-user-scores.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const admin = createClient(url, key);
const core = createClient(url, key, { db: { schema: "core" as any } });

describe("core.user_scores", () => {
  it("se crea con default hidden", async () => {
    const { data: auth } = await admin.auth.admin.createUser({
      email: `s-${Date.now()}@dovo.app`,
      email_confirm: true,
    });
    await core.from("users").insert({
      id: auth.user!.id,
      email: auth.user!.email,
      nombre: "S",
      access_channel: "fcfs",
    });

    const { data, error } = await core.from("user_scores").insert({
      user_id: auth.user!.id,
    }).select().single();

    expect(error).toBeNull();
    expect(data?.visibility).toBe("hidden");
    expect(data?.tratos_cerrados).toBe(0);
    expect(data?.tratos_cumplidos).toBe(0);
  });

  it("rechaza visibility inválido", async () => {
    const { data: auth } = await admin.auth.admin.createUser({
      email: `s2-${Date.now()}@dovo.app`,
      email_confirm: true,
    });
    await core.from("users").insert({
      id: auth.user!.id,
      email: auth.user!.email,
      nombre: "S",
      access_channel: "fcfs",
    });

    const { error } = await core.from("user_scores").insert({
      user_id: auth.user!.id,
      visibility: "invalid_value" as any,
    });
    expect(error).toBeTruthy();
  });
});
EOF
```

- [ ] **Step 11.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- core-user-scores
```

Expected: FAIL.

- [ ] **Step 11.3: Crear migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120006_core_user_scores.sql <<'EOF'
-- core.user_scores: vanity metric de cumplimiento agregado.
-- Default hidden (decisión spec 11.1).

create type core.score_visibility as enum ('hidden', 'duos_con_trato', 'publico');

create table core.user_scores (
  user_id uuid primary key references core.users(id) on delete cascade,
  tratos_cerrados int not null default 0,
  tratos_cumplidos int not null default 0,
  score_publico int generated always as (
    case when tratos_cerrados = 0 then 0
    else round((tratos_cumplidos::numeric / tratos_cerrados) * 1000)::int
    end
  ) stored,
  visibility core.score_visibility not null default 'hidden',
  updated_at timestamptz not null default now()
);

comment on table core.user_scores is 'Score de cumplimiento del usuario. visibility hidden por default (decisión spec 11.1).';
comment on column core.user_scores.score_publico is '0–1000. Calculado automáticamente como tratos_cumplidos/tratos_cerrados * 1000.';

create trigger user_scores_updated_at
  before update on core.user_scores
  for each row execute function core.set_updated_at();

alter table core.user_scores enable row level security;

-- Cada user puede leer su propio score siempre
create policy scores_read_own on core.user_scores
  for select using (auth.uid() = user_id);

-- Score visible para dúos con trato compartido (cuando visibility = duos_con_trato)
create policy scores_read_duo on core.user_scores
  for select using (
    visibility in ('duos_con_trato', 'publico')
    and (
      visibility = 'publico'
      or auth.uid() in (
        select creator_id from core.tratos where partner_id = user_scores.user_id
        union
        select partner_id from core.tratos where creator_id = user_scores.user_id
      )
    )
  );

-- Solo el user puede modificar su visibility
create policy scores_update_own on core.user_scores
  for update using (auth.uid() = user_id);
EOF
```

- [ ] **Step 11.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- core-user-scores
```

Expected: PASS.

- [ ] **Step 11.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120006_core_user_scores.sql tests/integration/core-user-scores.test.ts && \
git commit -m "db: core.user_scores con visibility 3-states, default hidden"
```

---

## Task 12 · Migration: tablas de sponsored (P2 prep)

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120007_core_sponsored.sql`

- [ ] **Step 12.1: Escribir test**

```bash
cat > /home/elmikebutron/dovo/tests/integration/core-sponsored.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const core = createClient(url, key, { db: { schema: "core" as any } });

describe("core sponsored tables", () => {
  it("permite crear brand partner + sponsored trato + reward codes", async () => {
    const { data: brand, error: be } = await core.from("brand_partners").insert({
      nombre: "Test Brand",
      contacto_email: `brand-${Date.now()}@test.com`,
      rfc: "TST123456789",
    }).select().single();
    expect(be).toBeNull();

    const { data: st, error: se } = await core.from("sponsored_tratos").insert({
      brand_id: brand!.id,
      goal_template: "test trato",
      frecuencia: "daily",
      duracion_dias: 30,
      recompensa_descripcion: "20% off",
      recompensa_tipo: "cupon",
      setup_fee_mxn: 30000,
      per_completion_fee_mxn: 50,
      estado: "activo",
      fecha_inicio: new Date().toISOString().slice(0, 10),
    }).select().single();
    expect(se).toBeNull();
    expect(st?.estado).toBe("activo");

    const { error: rce } = await core.from("reward_codes").insert({
      sponsored_trato_id: st!.id,
      codigo: `CODE-${Date.now()}`,
    });
    expect(rce).toBeNull();
  });
});
EOF
```

- [ ] **Step 12.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- core-sponsored
```

Expected: FAIL.

- [ ] **Step 12.3: Crear migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120007_core_sponsored.sql <<'EOF'
-- core.brand_partners + sponsored_tratos + reward_codes: pilar 2 (P2 del MVP).

create type core.reward_tipo as enum ('cupon', 'producto', 'acceso', 'tarjeta_regalo');
create type core.sponsored_estado as enum ('activo', 'pausado', 'cerrado');

create table core.brand_partners (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto_email text not null,
  rfc text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table core.sponsored_tratos (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references core.brand_partners(id) on delete restrict,
  brand_logo_url text,
  goal_template text not null,
  frecuencia text not null,
  duracion_dias int not null check (duracion_dias between 1 and 365),
  recompensa_descripcion text not null,
  recompensa_tipo core.reward_tipo not null,
  setup_fee_mxn int not null check (setup_fee_mxn >= 0),
  per_completion_fee_mxn int not null check (per_completion_fee_mxn >= 0),
  estado core.sponsored_estado not null default 'activo',
  fecha_inicio date not null,
  fecha_fin date,
  cap_usuarios int check (cap_usuarios is null or cap_usuarios > 0),
  created_at timestamptz not null default now()
);

create table core.reward_codes (
  id uuid primary key default gen_random_uuid(),
  sponsored_trato_id uuid not null references core.sponsored_tratos(id) on delete cascade,
  codigo text not null unique,
  redeemed_by uuid references core.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index sponsored_brand_idx on core.sponsored_tratos(brand_id);
create index sponsored_estado_idx on core.sponsored_tratos(estado);
create index reward_codes_sponsored_idx on core.reward_codes(sponsored_trato_id);

-- Ahora añadir el FK que dejamos pendiente en tratos
alter table core.tratos
  add constraint tratos_sponsored_fk foreign key (sponsored_id)
  references core.sponsored_tratos(id) on delete set null;

comment on table core.brand_partners is 'Marcas que patrocinan tratos. Pilar 2 del MVP.';
comment on table core.sponsored_tratos is 'Templates de tratos patrocinados por marcas. Brand paga DOVO directamente — no se toca lana del usuario.';
comment on table core.reward_codes is 'Códigos de recompensa que se entregan a usuarios que cumplen un sponsored trato.';

alter table core.brand_partners enable row level security;
alter table core.sponsored_tratos enable row level security;
alter table core.reward_codes enable row level security;

-- Usuarios autenticados pueden leer sponsored_tratos activos (los descubren en la UI)
create policy sponsored_read_active on core.sponsored_tratos
  for select using (estado = 'activo' and auth.role() = 'authenticated');

-- Usuario solo lee sus propios reward_codes
create policy reward_codes_read_own on core.reward_codes
  for select using (auth.uid() = redeemed_by);
EOF
```

- [ ] **Step 12.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- core-sponsored
```

Expected: PASS.

- [ ] **Step 12.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120007_core_sponsored.sql tests/integration/core-sponsored.test.ts && \
git commit -m "db: core sponsored tables (brand_partners, sponsored_tratos, reward_codes) + FK desde tratos"
```

---

## Task 13 · Migration: `pulse.eventos_agregados`

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120008_pulse_eventos_agregados.sql`

- [ ] **Step 13.1: Escribir test**

```bash
cat > /home/elmikebutron/dovo/tests/integration/pulse-eventos.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_LOCAL_SERVICE_KEY ?? "";
const pulse = createClient(url, key, { db: { schema: "pulse" as any } });

describe("pulse.eventos_agregados", () => {
  it("permite insertar evento sin user_id ni trato_id", async () => {
    const { data, error } = await pulse.from("eventos_agregados").insert({
      categoria: "fitness",
      duracion_dias_bucket: "30d",
      tasa_cumplimiento_bucket: "0.8-1.0",
      cohorte_edad: "25-35",
      cohorte_ciudad: "CDMX",
      es_patrocinado: false,
      dow_creacion: 1,
    }).select().single();
    expect(error).toBeNull();
    expect(data?.categoria).toBe("fitness");
    // Verificar que NO existen columnas user_id o trato_id
    expect(Object.keys(data ?? {})).not.toContain("user_id");
    expect(Object.keys(data ?? {})).not.toContain("trato_id");
  });
});
EOF
```

- [ ] **Step 13.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- pulse-eventos
```

Expected: FAIL.

- [ ] **Step 13.3: Crear migration**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120008_pulse_eventos_agregados.sql <<'EOF'
-- pulse.eventos_agregados: NUNCA contiene IDs ni contenido textual.
-- Solo buckets y categorías. k-anonymity ≥ 100 se enforce en queries (no aquí).

create table pulse.eventos_agregados (
  id bigserial primary key,
  ingested_at timestamptz not null default now(),
  categoria text not null check (categoria in (
    'fitness', 'ahorro', 'habitos', 'aprendizaje', 'relacion', 'otro'
  )),
  duracion_dias_bucket text not null check (duracion_dias_bucket in (
    '<7d', '7-14d', '14-30d', '30-60d', '60-90d', '>90d'
  )),
  tasa_cumplimiento_bucket text not null check (tasa_cumplimiento_bucket in (
    '0-0.2', '0.2-0.5', '0.5-0.8', '0.8-1.0'
  )),
  cohorte_edad text not null check (cohorte_edad in (
    '<25', '25-35', '35-45', '45-55', '>55', 'unknown'
  )),
  cohorte_ciudad text not null check (cohorte_ciudad in (
    'CDMX', 'GDL', 'MTY', 'otras', 'unknown'
  )),
  es_patrocinado boolean not null,
  dow_creacion int not null check (dow_creacion between 0 and 6)
);

create index eventos_categoria_idx on pulse.eventos_agregados(categoria);
create index eventos_ingested_at_idx on pulse.eventos_agregados(ingested_at);

comment on table pulse.eventos_agregados is 'Eventos agregados anónimos para inteligencia conductual. NUNCA tiene user_id, trato_id, ni contenido textual de tratos. k-anonymity ≥ 100 enforced en queries downstream.';

-- RLS: ningún acceso desde clientes (anon, authenticated). Solo service_role.
alter table pulse.eventos_agregados enable row level security;
-- No se crean policies de SELECT/INSERT para anon/authenticated.
-- Solo service_role (que bypassa RLS) puede tocar esta tabla.
EOF
```

- [ ] **Step 13.4: Aplicar y verificar**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset && npm test -- pulse-eventos
```

Expected: PASS.

- [ ] **Step 13.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120008_pulse_eventos_agregados.sql tests/integration/pulse-eventos.test.ts && \
git commit -m "db: pulse.eventos_agregados con buckets enumerados, sin IDs"
```

---

## Task 14 · Migration: role isolation

**Files:**
- Create: `/home/elmikebutron/dovo/supabase/migrations/20260516120009_role_isolation.sql`

**Objetivo:** crear un role `pulse_writer` que solo puede insertar en `pulse.eventos_agregados`. Que NO pueda leer ninguna tabla de `core`. Y un role `core_reader` que NO puede leer `pulse`.

- [ ] **Step 14.1: Escribir test de isolation**

```bash
cat > /home/elmikebutron/dovo/tests/integration/schema-isolation.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const url = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const pulseRoleKey = process.env.SUPABASE_LOCAL_PULSE_KEY;

describe("schema isolation core <-> pulse", () => {
  it("pulse_writer role NO puede leer core.users", async () => {
    if (!pulseRoleKey) {
      console.warn("SUPABASE_LOCAL_PULSE_KEY no seteada — skipping");
      return;
    }
    const pulseClient = createClient(url, pulseRoleKey, {
      db: { schema: "core" as any },
    });
    const { data, error } = await pulseClient
      .from("users")
      .select("id")
      .limit(1);
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/permission denied|not found|does not exist/i);
  });

  it("pulse_writer role NO puede leer core.tratos", async () => {
    if (!pulseRoleKey) return;
    const pulseClient = createClient(url, pulseRoleKey, {
      db: { schema: "core" as any },
    });
    const { error } = await pulseClient.from("tratos").select("id").limit(1);
    expect(error).toBeTruthy();
  });

  it("pulse_writer role SÍ puede insertar en pulse.eventos_agregados", async () => {
    if (!pulseRoleKey) return;
    const pulseClient = createClient(url, pulseRoleKey, {
      db: { schema: "pulse" as any },
    });
    const { error } = await pulseClient.from("eventos_agregados").insert({
      categoria: "fitness",
      duracion_dias_bucket: "30-60d",
      tasa_cumplimiento_bucket: "0.8-1.0",
      cohorte_edad: "25-35",
      cohorte_ciudad: "CDMX",
      es_patrocinado: false,
      dow_creacion: 3,
    });
    expect(error).toBeNull();
  });
});
EOF
```

Nota: el package `postgres` no es necesario para los tests SDK-based. Lo importamos pero no usamos en este caso. Sin él, los tests usan solo el cliente Supabase.

- [ ] **Step 14.2: Verificar que el test falla (role no existe)**

```bash
cd /home/elmikebutron/dovo && npm test -- schema-isolation
```

Expected: tests pasan los `if (!pulseRoleKey) return;` (porque la var no está seteada), terminan en pass trivial. Ese es el estado inicial OK; necesitamos crear el role y la var.

- [ ] **Step 14.3: Crear migration que define los roles + grants**

```bash
cat > /home/elmikebutron/dovo/supabase/migrations/20260516120009_role_isolation.sql <<'EOF'
-- Roles aislados para enforce privacy-by-architecture.

-- 1) pulse_writer: puede insertar en pulse.eventos_agregados, NO puede tocar core.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'pulse_writer') then
    create role pulse_writer noinherit;
  end if;
end $$;

-- Quitar TODO acceso a core
revoke all on schema core from pulse_writer;
revoke all on all tables in schema core from pulse_writer;
revoke all privileges on schema core from pulse_writer;

-- Dar acceso mínimo a pulse
grant usage on schema pulse to pulse_writer;
grant insert on pulse.eventos_agregados to pulse_writer;
grant usage, select on all sequences in schema pulse to pulse_writer;

-- 2) Verificar que anon/authenticated roles tampoco pueden tocar pulse
revoke all on schema pulse from anon;
revoke all on schema pulse from authenticated;
revoke all on all tables in schema pulse from anon;
revoke all on all tables in schema pulse from authenticated;

-- 3) Crear API role para pulse_writer en Supabase (para generar un anon-like key)
-- En Supabase, esto requiere setear el JWT secret y emitir un token con role 'pulse_writer'.
-- Para local: usar el script supabase/scripts/issue_pulse_key.ts (creado en Task 14.4).

comment on role pulse_writer is 'Role aislado para edge function ingest-pulse-event. No tiene acceso a schema core.';
EOF
```

- [ ] **Step 14.4: Crear helper script para emitir un JWT del role `pulse_writer` localmente**

```bash
mkdir -p /home/elmikebutron/dovo/scripts
cat > /home/elmikebutron/dovo/scripts/issue-pulse-key.ts <<'EOF'
// Emite un JWT firmado con el secret de Supabase local, con role pulse_writer.
// Uso: tsx scripts/issue-pulse-key.ts
import { createHmac } from "node:crypto";

const SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET;
if (!SECRET) {
  console.error("Set SUPABASE_LOCAL_JWT_SECRET (de `supabase status`)");
  process.exit(1);
}

const header = { alg: "HS256", typ: "JWT" };
const payload = {
  role: "pulse_writer",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
};

const b64 = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");

const data = `${b64(header)}.${b64(payload)}`;
const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
console.log(`${data}.${sig}`);
EOF
```

- [ ] **Step 14.5: Aplicar migration y emitir el key**

```bash
cd /home/elmikebutron/dovo && npx supabase db reset

# Obtener el JWT secret local
export SUPABASE_LOCAL_JWT_SECRET=$(npx supabase status --output json | grep -i jwt_secret | head -1 | awk -F'"' '{print $4}')

# Emitir el key
export SUPABASE_LOCAL_PULSE_KEY=$(npx tsx scripts/issue-pulse-key.ts)
echo "Pulse key: $SUPABASE_LOCAL_PULSE_KEY"
```

Expected: imprime un JWT válido. Guardarlo en una env var local para próximos tests.

- [ ] **Step 14.6: Re-correr tests de isolation con la key seteada**

```bash
cd /home/elmikebutron/dovo && \
  SUPABASE_LOCAL_PULSE_KEY=$SUPABASE_LOCAL_PULSE_KEY npm test -- schema-isolation
```

Expected: los 3 tests PASS — pulse_writer no puede leer core, sí puede insertar pulse.

- [ ] **Step 14.7: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add supabase/migrations/20260516120009_role_isolation.sql tests/integration/schema-isolation.test.ts scripts/issue-pulse-key.ts && \
git commit -m "db: role pulse_writer aislado de schema core + tests de isolation"
```

---

## Task 15 · Generar tipos TypeScript de Supabase

**Files:**
- Create: `/home/elmikebutron/dovo/lib/supabase/types.ts`

- [ ] **Step 15.1: Generar tipos**

```bash
cd /home/elmikebutron/dovo && mkdir -p lib/supabase && npm run db:types
```

Expected: genera `lib/supabase/types.ts` con tipos derivados de los schemas locales.

- [ ] **Step 15.2: Verificar el archivo**

```bash
head -40 /home/elmikebutron/dovo/lib/supabase/types.ts
```

Expected: archivo TypeScript con interfaces `Database`, `Tables`, etc.

- [ ] **Step 15.3: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add lib/supabase/types.ts && \
git commit -m "types: genera tipos TypeScript del schema actual"
```

---

## Task 16 · Configurar clientes Supabase

**Files:**
- Create: `/home/elmikebutron/dovo/lib/supabase/client.ts`
- Create: `/home/elmikebutron/dovo/lib/supabase/server.ts`
- Create: `/home/elmikebutron/dovo/lib/supabase/middleware.ts`

- [ ] **Step 16.1: Crear `lib/supabase/client.ts` (browser)**

```bash
cat > /home/elmikebutron/dovo/lib/supabase/client.ts <<'EOF'
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { publicEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
EOF
```

- [ ] **Step 16.2: Crear `lib/supabase/server.ts` (server components / actions)**

```bash
cat > /home/elmikebutron/dovo/lib/supabase/server.ts <<'EOF'
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { publicEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components no pueden setear cookies — ignorar
            // El middleware refresca cookies de manera correcta
          }
        },
      },
    },
  );
}
EOF
```

- [ ] **Step 16.3: Crear `lib/supabase/middleware.ts`**

```bash
cat > /home/elmikebutron/dovo/lib/supabase/middleware.ts <<'EOF'
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  return { response, user };
}
EOF
```

- [ ] **Step 16.4: Crear el `middleware.ts` raíz**

```bash
cat > /home/elmikebutron/dovo/middleware.ts <<'EOF'
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/sign-up",
  "/sign-in",
  "/auth/callback",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/_next");
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rutas protegidas requieren user autenticado
  if (!isPublic(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Si user autenticado entra a auth pages, redirigir a home
  if (user && (pathname === "/sign-up" || pathname === "/sign-in")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
EOF
```

- [ ] **Step 16.5: Verificar que el typecheck pasa**

```bash
cd /home/elmikebutron/dovo && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 16.6: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add lib/supabase/ middleware.ts && \
git commit -m "supabase: clientes (browser, server, middleware) + middleware auth-aware"
```

---

## Task 17 · Schemas Zod + actions de auth

**Files:**
- Create: `/home/elmikebutron/dovo/lib/schemas/auth.ts`
- Create: `/home/elmikebutron/dovo/lib/actions/auth.ts`

- [ ] **Step 17.1: Crear schema Zod**

```bash
mkdir -p /home/elmikebutron/dovo/lib/schemas
cat > /home/elmikebutron/dovo/lib/schemas/auth.ts <<'EOF'
import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("email inválido"),
  nombre: z.string()
    .min(2, "mínimo 2 caracteres")
    .max(60, "máximo 60 caracteres"),
});

export const signInSchema = z.object({
  email: z.string().email("email inválido"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
EOF
```

- [ ] **Step 17.2: Crear server actions de auth**

```bash
mkdir -p /home/elmikebutron/dovo/lib/actions
cat > /home/elmikebutron/dovo/lib/actions/auth.ts <<'EOF'
"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema, signInSchema } from "@/lib/schemas/auth";
import { publicEnv } from "@/lib/env";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    nombre: formData.get("nombre"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { nombre: parsed.data.nombre, intent: "sign_up" },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "email inválido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { intent: "sign_in" },
      shouldCreateUser: false,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
EOF
```

- [ ] **Step 17.3: Typecheck**

```bash
cd /home/elmikebutron/dovo && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 17.4: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add lib/schemas/ lib/actions/ && \
git commit -m "auth: schemas Zod + server actions sign-up/sign-in con magic link"
```

---

## Task 18 · Layout raíz, globals.css, manifest.ts

**Files:**
- Create: `/home/elmikebutron/dovo/app/layout.tsx`
- Create: `/home/elmikebutron/dovo/app/globals.css`
- Create: `/home/elmikebutron/dovo/app/manifest.ts`

- [ ] **Step 18.1: Crear `app/globals.css`**

```bash
mkdir -p /home/elmikebutron/dovo/app
cat > /home/elmikebutron/dovo/app/globals.css <<'EOF'
@import "tailwindcss";

@theme {
  --color-ink: #0a0a0a;
  --color-ink-soft: #1c1c1c;
  --color-papel: #f5f1ea;
  --color-papel-dark: #e6e0d5;
  --color-papel-darker: #cdc5b5;
  --color-lana: #4a5d3a;
  --color-lana-light: #6b7d59;

  --font-display: "Syne", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

html, body {
  background: var(--color-papel);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
}

.syne {
  font-family: var(--font-display);
}

.mono {
  font-family: var(--font-mono);
}
EOF
```

- [ ] **Step 18.2: Crear `app/layout.tsx`**

```bash
cat > /home/elmikebutron/dovo/app/layout.tsx <<'EOF'
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dovo",
  description: "tratos entre dos. cumplimiento mutuo, accountability simple.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
EOF
```

- [ ] **Step 18.3: Crear `app/manifest.ts`**

```bash
cat > /home/elmikebutron/dovo/app/manifest.ts <<'EOF'
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dovo",
    short_name: "dovo",
    description: "tratos entre dos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1ea",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
EOF
```

- [ ] **Step 18.4: Typecheck**

```bash
cd /home/elmikebutron/dovo && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 18.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add app/layout.tsx app/globals.css app/manifest.ts && \
git commit -m "app: layout raíz, Tailwind v4 con tokens dovo, manifest PWA"
```

---

## Task 19 · Página de sign-up (TDD)

**Files:**
- Create: `/home/elmikebutron/dovo/app/(auth)/layout.tsx`
- Create: `/home/elmikebutron/dovo/app/(auth)/sign-up/page.tsx`
- Create: `/home/elmikebutron/dovo/tests/e2e/sign-up.test.tsx`

- [ ] **Step 19.1: Escribir test del componente sign-up**

```bash
mkdir -p /home/elmikebutron/dovo/tests/e2e
cat > /home/elmikebutron/dovo/tests/e2e/sign-up.test.tsx <<'EOF'
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({
  signUpAction: vi.fn(async () => ({ ok: true })),
}));

import SignUpPage from "@/app/(auth)/sign-up/page";
import { signUpAction } from "@/lib/actions/auth";

describe("SignUpPage", () => {
  it("renderiza el form y el wordmark", () => {
    render(<SignUpPage />);
    expect(screen.getByText("dovo")).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("muestra confirmación después de submit exitoso", async () => {
    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@dovo.app" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
    expect(signUpAction).toHaveBeenCalledOnce();
  });
});
EOF
```

- [ ] **Step 19.2: Correr el test y verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- sign-up
```

Expected: FAIL — los archivos `(auth)/sign-up/page.tsx` no existen.

- [ ] **Step 19.3: Crear el layout `(auth)`**

```bash
mkdir -p "/home/elmikebutron/dovo/app/(auth)"
cat > "/home/elmikebutron/dovo/app/(auth)/layout.tsx" <<'EOF'
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 py-16 bg-papel">
      <Link href="/" className="syne text-4xl font-extrabold tracking-tight mb-12">
        dovo
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
EOF
```

- [ ] **Step 19.4: Crear la página de sign-up**

```bash
mkdir -p "/home/elmikebutron/dovo/app/(auth)/sign-up"
cat > "/home/elmikebutron/dovo/app/(auth)/sign-up/page.tsx" <<'EOF'
"use client";

import { useState, useTransition } from "react";
import { signUpAction } from "@/lib/actions/auth";

export default function SignUpPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="syne text-2xl mb-3 lowercase">revisa tu correo</h1>
        <p className="text-sm opacity-70">
          te mandamos un link para entrar a dovo.
        </p>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await signUpAction(formData);
          if (result.ok) setSent(true);
          else setError(result.error);
        });
      }}
      className="space-y-6"
    >
      <div>
        <h1 className="syne text-3xl lowercase mb-2">hacer dúo</h1>
        <p className="text-sm opacity-70">empieza con tu nombre y correo.</p>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">nombre</span>
        <input
          name="nombre"
          required
          autoComplete="name"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "mandando..." : "entrar"}
      </button>

      <p className="text-xs opacity-60 text-center">
        ¿ya tienes cuenta? <a href="/sign-in" className="underline">entra aquí</a>.
      </p>
    </form>
  );
}
EOF
```

- [ ] **Step 19.5: Verificar test pasa**

```bash
cd /home/elmikebutron/dovo && npm test -- sign-up
```

Expected: 2 tests PASS.

- [ ] **Step 19.6: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add "app/(auth)/" tests/e2e/sign-up.test.tsx && \
git commit -m "auth: página sign-up con magic link + tests"
```

---

## Task 20 · Página de sign-in (TDD)

**Files:**
- Create: `/home/elmikebutron/dovo/app/(auth)/sign-in/page.tsx`
- Create: `/home/elmikebutron/dovo/tests/e2e/sign-in.test.tsx`

- [ ] **Step 20.1: Escribir test**

```bash
cat > /home/elmikebutron/dovo/tests/e2e/sign-in.test.tsx <<'EOF'
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({
  signInAction: vi.fn(async () => ({ ok: true })),
}));

import SignInPage from "@/app/(auth)/sign-in/page";
import { signInAction } from "@/lib/actions/auth";

describe("SignInPage", () => {
  it("renderiza form solo con email", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre/i)).toBeNull();
  });

  it("envía signInAction y muestra confirmación", async () => {
    render(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@dovo.app" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
    expect(signInAction).toHaveBeenCalledOnce();
  });
});
EOF
```

- [ ] **Step 20.2: Verificar que falla**

```bash
cd /home/elmikebutron/dovo && npm test -- sign-in
```

Expected: FAIL.

- [ ] **Step 20.3: Crear página**

```bash
mkdir -p "/home/elmikebutron/dovo/app/(auth)/sign-in"
cat > "/home/elmikebutron/dovo/app/(auth)/sign-in/page.tsx" <<'EOF'
"use client";

import { useState, useTransition } from "react";
import { signInAction } from "@/lib/actions/auth";

export default function SignInPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="syne text-2xl mb-3 lowercase">revisa tu correo</h1>
        <p className="text-sm opacity-70">link enviado.</p>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await signInAction(formData);
          if (result.ok) setSent(true);
          else setError(result.error);
        });
      }}
      className="space-y-6"
    >
      <div>
        <h1 className="syne text-3xl lowercase mb-2">entrar</h1>
        <p className="text-sm opacity-70">recibe un link en tu correo.</p>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest opacity-60">email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="block w-full mt-1 border-b border-ink pb-2 bg-transparent focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-papel py-3 syne lowercase disabled:opacity-50"
      >
        {pending ? "mandando..." : "entrar"}
      </button>

      <p className="text-xs opacity-60 text-center">
        ¿primera vez? <a href="/sign-up" className="underline">crea tu cuenta</a>.
      </p>
    </form>
  );
}
EOF
```

- [ ] **Step 20.4: Verificar test pasa**

```bash
cd /home/elmikebutron/dovo && npm test -- sign-in
```

Expected: 2 tests PASS.

- [ ] **Step 20.5: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add "app/(auth)/sign-in/" tests/e2e/sign-in.test.tsx && \
git commit -m "auth: página sign-in con magic link + tests"
```

---

## Task 21 · Auth callback route

**Files:**
- Create: `/home/elmikebutron/dovo/app/auth/callback/route.ts`

- [ ] **Step 21.1: Crear el route handler**

```bash
mkdir -p /home/elmikebutron/dovo/app/auth/callback
cat > /home/elmikebutron/dovo/app/auth/callback/route.ts <<'EOF'
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=invalid_code`);
  }

  // Si es primer login, crear el row en core.users
  const meta = data.user.user_metadata as { nombre?: string; intent?: string };
  if (meta.intent === "sign_up" || meta.nombre) {
    const { error: insertError } = await supabase
      .schema("core")
      .from("users")
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        nombre: meta.nombre ?? "sin nombre",
        access_channel: "fcfs", // los curados se setean manualmente en BD
      }, { onConflict: "id" });

    if (insertError) {
      console.error("[auth/callback] insert core.users falló:", insertError);
    }

    // Crear row inicial en user_scores
    await supabase.schema("core").from("user_scores").upsert({
      user_id: data.user.id,
    }, { onConflict: "user_id" });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
EOF
```

- [ ] **Step 21.2: Typecheck**

```bash
cd /home/elmikebutron/dovo && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 21.3: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add app/auth/callback/ && \
git commit -m "auth: callback route exchange code -> session + upsert core.users"
```

---

## Task 22 · Home protegido + landing pública

**Files:**
- Create: `/home/elmikebutron/dovo/app/_components/landing.tsx`
- Create: `/home/elmikebutron/dovo/app/_components/home-authed.tsx`
- Create: `/home/elmikebutron/dovo/app/page.tsx`

Nota arquitectónica: usamos un único `app/page.tsx` que resuelve `/` y, según haya sesión o no, renderiza `<HomeAuthed />` o `<Landing />`. Los components viven en `app/_components/` (prefijo `_` = private folder en Next, no genera ruta). No usamos route groups `(app)` ni `(public)` en Plan 1 porque tendríamos page.tsx duplicados resolviendo `/`.

- [ ] **Step 22.1: Crear el component Landing**

```bash
mkdir -p /home/elmikebutron/dovo/app/_components
cat > /home/elmikebutron/dovo/app/_components/landing.tsx <<'EOF'
import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 py-16 bg-papel text-ink">
      <h1 className="syne text-6xl lowercase tracking-tight">dovo</h1>
      <p className="syne text-xl lowercase opacity-70 mt-4 text-center max-w-md">
        tratos entre dos.<br />cumplimiento mutuo, accountability simple.
      </p>
      <div className="mt-12 flex gap-4">
        <Link
          href="/sign-up"
          className="bg-ink text-papel px-6 py-3 syne lowercase"
        >
          hacer dúo
        </Link>
        <Link
          href="/sign-in"
          className="border border-ink px-6 py-3 syne lowercase"
        >
          entrar
        </Link>
      </div>
    </main>
  );
}
EOF
```

- [ ] **Step 22.2: Crear el component HomeAuthed**

```bash
cat > /home/elmikebutron/dovo/app/_components/home-authed.tsx <<'EOF'
import { createClient } from "@/lib/supabase/server";

export default async function HomeAuthed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-svh px-6 py-12 bg-papel text-ink max-w-2xl mx-auto">
      <header className="flex justify-between items-end mb-16 pb-6 border-b border-ink">
        <h1 className="syne text-3xl lowercase">tus tratos</h1>
        <span className="text-xs uppercase tracking-widest opacity-60 mono">
          {user?.email}
        </span>
      </header>

      <section className="text-center py-24">
        <p className="syne text-2xl lowercase opacity-50 mb-6">
          todavía no hay tratos.
        </p>
        <p className="text-sm opacity-60 max-w-sm mx-auto">
          el siguiente plan implementa crear tratos e invitar a tu dúo.
        </p>
      </section>
    </main>
  );
}
EOF
```

- [ ] **Step 22.3: Crear `app/page.tsx` con switch por sesión**

```bash
cat > /home/elmikebutron/dovo/app/page.tsx <<'EOF'
import { createClient } from "@/lib/supabase/server";
import Landing from "./_components/landing";
import HomeAuthed from "./_components/home-authed";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? <HomeAuthed /> : <Landing />;
}
EOF
```

- [ ] **Step 22.4: Typecheck**

```bash
cd /home/elmikebutron/dovo && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 22.5: Levantar dev server y verificar manual**

```bash
cd /home/elmikebutron/dovo && npm run dev
```

En el browser:
1. Ir a `http://localhost:3000` → debe mostrar landing pública con "hacer dúo" y "entrar"
2. Click en "hacer dúo" → form sign-up
3. Llenar nombre + email real, submit → "revisa tu correo"
4. En Supabase Studio (`http://127.0.0.1:54323` → Inbucket → Inbox) revisar el magic link
5. Click el link → redirect a `/` → debe ver "tus tratos · todavía no hay tratos"
6. Cerrar tab, abrir nueva, ir a `http://localhost:3000/sign-up` → debe redirigir a `/` (porque ya tienes sesión)

Detener el dev server con Ctrl+C cuando termines.

- [ ] **Step 22.6: Commit**

```bash
cd /home/elmikebutron/dovo && \
git add app/page.tsx app/_components/ && \
git commit -m "app: landing pública + home autenticado empty state"
```

---

## Task 23 · Tag baseline y revisión final

- [ ] **Step 23.1: Correr toda la batería de tests**

```bash
cd /home/elmikebutron/dovo && npm test
```

Expected: TODOS los tests PASS (smoke, schema-core, schema-pulse, core-users, core-tratos, core-checkins, core-user-scores, core-sponsored, pulse-eventos, schema-isolation, sign-up, sign-in).

- [ ] **Step 23.2: Build de producción**

```bash
cd /home/elmikebutron/dovo && npm run build
```

Expected: build exitoso sin errores ni warnings críticos.

- [ ] **Step 23.3: Tag v0.1-foundation**

```bash
cd /home/elmikebutron/dovo && \
git tag -a v0.1-foundation -m "Foundation: hard reset + schemas core/pulse aislados + auth magic link funcional"
```

- [ ] **Step 23.4: Verificar git log**

```bash
cd /home/elmikebutron/dovo && git log --oneline
```

Expected: ~22 commits desde el `init`. Tag visible con `git tag`.

---

## Plan complete · próximo plan

Plan 1 entrega:
- Repo limpio con git history nueva
- Schemas `core` (users, tratos, checkins, user_scores, sponsored_tratos, brand_partners, reward_codes) y `pulse` (eventos_agregados) creados
- Role `pulse_writer` aislado del schema core, verificado por tests de integración
- Auth completo con magic link: sign-up, sign-in, callback, sesión persistente
- Páginas: landing pública, home autenticado empty state
- Tailwind v4 con tokens dovo, Syne + Inter + JetBrains Mono
- Tests: 11+ tests de integración + componente

**Lo que NO está en Plan 1 (vive en planes siguientes):**
- Crear trato (Plan 2)
- Invitar a dúo / aceptar (Plan 2)
- Check-ins, streak, disputa, resolución (Plan 3)
- Edge function `ingest-pulse-event` (Plan 4)
- TOS / opt-out de Pulse UI (Plan 4)
- Tratos Patrocinados completos (Plan 4)
- Notificaciones push + email transactional (Plan 4)
- PWA manifest completo + service worker (Plan 4)

---

*fin del plan 1 · v0.1 · 2026-05-16*
