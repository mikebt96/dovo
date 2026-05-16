import type { ShoppingItem, ProfileId } from "../types";

const s = (
  id: string,
  user: ProfileId | "shared",
  store: "walmart" | "vegetariana",
  category: string,
  name: string,
  qty: string,
  priceMxn: number,
  productId?: string,
  subtitle?: string
): ShoppingItem => ({ id, user, store, category, name, qty, priceMxn, productId, subtitle });

export const SHOPPING: ShoppingItem[] = [
  // ==================== WALMART · Proteínas base ====================
  s("s1", "shared", "walmart", "Proteínas base", "Huevo", "18 piezas", 60, "huevo-18"),
  s("s2", "shared", "walmart", "Proteínas base", "Queso panela", "400 g", 55, "queso-panela-400", "Cubos para tortillas y snack"),
  s("s3", "shared", "walmart", "Proteínas base", "Queso Oaxaca", "250 g", 45, "queso-oaxaca-250", "Para deshebrar"),
  s("s4", "shared", "walmart", "Proteínas base", "Frijoles negros de lata", "2 latas", 40, "frijoles-lata"),

  // ==================== Lácteos / Bebidas ====================
  s("s5", "mike", "walmart", "Lácteos", "Lala 100 light deslactosada", "1 L", 30, "lala100-1l", "Para Mike · alta en proteína"),
  s("s6", "mike", "walmart", "Lácteos", "Leche de avena", "1 L", 40, "leche-avena-1l", "Alternativa Mike"),
  s("s7", "andy", "walmart", "Lácteos", "Leche de soya", "1 L", 35, "leche-soya-1l", "Para Andy"),

  // ==================== Carbohidratos ====================
  s("s8", "shared", "walmart", "Carbohidratos", "Avena en hojuelas", "500 g", 30, "avena-500"),
  s("s9", "shared", "walmart", "Carbohidratos", "Tortillas de maíz", "30 piezas", 25, "tortillas-maiz-30", "De maíz, no harina"),

  // ==================== Frutas y verduras ====================
  s("s10", "shared", "walmart", "Frutas y verduras", "Plátano", "8 piezas", 30, "platano-8"),
  s("s11", "shared", "walmart", "Frutas y verduras", "Manzana", "5 piezas", 30, "manzana-5"),
  s("s12", "andy", "walmart", "Frutas y verduras", "Limón", "8 piezas", 15, "limon-8", "Clave para Andy"),
  s("s13", "shared", "walmart", "Frutas y verduras", "Aguacate", "3 piezas", 45, "aguacate-3"),
  s("s14", "shared", "walmart", "Frutas y verduras", "Cebolla", "2 piezas", 10, "cebolla-2"),
  s("s15", "shared", "walmart", "Frutas y verduras", "Tomate", "4 piezas", 20, "tomate-4"),
  s("s16", "shared", "walmart", "Frutas y verduras", "Cilantro", "1 manojo", 10, "cilantro-manojo"),
  s("s17", "shared", "walmart", "Frutas y verduras", "Espinacas", "1 bolsa", 25, "espinacas-bolsa"),
  s("s18", "shared", "walmart", "Frutas y verduras", "Fresas o zarzamoras", "1 caja", 35, "fresas-caja"),

  // ==================== Salsas Andy ====================
  s("s19", "andy", "walmart", "Salsas e infaltables", "Valentina o Tajín", "1 botella", 25, "valentina-botella"),
  s("s20", "shared", "walmart", "Salsas e infaltables", "Salsa verde molcajete", "1 frasco", 30, "salsa-verde-frasco"),
  s("s21", "shared", "walmart", "Salsas e infaltables", "Sal de mar o himalaya", "1 paquete", 25, "sal-mar"),
  s("s22", "andy", "walmart", "Salsas e infaltables", "Salsa de soya", "1 botella chica", 35, "salsa-soya", "Marinar tofu y seitán"),

  // ==================== Extras ====================
  s("s23", "shared", "walmart", "Extras / Saborizantes", "Cacao en polvo sin azúcar", "100 g", 35, "cacao-100"),
  s("s24", "shared", "walmart", "Extras / Saborizantes", "Canela en polvo", "1 frasco", 25, "canela-frasco"),
  s("s25", "shared", "walmart", "Extras / Saborizantes", "Almendras sin sal", "100 g", 30, "almendras-100"),
  s("s26", "shared", "walmart", "Extras / Saborizantes", "Stevia líquida o miel", "1 frasco", 40, "stevia-frasco"),

  // ==================== Vegetariana (Andy) ====================
  s("s27", "andy", "vegetariana", "Proteína vegetal Andy", "Tofu firme", "400 g", 60, "tofu-firme-400", "Buscar primero Mori-Nu Walmart"),
  s("s28", "andy", "vegetariana", "Proteína vegetal Andy", "Seitán", "300 g", 75, "seitan-300", "Marinado o natural"),
];

export function getShoppingFor(user: ProfileId | "all") {
  if (user === "all") return SHOPPING;
  return SHOPPING.filter((s) => s.user === user || s.user === "shared");
}

export function totalCost(items: ShoppingItem[]) {
  return items.reduce((sum, i) => sum + i.priceMxn, 0);
}
