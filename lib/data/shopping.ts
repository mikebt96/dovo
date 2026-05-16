import type { ShoppingItem, ProfileId } from "../types";

const s = (
  id: string,
  user: ProfileId | "shared",
  store: "walmart" | "vegetariana",
  category: string,
  name: string,
  qty: string,
  priceMxn: number,
  subtitle?: string
): ShoppingItem => ({ id, user, store, category, name, qty, priceMxn, subtitle });

export const SHOPPING: ShoppingItem[] = [
  // ==================== WALMART · Proteínas base ====================
  s("s1", "shared", "walmart", "Proteínas base", "Huevo", "18 piezas", 60),
  s("s2", "shared", "walmart", "Proteínas base", "Queso panela", "400 g", 55, "Cubos para tortillas y snack"),
  s("s3", "shared", "walmart", "Proteínas base", "Queso Oaxaca", "250 g", 45, "Para deshebrar"),
  s("s4", "shared", "walmart", "Proteínas base", "Frijoles negros de lata", "2 latas", 40),

  // ==================== Lácteos / Bebidas ====================
  s("s5", "mike", "walmart", "Lácteos", "Lala 100 light deslactosada", "1 L", 30, "Para Mike · alta en proteína"),
  s("s6", "mike", "walmart", "Lácteos", "Leche de avena", "1 L", 40, "Alternativa Mike"),
  s("s7", "andy", "walmart", "Lácteos", "Leche de soya", "1 L", 35, "Para Andy"),

  // ==================== Carbohidratos ====================
  s("s8", "shared", "walmart", "Carbohidratos", "Avena en hojuelas", "500 g", 30),
  s("s9", "shared", "walmart", "Carbohidratos", "Tortillas de maíz", "30 piezas", 25, "De maíz, no harina"),

  // ==================== Frutas y verduras ====================
  s("s10", "shared", "walmart", "Frutas y verduras", "Plátano", "8 piezas", 30),
  s("s11", "shared", "walmart", "Frutas y verduras", "Manzana", "5 piezas", 30),
  s("s12", "andy", "walmart", "Frutas y verduras", "Limón", "8 piezas", 15, "Clave para Andy"),
  s("s13", "shared", "walmart", "Frutas y verduras", "Aguacate", "3 piezas", 45),
  s("s14", "shared", "walmart", "Frutas y verduras", "Cebolla", "2 piezas", 10),
  s("s15", "shared", "walmart", "Frutas y verduras", "Tomate", "4 piezas", 20),
  s("s16", "shared", "walmart", "Frutas y verduras", "Cilantro", "1 manojo", 10),
  s("s17", "shared", "walmart", "Frutas y verduras", "Espinacas", "1 bolsa", 25),
  s("s18", "shared", "walmart", "Frutas y verduras", "Fresas o zarzamoras", "1 caja", 35),

  // ==================== Salsas Andy ====================
  s("s19", "andy", "walmart", "Salsas e infaltables", "Valentina o Tajín", "1 botella", 25),
  s("s20", "shared", "walmart", "Salsas e infaltables", "Salsa verde molcajete", "1 frasco", 30),
  s("s21", "shared", "walmart", "Salsas e infaltables", "Sal de mar o himalaya", "1 paquete", 25),
  s("s22", "andy", "walmart", "Salsas e infaltables", "Salsa de soya", "1 botella chica", 35, "Marinar tofu y seitán"),

  // ==================== Extras ====================
  s("s23", "shared", "walmart", "Extras / Saborizantes", "Cacao en polvo sin azúcar", "100 g", 35),
  s("s24", "shared", "walmart", "Extras / Saborizantes", "Canela en polvo", "1 frasco", 25),
  s("s25", "shared", "walmart", "Extras / Saborizantes", "Almendras sin sal", "100 g", 30),
  s("s26", "shared", "walmart", "Extras / Saborizantes", "Stevia líquida o miel", "1 frasco", 40),

  // ==================== Vegetariana (Andy) ====================
  s("s27", "andy", "vegetariana", "Proteína vegetal Andy", "Tofu firme", "400 g", 60, "Buscar primero Mori-Nu Walmart"),
  s("s28", "andy", "vegetariana", "Proteína vegetal Andy", "Seitán", "300 g", 75, "Marinado o natural"),
];

export function getShoppingFor(user: ProfileId | "all") {
  if (user === "all") return SHOPPING;
  return SHOPPING.filter((s) => s.user === user || s.user === "shared");
}

export function totalCost(items: ShoppingItem[]) {
  return items.reduce((sum, i) => sum + i.priceMxn, 0);
}
