# BUILD BRIEF — dovo Fase B+C + demo + inversionista

> Fuente de verdad única para construir. Sintetiza 6 reportes de asesores, resuelve conflictos contra **código real verificado** (no memoria). Stack: Next.js 15 App Router, Supabase schema `core`, next-intl (es default + en), Tailwind v4, paleta Ultraviolet.
>
> **Hallazgo que corrige el brief y a los asesores:** el repo `dovo/` **SÍ existe en disco** en `//wsl.localhost/ubuntu/home/elmikebutron/dovo` (Reporter 6 afirmó que no — estaba equivocado; su análisis de prod sigue siendo válido). Todo el grounding de código de abajo es de archivos leídos, no inferido.

---

## CONFLICTOS RESUELTOS (decisiones del Jefe de Gabinete)

| # | Conflicto entre asesores | Resolución | Por qué |
|---|---|---|---|
| C1 | **Boost: R1 = +50% no-afecta-leaderboard / R4 = +10–15% / R3 = `x2` afecta stats** | **Boost "Energía" = +50% (factor 1.5) a puntos y stats del próximo check-in del receptor. Cuenta para stats/XP (personaje), NO para leaderboard ni retos (esos suman puntaje crudo).** Segundo tipo "Escudo" protege la racha. | R3 implementó `x2` que contamina el ranking competitivo (trampa cooperativa). R1 tiene la razón conceptual; pero su "+50% no cuenta para stats" es inconsistente. Resolución: +50% **sí** infla el personaje (es esfuerzo amplificado, sabor RPG) pero el leaderboard/retos leen `puntos_base` sin boost. Requiere separar columnas (ver C5). |
| C2 | **Nombres de clase: R5 = "El Tronco/El Crack" (español) / R4 = inglés** | **Inglés.** `lib/leveling/constants.ts` define `The Titan/The Marathoner/The Acrobat/The Sprinter/The Anchor/The Phoenix/The Athlete/The Pentathlete/The Apex` + dúo `The Dancer`. Tiers `Rookie/Apprentice/Athlete/Expert/Master/Legend`. | Verificado leyendo el archivo. R5 estaba equivocado. El seed NO controla nombres (son deterministas); el deck en español puede mostrar la clase en inglés como nombre propio o traducir solo en UI. No tocar `constants.ts`. |
| C3 | **Agregación grupo: R1 = promedio per-cápita / R3 = promedio (`/n_miembros`)** | **Promedio per-miembro (`total_puntos / n_miembros`).** Coinciden de facto. Para N>2 con free-riders, el denominador cuenta a todos los miembros activos del trato. | Ambos llegaron a lo mismo. Mantiene justo dúo (N=2) vs trío (#10). Leaderboard default filtra `tipo_grupo='pareja'`. |
| C4 | **Cuenta demo: R2 = `demo@dovofit.com` cuenta nueva / R4 = duo #5 Híbridos (`demo+ivan@`)** | **Duo #5 Híbridos, login `demo+ivan@dovofit.com` / `dovodemo2026`.** | R4 tiene el mejor argumento: media tabla = aspiración arriba + validación abajo, multidisciplina, racha viva, reto activo + boost recibido. Pre-confirmada vía service role (`email_confirm:true`). |
| C5 | **Boost en write (R3) vs los caps anti-trampa (R1)** | **Boost en write, PERO con columna `checkins.puntos_base` separada de `checkins.puntos`.** Caps de R1 aplicados en `apply_checkin` ANTES del boost. | `apply_checkin` ya calcula en TS y pasa resuelto (verificado). Guardar base + boosteado mantiene leaderboard/retos inmutables (suman `puntos_base`) y el personaje refleja boost (suma `puntos`/deltas boosteados). Resuelve C1 limpiamente. |
| C6 | **Verificación retos: R1 = confirm del partner + foto / R3 = sin verificación extra** | **Fase B: solo caps. Fase C: opt-in "ranked" exige confirm. Default retos = sin fricción.** | Con $0 en juego y 0 usuarios, fricción mata adopción. Caps suficientes. Confirm del partner solo en duelos marcados ranked (futuro). |
| C7 | **`is_demo` escribible por miembros (R3 lo marcó como riesgo)** | **`is_demo` solo service_role.** Trigger que bloquea cambio de `is_demo` desde `authenticated`. | Cierra la única fuga real de PII del showcase (R6 #4). Obligatorio. |

---

## 1 · DECISIONES DE PRODUCTO (final, con números)

**Unidad competitiva**
- Ranking por **promedio de puntos por miembro**: `score = total_puntos_base / n_miembros_activos`.
- Leaderboard default = solo `tipo_grupo='pareja'`. Grupos `pequeno`/`grande` en tab separado (fase posterior).
- Free-rider: miembro sin compliance esa semana aporta 0 al numerador pero **suma al denominador** (penaliza cargar peso muerto). Reusa `compliance_miembro`.

**Periodo**
- **Default SEMANAL** (latido del producto, alineado a `cerrar_semana_rachas`, semana ISO lunes-domingo). Tab "mes" como temporada. Estado en URL searchparam `?p=semana|mes`.

**Mecánica de retos (Fase C, duo-vs-duo)**
- Duelo de **7 días** (1 ciclo de compliance), métrica = **suma de `puntos_base`** de cada dúo en la ventana.
- Estados: `propuesto → aceptado → activo → cerrado` (+ `rechazado`). Aceptar en **≤48 h** o expira.
- **1 reto activo por par de dúos** a la vez (unique index sobre par normalizado).
- Empate (diferencia exacta) → sin ganador, ambos conservan racha (regla de oro).
- **Premio = estatus, NO poder**: récord W-L persistente + sello en home. Cero XP/stats por ganar (no contaminar el personaje).

**Mecánica de boosts (intra-duo, solo positivo)**
- Boost **"Energía"** (tipo `energia`): **+50% (factor 1.5)** a puntos y stats del próximo check-in del receptor. Afecta personaje; NO leaderboard/retos.
- Boost **"Escudo"** (tipo `escudo`): protege la `trato_streak` si el receptor falla compliance esa semana, 1 vez.
- Límite: **1 enviado por miembro / semana**, cooldown 7 días, gratis. Desbloqueo a **racha de dúo ≥ 2 semanas** (Investment/Hooked).
- Garantía DB: ambos efectos estrictamente no-negativos para el receptor; emisor y receptor deben compartir `trato_id` y ser distintos.

**Anti-trampa / caps** (constantes en `lib/scoring/constants.ts`, aplicados en `apply_checkin` ANTES del boost):
- `CAP_PUNTOS_SESION = 1000`
- `CAP_PUNTOS_DIA = 1800`
- `CAP_DURACION_MIN = 180`
- `CAP_CHECKINS_ACTIVIDAD_DIA = 3`
- `BOOST_FACTOR = 1.5`, `BOOST_GATING_RACHAS = 2`
- `RETO_DURACION_DIAS = 7`, `RETO_ACEPTAR_HORAS = 48`

**Verificación por fase**
- Fase B (leaderboard): **solo caps**, cero verificación.
- Fase C (retos/boosts): default sin fricción; duelos opt-in "ranked" exigen confirm del partner (≤24h) — futuro, no v1.

---

## 2 · PLAN DE BASE DE DATOS

**Archivo:** `//wsl.localhost/ubuntu/home/elmikebutron/dovo/supabase/migrations/20260607120000_dovo_fase_bc_leaderboard_retos_boosts.sql`

Sigue el estilo verificado de las migraciones existentes: schema `core`, helpers SECURITY DEFINER STABLE con `set search_path = core`, `set_updated_at`, RLS con `is_trato_member`/`owns_miembro`, `revoke execute from public` + grant explícito. **Aditiva, idempotente, CERO DROP de columnas vivas.** Probar en branch de Supabase antes de prod.

### 2.0 Preámbulo

```sql
-- Fase B (leaderboard) + Fase C (retos) + boosts intra-duo + showcase anon.
-- Reusa is_trato_member / owns_miembro / set_updated_at (20260520120001).
-- Regla de oro: punitivo SOLO entre duos rivales (retos); intra-duo SOLO positivo (boosts).

create type core.reto_estado as enum ('propuesto','aceptado','activo','cerrado','rechazado');
create type core.boost_tipo  as enum ('energia','escudo');

-- showcase: marca duos demo seguros de exponer a anon. SOLO service_role lo escribe (ver trigger).
alter table core.tratos add column if not exists is_demo boolean not null default false;

-- separa puntaje crudo (leaderboard/retos) del boosteado (personaje). C5.
alter table core.checkins add column if not exists puntos_base numeric;
update core.checkins set puntos_base = puntos where puntos_base is null;  -- backfill
alter table core.checkins alter column puntos_base set not null;
```

### 2.1 Caps + boost dentro de `apply_checkin` (recrear, MISMA firma)

Cambios sobre el original verificado: (a) aplica caps de R1; (b) escribe `puntos_base` (con caps, SIN boost) y `puntos` (con boost); (c) consume boost `energia` activo; (d) escala deltas por boost.

```sql
create or replace function core.apply_checkin(
  p_miembro_id uuid, p_actividad_id uuid, p_fecha date,
  p_metricas jsonb, p_kcal numeric, p_puntos numeric, p_deltas jsonb
) returns core.user_character
language plpgsql security definer set search_path = core
as $$
declare
  v_user_id uuid := auth.uid();
  v_week date := date_trunc('week', p_fecha)::date;
  v_char core.user_character;
  v_last date; v_cur int;
  v_boost_id uuid; v_mult numeric := 1;
  v_base numeric; v_puntos numeric; v_deltas jsonb := coalesce(p_deltas,'{}'::jsonb);
  v_count_act int;
begin
  if not core.owns_miembro(p_miembro_id, v_user_id) then
    raise exception 'no autorizado para este miembro';
  end if;

  -- CAPS (R1): truncar antes de persistir
  v_base := least(p_puntos, 1000);                          -- CAP_PUNTOS_SESION
  select count(*) into v_count_act from core.checkins
   where miembro_id = p_miembro_id and actividad_id = p_actividad_id and fecha = p_fecha;
  if v_count_act >= 3 then raise exception 'limite de check-ins para esta actividad hoy'; end if;  -- CAP_CHECKINS_ACTIVIDAD_DIA

  -- BOOST energia activo no consumido (consume el más viejo)
  select id into v_boost_id from core.boosts
   where para_user = v_user_id and tipo = 'energia' and not aplicado and now() < fecha_expira
   order by fecha_otorgado asc limit 1 for update skip locked;
  if v_boost_id is not null then
    v_mult := 1.5;                                          -- BOOST_FACTOR
    v_deltas := (select jsonb_object_agg(k, (coalesce(val,'0')::numeric * v_mult))
                 from jsonb_each_text(v_deltas) as e(k,val));
    update core.boosts set aplicado = true where id = v_boost_id;
  end if;
  v_puntos := round(v_base * v_mult);

  -- 1 · check-in: puntos_base (crudo, leaderboard/retos) + puntos (boosteado, personaje)
  insert into core.checkins (miembro_id, actividad_id, fecha, metricas, kcal_calculadas, puntos, puntos_base)
  values (p_miembro_id, p_actividad_id, p_fecha, coalesce(p_metricas,'{}'::jsonb), p_kcal, v_puntos, v_base);

  -- 2 · sube 6 stats (deltas boosteados) — idéntico patrón al original
  insert into core.user_character as uc (user_id, fue,res,flex,vel,equ,vit) values (
    v_user_id,
    coalesce((v_deltas->>'fue')::numeric,0),  coalesce((v_deltas->>'res')::numeric,0),
    coalesce((v_deltas->>'flex')::numeric,0), coalesce((v_deltas->>'vel')::numeric,0),
    coalesce((v_deltas->>'equ')::numeric,0),  coalesce((v_deltas->>'vit')::numeric,0))
  on conflict (user_id) do update set
    fue=uc.fue+coalesce((v_deltas->>'fue')::numeric,0),   res=uc.res+coalesce((v_deltas->>'res')::numeric,0),
    flex=uc.flex+coalesce((v_deltas->>'flex')::numeric,0),vel=uc.vel+coalesce((v_deltas->>'vel')::numeric,0),
    equ=uc.equ+coalesce((v_deltas->>'equ')::numeric,0),   vit=uc.vit+coalesce((v_deltas->>'vit')::numeric,0)
  returning * into v_char;

  -- 3 · racha semanal (idéntico al original verificado)
  select last_cumplido_week, current_streak_weeks into v_last, v_cur from core.user_streak where user_id=v_user_id;
  if v_last is null then v_cur:=1;
  elsif v_week=v_last then v_cur:=coalesce(v_cur,1);
  elsif v_week=v_last+7 then v_cur:=coalesce(v_cur,0)+1;
  elsif v_week>v_last then v_cur:=1; else v_cur:=coalesce(v_cur,1); end if;
  insert into core.user_streak as us (user_id,current_streak_weeks,max_streak,last_cumplido_week)
  values (v_user_id,v_cur,v_cur,v_week)
  on conflict (user_id) do update set
    current_streak_weeks=v_cur, max_streak=greatest(us.max_streak,v_cur),
    last_cumplido_week=greatest(us.last_cumplido_week,v_week);

  return v_char;
end; $$;

revoke execute on function core.apply_checkin(uuid,uuid,date,jsonb,numeric,numeric,jsonb) from public;
grant  execute on function core.apply_checkin(uuid,uuid,date,jsonb,numeric,numeric,jsonb) to authenticated, service_role;
```

> Nota: el cap por día (`1800`) y duración (`180`) se aplican en TS (`lib/scoring`) porque la duración no llega a la RPC; el cap por sesión y por actividad/día van en DB como última línea de defensa.

### 2.2 Tabla `retos`

```sql
create table if not exists core.retos (
  id uuid primary key default gen_random_uuid(),
  trato_a uuid not null references core.tratos(id) on delete cascade,
  trato_b uuid not null references core.tratos(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,                               -- exclusivo (half-open)
  estado core.reto_estado not null default 'propuesto',
  creado_por uuid not null references core.users(id) on delete restrict,
  ganador_trato_id uuid references core.tratos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retos_distintos check (trato_a <> trato_b),
  constraint retos_periodo_valido check (periodo_fin > periodo_inicio),
  constraint retos_ganador_valido check (ganador_trato_id is null or ganador_trato_id in (trato_a,trato_b)),
  constraint retos_ganador_solo_cerrado check (ganador_trato_id is null or estado='cerrado')
);
create index if not exists retos_trato_a_idx on core.retos(trato_a);
create index if not exists retos_trato_b_idx on core.retos(trato_b);
create index if not exists retos_estado_idx on core.retos(estado);
create unique index if not exists retos_par_vivo_idx
  on core.retos (least(trato_a,trato_b), greatest(trato_a,trato_b))
  where estado in ('propuesto','aceptado','activo');
create trigger retos_updated_at before update on core.retos
  for each row execute function core.set_updated_at();
```

### 2.3 Tabla `boosts`

```sql
create table if not exists core.boosts (
  id uuid primary key default gen_random_uuid(),
  de_user uuid not null references core.users(id) on delete cascade,
  para_user uuid not null references core.users(id) on delete cascade,
  trato_id uuid not null references core.tratos(id) on delete cascade,
  tipo core.boost_tipo not null,
  fecha_otorgado timestamptz not null default now(),
  fecha_expira timestamptz not null,
  aplicado boolean not null default false,
  created_at timestamptz not null default now(),
  constraint boosts_no_self check (de_user <> para_user),
  constraint boosts_vigencia check (fecha_expira > fecha_otorgado)
);
create index if not exists boosts_para_user_idx on core.boosts(para_user);
create index if not exists boosts_trato_idx on core.boosts(trato_id);
create index if not exists boosts_activo_idx on core.boosts (para_user, aplicado, fecha_expira) where not aplicado;
```

### 2.4 Helper + RLS retos

```sql
create or replace function core.is_reto_party(p_a uuid, p_b uuid, p_user uuid)
returns boolean language sql security definer stable set search_path = core as $$
  select core.is_trato_member(p_a,p_user) or core.is_trato_member(p_b,p_user);
$$;
revoke execute on function core.is_reto_party(uuid,uuid,uuid) from public;

alter table core.retos enable row level security;
create policy retos_read_party on core.retos for select
  using (core.is_reto_party(trato_a,trato_b,auth.uid()));
create policy retos_insert_challenger on core.retos for insert with check (
  auth.uid()=creado_por and core.is_trato_member(trato_a,auth.uid()) and trato_a<>trato_b);
create policy retos_update_party on core.retos for update
  using (core.is_reto_party(trato_a,trato_b,auth.uid()))
  with check (core.is_reto_party(trato_a,trato_b,auth.uid()));
-- sin DELETE: retos quedan como historial.
```

### 2.5 RLS boosts (regla de oro a nivel DB: ambos miembros del mismo trato)

```sql
alter table core.boosts enable row level security;
create policy boosts_read_member on core.boosts for select
  using (core.is_trato_member(trato_id,auth.uid()));
create policy boosts_insert_giver on core.boosts for insert with check (
  auth.uid()=de_user and de_user<>para_user
  and core.is_trato_member(trato_id,de_user)
  and core.is_trato_member(trato_id,para_user));
-- sin UPDATE/DELETE para clientes: 'aplicado' lo mueve apply_checkin (definer).
```

### 2.6 Trigger blindando `is_demo` (C7 — cierra fuga PII)

```sql
create or replace function core.guard_is_demo() returns trigger
language plpgsql security definer set search_path = core as $$
begin
  if new.is_demo is distinct from old.is_demo and auth.role() <> 'service_role' then
    raise exception 'is_demo solo lo modifica service_role';
  end if;
  return new;
end; $$;
create trigger tratos_guard_is_demo before update on core.tratos
  for each row execute function core.guard_is_demo();
```

### 2.7 RPC `leaderboard_duos` (autenticada) — usa `puntos_base`

Promedio per-miembro, `rank()`, `top_stat`/`top_clase` derivados. SECURITY DEFINER (suma checkins ajenos para rankear; RLS de `trato_streak`/`checkins` es member-only — verificado). Devuelve SOLO agregados + nombre de grupo (no PII). Firma:

```sql
create or replace function core.leaderboard_duos(p_period_start date, p_period_end date, p_limit int default 50)
returns table (posicion bigint, trato_id uuid, nombre_grupo text, n_miembros int,
               total_puntos numeric, puntos_por_miembro numeric, racha_duo int, top_clase text, top_stat text)
language sql security definer set search_path = core as $$
  with miembros as (
    select tm.trato_id, tm.id as miembro_id, tm.user_id
    from core.trato_miembros tm join core.tratos t on t.id=tm.trato_id where t.estado='activo'),
  pts as (
    select m.trato_id, coalesce(sum(c.puntos_base),0) as total
    from miembros m left join core.checkins c
      on c.miembro_id=m.miembro_id and c.fecha>=p_period_start and c.fecha<p_period_end
    group by m.trato_id),
  chars as (
    select m.trato_id, count(distinct m.user_id) as n,
      sum(coalesce(ch.fue,0)) fue, sum(coalesce(ch.res,0)) res, sum(coalesce(ch.flex,0)) flex,
      sum(coalesce(ch.vel,0)) vel, sum(coalesce(ch.equ,0)) equ, sum(coalesce(ch.vit,0)) vit
    from miembros m left join core.user_character ch on ch.user_id=m.user_id group by m.trato_id),
  tclase as (
    select distinct on (m.trato_id) m.trato_id, ch.class_name
    from miembros m join core.user_character ch on ch.user_id=m.user_id
    order by m.trato_id, ch.xp desc nulls last),
  ranked as (
    select t.id trato_id, t.nombre_grupo, cz.n n_miembros, p.total total_puntos,
      round(p.total/nullif(cz.n,0),2) ppm, coalesce(ts.current_streak_weeks,0) racha,
      tc.class_name top_clase,
      (array['FUE','RES','FLEX','VEL','EQU','VIT'])[
        (select i from (select i,v from unnest(array[cz.fue,cz.res,cz.flex,cz.vel,cz.equ,cz.vit])
          with ordinality as u(v,i) order by v desc,i asc limit 1) z)] top_stat
    from core.tratos t
    join chars cz on cz.trato_id=t.id join pts p on p.trato_id=t.id
    left join core.trato_streak ts on ts.trato_id=t.id left join tclase tc on tc.trato_id=t.id
    where t.estado='activo')
  select rank() over (order by ppm desc, total_puntos desc), trato_id, nombre_grupo,
         n_miembros, total_puntos, ppm, racha, top_clase, top_stat
  from ranked order by 1 limit greatest(p_limit,1);
$$;
revoke execute on function core.leaderboard_duos(date,date,int) from public;
grant  execute on function core.leaderboard_duos(date,date,int) to authenticated, service_role;
```

### 2.8 RPC `leaderboard_demo` (anon) — variante showcase, solo `is_demo`, cero PII

```sql
create or replace function core.leaderboard_demo(p_limit int default 20)
returns table (posicion bigint, nombre_grupo text, n_miembros int, total_puntos numeric,
               puntos_por_miembro numeric, racha_duo int, top_clase text, top_stat text)
language sql security definer set search_path = core, pg_temp as $$
  select l.posicion, l.nombre_grupo, l.n_miembros, l.total_puntos, l.puntos_por_miembro,
         l.racha_duo, l.top_clase, l.top_stat
  from core.tratos t
  join lateral (select * from core.leaderboard_duos('2000-01-01'::date,(now()+interval '1 year')::date,9999)) l
    on l.trato_id = t.id
  where t.is_demo
  order by l.puntos_por_miembro desc limit greatest(p_limit,1);
$$;
revoke execute on function core.leaderboard_demo(int) from public;
grant  execute on function core.leaderboard_demo(int) to anon, authenticated, service_role;  -- único anon
```

> `leaderboard_demo` no devuelve `trato_id` ni nada que permita unir a tablas reales. Allowlist de columnas explícita (nunca `select *` sobre tablas base). Cubre R6 #1/#2/#3.

### 2.9 RPC `marcador_reto` (lectura en vivo) — guard de membresía

Suma `puntos_base` por lado en la ventana. CTE `guard` re-aplica `is_reto_party` (aunque sea definer, sin él cualquier authenticated espía un reto ajeno). Empate → `lider_trato_id null`. Firma: `marcador_reto(p_reto_id uuid)` → `(reto_id, estado, periodo_inicio, periodo_fin, trato_a, nombre_a, puntos_a, trato_b, nombre_b, puntos_b, lider_trato_id)`. Grant a `authenticated, service_role`.

### 2.10 RPC `cerrar_reto` (idempotente, fija ganador) — usa `puntos_base`

`plpgsql security definer`, `select ... for update` evita doble-cierre, early-return si ya `cerrado`. Autoriza party o `service_role` (cron). Suma `puntos_base` de ambos lados, `v_ganador = case when a>b ... when b>a ... else null`. Update a `estado='cerrado' + ganador_trato_id`. Hermano de `cerrar_semana_rachas`, compatible pg_cron sobre `retos where estado='activo' and periodo_fin <= current_date`.

### 2.11 Grants de tabla (obligatorio — tablas creadas DESPUÉS del grant base)

```sql
grant select, insert, update on core.retos, core.boosts to authenticated;
grant select, insert, update, delete on core.retos, core.boosts to service_role;
```

### Orden dentro de la migración
1. enums + `alter tratos add is_demo` + `alter checkins add puntos_base` (+ backfill)
2. helper `is_reto_party` + `guard_is_demo` + trigger
3. tabla `retos` (índices/trigger/RLS/grants)
4. tabla `boosts` (índices/RLS/grants)
5. `create or replace apply_checkin` (caps + boost)
6. RPCs `leaderboard_duos`, `leaderboard_demo`, `marcador_reto`, `cerrar_reto` + revoke/grant
7. grants de tabla finales

---

## 3 · PLAN DE BACKEND (server actions)

Patrón verificado en `lib/actions/checkins.ts`: `"use server"`, tipo `Result<T> = {ok:true;data:T} | {ok:false;error:string}`, `createClient()` de `@/lib/supabase/server`, `supabase.schema("core").rpc(...)`, `revalidatePath`. Schemas zod nuevos en `lib/validation/` (o inline). Todas las actions verifican `auth.getUser()` primero.

**`lib/actions/leaderboard.ts`**
- `getLeaderboard(periodo: 'semana'|'mes'): Promise<Result<LeaderRow[]>>` — calcula ventana (lunes ISO actual / inicio de mes) y llama `leaderboard_duos(start,end,50)`. No muta; usable desde Server Component directo también.
- zod: `z.enum(['semana','mes'])`.

**`lib/actions/retos.ts`**
- `crearReto(input:{tratoRivalId:string; tipo:'puntos'|'racha'|'stat'; statTarget?:string; duracionSemanas:1|2|4}): Promise<Result<{retoId:string}>>` — resuelve `trato_a` del user (su dúo), valida no-self, calcula `periodo_inicio` (lunes próximo) / `periodo_fin`, inserta `retos` (RLS valida). zod: `tratoRivalId:z.string().uuid()`, `tipo:z.enum(...)`, `statTarget:z.enum(['fue','res','flex','vel','equ','vit']).optional()`, `duracionSemanas:z.union([z.literal(1),z.literal(2),z.literal(4)])`.
- `responderReto(retoId, accion:'aceptar'|'rechazar'): Promise<Result>` — update `estado` (RLS = party). Si aceptar y ya pasó inicio → `activo`.
- `getMarcador(retoId): Promise<Result<Marcador>>` — llama `marcador_reto`.
- `cerrarRetoAction(retoId): Promise<Result<Reto>>` — llama `cerrar_reto` (party puede cerrar manual al vencer).

**`lib/actions/boosts.ts`**
- `darBoost(input:{paraUserId:string; tipo:'energia'|'escudo'}): Promise<Result>` — resuelve `trato_id` compartido del emisor con el receptor, valida gating (racha dúo ≥2 via `trato_streak`), cooldown (último boost del emisor en ese trato > 7d), inserta con `fecha_expira = now()+24h` (energia) o fin de semana (escudo). RLS valida ambos en trato. zod: `paraUserId:z.string().uuid()`, `tipo:z.enum(['energia','escudo'])`.
- `getBoostActivo(): Promise<Result<Boost|null>>` — boost no aplicado, no expirado, del user actual (para badge "boost activo de X" en home).

**`lib/actions/demo.ts`**
- `loginDemo(): Promise<Result>` — Server Action; `supabase.auth.signInWithPassword({email: NEXT_PUBLIC_DEMO_EMAIL, password: process.env.DEMO_PASSWORD})` (password server-side, nunca en bundle). Redirect a `/leaderboard`. Rate-limit (R6 #5).

**`lib/scoring/constants.ts`** — añadir las constantes de caps/boost de §1. **`lib/scoring/`** — añadir guard de `CAP_PUNTOS_DIA`/`CAP_DURACION_MIN` en el cálculo TS (la RPC cubre sesión/actividad).

---

## 4 · PLAN DE FRONTEND

> **PREREQUISITO BLOQUEANTE (Reporter 2, verificado): los 6 stat-color tokens NO existen en `globals.css`** — solo `--c-signal`. `home-authed.tsx` pinta las 6 barras con `bg-signal`. Esto se arregla PRIMERO porque todo Fase B/C depende de color-codear stats.

### 4.0 Foundation (primero)
- **`app/globals.css`** (editar): añadir en `:root` los 6 `--stat-*` (FUE `#6d4aff`, RES `#3a86ff`, FLEX `#c44aff`, VEL `#3ac4d6`, EQU `#3ac49a`, VIT `#aef03c`); en dark subir luminancia ~8% (RES `#5a9bff` etc.); en `@theme inline` exponer `--color-stat-*` (genera `bg-stat-fue`, `text-stat-res`...).
- **`app/_components/StatBar.tsx`** (crear): props `{statKey, value, orientation:'v'|'h', showLabel?}`, mapea `statKey→bg-stat-{key}`. Mover `barHeight()` a `lib/leveling/display.ts` y compartir.
- **`app/_components/home-authed.tsx`** (editar): reemplazar `bg-signal` del loop de stats por `<StatBar statKey={key} .../>` (arregla bug existente).
- **i18n:** namespace `stats` (`fue`..`vit`) ya existe — reusar, no duplicar.

### 4.A Leaderboard
Archivos: `app/(app)/leaderboard/page.tsx` (Server Component), `app/_components/DuoLeaderRow.tsx`, `app/_components/LeaderboardTabs.tsx` (client, searchparam `?p=`).
- Shell `min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl mx-auto`; header con wordmark `syne` + nav (link activo "tabla") + LanguageToggle.
- Eyebrow mono "clasificación" + título "tabla de duos"; tabs `semana`/`mes`.
- `DuoLeaderRow`: rank (display 800 tabular-nums; #1 `text-signal` + glow `shadow-[0_0_24px_rgba(109,74,255,0.25)]`), nombre_grupo + avatares iniciales, `puntos_por_miembro` (display 2xl) + label `pts`, racha mono, dot + `StatBar orientation="h"` del top-stat. Tu dúo: `border-signal` + badge "tú". Top 3: `bg-papel-dark/40`.
- Estado vacío: reusar `DuoProof` + CTA "sé el primer duo en la tabla →".
- Motion: fade-up stagger 60ms/fila CSS-only, respeta `prefers-reduced-motion`. Mobile <480px: 2 columnas, ocultar barra-h (solo dot).
- i18n namespace **`leaderboard`** (es+en): `navTab, eyebrow, title, tabWeek, tabMonth, points {n}, streak {n}, you, rank #{n}, topStat {stat}, emptyTitle, emptyBody, emptyCta, yourPosition`.

### 4.B Retos
Archivos: `app/(app)/retos/page.tsx` (hub: reto activo + historial + CTA), `app/(app)/retos/nuevo/page.tsx` (client form), `app/_components/DuelScoreboard.tsx`, `app/_components/ChallengeStrip.tsx` (embed arriba de rutina en `grupo/[id]`), `app/_components/DuelHistoryRow.tsx`.
- `DuelScoreboard` (client, marcador): card oscura `rounded-[20px] bg-[#0b0a14] text-white p-6`, layout dual simétrico (tu dúo izq `bg-signal`, rival `bg-stat-flex` magenta), "VS" central, marcadores display 800 tabular-nums con **count-up** (IntersectionObserver 800ms, único count-up premium permitido), días restantes ≤2 → `text-stat-vit`. Mobile <400px: barras horizontales apiladas.
- `nuevo`: selector de rival (invite-token/lista), tipo (radio cards), duración (segmented 1/2/4 sem), submit.
- Motion: count-up + width-transition 600ms; `prefers-reduced-motion` → valor final directo. "En vivo" = revalidate on focus, no websocket en v1.
- i18n namespace **`retos`** (es+en): `navTab, eyebrow, title, active, challenge, vs, you, rival, daysLeft {n}, lastDay, typePoints, typeStreak, typeStat {stat}, durationLabel, weeks {n}, history, won, lost, ongoing, newTitle, pickRival, pickType, submit, emptyTitle, emptyBody, emptyCta, winnerBadge`.

### 4.C Boosts
Archivo: `app/_components/BoostButton.tsx` (client island, en `grupo/[id]` junto a card del partner; atajo en home).
- NO usar lenguaje rojo/competitivo (eso es duelos). Aquí todo signal-violeta cálido (es un regalo).
- Estados: Disponible (pill `bg-signal text-white` + glow), Cooldown (mono countdown `setInterval`), Recibido (drops del logo "neck" metaball ~700ms; `prefers-reduced-motion` → fade del check ✦).
- Badge en home del receptor: mono `text-signal` "boost activo de {nombre}".
- i18n namespace **`boosts`** (es+en): `give {nombre}, cooldown {time}, sent, activeFrom {nombre}, hintEnergia, hintEscudo, selfHint, gateHint` (racha ≥2 para desbloquear).

### 4.D Showcase público (sin login)
Archivos: `app/showcase/page.tsx` (Server Component, FUERA de `(app)` y `(auth)`, nivel raíz), `app/_components/ShowcaseCharacterCard.tsx`.
- Hereda lenguaje de `landing` (no shell de app). Nav minimal (wordmark + LanguageToggle + "ver demo" + "entrar"); hero oversized "duos entrenando ahora mismo"; mini-leaderboard top 5 (reusa `DuoLeaderRow` variante readonly, datos de `leaderboard_demo`); 2-3 `ShowcaseCharacterCard`; CTA final "encuentra tu duo." + ver demo / crear cuenta.
- `ShowcaseCharacterCard`: card oscura 9:16, todos los stat-colors visibles (escaparate del sistema), class_name con sustantivo en `text-signal`, diseñada para screenshot.
- Datos: SOLO `leaderboard_demo()` (anon, cero PII). Nunca tablas base.
- i18n namespace **`showcase`** (es+en): `navDemo, navEnter, heroEyebrow, heroTitle, heroSub, boardTitle, cardsTitle, ctaTitle, ctaDemo, ctaSignup`.

### 4.E Botón "Ver demo"
Archivo: `app/_components/DemoLoginButton.tsx` (client) + Server Action `loginDemo` (§3). Montar en `landing.tsx` (ghost mono, no compite con CTA primario), `app/(auth)/sign-in` (pill secundaria), y showcase. Email+password, **sin OAuth**. Loading "entrando…". i18n: extender `landing` (`demoCta`) y `auth` (`demoButton`, `demoLoading`).

### Pulidos a pantallas existentes
- **home-authed**: StatBar (4.0); badge boost activo; atajo BoostButton.
- **perfil** (character sheet): StatBar color-codeado; récord W-L del dúo (si tiene retos cerrados).
- **grupo/[id]**: `ChallengeStrip` (reto activo / CTA retar) arriba de rutina; `BoostButton` en sección de miembros.

### i18n — reglas (verificadas: flat keys, lowercase MX-coloquial es, ICU)
Nuevos namespaces `leaderboard`, `retos`, `boosts`, `showcase` en `messages/es.json` + `messages/en.json`; extender `landing`, `auth`. Reusar `stats`. CI debe fallar si falta una key en cualquier locale (R6 #14).

---

## 5 · PLAN DE DATOS DEMO

**Script:** `scripts/seed-demo.ts` (tsx). Password único `dovodemo2026`. Emails `demo+xxx@dovofit.com`. Crea usuarios vía Supabase auth admin (`email_confirm:true`), perfil físico (dispara `bmr_calculado`), `tratos` (con `is_demo=true`), `trato_miembros`, `user_rutinas` default, luego **loop semanal de `apply_checkin` por sesión** + `cerrar_semana_rachas(lunes)` por semana en orden cronológico.

> **Correcciones load-bearing (R4, verificadas contra código):**
> 1. Clases son **inglés** (C2). Diseñar perfiles para que *caigan* en la clase deseada; el seed no nombra clases.
> 2. **"The Apex" inalcanzable** con check-ins reales en ventana demo (Master exige raw≈70k). Tope orgánico realista = **Expert**. Mantener tope orgánico (más creíble para due diligence); `SHOWCASE_FAKE_APEX` = OFF por default.
> 3. Para racha de N semanas: cada miembro necesita ≥Σfrecuencia check-ins en N semanas consecutivas. Para romper racha: saltar una semana de un miembro.

### Elenco (12 duos / 24+ miembros)

| # | Grupo | Disciplina | Sem | Consist. | Racha objetivo | Resultado (nivel·clase·tier) |
|---|---|---|---|---|---|---|
| 1🥇 | Los Inquebrantables | Gym | 10 | 0.95 | 10 | The Titan · FUE Expert(~83) |
| 2🥈 | Ritmo y Asfalto | Running | 10 | 0.92 | 9 | The Marathoner · RES Expert(~81) |
| 3🥉 | En Punta | Ballet | 9 | 0.90 | 8 | The Dancer · FLEX/EQU Expert(~82) |
| 4 | Núcleo Duro | Pilates+Gym | 8 | 0.88 | 7 | The Dancer · Athlete |
| 5 | **Híbridos** (cuenta demo) | Gym+Running | 9 | 0.85 | 6 | The Athlete · FUE/RES Athlete |
| 6 | Cinco Disciplinas | Multi | 9 | 0.85 | 5 | The Pentathlete · todo Athlete |
| 7 | Los del Cerro | Running | 8 | 0.78 | 3 (rompe sem4) | The Marathoner · Athlete |
| 8 | Fierro Parejo | Gym | 8 | 0.75 | 3 | The Titan · FUE Athlete |
| 9 | Empezando Fuerte | Pilates | 6 | 0.70 | 2 | The Dancer · Apprentice |
| 10 | Trío Norte (N=3, `pequeno`) | Gym+Running | 7 | 0.72 | 2 | Titan/Marathoner · Athlete |
| 11 | Las Domingueras | Running | 4 | 0.55 | 1 (rompe sem2) | The Marathoner · Athlete/Apprentice |
| 12 | Recién Llegados | Pilates | 2 | 0.60 | 0 | Rookie → Apprentice |

- **Diversidad:** 4 disciplinas + 2 multi; 14F/10M; edades 24–47; pesos 54–88; BMR ~1262–1820 (hace lucir justos los puntos normalizados — tesis). Rachas 0→10, niveles 3→27, con rupturas reales (#7, #11).
- **Cuenta demo designada:** **Duo #5 Híbridos**, login **`demo+ivan@dovofit.com` / `dovodemo2026`** (C4). Estado: `estado='activo'`, rutina default, `trato_streak`=6, último check-in **ayer**, 1 reto activo, 1 boost recibido.

### Retos/boosts demo a sembrar
- **Reto activo #1** (lo ve la cuenta demo): Híbridos #5 vs Cinco Disciplinas #6, tipo "más puntos", inicio lunes de esta semana, marcador parcial ~52/48 (peleado).
- **Reto activo #2** (David vs Goliat para showcase): Los Inquebrantables #1 vs Fierro Parejo #8, #1 favorito.
- **Reto cerrado #1** (historial): Ritmo y Asfalto #2 vs Los del Cerro #7, ganador #2.
- **Boost** en #5: Tono → Iván, "Energía" (+50%), aplicado hace 2 días (visible). En #3: Sofía → Renata, "Escudo" activo.

### Parámetros del seed script (R6 hardening)
- **UUIDs fijos namespaced** (`demo-trato-0001`...) + upsert `on conflict`. **Anchor de fecha fijo** `SEED_ANCHOR='2026-06-01'` (no `now()`), PRNG con seed fija → screenshots estables.
- **Idempotente:** guard que borra `demo+%@dovofit.com` antes de re-sembrar; transacción; **solo toca `core.*`** (schema-qualify, nunca `public.*` del segundo producto).
- Sesiones/semana = `round(frecuencia * consistencia)`, distribuidas en días distintos. Intensidad (1–5, factor 0.6→1.4) solo ballet/pilates en `metricas`. Métricas jsonb por actividad: gym `{peso_kg,reps,sets,tiempo_min}`, running `{distancia_km,tiempo_min}`, ballet/pilates `{tiempo_min,intensidad}`.
- **Cron de reset diario** (idempotente) por si un visitante muta datos durante el pitch.

---

## 6 · MATERIALES INVERSIONISTA

> Cifras de mercado = **[SUPUESTO]** marcado. 0 usuarios reales: se vende *producto construido* (Fase A en prod), no métricas de uso. Cita verificada en `DuoProof.tsx`: Wallace, Raglin & Jastremski 1995, adherencia 12m — **43% abandona solo vs 6% con pareja (~7x)**.

### Deck (12 slides)
1. **Portada/One-liner** — "Hyrox para cualquier disciplina. Fitness que se juega en dúo." Pre-seed · MX · 2026.
2. **Problema** — 43% abandona solo; la adherencia es el verdadero producto y la industria la ignora; el "social" de competidores es cosmético; CAC quemado en churn.
3. **Solución (demo)** — 6% con pareja = 7x retención; dúo = unidad atómica; loop check-in→puntos normalizados→6 stats→racha; demo pública + "Ver demo".
4. **Producto (ya existe)** — RPG real (6 stats, niveles, prestige, clases deterministas), multideporte día 1 (gym/running/ballet/pilates comparables), racha de dúo + resumen mensual; stack en prod.
5. **Por qué funciona (ciencia del hábito)** — Hooked: Trigger→Action→Variable Reward (¿ganamos el duelo?)→Investment (la racha); coop dentro / competencia fuera (Clash of Clans / Strava clubs).
6. **Foso técnico: normalización por BMR** — `puntos = round(kcal/(BMR/1440))`; hace justa la comparación cross-disciplina sin imponer formato; **ya en producción**, no roadmap.
7. **Mercado (TAM/SAM/SOM)** — ver §6 modelo; cero competencia es-MX per-dúo multideporte. [SUPUESTO] marcado.
8. **Modelo** — **$99 MXN/mes por DÚO** (ARPU ~$49.50/persona); Free (200 dúos)→Pro→Premium; B2B partners; margen bruto >80%.
9. **Competencia/Diferenciador** — tabla stickK/Fitness Pact/OATH/Sweatmates (inglés, per-user, 1 disciplina, social cosmético) vs dovo (es-MX, per-dúo, rivalidad, multideporte, RPG, BMR). El diferenciador es la *unidad* (dúo) + el *motor* (BMR).
10. **Tracción/Estado** — Fase A completa y desplegada; 9 pantallas pulidas; 0 usuarios (honesto: el ask financia validación, no construcción).
11. **Roadmap** — Ahora: Fase B leaderboard + Fase C retos/boosts + demo + showcase. Q+1: Pro (meal plans IA + Stripe + push). Q+2: partners + Fase D ligas. Post-MVP: estudios médicos, móvil nativo.
12. **The Ask** — pre-seed para (1) primeros ~500-1,000 dúos, (2) validar retención M3 vs benchmark 6%, (3) activar capa competitiva. Uso: ~50% growth, ~25% producto, ~15% partners, ~10% legal/infra. Runway 18m.

### One-pager (7 secciones)
1. Encabezado (one-liner + dovofit.com). 2. Problema (43%/6% + cita). 3. Solución (dúo átomo, 7x). 4. Foso (BMR, ya en prod). 5. Mercado & modelo ($99/dúo, margen >80%). 6. Competencia (categoría sin ocupar en LatAm). 7. Estado & ask (prod + 0 usuarios + pre-seed).

### Modelo financiero (escenarios)
Unidad = **dúo** (1 dúo = 2 personas = 1 sub de $99 MXN). Mercado [SUPUESTO]: TAM ~8-10M personas (~4-5M dúos), SAM ~750K-1M dúos, SOM 36m ~5K-25K dúos.

| Variable | Conservador | Base | Agresivo |
|---|---|---|---|
| Nuevos dúos/mes M1 | 15 | 40 | 100 |
| Crecimiento MoM | +6% | +12% | +20% |
| Free→Pro | 6% | 12% | 20% |
| Churn mensual (pagos) | 8% | 5% | 3.5% |
| Costo var/dúo/mes | $25 | $20 | $15 MXN |
| CAC/dúo | $350 | $250 | $180 MXN |

**Unit economics Base:** ARPU efectivo ~$95.7 (mix 20% anual), margen ~79%, **LTV ~$1,512**, **LTV:CAC ~6.0x**, payback ~3.3m.

| Hito | Conservador | Base | Agresivo |
|---|---|---|---|
| MRR M12 | ~$1.4K | ~$6.9K | ~$26.8K |
| MRR M24 | ~$6.3K | ~$36.7K | ~$182K |
| MRR M36 | ~$17.2K | ~$109K | ~$478K |
| ARR M36 | ~$207K | ~$1.31M | ~$5.74M |

Fórmulas para Excel (celdas editables): `Dúos_activos(t)=Dúos(t-1)*(1-churn)+nuevos(t)`; `MRR=Dúos_pago*ARPU_ef`; `LTV=(ARPU_ef*margen)/churn`; `Payback=CAC/(ARPU_ef*margen)`. **Sensibilidad #1 = churn** (la tesis entera: racha de dúo baja churn de ~12% a ~5%). Agresivo asume K-factor ~0.3-0.5 (dúo-recluta-dúo vía retos).

---

## 7 · RIESGOS Y MUST-PASS (checklist antes de deploy/mostrar)

> **Contexto crítico (R6, verificado en prod `chyudsvjllcxdjgjafjo`): el mismo Postgres aloja un 2º producto (KASA/nutrición) en `public.*`.** Blast radius = dos apps. Hay 1 user en `auth.users` con `core.users`=0 (desync real → edge case "perfil sin bmr" ya activo). `calcularPuntos` ya guarda `bmr<=0`→0 (verificado), pero `puntos_por_miembro` necesita `GREATEST(n,1)`.

- [ ] **`get_advisors security` = 0 ERROR.** INFO de `public.*` (otro producto) documentados; `brand_partners` (RLS-sin-policy) con policy explícita o anon revocado.
- [ ] **Curl anon al showcase NO devuelve** ningún `email`, `nombre` real, `invite_token`, `rfc`, `contacto_email`, `bmr_calculado`, `peso_kg`, `altura_cm`, `edad`, `genero`, `user_id`. Test automatizado en CI (falla si la respuesta contiene esas substrings).
- [ ] **Curl como cuenta demo NO lee** checkins/perfil crudos de dúos ajenos (solo agregados de `leaderboard_duos`). Nunca añadir policy `using(auth.role()='authenticated')` sobre `checkins`/`user_perfil_fisico`/`users` (patrón peligroso ya presente en `actividades`).
- [ ] **`is_demo` blindado:** trigger impide que `authenticated` lo flipee (C7). Verificado con intento de update desde cliente.
- [ ] **Cuenta demo:** no puede borrar/abandonar dúos demo (no es `created_by`); sin permisos service/admin en cliente; password server-side (no en bundle); no concede acceso a `public.*`.
- [ ] **Seed idempotente:** correr 2× → mismos UUIDs, sin duplicados, mismas fechas (anchor fijo). Solo `core.*` con prefijo `demo-`.
- [ ] **Seed consistente:** nivel/xp/statDisplay/puntos recomputados con `lib/leveling`+`lib/scoring` cuadran contra DB (vía `apply_checkin`, no INSERT directo en `user_character`).
- [ ] **Sin NaN/Infinity:** perfil sin bmr → 0 + estado; dúo de 1 → `GREATEST(n,1)`; periodo sin checkins → empty-state. Cubrir el `core.users`=0 actual sin crash en home-authed.
- [ ] **Migración aplicada en branch/staging primero**, aditiva, CERO DROP; app actual sigue funcionando; `generate_typescript_types` regenerado + `next build` verde ANTES del push (DB primero, app después).
- [ ] **Regla de oro en DB (constraint, no solo app):** boosts intra-duo (`is_trato_member` ambos + `no_self`); retos solo entre distintos (`retos_distintos`); ninguna mecánica resta puntos a un miembro del propio dúo.
- [ ] **Separación `puntos_base`/`puntos`:** leaderboard y `cerrar_reto` suman `puntos_base` (sin boost); personaje usa `puntos`/deltas boosteados. Test de que un boost NO mueve el ranking.
- [ ] **i18n completo** (es+en) en leaderboard/retos/boosts/showcase; CI falla si falta key; skeletons/loading presentes.
- [ ] **Flujo E2E:** showcase → "Ver demo" (email+password, sin OAuth) → home autenticado, sin 404/link muerto.
- [ ] **WCAG AA:** stat-colors VEL cyan/EQU teal/VIT lima sobre paper claro `#f4f4f6` **probablemente fallan** → usar esos colores solo en dark o como acento con texto ink, no como texto sobre fondo claro. Leaderboard responsive (cards apiladas <768px, no scroll horizontal); touch targets ≥44px.
- [ ] **Branding:** "dovo" minúscula en todas las pantallas nuevas; `Syne` solo wordmark; `Geist Mono` solo datos.
- [ ] **Leaked-password protection** decidido (ON si signups reales; demo siempre preconfirmada vía service role).
- [ ] **Caps verificados:** sesión truncada a 1000, ≤3 check-ins/actividad/día rechazado, cron de cierre de retos vencidos operativo.

---

## 8 · ORDEN DE EJECUCIÓN

1. **Foundation tokens** (4.0): `globals.css` 6 stat-colors → `StatBar.tsx` → refactor `home-authed.tsx`. (Arregla bug existente; desbloquea todo.)
2. **Migración DB** (§2) en **branch de Supabase**: enums + `is_demo` + `puntos_base` (backfill) → helpers/trigger → tablas `retos`/`boosts` → `apply_checkin` (caps+boost) → 4 RPCs → grants.
3. **Verificar branch:** `get_advisors security`=0 ERROR; tests de RLS (anon no ve PII; demo no ve crudo ajeno); `is_demo` blindado.
4. **`generate_typescript_types`** + commitear types.
5. **Constantes scoring** (`lib/scoring/constants.ts`) + guards TS de caps día/duración.
6. **Server actions** (§3): leaderboard, retos, boosts, demo + schemas zod.
7. **Frontend Fase B:** leaderboard (page + DuoLeaderRow + Tabs) + i18n `leaderboard`.
8. **Frontend Fase C:** retos (hub/nuevo/DuelScoreboard/ChallengeStrip) + boosts (BoostButton) + i18n `retos`/`boosts` + pulidos grupo/[id], home, perfil.
9. **Seed demo** (`scripts/seed-demo.ts`, §5) contra branch → verificar consistencia (recompute) + idempotencia (2 corridas).
10. **Showcase** (`app/showcase` + ShowcaseCharacterCard) usando `leaderboard_demo` + i18n `showcase`.
11. **Botón Ver demo** (DemoLoginButton + loginDemo) en landing/sign-in/showcase; cuenta demo pre-confirmada.
12. **QA E2E** (§7 checklist completo) + `next build` verde.
13. **Merge migración branch→prod**, push app a Vercel (DB ya migrada). Cron reset demo + cron `cerrar_reto` vencidos.
14. **Materiales inversionista** (§6) en paralelo desde paso 2 (no bloquea código): deck, one-pager, modelo Excel con celdas editables.

**Archivos verificados como grounding:** `lib/leveling/constants.ts` (clases inglés), `lib/scoring/puntos.ts` (guard bmr), `lib/scoring/constants.ts`, `supabase/migrations/20260529110455_apply_checkin_rpc.sql`, `20260601120000_trato_streak_compliance.sql`, `app/globals.css` (sin stat-tokens), `lib/actions/checkins.ts` (patrón Result + schema().rpc()). Repo en `//wsl.localhost/ubuntu/home/elmikebutron/dovo`.