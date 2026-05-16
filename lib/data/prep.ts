import type { PrepTask, ProfileId } from "../types";

const p = (
  id: string,
  user: ProfileId | "shared",
  order: number,
  title: string,
  duration: string,
  content: string
): PrepTask => ({ id, user, order, title, duration, content });

export const PREP: PrepTask[] = [
  p("p1", "shared", 1, "Hervir huevos", "15 min",
    `**Cantidad:** 12 huevos

**Pasos:**
1. Olla con agua + 1 cda de sal. Pon huevos antes de hervir.
2. Cuando rompa el hervor, baja a fuego medio. **Cocina 10 min exactos**.
3. Pasa a tazón con agua fría con hielo 5 min.
4. Guarda **sin pelar** en tupper en refri. Duran 7 días.`),

  p("p2-mike", "mike", 2, "Overnight oats · Mike", "5 min",
    `**Cantidad:** 5 frascos

**Por frasco:** 50g avena + 150ml Lala 100 + 5g cacao + canela + stevia

Frascos con ingredientes secos, agrega líquido, tapa, agita. Al refri. **Duran 5 días.**`),

  p("p2-andy", "andy", 2, "Overnight oats · Andy", "5 min",
    `**Cantidad:** 5 frascos

**Por frasco:** 50g avena + 150ml leche soya + 5g cacao + canela + stevia

Frascos con ingredientes secos, agrega líquido, tapa, agita. Al refri. **Duran 5 días.**`),

  p("p3", "andy", 3, "Marinar tofu y seitán", "10 min",
    `**Cantidades:** 400g tofu + 300g seitán

**Marinada:** 4 cdas salsa soya · 3 cdas jugo limón · 1 cdita ajo en polvo · 1 cdita comino · 1 cdita orégano · pimienta · 1 cda aceite oliva

**Pasos:**
1. Tofu en cubos de 2 cm (sécalo bien). Seitán en tiras.
2. Mezcla marinada en tazón.
3. Reparte en 2 tuppers (uno tofu, otro seitán).
4. Refri. **Duran 5 días.**`),

  p("p4", "shared", 4, "Pre-cortar quesos", "5 min",
    `Panela en **cubos de 1 cm**, guarda en tupper.

Oaxaca **deshebrado a mano**, otro tupper.

Entre semana solo abres y sirves.`),
];

export function getPrepFor(user: ProfileId) {
  return PREP.filter((p) => p.user === user || p.user === "shared").sort(
    (a, b) => a.order - b.order
  );
}
