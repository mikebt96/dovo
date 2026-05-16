/**
 * Seed de catálogo canónico de productos + stores.
 * Idempotente — usa upsert. Correr: `pnpm seed`.
 */
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../lib/data/products";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(`📦 Seeding ${PRODUCTS.length} productos canónicos...`);

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

  const { error } = await sb.from("products").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("❌ Error sembrando productos:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${rows.length} productos sembrados.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
