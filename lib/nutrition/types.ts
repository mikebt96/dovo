// Tipos del meal plan (F5). UNA sola forma para sample y para IA: la UI no distingue
// la fuente salvo por el badge "plan base" (source='sample').

export type TipoComida = "desayuno" | "comida" | "cena" | "snack";

export type Comida = {
  tipo: TipoComida;
  nombre: string;
  descripcion: string;
  kcal: number;
  prot: number; // g
  carb: number; // g
  grasa: number; // g
  // v2: cómo cocinarlo, en pasos cortos (recetario sample / IA con key).
  // Opcional: los planes guardados antes de v2 no lo traen.
  preparacion?: string[];
};

export type DiaPlan = {
  dia: string; // lunes…domingo (clave i18n-neutral en es; la UI traduce con su propio mapa)
  comidas: Comida[];
};

export type PasilloSuper = {
  pasillo: string;
  items: string[];
};

export type MealPlanContent = {
  kcal_objetivo: number;
  macros: { prot: number; carb: number; grasa: number }; // g/día objetivo
  dias: DiaPlan[]; // 7, lunes→domingo
  lista_super: PasilloSuper[];
  nota?: string;
  // v2 · plan de dúo: mismos platillos, dosis de cada quien
  factor_porcion?: number; // escala de porciones vs la plantilla base (1 = tal cual)
  duo?: boolean; // generado con los insumos compartidos del trato
};

export type MealPlanRow = {
  id: string;
  week_start: string; // ISO date (lunes)
  source: "sample" | "ai";
  plan: MealPlanContent;
};

export type Restriccion =
  | "vegetariano"
  | "vegano"
  | "sin_gluten"
  | "sin_lactosa"
  | "sin_cerdo"
  | "sin_mariscos";

export const RESTRICCIONES: Restriccion[] = [
  "vegetariano",
  "vegano",
  "sin_gluten",
  "sin_lactosa",
  "sin_cerdo",
  "sin_mariscos",
];

export type NutritionProfile = {
  restricciones: Restriccion[];
  presupuesto: "bajo" | "medio" | "alto";
  comidas_por_dia: number;
  preferencias: string | null;
  // v2 (spec del founder): lo que preguntaría un nutriólogo + memoria de gustos
  menus_distintos: number; // 3 | 5 | 7 — menús distintos que rotan en la semana
  vetos: string[]; // "no me gustó" — no vuelve a aparecer jamás
  favoritos: string[]; // "me gustó" — el motor los prefiere
};

// Insumos compartidos del dúo (core.duo_nutricion): con esto AMBOS generan los
// MISMOS platillos — el determinismo sincroniza sin coordinación.
export type DuoNutricion = {
  objetivos: PerfilFisico["objetivo"][];
  restricciones: Restriccion[];
  vetos: string[];
  menusDistintos: number;
} | null;

export type PerfilFisico = {
  peso_kg: number;
  altura_cm: number;
  edad: number;
  genero: string;
  nivel_actividad: "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";
  objetivo: "perder_grasa" | "ganar_musculo" | "mantener" | "mejorar_resistencia";
  bmr_calculado: number | null;
};
