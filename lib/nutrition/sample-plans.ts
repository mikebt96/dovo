import type {
  Comida,
  DiaPlan,
  DuoNutricion,
  MealPlanContent,
  NutritionProfile,
  PasilloSuper,
  PerfilFisico,
  Restriccion,
  TipoComida,
} from "./types";
import { macrosObjetivo } from "./macros";

// PLAN BASE determinista (fail-soft de F5): plantillas hechas a mano con platillos
// mexicanos reales y macros plausibles — NUNCA lorem, NUNCA 500. Tres plantillas por
// rumbo calórico (déficit / mantenimiento / superávit) con pools por tipo de comida que
// rotan en 7 días (misma entrada ⇒ mismo plan). Si hay restricción vegetariana/vegana se
// swapean los platillos con carne por el pool veggie. Los macros OBJETIVO del header sí
// son personales (fórmula sobre el perfil físico real); los platillos personalizados son
// exactamente lo que desbloquea la IA ("plan base — activa IA para personalización").

type Plato = Omit<Comida, "tipo"> & { carne?: boolean };

type Plantilla = {
  desayunos: Plato[];
  comidas: Plato[];
  cenas: Plato[];
  snacks: Plato[];
  swapVeg: { comidas: Plato[]; cenas: Plato[] };
  listaSuper: PasilloSuper[];
  nota: string;
};

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

// ── Plantilla DÉFICIT (perder_grasa): alta proteína, volumen, kcal contenidas ──
const DEFICIT: Plantilla = {
  desayunos: [
    { nombre: "Huevos a la mexicana + tortilla de nopal", descripcion: "2 huevos con jitomate, cebolla y serrano; 2 tortillas de nopal.", kcal: 340, prot: 22, carb: 24, grasa: 16 },
    { nombre: "Avena con fresas y claras", descripcion: "40 g de avena cocida con canela, 3 claras revueltas aparte.", kcal: 310, prot: 21, carb: 42, grasa: 6 },
    { nombre: "Tostadas de requesón y pepino", descripcion: "2 tostadas horneadas con requesón, pepino y chile en polvo.", kcal: 290, prot: 18, carb: 34, grasa: 9 },
    { nombre: "Licuado verde con proteína", descripcion: "Espinaca, piña, jengibre y un scoop de proteína en agua.", kcal: 250, prot: 27, carb: 28, grasa: 3 },
  ],
  comidas: [
    { nombre: "Pechuga a la plancha con ensalada de nopales", descripcion: "150 g de pechuga, nopales asados, jitomate, cebolla morada y limón.", kcal: 420, prot: 45, carb: 22, grasa: 16, carne: true },
    { nombre: "Caldo de pollo deshebrado con verduras", descripcion: "Caldo desgrasado con calabaza, chayote, zanahoria y 120 g de pollo.", kcal: 380, prot: 38, carb: 28, grasa: 12, carne: true },
    { nombre: "Tacos de pescado a la plancha", descripcion: "3 tortillas de maíz con pescado blanco, col morada y pico de gallo.", kcal: 430, prot: 36, carb: 42, grasa: 13, carne: true },
    { nombre: "Tinga de pollo con arroz integral", descripcion: "120 g de tinga (poco aceite) con 1/2 taza de arroz integral.", kcal: 450, prot: 37, carb: 46, grasa: 13, carne: true },
    { nombre: "Bowl de atún con frijoles", descripcion: "1 lata de atún en agua, frijoles de olla, elote, jitomate y aguacate.", kcal: 440, prot: 40, carb: 40, grasa: 14, carne: true },
  ],
  cenas: [
    { nombre: "Sopa de lentejas con queso panela", descripcion: "Lentejas guisadas con verdura y 40 g de panela asada.", kcal: 360, prot: 26, carb: 42, grasa: 10 },
    { nombre: "Quesadillas de champiñón en comal", descripcion: "2 tortillas de maíz, quesillo ligero y champiñones al epazote.", kcal: 340, prot: 19, carb: 36, grasa: 14 },
    { nombre: "Ensalada de pollo y aguacate", descripcion: "100 g de pollo, lechuga, pepino, 1/4 de aguacate y vinagreta de limón.", kcal: 350, prot: 32, carb: 14, grasa: 19, carne: true },
    { nombre: "Molletes integrales con pico de gallo", descripcion: "1 bolillo integral, frijoles, poco queso y pico de gallo.", kcal: 380, prot: 20, carb: 52, grasa: 11 },
  ],
  snacks: [
    { nombre: "Jícama con chile y limón", descripcion: "1 taza de jícama en bastones.", kcal: 90, prot: 2, carb: 21, grasa: 0 },
    { nombre: "Yogurt griego natural", descripcion: "150 g de yogurt griego sin azúcar con canela.", kcal: 130, prot: 15, carb: 8, grasa: 4 },
    { nombre: "Puño de cacahuate natural", descripcion: "25 g de cacahuate sin sal.", kcal: 150, prot: 7, carb: 5, grasa: 12 },
  ],
  swapVeg: {
    comidas: [
      { nombre: "Bowl de garbanzo al chipotle", descripcion: "Garbanzos guisados al chipotle con arroz integral y aguacate.", kcal: 430, prot: 19, carb: 58, grasa: 14 },
      { nombre: "Chiles rellenos de queso al horno", descripcion: "2 poblanos con panela, caldillo de jitomate, sin capear.", kcal: 410, prot: 24, carb: 28, grasa: 22 },
      { nombre: "Tacos de coliflor al pastor", descripcion: "3 tortillas con coliflor marinada al pastor, piña y cilantro.", kcal: 390, prot: 12, carb: 56, grasa: 14 },
    ],
    cenas: [
      { nombre: "Sopa azteca ligera sin pollo", descripcion: "Caldillo de jitomate, tiras horneadas, aguacate y panela.", kcal: 340, prot: 15, carb: 38, grasa: 15 },
      { nombre: "Ensalada de quinoa y frijol negro", descripcion: "Quinoa, frijol, elote, pimiento y limón.", kcal: 370, prot: 16, carb: 56, grasa: 9 },
    ],
  },
  listaSuper: [
    { pasillo: "frutas y verduras", items: ["nopales", "jitomate", "cebolla", "espinaca", "calabaza", "chayote", "jícama", "pepino", "lechuga", "aguacate", "fresas", "piña", "limón"] },
    { pasillo: "proteínas", items: ["pechuga de pollo", "pescado blanco", "atún en agua", "huevo", "queso panela", "requesón", "yogurt griego"] },
    { pasillo: "abarrotes", items: ["tortilla de maíz", "avena", "lentejas", "frijol", "arroz integral", "tostadas horneadas", "cacahuate natural", "chipotle"] },
  ],
  nota: "Déficit moderado: prioriza proteína en cada comida y verdura de volumen para llegar saciado al final del día.",
};

// ── Plantilla MANTENIMIENTO (mantener / mejorar_resistencia): balanceada, carbohidrato útil ──
const MANTENIMIENTO: Plantilla = {
  desayunos: [
    { nombre: "Chilaquiles verdes con huevo", descripcion: "Totopos horneados, salsa verde, 2 huevos y crema ligera.", kcal: 460, prot: 24, carb: 48, grasa: 19 },
    { nombre: "Avena con plátano y crema de cacahuate", descripcion: "50 g de avena, 1 plátano, 1 cda de crema de cacahuate.", kcal: 430, prot: 14, carb: 64, grasa: 14 },
    { nombre: "Molletes con frijol y queso", descripcion: "1 bolillo, frijoles refritos ligeros, queso gratinado y pico de gallo.", kcal: 470, prot: 22, carb: 62, grasa: 15 },
    { nombre: "Smoothie de mango con yogurt y granola", descripcion: "Mango, yogurt natural, 30 g de granola.", kcal: 390, prot: 15, carb: 62, grasa: 9 },
  ],
  comidas: [
    { nombre: "Arroz con pollo a la mexicana", descripcion: "150 g de pollo, arroz rojo, chícharo y zanahoria.", kcal: 560, prot: 42, carb: 60, grasa: 16, carne: true },
    { nombre: "Enchiladas verdes (3) con pollo", descripcion: "3 enchiladas con pollo deshebrado, crema ligera y panela.", kcal: 540, prot: 36, carb: 52, grasa: 20, carne: true },
    { nombre: "Pozole rojo de pollo (1 plato)", descripcion: "Maíz pozolero, pollo, rábano, lechuga y tostada horneada.", kcal: 520, prot: 35, carb: 58, grasa: 15, carne: true },
    { nombre: "Pescado a la veracruzana con arroz", descripcion: "Filete en salsa de jitomate, aceituna y alcaparra; arroz blanco.", kcal: 510, prot: 38, carb: 48, grasa: 17, carne: true },
    { nombre: "Tortas de milanesa de pollo (1 chica)", descripcion: "Bolillo, milanesa delgada, aguacate, jitomate; al comal.", kcal: 580, prot: 38, carb: 58, grasa: 21, carne: true },
  ],
  cenas: [
    { nombre: "Tacos de frijol con queso (3)", descripcion: "Tortilla de maíz, frijol refrito ligero, queso fresco y salsa.", kcal: 430, prot: 19, carb: 58, grasa: 14 },
    { nombre: "Sándwich de pavo con aguacate", descripcion: "Pan integral, 80 g de pavo, aguacate, jitomate.", kcal: 410, prot: 28, carb: 42, grasa: 15, carne: true },
    { nombre: "Sopes de pollo (2)", descripcion: "2 sopes con pollo, frijol, lechuga, crema ligera.", kcal: 450, prot: 30, carb: 48, grasa: 16, carne: true },
    { nombre: "Omelette de espinaca con queso", descripcion: "3 huevos, espinaca, queso Oaxaca; 1 tortilla.", kcal: 420, prot: 30, carb: 18, grasa: 26 },
  ],
  snacks: [
    { nombre: "Plátano con crema de cacahuate", descripcion: "1 plátano + 1 cda de crema de cacahuate.", kcal: 200, prot: 5, carb: 32, grasa: 8 },
    { nombre: "Yogurt con granola", descripcion: "150 g de yogurt natural + 20 g de granola.", kcal: 190, prot: 9, carb: 26, grasa: 6 },
    { nombre: "Fruta de temporada con tajín", descripcion: "1.5 tazas de sandía/mango/papaya.", kcal: 120, prot: 2, carb: 30, grasa: 0 },
  ],
  swapVeg: {
    comidas: [
      { nombre: "Enfrijoladas con queso (3)", descripcion: "Tortillas bañadas en frijol, queso fresco, crema ligera y cebolla.", kcal: 520, prot: 23, carb: 64, grasa: 19 },
      { nombre: "Arroz a la jardinera con huevo", descripcion: "Arroz rojo con verduras y 2 huevos estrellados sin freír de más.", kcal: 510, prot: 22, carb: 62, grasa: 18 },
      { nombre: "Tlacoyos de requesón con nopales (2)", descripcion: "Tlacoyos al comal con nopales, salsa y queso rallado.", kcal: 480, prot: 21, carb: 66, grasa: 14 },
    ],
    cenas: [
      { nombre: "Quesadillas de flor de calabaza (3)", descripcion: "Tortilla de maíz, quesillo y flor de calabaza al comal.", kcal: 430, prot: 21, carb: 48, grasa: 17 },
      { nombre: "Tostadas de frijol y aguacate (2)", descripcion: "Tostadas horneadas, frijol, aguacate, col y salsa.", kcal: 400, prot: 13, carb: 50, grasa: 17 },
    ],
  },
  listaSuper: [
    { pasillo: "frutas y verduras", items: ["plátano", "mango", "jitomate", "lechuga", "espinaca", "aguacate", "rábano", "calabaza", "chícharo", "zanahoria", "limón"] },
    { pasillo: "proteínas", items: ["pechuga de pollo", "pavo", "pescado blanco", "huevo", "queso fresco", "queso Oaxaca", "yogurt natural"] },
    { pasillo: "abarrotes", items: ["tortilla de maíz", "bolillo/pan integral", "avena", "arroz", "frijol", "maíz pozolero", "granola", "crema de cacahuate", "salsa verde"] },
  ],
  nota: "Mantenimiento con carbohidrato útil alrededor del entrenamiento: come parejo, no perfecto.",
};

// ── Plantilla SUPERÁVIT (ganar_musculo): densa, proteína alta, comidas completas ──
const SUPERAVIT: Plantilla = {
  desayunos: [
    { nombre: "Huevos revueltos con jamón de pavo + avena", descripcion: "3 huevos con 60 g de pavo; 50 g de avena con plátano.", kcal: 620, prot: 38, carb: 58, grasa: 24, carne: true },
    { nombre: "Hotcakes de avena con fruta y yogurt", descripcion: "3 hotcakes de avena/plátano, yogurt griego y miel.", kcal: 580, prot: 28, carb: 78, grasa: 16 },
    { nombre: "Burrito de huevo y frijol (2)", descripcion: "2 tortillas de harina, 3 huevos, frijol, aguacate.", kcal: 640, prot: 30, carb: 64, grasa: 28 },
    { nombre: "Licuado de avena, plátano y proteína", descripcion: "Leche, 40 g de avena, plátano, scoop de proteína, cacahuate.", kcal: 560, prot: 38, carb: 66, grasa: 16 },
  ],
  comidas: [
    { nombre: "Bistec a la mexicana con arroz y frijol", descripcion: "180 g de res, arroz rojo, frijoles de olla y tortillas.", kcal: 720, prot: 48, carb: 68, grasa: 26, carne: true },
    { nombre: "Pollo en mole con arroz (1 pieza grande)", descripcion: "Pierna y muslo, mole, arroz, ajonjolí.", kcal: 700, prot: 42, carb: 62, grasa: 30, carne: true },
    { nombre: "Tacos de bistec con frijoles charros (4)", descripcion: "4 tacos en tortilla de maíz + 1 taza de charros.", kcal: 740, prot: 46, carb: 70, grasa: 28, carne: true },
    { nombre: "Salmón a la plancha con pasta", descripcion: "160 g de salmón, pasta al ajo con aceite de oliva, ensalada.", kcal: 680, prot: 42, carb: 60, grasa: 28, carne: true },
    { nombre: "Milanesa de res con puré y verdura", descripcion: "160 g de milanesa, puré de papa, ejotes.", kcal: 690, prot: 45, carb: 58, grasa: 28, carne: true },
  ],
  cenas: [
    { nombre: "Quesadillas de pollo con aguacate (3)", descripcion: "3 quesadillas con pollo y quesillo, aguacate.", kcal: 580, prot: 38, carb: 48, grasa: 26, carne: true },
    { nombre: "Bowl de arroz, huevo y frijol", descripcion: "Arroz, 2 huevos, frijol, aguacate y salsa macha.", kcal: 560, prot: 26, carb: 62, grasa: 24 },
    { nombre: "Torta de pierna ligera", descripcion: "Bolillo, pierna deshebrada, frijol, aguacate.", kcal: 590, prot: 34, carb: 60, grasa: 24, carne: true },
    { nombre: "Pan francés proteico con fruta", descripcion: "3 rebanadas con huevo/proteína, plátano y miel.", kcal: 540, prot: 30, carb: 70, grasa: 16 },
  ],
  snacks: [
    { nombre: "Sándwich chico de crema de cacahuate", descripcion: "1 rebanada doblada con 1.5 cda de crema de cacahuate.", kcal: 260, prot: 9, carb: 24, grasa: 15 },
    { nombre: "Licuado de chocolate con leche", descripcion: "Leche entera, cocoa, plátano.", kcal: 280, prot: 12, carb: 42, grasa: 8 },
    { nombre: "Mix de nuez y pasas", descripcion: "30 g de nuez + 20 g de pasas.", kcal: 260, prot: 5, carb: 22, grasa: 18 },
  ],
  swapVeg: {
    comidas: [
      { nombre: "Chiles rellenos de queso con arroz (2)", descripcion: "2 poblanos rellenos, caldillo, arroz rojo y tortillas.", kcal: 680, prot: 30, carb: 70, grasa: 30 },
      { nombre: "Pasta con crema de chipotle y panela", descripcion: "Pasta, crema ligera al chipotle, panela asada, elote.", kcal: 660, prot: 30, carb: 80, grasa: 24 },
      { nombre: "Burrito de frijol, arroz y queso (2)", descripcion: "2 tortillas de harina, frijol, arroz, queso, aguacate.", kcal: 700, prot: 26, carb: 88, grasa: 26 },
    ],
    cenas: [
      { nombre: "Molletes dobles con queso y frijol", descripcion: "2 mitades grandes gratinadas con pico de gallo.", kcal: 560, prot: 24, carb: 72, grasa: 18 },
      { nombre: "Bowl de quinoa, huevo y aguacate", descripcion: "Quinoa, 2 huevos, aguacate, garbanzo rostizado.", kcal: 580, prot: 26, carb: 58, grasa: 26 },
    ],
  },
  listaSuper: [
    { pasillo: "frutas y verduras", items: ["plátano", "aguacate", "jitomate", "ejotes", "papa", "cebolla", "poblano", "limón"] },
    { pasillo: "proteínas", items: ["bistec de res", "pollo (pierna/muslo y pechuga)", "salmón", "huevo (18)", "quesillo", "queso panela", "leche", "yogurt griego", "proteína en polvo"] },
    { pasillo: "abarrotes", items: ["tortilla de maíz y harina", "bolillo", "avena", "arroz", "pasta", "frijol", "crema de cacahuate", "nuez", "miel", "mole en pasta"] },
  ],
  nota: "Superávit conservador: las kcal extra van alrededor del entrenamiento; pesa tu progreso semanal, no diario.",
};

function plantillaPara(objetivo: PerfilFisico["objetivo"]): Plantilla {
  if (objetivo === "perder_grasa") return DEFICIT;
  if (objetivo === "ganar_musculo") return SUPERAVIT;
  return MANTENIMIENTO; // mantener + mejorar_resistencia
}

// Rotación determinista de pools (sin Math.random: misma semana ⇒ mismo plan).
function pick(pool: Plato[], i: number, offset = 0): Plato {
  return pool[(i + offset) % pool.length];
}

function conTipo(p: Plato, tipo: TipoComida): Comida {
  return { tipo, nombre: p.nombre, descripcion: p.descripcion, kcal: p.kcal, prot: p.prot, carb: p.carb, grasa: p.grasa };
}

// ── v2 · pool efectivo por tipo: restricciones (veg) + VETOS fuera +
//    favoritos primero. En modo dúo los favoritos NO reordenan (la sincronía
//    de platillos entre los dos vale más que la preferencia individual). ──
function poolEfectivo(
  t: Plantilla,
  tipo: TipoComida,
  veg: boolean,
  vetos: string[],
  favoritos: string[],
): Plato[] {
  let pool: Plato[];
  if (tipo === "desayuno") pool = veg ? t.desayunos.filter((d) => !d.carne) : t.desayunos;
  else if (tipo === "comida") pool = veg ? t.swapVeg.comidas : t.comidas;
  else if (tipo === "cena")
    pool = veg ? [...t.cenas.filter((c) => !c.carne), ...t.swapVeg.cenas] : t.cenas;
  else pool = t.snacks;

  const sinVetos = pool.filter((p) => !vetos.includes(p.nombre));
  const base = sinVetos.length ? sinVetos : pool; // jamás un pool vacío
  if (!favoritos.length) return base;
  return [
    ...base.filter((p) => favoritos.includes(p.nombre)),
    ...base.filter((p) => !favoritos.includes(p.nombre)),
  ];
}

// Escala la dosis (plan de dúo: mismos platillos, kcal de cada quien). La
// descripción declara la porción — el sample no inventa gramajes nuevos.
export function escalaComida(c: Comida, factor: number): Comida {
  if (Math.abs(factor - 1) <= 0.07) return c;
  return {
    ...c,
    kcal: Math.round(c.kcal * factor),
    prot: Math.round(c.prot * factor),
    carb: Math.round(c.carb * factor),
    grasa: Math.round(c.grasa * factor),
    descripcion: `${c.descripcion} · porción ×${factor.toFixed(2)}`,
  };
}

// Candidatos de reemplazo para la palomita de "no me gustó" (swap automático):
// mismo tipo, mismas restricciones, sin vetos ni los platillos ya en el día.
export function candidatosSwap(
  objetivo: PerfilFisico["objetivo"],
  tipo: TipoComida,
  restricciones: Restriccion[],
  vetos: string[],
  excluir: string[],
): Comida[] {
  const t = plantillaPara(objetivo);
  const veg = restricciones.includes("vegetariano") || restricciones.includes("vegano");
  return poolEfectivo(t, tipo, veg, vetos, [])
    .filter((p) => !excluir.includes(p.nombre))
    .map((p) => conTipo(p, tipo));
}

export function buildSamplePlan(
  fisico: PerfilFisico,
  nutricion: NutritionProfile,
  duo: DuoNutricion = null,
): MealPlanContent {
  // Dúo con objetivos distintos ⇒ plantilla compromiso (mantenimiento): mismos
  // platillos para los dos; el rumbo calórico de cada quien vive en su dosis.
  const objetivosDistintos = duo && new Set(duo.objetivos).size > 1;
  const t = plantillaPara(objetivosDistintos ? "mantener" : fisico.objetivo);
  const m = macrosObjetivo(fisico); // SIEMPRE personal — la dosis es tuya

  const restricciones = duo ? duo.restricciones : nutricion.restricciones;
  const veg = restricciones.includes("vegetariano") || restricciones.includes("vegano");
  const vetos = duo
    ? Array.from(new Set([...duo.vetos, ...nutricion.vetos]))
    : nutricion.vetos;
  const favoritos = duo ? [] : nutricion.favoritos;
  const menus = Math.max(1, Math.min(duo ? duo.menusDistintos : nutricion.menus_distintos, 7));

  const desayunosPool = poolEfectivo(t, "desayuno", veg, vetos, favoritos);
  const comidasPool = poolEfectivo(t, "comida", veg, vetos, favoritos);
  const cenasPool = poolEfectivo(t, "cena", veg, vetos, favoritos);
  const snacksPool = poolEfectivo(t, "snack", veg, vetos, favoritos);

  // N menús distintos que ROTAN sobre la semana (pregunta del wizard)
  const diasBase: DiaPlan[] = DIAS.map((dia, i) => {
    const slot = i % menus;
    const comidas: Comida[] = [
      conTipo(pick(desayunosPool, slot), "desayuno"),
      conTipo(pick(comidasPool, slot), "comida"),
      conTipo(pick(cenasPool, slot, 1), "cena"),
    ];
    if (nutricion.comidas_por_dia >= 4) comidas.push(conTipo(pick(snacksPool, slot), "snack"));
    return { dia, comidas };
  });

  // Dosis: factor de porción personal contra el día promedio de la plantilla.
  const kcalDiaProm =
    diasBase.reduce((s, d) => s + d.comidas.reduce((x, c) => x + c.kcal, 0), 0) /
    diasBase.length;
  const factor =
    Math.round(Math.min(1.35, Math.max(0.75, m.kcal / Math.max(1, kcalDiaProm))) * 100) / 100;
  const dias = diasBase.map((d) => ({
    dia: d.dia,
    comidas: d.comidas.map((c) => escalaComida(c, factor)),
  }));

  return {
    kcal_objetivo: m.kcal,
    macros: { prot: m.prot, carb: m.carb, grasa: m.grasa },
    dias,
    lista_super: t.listaSuper,
    nota: t.nota,
    factor_porcion: factor,
    duo: !!duo,
  };
}
