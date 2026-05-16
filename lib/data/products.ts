import type { CanonicalProduct } from "../types";

/**
 * Catálogo canónico de productos. Cada `ShoppingItem.productId` apunta aquí.
 * Independiente de cada tienda — los aliases por-tienda van en `product_store_aliases`.
 */
const p = (
  id: string,
  canonicalName: string,
  category: string,
  unit: CanonicalProduct["unit"],
  unitQty: number,
  flags: Partial<Pick<CanonicalProduct,
    "isVegetarian" | "isVegan" | "containsDairy" | "containsEggs" | "containsGluten"
  >> = {},
  tags: string[] = []
): CanonicalProduct => ({
  id,
  canonicalName,
  category,
  unit,
  unitQty,
  tags,
  isVegetarian: flags.isVegetarian ?? true,
  isVegan: flags.isVegan ?? false,
  containsDairy: flags.containsDairy ?? false,
  containsEggs: flags.containsEggs ?? false,
  containsGluten: flags.containsGluten ?? false,
});

export const PRODUCTS: CanonicalProduct[] = [
  // Proteínas base
  p("huevo-18",          "Huevo blanco",            "Proteínas base",   "piezas", 18,  { containsEggs: true }),
  p("queso-panela-400",  "Queso panela",            "Proteínas base",   "g",      400, { containsDairy: true }),
  p("queso-oaxaca-250",  "Queso Oaxaca",            "Proteínas base",   "g",      250, { containsDairy: true }),
  p("frijoles-lata",     "Frijoles negros lata",    "Proteínas base",   "piezas", 2,   { isVegan: true }),

  // Lácteos / bebidas
  p("lala100-1l",        "Lala 100 light deslactosada","Lácteos",       "L",      1,   { containsDairy: true }),
  p("leche-avena-1l",    "Leche de avena",          "Lácteos",          "L",      1,   { isVegan: true }),
  p("leche-soya-1l",     "Leche de soya",           "Lácteos",          "L",      1,   { isVegan: true }),

  // Carbohidratos
  p("avena-500",         "Avena en hojuelas",       "Carbohidratos",    "g",      500, { isVegan: true }),
  p("tortillas-maiz-30", "Tortillas de maíz",       "Carbohidratos",    "piezas", 30,  { isVegan: true }),

  // Frutas y verduras
  p("platano-8",         "Plátano",                 "Frutas y verduras","piezas", 8,   { isVegan: true }),
  p("manzana-5",         "Manzana",                 "Frutas y verduras","piezas", 5,   { isVegan: true }),
  p("limon-8",           "Limón",                   "Frutas y verduras","piezas", 8,   { isVegan: true }),
  p("aguacate-3",        "Aguacate",                "Frutas y verduras","piezas", 3,   { isVegan: true }),
  p("cebolla-2",         "Cebolla",                 "Frutas y verduras","piezas", 2,   { isVegan: true }),
  p("tomate-4",          "Tomate",                  "Frutas y verduras","piezas", 4,   { isVegan: true }),
  p("cilantro-manojo",   "Cilantro",                "Frutas y verduras","piezas", 1,   { isVegan: true }),
  p("espinacas-bolsa",   "Espinacas bolsa",         "Frutas y verduras","piezas", 1,   { isVegan: true }),
  p("fresas-caja",       "Fresas",                  "Frutas y verduras","piezas", 1,   { isVegan: true }),

  // Salsas
  p("valentina-botella", "Valentina/Tajín",         "Salsas",           "piezas", 1,   { isVegan: true }),
  p("salsa-verde-frasco","Salsa verde molcajete",   "Salsas",           "piezas", 1,   { isVegan: true }),
  p("sal-mar",           "Sal de mar/Himalaya",     "Salsas",           "piezas", 1,   { isVegan: true }),
  p("salsa-soya",        "Salsa de soya",           "Salsas",           "piezas", 1,   { isVegan: true }),

  // Extras
  p("cacao-100",         "Cacao en polvo sin azúcar","Extras",          "g",      100, { isVegan: true }),
  p("canela-frasco",     "Canela en polvo",         "Extras",           "piezas", 1,   { isVegan: true }),
  p("almendras-100",     "Almendras sin sal",       "Extras",           "g",      100, { isVegan: true }),
  p("stevia-frasco",     "Stevia líquida",          "Extras",           "piezas", 1,   { isVegan: true }),

  // Proteína vegetal
  p("tofu-firme-400",    "Tofu firme",              "Proteína vegetal", "g",      400, { isVegan: true }),
  p("seitan-300",        "Seitán",                  "Proteína vegetal", "g",      300, { isVegan: true, containsGluten: true }),
];

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

/** Productos compatibles con un dietary profile dado. */
export function filterProductsForDiet(
  products: CanonicalProduct[],
  opts: {
    isVegan?: boolean;
    isVegetarian?: boolean;
    noGluten?: boolean;
    noDairy?: boolean;
    noEggs?: boolean;
  }
): CanonicalProduct[] {
  return products.filter((p) => {
    if (opts.isVegan && !p.isVegan) return false;
    if (opts.isVegetarian && !p.isVegetarian) return false;
    if (opts.noGluten && p.containsGluten) return false;
    if (opts.noDairy && p.containsDairy) return false;
    if (opts.noEggs && p.containsEggs) return false;
    return true;
  });
}
