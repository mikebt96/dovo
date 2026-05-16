import type { ShoppingItem, ProfileId } from "../types";

const s = (
  id: string,
  user: ProfileId | "shared",
  category: string,
  name: string,
  qty: string,
  priceMxn: number,
  productId?: string,
  subtitle?: string
): ShoppingItem => ({ id, user, category, name, qty, priceMxn, productId, subtitle });

export const SHOPPING: ShoppingItem[] = [
  // ==================== Proteínas base ====================
  s("s1", "shared", "Proteínas base", "Huevo", "18 piezas", 60, "huevo-18"),
  s("s2", "shared", "Proteínas base", "Queso panela", "400 g", 55, "queso-panela-400", "Cubos para tortillas y snack"),
  s("s3", "shared", "Proteínas base", "Queso Oaxaca", "250 g", 45, "queso-oaxaca-250", "Para deshebrar"),
  s("s4", "shared", "Proteínas base", "Frijoles negros de lata", "2 latas", 40, "frijoles-lata"),

  // ==================== Lácteos / Bebidas ====================
  s("s5", "mike", "Lácteos", "Lala 100 light deslactosada", "1 L", 30, "lala100-1l", "Para Mike · alta en proteína"),
  s("s6", "mike", "Lácteos", "Leche de avena", "1 L", 40, "leche-avena-1l", "Alternativa Mike"),
  s("s7", "andy", "Lácteos", "Leche de soya", "1 L", 35, "leche-soya-1l", "Para Andy"),

  // ==================== Carbohidratos ====================
  s("s8", "shared", "Carbohidratos", "Avena en hojuelas", "500 g", 30, "avena-500"),
  s("s9", "shared", "Carbohidratos", "Tortillas de maíz", "30 piezas", 25, "tortillas-maiz-30", "De maíz, no harina"),

  // ==================== Frutas y verduras ====================
  s("s10", "shared", "Frutas y verduras", "Plátano", "8 piezas", 30, "platano-8"),
  s("s11", "shared", "Frutas y verduras", "Manzana", "5 piezas", 30, "manzana-5"),
  s("s12", "andy", "Frutas y verduras", "Limón", "8 piezas", 15, "limon-8", "Clave para Andy"),
  s("s13", "shared", "Frutas y verduras", "Aguacate", "3 piezas", 45, "aguacate-3"),
  s("s14", "shared", "Frutas y verduras", "Cebolla", "2 piezas", 10, "cebolla-2"),
  s("s15", "shared", "Frutas y verduras", "Tomate", "4 piezas", 20, "tomate-4"),
  s("s16", "shared", "Frutas y verduras", "Cilantro", "1 manojo", 10, "cilantro-manojo"),
  s("s17", "shared", "Frutas y verduras", "Espinacas", "1 bolsa", 25, "espinacas-bolsa"),
  s("s18", "shared", "Frutas y verduras", "Fresas o zarzamoras", "1 caja", 35, "fresas-caja"),

  // ==================== Salsas e infaltables ====================
  s("s19", "andy", "Salsas e infaltables", "Valentina o Tajín", "1 botella", 25, "valentina-botella"),
  s("s20", "shared", "Salsas e infaltables", "Salsa verde molcajete", "1 frasco", 30, "salsa-verde-frasco"),
  s("s21", "shared", "Salsas e infaltables", "Sal de mar o himalaya", "1 paquete", 25, "sal-mar"),
  s("s22", "andy", "Salsas e infaltables", "Salsa de soya", "1 botella chica", 35, "salsa-soya", "Marinar tofu y seitán"),

  // ==================== Extras / Saborizantes ====================
  s("s23", "shared", "Extras / Saborizantes", "Cacao en polvo sin azúcar", "100 g", 35, "cacao-100"),
  s("s24", "shared", "Extras / Saborizantes", "Canela en polvo", "1 frasco", 25, "canela-frasco"),
  s("s25", "shared", "Extras / Saborizantes", "Almendras sin sal", "100 g", 30, "almendras-100"),
  s("s26", "shared", "Extras / Saborizantes", "Stevia líquida o miel", "1 frasco", 40, "stevia-frasco"),

  // ==================== Proteína vegetal (Andy) ====================
  s("s27", "andy", "Proteína vegetal", "Tofu firme", "400 g", 60, "tofu-firme-400", "Buscar Mori-Nu en Walmart"),
  s("s28", "andy", "Proteína vegetal", "Seitán", "300 g", 75, "seitan-300", "Marinado o natural"),
];

export function getShoppingFor(user: ProfileId | "all") {
  if (user === "all") return SHOPPING;
  return SHOPPING.filter((s) => s.user === user || s.user === "shared");
}

export function totalCost(items: ShoppingItem[]) {
  return items.reduce((sum, i) => sum + i.priceMxn, 0);
}

/** Orden canónico de categorías para mostrar en el super page (orden de pasillo). */
export const CATEGORY_ORDER: string[] = [
  "Proteínas base",
  "Proteína vegetal",
  "Lácteos",
  "Carbohidratos",
  "Frutas y verduras",
  "Salsas e infaltables",
  "Extras / Saborizantes",
];
