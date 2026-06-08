// Genera el SQL del seed demo de dovo (idempotente). NO toca la DB: usa el scoring
// real (lib/scoring) para computar datos consistentes y emite SQL a stdout / archivo.
// Se aplica luego vía MCP execute_sql. Crea usuarios auth con extensions.crypt (bcrypt).
//
//   npx tsx scripts/gen-seed-sql.ts > scripts/seed-demo.sql
//
import { writeFileSync } from "node:fs";
import { calcularCheckin } from "../lib/scoring/index";
import type { StatDeltas } from "../lib/scoring/types";

// ── Catálogo (debe calzar con supabase/migrations/..._seed_actividades.sql) ──
type Act = {
  slug: string;
  kcal_por_min: number;
  stats_primary: string[];
  stats_secondary: string[];
  dur: number;
  metricas: (rng: () => number) => Record<string, number>;
};
const ACT: Record<string, Act> = {
  gym: {
    slug: "gym", kcal_por_min: 6.0, stats_primary: ["FUE"], stats_secondary: ["VEL", "VIT"], dur: 60,
    metricas: (r) => ({ peso_kg: 40 + Math.round(r() * 40), reps: 8 + Math.round(r() * 6), sets: 3 + Math.round(r() * 2), tiempo_min: 55 + Math.round(r() * 15) }),
  },
  running: {
    slug: "running", kcal_por_min: 10.0, stats_primary: ["RES"], stats_secondary: ["VEL"], dur: 40,
    metricas: (r) => ({ distancia_km: 4 + Math.round(r() * 60) / 10, tiempo_min: 35 + Math.round(r() * 20) }),
  },
  ballet: {
    slug: "ballet", kcal_por_min: 6.5, stats_primary: ["FLEX", "EQU"], stats_secondary: ["RES"], dur: 75,
    metricas: (r) => ({ tiempo_min: 60 + Math.round(r() * 30), intensidad: 3 + Math.round(r() * 2) }),
  },
  pilates: {
    slug: "pilates", kcal_por_min: 4.0, stats_primary: ["FLEX", "EQU"], stats_secondary: ["FUE"], dur: 50,
    metricas: (r) => ({ tiempo_min: 45 + Math.round(r() * 20), intensidad: 3 + Math.round(r() * 2) }),
  },
};

type Rutina = { slug: string; freq: number }[];
type Miembro = {
  nombre: string; email: string; genero: "masculino" | "femenino";
  edad: number; peso: number; altura: number; objetivo: string; nivel_actividad: string;
};
type Duo = {
  grupo: string; tipo: "pareja" | "pequeno"; clase: string;
  semanas: number; consistencia: number; racha: number; rutina: Rutina; miembros: Miembro[];
};

const PW = "dovodemo2026";
const m = (nombre: string, email: string, genero: "masculino" | "femenino", edad: number, peso: number, altura: number, objetivo = "mantener", nivel_actividad = "activo"): Miembro =>
  ({ nombre, email, genero, edad, peso, altura, objetivo, nivel_actividad });

// 12 dúos (#10 = trío). Cuenta demo = #5 Híbridos, login demo+ivan@dovofit.com.
const DUOS: Duo[] = [
  { grupo: "Los Inquebrantables", tipo: "pareja", clase: "The Titan", semanas: 10, consistencia: 0.95, racha: 10, rutina: [{ slug: "gym", freq: 5 }], miembros: [m("Marco", "demo+marco@dovofit.com", "masculino", 34, 82, 178, "ganar_musculo"), m("Diego", "demo+diego@dovofit.com", "masculino", 29, 76, 175, "ganar_musculo")] },
  { grupo: "Ritmo y Asfalto", tipo: "pareja", clase: "The Marathoner", semanas: 10, consistencia: 0.92, racha: 9, rutina: [{ slug: "running", freq: 5 }], miembros: [m("Paty", "demo+paty@dovofit.com", "femenino", 31, 58, 165, "mejorar_resistencia"), m("Lucía", "demo+lucia@dovofit.com", "femenino", 27, 54, 160, "mejorar_resistencia")] },
  { grupo: "En Punta", tipo: "pareja", clase: "The Dancer", semanas: 9, consistencia: 0.90, racha: 8, rutina: [{ slug: "ballet", freq: 5 }], miembros: [m("Renata", "demo+renata@dovofit.com", "femenino", 24, 52, 168, "mantener"), m("Sofía", "demo+sofia@dovofit.com", "femenino", 26, 55, 170, "mantener")] },
  { grupo: "Núcleo Duro", tipo: "pareja", clase: "The Dancer", semanas: 8, consistencia: 0.88, racha: 7, rutina: [{ slug: "pilates", freq: 3 }, { slug: "gym", freq: 2 }], miembros: [m("Andrea", "demo+andrea@dovofit.com", "femenino", 33, 62, 164, "perder_grasa"), m("Caro", "demo+caro@dovofit.com", "femenino", 30, 59, 162, "perder_grasa")] },
  { grupo: "Híbridos", tipo: "pareja", clase: "The Athlete", semanas: 9, consistencia: 0.85, racha: 6, rutina: [{ slug: "gym", freq: 2 }, { slug: "running", freq: 2 }, { slug: "pilates", freq: 2 }], miembros: [m("Iván", "demo+ivan@dovofit.com", "masculino", 30, 80, 176, "ganar_musculo"), m("Tono", "demo+tono@dovofit.com", "masculino", 32, 84, 180, "ganar_musculo")] },
  { grupo: "Cinco Disciplinas", tipo: "pareja", clase: "The Pentathlete", semanas: 9, consistencia: 0.85, racha: 5, rutina: [{ slug: "gym", freq: 2 }, { slug: "running", freq: 1 }, { slug: "pilates", freq: 1 }, { slug: "ballet", freq: 1 }], miembros: [m("Beto", "demo+beto@dovofit.com", "masculino", 28, 74, 174, "mantener"), m("Nadia", "demo+nadia@dovofit.com", "femenino", 29, 60, 166, "mantener")] },
  { grupo: "Los del Cerro", tipo: "pareja", clase: "The Marathoner", semanas: 8, consistencia: 0.78, racha: 3, rutina: [{ slug: "running", freq: 4 }], miembros: [m("Hugo", "demo+hugo@dovofit.com", "masculino", 36, 79, 177, "mejorar_resistencia"), m("Memo", "demo+memo@dovofit.com", "masculino", 40, 85, 179, "mejorar_resistencia")] },
  { grupo: "Fierro Parejo", tipo: "pareja", clase: "The Titan", semanas: 8, consistencia: 0.75, racha: 3, rutina: [{ slug: "gym", freq: 4 }], miembros: [m("Saúl", "demo+saul@dovofit.com", "masculino", 27, 88, 182, "ganar_musculo"), m("Pedro", "demo+pedro@dovofit.com", "masculino", 31, 83, 178, "ganar_musculo")] },
  { grupo: "Empezando Fuerte", tipo: "pareja", clase: "The Dancer", semanas: 6, consistencia: 0.70, racha: 2, rutina: [{ slug: "pilates", freq: 4 }], miembros: [m("Mariana", "demo+mariana@dovofit.com", "femenino", 35, 68, 160, "perder_grasa", "moderado"), m("Lupe", "demo+lupe@dovofit.com", "femenino", 38, 71, 158, "perder_grasa", "moderado")] },
  { grupo: "Trío Norte", tipo: "pequeno", clase: "The Athlete", semanas: 7, consistencia: 0.72, racha: 2, rutina: [{ slug: "gym", freq: 3 }, { slug: "running", freq: 2 }], miembros: [m("Karla", "demo+karla@dovofit.com", "femenino", 26, 57, 163, "mantener"), m("Bruno", "demo+bruno@dovofit.com", "masculino", 33, 81, 176, "ganar_musculo"), m("Tavo", "demo+tavo@dovofit.com", "masculino", 30, 78, 175, "mantener")] },
  { grupo: "Las Domingueras", tipo: "pareja", clase: "The Marathoner", semanas: 4, consistencia: 0.55, racha: 1, rutina: [{ slug: "running", freq: 3 }], miembros: [m("Rocío", "demo+rocio@dovofit.com", "femenino", 28, 61, 167, "perder_grasa", "ligero"), m("Vale", "demo+vale@dovofit.com", "femenino", 25, 56, 164, "perder_grasa", "ligero")] },
  { grupo: "Recién Llegados", tipo: "pareja", clase: "Rookie", semanas: 2, consistencia: 0.60, racha: 0, rutina: [{ slug: "pilates", freq: 3 }], miembros: [m("Dani", "demo+dani@dovofit.com", "femenino", 24, 63, 166, "mantener", "ligero"), m("Pau", "demo+pau@dovofit.com", "femenino", 23, 59, 162, "mantener", "ligero")] },
];

// ── utilidades deterministas ──
let UID = 0;
const uuid = () => `10000000-0000-4000-8000-${(++UID).toString(16).padStart(12, "0")}`;
function rngFrom(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function bmr(peso: number, altura: number, edad: number, genero: string): number {
  const base = 10 * peso + 6.25 * altura - 5 * edad;
  if (genero === "masculino") return base + 5;
  if (genero === "femenino") return base - 161;
  return (base + 5 + (base - 161)) / 2;
}
const S = (v: string) => `'${v.replace(/'/g, "''")}'`;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// ── fechas: 2 semanas ISO hasta hoy (puebla leaderboard semanal + mensual) ──
const today = new Date();
const weekMon = (() => { const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())); const dow = d.getUTCDay(); d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow)); return d; })();
const prevMon = new Date(weekMon); prevMon.setUTCDate(prevMon.getUTCDate() - 7);

const out: string[] = [];
out.push("-- dovo · seed demo (idempotente). Generado por scripts/gen-seed-sql.ts");
out.push("-- ════════ DELETE (idempotente, por is_demo + email demo+%) ════════");
out.push("delete from core.tratos where is_demo;");
out.push("delete from core.user_character where user_id in (select id from core.users where email like 'demo+%@dovofit.com');");
out.push("delete from core.user_streak where user_id in (select id from core.users where email like 'demo+%@dovofit.com');");
out.push("delete from core.user_perfil_fisico where user_id in (select id from core.users where email like 'demo+%@dovofit.com');");
out.push("delete from core.users where email like 'demo+%@dovofit.com';");
out.push("delete from auth.identities where user_id in (select id from auth.users where email like 'demo+%@dovofit.com');");
out.push("delete from auth.users where email like 'demo+%@dovofit.com';");
out.push("-- ════════ INSERTS ════════");

const ACTSEL = (slug: string) => `(select id from core.actividades where slug='${slug}')`;

const retoMeta: { hibridos?: string; cinco?: string; inquebrantables?: string; fierro?: string; ritmo?: string; cerro?: string; ivan?: string; tono?: string; renata?: string; sofia?: string; ritmoTrato?: string } = {};

for (const duo of DUOS) {
  const tratoId = uuid();
  const memberRows = duo.miembros.map((mem, idx) => {
    const uid = uuid();
    const miembroId = uuid();
    const r = rngFrom(mem.email);
    const b = Math.round(bmr(mem.peso, mem.altura, mem.edad, mem.genero) * 100) / 100;

    // auth.users: la cuenta demo (login) lleva password+identity; el resto, fila mínima
    // (solo para satisfacer el FK core.users → auth.users; nunca inician sesión).
    const isLogin = mem.email === "demo+ivan@dovofit.com";
    if (isLogin) {
      out.push(`insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,is_super_admin,confirmation_token,recovery_token,email_change_token_new,email_change) values ('00000000-0000-0000-0000-000000000000',${S(uid)},'authenticated','authenticated',${S(mem.email)},extensions.crypt(${S(PW)},extensions.gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,${S(`{"nombre":"${mem.nombre}"}`)}::jsonb,false,'','','','');`);
      out.push(`insert into auth.identities (provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at,id) values (${S(uid)},${S(uid)},${S(`{"sub":"${uid}","email":"${mem.email}"}`)}::jsonb,'email',now(),now(),now(),gen_random_uuid());`);
    } else {
      out.push(`insert into auth.users (instance_id,id,aud,role,email,created_at,updated_at) values ('00000000-0000-0000-0000-000000000000',${S(uid)},'authenticated','authenticated',${S(mem.email)},now(),now());`);
    }
    out.push(`insert into core.users (id,email,nombre,access_channel) values (${S(uid)},${S(mem.email)},${S(mem.nombre)},'curated');`);
    out.push(`insert into core.user_perfil_fisico (user_id,peso_kg,altura_cm,edad,genero,nivel_actividad,objetivo,bmr_calculado) values (${S(uid)},${mem.peso},${mem.altura},${mem.edad},${S(mem.genero)},${S(mem.nivel_actividad)},${S(mem.objetivo)},${b});`);

    // character all-time: 1 semana de deltas * semanas activas
    const acc: StatDeltas = { fue: 0, res: 0, flex: 0, vel: 0, equ: 0, vit: 0 };
    for (const ra of duo.rutina) {
      const a = ACT[ra.slug];
      const nses = Math.round(ra.freq * duo.consistencia);
      for (let s = 0; s < nses; s++) {
        const met = a.metricas(r);
        const sc = calcularCheckin(a, met, { peso_kg: mem.peso, bmr: b }, a.dur);
        (Object.keys(acc) as (keyof StatDeltas)[]).forEach((k) => (acc[k] += sc.deltas[k]));
      }
    }
    const allTime: StatDeltas = { fue: 0, res: 0, flex: 0, vel: 0, equ: 0, vit: 0 };
    (Object.keys(acc) as (keyof StatDeltas)[]).forEach((k) => (allTime[k] = Math.round(acc[k] * duo.semanas * 100) / 100));
    const xp = Math.round(Object.values(allTime).reduce((s, v) => s + v, 0) * 100) / 100;
    const nivel = xp > 0 ? Math.floor(Math.sqrt(xp / 50)) + 1 : 1;
    out.push(`insert into core.user_character (user_id,fue,res,flex,vel,equ,vit,nivel,xp,prestige,class_name) values (${S(uid)},${allTime.fue},${allTime.res},${allTime.flex},${allTime.vel},${allTime.equ},${allTime.vit},${nivel},${xp},0,${S(duo.clase)});`);
    out.push(`insert into core.user_streak (user_id,current_streak_weeks,max_streak,last_cumplido_week) values (${S(uid)},${duo.racha},${duo.racha},${duo.racha > 0 ? S(isoDate(weekMon)) : "null"});`);

    return { uid, miembroId, mem, r, b };
  });

  // trato + miembros + rutinas
  const creador = memberRows[0].uid;
  out.push(`insert into core.tratos (id,nombre_grupo,tipo_grupo,estado,created_by,is_demo) values (${S(tratoId)},${S(duo.grupo)},${S(duo.tipo)},'activo',${S(creador)},true);`);
  out.push(`insert into core.trato_streak (trato_id,current_streak_weeks,max_streak,last_cumplido_week,last_evaluated_week) values (${S(tratoId)},${duo.racha},${duo.racha},${duo.racha > 0 ? S(isoDate(weekMon)) : "null"},${S(isoDate(weekMon))});`);
  memberRows.forEach((mr, idx) => {
    out.push(`insert into core.trato_miembros (id,trato_id,user_id,role) values (${S(mr.miembroId)},${S(tratoId)},${S(mr.uid)},${idx === 0 ? "'creator'" : "'member'"});`);
    const acts = duo.rutina.map((ra) => `jsonb_build_object('actividad_id',${ACTSEL(ra.slug)},'frecuencia_semanal',${ra.freq},'duracion_min',${ACT[ra.slug].dur})`).join(",");
    out.push(`insert into core.user_rutinas (miembro_id,nombre,is_default,actividades) values (${S(mr.miembroId)},'rutina',true,jsonb_build_array(${acts}));`);
  });

  // check-ins agregados: 1 por actividad/miembro para la semana actual (suma de sesiones).
  // Puebla el leaderboard semanal/mensual y los marcadores de reto con pocas filas.
  for (const mr of memberRows) {
    for (const ra of duo.rutina) {
      const a = ACT[ra.slug];
      const nses = Math.round(ra.freq * duo.consistencia);
      if (nses <= 0) continue;
      let pts = 0, kcal = 0;
      for (let s = 0; s < nses; s++) {
        const met = a.metricas(mr.r);
        const sc = calcularCheckin(a, met, { peso_kg: mr.mem.peso, bmr: mr.b }, a.dur);
        pts += sc.puntos; kcal += sc.kcal;
      }
      const d = new Date(weekMon); d.setUTCDate(d.getUTCDate() + 1);
      const fecha = d > today ? today : d;
      out.push(`insert into core.checkins (miembro_id,actividad_id,fecha,metricas,kcal_calculadas,puntos,puntos_base) values (${S(mr.miembroId)},${ACTSEL(a.slug)},${S(isoDate(fecha))},jsonb_build_object('sesiones',${nses}),${Math.round(kcal * 100) / 100},${pts},${pts});`);
    }
  }

  // guarda refs para retos/boosts
  if (duo.grupo === "Híbridos") { retoMeta.hibridos = tratoId; retoMeta.ivan = memberRows[0].uid; retoMeta.tono = memberRows[1].uid; }
  if (duo.grupo === "Cinco Disciplinas") retoMeta.cinco = tratoId;
  if (duo.grupo === "Los Inquebrantables") retoMeta.inquebrantables = tratoId;
  if (duo.grupo === "Fierro Parejo") retoMeta.fierro = tratoId;
  if (duo.grupo === "Ritmo y Asfalto") { retoMeta.ritmo = tratoId; retoMeta.ritmoTrato = tratoId; }
  if (duo.grupo === "Los del Cerro") retoMeta.cerro = tratoId;
  if (duo.grupo === "En Punta") { retoMeta.renata = memberRows[0].uid; retoMeta.sofia = memberRows[1].uid; }
}

// ── Retos demo ──
out.push("-- ════════ RETOS ════════");
const wkEnd = new Date(weekMon); wkEnd.setUTCDate(wkEnd.getUTCDate() + 7);
const prevEnd = new Date(weekMon);
// activo #1: Híbridos vs Cinco Disciplinas (lo ve la cuenta demo)
out.push(`insert into core.retos (trato_a,trato_b,periodo_inicio,periodo_fin,estado,creado_por) values (${S(retoMeta.hibridos!)},${S(retoMeta.cinco!)},${S(isoDate(weekMon))},${S(isoDate(wkEnd))},'activo',${S(retoMeta.ivan!)});`);
// activo #2: Inquebrantables vs Fierro Parejo
out.push(`insert into core.retos (trato_a,trato_b,periodo_inicio,periodo_fin,estado,creado_por) values (${S(retoMeta.inquebrantables!)},${S(retoMeta.fierro!)},${S(isoDate(weekMon))},${S(isoDate(wkEnd))},'activo',(select user_id from core.trato_miembros where trato_id=${S(retoMeta.inquebrantables!)} and role='creator' limit 1));`);
// cerrado: Ritmo y Asfalto venció a Los del Cerro (semana pasada)
out.push(`insert into core.retos (trato_a,trato_b,periodo_inicio,periodo_fin,estado,creado_por,ganador_trato_id) values (${S(retoMeta.ritmo!)},${S(retoMeta.cerro!)},${S(isoDate(prevMon))},${S(isoDate(prevEnd))},'cerrado',(select user_id from core.trato_miembros where trato_id=${S(retoMeta.ritmo!)} and role='creator' limit 1),${S(retoMeta.ritmo!)});`);

// ── Boosts demo ──
out.push("-- ════════ BOOSTS ════════");
const hace2d = new Date(today); hace2d.setUTCDate(hace2d.getUTCDate() - 2);
// Tono → Iván (energía, activa → badge en home de Iván)
out.push(`insert into core.boosts (de_user,para_user,trato_id,tipo,fecha_otorgado,fecha_expira,aplicado) values (${S(retoMeta.tono!)},${S(retoMeta.ivan!)},${S(retoMeta.hibridos!)},'energia',now() - interval '2 days',now() + interval '1 day',false);`);
// Sofía → Renata (escudo activo) en En Punta
out.push(`insert into core.boosts (de_user,para_user,trato_id,tipo,fecha_otorgado,fecha_expira,aplicado) select ${S(retoMeta.sofia!)},${S(retoMeta.renata!)},t.id,'escudo',now() - interval '1 day',now() + interval '6 days',false from core.tratos t where t.created_by=${S(retoMeta.renata!)} and t.is_demo limit 1;`);

const sql = out.join("\n") + "\n";
writeFileSync("scripts/seed-demo.sql", sql);
console.error(`seed: ${UID} uuids, ${out.length} statements, ${sql.length} bytes → scripts/seed-demo.sql`);
console.error(`demo login: demo+ivan@dovofit.com / ${PW}`);
