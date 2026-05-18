# dovo MVP — Plan 2 · Creación de tratos + invitación al dúo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar el flow completo de un trato: creator escribe los términos → invita al partner por link único → partner acepta → trato pasa a `activo`. Incluye listado de tratos en home.

**Pre-req:** Plan 1 completado (auth funcional, schemas core+pulse aplicados, tu user en `core.users`).

**Result al cerrar este plan:** dos usuarios pueden formar un dúo y crear su primer trato. El trato queda `activo` listo para check-ins (que vienen en Plan 3).

---

## Spec source

Este plan implementa las **Pantallas 03 (Crear trato) + 04 (Invitar a dúo)** del spec `docs/specs/2026-05-16-mvp-tratos-pulse-design.md` sección 3.2 user flow pasos 2–4.

Check-ins, streak visible, resolución, score público viven en Plan 3.

---

## Architectural decisión clave · cómo invitar al partner

**Problema:** El schema actual `core.tratos.partner_id NOT NULL references core.users(id)` exige que el partner exista ANTES de crear el trato. Pero el spec dice "La otra persona acepta y se crea cuenta si no la tiene" — UX requiere que el partner pueda ser invitado por email aunque no tenga cuenta.

**Decisión:** Alterar `core.tratos` para soportar invitaciones pendientes:

```sql
-- partner_id ahora es nullable (se llena al aceptar)
alter table core.tratos alter column partner_id drop not null;

-- email del invitado al momento de crear
alter table core.tratos add column partner_email text not null;

-- token único compartible en link
alter table core.tratos add column invite_token text unique not null;
alter table core.tratos add column invite_expires_at timestamptz not null;
```

**Estados del trato bajo este modelo:**
- `pendiente_aceptacion`: partner_id NULL, partner_email seteado, invite_token activo
- `activo`: partner_id seteado (= user_id del que aceptó), invite_token consumido (no hace falta limpiar — la fila no se usa más)
- `cerrado`: post-resolución (Plan 3)
- `disputado`: post-resolución con disputa (Plan 3)

**Lifetime del invite_token:** 7 días por default. Si expira, creator puede regenerar (lo abrimos en Plan 2.5 si llega esa fricción).

**Alternativas consideradas:**
- Tabla separada `core.invites`: más limpio teóricamente pero ata más complejidad de joins. Rechazado por YAGNI.
- Crear placeholder user en auth.users via admin API: requiere service_role en cliente, peor security posture. Rechazado.

---

## File structure final

```
~/dovo/
├── supabase/migrations/
│   └── 20260518120001_tratos_invitation.sql      [crear]
├── lib/
│   ├── schemas/
│   │   └── trato.ts                              [crear — Zod create/accept]
│   └── actions/
│       └── tratos.ts                             [crear — createTrato, acceptTrato]
├── app/
│   ├── _components/
│   │   ├── home-authed.tsx                       [modify — listar tratos]
│   │   └── trato-card.tsx                        [crear]
│   ├── (app)/                                    [crear route group]
│   │   ├── layout.tsx                            [crear — require auth]
│   │   └── trato/
│   │       ├── new/page.tsx                      [crear — wizard 3 pasos]
│   │       └── [id]/
│   │           └── page.tsx                      [crear — vista del trato]
│   └── invite/
│       └── [token]/
│           ├── page.tsx                          [crear — accept flow]
│           └── actions.ts                        [crear — server action accept]
└── tests/integration/
    └── tratos-flow.test.ts                       [crear]
```

**Nota arquitectónica:** `/invite/[token]` vive FUERA del route group `(app)` porque debe ser accesible sin auth previa (el partner puede no tener cuenta todavía). El middleware lo trata como público.

---

## Tasks

### Task 1 · Migration: alter core.tratos para invitaciones

**Files:**
- Create: `supabase/migrations/20260518120001_tratos_invitation.sql`

**SQL:**

```sql
-- Permitir partner_id NULL hasta que aceptan
alter table core.tratos alter column partner_id drop not null;

-- Email del invitado (siempre seteado al crear)
alter table core.tratos
  add column partner_email text not null
  check (length(partner_email) between 3 and 255);

-- Token único para el link de invitación
alter table core.tratos
  add column invite_token text not null
  default replace(gen_random_uuid()::text, '-', '');

create unique index tratos_invite_token_idx on core.tratos(invite_token);

alter table core.tratos
  add column invite_expires_at timestamptz not null
  default (now() + interval '7 days');

-- Actualizar el constraint creator_ne_partner para tolerar partner_id null
alter table core.tratos drop constraint creator_ne_partner;
alter table core.tratos
  add constraint creator_ne_partner
  check (partner_id is null or creator_id != partner_id);

-- Constraint: si partner_id seteado, partner_email debe coincidir
-- (validación opcional, se hace en server action; SQL no puede hacer join)

comment on column core.tratos.partner_email is 'Email del invitado al crear el trato. Identifica al partner antes de que tenga partner_id.';
comment on column core.tratos.invite_token is 'Token único en el link /invite/[token]. Se consume al aceptar (no se nullifica, solo state cambia).';
comment on column core.tratos.invite_expires_at is 'Cuándo expira el invite (default 7 días). Después de esto el accept rechaza.';

-- RLS update: el partner_email también puede leer su trato pendiente
-- (vía el token, no via partner_id que es null)
drop policy tratos_read_member on core.tratos;
create policy tratos_read_member on core.tratos
  for select using (
    auth.uid() = creator_id
    or auth.uid() = partner_id
    or partner_email = (select email from core.users where id = auth.uid())
  );

-- Policy de update: el invitado puede aceptar (set partner_id = su id)
drop policy tratos_update_member on core.tratos;
create policy tratos_update_member on core.tratos
  for update using (
    auth.uid() = creator_id
    or auth.uid() = partner_id
    or (
      partner_id is null
      and partner_email = (select email from core.users where id = auth.uid())
    )
  );
```

**Verify:**
```sql
\d+ core.tratos
-- partner_id should be nullable, partner_email + invite_token + invite_expires_at present
```

**Commit:**
```
db: alter core.tratos para invitations (partner_id nullable + invite_token)
```

---

### Task 2 · Zod schemas + server actions

**Files:**
- Create: `lib/schemas/trato.ts`
- Create: `lib/actions/tratos.ts`

**lib/schemas/trato.ts:**

```typescript
import { z } from "zod";

export const FRECUENCIAS = [
  { value: "daily", label: "Cada día" },
  { value: "weekdays", label: "Lunes a viernes" },
  { value: "3x_per_week", label: "3 veces por semana" },
  { value: "weekly", label: "1 vez por semana" },
] as const;

export const FRECUENCIA_VALUES = FRECUENCIAS.map((f) => f.value) as readonly string[];

export const createTratoSchema = z.object({
  goal: z.string().min(3, "mínimo 3 caracteres").max(500),
  frecuencia: z.enum(FRECUENCIA_VALUES),
  duracion_dias: z.number().int().min(1).max(365),
  recompensa_text: z.string().min(1).max(500),
  castigo_text: z.string().min(1).max(500),
  partner_email: z.string().email("email inválido"),
});

export type CreateTratoInput = z.infer<typeof createTratoSchema>;

export const acceptTratoSchema = z.object({
  token: z.string().min(10),
});

export type AcceptTratoInput = z.infer<typeof acceptTratoSchema>;
```

**lib/actions/tratos.ts:**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTratoSchema, acceptTratoSchema } from "@/lib/schemas/trato";

type Result<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createTrato(formData: FormData): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  const parsed = createTratoSchema.safeParse({
    goal: formData.get("goal"),
    frecuencia: formData.get("frecuencia"),
    duracion_dias: Number(formData.get("duracion_dias")),
    recompensa_text: formData.get("recompensa_text"),
    castigo_text: formData.get("castigo_text"),
    partner_email: formData.get("partner_email"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "datos inválidos" };
  }

  // No invitarse a uno mismo
  const { data: meRow } = await supabase
    .schema("core").from("users")
    .select("email").eq("id", user.id).single();
  if (meRow?.email?.toLowerCase() === parsed.data.partner_email.toLowerCase()) {
    return { ok: false, error: "no puedes invitarte a ti mismo" };
  }

  // Si el partner_email YA existe en core.users, usamos su id directo
  const { data: partnerRow } = await supabase
    .schema("core").from("users")
    .select("id").eq("email", parsed.data.partner_email).maybeSingle();

  const insert = {
    creator_id: user.id,
    partner_id: partnerRow?.id ?? null,
    partner_email: parsed.data.partner_email,
    goal: parsed.data.goal,
    frecuencia: parsed.data.frecuencia,
    duracion_dias: parsed.data.duracion_dias,
    recompensa_text: parsed.data.recompensa_text,
    castigo_text: parsed.data.castigo_text,
  };

  const { data: row, error } = await supabase
    .schema("core").from("tratos")
    .insert(insert)
    .select("id")
    .single();

  if (error || !row) return { ok: false, error: error?.message ?? "error al crear trato" };

  revalidatePath("/");
  return { ok: true, data: { id: row.id } };
}

export async function acceptTrato(token: string): Promise<Result<{ trato_id: string }>> {
  const parsed = acceptTratoSchema.safeParse({ token });
  if (!parsed.success) return { ok: false, error: "token inválido" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sin sesión" };

  // Lookup trato by token
  const { data: trato, error: lookupErr } = await supabase
    .schema("core").from("tratos")
    .select("id, creator_id, partner_id, partner_email, invite_expires_at, estado")
    .eq("invite_token", parsed.data.token)
    .single();

  if (lookupErr || !trato) return { ok: false, error: "invite no existe" };
  if (trato.estado !== "pendiente_aceptacion") return { ok: false, error: "trato ya no está pendiente" };
  if (new Date(trato.invite_expires_at as string) < new Date()) {
    return { ok: false, error: "invite expirado" };
  }
  if (trato.creator_id === user.id) {
    return { ok: false, error: "no puedes aceptar tu propio trato" };
  }

  // Verificar que el email del user actual matchea partner_email
  const { data: meRow } = await supabase
    .schema("core").from("users")
    .select("email").eq("id", user.id).single();
  if (meRow?.email?.toLowerCase() !== (trato.partner_email as string).toLowerCase()) {
    return { ok: false, error: "este invite no es para tu correo" };
  }

  // Update partner_id + estado
  const { error: updErr } = await supabase
    .schema("core").from("tratos")
    .update({
      partner_id: user.id,
      estado: "activo",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", trato.id);

  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath("/");
  revalidatePath(`/trato/${trato.id}`);
  return { ok: true, data: { trato_id: trato.id as string } };
}
```

**Commit:**
```
auth: schemas Zod + server actions createTrato + acceptTrato
```

---

### Task 3 · Página /trato/new (wizard 3 pasos)

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/trato/new/page.tsx`
- Create: `app/(app)/trato/new/Wizard.tsx`

**app/(app)/layout.tsx:**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return <>{children}</>;
}
```

**app/(app)/trato/new/page.tsx:**

```tsx
import Wizard from "./Wizard";

export default function NewTratoPage() {
  return (
    <main className="min-h-svh max-w-2xl mx-auto px-6 py-12 bg-papel text-ink">
      <header className="mb-12">
        <h1 className="syne text-4xl lowercase">hacer un trato</h1>
        <p className="text-sm opacity-60 mt-2">tres pasos. después se manda al otro.</p>
      </header>
      <Wizard />
    </main>
  );
}
```

**app/(app)/trato/new/Wizard.tsx:** ~150 líneas con 3 steps. Step 1: goal + frecuencia + duracion. Step 2: recompensa + castigo. Step 3: partner_email + summary. Submit final → llama `createTrato` action → redirect a `/trato/{id}`.

**Tests:**
- Render del step 1
- Validación de cada step
- Submit final llama action

**Commit:**
```
trato: página /trato/new con wizard de 3 pasos
```

---

### Task 4 · Página /trato/[id] (vista del trato)

**Files:**
- Create: `app/(app)/trato/[id]/page.tsx`
- Create: `app/(app)/trato/[id]/InviteLink.tsx`

**Lógica per role:**
- Creator + pendiente_aceptacion → muestra invite link + copy button + estado "esperando a [partner_email]"
- Creator + activo → muestra trato data + placeholder "check-ins llegan en Plan 3"
- Partner + activo → mismo placeholder
- Anyone + cerrado/disputado → estado final + resultado

**Commit:**
```
trato: página /trato/[id] con vista per role (creator/partner) + InviteLink component
```

---

### Task 5 · Página /invite/[token] (accept flow)

**Files:**
- Create: `app/invite/[token]/page.tsx`
- Create: `app/invite/[token]/AcceptButton.tsx`

**Middleware update:** agregar `/invite/[token]` a PUBLIC_PATHS o usar regex en isPublic.

**Lógica:**
1. Server-side, lookup trato by token
2. Si no existe / expirado → render error page
3. Si user no autenticado → render "Sign up para aceptar este trato" con link a `/sign-up?invite=<token>` (sign-up redirige a `/invite/<token>` post-callback)
4. Si user autenticado pero email NO matchea partner_email → render "este invite es para [partner_email], tú eres [user.email]"
5. Si user autenticado + email matchea → render trato summary + botones "Aceptar / Rechazar"

**Sign-up con `?invite=<token>` query**: el callback handler debe respetar el `next` param. Modificar `sign-up/page.tsx` para pasar `?next=/invite/<token>` al action.

**Commit:**
```
trato: página pública /invite/[token] con accept flow para partner invitado
```

---

### Task 6 · Update HomeAuthed para listar tratos

**Files:**
- Modify: `app/_components/home-authed.tsx`
- Create: `app/_components/trato-card.tsx`

**Query:**
```typescript
const { data: tratos } = await supabase
  .schema("core").from("tratos")
  .select("id, goal, estado, partner_email, created_at, duracion_dias")
  .or(`creator_id.eq.${user.id},partner_id.eq.${user.id}`)
  .order("created_at", { ascending: false });
```

**Render:**
- Si tratos.length === 0: empty state actual ("todavía no hay tratos") + botón "hacer un trato →" a `/trato/new`
- Si tratos.length > 0: lista de TratoCards + botón "+" para nuevo

**Commit:**
```
home: listar tratos del user + CTA a /trato/new
```

---

### Task 7 · Tests de integración

**Files:**
- Create: `tests/integration/tratos-flow.test.ts`

**Cubre:**
- createTrato action: con partner que existe vs no existe
- createTrato rechaza si partner_email == creator email
- acceptTrato: token válido, email match, state cambia a activo
- acceptTrato rechaza si token expirado / email no match / ya aceptado

**Commit:**
```
tests: tratos-flow integration (createTrato + acceptTrato + edge cases)
```

---

### Task 8 · Build verify + tag v0.2-tratos

```bash
npm test
npm run build
git tag -a v0.2-tratos -m "Tratos creation + invitation flow funcional"
git push origin main --tags
```

---

## Lo que NO está en Plan 2

(Para planes siguientes)

- **Check-ins / streak / cumplimiento diario** → Plan 3
- **Resolución del trato + score público** → Plan 3
- **Tratos Patrocinados** (sponsored) → Plan 4
- **Edge function de Pulse** → Plan 4
- **Email transactional vía Resend** (acuse de creación, invitación enviada) → Plan 4
- **WhatsApp nudges para recordar el invite pendiente** → Plan 4 si retention bajo

---

## Métricas para validar Plan 2

```
Adopción local (tú + andy o quien sea):
  · Tú creas 1 trato y se lo mandas al partner: SÍ / NO
  · Partner abre el link y lo acepta: SÍ / NO
  · Ambos ven el trato en su /: SÍ / NO

Adopción de los primeros 10 users:
  · % que crea su primer trato: target ≥ 60%
  · % de invites que se aceptan en 7 días: target ≥ 40%
  · Tiempo promedio creator → partner accept: target ≤ 48h
```

---

## Open questions

1. **¿Trato puede tener múltiples invites?** Por ahora NO (1 trato = 1 token). Si invite expira, creator regenera token (Plan 2.5).
2. **¿Partner puede negociar términos?** NO en Plan 2. Solo aceptar / rechazar. Negociación es Plan 5.
3. **¿Notificación al partner cuando creator crea trato?** No automática. El creator manda link manual por WhatsApp/iMessage. Email automático llega en Plan 4.

---

*Plan 2 · v0.1 · 2026-05-18*
