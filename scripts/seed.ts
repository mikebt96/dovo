/**
 * Seed completo del Carnet · dovo.
 * Idempotente — usa upsert con onConflict en todas las inserciones.
 * Correr: `npm run seed` (o `pnpm seed`)
 *
 * Cubre:
 *   - profiles (mike + andy con UUIDs deterministas)
 *   - streaks, xp, coins (1 fila por profile)
 *   - rewards_catalog (REWARDS_SEED → 27 entries)
 *   - penalties_catalog (PENALTIES_SEED)
 *   - products (catálogo canónico)
 *
 * NO toca: stores (ya está inline en migration 002), datos de logs
 * (meals_log, exercises_log, etc — esos son del usuario).
 */
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../lib/data/products";
import { REWARDS_SEED, PENALTIES_SEED } from "../lib/data/rewards";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// UUIDs deterministas — mismos que el INSERT del schema.sql.
// Si cambias estos, cambia también supabase/schema.sql al final del archivo.
const PROFILE_IDS = {
  mike: "11111111-1111-4111-8111-111111111111",
  andy: "22222222-2222-4222-8222-222222222222",
} as const;

type Slug = keyof typeof PROFILE_IDS;

async function seedProfiles(): Promise<Record<Slug, string>> {
  const rows = [
    {
      id: PROFILE_IDS.mike,
      slug: "mike",
      display_name: "Mike",
      color: "#6bf5ff",
      baseline_kcal: 2400,
      baseline_protein_g: 155,
      goal: "recomp",
      active_sports: ["gym", "caminadora"],
    },
    {
      id: PROFILE_IDS.andy,
      slug: "andy",
      display_name: "Andy",
      color: "#ff6b9d",
      baseline_kcal: 1750,
      baseline_protein_g: 115,
      goal: "recomp",
      active_sports: ["gym", "ballet", "pilates"],
    },
  ];

  const { error } = await sb.from("profiles").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(`profiles: ${error.message}`);

  // Confirma los UUIDs leyendo desde DB (por si alguien cambió el slug→id).
  const { data, error: selectError } = await sb
    .from("profiles")
    .select("id, slug")
    .in("slug", ["mike", "andy"]);
  if (selectError || !data) throw new Error(`profiles select: ${selectError?.message}`);

  const ids = {} as Record<Slug, string>;
  for (const row of data) {
    if (row.slug === "mike" || row.slug === "andy") {
      ids[row.slug as Slug] = row.id as string;
    }
  }
  if (!ids.mike || !ids.andy) {
    throw new Error("Faltan profiles mike/andy después del seed");
  }
  console.log(`  ✓ profiles: ${data.length}`);
  return ids;
}

async function seedGamification(profileIds: Record<Slug, string>) {
  const rows = (["mike", "andy"] as Slug[]).map((slug) => ({
    profile_id: profileIds[slug],
  }));

  const [streaks, xp, coins] = await Promise.all([
    sb.from("streaks").upsert(rows, { onConflict: "profile_id" }),
    sb.from("xp").upsert(rows, { onConflict: "profile_id" }),
    sb.from("coins").upsert(rows, { onConflict: "profile_id" }),
  ]);

  for (const [name, res] of [
    ["streaks", streaks],
    ["xp", xp],
    ["coins", coins],
  ] as const) {
    if (res.error) throw new Error(`${name}: ${res.error.message}`);
  }
  console.log(`  ✓ streaks/xp/coins: ${rows.length * 3} filas`);
}

async function seedRewards() {
  // rewards_catalog usa bigserial — no podemos upsert por id sin id en seed.
  // Estrategia: usamos nombre como dedupe key con onConflict en name + category.
  // Como NO tenemos UNIQUE en (name, category), un seed re-ejecutado SÍ duplica.
  // Trade-off: lo aceptamos en v1 (catálogo manual desde /tienda elimina dups);
  // o el usuario corre DELETE manual antes de reseed.
  //
  // Para evitar dups, primero borramos las filas con created_by NULL
  // (que es como dejamos las del seed).
  const { error: delErr } = await sb
    .from("rewards_catalog")
    .delete()
    .is("created_by", null);
  if (delErr) throw new Error(`rewards delete: ${delErr.message}`);

  const rows = REWARDS_SEED.map((r) => ({
    name: r.name,
    description: r.description ?? null,
    category: r.category,
    cost_coins: r.costCoins,
    requires_both: r.requiresBoth,
    active: true,
  }));
  const { error } = await sb.from("rewards_catalog").insert(rows);
  if (error) throw new Error(`rewards: ${error.message}`);
  console.log(`  ✓ rewards_catalog: ${rows.length}`);
}

async function seedPenalties() {
  // Mismo patrón que rewards: clear de seed-rows + insert.
  const { error: delErr } = await sb
    .from("penalties_catalog")
    .delete()
    .is("created_by", null);
  if (delErr) throw new Error(`penalties delete: ${delErr.message}`);

  const rows = PENALTIES_SEED.map((p) => ({
    name: p.name,
    description: p.description ?? null,
    category: p.category,
    severity: p.severity,
    active: true,
  }));
  const { error } = await sb.from("penalties_catalog").insert(rows);
  if (error) throw new Error(`penalties: ${error.message}`);
  console.log(`  ✓ penalties_catalog: ${rows.length}`);
}

async function seedProducts() {
  const rows = PRODUCTS.map((p) => ({
    id: p.id,
    canonical_name: p.canonicalName,
    category: p.category,
    unit: p.unit,
    unit_qty: p.unitQty,
    tags: p.tags,
    is_vegetarian: p.isVegetarian,
    is_vegan: p.isVegan,
    contains_dairy: p.containsDairy,
    contains_eggs: p.containsEggs,
    contains_gluten: p.containsGluten,
  }));
  const { error } = await sb
    .from("products")
    .upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`products: ${error.message}`);
  console.log(`  ✓ products: ${rows.length}`);
}

async function main() {
  console.log("📒 Seeding Carnet · dovo ...\n");

  console.log("→ profiles");
  const profileIds = await seedProfiles();

  console.log("→ gamification");
  await seedGamification(profileIds);

  console.log("→ rewards_catalog");
  await seedRewards();

  console.log("→ penalties_catalog");
  await seedPenalties();

  console.log("→ products");
  await seedProducts();

  console.log("\n✅ Seed completo.");
  console.log(`   mike: ${profileIds.mike}`);
  console.log(`   andy: ${profileIds.andy}`);
}

main().catch((err) => {
  console.error("\n❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
